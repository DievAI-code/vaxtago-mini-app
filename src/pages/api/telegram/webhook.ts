import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TELEGRAM_API = 'https://api.telegram.org';

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  return token;
}

async function callTelegramApi<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const token = getBotToken();
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description ?? 'Telegram API request failed');
  }
  return data.result as T;
}

export async function POST(request: Request) {
  try {
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (secretToken && headerSecret !== secretToken) {
      return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let update: {
      update_id: number;
      message?: {
        message_id: number;
        text?: string;
        chat: { id: number; type: string };
        from?: { id: number; language_code?: string; username?: string; first_name?: string };
      };
    };

    try {
      update = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid update payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim();

    if (!chatId || !text) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const languageCode = update.message?.from?.language_code ?? "ru";

    const detectLanguage = (code?: string): string => {
      const lang = code?.toLowerCase();
      if (lang === 'uz' || lang === 'uz-cyrl' || lang === 'uz-latn') return 'uz';
      if (lang === 'tg' || lang === 'tg-cyrl') return 'tg';
      if (lang === 'ky' || lang === 'ky-cyrl') return 'ky';
      if (lang === 'en' || lang === 'en-us' || lang === 'en-gb') return 'en';
      return 'ru';
    };

    const language = detectLanguage(languageCode);

    return new Response(JSON.stringify({ ok: true, delivered: true, language }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Failed to store message:', error);
    return new Response(
      JSON.stringify({ ok: true, delivered: false, error: error instanceof Error ? error.message : 'unknown error' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}