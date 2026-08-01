'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { PhoneIcon } from './icons';

/**
 * Voice conversation with the ElevenLabs agent.
 *
 * Sits as its own round button next to the chat bubble rather than inside the
 * chat panel: "call us" has to be reachable in one click, not two, and a phone
 * icon says what it does without being read.
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

export default function VoiceCall() {
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

  // A call must not outlive the page: if the visitor navigates away mid-call,
  // the session — and the billing — has to stop.
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
          ? 'Povolte prosím mikrofon a zkuste to znovu.'
          : 'Hovor se nepodařilo spojit. Zkuste to znovu, nebo nám zavolejte.',
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

  if (state === 'connecting' || state === 'live') {
    return (
      <div className="voice-live" role="status">
        <span className={`voice-dot ${agentSpeaking ? 'speaking' : ''}`} aria-hidden="true" />
        <span className="voice-status">
          {state === 'connecting' ? 'Spojuji…' : agentSpeaking ? 'Asistentka mluví' : 'Posloucháme vás'}
        </span>
        <button className="voice-end" onClick={endCall}>
          Zavěsit
        </button>
      </div>
    );
  }

  return (
    <>
      <button className="voice-bubble" onClick={startCall} aria-label="Zavolat asistentce">
        <PhoneIcon size={24} />
      </button>
      {state === 'error' && <div className="voice-error-toast">{error}</div>}
    </>
  );
}
