'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookingActions } from '@/components/admin/booking-actions';
import { formatPrice, formatDuration, getDayName } from '@/lib/utils';
import type { Booking, Service, BookingStatus } from '@/lib/types';
import { Plus, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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

const PER_PAGE = 20;

export default function AdminBookingsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<(Booking & { service?: Service })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    service_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    date: '',
    start_time: '',
    notes: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select('*, service:services(*)', { count: 'exact' })
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1);

    if (filterStatus) query = query.eq('status', filterStatus);
    if (filterService) query = query.eq('service_id', filterService);
    if (filterDateFrom) query = query.gte('date', filterDateFrom);
    if (filterDateTo) query = query.lte('date', filterDateTo);

    const { data, count } = await query;
    setBookings((data as (Booking & { service?: Service })[]) || []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, filterStatus, filterService, filterDateFrom, filterDateTo]);

  useEffect(() => {
    supabase.from('services').select('*').order('sort_order').then(({ data }) => {
      setServices(data || []);
    });
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleAddBooking(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);

    const service = services.find((s) => s.id === addForm.service_id);
    if (!service) return;

    const [h, m] = addForm.start_time.split(':').map(Number);
    const endMin = h * 60 + m + service.duration_min;
    const endTime = `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;

    const { data: profData } = await supabase.from('professional').select('id').limit(1).single();

    const { error } = await supabase.rpc('create_booking', {
      p_professional_id: profData?.id,
      p_service_id: addForm.service_id,
      p_client_name: addForm.client_name,
      p_client_email: addForm.client_email,
      p_client_phone: addForm.client_phone,
      p_date: addForm.date,
      p_start_time: addForm.start_time,
      p_end_time: endTime,
      p_notes: addForm.notes || null,
    });

    setAddLoading(false);
    if (error) {
      alert(error.message);
      return;
    }

    setShowAdd(false);
    setAddForm({ service_id: '', client_name: '', client_email: '', client_phone: '', date: '', start_time: '', notes: '' });
    fetchBookings();
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Rezervacijos</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Pridėti
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Visos būsenos</option>
          <option value="confirmed">Patvirtinta</option>
          <option value="completed">Atlikta</option>
          <option value="cancelled">Atšaukta</option>
          <option value="no_show">Neatvyko</option>
        </select>
        <select
          value={filterService}
          onChange={(e) => { setFilterService(e.target.value); setPage(0); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Visos paslaugos</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="Nuo"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => { setFilterDateTo(e.target.value); setPage(0); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="Iki"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">Rezervacijų nerasta.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Data</th>
                  <th className="pb-3 font-medium text-muted-foreground">Laikas</th>
                  <th className="pb-3 font-medium text-muted-foreground">Klientas</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Telefonas</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Paslauga</th>
                  <th className="pb-3 font-medium text-muted-foreground">Būsena</th>
                  <th className="pb-3 font-medium text-muted-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="py-3">{b.date}</td>
                    <td className="py-3 font-mono">{b.start_time.slice(0, 5)}</td>
                    <td className="py-3">{b.client_name}</td>
                    <td className="py-3 hidden md:table-cell text-muted-foreground">{b.client_phone}</td>
                    <td className="py-3 hidden sm:table-cell">{b.service?.name || '—'}</td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status]}`}>
                        {statusLabels[b.status]}
                      </span>
                    </td>
                    <td className="py-3">
                      <BookingActions bookingId={b.id} currentStatus={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} iš {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Atgal
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Pirmyn
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Booking Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border p-6 mx-4">
            <h2 className="text-lg font-semibold mb-4">Nauja rezervacija</h2>
            <form onSubmit={handleAddBooking} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Paslauga</label>
                <select
                  value={addForm.service_id}
                  onChange={(e) => setAddForm({ ...addForm, service_id: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pasirinkite</option>
                  {services.filter(s => s.is_active).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatDuration(s.duration_min)}, {formatPrice(s.price_cents)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vardas</label>
                <input
                  type="text"
                  value={addForm.client_name}
                  onChange={(e) => setAddForm({ ...addForm, client_name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">El. paštas</label>
                  <input
                    type="email"
                    value={addForm.client_email}
                    onChange={(e) => setAddForm({ ...addForm, client_email: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefonas</label>
                  <input
                    type="tel"
                    value={addForm.client_phone}
                    onChange={(e) => setAddForm({ ...addForm, client_phone: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Laikas</label>
                  <input
                    type="time"
                    value={addForm.start_time}
                    onChange={(e) => setAddForm({ ...addForm, start_time: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pastabos</label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 rounded-lg border border-input px-4 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {addLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sukurti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
