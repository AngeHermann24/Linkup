-- =====================================================
-- CRÉATION DE LA TABLE SERVICE_REQUESTS
-- Pour permettre les demandes de services
-- =====================================================

-- Créer la table service_requests
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NULL, -- Référence optionnelle vers un service spécifique
  service_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  preferred_date DATE,
  preferred_time TIME,
  address TEXT,
  phone TEXT,
  estimated_price DECIMAL(10,2),
  price_unit TEXT DEFAULT 'FCFA',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused', 'completed', 'cancelled')),
  provider_response TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer une vue pour les demandes avec informations détaillées
CREATE OR REPLACE VIEW service_requests_detailed AS
SELECT 
  sr.*,
  -- Informations client
  c.full_name as client_name,
  c.email as client_email,
  c.phone as client_phone_profile,
  -- Informations prestataire
  p.full_name as provider_name,
  p.service_category as provider_service,
  p.email as provider_email,
  p.phone as provider_phone
FROM service_requests sr
JOIN profiles c ON sr.client_id = c.id
JOIN profiles p ON sr.provider_id = p.id;

-- RLS (Row Level Security)
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour les clients : peuvent voir et créer leurs propres demandes
CREATE POLICY "Clients can view own requests" ON service_requests
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create requests" ON service_requests
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own requests" ON service_requests
  FOR UPDATE USING (client_id = auth.uid());

-- Politique pour les prestataires : peuvent voir et répondre aux demandes qui leur sont adressées
CREATE POLICY "Providers can view their requests" ON service_requests
  FOR SELECT USING (provider_id = auth.uid());

CREATE POLICY "Providers can update their requests" ON service_requests
  FOR UPDATE USING (provider_id = auth.uid());

-- Politique pour les admins : accès complet
CREATE POLICY "Admins full access" ON service_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Vérifier le résultat
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 TABLE SERVICE_REQUESTS CRÉÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Table service_requests : Créée avec RLS';
  RAISE NOTICE '✅ Vue service_requests_detailed : Créée';
  RAISE NOTICE '✅ Politiques de sécurité : Configurées';
  RAISE NOTICE '✅ Index de performance : Créés';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Les clients peuvent maintenant faire des demandes !';
  RAISE NOTICE '';
END $$;
