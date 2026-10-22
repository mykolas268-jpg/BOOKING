'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Professional } from '@/lib/types';
import { Loader2, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    id: '',
    name: '',
    business_name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    logo_url: '',
    cover_image: '',
  });

  const [passwords, setPasswords] = useState({ newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('professional').select('*').limit(1).single();
      if (data) {
        setForm({
          id: data.id,
          name: data.name,
          business_name: data.business_name,
          description: data.description || '',
          phone: data.phone || '',
          email: data.email,
          address: data.address || '',
          logo_url: data.logo_url || '',
          cover_image: data.cover_image || '',
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const { error } = await supabase
      .from('professional')
      .update({
        name: form.name,
        business_name: form.business_name,
        description: form.description || null,
        phone: form.phone || null,
        email: form.email,
        address: form.address || null,
        logo_url: form.logo_url || null,
        cover_image: form.cover_image || null,
      })
      .eq('id', form.id);

    setSaving(false);
    setMsg(error ? 'Klaida išsaugant' : 'Išsaugota');
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleUpload(field: 'logo_url' | 'cover_image', file: File) {
    const ext = file.name.split('.').pop();
    const path = `${field}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('public').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      alert('Klaida įkeliant failą');
      return;
    }

    const { data: urlData } = supabase.storage.from('public').getPublicUrl(path);
    setForm((prev) => ({ ...prev, [field]: urlData.publicUrl }));
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg('');

    if (passwords.newPw !== passwords.confirm) {
      setPwMsg('Slaptažodžiai nesutampa');
      return;
    }
    if (passwords.newPw.length < 6) {
      setPwMsg('Slaptažodis per trumpas (min. 6 simboliai)');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: passwords.newPw });
    if (error) {
      setPwMsg('Klaida keičiant slaptažodį');
      return;
    }

    setPwMsg('Slaptažodis pakeistas');
    setPasswords({ newPw: '', confirm: '' });
    setTimeout(() => setPwMsg(''), 3000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-6">Nustatymai</h1>

      <form onSubmit={handleSave} className="space-y-4 mb-10">
        <div>
          <label className="block text-sm font-medium mb-1">Vardas</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Verslo pavadinimas</label>
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Aprašymas</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Telefonas</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">El. paštas</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresas</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Logotipas</label>
          {form.logo_url && (
            <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-cover mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload('logo_url', f);
            }}
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Viršelio nuotrauka</label>
          {form.cover_image && (
            <img src={form.cover_image} alt="Cover" className="h-24 w-full rounded-lg object-cover mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload('cover_image', f);
            }}
            className="text-sm"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Išsaugoti
          </button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </form>

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-medium mb-4">Keisti slaptažodį</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Naujas slaptažodis</label>
            <input
              type="password"
              value={passwords.newPw}
              onChange={(e) => setPasswords({ ...passwords, newPw: e.target.value })}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pakartokite slaptažodį</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Pakeisti
            </button>
            {pwMsg && <span className="text-sm text-muted-foreground">{pwMsg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
