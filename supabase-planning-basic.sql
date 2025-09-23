-- Script SQL basique pour les tables de planning - Version ultra-simple

-- 1. Table des disponibilités des prestataires
CREATE TABLE provider_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des réservations/rendez-vous
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  client_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  service_type TEXT NOT NULL,
  service_description TEXT,
  status TEXT DEFAULT 'pending',
  client_phone TEXT,
  client_address TEXT,
  notes TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour les performances
CREATE INDEX idx_provider_availability_provider_date 
  ON provider_availability(provider_id, date);

CREATE INDEX idx_bookings_provider_date 
  ON bookings(provider_id, date);

-- 4. Vue simple pour le planning
CREATE VIEW provider_weekly_schedule AS
SELECT 
  pa.provider_id,
  pa.date,
  pa.start_time,
  pa.end_time,
  pa.is_available,
  b.id as booking_id,
  b.client_id,
  p.full_name as client_name,
  b.service_type,
  b.status as booking_status,
  b.client_phone
FROM provider_availability pa
LEFT JOIN bookings b ON (
  pa.provider_id = b.provider_id 
  AND pa.date = b.date 
  AND pa.start_time = b.start_time
  AND b.status IN ('confirmed', 'pending')
)
LEFT JOIN profiles p ON b.client_id = p.id
ORDER BY pa.date, pa.start_time;

-- Message de confirmation
SELECT 'Tables de planning créées (version basique)!' as status;
