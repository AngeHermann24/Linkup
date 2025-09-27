-- =====================================================
-- PANEL ADMIN LINKUP - SCRIPT SQL COMPLET
-- Toutes les étapes : Utilisateurs + Demandes + Services
-- =====================================================

-- =====================================================
-- ÉTAPE 1: GESTION DES UTILISATEURS
-- =====================================================

-- Table des profils utilisateurs (compatible avec structure existante)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'prestataire')),
  service_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la colonne suspended si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;

-- Index pour les recherches admin
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- =====================================================
-- ÉTAPE 3: GESTION DES SERVICES ET ABONNEMENTS
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

-- Trigger pour updated_at
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

-- Table des services individuels
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER, -- Prix fixé par le prestataire
  category TEXT, -- Nom de la catégorie (dénormalisé pour performance)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les services
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();

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
CREATE INDEX IF NOT EXISTS idx_provider_subscriptions_end_date ON provider_subscriptions(end_date);

-- Trigger pour updated_at
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
-- ÉTAPE 2: GESTION DES DEMANDES DE SERVICES
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
CREATE INDEX IF NOT EXISTS idx_service_requests_preferred_date ON service_requests(preferred_date);

-- Trigger pour updated_at
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

-- Insérer des utilisateurs de test
INSERT INTO profiles (id, full_name, email, phone, role, service_category, suspended) VALUES
(gen_random_uuid(), 'Marie Dubois', 'marie.dubois@email.com', '+237 123 456 789', 'client', NULL, false),
(gen_random_uuid(), 'Jean Plombier', 'jean.plombier@linkup.com', '+237 987 654 321', 'prestataire', 'Plomberie', false),
(gen_random_uuid(), 'Paul Martin', 'paul.martin@email.com', '+237 234 567 890', 'client', NULL, false),
(gen_random_uuid(), 'Électro Pro', 'contact@electropro.cm', '+237 876 543 210', 'prestataire', 'Électricité', false),
(gen_random_uuid(), 'Sophie Leroy', 'sophie.leroy@email.com', '+237 345 678 901', 'client', NULL, false),
(gen_random_uuid(), 'Clean Service', 'info@cleanservice.cm', '+237 765 432 109', 'prestataire', 'Ménage', false),
(gen_random_uuid(), 'Ahmed Hassan', 'ahmed.hassan@email.com', '+237 456 789 012', 'client', NULL, false),
(gen_random_uuid(), 'Clim Expert', 'contact@climexpert.cm', '+237 654 321 098', 'prestataire', 'Climatisation', false),
(gen_random_uuid(), 'Fatima Nkomo', 'fatima.nkomo@email.com', '+237 567 890 123', 'client', NULL, false),
(gen_random_uuid(), 'Jardin Plus', 'info@jardinplus.cm', '+237 543 210 987', 'prestataire', 'Jardinage', false)
ON CONFLICT (email) DO NOTHING;

-- Insérer les catégories de services
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

-- Insérer des services individuels
INSERT INTO services (provider_id, category_id, title, description, price, category, is_active)
SELECT 
  p.id as provider_id,
  sc.id as category_id,
  sc.name || ' - ' || p.full_name as title,
  'Service de ' || LOWER(sc.name) || ' proposé par ' || p.full_name as description,
  CASE 
    WHEN sc.plan_type = 'basic' THEN 5000 + (RANDOM() * 10000)::INTEGER
    ELSE 15000 + (RANDOM() * 20000)::INTEGER
  END as price,
  sc.name as category,
  true as is_active
FROM profiles p
CROSS JOIN service_categories sc
WHERE p.role = 'prestataire' 
  AND p.service_category = sc.name
ON CONFLICT DO NOTHING;

-- Insérer des abonnements pour les prestataires
INSERT INTO provider_subscriptions (provider_id, plan_type, price_monthly, start_date, end_date, is_active)
SELECT 
  p.id as provider_id,
  CASE 
    WHEN p.service_category IN ('Plomberie', 'Électricité', 'Climatisation', 'Informatique', 'Réparation Auto', 'Soudure', 'Maçonnerie', 'Menuiserie') THEN 'pro'
    ELSE 'basic'
  END as plan_type,
  CASE 
    WHEN p.service_category IN ('Plomberie', 'Électricité', 'Climatisation', 'Informatique', 'Réparation Auto', 'Soudure', 'Maçonnerie', 'Menuiserie') THEN 3000
    ELSE 1000
  END as price_monthly,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '30 days' as end_date,
  true as is_active
FROM profiles p
WHERE p.role = 'prestataire'
ON CONFLICT (provider_id, plan_type) DO NOTHING;

