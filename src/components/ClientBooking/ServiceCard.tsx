import React from 'react';
import { Service } from '../../types';
import { formatCurrency, formatDuration } from '../../lib/utils';
import { Check, Clock, Sparkles } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onToggle: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  onToggle,
}) => {
  return (
    <div
      onClick={() => onToggle(service)}
      className={`relative group cursor-pointer rounded-2xl p-5 border transition-all duration-200 select-none ${
        isSelected
          ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/20 shadow-md'
          : 'bg-white border-stone-200 hover:border-rose-200 hover:shadow-md'
      }`}
    >
      {/* Popular tag */}
      {service.popular && (
        <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-xs">
          <Sparkles className="w-3 h-3" />
          Mais Pedido
        </span>
      )}

      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        <div
          className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
            isSelected
              ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
              : 'border-stone-300 group-hover:border-rose-300 bg-stone-50'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
            <h3
              className={`font-semibold text-base transition-colors ${
                isSelected ? 'text-rose-950 font-bold' : 'text-stone-900 group-hover:text-rose-700'
              }`}
            >
              {service.name}
            </h3>
            <span className="text-lg font-bold text-stone-900 whitespace-nowrap">
              {formatCurrency(service.price)}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed mb-3 line-clamp-2">
            {service.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1 text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              {formatDuration(service.durationMinutes)}
            </span>

            <span className="capitalize text-stone-400 text-[11px]">
              {service.category === 'tradicional'
                ? 'Tradicional'
                : service.category === 'alongamento'
                ? 'Alongamento & Gel'
                : service.category === 'spa'
                ? 'Cuidados & Spa'
                : 'Nail Art & Decoração'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
