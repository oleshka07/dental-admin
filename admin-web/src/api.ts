const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${await res.text()}`);
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
  active: boolean;
}

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  language: string;
  email?: string | null;
  telegramId?: string | null;
  insuranceProvider?: string;
  notes?: string | null;
  noShowCount?: number;
  createdAt?: string;
  /** Set by the demo seed. Real patients never have it. */
  isDemo?: boolean;
}

export interface Appointment {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  status: string;
  isAcute: boolean;
  sourceChannel: string;
  patient: Patient;
  visitType: VisitType;
}

export interface SlotTemplate {
  id: string;
  weekday: number;
  timeStart: string;
  timeEnd: string;
  slotLengthMinutes: number;
  capacityPerSlot: number;
  visitTypes: { visitType: VisitType }[];
}

export interface AvailableSlot {
  date: string;
  timeStart: string;
  timeEnd: string;
  remainingCapacity: number;
  visitTypeIds: string[];
}

export const api = {
  listVisitTypes: () => request<VisitType[]>('/api/visit-types'),
  createVisitType: (data: Partial<VisitType>) =>
    request<VisitType>('/api/visit-types', { method: 'POST', body: JSON.stringify(data) }),

  listSlotTemplates: () => request<SlotTemplate[]>('/api/slot-templates'),
  createSlotTemplate: (data: {
    weekday: number;
    timeStart: string;
    timeEnd: string;
    slotLengthMinutes: number;
    capacityPerSlot: number;
    visitTypeIds: string[];
  }) => request<SlotTemplate>('/api/slot-templates', { method: 'POST', body: JSON.stringify(data) }),
  deleteSlotTemplate: (id: string) => request<void>(`/api/slot-templates/${id}`, { method: 'DELETE' }),

  listSlotExceptions: (from: string, to: string) =>
    request<any[]>(`/api/slot-exceptions?from=${from}&to=${to}`),
  closeSlot: (data: { date: string; timeStart: string; timeEnd: string; reason?: string }) =>
    request('/api/slot-exceptions', { method: 'POST', body: JSON.stringify({ ...data, type: 'CLOSED' }) }),
  deleteSlotException: (id: string) => request<void>(`/api/slot-exceptions/${id}`, { method: 'DELETE' }),

  getAvailability: (from: string, to: string, visitTypeId?: string) =>
    request<AvailableSlot[]>(
      `/api/availability?from=${from}&to=${to}${visitTypeId ? `&visitTypeId=${visitTypeId}` : ''}`,
    ),

  listPatients: (search?: string) =>
    request<Patient[]>(`/api/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPatient: (id: string) =>
    request<Patient & { appointments: Appointment[] }>(`/api/patients/${id}`),

  listAppointments: (params: Record<string, string>) =>
    request<Appointment[]>(`/api/appointments?${new URLSearchParams(params).toString()}`),
  updateAppointmentStatus: (id: string, status: string) =>
    request<Appointment>(`/api/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
