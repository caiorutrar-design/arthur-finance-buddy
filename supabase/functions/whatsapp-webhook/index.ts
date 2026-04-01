import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Helpers ───────────────────────────────────────────────

function getEnvOrThrow(key: string): string {
  const val = Deno.env.get(key);
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

function createSupabaseAdmin() {
  return createClient(
    getEnvOrThrow("SUPABASE_URL"),
    getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY")
  );
}

// ─── Repository layer ──────────────────────────────────────

async function findOrCreateUser(
  supabase: ReturnType<typeof createClient>,
  phoneNumber: string,
  displayName: string | null,
  organizationId: string
) {
  // Try to find existing user
  const { data: existing } = await supabase
    .from("whatsapp_users")
    .select("*")
    .eq("phone_number", phoneNumber)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing) return existing;

  // Create new user
  const { data: newUser, error } = await supabase
    .from("whatsapp_users")
    .insert({
      phone_number: phoneNumber,
      display_name: displayName,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return newUser;
}

async function saveMessage(
  supabase: ReturnType<typeof createClient>,
  params: {
    whatsapp_user_id: string;
    organization_id: string;
    content: string;
    role: "user" | "assistant" | "system";
    direction: "inbound" | "outbound";
    whatsapp_message_id?: string;
  }
) {
  const { error } = await supabase.from("messages").insert(params);
  if (error) throw new Error(`Failed to save message: ${error.message}`);
}

async function getRecentMessages(
  supabase: ReturnType<typeof createClient>,
  whatsappUserId: string,
  limit = 20
) {
  const { data, error } = await supabase
    .from("messages")
    .select("content, role, created_at")
    .eq("whatsapp_user_id", whatsappUserId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
  return data || [];
}

async function getUserTransactionsSummary(
  supabase: ReturnType<typeof createClient>,
  whatsappUserId: string
) {
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type, description, transaction_date, financial_categories(name)")
    .eq("whatsapp_user_id", whatsappUserId)
    .order("transaction_date", { ascending: false })
    .limit(30);

  if (error) return null;
  return data;
}

async function getDefaultOrganization(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "default")
    .single();
  return data?.id;
}

// ─── Service layer ─────────────────────────────────────────

async function callAI(
  messages: Array<{ role: string; content: string }>,
  financialContext: string
) {
  const LOVABLE_API_KEY = getEnvOrThrow("LOVABLE_API_KEY");

  const systemPrompt = `Você é o "Arthur", um consultor financeiro hiper-inteligente, pragmático e proativo.

DIRETRIZES:
- Análise de Gastos: Identifique padrões e compare com limites.
- Alertas Proativos: Avise quando próximo de 80% do limite.
- Estratégia de Metas: Calcule poupança necessária.
- Tom: Direto, amigável, conciso (estilo WhatsApp). Use negrito para valores e datas.
- Nunca invente números. Se dados não estiverem presentes, peça esclarecimentos.
- Priorize reserva de emergência antes de gastos supérfluos.

DADOS FINANCEIROS DO USUÁRIO:
${financialContext}`;

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI Gateway error:", response.status, errText);
    if (response.status === 429) return "Estou recebendo muitas mensagens agora. Tente novamente em alguns segundos! 😊";
    if (response.status === 402) return "Serviço de IA temporariamente indisponível. Tente mais tarde.";
    return "Desculpe, não consegui processar sua mensagem agora. Tente novamente.";
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Não consegui gerar uma resposta.";
}

async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string) {
  const WHATSAPP_TOKEN = getEnvOrThrow("WHATSAPP_ACCESS_TOKEN");

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("WhatsApp API error:", response.status, errText);
    throw new Error(`WhatsApp send failed: ${response.status}`);
  }

  return response.json();
}

// ─── Controller layer ──────────────────────────────────────

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    // ── GET: Webhook verification (Meta Cloud API) ──
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "arthur-finance-verify";

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified");
        return new Response(challenge, { status: 200, headers: corsHeaders });
      }

      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // ── POST: Incoming messages ──
    if (req.method === "POST") {
      const body = await req.json();

      // Meta sends different event types; we only care about messages
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages || value.messages.length === 0) {
        // Acknowledge non-message events (status updates, etc.)
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createSupabaseAdmin();
      const orgId = await getDefaultOrganization(supabase);
      if (!orgId) throw new Error("Default organization not found");

      const phoneNumberId = value.metadata?.phone_number_id;
      const message = value.messages[0];
      const contact = value.contacts?.[0];

      const fromNumber = message.from;
      const messageText = message.text?.body || "";
      const waMessageId = message.id;

      if (!messageText) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Message from ${fromNumber}: ${messageText}`);

      // 1. Find or create user
      const user = await findOrCreateUser(
        supabase,
        fromNumber,
        contact?.profile?.name || null,
        orgId
      );

      // 2. Save inbound message
      await saveMessage(supabase, {
        whatsapp_user_id: user.id,
        organization_id: orgId,
        content: messageText,
        role: "user",
        direction: "inbound",
        whatsapp_message_id: waMessageId,
      });

      // 3. Get conversation history + financial data
      const recentMessages = await getRecentMessages(supabase, user.id);
      const transactions = await getUserTransactionsSummary(supabase, user.id);

      let financialContext = "Nenhuma transação registrada ainda.";
      if (transactions && transactions.length > 0) {
        const totalExpenses = transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalIncome = transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        financialContext = `Resumo (últimas 30 transações):
- Total gastos: R$ ${totalExpenses.toFixed(2)}
- Total receitas: R$ ${totalIncome.toFixed(2)}
- Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2)}
Transações recentes:
${transactions
  .slice(0, 10)
  .map((t) => `  ${t.transaction_date} | ${t.type} | R$ ${Number(t.amount).toFixed(2)} | ${t.description || "sem descrição"}`)
  .join("\n")}`;
      }

      // 4. Call AI
      const aiResponse = await callAI(recentMessages, financialContext);

      // 5. Save outbound message
      await saveMessage(supabase, {
        whatsapp_user_id: user.id,
        organization_id: orgId,
        content: aiResponse,
        role: "assistant",
        direction: "outbound",
      });

      // 6. Send response via WhatsApp
      if (phoneNumberId) {
        await sendWhatsAppMessage(phoneNumberId, fromNumber, aiResponse);
      }

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to Meta to avoid retries on our errors
    return new Response(JSON.stringify({ status: "error", message: String(error) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
