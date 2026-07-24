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

/* ---- Feature / content icons ----
   These replace the emoji that used to sit in headings and card titles. Emoji
   render differently on every platform and the ZWJ sequence in 👩‍⚕️ was already
   breaking apart into two glyphs in Chromium. */

export function ShieldIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.2 5 6v5.4c0 4.2 2.9 7.6 7 8.9 4.1-1.3 7-4.7 7-8.9V6l-7-2.8Z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </svg>
  );
}

export function HeartHandIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8.6c1-1.9 4.6-2 5.6.4.9 2.2-1.4 4.4-5.6 7-4.2-2.6-6.5-4.8-5.6-7 1-2.4 4.6-2.3 5.6-.4Z" />
      <path d="M3.5 14.5v4.2M20.5 14.5v4.2" />
    </svg>
  );
}

export function BoltIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.2 2.8 5.6 13.2h5.1l-.9 8 7.6-10.4h-5.1l.9-8Z" />
    </svg>
  );
}

export function TeamIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8.5" r="3.1" />
      <path d="M3.5 19.5c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" />
      <path d="M16.2 6.2a3 3 0 0 1 0 5.9M17.6 14.9c1.9.5 3.4 1.9 3.4 4.1" />
    </svg>
  );
}

export function PhoneIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.2 3.8h3l1.4 3.6-2 1.4a11.4 11.4 0 0 0 5.6 5.6l1.4-2 3.6 1.4v3a1.8 1.8 0 0 1-2 1.8C10.6 18.1 5.9 13.4 4.4 5.8a1.8 1.8 0 0 1 1.8-2Z" />
    </svg>
  );
}

export function ClockIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3.1 1.9" />
    </svg>
  );
}

export function AlertIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.2 21 19.4H3L12 4.2Z" />
      <path d="M12 10v3.6M12 16.6h.01" />
    </svg>
  );
}

export function CalendarIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.4" />
      <path d="M3.6 10h16.8M8.4 3.4v3.4M15.6 3.4v3.4" />
    </svg>
  );
}
