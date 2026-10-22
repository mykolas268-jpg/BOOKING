'use client';

import { CheckCircle, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDuration, generateICSContent } from '@/lib/utils';
import type { Service } from '@/lib/types';
import Link from 'next/link';

interface BookingSuccessProps {
  service: Service;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  businessName: string;
  address: string | null;
}

export function BookingSuccess({
  service,
  date,
  startTime,
  endTime,
  clientName,
  businessName,
  address,
}: BookingSuccessProps) {
  function downloadICS() {
    const ics = generateICSContent(service.name, date, startTime, endTime, businessName, address);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vizitas.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-success" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-2">Vizitas patvirtintas!</h2>
        <p className="text-muted-foreground">Sveiki, {clientName}. Patvirtinimo el. laiškas išsiųstas.</p>
      </div>
      <div className="bg-muted/50 rounded-xl p-5 text-left space-y-2 text-sm">
        <p><span className="text-muted-foreground">Paslauga:</span> <strong>{service.name}</strong></p>
        <p><span className="text-muted-foreground">Data:</span> <strong>{date}</strong></p>
        <p><span className="text-muted-foreground">Laikas:</span> <strong>{startTime} — {endTime}</strong></p>
        <p><span className="text-muted-foreground">Trukmė:</span> <strong>{formatDuration(service.duration_min)}</strong></p>
        <p><span className="text-muted-foreground">Kaina:</span> <strong>{formatPrice(service.price_cents)}</strong></p>
        {address && <p><span className="text-muted-foreground">Adresas:</span> <strong>{address}</strong></p>}
      </div>
      <div className="flex flex-col gap-3">
        <Button onClick={downloadICS} variant="outline" className="w-full">
          <CalendarPlus className="h-4 w-4" />
          Pridėti į kalendorių
        </Button>
        <Link href="/">
          <Button variant="ghost" className="w-full">Grįžti į pradžią</Button>
        </Link>
      </div>
    </div>
  );
}
