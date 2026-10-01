import React, { useMemo } from 'react';
import { StudioSettings, Appointment, BlockedSlot } from '../../types';
import { generateAvailableTimeSlots, formatDateFull } from '../../lib/utils';
import { Calendar as CalendarIcon, Clock, ChevronRight, Sun, Moon } from 'lucide-react';

interface TimeSlotPickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  totalDuration: number;
  settings: StudioSettings;
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  totalDuration,
  settings,
  appointments,
  blockedSlots,
}) => {
  // Generate next 14 days
  const availableDates = useMemo(() => {
    const list: {
      dateString: string;
      dayOfWeek: number;
      dayNum: number;
      monthShort: string;
      weekdayShort: string;
      isOpen: boolean;
      isToday: boolean;
    }[] = [];

    const now = new Date();

    for (let i = 0; i < 21; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const dayOfWeek = d.getDay();
      const isOpen = settings.workingDays.includes(dayOfWeek);

      list.push({
        dateString,
        dayOfWeek,
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString('pt-BR', { month: 'short' }),
        weekdayShort: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        isOpen,
        isToday: i === 0,
      });
    }

    return list;
  }, [settings.workingDays]);

  // Compute time slots for selected date
  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return generateAvailableTimeSlots(
      selectedDate,
      totalDuration,
      settings,
      appointments,
      blockedSlots
    );
  }, [selectedDate, totalDuration, settings, appointments, blockedSlots]);

  // Group slots into morning and afternoon/evening
  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 12;
  });

  const hasAnyAvailableSlot = slots.some((s) => s.available);

  return (
    <div className="space-y-6">
      {/* 1. Date Selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-stone-800 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-rose-500" />
            Selecione o Dia
          </label>
          <span className="text-xs text-stone-500">
            {formatDateFull(selectedDate)}
          </span>
        </div>

        {/* Horizontal scroll of days */}
        <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-stone-200">
          {availableDates.map((d) => {
            const isSelected = d.dateString === selectedDate;

            return (
              <button
                key={d.dateString}
                disabled={!d.isOpen}
                onClick={() => {
                  onSelectDate(d.dateString);
                  onSelectTime(''); // reset time on day change
                }}
                className={`flex flex-col items-center justify-center min-w-[70px] py-3 px-2 rounded-2xl border transition-all text-center shrink-0 ${
                  !d.isOpen
                    ? 'opacity-40 bg-stone-100 border-stone-200 cursor-not-allowed text-stone-400'
                    : isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200 scale-105'
                    : 'bg-white border-stone-200 hover:border-rose-300 text-stone-700 hover:bg-rose-50/40'
                }`}
              >
                <span className={`text-[11px] uppercase tracking-wider font-semibold ${
                  isSelected ? 'text-rose-100' : 'text-stone-400'
                }`}>
                  {d.isToday ? 'Hoje' : d.weekdayShort}
                </span>
                <span className="text-lg font-bold my-0.5">
                  {d.dayNum}
                </span>
                <span className={`text-[10px] capitalize ${isSelected ? 'text-rose-100' : 'text-stone-400'}`}>
                  {d.monthShort}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Time Slots Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-stone-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" />
            Selecione o Horário Disponível
          </label>
          <span className="text-xs text-stone-500">
            Duração estimada: {totalDuration} min
          </span>
        </div>

        {slots.length === 0 ? (
          <div className="bg-stone-50 rounded-2xl p-8 text-center border border-dashed border-stone-300">
            <CalendarIcon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-stone-700 font-medium text-sm">
              O Studio não atende nesta data selecionada.
            </p>
            <p className="text-stone-400 text-xs mt-1">
              Por favor, escolha outro dia na barra acima.
            </p>
          </div>
        ) : !hasAnyAvailableSlot ? (
          <div className="bg-rose-50/60 rounded-2xl p-8 text-center border border-rose-200">
            <Clock className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-rose-900 font-medium text-sm">
              Todos os horários para este dia já foram reservados!
            </p>
            <p className="text-rose-700 text-xs mt-1">
              Experimente escolher a próxima data disponível para garantir sua vaga.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Morning slots */}
            {morningSlots.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Manhã
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {morningSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => onSelectTime(slot.time)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all text-center border ${
                          !slot.available
                            ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-200 ring-2 ring-rose-200'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-rose-400 hover:bg-rose-50/50'
                        }`}
                        title={slot.reason || 'Disponível'}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon / Evening slots */}
            {afternoonSlots.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  Tarde & Noite
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {afternoonSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => onSelectTime(slot.time)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all text-center border ${
                          !slot.available
                            ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-200 ring-2 ring-rose-200'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-rose-400 hover:bg-rose-50/50'
                        }`}
                        title={slot.reason || 'Disponível'}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTime && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs text-rose-900">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Horário escolhido: <strong className="font-semibold">{selectedTime}</strong> no dia <strong className="font-semibold">{formatDateFull(selectedDate)}</strong>
          </span>
          <span className="text-rose-600 font-medium">Tudo certo!</span>
        </div>
      )}
    </div>
  );
};
