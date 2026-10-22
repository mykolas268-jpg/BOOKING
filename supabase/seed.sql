-- Seed data for testing
-- Insert a test professional
INSERT INTO professional (id, name, business_name, slug, description, phone, email, address)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Jonas Petrauskas',
  'Kirpėjas Jonas',
  'kirpejas-jonas',
  'Profesionalus vyrų kirpėjas su 10 metų patirtimi. Šiuolaikiški kirpimai, barzdos formavimas ir stilius.',
  '+370 600 12345',
  'jonas@kirpejas.lt',
  'Gedimino pr. 15, Vilnius'
);

-- Insert services
INSERT INTO services (professional_id, name, description, duration_min, price_cents, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Vyriškas kirpimas', 'Klasikinis arba šiuolaikiškas vyriškas kirpimas', 30, 2000, 1),
('00000000-0000-0000-0000-000000000001', 'Barzdos formavimas', 'Barzdos kirpimas ir formavimas', 20, 1500, 2),
('00000000-0000-0000-0000-000000000001', 'Kirpimas + barzda', 'Pilnas kirpimas ir barzdos formavimas', 45, 3000, 3),
('00000000-0000-0000-0000-000000000001', 'Vaikiškas kirpimas', 'Kirpimas vaikams iki 12 metų', 20, 1200, 4),
('00000000-0000-0000-0000-000000000001', 'Galvos skutimas', 'Galvos skutimas peiliuku', 30, 1800, 5);

-- Insert working hours (Mon-Fri 9-18, Sat 10-15, Sun off)
INSERT INTO working_hours (professional_id, day_of_week, start_time, end_time, is_working) VALUES
('00000000-0000-0000-0000-000000000001', 0, '09:00', '18:00', true),
('00000000-0000-0000-0000-000000000001', 1, '09:00', '18:00', true),
('00000000-0000-0000-0000-000000000001', 2, '09:00', '18:00', true),
('00000000-0000-0000-0000-000000000001', 3, '09:00', '18:00', true),
('00000000-0000-0000-0000-000000000001', 4, '09:00', '18:00', true),
('00000000-0000-0000-0000-000000000001', 5, '10:00', '15:00', true),
('00000000-0000-0000-0000-000000000001', 6, '00:00', '00:00', false);

-- Insert breaks (lunch Mon-Fri 12:00-13:00)
INSERT INTO breaks (professional_id, day_of_week, start_time, end_time) VALUES
('00000000-0000-0000-0000-000000000001', 0, '12:00', '13:00'),
('00000000-0000-0000-0000-000000000001', 1, '12:00', '13:00'),
('00000000-0000-0000-0000-000000000001', 2, '12:00', '13:00'),
('00000000-0000-0000-0000-000000000001', 3, '12:00', '13:00'),
('00000000-0000-0000-0000-000000000001', 4, '12:00', '13:00');
