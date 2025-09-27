-- =====================================================
-- ÉTAPE 1: GESTION DES UTILISATEURS - PANEL ADMIN
-- =====================================================

-- Table des profils utilisateurs (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'prestataire')),
  service_category TEXT,
  suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des recherches admin
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
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

-- Insérer des utilisateurs de test pour l'admin
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

-- Fonction pour rechercher des utilisateurs (utilisée par l'admin)
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
    p.suspended,
    p.created_at,
    p.updated_at
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
