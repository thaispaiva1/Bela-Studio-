import React from 'react';
import { Calendar, Sparkles, Lock, Clock, Heart } from 'lucide-react';
import { StudioSettings } from '../types';

interface HeaderProps {
  settings: StudioSettings;
  activeView: 'booking' | 'admin' | 'my-appointments';
  setActiveView: (view: 'booking' | 'admin' | 'my-appointments') => void;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeView,
  setActiveView,
  isAdminLoggedIn,
  onOpenAdminLogin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <button
            onClick={() => setActiveView('booking')}
            className="flex items-center gap-3 text-left group transition-transform focus:outline-hidden"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-300 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-all">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-display text-2xl font-bold tracking-tight text-stone-900 group-hover:text-rose-700 transition-colors">
                {settings.studioName || 'Bella Studio'}
              </span>
              <p className="text-xs text-rose-500 font-medium tracking-wide flex items-center gap-1">
                <Heart className="w-3 h-3 fill-rose-400 text-rose-400 inline" />
                Nails & Beauty • por {settings.ownerName || 'Manicure'}
              </p>
            </div>
          </button>

          {/* Navigation Items */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveView('booking')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeView === 'booking'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-200 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Agendar Horário</span>
              <span className="sm:hidden">Agendar</span>
            </button>

            <button
              onClick={() => setActiveView('my-appointments')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeView === 'my-appointments'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-200 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Agendamentos</span>
              <span className="sm:hidden">Minha Agenda</span>
            </button>

            {/* Admin Entry */}
            <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block" />

            {isAdminLoggedIn ? (
              <button
                onClick={() => setActiveView('admin')}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activeView === 'admin'
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Acesso Privado</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all flex items-center gap-1.5"
                title="Acesso Privado"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-xs font-semibold uppercase tracking-wider">Acesso Privado</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
