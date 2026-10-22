import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parse, addMinutes, isBefore, isEqual } from 'date-fns';
import type { WorkingHours, Break, Booking, TimeSlot } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} val. ${m} min` : `${h} val.`;
}

const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Europe/Vilnius';

export function getTimezone(): string {
  return TIMEZONE;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function generateTimeSlots(
  workingHours: WorkingHours | undefined,
  breaks: Break[],
  existingBookings: Booking[],
  serviceDurationMin: number
): TimeSlot[] {
  if (!workingHours || !workingHours.is_working) return [];

  const workStart = timeToMinutes(workingHours.start_time);
  const workEnd = timeToMinutes(workingHours.end_time);

  const blockedRanges: Array<{ start: number; end: number }> = [];

  for (const b of breaks) {
    blockedRanges.push({
      start: timeToMinutes(b.start_time),
      end: timeToMinutes(b.end_time),
    });
  }

  for (const booking of existingBookings) {
    if (booking.status === 'cancelled') continue;
    blockedRanges.push({
      start: timeToMinutes(booking.start_time),
      end: timeToMinutes(booking.end_time),
    });
  }

  blockedRanges.sort((a, b) => a.start - b.start);

  const slots: TimeSlot[] = [];
  const step = 15;

  for (let slotStart = workStart; slotStart + serviceDurationMin <= workEnd; slotStart += step) {
    const slotEnd = slotStart + serviceDurationMin;

    const overlaps = blockedRanges.some(
      (range) => slotStart < range.end && slotEnd > range.start
    );

    if (!overlaps) {
      slots.push({
        start: minutesToTime(slotStart),
        end: minutesToTime(slotEnd),
        available: true,
      });
    }
  }

  return slots;
}

export function generateICSContent(
  serviceName: string,
  date: string,
  startTime: string,
  endTime: string,
  businessName: string,
  address: string | null
): string {
  const startDate = parse(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
  const endDate = parse(`${date} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

  const formatICS = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Booking//LT',
    'BEGIN:VEVENT',
    `DTSTART;TZID=${TIMEZONE}:${formatICS(startDate)}`,
    `DTEND;TZID=${TIMEZONE}:${formatICS(endDate)}`,
    `SUMMARY:${serviceName} — ${businessName}`,
    address ? `LOCATION:${address}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function getDayName(day: number): string {
  const days = [
    'Pirmadienis',
    'Antradienis',
    'Trečiadienis',
    'Ketvirtadienis',
    'Penktadienis',
    'Šeštadienis',
    'Sekmadienis',
  ];
  return days[day] || '';
}

export function getShortDayName(day: number): string {
  const days = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];
  return days[day] || '';
}
