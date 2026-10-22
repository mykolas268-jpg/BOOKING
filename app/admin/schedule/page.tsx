'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDayName } from '@/lib/utils';
import type { WorkingHours, Break, BlockedDate } from '@/lib/types';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';

export default function AdminSchedulePage() {
  const supabase = createClient();
  const [profId, setProfId] = useState('');
  const [hours, setHours] = useState<WorkingHours[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase.from('professional').select('id').limit(1).single();
      if (!prof) { setLoading(false); return; }
      setProfId(prof.id);

      const [hRes, bRes, bdRes] = await Promise.all([
        supabase.from('working_hours').select('*').eq('professional_id', prof.id).order('day_of_week'),
        supabase.from('breaks').select('*').eq('professional_id', prof.id).order('day_of_week'),
        supabase.from('blocked_dates').select('*').eq('professional_id', prof.id).order('date'),
      ]);

      let wh = hRes.data || [];
      if (wh.length === 0) {
        wh = Array.from({ length: 7 }, (_, i) => ({
          id: `new-${i}`,
          professional_id: prof.id,
          day_of_week: i,
          start_time: '09:00',
          end_time: '18:00',
          is_working: i < 5,
        }));
      }

      setHours(wh);
      setBreaks(bRes.data || []);
      setBlockedDates(bdRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  function updateHour(dayOfWeek: number, field: string, value: string | boolean) {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
  }

  function addBreak(dayOfWeek: number) {
    setBreaks((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        professional_id: profId,
        day_of_week: dayOfWeek,
        start_time: '12:00',
        end_time: '13:00',
      },
    ]);
  }

  function updateBreak(id: string, field: string, value: string) {
    setBreaks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  }

  function removeBreak(id: string) {
    setBreaks((prev) => prev.filter((b) => b.id !== id));
  }

  async function saveSchedule() {
    setSaving(true);

    await supabase.from('working_hours').delete().eq('professional_id', profId);
    const whInserts = hours.map((h) => ({
      professional_id: profId,
      day_of_week: h.day_of_week,
      start_time: h.start_time,
      end_time: h.end_time,
      is_working: h.is_working,
    }));
    await supabase.from('working_hours').insert(whInserts);

    await supabase.from('breaks').delete().eq('professional_id', profId);
    const brInserts = breaks.map((b) => ({
      professional_id: profId,
      day_of_week: b.day_of_week,
      start_time: b.start_time,
      end_time: b.end_time,
    }));
    if (brInserts.length > 0) {
      await supabase.from('breaks').insert(brInserts);
    }

    const [hRes, bRes] = await Promise.all([
      supabase.from('working_hours').select('*').eq('professional_id', profId).order('day_of_week'),
      supabase.from('breaks').select('*').eq('professional_id', profId).order('day_of_week'),
    ]);
    setHours(hRes.data || []);
    setBreaks(bRes.data || []);
    setSaving(false);
  }

  async function addBlockedDate() {
    if (!newBlockDate) return;
    await supabase.from('blocked_dates').insert({
      professional_id: profId,
      date: newBlockDate,
      reason: newBlockReason || null,
    });
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('professional_id', profId)
      .order('date');
    setBlockedDates(data || []);
    setNewBlockDate('');
    setNewBlockReason('');
  }

  async function removeBlockedDate(id: string) {
    await supabase.from('blocked_dates').delete().eq('id', id);
    setBlockedDates((prev) => prev.filter((d) => d.id !== id));
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
        <h1 className="text-xl font-semibold">Tvarkaraštis</h1>
        <button
          onClick={saveSchedule}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Išsaugoti
        </button>
      </div>

      {/* Working hours */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Darbo valandos</h2>
        <div className="space-y-2">
          {hours.map((h) => (
            <div
              key={h.day_of_week}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <label className="flex items-center gap-2 min-w-[140px]">
                <input
                  type="checkbox"
                  checked={h.is_working}
                  onChange={(e) => updateHour(h.day_of_week, 'is_working', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">{getDayName(h.day_of_week)}</span>
              </label>
              {h.is_working && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.start_time}
                    onChange={(e) => updateHour(h.day_of_week, 'start_time', e.target.value)}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <span className="text-muted-foreground">—</span>
                  <input
                    type="time"
                    value={h.end_time}
                    onChange={(e) => updateHour(h.day_of_week, 'end_time', e.target.value)}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Breaks */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Pertraukos</h2>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const wh = hours.find((h) => h.day_of_week === day);
            if (!wh?.is_working) return null;
            const dayBreaks = breaks.filter((b) => b.day_of_week === day);
            return (
              <div key={day} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{getDayName(day)}</span>
                  <button
                    onClick={() => addBreak(day)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Pridėti
                  </button>
                </div>
                {dayBreaks.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nėra pertraukų</p>
                )}
                {dayBreaks.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 mt-2">
                    <input
                      type="time"
                      value={b.start_time}
                      onChange={(e) => updateBreak(b.id, 'start_time', e.target.value)}
                      className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    />
                    <span className="text-muted-foreground">—</span>
                    <input
                      type="time"
                      value={b.end_time}
                      onChange={(e) => updateBreak(b.id, 'end_time', e.target.value)}
                      className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => removeBreak(b.id)}
                      className="p-1 text-destructive hover:bg-secondary rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Blocked dates */}
      <section>
        <h2 className="text-lg font-medium mb-4">Nedarbo dienos</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="date"
            value={newBlockDate}
            onChange={(e) => setNewBlockDate(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={newBlockReason}
            onChange={(e) => setNewBlockReason(e.target.value)}
            placeholder="Priežastis (pvz. Atostogos)"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm flex-1 min-w-[200px]"
          />
          <button
            onClick={addBlockedDate}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Pridėti
          </button>
        </div>
        {blockedDates.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nėra pažymėtų nedarbo dienų.</p>
        ) : (
          <div className="space-y-2">
            {blockedDates.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium">{d.date}</span>
                  {d.reason && (
                    <span className="text-sm text-muted-foreground ml-2">— {d.reason}</span>
                  )}
                </div>
                <button
                  onClick={() => removeBlockedDate(d.id)}
                  className="p-1 text-destructive hover:bg-secondary rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
