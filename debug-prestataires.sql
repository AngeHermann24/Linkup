-- Script de debug pour vérifier les prestataires

-- 1. Compter tous les profils prestataires
SELECT 
  'Tous les prestataires' as type,
  COUNT(*) as nombre
FROM profiles 
WHERE role = 'prestataire';

-- 2. Compter les prestataires par statut de vérification
SELECT 
  verification_status,
  COUNT(*) as nombre
FROM profiles 
WHERE role = 'prestataire'
GROUP BY verification_status;

-- 3. Lister tous les prestataires avec détails
SELECT 
  id,
  full_name,
  email,
  service_category,
  service_type,
  verification_status,
  created_at
FROM profiles 
WHERE role = 'prestataire'
ORDER BY created_at DESC;

-- 4. Prestataires approuvés avec service_category
SELECT 
  id,
  full_name,
  service_category,
  service_type,
  verification_status
FROM profiles 
WHERE role = 'prestataire' 
  AND verification_status = 'approved'
  AND service_category IS NOT NULL
ORDER BY created_at DESC;

-- 5. Vérifier s'il y a des problèmes de données
SELECT 
  'Prestataires sans service_category' as probleme,
  COUNT(*) as nombre
FROM profiles 
WHERE role = 'prestataire' 
  AND service_category IS NULL;

SELECT 
  'Prestataires non approuvés' as probleme,
  COUNT(*) as nombre
FROM profiles 
WHERE role = 'prestataire' 
  AND verification_status != 'approved';
