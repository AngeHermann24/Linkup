-- Script pour vérifier les comptes existants

-- 1. Voir tous les profils existants
SELECT 
  id,
  email,
  full_name,
  role,
  service_category,
  service_type,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Compter les comptes par rôle
SELECT 
  role,
  COUNT(*) as nombre_comptes
FROM profiles 
GROUP BY role;

-- 3. Voir les utilisateurs authentifiés (table auth.users)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- 4. Vérifier la correspondance entre auth.users et profiles
SELECT 
  au.email as auth_email,
  au.email_confirmed_at,
  p.email as profile_email,
  p.role,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN 'PROFIL MANQUANT'
    ELSE 'OK'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
