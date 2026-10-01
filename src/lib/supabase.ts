import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Appointment, Service, StudioSettings, BlockedSlot } from '../types';
import { DEFAULT_SERVICES, DEFAULT_STUDIO_SETTINGS, DEFAULT_INITIAL_APPOINTMENTS } from './initialData';

// Storage keys
const STORAGE_KEYS = {
  APPOINTMENTS: 'bella_unhas_appointments_v1',
  SERVICES: 'bella_unhas_services_v1',
  SETTINGS: 'bella_unhas_settings_v1',
  BLOCKED_SLOTS: 'bella_unhas_blocked_slots_v1',
  CUSTOM_SUPABASE_URL: 'bella_custom_supabase_url',
  CUSTOM_SUPABASE_KEY: 'bella_custom_supabase_key',
};

// Check for Supabase credentials from ENV or local storage
const getSupabaseCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CUSTOM_SUPABASE_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CUSTOM_SUPABASE_KEY) : null;

  const url = customUrl || envUrl || '';
  const key = customKey || envKey || '';

  const isValid = Boolean(url && key && url.startsWith('http') && key.length > 10);
  return { url, key, isValid };
};

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isValid } = getSupabaseCredentials();
  if (!isValid) return null;

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
      });
    } catch {
      supabaseClient = null;
    }
  }
  return supabaseClient;
};

export const resetSupabaseClient = (url?: string, key?: string) => {
  if (url && key) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SUPABASE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_SUPABASE_KEY);
  }
  supabaseClient = null;
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseCredentials().isValid;
};

// ==================== APPOINTMENTS ====================
export const getStoredAppointments = async (): Promise<Appointment[]> => {
  const client = getSupabaseClient();
  
  if (client) {
    try {
      const { data, error } = await client
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (!error && data && data.length > 0) {
        // Map Supabase columns to model
        const mapped: Appointment[] = data.map((item: any) => ({
          id: item.id,
          clientName: item.client_name || item.clientName,
          clientPhone: item.client_phone || item.clientPhone,
          clientEmail: item.client_email || item.clientEmail,
          serviceIds: item.service_ids || item.serviceIds || [],
          serviceNames: item.service_names || item.serviceNames || [],
          totalPrice: Number(item.total_price || item.totalPrice || 0),
          totalDuration: Number(item.total_duration || item.totalDuration || 60),
          date: item.date,
          time: item.time,
          notes: item.notes || '',
          status: item.status || 'pendente',
          createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          updatedAt: item.updated_at || item.updatedAt,
        }));
        
        // Cache to local storage as fallback
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // Gracefully fall back to local storage
    }
  }

  // Fallback to localStorage or default appointments
  const local = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }

  // Initial populate
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_INITIAL_APPOINTMENTS));
  return DEFAULT_INITIAL_APPOINTMENTS;
};

export const saveNewAppointment = async (appointment: Appointment): Promise<Appointment> => {
  // 1. Always save in localStorage immediately for fast responsive UI
  const existing = await getStoredAppointments();
  const updated = [appointment, ...existing.filter((a) => a.id !== appointment.id)];
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));

  // 2. Sync to Supabase if available
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('appointments').upsert({
        id: appointment.id,
        client_name: appointment.clientName,
        client_phone: appointment.clientPhone,
        client_email: appointment.clientEmail || null,
        service_ids: appointment.serviceIds,
        service_names: appointment.serviceNames,
        total_price: appointment.totalPrice,
        total_duration: appointment.totalDuration,
        date: appointment.date,
        time: appointment.time,
        notes: appointment.notes || '',
        status: appointment.status,
        created_at: appointment.createdAt,
      });
    } catch {
      // Quietly handled without crashing or bothering the user
    }
  }

  return appointment;
};

export const updateAppointmentStatusInStore = async (
  id: string,
  status: Appointment['status']
): Promise<void> => {
  const existing = await getStoredAppointments();
  const updated = existing.map((item) =>
    item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item
  );
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));

  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch {
      // silent
    }
  }
};

export const deleteAppointmentInStore = async (id: string): Promise<void> => {
  const existing = await getStoredAppointments();
  const updated = existing.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('appointments').delete().eq('id', id);
    } catch {
      // silent
    }
  }
};

// ==================== SERVICES ====================
export const getStoredServices = async (): Promise<Service[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('services').select('*').order('name');
      if (!error && data && data.length > 0) {
        const mapped: Service[] = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          category: s.category || 'tradicional',
          durationMinutes: Number(s.duration_minutes || s.durationMinutes || 45),
          price: Number(s.price || 0),
          popular: Boolean(s.popular),
          active: s.active !== false,
        }));
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // fallback
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.SERVICES);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }

  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
  return DEFAULT_SERVICES;
};

