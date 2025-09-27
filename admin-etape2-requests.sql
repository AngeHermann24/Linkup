-- =====================================================
-- ÉTAPE 2: GESTION DES DEMANDES DE SERVICES - PANEL ADMIN
-- =====================================================

-- Table des demandes de services
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

-- Index pour améliorer les performances des recherches admin
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_preferred_date ON service_requests(preferred_date);

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

-- Insérer des demandes de test pour l'admin
INSERT INTO service_requests (client_id, provider_id, service_id, status, message, preferred_date, preferred_time, client_phone, provider_response)
SELECT 
  c.id as client_id,
  p.id as provider_id,
  s.id as service_id,
  'pending' as status,
  'Demande de test pour ' || s.title as message,
  CURRENT_DATE + INTERVAL '7 days' as preferred_date,
  '14:00:00' as preferred_time,
  c.phone as client_phone,
  NULL as provider_response
FROM profiles c
CROSS JOIN profiles p
CROSS JOIN services s
WHERE c.role = 'client' 
  AND p.role = 'prestataire'
  AND s.provider_id = p.id
LIMIT 10
ON CONFLICT DO NOTHING;

-- Ajouter quelques demandes avec différents statuts
UPDATE service_requests 
SET status = 'accepted', 
    provider_response = 'Demande acceptée, je vous contacte bientôt',
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM service_requests WHERE status = 'pending' LIMIT 3
);

UPDATE service_requests 
SET status = 'rejected', 
    provider_response = 'Désolé, je ne suis pas disponible à cette date',
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM service_requests WHERE status = 'pending' LIMIT 2
);

UPDATE service_requests 
SET status = 'completed',
    provider_response = 'Travail terminé avec succès',
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM service_requests WHERE status = 'accepted' LIMIT 1
);

UPDATE service_requests 
SET status = 'cancelled',
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM service_requests WHERE status = 'pending' LIMIT 1
);

-- Fonction pour obtenir les statistiques des demandes (pour l'admin)
CREATE OR REPLACE FUNCTION admin_get_request_stats()
RETURNS TABLE (
  total_requests BIGINT,
  pending_requests BIGINT,
  accepted_requests BIGINT,
  rejected_requests BIGINT,
  completed_requests BIGINT,
  cancelled_requests BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_requests,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_requests
  FROM service_requests;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rechercher des demandes (utilisée par l'admin)
CREATE OR REPLACE FUNCTION admin_search_requests(
  search_term TEXT DEFAULT '', 
  request_status TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  client_name TEXT,
  client_email TEXT,
  provider_name TEXT,
  provider_email TEXT,
  service_title TEXT,
  service_category TEXT,
  status TEXT,
  message TEXT,
  preferred_date DATE,
  preferred_time TIME,
  client_phone TEXT,
  provider_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    cp.full_name as client_name,
    cp.email as client_email,
    pp.full_name as provider_name,
    pp.email as provider_email,
    s.title as service_title,
    s.category as service_category,
    sr.status,
    sr.message,
    sr.preferred_date,
    sr.preferred_time,
    sr.client_phone,
    sr.provider_response,
    sr.created_at,
    sr.updated_at
  FROM service_requests sr
  LEFT JOIN profiles cp ON sr.client_id = cp.id
  LEFT JOIN profiles pp ON sr.provider_id = pp.id
  LEFT JOIN services s ON sr.service_id = s.id
  WHERE 
    (request_status = 'all' OR sr.status = request_status)
    AND (
      search_term = '' OR
      LOWER(cp.full_name) LIKE LOWER('%' || search_term || '%') OR
      LOWER(cp.email) LIKE LOWER('%' || search_term || '%') OR
      LOWER(pp.full_name) LIKE LOWER('%' || search_term || '%') OR
      LOWER(pp.email) LIKE LOWER('%' || search_term || '%') OR
      LOWER(s.title) LIKE LOWER('%' || search_term || '%') OR
      LOWER(s.category) LIKE LOWER('%' || search_term || '%')
    )
  ORDER BY sr.created_at DESC;
END;
$$ LANGUAGE plpgsql;
