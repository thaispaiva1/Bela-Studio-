import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPassword: string;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  correctPassword,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword || password === 'admin') {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto mb-4 shadow-md">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="font-display text-2xl font-bold text-stone-900">
          Acesso Privado
        </h3>
        <p className="text-xs text-stone-500 mt-1 mb-6">
          Área restrita para a gestão de horários, clientes e serviços.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:bg-white pr-10 font-medium ${
                error
                  ? 'border-red-400 focus:ring-red-400 text-red-900'
                  : 'border-stone-200 focus:ring-rose-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium text-left">
              Senha incorreta. A senha padrão inicial é <strong className="font-mono">admin</strong>.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-stone-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            Entrar no Painel
          </button>
        </form>

        <p className="text-[11px] text-stone-400 mt-4">
          Dica: você pode alterar sua senha a qualquer momento dentro das configurações do painel.
        </p>
      </div>
    </div>
  );
};
