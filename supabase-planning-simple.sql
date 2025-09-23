-- Script SQL simplifié pour ajouter les tables de planning à Linkup

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
  
  -- Index unique pour éviter les doublons
  UNIQUE(provider_id, date, start_time)
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

-- 4. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_planning()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Triggers pour updated_at
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

-- 6. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_date 
  ON provider_availability(provider_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_provider_date 
  ON bookings(provider_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_client_date 
  ON bookings(client_id, date);

-- 7. Vue simplifiée pour les requêtes fréquentes
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

-- 8. Fonction pour générer les disponibilités par défaut
CREATE OR REPLACE FUNCTION generate_week_availability(
  p_provider_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  current_date DATE;
  inserted_count INTEGER := 0;
  hour_val INTEGER;
  minute_val INTEGER;
  start_time_val TIME;
  end_time_val TIME;
BEGIN
  -- Générer pour 7 jours à partir de la date de début
  FOR i IN 0..6 LOOP
    current_date := p_start_date + INTERVAL '1 day' * i;
    
    -- Générer des créneaux de 30 minutes de 8h à 18h
    FOR hour_val IN 8..17 LOOP
      FOR minute_val IN 0..1 LOOP
        start_time_val := (hour_val || ':' || (minute_val * 30) || ':00')::TIME;
        
        -- Calculer l'heure de fin (30 minutes plus tard)
        IF minute_val = 0 THEN
          end_time_val := (hour_val || ':30:00')::TIME;
        ELSE
          end_time_val := ((hour_val + 1) || ':00:00')::TIME;
        END IF;
        
        -- Insérer la disponibilité si elle n'existe pas déjà
        INSERT INTO provider_availability (provider_id, date, start_time, end_time, is_available)
        VALUES (p_provider_id, current_date, start_time_val, end_time_val, true)
        ON CONFLICT (provider_id, date, start_time) DO NOTHING;
        
        inserted_count := inserted_count + 1;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
SELECT 'Tables de planning créées avec succès!' as status;
