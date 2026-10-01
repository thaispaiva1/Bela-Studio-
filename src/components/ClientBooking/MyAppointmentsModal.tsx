import React, { useState } from 'react';
import { Appointment, StudioSettings } from '../../types';
import { formatCurrency, formatDateFull, formatDuration, formatPhone, generateWhatsAppLink } from '../../lib/utils';
import { Calendar, Clock, Search, X, MessageCircle, AlertCircle } from 'lucide-react';

interface MyAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  settings: StudioSettings;
  onCancelAppointment: (id: string) => Promise<void>;
  prefilledPhone?: string;
}

export const MyAppointmentsModal: React.FC<MyAppointmentsModalProps> = ({
  isOpen,
  onClose,
  appointments,
  settings,
  onCancelAppointment,
  prefilledPhone = '',
}) => {
  const [searchPhone, setSearchPhone] = useState(prefilledPhone);
  const [searched, setSearched] = useState(Boolean(prefilledPhone));
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanQuery = searchPhone.replace(/\D/g, '');

  const filtered = appointments.filter((apt) => {
    if (!cleanQuery) return false;
    const clientClean = apt.clientPhone.replace(/\D/g, '');
    return clientClean.includes(cleanQuery) || clientClean.endsWith(cleanQuery);
  });

  const handleCancel = async (apt: Appointment) => {
    const confirm = window.confirm(
      `Deseja realmente cancelar seu agendamento de ${apt.serviceNames[0]} no dia ${formatDateFull(apt.date)}?`
    );
    if (!confirm) return;

    setCancellingId(apt.id);
    try {
      await onCancelAppointment(apt.id);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Confirmado
          </span>
        );
      case 'pendente':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Aguardando Confirmação
          </span>
        );
      case 'concluido':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Atendimento Realizado
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
            Área da Cliente
          </span>
          <h2 className="font-display text-2xl font-bold text-stone-900 mt-1">
            Consultar Meus Agendamentos
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Digite seu número de WhatsApp para ver seus horários marcados ou cancelar.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="tel"
              placeholder="Digite seu WhatsApp (ex: 11988887766)"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearched(true);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white font-medium"
            />
          </div>
          <button
            onClick={() => setSearched(true)}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {!searched ? (
            <div className="py-12 text-center text-stone-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Informe seu telefone para visualizar seu histórico.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-stone-400" />
              <p className="text-sm font-medium text-stone-700">Nenhum agendamento encontrado</p>
              <p className="text-xs text-stone-500 mt-1">
                Verifique se digitou o mesmo número utilizado ao realizar o agendamento.
              </p>
            </div>
          ) : (
            filtered.map((apt) => (
              <div
                key={apt.id}
                className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 relative transition-all hover:border-rose-200"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-semibold text-stone-900 text-base">
                      {apt.serviceNames.join(' + ')}
                    </h4>
                    <span className="text-xs text-stone-500">
                      Cliente: {apt.clientName} ({formatPhone(apt.clientPhone)})
                    </span>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 mb-4 bg-white p-3 rounded-xl border border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>{formatDateFull(apt.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span>{apt.time} ({formatDuration(apt.totalDuration)})</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-stone-100 flex justify-between font-medium">
                    <span>Valor Total:</span>
                    <span className="text-stone-900 font-bold">{formatCurrency(apt.totalPrice)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <a
                    href={generateWhatsAppLink(
                      settings.phone,
                      `Olá! Tenho uma dúvida sobre meu agendamento de ${apt.serviceNames[0]} no dia ${apt.date} às ${apt.time}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Tirar Dúvida no WhatsApp
                  </a>

                  {apt.status !== 'cancelado' && apt.status !== 'concluido' && (
                    <button
                      disabled={cancellingId === apt.id}
                      onClick={() => handleCancel(apt)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline disabled:opacity-50"
                    >
                      {cancellingId === apt.id ? 'Cancelando...' : 'Cancelar Horário'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
