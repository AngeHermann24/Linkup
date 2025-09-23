-- Script SQL final pour les tables de planning - Version qui fonctionne à 100%

-- 1. Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS provider_availability CASCADE;
DROP TABLE IF EXISTS provider_schedule_template CASCADE;
DROP VIEW IF EXISTS provider_weekly_schedule CASCADE;

-- 2. Table des disponibilités des prestataires
CREATE TABLE provider_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(provider_id, date, start_time)
);

-- 3. Table des réservations/rendez-vous
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

-- 4. Index pour améliorer les performances
CREATE INDEX idx_provider_availability_provider_date 
  ON provider_availability(provider_id, date);

CREATE INDEX idx_provider_availability_date_time 
  ON provider_availability(date, start_time);

CREATE INDEX idx_bookings_provider_date 
  ON bookings(provider_id, date);

CREATE INDEX idx_bookings_client_date 
  ON bookings(client_id, date);

-- 5. Vue pour le planning hebdomadaire
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

-- 6. Fonction simple pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers pour updated_at
CREATE TRIGGER update_provider_availability_updated_at 
  BEFORE UPDATE ON provider_availability 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Données de test (optionnel - décommentez si vous voulez des données de test)
/*
-- Exemple d'insertion de disponibilités pour un prestataire
-- Remplacez 'UUID_DU_PRESTATAIRE' par l'ID réel de votre prestataire

INSERT INTO provider_availability (provider_id, date, start_time, end_time, is_available)
VALUES 
  ('UUID_DU_PRESTATAIRE', CURRENT_DATE, '08:00:00', '08:30:00', true),
  ('UUID_DU_PRESTATAIRE', CURRENT_DATE, '08:30:00', '09:00:00', true),
  ('UUID_DU_PRESTATAIRE', CURRENT_DATE, '09:00:00', '09:30:00', true),
  ('UUID_DU_PRESTATAIRE', CURRENT_DATE, '09:30:00', '10:00:00', true),
  ('UUID_DU_PRESTATAIRE', CURRENT_DATE, '10:00:00', '10:30:00', true);
*/

-- Message de confirmation
SELECT 'Tables de planning créées avec succès! 🎉' as status;
