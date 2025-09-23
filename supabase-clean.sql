-- Script de nettoyage complet pour Supabase

-- 1. Supprimer TOUTES les politiques existantes
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- 2. Désactiver RLS
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer les triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- 4. Supprimer les fonctions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 5. Supprimer la table
DROP TABLE IF EXISTS profiles;

-- Message de confirmation
SELECT 'Nettoyage terminé - vous pouvez maintenant exécuter le script principal' as status;
