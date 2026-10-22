import { createAdminClient } from '@/lib/supabase/admin';
import { sendReviewRequest } from '@/lib/resend';
import { format, subHours } from 'date-fns';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const twoHoursAgo = format(subHours(new Date(), 2), 'HH:mm');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, client_email, client_name, professional_id')
    .eq('date', today)
    .eq('status', 'completed')
    .lt('end_time', twoHoursAgo);

  if (!bookings || bookings.length === 0) {
    return Response.json({ sent: 0 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  let sent = 0;

  for (const booking of bookings) {
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking.id)
      .single();

    if (existingReview) continue;

    const { data: prof } = await supabase
      .from('professional')
      .select('business_name')
      .eq('id', booking.professional_id)
      .single();

    try {
      await sendReviewRequest(
        booking.client_email,
        booking.client_name,
        prof?.business_name ?? '',
        booking.id,
        appUrl
      );
      sent++;
    } catch {
      // Continue with other bookings
    }
  }

  return Response.json({ sent });
}
