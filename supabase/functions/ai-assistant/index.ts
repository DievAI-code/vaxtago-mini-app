/// <reference path="../deno-env.d.ts" />

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createAIRequest } from '../_shared/ai-router.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_HISTORY_MESSAGES = 20;

function detectLanguage(text: string, telegramLanguageCode?: string): string {
  if (telegramLanguageCode) {
    const code = telegramLanguageCode.toLowerCase();
    if (code.startsWith('ru') || code === 'ru-ru') return 'ru';
    if (code.startsWith('uz') || code === 'uz-uz' || code === 'uz-cyrl' || code === 'uz-latn') return 'uz';
    if (code.startsWith('tg') || code === 'tg-tj' || code === 'tg-cyrl') return 'tg';
    if (code.startsWith('ky') || code === 'ky-kg' || code === 'ky-cyrl') return 'ky';
    if (code.startsWith('en') || code === 'en-us' || code === 'en-gb') return 'en';
  }

  const low = text.toLowerCase();
  const uzbekWords = ['salom', 'ish', 'yordam', 'shartnoma', 'tashkilot', 'ishchi'];
  const tajikWords = ['салом', 'кор', 'ярдам', 'шартнома', 'корфармо'];
  const kyrgyzWords = ['салам', 'иш', 'жардам', 'келишим', 'работо'];
  const englishWords = ['hello', 'hi', 'job', 'contract', 'help', 'police', 'migration', 'employer'];
  const russianWords = ['привет', 'работ', 'договор', 'помощ', 'полиц', 'мвд', 'работодатель'];

  if (uzbekWords.some(w => low.includes(w))) return 'uz';
  if (tajikWords.some(w => low.includes(w))) return 'tg';
  if (kyrgyzWords.some(w => low.includes(w))) return 'ky';
  if (englishWords.some(w => low.includes(w))) return 'en';
  if (russianWords.some(w => low.includes(w))) return 'ru';

  if (/[а-яё]/u.test(text)) return 'ru';
  return 'ru';
}

function fallbackReply(message: string, language: string = 'ru'): string {
  const low = message.toLowerCase();
  const greetings: Record<string, string> = {
    ru: 'Вот что я рекомендую:',
    uz: 'Mana tavsiyam:',
    tg: 'Ин тавсияи ман аст:',
    ky: 'Сунушуму төмөнкүдөй:',
    en: 'Here is my recommendation:',
  };
  const intro = greetings[language] ?? greetings['ru'];

  if (low === '/start') {
    return '👋 Добро пожаловать в VaxtaGo Bot. Я помогу с работой, документами, проверкой работодателя, переводом и безопасностью.';
  }
  if (low === '/help') {
    return 'Команды: /start, /help, /jobs, /profile, /settings, /translate, /documents, /verify, /address, /ai.';
  }
  if (low.includes('работ') || low.includes('vacan') || low.includes('иш')) {
    return `${intro} проверьте AI-анализ вакансии: реальный доход, риск мошенничества и рейтинг работодателя.`;
  }
  if (low.includes('договор') || low.includes('contract') || low.includes('шарт') || low.includes('ҳуҷҷат')) {
    return `${intro} загрузите фото/PDF договора — я выделю штрафы, скрытые удержания и права сотрудника.`;
  }
  if (low.includes('мвд') || low.includes('полиц') || low.includes('gov')) {
    return `${intro} ближайшие МВД отображаются в навигаторе VaxtaGO. Возьмите паспорт, миграционную карту и регистрацию.`;
  }
  if (low.includes('sos') || low.includes('опас') || low.includes('help')) {
    return `${intro} нажмите кнопку SOS — платформа отправит координаты и уведомит доверенные контакты.`;
  }
  return `${intro} я поддерживаю текст, голос, фото и PDF. Могу проверить работодателя (ИНН/ОГРН), объяснить законы, перевести документы и составить roadmap.`;
}

async function fetchConversationHistory(supabase: any, userId: string): Promise<Array<{role: string, content: string}>> {
  try {
    const { data, error } = await supabase
      .from('assistant_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(MAX_HISTORY_MESSAGES);

    if (error) {
      console.error('❌ Failed to fetch conversation history:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data
      .filter((msg: any) => msg.role && msg.content && (msg.role === 'user' || msg.role === 'assistant'))
      .map((msg: any) => ({ role: msg.role, content: msg.content }));
  } catch (error) {
    console.error('❌ Error fetching conversation history (non-fatal):', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let userId: string | null = null;
  if (token !== serviceRoleKey) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }
      userId = user.id;
    } catch (error) {
      console.error('❌ Auth error:', error);
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
  }

  let reqData;
  try {
    reqData = await req.json();
  } catch (error) {
    console.error('❌ Invalid JSON in AI request:', error);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { user_id, message, language_code } = reqData;
  if (!message || typeof message !== 'string') {
    console.error('❌ Missing or invalid message');
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const effectiveUserId = user_id ?? userId;
  if (!effectiveUserId) {
    console.error('❌ No user ID available');
    return new Response(JSON.stringify({ error: 'User ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const lang = detectLanguage(message, language_code);

  console.log('🔑 AI Router key exists:', !!Deno.env.get('OPENROUTER_API_KEY'));
  console.log('📨 AI request message:', message);
  console.log('🌐 Detected language:', lang);

  let reply: string;

  const history = await fetchConversationHistory(supabase, effectiveUserId);
  const contextText = [
    'Ты — AI-помощник VaxtaGo для мигрантов в России.',
    ...history.map(h => `${h.role}: ${h.content}`),
    `user: ${message}`,
  ].join('\n');

  try {
    const aiResult = await createAIRequest({
      type: 'chat',
      text: contextText,
      language: lang,
    });
    reply = aiResult.text;
  } catch (error) {
    console.error('⚠️ AI Router failed — using fallback:', error);
    reply = fallbackReply(message, lang);
  }

  try {
    await supabase
      .from('assistant_messages')
      .insert([
        { user_id: effectiveUserId, role: 'user', content: message },
        { user_id: effectiveUserId, role: 'assistant', content: reply },
      ]);
  } catch (error) {
    console.error('❌ Failed to store message (non-fatal):', error);
  }

  return new Response(
    JSON.stringify({ reply }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
});

export default serve;