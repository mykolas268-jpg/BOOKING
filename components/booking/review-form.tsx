'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/shared/star-rating';
import { useToast } from '@/components/ui/toast';
import { CheckCircle } from 'lucide-react';

interface ReviewFormProps {
  bookingId: string;
  businessName: string;
}

export function ReviewForm({ bookingId, businessName }: ReviewFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast('Pasirinkite įvertinimą', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || 'Nepavyko pateikti atsiliepimo', 'error');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      toast('Įvyko klaida', 'error');
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle className="h-16 w-16 text-success mx-auto" />
        <h2 className="text-2xl font-semibold">Ačiū už atsiliepimą!</h2>
        <p className="text-muted-foreground">Jūsų nuomonė labai svarbi.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold mb-2">{businessName}</h1>
        <p className="text-muted-foreground">Kaip vertinate apsilankymą?</p>
      </div>
      <div className="flex justify-center">
        <StarRating rating={rating} size={36} interactive onChange={setRating} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment">Komentaras (neprivaloma)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Papasakokite apie savo patirtį..."
          rows={4}
        />
      </div>
      <Button type="submit" loading={submitting} className="w-full" size="lg">
        Pateikti atsiliepimą
      </Button>
    </form>
  );
}
