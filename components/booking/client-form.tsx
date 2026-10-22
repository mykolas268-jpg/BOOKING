'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  onBack: () => void;
}

export function ClientForm({ onSubmit, onBack }: ClientFormProps) {
  const [form, setForm] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<ClientFormData>>({});

  function validate(): boolean {
    const e: Partial<ClientFormData> = {};
    if (!form.name.trim()) e.name = 'Privalomas laukas';
    if (!form.email.trim()) {
      e.email = 'Privalomas laukas';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Neteisingas el. pašto formatas';
    }
    if (!form.phone.trim()) e.phone = 'Privalomas laukas';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Vardas *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Jūsų vardas"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">El. paštas *</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jusu@pastas.lt"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefonas *</Label>
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+370 600 00000"
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Pastabos</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Papildoma informacija (neprivaloma)"
          rows={3}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Atgal
        </Button>
        <Button type="submit" className="flex-1">
          Tęsti
        </Button>
      </div>
    </form>
  );
}
