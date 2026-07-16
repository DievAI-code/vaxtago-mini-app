'use client';

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function AssistantConsole() {
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('ru');
  const [isPending, setIsPending] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant'; content: string}>>([
    {
      role: 'assistant',
      content:
        'Я AI-ассистент VaxtaGo. Помогу с документами, поиском работы, проверкой работодателя и безопасностью.',
    },
  ]);

  const languageOptions = [
    { code: 'ru', label: 'Русский' },
    { code: 'uz', label: "O'zbekcha" },
    { code: 'tg', label: 'Тоҷикӣ' },
    { code: 'ky', label: 'Кыргызча' },
    { code: 'en', label: 'English' },
  ];

  const placeholder = usePlaceholder(language);

  async function sendMessage(contentOverride?: string) {
    const content = (contentOverride ?? message).trim();
    if (!content || isPending) return;

    setIsPending(true);
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: content, language },
      });

      if (error) throw error;

      const { reply } = data as { reply?: string };
      if (!reply) throw new Error('No reply from assistant');

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Ошибка связи с ассистентом. Проверьте подключение и повторите запрос.',
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendMessage();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            AI Assistant
          </p>
          <h3 className="text-lg font-semibold">
            Голос, текст, документы, перевод
          </h3>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-white/35 bg-white/60 px-3 py-2 text-sm text-[var(--fg)] outline-none backdrop-blur"
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/30 bg-[var(--bg-elevated)]/70 p-3">
        {messages.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
              item.role === 'assistant'
                ? 'bg-cyan-500/15 text-[var(--fg)]'
                : 'ml-auto bg-blue-600 text-white'
            }`}
          >
            {item.content}
          </div>
        ))}

        {isPending && (
          <div className="space-y-2 py-1">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-300/50 dark:bg-slate-700/40" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-300/50 dark:bg-slate-700/40" />
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="flex-1 rounded-xl border border-white/40 bg-white/55 px-3 py-2 text-sm text-[var(--fg)] outline-none backdrop-blur placeholder:text-[var(--muted)] resize-none"
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[linear-gradient(140deg,#2563EB,#06B6D4)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? '...' : 'Отправить'}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          'Проверь работодателя по ИНН',
          'Найди работу сварщика',
          'Объясни условия договора',
          'Где ближайшее МВД?',
        ].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            className="rounded-xl border border-white/30 bg-white/40 px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--fg)]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}

function usePlaceholder(lang: string): string {
  switch (lang) {
    case 'uz':
      return 'Savolingizni yozing...';
    case 'tg':
      return 'Саволи худро нависед...';
    case 'ky':
      return 'Сурооңузду жазыңыз...';
    case 'en':
      return 'Type your question...';
    default:
      return 'Введите ваш вопрос...';
  }
}