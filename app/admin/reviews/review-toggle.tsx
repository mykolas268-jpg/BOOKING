'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

export function ReviewToggle({ reviewId, isVisible }: { reviewId: string; isVisible: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function toggle() {
    setLoading(true);
    await supabase.from('reviews').update({ is_visible: !isVisible }).eq('id', reviewId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded-md p-1.5 hover:bg-secondary transition-colors"
      title={isVisible ? 'Slėpti' : 'Rodyti'}
    >
      {isVisible ? (
        <Eye className="h-4 w-4 text-muted-foreground" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}
