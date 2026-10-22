import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Neautorizuotas' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return Response.json({ error: 'Nepateiktas failas' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const adminClient = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await adminClient.storage
    .from('images')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return Response.json({ error: 'Klaida įkeliant failą' }, { status: 500 });
  }

  const { data: urlData } = adminClient.storage
    .from('images')
    .getPublicUrl(filePath);

  return Response.json({ url: urlData.publicUrl });
}
