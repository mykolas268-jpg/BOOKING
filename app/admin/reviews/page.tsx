export const instant = false;

import { createClient } from '@/lib/supabase/server';
import { Star } from 'lucide-react';
import { ReviewToggle } from './review-toggle';

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  const allReviews = reviews || [];
  const avg =
    allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Atsiliepimai</h1>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span className="text-lg font-semibold">{avg}</span>
          <span className="text-sm text-muted-foreground">({allReviews.length})</span>
        </div>
      </div>

      {allReviews.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">Atsiliepimų dar nėra.</p>
      ) : (
        <div className="space-y-3">
          {allReviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-xl border border-border bg-card p-4 ${
                !review.is_visible ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{review.client_name}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(review.created_at).toLocaleDateString('lt-LT')}
                  </p>
                </div>
                <ReviewToggle reviewId={review.id} isVisible={review.is_visible} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