export const saveAllServices = async (services: Service[]): Promise<void> => {
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));

  const client = getSupabaseClient();
  if (client) {
    try {
      const payload = services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        duration_minutes: s.durationMinutes,
        price: s.price,
        popular: s.popular,
        active: s.active,
      }));
      await client.from('services').upsert(payload);
    } catch {
      // silent
    }
  }
};

// ==================== SETTINGS ====================
export const getStoredSettings = async (): Promise<StudioSettings> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('settings').select('*').limit(1).maybeSingle();
      if (!error && data) {
        const mapped: StudioSettings = {
          studioName: data.studio_name || DEFAULT_STUDIO_SETTINGS.studioName,
          ownerName: data.owner_name || DEFAULT_STUDIO_SETTINGS.ownerName,
          phone: data.phone || DEFAULT_STUDIO_SETTINGS.phone,
          instagram: data.instagram || DEFAULT_STUDIO_SETTINGS.instagram,
          address: data.address || DEFAULT_STUDIO_SETTINGS.address,
          neighborhood: data.neighborhood || DEFAULT_STUDIO_SETTINGS.neighborhood,
          city: data.city || DEFAULT_STUDIO_SETTINGS.city,
          adminPassword: data.admin_password || DEFAULT_STUDIO_SETTINGS.adminPassword,
          openTime: data.open_time || DEFAULT_STUDIO_SETTINGS.openTime,
          closeTime: data.close_time || DEFAULT_STUDIO_SETTINGS.closeTime,
          intervalMinutes: data.interval_minutes || DEFAULT_STUDIO_SETTINGS.intervalMinutes,
          workingDays: data.working_days || DEFAULT_STUDIO_SETTINGS.workingDays,
          lunchBreakStart: data.lunch_break_start || DEFAULT_STUDIO_SETTINGS.lunchBreakStart,
          lunchBreakEnd: data.lunch_break_end || DEFAULT_STUDIO_SETTINGS.lunchBreakEnd,
          depositRequired: data.deposit_required ?? DEFAULT_STUDIO_SETTINGS.depositRequired,
          depositPercentage: data.deposit_percentage ?? DEFAULT_STUDIO_SETTINGS.depositPercentage,
          pixKey: data.pix_key || DEFAULT_STUDIO_SETTINGS.pixKey,
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // fallback
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (local) {
    try {
      return { ...DEFAULT_STUDIO_SETTINGS, ...JSON.parse(local) };
    } catch {
      // ignore
    }
  }

  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_STUDIO_SETTINGS));
  return DEFAULT_STUDIO_SETTINGS;
};

export const saveStoredSettings = async (settings: StudioSettings): Promise<void> => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('settings').upsert({
        id: 'default_studio',
        studio_name: settings.studioName,
        owner_name: settings.ownerName,
        phone: settings.phone,
        instagram: settings.instagram,
        address: settings.address,
        neighborhood: settings.neighborhood,
        city: settings.city,
        admin_password: settings.adminPassword,
        open_time: settings.openTime,
        close_time: settings.closeTime,
        interval_minutes: settings.intervalMinutes,
        working_days: settings.workingDays,
        lunch_break_start: settings.lunchBreakStart,
        lunch_break_end: settings.lunchBreakEnd,
        deposit_required: settings.depositRequired,
        deposit_percentage: settings.depositPercentage,
        pix_key: settings.pixKey,
      });
    } catch {
      // silent
    }
  }
};

// ==================== BLOCKED SLOTS ====================
export const getStoredBlockedSlots = async (): Promise<BlockedSlot[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('blocked_slots').select('*');
      if (!error && data && data.length > 0) {
        const mapped: BlockedSlot[] = data.map((b: any) => ({
          id: b.id,
          date: b.date,
          time: b.time || undefined,
          reason: b.reason || 'Bloqueado',
        }));
        localStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // fallback
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.BLOCKED_SLOTS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }
  return [];
};

export const saveBlockedSlot = async (slot: BlockedSlot): Promise<void> => {
  const current = await getStoredBlockedSlots();
  const updated = [...current, slot];
  localStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(updated));

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('blocked_slots').insert({
        id: slot.id,
        date: slot.date,
        time: slot.time || null,
        reason: slot.reason,
      });
    } catch {
      // silent
    }
  }
};

export const deleteBlockedSlot = async (id: string): Promise<void> => {
  const current = await getStoredBlockedSlots();
  const updated = current.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(updated));

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('blocked_slots').delete().eq('id', id);
    } catch {
      // silent
    }
  }
};
