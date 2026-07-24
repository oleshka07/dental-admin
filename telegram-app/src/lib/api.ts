const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  // 400/403/409 are intentionally not thrown here — several call sites
  // (createAppointment, createUrgentRequest, cancelAppointment) expect an
  // `{ error: string }` body back for those and check `'error' in result`.
  // 401 (invalid Telegram session) is never consumed that way anywhere, so
  // it must always throw — otherwise the error body silently flows through
  // as if it were real data (e.g. a Patient missing `fullName`), crashing
  // whatever screen renders it next.
  if (!res.ok && res.status !== 400 && res.status !== 403 && res.status !== 409) {
    throw new Error(`API ${path} failed: ${res.status} ${await res.text().catch(() => '')}`);
  }
  return res.json() as Promise<T>;
}

export interface VisitType {
  id: string;
  name: string;
  durationMinutes: number;
  colorTag: string;
  isAcute: boolean;
}

export interface AvailableSlot {
  date: string;
  timeStart: string;
  timeEnd: string;
  remainingCapacity: number;
}

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  language: string;
}

export interface Appointment {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  status: string;
  isAcute: boolean;
  visitType?: VisitType;
}

export interface SessionResponse {
  user: { id: number; firstName: string; lastName: string | null };
  patient: Patient | null;
}

export interface AssistantResponse {
  reply: string;
  action?: 'open_booking' | 'open_acute_booking';
}

export const api = {
  listVisitTypes: () => request<VisitType[]>('/api/visit-types'),

  getAvailability: (visitTypeId: string, from: string, to: string) =>
    request<AvailableSlot[]>(`/api/availability?visitTypeId=${visitTypeId}&from=${from}&to=${to}`),

  session: (initData: string) =>
    request<SessionResponse>('/api/telegram-app/session', { method: 'POST', body: JSON.stringify({ initData }) }),

  register: (data: { initData: string; fullName: string; phone: string; language: string }) =>
    request<Patient>('/api/telegram-app/register', { method: 'POST', body: JSON.stringify(data) }),

  myAppointments: (initData: string) =>
    request<Appointment[]>(`/api/telegram-app/my-appointments?initData=${encodeURIComponent(initData)}`),

  createAppointment: (data: {
    initData: string;
    visitTypeId: string;
    date: string;
    timeStart: string;
    timeEnd: string;
    isAcute?: boolean;
    triageAnswers?: Record<string, unknown>;
  }) =>
    request<Appointment | { error: string }>('/api/telegram-app/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createUrgentRequest: (data: { initData: string; visitTypeId: string; triageAnswers?: Record<string, unknown> }) =>
    request<Appointment>('/api/telegram-app/urgent', { method: 'POST', body: JSON.stringify(data) }),

  cancelAppointment: (id: string, initData: string) =>
    request<Appointment | { error: string }>(`/api/telegram-app/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ initData }),
    }),

  askAssistant: (data: {
    sessionId: string;
    message: string;
    page: string;
    language: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  }) =>
    request<AssistantResponse>('/api/assistant/message', {
      method: 'POST',
      body: JSON.stringify({ ...data, channel: 'TELEGRAM' }),
    }),
};
