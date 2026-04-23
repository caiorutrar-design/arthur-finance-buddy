Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, message, conversation_id } = await req.json();

    if (!user_id || !message) {
      return new Response(JSON.stringify({ error: 'user_id e message são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Dynamic imports for Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Helper to call Supabase Admin
    const supabaseAdmin = async (table: string, options: Record<string, unknown> = {}) => {
      const url = `${supabaseUrl}/rest/v1/${table}`;
      const headers: Record<string, string> = {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };
      if (options.method === 'POST' || options.method === 'PATCH') {
        headers['Prefer'] = 'return=representation';
      }
      const res = await fetch(url + (options.query ? `?${options.query}` : ''), {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      return res.json();
    };

    // 1. Fetch user context: transactions, goals, budgets
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [transactions, goals, budgets] = await Promise.all([
      supabaseAdmin('transactions', {
        query: `user_id=eq.${user_id}&transaction_date=gte.${startOfMonth}&transaction_date=lte.${endOfMonth}&select=*,category:financial_categories(name,icon,color)`,
      }),
      supabaseAdmin('goals', { query: `user_id=eq.${user_id}&status=eq.active&select=*` }),
      supabaseAdmin('budgets', { query: `user_id=eq.${user_id}&select=*,category:financial_categories(name,icon,color)` }),
    ]);

    const txList = Array.isArray(transactions) ? transactions : (transactions.data || []);
    const goalsList = Array.isArray(goals) ? goals : (goals.data || []);
    const budgetsList = Array.isArray(budgets) ? budgets : (budgets.data || []);

    // Calculate financial summary
    const totalIncome = txList.filter((t: Record<string, unknown>) => t.type === 'income').reduce((s: number, t: Record<string, unknown>) => s + Number(t.amount), 0);
    const totalExpense = txList.filter((t: Record<string, unknown>) => t.type === 'expense').reduce((s: number, t: Record<string, unknown>) => s + Number(t.amount), 0);
    const balance = totalIncome - totalExpense;

    // Category spending
    const categorySpending: Record<string, number> = {};
    txList.filter((t: Record<string, unknown>) => t.type === 'expense').forEach((t: Record<string, unknown>) => {
      const catName = (t.category as Record<string, unknown> || {})?.name || 'Sem categoria';
      categorySpending[catName] = (categorySpending[catName] || 0) + Number(t.amount);
    });

    // Build context string
    const contextParts: string[] = [];
    contextParts.push(`## Resumo Financeiro (mês atual)`);
    contextParts.push(`- Receitas: R$ ${totalIncome.toFixed(2)}`);
    contextParts.push(`- Despesas: R$ ${totalExpense.toFixed(2)}`);
    contextParts.push(`- Saldo: R$ ${balance.toFixed(2)}`);

    if (Object.keys(categorySpending).length > 0) {
      contextParts.push(`\n## Gastos por Categoria`);
      for (const [cat, amount] of Object.entries(categorySpending)) {
        const budget = budgetsList.find((b: Record<string, unknown>) => ((b.category as Record<string, unknown>) || {})?.name === cat);
        const limit = budget ? Number((budget as Record<string, unknown>).amount_limit) : null;
        const pct = limit ? ((amount / limit) * 100).toFixed(0) : null;
        contextParts.push(`- ${cat}: R$ ${amount.toFixed(2)}${pct ? ` (${pct}% do orçamento de R$ ${limit?.toFixed(2)})` : ''}`);
      }
    }

    if (goalsList.length > 0) {
      contextParts.push(`\n## Metas Ativas`);
      goalsList.forEach((g: Record<string, unknown>) => {
        const target = Number(g.target_amount);
        const current = Number(g.current_amount);
        const pct = ((current / target) * 100).toFixed(1);
        contextParts.push(`- ${g.name}: R$ ${current.toFixed(2)} / R$ ${target.toFixed(2)} (${pct}%)`);
      });
    }

    if (budgetsList.length > 0) {
      contextParts.push(`\n## Orçamentos`);
      budgetsList.forEach((b: Record<string, unknown>) => {
        const catName = ((b.category as Record<string, unknown>) || {})?.name || '?';
        contextParts.push(`- ${catName}: limite R$ ${Number(b.amount_limit).toFixed(2)} (${b.period_type})`);
      });
    }

    const context = contextParts.join('\n');

    // 2. Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      // create new conversation
      const newConv = await supabaseAdmin('chat_conversations', {
        method: 'POST',
        body: { user_id, title: message.slice(0, 50) },
      });
      convId = newConv?.id || newConv?.[0]?.id;
    }

    // Update conversation updated_at
    if (convId) {
      const d = new Date().toISOString();
      await supabaseAdmin('chat_conversations', {
        method: 'PATCH',
        body: { updated_at: d },
        query: `id=eq.${convId}`,
      });
    }

    // 3. Save user message
    if (convId) {
      await supabaseAdmin('chat_messages', {
        method: 'POST',
        body: { conversation_id: convId, user_id, role: 'user', content: message },
      });
    }

    // 4. Build prompt with system + context + history
    const systemPrompt = `Você é um assistente financeiro pessoal chamado "Arthur". Você ajuda o usuário a gerenciar suas finanças, analisar gastos, criar metas e dar conselhos práticos. Use dados reais do usuário quando disponíveis. Seja amigável, direto e útil.

${context}`;

    // 5. Try to call LLM
    let response = '';
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (openAIKey) {
      try {
        const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            max_tokens: 1024,
            temperature: 0.7,
          }),
        });
        const data = await openAIRes.json();
        response = data.choices?.[0]?.message?.content || '';
      } catch (_e) {
        response = '';
      }
    }

    if (!response && anthropicKey) {
      try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            messages: [{ role: 'user', content: `${systemPrompt}\n\n${message}` }],
            max_tokens: 1024,
          }),
        });
        const data = await anthropicRes.json();
        response = data.content?.[0]?.text || '';
      } catch (_e) {
        response = '';
      }
    }

    if (!response) {
      // Mock mode fallback
      response = getMockResponse(message, { balance, totalExpense, totalIncome, categorySpending, goals: goalsList });
    }

    // 6. Save assistant message
    if (convId) {
      await supabaseAdmin('chat_messages', {
        method: 'POST',
        body: { conversation_id: convId, user_id, role: 'assistant', content: response },
      });
    }

    return new Response(JSON.stringify({
      response,
      conversation_id: convId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getMockResponse(message: string, ctx: {
  balance: number;
  totalExpense: number;
  totalIncome: number;
  categorySpending: Record<string, number>;
  goals: Record<string, unknown>[];
}): string {
  const lower = message.toLowerCase();
  const { balance, totalExpense, totalIncome, categorySpending, goals } = ctx;

  if (lower.includes('gasto') || lower.includes('extrato') || lower.includes('categoria')) {
    let msg = `📊 **Resumo do Mês**\n\n`;
    msg += `- Receitas: R$ ${totalIncome.toFixed(2)}\n`;
    msg += `- Despesas: R$ ${totalExpense.toFixed(2)}\n`;
    msg += `- Saldo: R$ ${balance.toFixed(2)}\n\n`;
    if (Object.keys(categorySpending).length > 0) {
      msg += `**Por categoria:**\n`;
      for (const [cat, amt] of Object.entries(categorySpending)) {
        msg += `- ${cat}: R$ ${amt.toFixed(2)}\n`;
      }
    }
    return msg;
  }

  if (lower.includes('meta') || lower.includes('poupar') || lower.includes('viagem') || lower.includes('europa')) {
    if (goals.length > 0) {
      let msg = `🎯 **Suas Metas**\n\n`;
      goals.forEach((g: Record<string, unknown>) => {
        const pct = ((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(1);
        msg += `- ${g.name}: ${pct}% (R$ ${Number(g.current_amount).toFixed(2)} / R$ ${Number(g.target_amount).toFixed(2)})\n`;
      });
      return msg;
    }
    return `Você ainda não tem metas cadastradas. Que tal criar uma? 😊`;
  }

  if (lower.includes('reserva') || lower.includes('emergência')) {
    return `🛡️ **Reserva de Emergência**\n\nUma boa reserva deve cobrir de 3 a 6 meses dos seus gastos fixos.\n\nCom gastos de R$ ${totalExpense.toFixed(2)}/mês, recomendo poupar entre **R$ ${(totalExpense * 3).toFixed(2)}** e **R$ ${(totalExpense * 6).toFixed(2)}**.\n\nQuer que eu te ajude a criar um plano?`;
  }

  return `Entendi! Me conta mais sobre o que você precisa. Posso ajudar com análise de gastos, metas de economia, alertas de orçamento e muito mais! 💬`;
}
