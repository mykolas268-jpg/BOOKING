'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeSlot } from '@/lib/types';

interface TimeSlotsProps {
  professionalId: string;
  serviceId: string;
  date: string;
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}

export function TimeSlots({ professionalId, serviceId, date, selectedSlot, onSelect }: TimeSlotsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    fetch(`/api/booking?professionalId=${professionalId}&serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        setLoading(false);
      })
      .catch(() => {
        setSlots([]);
        setLoading(false);
      });
  }, [professionalId, serviceId, date]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nėra laisvų laikų šiai dienai
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.start === slot.start;
        return (
          <button
            key={slot.start}
            type="button"
            onClick={() => onSelect(slot)}
            className={cn(
              'h-10 rounded-lg border text-sm font-medium transition-all',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/30 hover:bg-accent'
            )}
          >
            {slot.start}
          </button>
        );
      })}
    </div>
  );
}
