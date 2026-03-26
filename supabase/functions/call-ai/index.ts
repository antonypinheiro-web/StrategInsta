import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')!;
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-04-17';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGemini(system: string, user: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: { temperature: 0.75 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'Gemini error');
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text || text.trim().length < 50) throw new Error('Resposta Gemini insuficiente');
  return text;
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.75,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'OpenAI error');
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text || text.trim().length < 50) throw new Error('Resposta OpenAI insuficiente');
  return text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Usuário inválido');

    // Verificar quota no servidor
    const { data: plan } = await supabase
      .from('user_plans')
      .select('plan_type, strategies_used, period_start')
      .eq('user_id', user.id)
      .single();

    const limits: Record<string, number> = { free: 2, individual: 15, professional: 60, agency: 250 };
    const limit = limits[plan?.plan_type ?? 'free'] ?? 2;

    // Reset mensal server-side
    if (plan?.period_start) {
      const monthsElapsed = (Date.now() - new Date(plan.period_start).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsElapsed >= 1 && plan.plan_type !== 'free') {
        await supabase.from('user_plans').update({ strategies_used: 0, period_start: new Date().toISOString() }).eq('user_id', user.id);
        plan.strategies_used = 0;
      }
    }

    if ((plan?.strategies_used ?? 0) >= limit) {
      return new Response(JSON.stringify({ error: 'Limite de estratégias atingido', code: 'QUOTA_EXCEEDED' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { systemPrompt, userPrompt } = await req.json();
    if (!systemPrompt || !userPrompt) throw new Error('systemPrompt e userPrompt são obrigatórios');

    // Tentar Gemini, fallback OpenAI
    let text: string;
    try {
      text = await callGemini(systemPrompt, userPrompt);
    } catch (geminiErr) {
      console.warn('[call-ai] Gemini falhou:', (geminiErr as Error).message);
      text = await callOpenAI(systemPrompt, userPrompt);
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[call-ai] Erro:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
