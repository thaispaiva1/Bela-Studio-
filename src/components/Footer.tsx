import React from 'react';
import { StudioSettings } from '../types';
import { formatPhone, generateWhatsAppLink } from '../lib/utils';
import { Sparkles, MapPin, Phone, Instagram, Clock, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  settings: StudioSettings;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdminLogin,
  isAdminLoggedIn,
}) => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-stone-800">
          {/* Column 1: Studio info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-display text-xl font-bold text-white tracking-tight">
                {settings.studioName}
              </span>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Especialista em cuidados, saúde e embelezamento das unhas com as mais modernas técnicas de alongamento, cutilagem e nail art.
            </p>

            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold pt-1">
              <Heart className="w-3.5 h-3.5 fill-rose-400 inline" />
              Atendimento personalizado por {settings.ownerName}
            </div>
          </div>

          {/* Column 2: Hours & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-400" />
              Horário de Funcionamento
            </h4>
            <p className="text-xs text-stone-400">
              Segunda a Sábado: das {settings.openTime} às {settings.closeTime}
            </p>
            <p className="text-xs text-stone-400">
              Atendimentos com hora marcada previamente agendada online.
            </p>

            <div className="pt-2 flex items-start gap-2 text-xs text-stone-300">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{settings.address}, {settings.neighborhood} - {settings.city}</span>
            </div>
          </div>

          {/* Column 3: Contact & Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-rose-400" />
              Fale Conosco
            </h4>

            <div className="space-y-2 text-xs">
              <a
                href={generateWhatsAppLink(settings.phone, 'Olá! Gostaria de mais informações sobre os serviços de unhas.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                <span>WhatsApp: {formatPhone(settings.phone)}</span>
              </a>

              {settings.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-rose-300 hover:text-rose-200 font-medium transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{settings.instagram}</span>
                </a>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenAdminLogin}
                className="text-[11px] text-stone-500 hover:text-stone-300 transition-colors uppercase tracking-wider font-semibold"
              >
                {isAdminLoggedIn ? 'Acesso Privado (Ativo)' : 'Acesso Privado'}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <span>
            © {new Date().getFullYear()} {settings.studioName}. Todos os direitos reservados.
          </span>
          <span className="flex items-center gap-1.5 text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Sistema de Agendamento Seguro & Online
          </span>
        </div>
      </div>
    </footer>
  );
};
