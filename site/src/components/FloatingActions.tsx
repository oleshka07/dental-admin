'use client';

import { useBooking } from './BookingContext';

export default function FloatingActions() {
  const { openBooking } = useBooking();

  return (
    <div className="floating-actions">
      <button className="floating-book" onClick={() => openBooking()}>
        📅 Objednat se
      </button>
      <button className="floating-acute" onClick={() => openBooking({ acute: true })}>
        🔴 Akutní bolest
      </button>
    </div>
  );
}
