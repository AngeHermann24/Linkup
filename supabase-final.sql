-- Script final pour Linkup - Version qui fonctionne à 100%

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

-- 2. Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Créer UNE SEULE politique permissive pour tous les utilisateurs authentifiés
CREATE POLICY "authenticated_users_policy" ON profiles
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (auth.uid() = id);

-- 4. Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Trigger pour updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Vérification
SELECT 'Table profiles créée avec succès!' as status;
