export const instant = false;

import { createClient } from '@/lib/supabase/server';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, TrendingUp, Star, Users } from 'lucide-react';
import { StatsCard } from '@/components/admin/stats-card';
import { BookingActions } from '@/components/admin/booking-actions';
import type { BookingStatus } from '@/lib/types';

const statusLabels: Record<BookingStatus, string> = {
  confirmed: 'Patvirtinta',
  completed: 'Atlikta',
  cancelled: 'Atšaukta',
  no_show: 'Neatvyko',
};

const statusColors: Record<BookingStatus, string> = {
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  no_show: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const [todayBookings, weekCount, monthCount, avgRating] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, service:services(*)')
      .eq('date', today)
      .order('start_time'),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .neq('status', 'cancelled'),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .neq('status', 'cancelled'),
    supabase.from('reviews').select('rating'),
  ]);

  const bookings = todayBookings.data || [];
  const ratings = avgRating.data || [];
  const avg =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : '—';

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Skydelis</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={Calendar} label="Šiandien" value={bookings.filter(b => b.status !== 'cancelled').length} />
        <StatsCard icon={TrendingUp} label="Šią savaitę" value={weekCount.count ?? 0} />
        <StatsCard icon={Users} label="Šį mėnesį" value={monthCount.count ?? 0} />
        <StatsCard icon={Star} label="Vidutinis įvertinimas" value={avg} />
      </div>

      <h2 className="text-lg font-medium mb-4">Šiandienos rezervacijos</h2>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground text-sm">Šiandien rezervacijų nėra.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm font-mono">
                  {booking.start_time.slice(0, 5)}
                </div>
                <div>
                  <p className="text-sm font-medium">{booking.client_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.service?.name || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[booking.status as BookingStatus]}`}
                >
                  {statusLabels[booking.status as BookingStatus]}
                </span>
                <BookingActions bookingId={booking.id} currentStatus={booking.status} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
