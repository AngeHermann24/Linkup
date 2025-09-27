-- =====================================================
-- PANEL ADMIN LINKUP - VERSION MINIMALE
-- Seulement l'essentiel pour faire fonctionner l'admin
-- =====================================================

-- 1. Ajouter la colonne suspended (pour la gestion des utilisateurs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;

-- 2. Table des catégories de services (pour l'étape 3)
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

-- 3. Insérer les catégories de base
INSERT INTO service_categories (name, description, plan_type, icon) VALUES
('Coiffure', 'Services de coiffure et beauté', 'basic', '✂️'),
('Ménage', 'Nettoyage et entretien ménager', 'basic', '🧹'),
('Jardinage', 'Entretien et aménagement de jardins', 'basic', '🌱'),
('Plomberie', 'Réparation et installation de plomberie', 'pro', '🔧'),
('Électricité', 'Installation et réparation électrique', 'pro', '⚡'),
('Climatisation', 'Installation et maintenance de climatisation', 'pro', '❄️')
ON CONFLICT (name) DO NOTHING;

-- 4. Fonction de recherche des utilisateurs (pour l'étape 1)
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
      LOWER(p.email) LIKE LOWER('%' || search_term || '%')
    )
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction de recherche des catégories (pour l'étape 3)
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
      LOWER(sc.name) LIKE LOWER('%' || search_term || '%')
    )
  ORDER BY sc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
SELECT 'Panel Admin Linkup installé avec succès !' as message;
