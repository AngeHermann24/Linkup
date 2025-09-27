-- =====================================================
-- PANEL ADMIN LINKUP - INSTALLATION FINALE
-- Script ultra-simple sans conflits
-- =====================================================

-- Ajouter la colonne suspended si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN suspended BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonne suspended ajoutée à profiles ✓';
  ELSE
    RAISE NOTICE 'Colonne suspended existe déjà ✓';
  END IF;
END $$;

-- =====================================================
-- CATÉGORIES DE SERVICES
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

-- Index pour les catégories (seulement si ils n'existent pas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_categories_plan_type') THEN
    CREATE INDEX idx_service_categories_plan_type ON service_categories(plan_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_categories_is_active') THEN
    CREATE INDEX idx_service_categories_is_active ON service_categories(is_active);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_categories_name') THEN
    CREATE INDEX idx_service_categories_name ON service_categories(name);
  END IF;
END $$;

-- Trigger pour updated_at des catégories (seulement si il n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_categories_updated_at') THEN
    CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ language 'plpgsql';

    CREATE TRIGGER update_service_categories_updated_at
      BEFORE UPDATE ON service_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_service_categories_updated_at();
    
    RAISE NOTICE 'Trigger service_categories créé ✓';
  ELSE
    RAISE NOTICE 'Trigger service_categories existe déjà ✓';
  END IF;
END $$;

-- =====================================================
-- ABONNEMENTS PRESTATAIRES
-- =====================================================

-- Table des abonnements prestataires
CREATE TABLE IF NOT EXISTS provider_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'pro')),
  price_monthly INTEGER NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les abonnements (seulement si ils n'existent pas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_provider_subscriptions_provider_id') THEN
    CREATE INDEX idx_provider_subscriptions_provider_id ON provider_subscriptions(provider_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_provider_subscriptions_plan_type') THEN
    CREATE INDEX idx_provider_subscriptions_plan_type ON provider_subscriptions(plan_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_provider_subscriptions_is_active') THEN
    CREATE INDEX idx_provider_subscriptions_is_active ON provider_subscriptions(is_active);
  END IF;
END $$;

-- Contrainte unique (seulement si elle n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'provider_subscriptions_provider_id_plan_type_key'
  ) THEN
    ALTER TABLE provider_subscriptions 
    ADD CONSTRAINT provider_subscriptions_provider_id_plan_type_key 
    UNIQUE(provider_id, plan_type);
    RAISE NOTICE 'Contrainte unique ajoutée ✓';
  ELSE
    RAISE NOTICE 'Contrainte unique existe déjà ✓';
  END IF;
END $$;

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
    WHEN COALESCE(p.service_category, '') IN ('Plomberie', 'Électricité', 'Climatisation', 'Informatique', 'Réparation Auto', 'Maçonnerie') THEN 'pro'
    ELSE 'basic'
  END as plan_type,
  CASE 
    WHEN COALESCE(p.service_category, '') IN ('Plomberie', 'Électricité', 'Climatisation', 'Informatique', 'Réparation Auto', 'Maçonnerie') THEN 3000
    ELSE 1000
  END as price_monthly,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '30 days' as end_date,
  true as is_active
FROM profiles p
WHERE p.role = 'prestataire'
ON CONFLICT (provider_id, plan_type) DO NOTHING;

-- =====================================================
-- FONCTIONS UTILITAIRES
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
    p.id, 
    p.full_name, 
    p.email, 
    p.phone, 
    p.role, 
    p.service_category, 
    COALESCE(p.suspended, false) as suspended, 
    p.created_at, 
    p.updated_at
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
    sc.id, 
    sc.name, 
    sc.description, 
    sc.plan_type, 
    sc.icon, 
    sc.is_active,
    CASE WHEN sc.plan_type = 'basic' THEN 1000 ELSE 3000 END as subscription_price,
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
-- STATISTIQUES
-- =====================================================

-- Vue des statistiques pour l'admin
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'client') as total_clients,
  (SELECT COUNT(*) FROM profiles WHERE role = 'prestataire') as total_providers,
  (SELECT COUNT(*) FROM service_categories) as total_categories,
  (SELECT COUNT(*) FROM service_categories WHERE plan_type = 'basic') as basic_categories,
  (SELECT COUNT(*) FROM service_categories WHERE plan_type = 'pro') as pro_categories,
  (SELECT COUNT(*) FROM provider_subscriptions WHERE is_active = true) as active_subscriptions,
  (SELECT COUNT(*) FROM provider_subscriptions WHERE plan_type = 'basic' AND is_active = true) as basic_subscriptions,
  (SELECT COUNT(*) FROM provider_subscriptions WHERE plan_type = 'pro' AND is_active = true) as pro_subscriptions,
  (SELECT COALESCE(SUM(price_monthly), 0) FROM provider_subscriptions WHERE is_active = true) as monthly_revenue;

-- =====================================================
-- CONFIRMATION
-- =====================================================

DO $$
DECLARE
  categories_count INTEGER;
  subscriptions_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO categories_count FROM service_categories;
  SELECT COUNT(*) INTO subscriptions_count FROM provider_subscriptions;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 PANEL ADMIN LINKUP INSTALLÉ AVEC SUCCÈS !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Étape 1: Gestion des utilisateurs';
  RAISE NOTICE '✅ Étape 2: Gestion des demandes (utilise table existante)';
  RAISE NOTICE '✅ Étape 3: Gestion des services et abonnements';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RÉSUMÉ:';
  RAISE NOTICE '   - % catégories de services créées', categories_count;
  RAISE NOTICE '   - % abonnements prestataires créés', subscriptions_count;
  RAISE NOTICE '   - Fonctions utilitaires installées';
  RAISE NOTICE '   - Vue statistiques créée';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Vous pouvez maintenant utiliser le panel admin à /admin';
  RAISE NOTICE '';
END $$;
