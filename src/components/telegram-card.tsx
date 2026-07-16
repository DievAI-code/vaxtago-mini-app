import { useEffect, useState } from 'react';

export function TelegramCard() {
  const [botUsername, setBotUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const username = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? '@VaxtaGO_bot';
    setBotUsername(username);
    setLoading(false);
  }, []);

  const normalizedBotUsername = botUsername.replace(/^@/, '');
  const botUrl = `https://t.me/${normalizedBotUsername}`;

  if (loading) {
    return (
      <div className="panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Telegram Bot
        </p>
        <h3 className="mt-1 text-lg font-semibold">VaxtaGo в Telegram</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Загрузка информации о боте...
        </p>
      </div>
    );
  }

  return (
    <article className="panel p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Telegram Bot
      </p>
      <h3 className="mt-1 text-lg font-semibold">VaxtaGo в Telegram</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Бот принимает команды /start, /help, /jobs, /docs, /mvd, /sos и отвечает
        тем же AI-движком, что в веб-дашборде.
      </p>

      <div className="mt-3 rounded-xl border border-white/30 bg-white/35 px-3 py-2 text-xs text-[var(--muted)]">
        Для активации webhook используйте API: <code className="font-semibold">POST /api/telegram/setup</code> с заголовком
        <code className="ml-1 font-semibold">x-admin-key</code>.
      </div>

      <a
        href={botUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex rounded-xl bg-[linear-gradient(140deg,#2563EB,#06B6D4)] px-3 py-2 text-sm font-semibold text-white"
      >
        Открыть @{normalizedBotUsername}
      </a>
    </article>
  );
}