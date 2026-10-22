'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDuration } from '@/lib/utils';
import type { Service } from '@/lib/types';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

const durationOptions = [15, 30, 45, 60, 90, 120];

export default function AdminServicesPage() {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    duration_min: 30,
    price: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  async function fetchServices() {
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('sort_order')
      .order('created_at');
    setServices(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchServices();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm({ name: '', description: '', duration_min: 30, price: '', is_active: true });
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      duration_min: service.duration_min,
      price: (service.price_cents / 100).toFixed(2),
      is_active: service.is_active,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const priceCents = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      alert('Netinkama kaina');
      setSaving(false);
      return;
    }

    const { data: profData } = await supabase.from('professional').select('id').limit(1).single();

    if (editingId) {
      await supabase
        .from('services')
        .update({
          name: form.name,
          description: form.description || null,
          duration_min: form.duration_min,
          price_cents: priceCents,
          is_active: form.is_active,
        })
        .eq('id', editingId);
    } else {
      const maxOrder = services.length > 0 ? Math.max(...services.map((s) => s.sort_order)) : -1;
      await supabase.from('services').insert({
        professional_id: profData?.id,
        name: form.name,
        description: form.description || null,
        duration_min: form.duration_min,
        price_cents: priceCents,
        is_active: form.is_active,
        sort_order: maxOrder + 1,
      });
    }

    setSaving(false);
    setShowForm(false);
    fetchServices();
  }

  async function handleDelete(id: string) {
    if (!confirm('Ar tikrai norite ištrinti šią paslaugą?')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      alert('Negalima ištrinti paslaugos, kuri turi būsimų rezervacijų.');
      return;
    }
    fetchServices();
  }

  async function toggleActive(service: Service) {
    await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id);
    fetchServices();
  }

  async function moveOrder(id: string, direction: 'up' | 'down') {
    const idx = services.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= services.length) return;

    const a = services[idx];
    const b = services[swapIdx];

    await Promise.all([
      supabase.from('services').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('services').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    fetchServices();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Paslaugos</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Nauja paslauga
        </button>
      </div>

      {services.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">
          Paslaugų dar nėra. Pridėkite pirmąją.
        </p>
      ) : (
        <div className="space-y-2">
          {services.map((service, idx) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveOrder(service.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveOrder(service.id, 'down')}
                    disabled={idx === services.length - 1}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(service.duration_min)} · {formatPrice(service.price_cents)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(service)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    service.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {service.is_active ? 'Aktyvi' : 'Neaktyvi'}
                </button>
                <button
                  onClick={() => openEdit(service)}
                  className="rounded-md p-1.5 hover:bg-secondary transition-colors"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="rounded-md p-1.5 hover:bg-secondary transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border p-6 mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Redaguoti paslaugą' : 'Nauja paslauga'}
            </h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Pavadinimas</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="pvz. Vyriškas kirpimas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aprašymas</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Trukmė</label>
                  <select
                    value={form.duration_min}
                    onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {durationOptions.map((d) => (
                      <option key={d} value={d}>{formatDuration(d)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kaina (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    placeholder="20.00"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm">Aktyvi</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-input px-4 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Išsaugoti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
