-- Table pour les demandes de services
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  message TEXT,
  preferred_date DATE,
  preferred_time TIME,
  client_phone TEXT,
  provider_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_service_requests_updated_at();

-- Insérer quelques données de test
INSERT INTO service_requests (client_id, provider_id, service_id, status, message, preferred_date, preferred_time, client_phone)
SELECT 
  c.id as client_id,
  p.id as provider_id,
  s.id as service_id,
  'pending' as status,
  'Demande de test pour ' || s.title as message,
  CURRENT_DATE + INTERVAL '7 days' as preferred_date,
  '14:00:00' as preferred_time,
  c.phone as client_phone
FROM profiles c
CROSS JOIN profiles p
CROSS JOIN services s
WHERE c.role = 'client' 
  AND p.role = 'prestataire'
  AND s.provider_id = p.id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Ajouter quelques demandes avec différents statuts
UPDATE service_requests 
SET status = 'accepted', provider_response = 'Demande acceptée, je vous contacte bientôt'
WHERE id IN (
  SELECT id FROM service_requests WHERE status = 'pending' LIMIT 2
);

UPDATE service_requests 
SET status = 'rejected', provider_response = 'Désolé, je ne suis pas disponible à cette date'
WHERE id IN (
  SELECT id FROM service_requests WHERE status = 'pending' LIMIT 1
);

UPDATE service_requests 
SET status = 'completed'
WHERE id IN (
  SELECT id FROM service_requests WHERE status = 'accepted' LIMIT 1
);
