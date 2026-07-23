import { useEffect, useRef, useState } from 'react';
import { applyTelegramTheme, getWebApp, TelegramUser } from './webapp';

export function useTelegramWebApp() {
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
    applyTelegramTheme(webApp);
    setUser(webApp.initDataUnsafe.user ?? null);
  }, []);

  return { webApp: getWebApp(), user };
}

/** Binds the screen's primary action to Telegram's native bottom MainButton. */
export function useMainButton(opts: { text: string; onClick: () => void; visible?: boolean; enabled?: boolean }) {
  const { text, onClick, visible = true, enabled = true } = opts;
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;
    const handler = () => onClickRef.current();
    webApp.MainButton.setText(text);
    webApp.MainButton.onClick(handler);
    if (visible) webApp.MainButton.show();
    else webApp.MainButton.hide();
    if (enabled) webApp.MainButton.enable();
    else webApp.MainButton.disable();
    return () => {
      webApp.MainButton.offClick(handler);
      webApp.MainButton.hide();
    };
  }, [text, visible, enabled]);
}

/** Binds the screen's "back" action to Telegram's native top-left BackButton. */
export function useBackButton(opts: { visible?: boolean; onClick: () => void }) {
  const { visible = true, onClick } = opts;
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;
    const handler = () => onClickRef.current();
    webApp.BackButton.onClick(handler);
    if (visible) webApp.BackButton.show();
    else webApp.BackButton.hide();
    return () => {
      webApp.BackButton.offClick(handler);
      webApp.BackButton.hide();
    };
  }, [visible]);
}
