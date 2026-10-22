export interface Professional {
  id: string;
  name: string;
  business_name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string;
  logo_url: string | null;
  cover_image: string | null;
  address: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  professional_id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price_cents: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface WorkingHours {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export interface Break {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface BlockedDate {
  id: string;
  professional_id: string;
  date: string;
  reason: string | null;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  id: string;
  professional_id: string;
  service_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  service?: Service;
}

export interface Review {
  id: string;
  professional_id: string;
  booking_id: string;
  client_name: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}
