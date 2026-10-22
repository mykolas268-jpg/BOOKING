import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTimeSlots } from '@/lib/utils';
import { sendBookingConfirmation } from '@/lib/resend';
import { getDay, parse, format, addMinutes } from 'date-fns';

function toDayOfWeek(date: Date): number {
  return (getDay(date) + 6) % 7;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const professionalId = searchParams.get('professionalId');
  const serviceId = searchParams.get('serviceId');
  const date = searchParams.get('date');

  if (!professionalId || !serviceId || !date) {
    return Response.json(
      { error: 'Trūksta parametrų' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
  const dayOfWeek = toDayOfWeek(parsedDate);

  const [
    { data: service },
    { data: workingHoursArr },
    { data: breaks },
    { data: blockedDates },
    { data: bookings },
  ] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single(),
    supabase
      .from('working_hours')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('day_of_week', dayOfWeek),
    supabase
      .from('breaks')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('day_of_week', dayOfWeek),
    supabase
      .from('blocked_dates')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('date', date),
    supabase
      .from('bookings')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('date', date)
      .neq('status', 'cancelled'),
  ]);

  if (!service) {
    return Response.json({ error: 'Paslauga nerasta' }, { status: 404 });
  }

  if (blockedDates && blockedDates.length > 0) {
    return Response.json({ slots: [], blocked: true });
  }

  const workingHours = workingHoursArr?.[0] ?? undefined;
  const slots = generateTimeSlots(
    workingHours,
    breaks ?? [],
    bookings ?? [],
    service.duration_min
  );

  return Response.json({ slots });
}

export async function POST(request: NextRequest) {
  let body: {
    professionalId: string;
    serviceId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    date: string;
    startTime: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Neteisingi duomenys' }, { status: 400 });
  }

  const {
    professionalId,
    serviceId,
    clientName,
    clientEmail,
    clientPhone,
    date,
    startTime,
    notes,
  } = body;

  if (!professionalId || !serviceId || !clientName || !clientEmail || !clientPhone || !date || !startTime) {
    return Response.json({ error: 'Užpildykite visus laukus' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (!service) {
    return Response.json({ error: 'Paslauga nerasta' }, { status: 404 });
  }

  const startDate = parse(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
  const endDate = addMinutes(startDate, service.duration_min);
  const endTime = format(endDate, 'HH:mm');

  const { data: bookingId, error } = await supabase.rpc('create_booking', {
    p_professional_id: professionalId,
    p_service_id: serviceId,
    p_client_name: clientName,
    p_client_email: clientEmail,
    p_client_phone: clientPhone,
    p_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
    p_notes: notes || null,
  });

  if (error) {
    return Response.json(
      { error: error.message.includes('užimtas') ? 'Pasirinktas laikas jau užimtas' : 'Klaida kuriant rezervaciją' },
      { status: 409 }
    );
  }

  const { data: professional } = await supabase
    .from('professional')
    .select('*')
    .eq('id', professionalId)
    .single();

  sendBookingConfirmation({
    clientName,
    clientEmail,
    serviceName: service.name,
    date,
    startTime,
    endTime,
    durationMin: service.duration_min,
    priceCents: service.price_cents,
    businessName: professional?.business_name ?? '',
    address: professional?.address ?? null,
    phone: professional?.phone ?? null,
  }).catch(() => {});

  return Response.json({ bookingId, success: true });
}
