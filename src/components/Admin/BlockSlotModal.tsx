import React, { useState } from 'react';
import { BlockedSlot } from '../../types';
import { getTodayDateString } from '../../lib/utils';
import { X, Ban, Plus } from 'lucide-react';

interface BlockSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: BlockedSlot) => Promise<void>;
  defaultDate?: string;
}

export const BlockSlotModal: React.FC<BlockSlotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultDate,
}) => {
  const [date, setDate] = useState(defaultDate || getTodayDateString(0));
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [time, setTime] = useState('14:00');
  const [reason, setReason] = useState('Compromisso pessoal');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const slot: BlockedSlot = {
        id: `blk-${Date.now()}`,
        date,
        time: blockAllDay ? undefined : time,
        reason: reason.trim() || 'Horário Bloqueado',
      };
      await onSave(slot);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
          <Ban className="w-6 h-6" />
        </div>

        <h3 className="font-display text-2xl font-bold text-stone-900 mb-1">
          Bloquear Horário ou Dia
        </h3>
        <p className="text-xs text-stone-500 mb-6">
          Impeça que novos agendamentos online sejam feitos neste período.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Data *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="blockAllDay"
              checked={blockAllDay}
              onChange={(e) => setBlockAllDay(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 border-stone-300"
            />
            <label htmlFor="blockAllDay" className="text-sm font-semibold text-stone-700 cursor-pointer">
              Bloquear o dia inteiro (Folga / Feriado)
            </label>
          </div>

          {!blockAllDay && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Horário Específico *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Motivo do Bloqueio
            </label>
            <input
              type="text"
              placeholder="Ex: Consulta médica, intervalo, almoço prolongado"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-stone-600 hover:text-stone-900 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSaving ? 'Bloqueando...' : 'Confirmar Bloqueio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
