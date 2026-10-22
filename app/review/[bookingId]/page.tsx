export const instant = false;

import { createClient } from '@/lib/supabase/server';
import { ReviewForm } from '@/components/booking/review-form';
import { CheckCircle } from 'lucide-react';

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, service:services(*)')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen p-8">
        <p className="text-muted-foreground">Vizitas nerastas.</p>
      </div>
    );
  }

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .single();

  if (existingReview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
        <CheckCircle className="h-16 w-16 text-success" />
        <h2 className="text-2xl font-semibold">Jūs jau palikote atsiliepimą</h2>
        <p className="text-muted-foreground">Dėkojame už jūsų nuomonę!</p>
      </div>
    );
  }

  const { data: professional } = await supabase
    .from('professional')
    .select('business_name')
    .eq('id', booking.professional_id)
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ReviewForm
          bookingId={bookingId}
          businessName={professional?.business_name || ''}
        />
      </div>
    </div>
  );
}
