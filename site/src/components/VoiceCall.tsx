'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Voice conversation with the ElevenLabs agent, started from the chat widget.
 *
 * The browser never sees the ElevenLabs API key. It asks our backend for a
 * per-conversation token (`/api/voice/session`), which expires on its own, and
 * hands that to the SDK.
 *
 * The SDK is imported dynamically for two reasons: it is large, and it touches
 * browser-only APIs, which would break the static export's prerender step.
 */

type CallState = 'idle' | 'connecting' | 'live' | 'error';

interface Conversation {
  endSession: () => Promise<void>;
}

export default function VoiceCall({ onClose }: { onClose: () => void }) {
  /**
   * `null` while we are still asking the backend. The button stays hidden
   * until we know a call is actually possible — offering to call and then
   * failing is worse than not offering.
   */
  const [available, setAvailable] = useState<boolean | null>(null);
  const [state, setState] = useState<CallState>('idle');
  const [error, setError] = useState('');
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const conversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .voiceAvailable()
      .then((ok) => !cancelled && setAvailable(ok))
      .catch(() => !cancelled && setAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // A call must not outlive the widget: if the panel closes or the user
  // navigates away mid-conversation, the session (and the billing) has to stop.
  useEffect(() => {
    return () => {
      conversationRef.current?.endSession().catch(() => undefined);
    };
  }, []);

  async function startCall() {
    setState('connecting');
    setError('');
    try {
      const { conversationToken } = await api.voiceSession();
      const { Conversation: ConversationSdk } = await import('@elevenlabs/client');

      const conversation = await ConversationSdk.startSession({
        conversationToken,
        connectionType: 'webrtc',
        onConnect: () => setState('live'),
        onDisconnect: () => {
          setState('idle');
          setAgentSpeaking(false);
          conversationRef.current = null;
        },
        onModeChange: ({ mode }) => setAgentSpeaking(mode === 'speaking'),
        onError: (message) => {
          setError(message);
          setState('error');
        },
      });

      conversationRef.current = conversation as unknown as Conversation;
    } catch (err) {
      // Overwhelmingly this is the browser refusing microphone access.
      const denied = err instanceof Error && /permission|denied|NotAllowed/i.test(err.message);
      setError(
        denied
          ? 'Bez přístupu k mikrofonu hovor nespustíme. Povolte mikrofon v prohlížeči a zkuste to znovu.'
          : 'Hovor se nepodařilo spojit. Zkuste to prosím znovu, nebo nám zavolejte.',
      );
      setState('error');
    }
  }

  async function endCall() {
    await conversationRef.current?.endSession().catch(() => undefined);
    conversationRef.current = null;
    setState('idle');
    setAgentSpeaking(false);
  }

  if (available !== true) return null;

  if (state === 'live' || state === 'connecting') {
    return (
      <div className="voice-bar voice-bar-live">
        <span className={`voice-dot ${agentSpeaking ? 'speaking' : ''}`} aria-hidden="true" />
        <span className="voice-status">
          {state === 'connecting' ? 'Spojuji…' : agentSpeaking ? 'Asistentka mluví' : 'Posloucháme vás'}
        </span>
        <button className="voice-end" onClick={endCall}>
          Ukončit hovor
        </button>
      </div>
    );
  }

  return (
    <div className="voice-bar">
      <button className="voice-start" onClick={startCall}>
        Zavolat asistentce
      </button>
      {state === 'error' && <span className="voice-error">{error}</span>}
      <button className="voice-dismiss" onClick={onClose} aria-label="Skrýt">
        ✕
      </button>
    </div>
  );
}
