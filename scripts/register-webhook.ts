import { config } from 'dotenv';

config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_PROJECT_ID = 'watkanjjfsvqbhebchpk';
const WEBHOOK_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/telegram-webhook`;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required in .env file');
  process.exit(1);
}

if (!WEBHOOK_SECRET) {
  console.error('TELEGRAM_WEBHOOK_SECRET is required in .env file');
  process.exit(1);
}

async function registerWebhook() {
  const telegramApi = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  
  try {
    const response = await fetch(`${telegramApi}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ['message'],
        drop_pending_updates: false,
      }),
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook registered successfully!');
      console.log(`URL: ${WEBHOOK_URL}`);
      
      const infoResponse = await fetch(`${telegramApi}/getWebhookInfo`);
      const info = await infoResponse.json();
      console.log('Webhook info:', JSON.stringify(info.result, null, 2));
    } else {
      console.error('❌ Failed to register webhook:', data.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

registerWebhook();
