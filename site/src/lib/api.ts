const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) return undefined as T;
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
  status: string;
}

export interface AssistantResponse {
  reply: string;
  action?: 'open_booking' | 'open_acute_booking';
}

export const api = {
  listVisitTypes: () => request<VisitType[]>('/api/visit-types'),

  getAvailability: (visitTypeId: string, from: string, to: string) =>
    request<AvailableSlot[]>(`/api/availability?visitTypeId=${visitTypeId}&from=${from}&to=${to}`),

  findOrCreatePatient: (data: { fullName: string; phone: string; language: string }) =>
    request<Patient>('/api/patients/find-or-create', { method: 'POST', body: JSON.stringify(data) }),

  setConsent: (patientId: string) =>
    request(`/api/patients/${patientId}/consent`, {
      method: 'PATCH',
      body: JSON.stringify({ dataProcessing: true }),
    }),

  createAppointment: (data: {
    patientId: string;
    visitTypeId: string;
    date: string;
    timeStart: string;
    timeEnd: string;
    sourceChannel: string;
    isAcute?: boolean;
    triageAnswers?: Record<string, unknown>;
  }) => request<Appointment | { error: string }>('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),

  createUrgentRequest: (data: { patientId: string; visitTypeId: string; sourceChannel: string; triageAnswers?: Record<string, unknown> }) =>
    request<Appointment>('/api/appointments/urgent', { method: 'POST', body: JSON.stringify(data) }),

  askAssistant: (data: {
    sessionId: string;
    message: string;
    page: string;
    language: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  }) => request<AssistantResponse>('/api/assistant/message', { method: 'POST', body: JSON.stringify(data) }),
};
