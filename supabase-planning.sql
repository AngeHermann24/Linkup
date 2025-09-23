-- Script SQL pour ajouter les tables de planning à Linkup

-- 1. Table des disponibilités des prestataires
CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte pour éviter les créneaux qui se chevauchent
  CONSTRAINT no_overlap EXCLUDE USING gist (
    provider_id WITH =,
    date WITH =,
    tsrange(start_time::text::timestamp, end_time::text::timestamp) WITH &&
  )
);

-- 2. Table des réservations/rendez-vous
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  service_type TEXT NOT NULL,
  service_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  client_phone TEXT,
  client_address TEXT,
  notes TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des créneaux par défaut (template de disponibilités)
CREATE TABLE IF NOT EXISTS provider_schedule_template (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Dimanche, 6 = Samedi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(provider_id, day_of_week, start_time, end_time)
);

-- 4. Fonction pour générer automatiquement les disponibilités à partir du template
CREATE OR REPLACE FUNCTION generate_availability_from_template(
  p_provider_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  template_record RECORD;
  current_date DATE;
  inserted_count INTEGER := 0;
BEGIN
  -- Pour chaque jour dans la période
  current_date := p_start_date;
  WHILE current_date <= p_end_date LOOP
    -- Pour chaque template du prestataire correspondant au jour de la semaine
    FOR template_record IN 
      SELECT * FROM provider_schedule_template 
      WHERE provider_id = p_provider_id 
      AND day_of_week = EXTRACT(DOW FROM current_date)
      AND is_active = true
    LOOP
      -- Insérer la disponibilité si elle n'existe pas déjà
      INSERT INTO provider_availability (provider_id, date, start_time, end_time, is_available)
      VALUES (p_provider_id, current_date, template_record.start_time, template_record.end_time, true)
      ON CONFLICT DO NOTHING;
      
      inserted_count := inserted_count + 1;
    END LOOP;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_planning()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Triggers pour updated_at
CREATE TRIGGER update_provider_availability_updated_at 
  BEFORE UPDATE ON provider_availability 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_planning();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_planning();

CREATE TRIGGER update_provider_schedule_template_updated_at 
  BEFORE UPDATE ON provider_schedule_template 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_planning();

-- 7. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_date 
  ON provider_availability(provider_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_provider_date 
  ON bookings(provider_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_client_date 
  ON bookings(client_id, date);

-- 8. Vues utiles pour les requêtes fréquentes
CREATE OR REPLACE VIEW provider_weekly_schedule AS
SELECT 
  pa.provider_id,
  pa.date,
  pa.start_time,
  pa.end_time,
  pa.is_available,
  b.id as booking_id,
  b.client_id,
  p_client.full_name as client_name,
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
LEFT JOIN profiles p_client ON b.client_id = p_client.id
ORDER BY pa.date, pa.start_time;

-- 9. Données de test (optionnel)
-- Insérer quelques templates par défaut pour tester
-- INSERT INTO provider_schedule_template (provider_id, day_of_week, start_time, end_time)
-- VALUES 
--   ('uuid-du-prestataire', 1, '08:00', '18:00'), -- Lundi
--   ('uuid-du-prestataire', 2, '08:00', '18:00'), -- Mardi
--   ('uuid-du-prestataire', 3, '08:00', '18:00'); -- Mercredi

SELECT 'Tables de planning créées avec succès!' as status;
