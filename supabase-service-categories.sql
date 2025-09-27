-- Table pour les catégories de services
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro')),
  price_basic INTEGER NOT NULL DEFAULT 1000,
  price_pro INTEGER NOT NULL DEFAULT 3000,
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

-- Insérer des catégories de test
INSERT INTO service_categories (name, description, plan_type, price_basic, price_pro, icon, is_active) VALUES
('Plomberie', 'Réparation et installation de plomberie', 'pro', 1000, 3000, '🔧', true),
('Coiffure', 'Services de coiffure et beauté', 'basic', 1000, 3000, '✂️', true),
('Électricité', 'Installation et réparation électrique', 'pro', 1000, 3000, '⚡', true),
('Ménage', 'Nettoyage et entretien ménager', 'basic', 1000, 3000, '🧹', true),
('Jardinage', 'Entretien et aménagement de jardins', 'basic', 1000, 3000, '🌱', true),
('Climatisation', 'Installation et maintenance de climatisation', 'pro', 1000, 3000, '❄️', true),
('Réparation Auto', 'Réparation et entretien automobile', 'pro', 1000, 3000, '🚗', true),
('Informatique', 'Dépannage et installation informatique', 'pro', 1000, 3000, '💻', true),
('Peinture', 'Peinture et décoration intérieure', 'basic', 1000, 3000, '🎨', true),
('Cuisine', 'Services de cuisine et traiteur', 'basic', 1000, 3000, '🍳', true)
ON CONFLICT (name) DO NOTHING;

-- Mettre à jour quelques catégories avec des prix différents
UPDATE service_categories SET 
  price_basic = 1500, 
  price_pro = 4000 
WHERE name IN ('Plomberie', 'Électricité', 'Climatisation');

UPDATE service_categories SET 
  price_basic = 800, 
  price_pro = 2500 
WHERE name IN ('Ménage', 'Jardinage');

UPDATE service_categories SET 
  price_basic = 1200, 
  price_pro = 3500 
WHERE name IN ('Coiffure', 'Peinture', 'Cuisine');
