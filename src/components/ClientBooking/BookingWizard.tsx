import React, { useState } from 'react';
import { Service, StudioSettings, Appointment, BlockedSlot } from '../../types';
import { ServiceCard } from './ServiceCard';
import { TimeSlotPicker } from './TimeSlotPicker';
import { BookingSuccess } from './BookingSuccess';
import { formatCurrency, formatDuration, formatDateFull, getTodayDateString } from '../../lib/utils';
import { Sparkles, Calendar, User, Check, ArrowRight, ArrowLeft, ShieldCheck, Heart } from 'lucide-react';

interface BookingWizardProps {
  services: Service[];
  settings: StudioSettings;
  existingAppointments: Appointment[];
  blockedSlots: BlockedSlot[];
  onCompleteBooking: (newAppointment: Appointment) => Promise<Appointment>;
  onOpenTracker: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services,
  settings,
  existingAppointments,
  blockedSlots,
  onCompleteBooking,
  onOpenTracker,
}) => {
  // Wizard steps: 1 = Services, 2 = Date & Time, 3 = Client Info, 4 = Success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Booking state
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString(0));
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Form state
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedAppointment, setCompletedAppointment] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered active services
  const activeServices = services.filter((s) => s.active);
  const displayedServices = activeServices.filter((s) => {
    if (selectedCategory === 'todos') return true;
    return s.category === selectedCategory;
  });

  // Calculate totals
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Toggle service selection
  const handleToggleService = (service: Service) => {
    if (selectedServices.some((s) => s.id === service.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  // Phone input formatting
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    setClientPhone(formatted);
  };

  // Submit booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedServices.length === 0) {
      setErrorMessage('Por favor, selecione ao menos um serviço.');
      setCurrentStep(1);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMessage('Por favor, selecione uma data e horário.');
      setCurrentStep(2);
      return;
    }

    if (!clientName.trim() || clientPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Por favor, informe seu nome e um número de WhatsApp válido.');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const newApt: Appointment = {
        id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        clientName: clientName.trim(),
        clientPhone: clientPhone.replace(/\D/g, ''),
        clientEmail: clientEmail.trim() || undefined,
        serviceIds: selectedServices.map((s) => s.id),
        serviceNames: selectedServices.map((s) => s.name),
        totalPrice,
        totalDuration,
        date: selectedDate,
        time: selectedTime,
        notes: clientNotes.trim() || undefined,
        status: 'pendente',
        createdAt: new Date().toISOString(),
      };

      const saved = await onCompleteBooking(newApt);
      setCompletedAppointment(saved);
      setCurrentStep(4);
    } catch {
      setErrorMessage('Ocorreu um erro ao registrar seu agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setSelectedServices([]);
    setSelectedDate(getTodayDateString(0));
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientNotes('');
    setCompletedAppointment(null);
    setCurrentStep(1);
  };

  // If completed, show success screen
  if (currentStep === 4 && completedAppointment) {
    return (
      <BookingSuccess
        appointment={completedAppointment}
        settings={settings}
        onNewBooking={handleResetBooking}
        onTrackAppointment={onOpenTracker}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Studio Welcome Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/70 text-rose-700 mb-3 border border-rose-200">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          Agendamento Online 24h
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
          Suas unhas impecáveis, com todo carinho que você merece.
        </h1>
        <p className="text-stone-600 text-sm sm:text-base mt-3">
          Escolha os serviços desejados e garanta seu horário na agenda de {settings.ownerName}.
        </p>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 mb-8 shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
              currentStep === 1
                ? 'bg-rose-50 text-rose-800 font-semibold ring-1 ring-rose-300'
                : selectedServices.length > 0
                ? 'text-stone-700 hover:bg-stone-50'
                : 'text-stone-400 opacity-60'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 1
                  ? 'bg-rose-500 text-white'
                  : selectedServices.length > 0
                  ? 'bg-emerald-500 text-white'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {selectedServices.length > 0 && currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="truncate hidden sm:block">
              <span className="text-xs uppercase tracking-wider block font-medium">Passo 1</span>
              <span className="text-sm font-semibold truncate block">Serviços</span>
            </div>
          </button>

          {/* Step 2 */}
          <button
            disabled={selectedServices.length === 0}
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
              currentStep === 2
                ? 'bg-rose-50 text-rose-800 font-semibold ring-1 ring-rose-300'
                : selectedTime
                ? 'text-stone-700 hover:bg-stone-50'
                : 'text-stone-400 opacity-60'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 2
                  ? 'bg-rose-500 text-white'
                  : selectedTime && currentStep > 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {selectedTime && currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="truncate hidden sm:block">
              <span className="text-xs uppercase tracking-wider block font-medium">Passo 2</span>
              <span className="text-sm font-semibold truncate block">Data & Horário</span>
            </div>
          </button>

          {/* Step 3 */}
          <button
            disabled={!selectedTime}
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
              currentStep === 3
                ? 'bg-rose-50 text-rose-800 font-semibold ring-1 ring-rose-300'
                : 'text-stone-400 opacity-60'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 3
                  ? 'bg-rose-500 text-white'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              3
            </div>
            <div className="truncate hidden sm:block">
              <span className="text-xs uppercase tracking-wider block font-medium">Passo 3</span>
              <span className="text-sm font-semibold truncate block">Seus Dados</span>
            </div>
          </button>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold uppercase"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ================= STEP 1: SERVICES ================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'todos', label: 'Todos os Serviços' },
              { id: 'tradicional', label: 'Manicure & Pedicure' },
              { id: 'alongamento', label: 'Alongamento & Gel' },
              { id: 'spa', label: 'Spa & Cuidados' },
              { id: 'arte', label: 'Nail Art' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-rose-300 hover:bg-rose-50/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {displayedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServices.some((s) => s.id === service.id)}
                onToggle={handleToggleService}
              />
            ))}
          </div>

          {/* Sticky Bottom Bar for Step 1 */}
          <div className="sticky bottom-4 z-20 bg-stone-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-stone-800">
            <div>
              <p className="text-xs text-stone-400">
                {selectedServices.length === 0
                  ? 'Selecione ao menos um serviço para continuar'
                  : `${selectedServices.length} serviço(s) selecionado(s) • Duração estimada: ${formatDuration(
                      totalDuration
                    )}`}
              </p>
              <p className="text-xl font-bold text-white">
                Total: {formatCurrency(totalPrice)}
              </p>
            </div>

            <button
              disabled={selectedServices.length === 0}
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-500/20"
            >
              Escolher Data e Horário
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: DATE & TIME ================= */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-display text-2xl font-bold text-stone-900">
                Escolha o melhor dia e horário
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Os horários exibidos são calculados para a duração total de seus serviços ({formatDuration(totalDuration)}).
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-stone-500 hover:text-stone-800 font-medium flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Trocar serviços
            </button>
          </div>

          <TimeSlotPicker
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            totalDuration={totalDuration}
            settings={settings}
            appointments={existingAppointments}
            blockedSlots={blockedSlots}
          />

          <div className="flex items-center justify-between pt-6 border-t border-stone-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-sm flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              disabled={!selectedTime}
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-md shadow-rose-500/20"
            >
              Avançar para Seus Dados
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: CLIENT INFO & CONFIRMATION ================= */}
      {currentStep === 3 && (
        <form onSubmit={handleConfirmBooking} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Fields (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-stone-900">
                  Seus Dados para Contato
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  Usaremos seu WhatsApp para confirmar o horário e enviar lembretes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Carolina da Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98888-7766"
                  value={clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Informe o número com DDD onde você recebe mensagens.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Observações ou Preferências (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Alergia a esmalte tradicional, cutícula funda, desejo formato bailarina, etc."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white resize-none"
                />
              </div>
            </div>

            {/* Order Summary Card (1 col) */}
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-base mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  Resumo do Agendamento
                </h3>

                <div className="space-y-3 text-xs sm:text-sm mb-6">
                  <div>
                    <span className="text-stone-400 block text-[11px] uppercase tracking-wider">
                      Data & Horário
                    </span>
                    <span className="font-semibold text-stone-900 block mt-0.5">
                      {formatDateFull(selectedDate)} às {selectedTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[11px] uppercase tracking-wider">
                      Serviços Escolhidos
                    </span>
                    <ul className="mt-1 space-y-1">
                      {selectedServices.map((s) => (
                        <li key={s.id} className="flex justify-between text-stone-700">
                          <span>{s.name}</span>
                          <span className="font-medium">{formatCurrency(s.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between text-xs text-stone-500">
                    <span>Tempo Total:</span>
                    <span className="font-medium text-stone-800">{formatDuration(totalDuration)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-stone-900 pt-1">
                    <span>Total a Pagar:</span>
                    <span className="text-rose-600">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Atendimento com hora marcada
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Tolerância de atraso de até 15 minutos para não prejudicar os próximos horários.
                  </p>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? 'Finalizando...' : 'Confirmar Agendamento'}
                  <Check className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 font-medium"
                >
                  Voltar e alterar horário
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
