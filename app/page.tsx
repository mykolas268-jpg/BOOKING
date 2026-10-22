export const instant = false;

import Link from 'next/link';
import { Calendar, Star, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatPrice, formatDuration } from '@/lib/utils';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { StarRating } from '@/components/shared/star-rating';
import type { Professional, Service, Review } from '@/lib/types';

export default async function Home() {
  const supabase = await createClient();

  const { data: professionals } = await supabase
    .from('professional')
    .select('*')
    .limit(1);
  const professional: Professional | null = professionals?.[0] ?? null;

  if (!professional) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Profesionalas dar nesukonfigūruotas.</p>
      </div>
    );
  }

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('professional_id', professional.id)
    .eq('is_active', true)
    .order('sort_order');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('professional_id', professional.id)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(10);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="flex flex-col min-h-full">
      <Header businessName={professional.business_name} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"
            style={
              professional.cover_image
                ? {
                    backgroundImage: `url(${professional.cover_image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          />
          {professional.cover_image && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          )}
          <div className="relative mx-auto max-w-3xl px-4 py-16 sm:py-24">
            <div className="flex flex-col items-center text-center gap-4">
              {professional.logo_url && (
                <img
                  src={professional.logo_url}
                  alt={professional.business_name}
                  className="h-20 w-20 rounded-full object-cover border-2 border-background shadow-md"
                />
              )}
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {professional.business_name}
              </h1>
              {professional.description && (
                <p className="text-muted-foreground max-w-lg text-lg">
                  {professional.description}
                </p>
              )}
              {avgRating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(avgRating)} size={18} />
                  <span className="text-sm text-muted-foreground">
                    {avgRating.toFixed(1)} ({reviews?.length} atsiliepimai)
                  </span>
                </div>
              )}
              <Link
                href="/booking"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Calendar className="h-5 w-5" />
                Registruotis
              </Link>
            </div>
          </div>
        </section>

        {/* Services */}
        {services && services.length > 0 && (
          <section className="mx-auto max-w-3xl px-4 py-12">
            <h2 className="text-2xl font-semibold mb-6">Paslaugos</h2>
            <div className="grid gap-3">
              {(services as Service[]).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-4 hover:shadow-sm transition-shadow"
                >
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(service.duration_min)}
                    </div>
                  </div>
                  <span className="font-semibold text-lg whitespace-nowrap">
                    {formatPrice(service.price_cents)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <section className="mx-auto max-w-3xl px-4 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Atsiliepimai</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-medium text-foreground">{avgRating.toFixed(1)}</span>
                <span>· {reviews.length} atsiliepimai</span>
              </div>
            </div>
            <div className="grid gap-4">
              {(reviews as Review[]).map((review) => (
                <div key={review.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{review.client_name}</span>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer
        businessName={professional.business_name}
        address={professional.address}
        phone={professional.phone}
        email={professional.email}
      />
    </div>
  );
}
