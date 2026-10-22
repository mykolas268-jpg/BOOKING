'use client';

import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { Clock, Check } from 'lucide-react';
import type { Service } from '@/lib/types';

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onSelect: () => void;
}

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border-2 p-4 transition-all',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/30 hover:shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">{service.name}</h3>
          {service.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(service.duration_min)}
            </span>
            <span className="font-medium text-foreground">{formatPrice(service.price_cents)}</span>
          </div>
        </div>
        <div
          className={cn(
            'mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </div>
      </div>
    </button>
  );
}
