import { Appointment, BlockedSlot, StudioSettings } from '../types';

export const getTodayDateString = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';

  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
};

export const formatDateFull = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const generateWhatsAppLink = (
  phone: string,
  message: string
): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  // Default to Brazil country code 55 if not present
  const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
};

export const generateAvailableTimeSlots = (
  dateString: string,
  totalDurationMinutes: number,
  settings: StudioSettings,
  existingAppointments: Appointment[],
  blockedSlots: BlockedSlot[]
): { time: string; available: boolean; reason?: string }[] => {
  if (!dateString) return [];

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay(); // 0 is Sunday

  // Check if studio works on this day
  if (!settings.workingDays.includes(dayOfWeek)) {
    return [];
  }

  // Check if entire day is blocked
  const dayIsBlocked = blockedSlots.some(
    (b) => b.date === dateString && (!b.time || b.time === 'all_day')
  );
  if (dayIsBlocked) {
    return [];
  }

  // Parse start and end time
  const [openHour, openMin] = settings.openTime.split(':').map(Number);
  const [closeHour, closeMin] = settings.closeTime.split(':').map(Number);
  const startMinutes = openHour * 60 + openMin;
  const endMinutes = closeHour * 60 + closeMin;

  // Lunch break
  let lunchStartMin = -1;
  let lunchEndMin = -1;
  if (settings.lunchBreakStart && settings.lunchBreakEnd) {
    const [lsh, lsm] = settings.lunchBreakStart.split(':').map(Number);
    const [leh, lem] = settings.lunchBreakEnd.split(':').map(Number);
    lunchStartMin = lsh * 60 + lsm;
    lunchEndMin = leh * 60 + lem;
  }

  // Get active appointments on this day
  const dayAppointments = existingAppointments.filter(
    (apt) => apt.date === dateString && apt.status !== 'cancelado'
  );

  // Specific blocked times
  const blockedTimes = blockedSlots
    .filter((b) => b.date === dateString && b.time && b.time !== 'all_day')
    .map((b) => b.time as string);

  // Check if chosen date is today to disable past hours
  const now = new Date();
  const isToday =
    now.getFullYear() === year &&
    now.getMonth() === month - 1 &&
    now.getDate() === day;
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes();

  const slots: { time: string; available: boolean; reason?: string }[] = [];
  const interval = settings.intervalMinutes || 30;

  for (let m = startMinutes; m + totalDurationMinutes <= endMinutes; m += interval) {
    const slotHour = Math.floor(m / 60);
    const slotMin = m % 60;
    const timeFormatted = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
    const slotEnd = m + totalDurationMinutes;

    // Check if slot is in the past for today
    if (isToday && m <= currentMinutesToday + 15) {
      slots.push({ time: timeFormatted, available: false, reason: 'Horário já passou' });
      continue;
    }

    // Check lunch collision
    if (lunchStartMin !== -1 && lunchEndMin !== -1) {
      if (
        (m >= lunchStartMin && m < lunchEndMin) ||
        (slotEnd > lunchStartMin && slotEnd <= lunchEndMin) ||
        (m <= lunchStartMin && slotEnd >= lunchEndMin)
      ) {
        slots.push({ time: timeFormatted, available: false, reason: 'Horário de almoço' });
        continue;
      }
    }

    // Check explicitly blocked time
    if (blockedTimes.includes(timeFormatted)) {
      slots.push({ time: timeFormatted, available: false, reason: 'Indisponível' });
      continue;
    }

    // Check appointment overlap
    const hasOverlap = dayAppointments.some((apt) => {
      const [ah, am] = apt.time.split(':').map(Number);
      const aptStart = ah * 60 + am;
      const aptEnd = aptStart + (apt.totalDuration || 60);

      // (StartA < EndB) and (EndA > StartB)
      return m < aptEnd && slotEnd > aptStart;
    });

    if (hasOverlap) {
      slots.push({ time: timeFormatted, available: false, reason: 'Já reservado' });
    } else {
      slots.push({ time: timeFormatted, available: true });
    }
  }

  return slots;
};
