import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Appointment, StudioSettings } from '../../types';
import { formatCurrency, formatDateFull, formatDuration, generateWhatsAppLink } from '../../lib/utils';
import { CheckCircle2, MessageCircle, CalendarPlus, Copy, MapPin, Clock, Sparkles } from 'lucide-react';

interface BookingSuccessProps {
  appointment: Appointment;
  settings: StudioSettings;
  onNewBooking: () => void;
  onTrackAppointment: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  appointment,
  settings,
  onNewBooking,
  onTrackAppointment,
}) => {
  const [copiedPix, setCopiedPix] = React.useState(false);

  useEffect(() => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#fbbf24', '#fda4af'],
      });
    } catch {
      // ignore
    }
  }, []);

  const depositAmount = settings.depositRequired && settings.depositPercentage
    ? (appointment.totalPrice * settings.depositPercentage) / 100
    : 0;

  // WhatsApp formatted confirmation text
  const whatsappMessage = `Olá ${settings.ownerName || 'Bella'}! ✨
Acabei de fazer meu agendamento pelo site no *${settings.studioName}*:

💅 *Serviço(s):* ${appointment.serviceNames.join(', ')}
📅 *Data:* ${formatDateFull(appointment.date)}
⏰ *Horário:* ${appointment.time}
💰 *Valor Total:* ${formatCurrency(appointment.totalPrice)}
👤 *Cliente:* ${appointment.clientName}
${appointment.notes ? `📝 *Observação:* ${appointment.notes}\n` : ''}
Poderia me confirmar por favor? Obrigada! ❤️`;

  const whatsappUrl = generateWhatsAppLink(settings.phone, whatsappMessage);

  // Google Calendar Link generator
  const createGoogleCalendarUrl = () => {
    const [year, month, day] = appointment.date.split('-');
    const [hour, min] = appointment.time.split(':');
    const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min));
    const endDate = new Date(startDate.getTime() + appointment.totalDuration * 60000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${startDate.getFullYear()}${pad(startDate.getMonth() + 1)}${pad(startDate.getDate())}T${pad(startDate.getHours())}${pad(startDate.getMinutes())}00`;
    const endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

    const title = encodeURIComponent(`Horário Manicure - ${appointment.serviceNames[0]}`);
    const details = encodeURIComponent(`Agendamento no ${settings.studioName}. Serviços: ${appointment.serviceNames.join(', ')}`);
    const location = encodeURIComponent(`${settings.address}, ${settings.neighborhood}, ${settings.city}`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  const handleCopyPix = () => {
    if (settings.pixKey) {
      navigator.clipboard.writeText(settings.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-rose-100 shadow-xl shadow-rose-100/50 text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-rose-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

        {/* Success Icon */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Solicitação Recebida com Sucesso!
        </span>

        <h2 className="font-display text-3xl font-bold text-stone-900 mb-2">
          Agendamento Confirmado!
        </h2>
        <p className="text-stone-600 text-sm max-w-md mx-auto mb-8">
          Prontinho, <strong className="text-stone-800">{appointment.clientName}</strong>! Seu horário foi pré-agendado no nosso sistema.
        </p>

        {/* Voucher / Summary Ticket */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 text-left mb-6 relative">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                Código do Agendamento
              </p>
              <p className="text-sm font-bold text-stone-800 font-mono">
                #{appointment.id.slice(-6).toUpperCase()}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              Aguardando confirmação
            </span>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-stone-500">Serviços:</span>
              <span className="font-medium text-stone-900 text-right max-w-[65%]">
                {appointment.serviceNames.join(' + ')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">Data & Horário:</span>
              <span className="font-semibold text-rose-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDateFull(appointment.date)} às {appointment.time}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">Duração Estimada:</span>
              <span className="text-stone-800 font-medium">
                {formatDuration(appointment.totalDuration)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-200">
              <span className="text-stone-700 font-semibold">Valor Total:</span>
              <span className="text-lg font-bold text-stone-900">
                {formatCurrency(appointment.totalPrice)}
              </span>
            </div>

            <div className="pt-2 flex items-start gap-1.5 text-xs text-stone-500">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <span>{settings.address}, {settings.neighborhood} - {settings.city}</span>
            </div>
          </div>
        </div>

        {/* Pix Deposit Info (if required) */}
        {settings.depositRequired && depositAmount > 0 && settings.pixKey && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-left mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Sinal de Agendamento ({settings.depositPercentage}% = {formatCurrency(depositAmount)})
              </h4>
              <span className="text-[11px] text-amber-700 font-medium">Garante seu horário</span>
            </div>
            <p className="text-xs text-amber-800 mb-3">
              Para fixar sua reserva na agenda, envie o comprovante do sinal pelo WhatsApp.
            </p>
            <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-amber-300">
              <div className="flex-1 truncate font-mono text-xs font-medium text-stone-800">
                Chave Pix: {settings.pixKey}
              </div>
              <button
                onClick={handleCopyPix}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedPix ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            Avisar Manicure pelo WhatsApp
          </a>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={createGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl border border-stone-200 hover:border-stone-400 bg-white text-stone-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <CalendarPlus className="w-4 h-4 text-stone-500" />
              Salvar na Minha Agenda
            </a>

            <button
              onClick={onTrackAppointment}
              className="py-3 px-4 rounded-xl border border-stone-200 hover:border-stone-400 bg-white text-stone-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              Consultar Status
            </button>
          </div>

          <button
            onClick={onNewBooking}
            className="text-xs text-stone-500 hover:text-stone-800 underline font-medium pt-3 block mx-auto"
          >
            Fazer outro agendamento
          </button>
        </div>
      </div>
    </div>
  );
};
