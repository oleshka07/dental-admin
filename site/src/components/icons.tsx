interface IconProps {
  filled?: boolean;
  size?: number;
}

export function HomeIcon({ filled, size = 24 }: IconProps) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.2 2.6a1.25 1.25 0 0 1 1.6 0l8 6.75c.38.32.2.94-.3.94H19V19a1.5 1.5 0 0 1-1.5 1.5H15A1.5 1.5 0 0 1 13.5 19v-4.25a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 0-1.5 1.5V19A1.5 1.5 0 0 1 8 20.5H6.5A1.5 1.5 0 0 1 5 19v-8.7H3.5c-.5 0-.68-.62-.3-.94l8-6.76Z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v5h3a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

export function ServicesIcon({ filled, size = 24 }: IconProps) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3.5" y="4" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="4" width="7" height="7" rx="1.6" />
        <rect x="3.5" y="13" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="13" width="7" height="7" rx="1.6" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3.5" y="4" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="4" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13" width="7" height="7" rx="1.6" />
    </svg>
  );
}

export function PersonIcon({ filled, size = 24 }: IconProps) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="7.5" r="3.75" />
        <path d="M4.5 20.2c.6-3.9 3.6-6.2 7.5-6.2s6.9 2.3 7.5 6.2c.1.7-.4 1.3-1.1 1.3H5.6c-.7 0-1.2-.6-1.1-1.3Z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="7.5" r="3.75" />
      <path d="M4.5 20.2c.6-3.9 3.6-6.2 7.5-6.2s6.9 2.3 7.5 6.2" strokeLinecap="round" />
    </svg>
  );
}

export function MapPinIcon({ filled, size = 24 }: IconProps) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5c-4.1 0-7.4 3.3-7.4 7.4 0 5.5 6.4 11 7 11.5.2.2.6.2.8 0 .6-.5 7-6 7-11.5 0-4.1-3.3-7.4-7.4-7.4Zm0 10.1a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 2.5c-4.1 0-7.4 3.3-7.4 7.4 0 5.5 6.4 11 7 11.5.2.2.6.2.8 0 .6-.5 7-6 7-11.5 0-4.1-3.3-7.4-7.4-7.4Z" />
      <circle cx="12" cy="9.9" r="2.6" />
    </svg>
  );
}

export function CalendarPlusIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
      <path d="M3.5 9.5h17" />
      <path d="M8 2.5v4M16 2.5v4" />
      <path d="M12 13v5M9.5 15.5h5" />
    </svg>
  );
}

export function ChatIcon({ filled, size = 24 }: IconProps) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.9 3 3 6.4 3 10.6c0 2.4 1.3 4.6 3.4 6-.1.9-.5 2.2-1.4 3.5-.2.3.1.7.4.6 1.8-.5 3.2-1.3 4-1.9.8.2 1.7.3 2.6.3 5.1 0 9-3.4 9-7.5S17.1 3 12 3Z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3C6.9 3 3 6.4 3 10.6c0 2.4 1.3 4.6 3.4 6-.1.9-.5 2.2-1.4 3.5 1.8-.5 3.2-1.3 4-1.9.8.2 1.7.3 2.6.3 5.1 0 9-3.4 9-7.5S17.1 3 12 3Z" />
    </svg>
  );
}
