-- Script pour créer un compte client de test

-- ATTENTION: Ce script ne peut pas créer l'utilisateur dans auth.users
-- Il faut d'abord s'inscrire via l'interface, puis exécuter ce script

-- 1. Insérer un profil client de test (remplacez l'UUID par celui de votre compte)
-- Vous devez d'abord vous inscrire via l'interface pour obtenir un UUID

-- Exemple d'insertion (à adapter avec votre UUID réel) :
/*
INSERT INTO profiles (
  id, -- UUID de auth.users (obtenu après inscription)
  email,
  full_name,
  phone,
  role
) VALUES (
  'VOTRE-UUID-ICI', -- Remplacez par votre UUID réel
  'client@test.com',
  'Client Test',
  '+225 07 12 34 56 78',
  'client'
) ON CONFLICT (id) DO UPDATE SET
  role = 'client',
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;
*/

-- 2. Vérifier que le profil a été créé
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE role = 'client'
ORDER BY created_at DESC;

-- Message d'instruction
SELECT 'Pour utiliser ce script:' as instruction
UNION ALL
SELECT '1. Inscrivez-vous d''abord via l''interface web'
UNION ALL  
SELECT '2. Récupérez votre UUID avec: SELECT id FROM auth.users WHERE email = ''votre@email.com'''
UNION ALL
SELECT '3. Remplacez VOTRE-UUID-ICI dans le script'
UNION ALL
SELECT '4. Décommentez et exécutez l''INSERT';
