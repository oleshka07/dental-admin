import { Appointment, VisitType } from './lib/api';

export type Screen =
  | { name: 'register' }
  | { name: 'home' }
  | { name: 'chooseVisitType' }
  | { name: 'acuteSymptom' }
  | { name: 'slots'; visitType: VisitType; acute: boolean; symptom?: string }
  | { name: 'myAppointments' }
  | { name: 'confirmation'; kind: 'booked' | 'escalated'; appointment?: Appointment }
  | { name: 'assistant' };
