'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { BookingStatus } from '@/lib/types';
import { Check, X, Ban, Trash2, MoreVertical } from 'lucide-react';

interface BookingActionsProps {
  bookingId: string;
  currentStatus: BookingStatus;
  compact?: boolean;
}

const statusOptions: { value: BookingStatus; label: string; icon: typeof Check }[] = [
  { value: 'confirmed', label: 'Patvirtinta', icon: Check },
  { value: 'completed', label: 'Atlikta', icon: Check },
  { value: 'no_show', label: 'Neatvyko', icon: Ban },
  { value: 'cancelled', label: 'Atšaukta', icon: X },
];

export function BookingActions({ bookingId, currentStatus, compact }: BookingActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function updateStatus(status: BookingStatus) {
    setLoading(true);
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  async function deleteBooking() {
    if (!confirm('Ar tikrai norite ištrinti šią rezervaciją?')) return;
    setLoading(true);
    await supabase.from('bookings').delete().eq('id', bookingId);
    setLoading(false);
    router.refresh();
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {currentStatus === 'confirmed' && (
          <>
            <button
              onClick={() => updateStatus('completed')}
              disabled={loading}
              className="rounded-md p-1.5 text-success hover:bg-secondary transition-colors"
              title="Atlikta"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => updateStatus('no_show')}
              disabled={loading}
              className="rounded-md p-1.5 text-warning hover:bg-secondary transition-colors"
              title="Neatvyko"
            >
              <Ban className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-1.5 hover:bg-secondary transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg py-1">
            {statusOptions
              .filter((o) => o.value !== currentStatus)
              .map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateStatus(option.value)}
                  disabled={loading}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <option.icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            <div className="my-1 border-t border-border" />
            <button
              onClick={deleteBooking}
              disabled={loading}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Ištrinti
            </button>
          </div>
        </>
      )}
    </div>
  );
}
