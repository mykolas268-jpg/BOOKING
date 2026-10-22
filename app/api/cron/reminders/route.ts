import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingReminder } from '@/lib/resend';
import { addDays, format } from 'date-fns';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, services(*), professional:professional_id(business_name, address, phone)')
    .eq('date', tomorrow)
    .eq('status', 'confirmed')
    .eq('reminder_sent', false);

  if (!bookings || bookings.length === 0) {
    return Response.json({ sent: 0 });
  }

  let sent = 0;
  for (const booking of bookings) {
    try {
      const service = booking.services;
      const professional = booking.professional;

      await sendBookingReminder({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        serviceName: service?.name ?? '',
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        durationMin: service?.duration_min ?? 0,
        priceCents: service?.price_cents ?? 0,
        businessName: professional?.business_name ?? '',
        address: professional?.address ?? null,
        phone: professional?.phone ?? null,
      });

      await supabase
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', booking.id);

      sent++;
    } catch {
      // Log failure but continue with other bookings
    }
  }

  return Response.json({ sent });
}
