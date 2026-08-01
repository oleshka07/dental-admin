'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useBooking } from './BookingContext';
import VoiceCall from './VoiceCall';

function pageKeyFor(pathname: string): 'home' | 'services' | 'about' | 'founder' | 'contact' {
  if (pathname.startsWith('/sluzby-a-ceny')) return 'services';
  if (pathname.startsWith('/o-zakladateli')) return 'founder';
  if (pathname.startsWith('/o-nas')) return 'about';
  if (pathname.startsWith('/kontakty')) return 'contact';
  return 'home';
}

const GREETINGS: Record<string, string> = {
  home: 'Dobrý den! Jsem asistent kliniky Galactic Dent. Mohu vám pomoct s objednáním nebo zodpovědět dotaz.',
  services: 'Máte dotaz k nějakému výkonu, ceně nebo pojišťovně? Zeptejte se, ráda poradím.',
  about: 'Chcete se dozvědět víc o týmu nebo přístupu naší kliniky?',
  founder: 'Zajímá vás zkušenost MDDr. Galaktionova? Zeptejte se.',
  contact: 'Potřebujete adresu, ordinační hodiny, nebo pomoct s cestou ze Sokolova?',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: 'open_booking' | 'open_acute_booking';
}

export default function AssistantWidget() {
  const pathname = usePathname() ?? '/';
  const page = pageKeyFor(pathname);
  const { openBooking } = useBooking();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(true);
  const sessionId = useRef<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  if (!sessionId.current) {
    sessionId.current = `web-${Math.random().toString(36).slice(2)}`;
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: GREETINGS[page] }]);
    }
  }, [open, page, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const nextMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const history = nextMessages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.askAssistant({ sessionId: sessionId.current, message: text, page, language: 'CZ', history });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, action: res.action }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Omlouváme se, teď se nemohu spojit. Zkuste to prosím znovu nebo nám zavolejte.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button className="chat-bubble" onClick={() => setOpen((v) => !v)} aria-label="Otevřít asistenta">
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">Asistent Galactic Dent</div>
          {voiceVisible && <VoiceCall onClose={() => setVoiceVisible(false)} />}
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message chat-${m.role}`}>
                <p>{m.content}</p>
                {m.action && (
                  <button
                    className="chat-action-button"
                    onClick={() => {
                      openBooking({ acute: m.action === 'open_acute_booking' });
                      setOpen(false);
                    }}
                  >
                    {m.action === 'open_acute_booking' ? 'Otevřít akutní objednání' : 'Otevřít rezervaci'}
                  </button>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Napište dotaz…"
              disabled={sending}
            />
            <button onClick={send} disabled={sending || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
