'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface BookingOptions {
  acute?: boolean;
}

interface BookingContextValue {
  isOpen: boolean;
  acute: boolean;
  openBooking: (opts?: BookingOptions) => void;
  closeBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [acute, setAcute] = useState(false);

  const openBooking = useCallback((opts?: BookingOptions) => {
    setAcute(Boolean(opts?.acute));
    setIsOpen(true);
  }, []);
  const closeBooking = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, acute, openBooking, closeBooking }), [isOpen, acute, openBooking, closeBooking]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
