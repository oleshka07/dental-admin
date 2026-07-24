'use client';

import { useBooking } from './BookingContext';
import { CalendarIcon, AlertIcon } from './icons';

/**
 * Bottom-RIGHT, stacked above the chat bubble. These used to sit bottom-left,
 * where at common desktop widths they floated over the left edge of the content
 * column and covered section headings and footer text.
 */
export default function FloatingActions() {
  const { openBooking } = useBooking();

  return (
    <div className="floating-actions">
      <button className="floating-acute" onClick={() => openBooking({ acute: true })}>
        <AlertIcon size={18} />
        <span>Akutní bolest</span>
      </button>
      <button className="floating-book" onClick={() => openBooking()}>
        <CalendarIcon size={18} />
        <span>Objednat se</span>
      </button>
    </div>
  );
}
