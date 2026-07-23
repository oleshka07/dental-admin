import { useRef, useState } from 'react';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantScreen({ language }: { language: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Dobrý den! Zeptejte se na cokoliv ohledně kliniky — adresu, ceny, pojišťovny nebo objednání.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const sessionId = useRef(`tg-${Math.random().toString(36).slice(2)}`);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setSending(true);
    try {
      const history = next.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.askAssistant({ sessionId: sessionId.current, message: text, page: 'home', language, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Omlouváme se, teď se nemohu spojit. Zkuste to prosím znovu.' }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <h2 className="screen-title">Zeptat se</h2>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className="tg-card"
            style={{
              maxWidth: '85%',
              marginLeft: m.role === 'user' ? 'auto' : 0,
              background: m.role === 'user' ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
              color: m.role === 'user' ? 'var(--tg-button-text)' : 'var(--tg-text)',
            }}
          >
            {m.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="tg-input"
          style={{ marginBottom: 0 }}
          placeholder="Napište dotaz…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          style={{
            background: 'var(--tg-button)',
            color: 'var(--tg-button-text)',
            border: 'none',
            borderRadius: 10,
            padding: '0 18px',
            fontSize: 18,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
