-- Professional profile
CREATE TABLE professional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  logo_url TEXT,
  cover_image TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Services offered
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professional(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_min INT NOT NULL,
  price_cents INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly working hours
CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professional(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working BOOLEAN DEFAULT true
);

-- Recurring breaks
CREATE TABLE breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professional(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Blocked dates (days off)
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professional(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professional(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professional(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) UNIQUE,
  client_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_professional ON bookings(professional_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_services_professional ON services(professional_id);
CREATE INDEX idx_reviews_professional ON reviews(professional_id);
CREATE INDEX idx_working_hours_professional ON working_hours(professional_id);

-- RLS policies
ALTER TABLE professional ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read for professional
CREATE POLICY "Public can read professional" ON professional FOR SELECT USING (true);

-- Public read for active services
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = true);

-- Public read schedule info
CREATE POLICY "Public can read working hours" ON working_hours FOR SELECT USING (true);
CREATE POLICY "Public can read breaks" ON breaks FOR SELECT USING (true);
CREATE POLICY "Public can read blocked dates" ON blocked_dates FOR SELECT USING (true);

-- Public can insert bookings
CREATE POLICY "Public can insert bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Public can read own booking (for review page)
CREATE POLICY "Public can read bookings" ON bookings FOR SELECT USING (true);

-- Public can insert reviews
CREATE POLICY "Public can insert reviews" ON reviews FOR INSERT WITH CHECK (true);

-- Public can read visible reviews
CREATE POLICY "Public can read visible reviews" ON reviews FOR SELECT USING (is_visible = true);

-- Authenticated admin: full CRUD
CREATE POLICY "Admin full access professional" ON professional FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access services" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access working_hours" ON working_hours FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access breaks" ON breaks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access blocked_dates" ON blocked_dates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access bookings" ON bookings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access reviews" ON reviews FOR ALL USING (auth.role() = 'authenticated');

-- Atomic booking function to prevent double-booking
CREATE OR REPLACE FUNCTION create_booking(
  p_professional_id UUID,
  p_service_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_conflict_count INT;
BEGIN
  -- Check for overlapping bookings
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE professional_id = p_professional_id
    AND date = p_date
    AND status NOT IN ('cancelled')
    AND start_time < p_end_time
    AND end_time > p_start_time;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Pasirinktas laikas jau užimtas';
  END IF;

  INSERT INTO bookings (professional_id, service_id, client_name, client_email, client_phone, date, start_time, end_time, notes)
  VALUES (p_professional_id, p_service_id, p_client_name, p_client_email, p_client_phone, p_date, p_start_time, p_end_time, p_notes)
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
