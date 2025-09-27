-- =====================================================
-- PANEL ADMIN LINKUP - INSTALLATION SIMPLE
-- Compatible avec votre structure existante
-- =====================================================

-- Ajouter la colonne suspended à la table profiles existante
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;

-- =====================================================
-- ÉTAPE 3: CATÉGORIES DE SERVICES ET ABONNEMENTS
-- =====================================================

-- Table des catégories de services
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro')),
  icon TEXT NOT NULL DEFAULT '🔧',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les catégories
CREATE INDEX IF NOT EXISTS idx_service_categories_plan_type ON service_categories(plan_type);
CREATE INDEX IF NOT EXISTS idx_service_categories_is_active ON service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_service_categories_name ON service_categories(name);

-- Trigger pour updated_at des catégories
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_categories_updated_at();

-- Table des abonnements prestataires
CREATE TABLE IF NOT EXISTS provider_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'pro')),
  price_monthly INTEGER NOT NULL, -- 1000 FCFA (basic) ou 3000 FCFA (pro)
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, plan_type)
);

-- Index pour les abonnements
CREATE INDEX IF NOT EXISTS idx_provider_subscriptions_provider_id ON provider_subscriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_subscriptions_plan_type ON provider_subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_provider_subscriptions_is_active ON provider_subscriptions(is_active);

-- Trigger pour updated_at des abonnements
CREATE OR REPLACE FUNCTION update_provider_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_provider_subscriptions_updated_at
  BEFORE UPDATE ON provider_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_subscriptions_updated_at();

-- =====================================================
-- ÉTAPE 2: DEMANDES DE SERVICES
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

-- Index pour les demandes
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);

-- Trigger pour updated_at des demandes
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

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Insérer les catégories de services
INSERT INTO service_categories (name, description, plan_type, icon, is_active) VALUES
-- Services Basic (Abonnement 1000 FCFA/mois)
('Coiffure', 'Services de coiffure et beauté', 'basic', '✂️', true),
('Ménage', 'Nettoyage et entretien ménager', 'basic', '🧹', true),
('Jardinage', 'Entretien et aménagement de jardins', 'basic', '🌱', true),
('Peinture', 'Peinture et décoration intérieure', 'basic', '🎨', true),
('Cuisine', 'Services de cuisine et traiteur', 'basic', '🍳', true),
('Couture', 'Services de couture et retouches', 'basic', '🧵', true),

-- Services Pro (Abonnement 3000 FCFA/mois)
('Plomberie', 'Réparation et installation de plomberie', 'pro', '🔧', true),
('Électricité', 'Installation et réparation électrique', 'pro', '⚡', true),
('Climatisation', 'Installation et maintenance de climatisation', 'pro', '❄️', true),
('Réparation Auto', 'Réparation et entretien automobile', 'pro', '🚗', true),
('Informatique', 'Dépannage et installation informatique', 'pro', '💻', true),
('Maçonnerie', 'Travaux de maçonnerie et construction', 'pro', '🏗️', true)
ON CONFLICT (name) DO NOTHING;

-- Insérer des abonnements pour les prestataires existants
INSERT INTO provider_subscriptions (provider_id, plan_type, price_monthly, start_date, end_date, is_active)
SELECT 
  p.id as provider_id,
  CASE 
    WHEN p.service_category IN ('Plomberie', 'Électricité', 'Climatisation', 'Informatique', 'Réparation Auto', 'Maçonnerie') THEN 'pro'
    ELSE 'basic'
  END as plan_type,
  CASE 
    WHEN p.service_category IN ('Plomberie', 'Électricité', 'Climatisation', 'Informatique', 'Réparation Auto', 'Maçonnerie') THEN 3000
    ELSE 1000
  END as price_monthly,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '30 days' as end_date,
  true as is_active
FROM profiles p
WHERE p.role = 'prestataire'
ON CONFLICT (provider_id, plan_type) DO NOTHING;

-- Insérer quelques demandes de test (seulement si la table services existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    INSERT INTO service_requests (client_id, provider_id, service_id, status, message, preferred_date, preferred_time, client_phone)
    SELECT 
      c.id as client_id,
      p.id as provider_id,
      s.id as service_id,
      'pending' as status,
      'Demande de test pour ' || COALESCE(s.title, 'service') as message,
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
  END IF;
END $$;

-- =====================================================
-- FONCTIONS UTILITAIRES POUR L'ADMIN
-- =====================================================

-- Fonction de recherche d'utilisateurs
CREATE OR REPLACE FUNCTION admin_search_users(search_term TEXT DEFAULT '', user_role TEXT DEFAULT 'all')
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  service_category TEXT,
  suspended BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.full_name, p.email, p.phone, p.role, p.service_category, 
    COALESCE(p.suspended, false) as suspended, p.created_at, p.updated_at
  FROM profiles p
  WHERE 
    (user_role = 'all' OR p.role = user_role)
    AND (
      search_term = '' OR
      LOWER(COALESCE(p.full_name, '')) LIKE LOWER('%' || search_term || '%') OR
      LOWER(p.email) LIKE LOWER('%' || search_term || '%') OR
      COALESCE(p.phone, '') LIKE '%' || search_term || '%'
    )
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction de recherche de catégories
CREATE OR REPLACE FUNCTION admin_search_categories(search_term TEXT DEFAULT '', category_plan TEXT DEFAULT 'all')
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  plan_type TEXT,
  icon TEXT,
  is_active BOOLEAN,
  subscription_price INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id, sc.name, sc.description, sc.plan_type, sc.icon, sc.is_active,
    CASE WHEN sc.plan_type = 'basic' THEN 1000 ELSE 3000 END as subscription_price,
    sc.created_at, sc.updated_at
  FROM service_categories sc
  WHERE 
    (category_plan = 'all' OR sc.plan_type = category_plan)
    AND (
      search_term = '' OR
      LOWER(sc.name) LIKE LOWER('%' || search_term || '%') OR
      LOWER(sc.description) LIKE LOWER('%' || search_term || '%')
    )
  ORDER BY sc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les droits d'un prestataire
CREATE OR REPLACE FUNCTION can_provider_offer_service(provider_uuid UUID, service_category_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  required_plan TEXT;
  provider_plan TEXT;
BEGIN
  SELECT plan_type INTO required_plan
  FROM service_categories
  WHERE name = service_category_name AND is_active = true;
  
  IF required_plan IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT ps.plan_type INTO provider_plan
  FROM provider_subscriptions ps
  WHERE ps.provider_id = provider_uuid 
    AND ps.plan_type = required_plan
    AND ps.is_active = true
    AND (ps.end_date IS NULL OR ps.end_date >= CURRENT_DATE);
  
  RETURN provider_plan IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Panel Admin Linkup installé avec succès !';
  RAISE NOTICE 'Étape 1: Gestion des utilisateurs ✓';
  RAISE NOTICE 'Étape 2: Gestion des demandes ✓';
  RAISE NOTICE 'Étape 3: Gestion des services et abonnements ✓';
  RAISE NOTICE 'Données de test insérées ✓';
  RAISE NOTICE 'Fonctions utilitaires créées ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez maintenant utiliser le panel admin à /admin';
END $$;
