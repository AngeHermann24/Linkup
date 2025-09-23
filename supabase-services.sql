-- Script SQL pour la gestion des services des prestataires

-- 1. Table des services offerts par les prestataires
CREATE TABLE IF NOT EXISTS provider_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL, -- Nom du service (basé sur service_category du profil)
  service_type TEXT NOT NULL CHECK (service_type IN ('basique', 'pro')), -- Type de service
  title TEXT NOT NULL, -- Titre personnalisé de l'offre
  description TEXT, -- Description détaillée du service
  short_description TEXT, -- Description courte pour les listes
  base_price DECIMAL(10,2), -- Prix de base
  price_unit TEXT DEFAULT 'FCFA', -- Unité de prix
  price_type TEXT DEFAULT 'fixe' CHECK (price_type IN ('fixe', 'horaire', 'forfait')), -- Type de tarification
  duration_minutes INTEGER, -- Durée estimée en minutes
  is_active BOOLEAN DEFAULT true, -- Service actif ou non
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un prestataire ne peut avoir qu'un seul service actif de son type
  UNIQUE(provider_id, service_name)
);

-- 2. Table des photos/images des services
CREATE TABLE IF NOT EXISTS service_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL, -- URL de l'image dans le bucket Supabase
  image_name TEXT NOT NULL, -- Nom original du fichier
  image_size INTEGER, -- Taille en bytes
  is_primary BOOLEAN DEFAULT false, -- Image principale du service
  alt_text TEXT, -- Texte alternatif pour l'accessibilité
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des tarifs personnalisés (optionnel)
CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE NOT NULL,
  pricing_name TEXT NOT NULL, -- Ex: "Réparation simple", "Réparation complexe"
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des zones de service (optionnel)
CREATE TABLE IF NOT EXISTS service_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE NOT NULL,
  area_name TEXT NOT NULL, -- Ex: "Abidjan", "Cocody", "Plateau"
  additional_cost DECIMAL(10,2) DEFAULT 0, -- Coût supplémentaire pour cette zone
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_services()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Triggers pour updated_at
CREATE TRIGGER update_provider_services_updated_at 
  BEFORE UPDATE ON provider_services 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_services();

CREATE TRIGGER update_service_images_updated_at 
  BEFORE UPDATE ON service_images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_services();

CREATE TRIGGER update_service_pricing_updated_at 
  BEFORE UPDATE ON service_pricing 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_services();

CREATE TRIGGER update_service_areas_updated_at 
  BEFORE UPDATE ON service_areas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_services();

-- 7. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_provider_services_provider_id 
  ON provider_services(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_services_active 
  ON provider_services(provider_id, is_active);

CREATE INDEX IF NOT EXISTS idx_service_images_service_id 
  ON service_images(service_id);

CREATE INDEX IF NOT EXISTS idx_service_images_primary 
  ON service_images(service_id, is_primary);

-- 8. Vue pour récupérer les services avec leurs images
CREATE OR REPLACE VIEW provider_services_with_images AS
SELECT 
  ps.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', si.id,
        'image_url', si.image_url,
        'image_name', si.image_name,
        'is_primary', si.is_primary,
        'alt_text', si.alt_text
      ) ORDER BY si.is_primary DESC, si.created_at
    ) FILTER (WHERE si.id IS NOT NULL),
    '[]'::json
  ) as images,
  (
    SELECT si2.image_url 
    FROM service_images si2 
    WHERE si2.service_id = ps.id AND si2.is_primary = true 
    LIMIT 1
  ) as primary_image_url
FROM provider_services ps
LEFT JOIN service_images si ON ps.id = si.service_id
GROUP BY ps.id
ORDER BY ps.created_at DESC;

-- 9. Fonction pour initialiser le service d'un prestataire
CREATE OR REPLACE FUNCTION initialize_provider_service(
  p_provider_id UUID,
  p_service_name TEXT,
  p_service_type TEXT
)
RETURNS UUID AS $$
DECLARE
  service_id UUID;
  default_title TEXT;
  default_description TEXT;
BEGIN
  -- Définir des titres et descriptions par défaut selon le service
  CASE p_service_name
    WHEN 'mécanicien' THEN
      default_title := 'Services de mécanique automobile';
      default_description := 'Réparation et entretien de véhicules, diagnostic, révision complète.';
    WHEN 'plombier' THEN
      default_title := 'Services de plomberie';
      default_description := 'Installation, réparation et maintenance des systèmes de plomberie.';
    WHEN 'électricien' THEN
      default_title := 'Services électriques';
      default_description := 'Installation électrique, dépannage, mise aux normes.';
    WHEN 'peintre' THEN
      default_title := 'Services de peinture';
      default_description := 'Peinture intérieure et extérieure, décoration, finitions.';
    WHEN 'jardinier' THEN
      default_title := 'Services de jardinage';
      default_description := 'Entretien d''espaces verts, taille, plantation, aménagement.';
    WHEN 'coiffeuse' THEN
      default_title := 'Services de coiffure';
      default_description := 'Coupe, coloration, coiffage, soins capillaires.';
    WHEN 'traiteur' THEN
      default_title := 'Services de traiteur';
      default_description := 'Préparation de repas, événements, livraison.';
    WHEN 'maquilleuse' THEN
      default_title := 'Services de maquillage';
      default_description := 'Maquillage professionnel, mariages, événements.';
    WHEN 'pâtissier' THEN
      default_title := 'Services de pâtisserie';
      default_description := 'Gâteaux personnalisés, pâtisseries, desserts sur commande.';
    ELSE
      default_title := 'Services de ' || p_service_name;
      default_description := 'Services professionnels de qualité.';
  END CASE;

  -- Insérer le service par défaut
  INSERT INTO provider_services (
    provider_id, 
    service_name, 
    service_type, 
    title, 
    description,
    short_description,
    base_price,
    price_type,
    duration_minutes
  ) VALUES (
    p_provider_id,
    p_service_name,
    p_service_type,
    default_title,
    default_description,
    LEFT(default_description, 100),
    CASE p_service_type 
      WHEN 'pro' THEN 15000.00 
      ELSE 5000.00 
    END,
    'fixe',
    CASE p_service_name
      WHEN 'coiffeuse' THEN 120
      WHEN 'maquilleuse' THEN 90
      ELSE 60
    END
  ) RETURNING id INTO service_id;

  RETURN service_id;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
SELECT 'Tables des services créées avec succès!' as status;
