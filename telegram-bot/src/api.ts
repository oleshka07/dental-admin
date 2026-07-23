const BASE_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
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

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  telegramId: string | null;
  language: 'CZ' | 'UA' | 'EN';
}

export interface AvailableSlot {
  date: string;
  timeStart: string;
  timeEnd: string;
  remainingCapacity: number;
}

export interface Appointment {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  status: string;
  visitType?: VisitType;
}

export const api = {
  listVisitTypes: () => request<VisitType[]>('/api/visit-types'),

  findOrCreatePatient: (data: { fullName: string; phone: string; telegramId: string; language: string }) =>
    request<Patient>('/api/patients/find-or-create', { method: 'POST', body: JSON.stringify(data) }),

  getPatientByTelegramId: (telegramId: string) =>
    request<Patient | null>(`/api/patients?telegramId=${encodeURIComponent(telegramId)}`),

  getAvailability: (visitTypeId: string, from: string, to: string) =>
    request<AvailableSlot[]>(
      `/api/availability?visitTypeId=${visitTypeId}&from=${from}&to=${to}`,
    ),

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

  createUrgentRequest: (data: {
    patientId: string;
    visitTypeId: string;
    sourceChannel: string;
    triageAnswers?: Record<string, unknown>;
  }) => request<Appointment>('/api/appointments/urgent', { method: 'POST', body: JSON.stringify(data) }),

  updateAppointmentStatus: (id: string, status: string) =>
    request<Appointment>(`/api/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  listMyAppointments: (patientId: string) =>
    request<Appointment[]>(`/api/appointments?patientId=${patientId}`),
};
