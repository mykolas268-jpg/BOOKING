'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/booking/service-card';
import { BookingCalendar } from '@/components/booking/calendar';
import { TimeSlots } from '@/components/booking/time-slots';
import { ClientForm } from '@/components/booking/client-form';
import { BookingSuccess } from '@/components/booking/booking-success';
import { useToast } from '@/components/ui/toast';
import type { Service, Professional, TimeSlot } from '@/lib/types';

type Step = 'service' | 'datetime' | 'info' | 'confirm' | 'success';

const stepTitles: Record<Step, string> = {
  service: 'Pasirinkite paslaugą',
  datetime: 'Pasirinkite datą ir laiką',
  info: 'Jūsų kontaktai',
  confirm: 'Patvirtinimas',
  success: '',
};

export default function BookingPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('service');
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientData, setClientData] = useState<{
    name: string;
    email: string;
    phone: string;
    notes: string;
  } | null>(null);
  const [bookingResult, setBookingResult] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: profs } = await supabase.from('professional').select('*').limit(1);
      const prof = profs?.[0] ?? null;
      setProfessional(prof);

      if (prof) {
        const { data: svc } = await supabase
          .from('services')
          .select('*')
          .eq('professional_id', prof.id)
          .eq('is_active', true)
          .order('sort_order');
        setServices(svc || []);

        const { data: blocked } = await supabase
          .from('blocked_dates')
          .select('date')
          .eq('professional_id', prof.id);
        setBlockedDates((blocked || []).map((b: { date: string }) => b.date));
      }
      setLoading(false);
    }

    load();
  }, []);

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedSlot || !clientData || !professional) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: professional.id,
          serviceId: selectedService.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: selectedSlot.start,
          clientName: clientData.name,
          clientEmail: clientData.email,
          clientPhone: clientData.phone,
          notes: clientData.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || 'Įvyko klaida', 'error');
        setSubmitting(false);
        return;
      }

      setBookingResult({ id: data.bookingId });
      setStep('success');
    } catch {
      toast('Nepavyko užregistruoti vizito', 'error');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen p-8">
        <p className="text-muted-foreground">Sistema nesukonfigūruota.</p>
      </div>
    );
  }

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {step !== 'success' && step !== 'service' && (
            <button
              type="button"
              onClick={() => {
                if (step === 'datetime') { setStep('service'); setSelectedDate(null); setSelectedSlot(null); }
                else if (step === 'info') setStep('datetime');
                else if (step === 'confirm') setStep('info');
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Atgal
            </button>
          )}
          <h1 className="text-lg font-semibold text-muted-foreground mb-1">
            {professional.business_name}
          </h1>
          {step !== 'success' && (
            <>
              <h2 className="text-2xl font-bold">{stepTitles[step]}</h2>
              {/* Step indicator */}
              <div className="flex gap-1.5 mt-4">
                {(['service', 'datetime', 'info', 'confirm'] as const).map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= ['service', 'datetime', 'info', 'confirm'].indexOf(step)
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'service' && (
              <div className="space-y-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    selected={selectedService?.id === service.id}
                    onSelect={() => {
                      setSelectedService(service);
                      setSelectedDate(null);
                      setSelectedSlot(null);
                      setStep('datetime');
                    }}
                  />
                ))}
              </div>
            )}

            {step === 'datetime' && selectedService && (
              <div className="space-y-6">
                <BookingCalendar
                  selectedDate={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedSlot(null);
                  }}
                  blockedDates={blockedDates}
                />
                {selectedDate && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Laisvi laikai</h3>
                    <TimeSlots
                      professionalId={professional.id}
                      serviceId={selectedService.id}
                      date={dateStr}
                      selectedSlot={selectedSlot}
                      onSelect={(slot) => {
                        setSelectedSlot(slot);
                        setStep('info');
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {step === 'info' && (
              <ClientForm
                onSubmit={(data) => {
                  setClientData(data);
                  setStep('confirm');
                }}
                onBack={() => setStep('datetime')}
              />
            )}

            {step === 'confirm' && selectedService && selectedSlot && clientData && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-xl p-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paslauga</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">{dateStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Laikas</span>
                    <span className="font-medium">{selectedSlot.start} — {selectedSlot.end}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trukmė</span>
                    <span className="font-medium">{formatDuration(selectedService.duration_min)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-muted-foreground">Kaina</span>
                    <span className="font-semibold text-base">{formatPrice(selectedService.price_cents)}</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-5 space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Vardas:</span> {clientData.name}</p>
                  <p><span className="text-muted-foreground">El. paštas:</span> {clientData.email}</p>
                  <p><span className="text-muted-foreground">Telefonas:</span> {clientData.phone}</p>
                  {clientData.notes && (
                    <p><span className="text-muted-foreground">Pastabos:</span> {clientData.notes}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('info')} className="flex-1">
                    Atgal
                  </Button>
                  <Button onClick={handleSubmit} loading={submitting} className="flex-1">
                    Patvirtinti
                  </Button>
                </div>
              </div>
            )}

            {step === 'success' && selectedService && selectedSlot && clientData && (
              <BookingSuccess
                service={selectedService}
                date={dateStr}
                startTime={selectedSlot.start}
                endTime={selectedSlot.end}
                clientName={clientData.name}
                businessName={professional.business_name}
                address={professional.address}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
