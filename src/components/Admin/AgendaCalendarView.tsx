import React, { useState, useMemo } from 'react';
import { Appointment, BlockedSlot, StudioSettings } from '../../types';
import {
  formatCurrency,
  formatDateFull,
  formatDuration,
  formatPhone,
  generateWhatsAppLink,
  getTodayDateString,
} from '../../lib/utils';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  MessageCircle,
  CheckCircle,
  Check,
  XCircle,
  Trash2,
  Coffee,
  Ban,
  CalendarDays,
  List,
  Layers,
  CalendarRange,
  Download,
  DollarSign,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface AgendaCalendarViewProps {
  appointments: Appointment[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  settings: StudioSettings;
  blockedSlots: BlockedSlot[];
  onStatusChange: (id: string, newStatus: Appointment['status']) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onOpenManualModal: (presetTime?: string) => void;
  onOpenBlockModal: () => void;
}

export const AgendaCalendarView: React.FC<AgendaCalendarViewProps> = ({
  appointments,
  selectedDate,
  onSelectDate,
  settings,
  blockedSlots,
  onStatusChange,
  onDeleteAppointment,
  onOpenManualModal,
  onOpenBlockModal,
}) => {
  // View mode: 'unified' (calendário unificado split view) | 'week' (semanal 7 colunas) | 'timeline' (grade diária) | 'month' (calendário mensal)
  const [viewMode, setViewMode] = useState<'unified' | 'week' | 'timeline' | 'month'>('unified');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIcs, setCopiedIcs] = useState<boolean>(false);

  // Month navigation for monthly view & unified mini-calendar
  const [viewYear, setViewYear] = useState<number>(() => {
    return parseInt(selectedDate.split('-')[0], 10);
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return parseInt(selectedDate.split('-')[1], 10) - 1; // 0-indexed
  });

  // Calculate days for the month grid
  const monthData = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = lastDay.getDate();

    const monthName = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const days: {
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      appointmentCount: number;
      pendingCount: number;
      confirmedCount: number;
      dayRevenue: number;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      const str = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      const dayApts = appointments.filter((a) => a.date === str && a.status !== 'cancelado');
      days.push({
        dateString: str,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: str === getTodayDateString(0),
        appointmentCount: dayApts.length,
        pendingCount: dayApts.filter((a) => a.status === 'pendente').length,
        confirmedCount: dayApts.filter((a) => a.status === 'confirmado' || a.status === 'concluido').length,
        dayRevenue: dayApts.reduce((sum, a) => sum + a.totalPrice, 0),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const str = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayApts = appointments.filter((a) => a.date === str && a.status !== 'cancelado');
      days.push({
        dateString: str,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: str === getTodayDateString(0),
        appointmentCount: dayApts.length,
        pendingCount: dayApts.filter((a) => a.status === 'pendente').length,
        confirmedCount: dayApts.filter((a) => a.status === 'confirmado' || a.status === 'concluido').length,
        dayRevenue: dayApts.reduce((sum, a) => sum + a.totalPrice, 0),
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      const str = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      const dayApts = appointments.filter((a) => a.date === str && a.status !== 'cancelado');
      days.push({
        dateString: str,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: str === getTodayDateString(0),
        appointmentCount: dayApts.length,
        pendingCount: dayApts.filter((a) => a.status === 'pendente').length,
        confirmedCount: dayApts.filter((a) => a.status === 'confirmado' || a.status === 'concluido').length,
        dayRevenue: dayApts.reduce((sum, a) => sum + a.totalPrice, 0),
      });
    }

    // Monthly totals for current month
    const currentMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const monthAppointments = appointments.filter(
      (a) => a.date.startsWith(currentMonthPrefix) && a.status !== 'cancelado'
    );
    const monthTotalRevenue = monthAppointments.reduce((sum, a) => sum + a.totalPrice, 0);

    return {
      monthName,
      days,
      monthTotalCount: monthAppointments.length,
      monthTotalRevenue,
    };
  }, [viewYear, viewMonth, appointments]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Change date offset
  const handleDateOffset = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const nextStr = `${yyyy}-${mm}-${dd}`;
    onSelectDate(nextStr);
    setViewYear(yyyy);
    setViewMonth(date.getMonth());
  };

  // Filtered appointments for selected date
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate)
      .filter((a) => {
        if (statusFilter !== 'todos' && a.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = a.clientName.toLowerCase().includes(q);
          const matchPhone = a.clientPhone.includes(q.replace(/\D/g, ''));
          const matchService = a.serviceNames.some((s) => s.toLowerCase().includes(q));
          return matchName || matchPhone || matchService;
        }
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, statusFilter, searchQuery]);

  // Timeline slots generation
  const timelineSlots = useMemo(() => {
    const slots: {
      time: string;
      appointment?: Appointment;
      isLunch?: boolean;
      isBlocked?: boolean;
      blockReason?: string;
    }[] = [];

    const [openHour, openMin] = settings.openTime.split(':').map(Number);
    const [closeHour, closeMin] = settings.closeTime.split(':').map(Number);
    const startMins = openHour * 60 + openMin;
    const endMins = closeHour * 60 + closeMin;
    const interval = settings.intervalMinutes || 30;

    let lunchStart = -1;
    let lunchEnd = -1;
    if (settings.lunchBreakStart && settings.lunchBreakEnd) {
      const [lsh, lsm] = settings.lunchBreakStart.split(':').map(Number);
      const [leh, lem] = settings.lunchBreakEnd.split(':').map(Number);
      lunchStart = lsh * 60 + lsm;
      lunchEnd = leh * 60 + lem;
    }

    const dayBlocks = blockedSlots.filter((b) => b.date === selectedDate);
    const allDayBlocked = dayBlocks.find((b) => !b.time || b.time === 'all_day');

    for (let m = startMins; m < endMins; m += interval) {
      const hour = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      const apt = appointments.find(
        (a) => a.date === selectedDate && a.time === timeStr && a.status !== 'cancelado'
      );

      const isLunch = lunchStart !== -1 && lunchEnd !== -1 && m >= lunchStart && m < lunchEnd;

      const specificBlock = dayBlocks.find((b) => b.time === timeStr);
      const isBlocked = Boolean(allDayBlocked || specificBlock);
      const blockReason = allDayBlocked?.reason || specificBlock?.reason;

      slots.push({
        time: timeStr,
        appointment: apt,
        isLunch,
        isBlocked,
        blockReason,
      });
    }

    return slots;
  }, [selectedDate, settings, appointments, blockedSlots]);

  // Unified Week Calculation (7 days from Monday to Sunday of the active date)
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    const currentDayOfWeek = current.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    const week: {
      dateString: string;
      dayNum: number;
      weekdayName: string;
      isToday: boolean;
      isSelected: boolean;
      apts: Appointment[];
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const dIter = new Date(monday);
      dIter.setDate(monday.getDate() + i);

      const yyyy = dIter.getFullYear();
      const mm = String(dIter.getMonth() + 1).padStart(2, '0');
      const dd = String(dIter.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const aptsOnDay = appointments
        .filter((a) => a.date === dateStr && a.status !== 'cancelado')
        .sort((a, b) => a.time.localeCompare(b.time));

      week.push({
        dateString: dateStr,
        dayNum: dIter.getDate(),
        weekdayName: dIter.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        isToday: dateStr === getTodayDateString(0),
        isSelected: dateStr === selectedDate,
        apts: aptsOnDay,
      });
    }

    return week;
  }, [selectedDate, appointments]);

  // Export Unified Calendar to .ics format
  const handleExportUnifiedIcs = () => {
    const events = appointments
      .filter((a) => a.status !== 'cancelado')
      .map((a) => {
        const [y, m, d] = a.date.split('-').map(Number);
        const [h, min] = a.time.split(':').map(Number);
        const start = new Date(y, m - 1, d, h, min);
        const end = new Date(start.getTime() + (a.totalDuration || 60) * 60000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatIcsDate = (date: Date) =>
          `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
            date.getUTCHours()
          )}${pad(date.getUTCMinutes())}00Z`;

        return `BEGIN:VEVENT
UID:${a.id}@bellaunhas
DTSTAMP:${formatIcsDate(new Date())}
DTSTART:${formatIcsDate(start)}
DTEND:${formatIcsDate(end)}
SUMMARY:${a.serviceNames.join(' + ')} - ${a.clientName}
DESCRIPTION:Cliente: ${a.clientName} (${a.clientPhone})\\nTotal: R$ ${a.totalPrice.toFixed(
          2
        )}${a.notes ? `\\nObs: ${a.notes}` : ''}
LOCATION:${settings.address}, ${settings.city}
STATUS:CONFIRMED
END:VEVENT`;
      })
      .join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bella Studio//Agendamentos Manicure//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Agenda ${settings.studioName}
${events}
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agenda-unificada-${settings.studioName.toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedIcs(true);
    setTimeout(() => setCopiedIcs(false), 3000);
  };

  const handleSendReminder = (apt: Appointment) => {
    const msg = `Olá, ${apt.clientName}! Tudo bem? ✨
Passando para confirmar seu horário hoje às *${apt.time}* no *${settings.studioName}* para:
💅 *${apt.serviceNames.join(' + ')}*
📍 *Local:* ${settings.address}, ${settings.neighborhood}

Podemos confirmar sua presença? Aguardo sua confirmação! ❤️`;
    const url = generateWhatsAppLink(apt.clientPhone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar with Unified Calendar Mode Selectors & Date Jump */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation & Date info */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => handleDateOffset(-1)}
              className="p-1.5 rounded-xl hover:bg-white text-stone-600 transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectDate(getTodayDateString(0))}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedDate === getTodayDateString(0)
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-white'
              }`}
            >
              Hoje
            </button>

            <button
              onClick={() => onSelectDate(getTodayDateString(1))}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedDate === getTodayDateString(1)
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-white'
              }`}
            >
              Amanhã
            </button>

            <button
              onClick={() => handleDateOffset(1)}
              className="p-1.5 rounded-xl hover:bg-white text-stone-600 transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Native Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onSelectDate(e.target.value);
                  const [y, m] = e.target.value.split('-').map(Number);
                  setViewYear(y);
                  setViewMonth(m - 1);
                }
              }}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <span className="text-xs font-semibold text-stone-700 hidden sm:inline">
            {formatDateFull(selectedDate)}
          </span>
        </div>

        {/* View Switchers: Calendário Unificado / Grade do Dia / Semanal / Mensal */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'unified'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Calendário Unificado
          </button>

          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'week'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            Semanal
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'timeline'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Grade Diária
          </button>

          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'month'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Mensal
          </button>
        </div>
      </div>

      {/* ================= OPTION 1: CALENDÁRIO UNIFICADO (SPLIT VIEW) ================= */}
      {viewMode === 'unified' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (5 cols): Mini-calendário Mensal Interativo + Resumo Mensal */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-rose-500" />
                  <h3 className="font-display text-base font-bold text-stone-900 capitalize">
                    {monthData.monthName}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] uppercase text-stone-400 mb-1">
                <span>D</span>
                <span>S</span>
                <span>T</span>
                <span>Q</span>
                <span>Q</span>
                <span>S</span>
                <span>S</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthData.days.map((day) => {
                  const isSelected = day.dateString === selectedDate;

                  return (
                    <button
                      key={day.dateString}
                      onClick={() => onSelectDate(day.dateString)}
                      className={`h-11 rounded-xl p-1 text-center flex flex-col items-center justify-between border transition-all ${
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs scale-105 z-10'
                          : day.isToday
                          ? 'border-amber-400 bg-amber-50/40 text-stone-900'
                          : day.isCurrentMonth
                          ? 'border-stone-100 bg-white text-stone-800 hover:border-rose-300 hover:bg-rose-50/20'
                          : 'border-transparent text-stone-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{day.dayNumber}</span>

                      {/* Small dots indicator */}
                      <div className="flex gap-0.5 justify-center mt-auto">
                        {day.appointmentCount > 0 && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : day.pendingCount > 0
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        )}
                        {day.appointmentCount > 2 && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white/80' : 'bg-rose-400'
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Monthly KPI Overview */}
              <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                    Atendimentos do Mês
                  </span>
                  <span className="text-base font-bold text-stone-900">
                    {monthData.monthTotalCount} clientes
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                    Previsto no Mês
                  </span>
                  <span className="text-base font-bold text-emerald-600">
                    {formatCurrency(monthData.monthTotalRevenue)}
                  </span>
                </div>
              </div>

              {/* Unified Export Button */}
              <div className="mt-3">
                <button
                  onClick={handleExportUnifiedIcs}
                  className="w-full py-2.5 px-3 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  {copiedIcs ? 'Agenda Baixada (.ics)!' : 'Sincronizar com Google Agenda / Celular'}
                </button>
                <p className="text-[10px] text-stone-400 text-center mt-1">
                  Exporta um arquivo .ics compatível com Google Calendar, Apple e Outlook.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Linha do Tempo e Atendimentos do Dia Selecionado */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-display text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-500" />
                    Agenda de {formatDateFull(selectedDate)}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {dayAppointments.length} agendamento(s) para este dia selecionado no calendário unificado.
                  </p>
                </div>

                <button
                  onClick={() => onOpenManualModal()}
                  className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Agendamento
                </button>
              </div>

              {/* Day's Timeline Slots */}
              <div className="divide-y divide-stone-100 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                {timelineSlots.map((slot) => {
                  if (slot.appointment) {
                    const apt = slot.appointment;
                    return (
                      <div
                        key={slot.time}
                        className={`py-3 px-3.5 rounded-2xl my-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border transition-all ${
                          apt.status === 'pendente'
                            ? 'bg-amber-50/50 border-amber-200'
                            : apt.status === 'confirmado'
                            ? 'bg-rose-50/40 border-rose-200'
                            : apt.status === 'concluido'
                            ? 'bg-blue-50/40 border-blue-200'
                            : 'bg-stone-50 border-stone-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-11 rounded-xl bg-stone-900 text-white flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-bold">{slot.time}</span>
                            <span className="text-[8px] text-stone-300">
                              {formatDuration(apt.totalDuration)}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                                {apt.clientName}
                              </span>
                              <span className="text-[10px] text-stone-500 bg-white/80 px-1.5 py-0.5 rounded border border-stone-200">
                                {formatPhone(apt.clientPhone)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  apt.status === 'pendente'
                                    ? 'bg-amber-100 text-amber-800'
                                    : apt.status === 'confirmado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : apt.status === 'concluido'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {apt.status}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-rose-700 mt-0.5">
                              {apt.serviceNames.join(' + ')} • {formatCurrency(apt.totalPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleSendReminder(apt)}
                            className="p-1 text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] font-semibold flex items-center gap-1"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            WhatsApp
                          </button>

                          {apt.status === 'pendente' && (
                            <button
                              onClick={() => onStatusChange(apt.id, 'confirmado')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Confirmar
                            </button>
                          )}

                          {apt.status === 'confirmado' && (
                            <button
                              onClick={() => onStatusChange(apt.id, 'concluido')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Concluir
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm('Excluir este agendamento?')) {
                                onDeleteAppointment(apt.id);
                              }
                            }}
                            className="p-1 text-stone-400 hover:text-red-500 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (slot.isLunch) {
                    return (
                      <div
                        key={slot.time}
                        className="py-2 px-3 my-1 bg-stone-100/60 rounded-xl flex items-center justify-between text-xs text-stone-500 border border-dashed border-stone-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-400 w-11">{slot.time}</span>
                          <span className="flex items-center gap-1.5 font-medium text-stone-600">
                            <Coffee className="w-3.5 h-3.5 text-amber-600" />
                            Almoço / Intervalo
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400">Pausa</span>
                      </div>
                    );
                  }

                  if (slot.isBlocked) {
                    return (
                      <div
                        key={slot.time}
                        className="py-2 px-3 my-1 bg-amber-50/40 rounded-xl flex items-center justify-between text-xs text-amber-800 border border-amber-200/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-700 w-11">{slot.time}</span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <Ban className="w-3.5 h-3.5 text-amber-600" />
                            Bloqueado: {slot.blockReason || 'Folga'}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Available slot
                  return (
                    <div
                      key={slot.time}
                      className="py-2 px-3 my-1 hover:bg-stone-50 rounded-xl flex items-center justify-between text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-stone-400 w-11 group-hover:text-stone-700">
                          {slot.time}
                        </span>
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Livre
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenManualModal(slot.time)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Encaixar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= OPTION 2: VISÃO SEMANAL UNIFICADA (7 COLUNAS) ================= */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-display text-lg font-bold text-stone-900 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-rose-500" />
                Semana de Atendimentos
              </h3>
              <p className="text-xs text-stone-500">
                Visualização unificada de Segunda a Domingo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDateOffset(-7)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                ← Semana Anterior
              </button>
              <button
                onClick={() => handleDateOffset(7)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Próxima Semana →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {weekDays.map((col) => (
              <div
                key={col.dateString}
                onClick={() => onSelectDate(col.dateString)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col min-h-[220px] ${
                  col.isSelected
                    ? 'border-rose-500 ring-2 ring-rose-400/20 bg-rose-50/20 shadow-xs'
                    : col.isToday
                    ? 'border-amber-400 bg-amber-50/20'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      {col.weekdayName}
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      {col.dayNum}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                    {col.apts.length}
                  </span>
                </div>

                <div className="flex-1 space-y-1.5 overflow-y-auto">
                  {col.apts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-stone-400 text-center py-4">
                      Nenhum agendamento
                    </div>
                  ) : (
                    col.apts.map((a) => (
                      <div
                        key={a.id}
                        className={`p-2 rounded-xl text-left border text-xs shadow-2xs ${
                          a.status === 'pendente'
                            ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                            : a.status === 'confirmado'
                            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                            : 'bg-white border-stone-200 text-stone-800'
                        }`}
                      >
                        <span className="font-bold block text-[11px]">{a.time} - {a.clientName}</span>
                        <span className="text-[10px] text-stone-600 truncate block">
                          {a.serviceNames[0]}
                        </span>
                        <span className="text-[10px] font-semibold text-rose-700 block mt-0.5">
                          {formatCurrency(a.totalPrice)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= OPTION 3: GRADE DE HORÁRIOS COMPLETA ================= */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-display text-lg font-bold text-stone-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                Linha do Tempo de Atendimentos • {formatDateFull(selectedDate)}
              </h3>
              <p className="text-xs text-stone-500">
                Visualize os slots disponíveis e ocupados ao longo do expediente.
              </p>
            </div>

            <button
              onClick={() => onOpenManualModal()}
              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agendar Cliente
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {timelineSlots.map((slot) => {
              if (slot.appointment) {
                const apt = slot.appointment;
                return (
                  <div
                    key={slot.time}
                    className={`py-3 px-4 rounded-2xl my-1 flex flex-col md:flex-row md:items-center justify-between gap-3 border transition-all ${
                      apt.status === 'pendente'
                        ? 'bg-amber-50/50 border-amber-200'
                        : apt.status === 'confirmado'
                        ? 'bg-rose-50/40 border-rose-200'
                        : apt.status === 'concluido'
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-stone-50 border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-12 rounded-xl bg-stone-900 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold">{slot.time}</span>
                        <span className="text-[9px] text-stone-300">
                          {formatDuration(apt.totalDuration)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900 text-sm">
                            {apt.clientName}
                          </span>
                          <span className="text-[11px] text-stone-500 bg-white/80 px-2 py-0.5 rounded-md border border-stone-200">
                            {formatPhone(apt.clientPhone)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              apt.status === 'pendente'
                                ? 'bg-amber-100 text-amber-800'
                                : apt.status === 'confirmado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : apt.status === 'concluido'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-rose-700 mt-0.5">
                          {apt.serviceNames.join(' + ')} • {formatCurrency(apt.totalPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleSendReminder(apt)}
                        className="p-1.5 text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>

                      {apt.status === 'pendente' && (
                        <button
                          onClick={() => onStatusChange(apt.id, 'confirmado')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Confirmar
                        </button>
                      )}

                      {apt.status === 'confirmado' && (
                        <button
                          onClick={() => onStatusChange(apt.id, 'concluido')}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Concluir
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (window.confirm('Excluir este agendamento?')) {
                            onDeleteAppointment(apt.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              if (slot.isLunch) {
                return (
                  <div
                    key={slot.time}
                    className="py-2.5 px-4 my-1 bg-stone-100/60 rounded-xl flex items-center justify-between text-xs text-stone-500 border border-dashed border-stone-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-stone-400 w-12">{slot.time}</span>
                      <span className="flex items-center gap-1.5 font-medium text-stone-600">
                        <Coffee className="w-3.5 h-3.5 text-amber-600" />
                        Horário de Intervalo / Almoço
                      </span>
                    </div>
                  </div>
                );
              }

              if (slot.isBlocked) {
                return (
                  <div
                    key={slot.time}
                    className="py-2.5 px-4 my-1 bg-amber-50/40 rounded-xl flex items-center justify-between text-xs text-amber-800 border border-amber-200/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-700 w-12">{slot.time}</span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Ban className="w-3.5 h-3.5 text-amber-600" />
                        Bloqueado: {slot.blockReason || 'Indisponível'}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={slot.time}
                  className="py-2.5 px-4 my-1 hover:bg-stone-50 rounded-xl flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-stone-400 w-12 group-hover:text-stone-700">
                      {slot.time}
                    </span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Horário Disponível
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenManualModal(slot.time)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Encaixar neste horário
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= OPTION 4: VISÃO MENSAL ================= */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-display text-xl font-bold text-stone-900 capitalize">
                {monthData.monthName}
              </h3>
              <p className="text-xs text-stone-500">
                Clique em qualquer dia para abrir a agenda da data correspondente.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white text-stone-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white text-stone-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-stone-400 pb-1">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthData.days.map((day) => {
              const isSelected = day.dateString === selectedDate;

              return (
                <button
                  key={day.dateString}
                  onClick={() => {
                    onSelectDate(day.dateString);
                    setViewMode('unified');
                  }}
                  className={`min-h-[75px] sm:min-h-[85px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-rose-500 ring-2 ring-rose-400/30 bg-rose-50/50 shadow-xs'
                      : day.isToday
                      ? 'border-amber-400 bg-amber-50/20'
                      : day.isCurrentMonth
                      ? 'border-stone-200 hover:border-rose-300 hover:bg-stone-50 bg-white'
                      : 'border-stone-100 bg-stone-50/60 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-rose-500 text-white'
                          : day.isToday
                          ? 'bg-amber-400 text-white'
                          : 'text-stone-700'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {day.pendingCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Pendentes" />
                    )}
                  </div>

                  {day.appointmentCount > 0 && (
                    <div className="mt-1">
                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                        {day.appointmentCount} {day.appointmentCount === 1 ? 'cliente' : 'clientes'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
