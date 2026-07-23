export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser };
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | null {
  return typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null;
}

const THEME_DEFAULTS: Record<string, string> = {
  bg_color: '#f4f9fb',
  text_color: '#142433',
  hint_color: '#5b6b78',
  link_color: '#0d3a63',
  button_color: '#0d3a63',
  button_text_color: '#ffffff',
  secondary_bg_color: '#ffffff',
};

export function applyTelegramTheme(webApp: TelegramWebApp) {
  const root = document.documentElement;
  for (const key of Object.keys(THEME_DEFAULTS)) {
    const cssVar = `--tg-${key.replace(/_/g, '-')}`;
    root.style.setProperty(cssVar, webApp.themeParams[key] ?? THEME_DEFAULTS[key]);
  }
}
