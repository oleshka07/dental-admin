'use client';

import { useBooking } from './BookingContext';

export default function BookButton({
  children,
  acute,
  variant = 'primary',
}: {
  children: React.ReactNode;
  acute?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const { openBooking } = useBooking();
  return (
    <button className={`btn btn-${variant}`} onClick={() => openBooking({ acute })}>
      {children}
    </button>
  );
}
