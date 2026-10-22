import { createAdminClient } from '@/lib/supabase/admin';
import { format } from 'date-fns';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .lt('date', today)
    .eq('status', 'confirmed')
    .select('id');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ updated: data?.length ?? 0 });
}