-- Insérer des demandes de services de test
INSERT INTO service_requests (client_id, provider_id, service_id, status, message, preferred_date, preferred_time, client_phone, provider_response)
SELECT 
  c.id as client_id,
  p.id as provider_id,
  s.id as service_id,
  CASE (RANDOM() * 4)::INTEGER
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'accepted'
    WHEN 2 THEN 'rejected'
    WHEN 3 THEN 'completed'
    ELSE 'cancelled'
  END as status,
  'Demande de ' || s.category || ' - ' || s.title as message,
  CURRENT_DATE + (RANDOM() * 30)::INTEGER as preferred_date,
  (ARRAY['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'])[1 + (RANDOM() * 5)::INTEGER]::TIME as preferred_time,
  c.phone as client_phone,
  CASE (RANDOM() * 2)::INTEGER
    WHEN 0 THEN 'Demande acceptée, je vous contacte bientôt'
    ELSE 'Merci pour votre demande'
  END as provider_response
FROM profiles c
CROSS JOIN profiles p
CROSS JOIN services s
WHERE c.role = 'client' 
  AND p.role = 'prestataire'
  AND s.provider_id = p.id
LIMIT 20
ON CONFLICT DO NOTHING;

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
    p.id, p.full_name, p.email, p.phone, p.role, p.service_category, p.suspended, p.created_at, p.updated_at
  FROM profiles p
  WHERE 
    (user_role = 'all' OR p.role = user_role)
    AND (
      search_term = '' OR
      LOWER(p.full_name) LIKE LOWER('%' || search_term || '%') OR
      LOWER(p.email) LIKE LOWER('%' || search_term || '%') OR
      p.phone LIKE '%' || search_term || '%'
    )
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction de recherche de demandes
CREATE OR REPLACE FUNCTION admin_search_requests(search_term TEXT DEFAULT '', request_status TEXT DEFAULT 'all')
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
    sr.id, cp.full_name, cp.email, pp.full_name, pp.email, s.title, s.category,
    sr.status, sr.message, sr.preferred_date, sr.preferred_time, sr.client_phone, sr.provider_response,
    sr.created_at, sr.updated_at
  FROM service_requests sr
  LEFT JOIN profiles cp ON sr.client_id = cp.id
  LEFT JOIN profiles pp ON sr.provider_id = pp.id
  LEFT JOIN services s ON sr.service_id = s.id
  WHERE 
    (request_status = 'all' OR sr.status = request_status)
    AND (
      search_term = '' OR
      LOWER(cp.full_name) LIKE LOWER('%' || search_term || '%') OR
      LOWER(pp.full_name) LIKE LOWER('%' || search_term || '%') OR
      LOWER(s.title) LIKE LOWER('%' || search_term || '%')
    )
  ORDER BY sr.created_at DESC;
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

-- Vue pour l'admin : résumé des prestataires et abonnements
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

-- =====================================================
-- STATISTIQUES POUR LE DASHBOARD ADMIN
-- =====================================================

-- Vue des statistiques générales
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'client') as total_clients,
  (SELECT COUNT(*) FROM profiles WHERE role = 'prestataire') as total_providers,
  (SELECT COUNT(*) FROM service_requests) as total_requests,
  (SELECT COUNT(*) FROM service_requests WHERE status = 'pending') as pending_requests,
  (SELECT COUNT(*) FROM service_categories) as total_categories,
  (SELECT COUNT(*) FROM service_categories WHERE plan_type = 'basic') as basic_categories,
  (SELECT COUNT(*) FROM service_categories WHERE plan_type = 'pro') as pro_categories,
  (SELECT COUNT(*) FROM provider_subscriptions WHERE is_active = true) as active_subscriptions,
  (SELECT SUM(price_monthly) FROM provider_subscriptions WHERE is_active = true) as monthly_revenue;

-- =====================================================
-- PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Politique de sécurité : seuls les admins peuvent accéder aux fonctions admin
-- (À adapter selon votre système d'authentification)

-- Exemple de fonction pour vérifier les droits admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remplacez par votre logique d'authentification admin
  RETURN user_email = 'angeherboua@gmail.com';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Panel Admin Linkup installé avec succès !';
  RAISE NOTICE 'Étape 1: Gestion des utilisateurs ✓';
  RAISE NOTICE 'Étape 2: Gestion des demandes ✓';
  RAISE NOTICE 'Étape 3: Gestion des services et abonnements ✓';
  RAISE NOTICE 'Données de test insérées ✓';
  RAISE NOTICE 'Fonctions utilitaires créées ✓';
END $$;
