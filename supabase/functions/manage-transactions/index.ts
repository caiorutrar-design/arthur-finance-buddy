import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getEnvOrThrow(key: string): string {
  const val = Deno.env.get(key);
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      getEnvOrThrow("SUPABASE_URL"),
      getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY")
    );

    const url = new URL(req.url);
    const body = req.method !== "GET" ? await req.json() : null;

    // GET: List transactions for a user
    if (req.method === "GET") {
      const phoneNumber = url.searchParams.get("phone");
      if (!phoneNumber) {
        return new Response(JSON.stringify({ error: "phone parameter required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: user } = await supabase
        .from("whatsapp_users")
        .select("id")
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*, financial_categories(name, type)")
        .eq("whatsapp_user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(JSON.stringify({ transactions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: Create a transaction
    if (req.method === "POST") {
      const { phone_number, amount, description, type, category_name, transaction_date } = body;

      if (!phone_number || !amount || !type) {
        return new Response(
          JSON.stringify({ error: "phone_number, amount, and type are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user
      const { data: user } = await supabase
        .from("whatsapp_users")
        .select("id, organization_id")
        .eq("phone_number", phone_number)
        .maybeSingle();

      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find category if provided
      let categoryId = null;
      if (category_name) {
        const { data: cat } = await supabase
          .from("financial_categories")
          .select("id")
          .eq("name", category_name)
          .eq("organization_id", user.organization_id)
          .maybeSingle();
        categoryId = cat?.id || null;
      }

      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          whatsapp_user_id: user.id,
          organization_id: user.organization_id,
          amount,
          description: description || null,
          type,
          category_id: categoryId,
          transaction_date: transaction_date || new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ transaction }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error("Transaction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
