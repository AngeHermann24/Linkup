-- Script SQL pour configurer le stockage des images de services

-- 1. Créer le bucket pour les images de services (à exécuter dans l'interface Supabase Storage)
-- Ce script doit être adapté selon l'interface Supabase Storage

-- 2. Politiques RLS pour le bucket 'service-images'
-- Permettre aux prestataires de télécharger leurs propres images

-- Politique pour permettre la lecture publique des images
CREATE POLICY "Public read access for service images" ON storage.objects
  FOR SELECT USING (bucket_id = 'service-images');

-- Politique pour permettre aux prestataires de télécharger leurs images
CREATE POLICY "Providers can upload their service images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'service-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Politique pour permettre aux prestataires de mettre à jour leurs images
CREATE POLICY "Providers can update their service images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'service-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Politique pour permettre aux prestataires de supprimer leurs images
CREATE POLICY "Providers can delete their service images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'service-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Fonction utilitaire pour générer l'URL complète d'une image
CREATE OR REPLACE FUNCTION get_service_image_url(image_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'https://your-project-id.supabase.co/storage/v1/object/public/service-images/' || image_path;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour nettoyer les images orphelines
CREATE OR REPLACE FUNCTION cleanup_orphaned_service_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Supprimer les enregistrements d'images dont les fichiers n'existent plus
  -- Cette fonction nécessiterait une logique plus complexe avec l'API Storage
  
  -- Pour l'instant, on supprime juste les enregistrements sans service associé
  DELETE FROM service_images 
  WHERE service_id NOT IN (SELECT id FROM provider_services);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Instructions pour créer le bucket manuellement :
/*
1. Allez dans Supabase Dashboard > Storage
2. Cliquez sur "New bucket"
3. Nom du bucket: "service-images"
4. Public bucket: true (pour permettre l'accès public aux images)
5. File size limit: 5MB (optionnel)
6. Allowed MIME types: image/jpeg, image/png, image/webp (optionnel)
*/

SELECT 'Configuration du stockage préparée. Créez le bucket "service-images" manuellement dans l''interface Supabase.' as status;
