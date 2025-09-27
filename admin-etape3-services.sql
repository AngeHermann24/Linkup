-- =====================================================
-- ÉTAPE 3: GESTION DES SERVICES ET ABONNEMENTS - PANEL ADMIN
-- =====================================================

-- Table des catégories de services avec abonnements prestataires
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_service_categories_plan_type ON service_categories(plan_type);
CREATE INDEX IF NOT EXISTS idx_service_categories_is_active ON service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_service_categories_name ON service_categories(name);

-- Trigger pour mettre à jour updated_at
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

-- Insérer les catégories de services avec leurs abonnements requis
INSERT INTO service_categories (name, description, plan_type, icon, is_active) VALUES
-- Services Basic (Abonnement 1000 FCFA/mois)
('Coiffure', 'Services de coiffure et beauté', 'basic', '✂️', true),
('Ménage', 'Nettoyage et entretien ménager', 'basic', '🧹', true),
('Jardinage', 'Entretien et aménagement de jardins', 'basic', '🌱', true),
('Peinture', 'Peinture et décoration intérieure', 'basic', '🎨', true),
('Cuisine', 'Services de cuisine et traiteur', 'basic', '🍳', true),
('Couture', 'Services de couture et retouches', 'basic', '🧵', true),
('Massage', 'Services de massage et bien-être', 'basic', '💆', true),
('Photographie', 'Services de photographie', 'basic', '📸', true),

-- Services Pro (Abonnement 3000 FCFA/mois)
('Plomberie', 'Réparation et installation de plomberie', 'pro', '🔧', true),
('Électricité', 'Installation et réparation électrique', 'pro', '⚡', true),
('Climatisation', 'Installation et maintenance de climatisation', 'pro', '❄️', true),
('Réparation Auto', 'Réparation et entretien automobile', 'pro', '🚗', true),
('Informatique', 'Dépannage et installation informatique', 'pro', '💻', true),
('Soudure', 'Services de soudure et métallurgie', 'pro', '🔥', true),
('Maçonnerie', 'Travaux de maçonnerie et construction', 'pro', '🏗️', true),
('Menuiserie', 'Travaux de menuiserie et ébénisterie', 'pro', '🪚', true)
ON CONFLICT (name) DO NOTHING;

-- Table des abonnements prestataires
CREATE TABLE IF NOT EXISTS provider_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'pro')),
  price_monthly INTEGER NOT NULL, -- Prix en FCFA
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
CREATE INDEX IF NOT EXISTS idx_provider_subscriptions_end_date ON provider_subscriptions(end_date);

-- Trigger pour mettre à jour updated_at
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

-- Insérer des abonnements de test pour les prestataires
INSERT INTO provider_subscriptions (provider_id, plan_type, price_monthly, start_date, end_date, is_active)
SELECT 
  p.id as provider_id,
  CASE 
    WHEN p.service_category IN ('Plomberie', 'Électricité', 'Climatisation', 'Informatique') THEN 'pro'
    ELSE 'basic'
  END as plan_type,
  CASE 
    WHEN p.service_category IN ('Plomberie', 'Électricité', 'Climatisation', 'Informatique') THEN 3000
    ELSE 1000
  END as price_monthly,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '30 days' as end_date,
  true as is_active
FROM profiles p
WHERE p.role = 'prestataire'
ON CONFLICT (provider_id, plan_type) DO NOTHING;

-- Fonction pour obtenir les statistiques des services (pour l'admin)
CREATE OR REPLACE FUNCTION admin_get_service_stats()
RETURNS TABLE (
  total_categories BIGINT,
  basic_categories BIGINT,
  pro_categories BIGINT,
  active_categories BIGINT,
  inactive_categories BIGINT,
  total_subscriptions BIGINT,
  basic_subscriptions BIGINT,
  pro_subscriptions BIGINT,
  active_subscriptions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM service_categories) as total_categories,
    (SELECT COUNT(*) FROM service_categories WHERE plan_type = 'basic') as basic_categories,
    (SELECT COUNT(*) FROM service_categories WHERE plan_type = 'pro') as pro_categories,
    (SELECT COUNT(*) FROM service_categories WHERE is_active = true) as active_categories,
    (SELECT COUNT(*) FROM service_categories WHERE is_active = false) as inactive_categories,
    (SELECT COUNT(*) FROM provider_subscriptions) as total_subscriptions,
    (SELECT COUNT(*) FROM provider_subscriptions WHERE plan_type = 'basic') as basic_subscriptions,
    (SELECT COUNT(*) FROM provider_subscriptions WHERE plan_type = 'pro') as pro_subscriptions,
    (SELECT COUNT(*) FROM provider_subscriptions WHERE is_active = true) as active_subscriptions;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un prestataire peut proposer un service
CREATE OR REPLACE FUNCTION can_provider_offer_service(
  provider_uuid UUID,
  service_category_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  required_plan TEXT;
  provider_plan TEXT;
BEGIN
  -- Obtenir le plan requis pour cette catégorie
  SELECT plan_type INTO required_plan
  FROM service_categories
  WHERE name = service_category_name AND is_active = true;
  
  IF required_plan IS NULL THEN
    RETURN false; -- Catégorie inexistante ou inactive
  END IF;
  
  -- Vérifier si le prestataire a l'abonnement requis
  SELECT ps.plan_type INTO provider_plan
  FROM provider_subscriptions ps
  WHERE ps.provider_id = provider_uuid 
    AND ps.plan_type = required_plan
    AND ps.is_active = true
    AND (ps.end_date IS NULL OR ps.end_date >= CURRENT_DATE);
  
  RETURN provider_plan IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rechercher des catégories (utilisée par l'admin)
CREATE OR REPLACE FUNCTION admin_search_categories(
  search_term TEXT DEFAULT '', 
  category_plan TEXT DEFAULT 'all'
)
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
    sc.id,
    sc.name,
    sc.description,
    sc.plan_type,
    sc.icon,
    sc.is_active,
    CASE 
      WHEN sc.plan_type = 'basic' THEN 1000
      WHEN sc.plan_type = 'pro' THEN 3000
    END as subscription_price,
    sc.created_at,
    sc.updated_at
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

-- Vue pour l'admin : résumé des prestataires et leurs abonnements
CREATE OR REPLACE VIEW admin_provider_subscriptions AS
SELECT 
  p.id as provider_id,
  p.full_name as provider_name,
  p.email as provider_email,
  p.service_category,
  ps.plan_type,
  ps.price_monthly,
  ps.start_date,
  ps.end_date,
  ps.is_active as subscription_active,
  ps.auto_renew,
  CASE 
    WHEN ps.end_date IS NULL OR ps.end_date >= CURRENT_DATE THEN true
    ELSE false
  END as subscription_valid
FROM profiles p
LEFT JOIN provider_subscriptions ps ON p.id = ps.provider_id
WHERE p.role = 'prestataire'
ORDER BY p.full_name;
