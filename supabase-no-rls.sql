-- Script sans RLS pour test rapide

-- 1. Créer la table profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'prestataire')),
  service_type TEXT CHECK (service_type IN ('basique', 'pro')),
  service_category TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PAS de RLS pour éviter les problèmes
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; -- Commenté

-- 3. Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Trigger pour updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Note: RLS désactivé pour éviter les problèmes
-- Vous pourrez l'activer plus tard si nécessaire
SELECT 'Table profiles créée sans RLS - prête pour les tests!' as status;
