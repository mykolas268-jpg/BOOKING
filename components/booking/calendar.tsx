'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns';
import { lt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, getShortDayName } from '@/lib/utils';

interface CalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  blockedDates: string[];
}

export function BookingCalendar({ selectedDate, onSelect, blockedDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  const blockedSet = useMemo(
    () => new Set(blockedDates.map((d) => d)),
    [blockedDates]
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (isBefore(day, calEnd) || isSameDay(day, calEnd)) {
    days.push(day);
    day = addDays(day, 1);
  }

  const canGoPrev = isAfter(monthStart, today);
  const canGoNext = isBefore(endOfMonth(currentMonth), maxDate);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          disabled={!canGoPrev}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-medium capitalize">
          {format(currentMonth, 'yyyy LLLL', { locale: lt })}
        </h3>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          disabled={!canGoNext}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {getShortDayName(d)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const isPast = isBefore(d, today);
          const isFuture = isAfter(d, maxDate);
          const isBlocked = blockedSet.has(dateStr);
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);
          const disabled = !isCurrentMonth || isPast || isFuture || isBlocked;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d)}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-sm transition-all',
                !isCurrentMonth && 'invisible',
                disabled && isCurrentMonth && 'text-muted-foreground/40 cursor-not-allowed',
                !disabled && 'hover:bg-accent cursor-pointer',
                isSelected && !disabled && 'bg-primary text-primary-foreground hover:bg-primary/90',
                isToday && !isSelected && !disabled && 'ring-1 ring-primary/40'
              )}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
