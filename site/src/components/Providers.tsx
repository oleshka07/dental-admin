'use client';

import { BookingProvider } from './BookingContext';
import BookingWidget from './BookingWidget';
import AssistantWidget from './AssistantWidget';
import FloatingActions from './FloatingActions';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BookingProvider>
      {children}
      <FloatingActions />
      <BookingWidget />
      <AssistantWidget />
    </BookingProvider>
  );
}
