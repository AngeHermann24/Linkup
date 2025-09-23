-- Script SQL simplifié pour Linkup - Solution pour erreur RLS

-- 1. Créer la table profiles (sans RLS d'abord)
CREATE TABLE IF NOT EXISTS profiles (
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

-- 3. Créer une politique simple pour tous les accès authentifiés
CREATE POLICY "Allow authenticated users full access" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Fonction pour mettre à jour updated_at
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

-- 6. IMPORTANT: Créer des politiques spécifiques pour RLS
-- Politique pour permettre aux utilisateurs de lire leur propre profil
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de créer leur profil
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de modifier leur profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Politique pour permettre de voir les profils des prestataires (optionnel)
CREATE POLICY "Anyone can view provider profiles" ON profiles
  FOR SELECT USING (role = 'prestataire');

-- 7. Vérification des politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';