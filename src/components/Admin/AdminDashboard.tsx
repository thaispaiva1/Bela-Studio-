import React, { useState, useMemo } from 'react';
import { Appointment, Service, StudioSettings, BlockedSlot } from '../../types';
import {
  formatCurrency,
  formatDateDisplay,
  formatDateFull,
  formatDuration,
  formatPhone,
  generateWhatsAppLink,
  getTodayDateString,
} from '../../lib/utils';
import { resetSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { NewManualAppointmentModal } from './NewManualAppointmentModal';
import { BlockSlotModal } from './BlockSlotModal';
import { AgendaCalendarView } from './AgendaCalendarView';
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  MessageCircle,
  Plus,
  Ban,
  Settings as SettingsIcon,
  Scissors,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  Save,
  Database,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  settings: StudioSettings;
  services: Service[];
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  onUpdateSettings: (newSettings: StudioSettings) => Promise<void>;
  onUpdateServices: (newServices: Service[]) => Promise<void>;
  onUpdateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onSaveManualAppointment: (apt: Appointment) => Promise<void>;
  onSaveBlockedSlot: (slot: BlockedSlot) => Promise<void>;
  onDeleteBlockedSlot: (id: string) => Promise<void>;
  onLogout: () => void;
  onNavigateToBooking: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  services,
  appointments,
  blockedSlots,
  onUpdateSettings,
  onUpdateServices,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onSaveManualAppointment,
  onSaveBlockedSlot,
  onDeleteBlockedSlot,
  onLogout,
  onNavigateToBooking,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'agenda' | 'servicos' | 'bloqueios' | 'config'>('agenda');

  // Agenda filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString(0));
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualPresetTime, setManualPresetTime] = useState<string | undefined>(undefined);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const handleOpenManualModal = (presetTime?: string) => {
    setManualPresetTime(presetTime);
    setIsManualModalOpen(true);
  };

  // Settings form local state
  const [localSettings, setLocalSettings] = useState<StudioSettings>({ ...settings });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Supabase discreet connection fields in settings
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('bella_custom_supabase_url') || '' : ''
  );
  const [customSupabaseKey, setCustomSupabaseKey] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('bella_custom_supabase_key') || '' : ''
  );
  const [dbSavedSuccess, setDbSavedSuccess] = useState(false);

  // Services management
  const [localServices, setLocalServices] = useState<Service[]>([...services]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(40);
  const [newServiceDuration, setNewServiceDuration] = useState(45);
  const [newServiceCategory, setNewServiceCategory] = useState<Service['category']>('tradicional');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);

  // Keep localServices synced if prop changes
  React.useEffect(() => {
    setLocalServices([...services]);
  }, [services]);

  // Keep localSettings synced if prop changes
  React.useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  // Daily statistics calculation
  const stats = useMemo(() => {
    const today = getTodayDateString(0);
    const todayApts = appointments.filter((a) => a.date === today && a.status !== 'cancelado');
    const todayRevenue = todayApts.reduce((sum, a) => sum + a.totalPrice, 0);
    const pendingCount = appointments.filter((a) => a.status === 'pendente').length;
    const completedCount = appointments.filter((a) => a.status === 'concluido').length;

    return {
      todayCount: todayApts.length,
      todayRevenue,
      pendingCount,
      completedCount,
    };
  }, [appointments]);

  // Filtered appointments for the active date
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate)
      .filter((a) => {
        if (statusFilter === 'todos') return true;
        return a.status === statusFilter;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, statusFilter]);

  // Change date offset
  const handleDateOffset = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Status changer
  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    await onUpdateAppointmentStatus(id, newStatus);
  };

  // WhatsApp Reminder message
  const handleSendReminder = (apt: Appointment) => {
    const msg = `Olá, ${apt.clientName}! Tudo bem? ✨
Passando para confirmar seu horário hoje às *${apt.time}* no *${settings.studioName}* para:
💅 *${apt.serviceNames.join(' + ')}*
📍 *Local:* ${settings.address}, ${settings.neighborhood}

Podemos confirmar sua presença? Aguardo sua resposta! ❤️`;
    const url = generateWhatsAppLink(apt.clientPhone, msg);
    window.open(url, '_blank');
  };

  // Save Settings
  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await onUpdateSettings(localSettings);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save Custom Supabase discreetly
  const handleSaveDbConfig = () => {
    if (customSupabaseUrl.trim() && customSupabaseKey.trim()) {
      resetSupabaseClient(customSupabaseUrl.trim(), customSupabaseKey.trim());
    } else {
      resetSupabaseClient();
    }
    setDbSavedSuccess(true);
    setTimeout(() => setDbSavedSuccess(false), 3000);
  };

  // Add Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newSrv: Service = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      description: newServiceDesc.trim() || 'Serviço profissional de nail designer.',
      category: newServiceCategory,
      durationMinutes: Number(newServiceDuration),
      price: Number(newServicePrice),
      active: true,
    };

    const updated = [...localServices, newSrv];
    setLocalServices(updated);
    await onUpdateServices(updated);

    setNewServiceName('');
    setNewServiceDesc('');
    setIsAddingService(false);
  };

  // Toggle active service
  const handleToggleServiceActive = async (id: string) => {
    const updated = localServices.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setLocalServices(updated);
    await onUpdateServices(updated);
  };

  // Delete service
  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;
    const updated = localServices.filter((s) => s.id !== id);
    setLocalServices(updated);
    await onUpdateServices(updated);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header of Admin */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Painel de Gestão da Profissional
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            {settings.studioName}
          </h1>
          <p className="text-xs text-stone-500">
            Bem-vinda, <strong className="text-stone-800">{settings.ownerName}</strong>! Gerencie seus horários, clientes e serviços.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>

          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Ban className="w-4 h-4 text-stone-500" />
            Bloquear Horário
          </button>

          <button
            onClick={onLogout}
            className="p-2.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            title="Sair do painel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Hoje na Agenda</span>
            <CalendarIcon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {stats.todayCount} <span className="text-xs text-stone-400 font-normal">atendimentos</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Faturamento Hoje</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(stats.todayRevenue)}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Aguardando Confirmação</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {stats.pendingCount} <span className="text-xs text-stone-400 font-normal">pendentes</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Concluídos</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.completedCount} <span className="text-xs text-stone-400 font-normal">clientes</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 gap-2 sm:gap-6 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`py-3 px-2 sm:px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'agenda'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Agenda & Atendimentos
        </button>

        <button
          onClick={() => setActiveTab('servicos')}
          className={`py-3 px-2 sm:px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'servicos'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Serviços & Preços ({services.length})
        </button>

        <button
          onClick={() => setActiveTab('bloqueios')}
          className={`py-3 px-2 sm:px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'bloqueios'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Ban className="w-4 h-4" />
          Bloqueios & Folgas ({blockedSlots.length})
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`py-3 px-2 sm:px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Configurações do Salão
        </button>
      </div>

      {/* ================= TAB 1: AGENDA ================= */}
      {activeTab === 'agenda' && (
        <AgendaCalendarView
          appointments={appointments}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          settings={settings}
          blockedSlots={blockedSlots}
          onStatusChange={handleStatusChange}
          onDeleteAppointment={onDeleteAppointment}
          onOpenManualModal={handleOpenManualModal}
          onOpenBlockModal={() => setIsBlockModalOpen(true)}
        />
      )}

      {/* ================= TAB 2: SERVIÇOS ================= */}
      {activeTab === 'servicos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900">
                  Tabela de Serviços & Valores
                </h3>
                <p className="text-xs text-stone-500">
                  Defina os serviços oferecidos, tempo de aplicação e valores cobrados.
                </p>
              </div>

              {!isAddingService && (
                <button
                  onClick={() => setIsAddingService(true)}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Novo Serviço
                </button>
              )}
            </div>

            {/* Add Service Inline Form */}
            {isAddingService && (
              <form onSubmit={handleAddService} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 mb-6 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Cadastrar Novo Procedimento
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                      Nome do Serviço *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Banho de Gel com Francesinha"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.5"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                      Duração (minutos) *
                    </label>
                    <input
                      type="number"
                      required
                      step="5"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                      Categoria *
                    </label>
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium"
                    >
                      <option value="tradicional">Manicure / Pedicure Tradicional</option>
                      <option value="alongamento">Alongamento & Gel</option>
                      <option value="spa">Spa & Cuidados</option>
                      <option value="arte">Nail Art & Decoração</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                      Descrição curta
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cutilagem profunda com esmaltação e extra brilho"
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingService(false)}
                    className="px-3 py-1.5 text-stone-600 hover:text-stone-900 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold"
                  >
                    Salvar Procedimento
                  </button>
                </div>
              </form>
            )}

            {/* List of services */}
            <div className="divide-y divide-stone-100">
              {localServices.map((service) => (
                <div key={service.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold text-sm ${service.active ? 'text-stone-900' : 'text-stone-400 line-through'}`}>
                        {service.name}
                      </h4>
                      <span className="text-[11px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                        {formatDuration(service.durationMinutes)}
                      </span>
                      {!service.active && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 truncate max-w-lg mt-0.5">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-stone-900 text-sm">
                      {formatCurrency(service.price)}
                    </span>

                    <button
                      onClick={() => handleToggleServiceActive(service.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        service.active
                          ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {service.active ? 'Pausar' : 'Ativar'}
                    </button>

                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-1.5 text-stone-300 hover:text-red-500 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BLOQUEIOS ================= */}
      {activeTab === 'bloqueios' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900">
                  Horários e Dias Bloqueados
                </h3>
                <p className="text-xs text-stone-500">
                  Gerencie folgas, feriados ou intervalos onde o agendamento online fica desativado.
                </p>
              </div>

              <button
                onClick={() => setIsBlockModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar Bloqueio
              </button>
            </div>

            {blockedSlots.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Ban className="w-10 h-10 mx-auto mb-2 opacity-40 text-stone-300" />
                <p className="text-sm font-medium text-stone-700">Nenhum horário bloqueado no momento.</p>
                <p className="text-xs text-stone-400 mt-1">Todos os horários comerciais estão abertos para agendamento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {blockedSlots.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        {formatDateFull(b.date)}
                      </span>
                      <span className="text-xs font-semibold text-stone-700 block mt-0.5">
                        {b.time ? `Horário: ${b.time}` : 'Dia Inteiro (Folga)'}
                      </span>
                      <p className="text-xs text-amber-800/80 mt-1 italic">
                        Motivo: {b.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteBlockedSlot(b.id)}
                      className="p-1.5 text-amber-600 hover:text-red-600 hover:bg-amber-100 rounded-lg transition-colors"
                      title="Desbloquear"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: CONFIGURAÇÕES DO SALÃO ================= */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettingsSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900">
                  Dados do Studio & Regras de Atendimento
                </h3>
                <p className="text-xs text-stone-500">
                  Personalize os detalhes de atendimento que aparecem para as clientes.
                </p>
              </div>

              {settingsSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  Configurações salvas!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Nome do Studio / Salão
                </label>
                <input
                  type="text"
                  required
                  value={localSettings.studioName}
                  onChange={(e) => setLocalSettings({ ...localSettings, studioName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Nome da Profissional (Dona)
                </label>
                <input
                  type="text"
                  required
                  value={localSettings.ownerName}
                  onChange={(e) => setLocalSettings({ ...localSettings, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  WhatsApp para Contato e Confirmações
                </label>
                <input
                  type="text"
                  required
                  value={localSettings.phone}
                  onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Instagram (@seustudio)
                </label>
                <input
                  type="text"
                  value={localSettings.instagram}
                  onChange={(e) => setLocalSettings({ ...localSettings, instagram: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Endereço do Ateliê / Studio
                </label>
                <input
                  type="text"
                  required
                  value={localSettings.address}
                  onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={localSettings.neighborhood}
                  onChange={(e) => setLocalSettings({ ...localSettings, neighborhood: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Cidade - UF
                </label>
                <input
                  type="text"
                  value={localSettings.city}
                  onChange={(e) => setLocalSettings({ ...localSettings, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-3">
                Horários de Atendimento & Intervalos
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    Abertura da Agenda
                  </label>
                  <input
                    type="time"
                    value={localSettings.openTime}
                    onChange={(e) => setLocalSettings({ ...localSettings, openTime: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    Fechamento da Agenda
                  </label>
                  <input
                    type="time"
                    value={localSettings.closeTime}
                    onChange={(e) => setLocalSettings({ ...localSettings, closeTime: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    Início Almoço (opcional)
                  </label>
                  <input
                    type="time"
                    value={localSettings.lunchBreakStart || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, lunchBreakStart: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    Fim Almoço (opcional)
                  </label>
                  <input
                    type="time"
                    value={localSettings.lunchBreakEnd || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, lunchBreakEnd: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Working days checkboxes */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-2">
                Dias de Atendimento na Semana
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { day: 0, label: 'Domingo' },
                  { day: 1, label: 'Segunda' },
                  { day: 2, label: 'Terça' },
                  { day: 3, label: 'Quarta' },
                  { day: 4, label: 'Quinta' },
                  { day: 5, label: 'Sexta' },
                  { day: 6, label: 'Sábado' },
                ].map((d) => {
                  const isChecked = localSettings.workingDays.includes(d.day);
                  return (
                    <button
                      type="button"
                      key={d.day}
                      onClick={() => {
                        const next = isChecked
                          ? localSettings.workingDays.filter((w) => w !== d.day)
                          : [...localSettings.workingDays, d.day];
                        setLocalSettings({ ...localSettings, workingDays: next });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        isChecked
                          ? 'bg-rose-500 text-white'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pix & Deposit */}
            <div className="pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Chave Pix para Sinal
                </label>
                <input
                  type="text"
                  placeholder="CPF, Telefone, E-mail ou Aleatória"
                  value={localSettings.pixKey || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, pixKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Senha de Acesso Privado
                </label>
                <input
                  type="text"
                  value={localSettings.adminPassword}
                  onChange={(e) => setLocalSettings({ ...localSettings, adminPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-3 bg-stone-900 hover:bg-black text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingSettings ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Discreet Database integration settings (clean, zero alerts, zero SQL shown) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-stone-700" />
                <h3 className="font-display text-lg font-bold text-stone-900">
                  Armazenamento de Dados & Nuvem
                </h3>
              </div>
              {dbSavedSuccess && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Conexão atualizada
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              O sistema sincroniza automaticamente todos os agendamentos e serviços. Caso possua uma URL e Chave do Supabase para guardar informações externamente, insira abaixo. O sistema opera de forma transparente e contínua.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                  URL do Projeto Supabase
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.supabase.co"
                  value={customSupabaseUrl}
                  onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                  Chave Anon Pública
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={customSupabaseKey}
                  onChange={(e) => setCustomSupabaseKey(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveDbConfig}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Salvar Conexão de Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Appointment Modal */}
      <NewManualAppointmentModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setManualPresetTime(undefined);
        }}
        services={services}
        settings={settings}
        onSave={onSaveManualAppointment}
        defaultDate={selectedDate}
        defaultTime={manualPresetTime}
      />

      {/* Block Slot Modal */}
      <BlockSlotModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSave={onSaveBlockedSlot}
        defaultDate={selectedDate}
      />
    </div>
  );
};
