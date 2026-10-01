export type AppointmentStatus = 'pendente' | 'confirmado' | 'concluido' | 'cancelado';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: 'tradicional' | 'alongamento' | 'spa' | 'arte';
  durationMinutes: number;
  price: number;
  popular?: boolean;
  active: boolean;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceIds: string[];
  serviceNames: string[];
  totalPrice: number;
  totalDuration: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface StudioSettings {
  studioName: string;
  ownerName: string;
  phone: string;
  instagram: string;
  address: string;
  neighborhood: string;
  city: string;
  adminPassword: string;
  openTime: string; // e.g. "08:00"
  closeTime: string; // e.g. "19:00"
  intervalMinutes: number; // e.g. 30 or 60
  workingDays: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  lunchBreakStart?: string; // e.g. "12:00"
  lunchBreakEnd?: string; // e.g. "13:00"
  depositRequired: boolean;
  depositPercentage?: number;
  pixKey?: string;
}

export interface BlockedSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm or undefined for entire day
  reason: string;
}
