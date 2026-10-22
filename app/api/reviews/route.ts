import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  let body: { bookingId: string; rating: number; comment?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Neteisingi duomenys' }, { status: 400 });
  }

  const { bookingId, rating, comment } = body;

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    return Response.json({ error: 'Trūksta duomenų arba neteisingas įvertinimas' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, professional_id, client_name')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return Response.json({ error: 'Rezervacija nerasta' }, { status: 404 });
  }

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .single();

  if (existingReview) {
    return Response.json({ error: 'Jūs jau palikote atsiliepimą' }, { status: 409 });
  }

  const { error } = await supabase.from('reviews').insert({
    professional_id: booking.professional_id,
    booking_id: bookingId,
    client_name: booking.client_name,
    rating,
    comment: comment || null,
  });

  if (error) {
    return Response.json({ error: 'Klaida išsaugant atsiliepimą' }, { status: 500 });
  }

  return Response.json({ success: true });
}
