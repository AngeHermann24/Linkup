-- =====================================================
-- CRÉATION DE LA TABLE SERVICE_CATEGORIES
-- Pour permettre les vraies modifications admin
-- =====================================================

-- Créer la table service_categories
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'pro')),
  icon TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer tous les services Linkup par défaut
INSERT INTO service_categories (name, description, plan_type, icon, is_active) VALUES
-- Services Basic (1000 FCFA)
('Toclo Toclo', 'Transport en moto-taxi', 'basic', '🏍️', true),
('Fanicko', 'Livraison à domicile', 'basic', '🚲', true),
('Technicien de surface', 'Nettoyage professionnel', 'basic', '🧹', true),
('Peintre', 'Peinture et décoration', 'basic', '🎨', true),
('Jardinage', 'Entretien et aménagement de jardins', 'basic', '🌱', true),
('Ménage', 'Nettoyage et entretien ménager', 'basic', '🧹', true),

-- Services Pro (3000 FCFA)
('Mécanicien', 'Réparation et entretien automobile', 'pro', '🔧', true),
('Plomberie', 'Réparation et installation de plomberie', 'pro', '🔧', true),
('Électricité', 'Installation et réparation électrique', 'pro', '⚡', true),
('Coiffure', 'Services de coiffure et beauté', 'pro', '✂️', true),
('Traiteur', 'Services de restauration et traiteur', 'pro', '🍽️', true),
('Maquilleuse', 'Services de maquillage professionnel', 'pro', '💄', true),
('Pâtissier', 'Création de pâtisseries et desserts', 'pro', '🎂', true)

ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  plan_type = EXCLUDED.plan_type,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_service_categories_updated_at ON service_categories;
CREATE TRIGGER update_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vérifier le résultat
DO $$
DECLARE
  total_services INTEGER;
  basic_count INTEGER;
  pro_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_services FROM service_categories;
  SELECT COUNT(*) INTO basic_count FROM service_categories WHERE plan_type = 'basic';
  SELECT COUNT(*) INTO pro_count FROM service_categories WHERE plan_type = 'pro';
  
  RAISE NOTICE '';
  RAISE NOTICE '🛍️ TABLE SERVICE_CATEGORIES CRÉÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total services : %', total_services;
  RAISE NOTICE '📦 Services Basic : %', basic_count;
  RAISE NOTICE '💼 Services Pro : %', pro_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Les modifications admin seront maintenant sauvegardées !';
  RAISE NOTICE '';
END $$;
