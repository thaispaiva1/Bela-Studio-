/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Appointment, Service, StudioSettings, BlockedSlot } from './types';
import {
  getStoredAppointments,
  getStoredServices,
  getStoredSettings,
  getStoredBlockedSlots,
  saveNewAppointment,
  updateAppointmentStatusInStore,
  deleteAppointmentInStore,
  saveStoredSettings,
  saveAllServices,
  saveBlockedSlot,
  deleteBlockedSlot,
} from './lib/supabase';
import { Header } from './components/Header';
import { BookingWizard } from './components/ClientBooking/BookingWizard';
import { MyAppointmentsModal } from './components/ClientBooking/MyAppointmentsModal';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Footer } from './components/Footer';

export default function App() {
  const [activeView, setActiveView] = useState<'booking' | 'admin' | 'my-appointments'>('booking');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);

  // App data state
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const loadAllData = async () => {
      try {
        const [loadedSettings, loadedServices, loadedAppointments, loadedBlocked] =
          await Promise.all([
            getStoredSettings(),
            getStoredServices(),
            getStoredAppointments(),
            getStoredBlockedSlots(),
          ]);

        if (isMounted) {
          setSettings(loadedSettings);
          setServices(loadedServices);
          setAppointments(loadedAppointments);
          setBlockedSlots(loadedBlocked);
        }
      } catch {
        // Fallback handled cleanly
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAllData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handlers
  const handleCompleteBooking = async (newApt: Appointment): Promise<Appointment> => {
    const saved = await saveNewAppointment(newApt);
    setAppointments((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
    return saved;
  };

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    await updateAppointmentStatusInStore(id, status);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a))
    );
  };

  const handleDeleteAppointment = async (id: string) => {
    await deleteAppointmentInStore(id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveManualAppointment = async (newApt: Appointment) => {
    const saved = await saveNewAppointment(newApt);
    setAppointments((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
  };

  const handleSaveBlockedSlot = async (slot: BlockedSlot) => {
    await saveBlockedSlot(slot);
    setBlockedSlots((prev) => [...prev, slot]);
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    await deleteBlockedSlot(id);
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateSettings = async (newSettings: StudioSettings) => {
    await saveStoredSettings(newSettings);
    setSettings(newSettings);
  };

  const handleUpdateServices = async (newServices: Service[]) => {
    await saveAllServices(newServices);
    setServices(newServices);
  };

  const handleOpenAdminLogin = () => {
    if (isAdminLoggedIn) {
      setActiveView('admin');
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsAdminModalOpen(false);
    setActiveView('admin');
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveView('booking');
  };

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-stone-600">Carregando Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Header */}
      <Header
        settings={settings}
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'my-appointments') {
            setIsTrackerModalOpen(true);
          } else if (view === 'admin' && !isAdminLoggedIn) {
            handleOpenAdminLogin();
          } else {
            setActiveView(view);
          }
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={handleOpenAdminLogin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'admin' && isAdminLoggedIn ? (
          <AdminDashboard
            settings={settings}
            services={services}
            appointments={appointments}
            blockedSlots={blockedSlots}
            onUpdateSettings={handleUpdateSettings}
            onUpdateServices={handleUpdateServices}
            onUpdateAppointmentStatus={handleUpdateStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onSaveManualAppointment={handleSaveManualAppointment}
            onSaveBlockedSlot={handleSaveBlockedSlot}
            onDeleteBlockedSlot={handleDeleteBlockedSlot}
            onLogout={handleLogout}
            onNavigateToBooking={() => setActiveView('booking')}
          />
        ) : (
          <BookingWizard
            services={services}
            settings={settings}
            existingAppointments={appointments}
            blockedSlots={blockedSlots}
            onCompleteBooking={handleCompleteBooking}
            onOpenTracker={() => setIsTrackerModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdminLogin={handleOpenAdminLogin}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        correctPassword={settings.adminPassword}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Client Tracker Modal */}
      <MyAppointmentsModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        appointments={appointments}
        settings={settings}
        onCancelAppointment={async (id) => {
          await handleUpdateStatus(id, 'cancelado');
        }}
      />
    </div>
  );
}
