const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

/**
 * Any non-ok response throws by default. Tolerating one has to be opt-in via
 * `expectedErrors`, because a tolerated `{ error: string }` body is returned
 * to the caller *typed as the success shape* — if that caller doesn't actually
 * branch on it, the error object flows onward pretending to be real data and
 * crashes whatever renders it next (this is what turned an invalid session
 * into a blank white screen: `patient.fullName.split(...)` on `{error:'…'}`).
 */
async function request<T>(path: string, init?: RequestInit & { expectedErrors?: number[] }): Promise<T> {
  const { expectedErrors, ...fetchInit } = init ?? {};
  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchInit,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok && !expectedErrors?.includes(res.status)) {
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
    // 409 = the slot was taken between loading it and booking it; 400 = the
    // patient record vanished. SlotsScreen branches on `'error' in result`.
    request<Appointment | { error: string }>('/api/telegram-app/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
      expectedErrors: [400, 409],
    }),

  createUrgentRequest: (data: { initData: string; visitTypeId: string; triageAnswers?: Record<string, unknown> }) =>
    request<Appointment>('/api/telegram-app/urgent', { method: 'POST', body: JSON.stringify(data) }),

  cancelAppointment: (id: string, initData: string) =>
    request<Appointment>(`/api/telegram-app/appointments/${id}/cancel`, {
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
