-- =====================================================
-- RESTAURATION DE LA FONCTION create_service_request
-- Fonction RPC qui était utilisée avant mes modifications
-- =====================================================

-- Créer ou remplacer la fonction RPC
CREATE OR REPLACE FUNCTION create_service_request(
  p_client_id UUID,
  p_provider_id UUID,
  p_service_id UUID DEFAULT NULL,
  p_service_type TEXT DEFAULT 'basic',
  p_title TEXT DEFAULT '',
  p_description TEXT DEFAULT NULL,
  p_preferred_date DATE DEFAULT NULL,
  p_preferred_time TIME DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_estimated_price DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_request_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est connecté
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé: utilisateur non connecté';
  END IF;
  
  -- Vérifier que l'utilisateur est bien le client
  IF auth.uid() != p_client_id THEN
    RAISE EXCEPTION 'Non autorisé: vous ne pouvez créer des demandes que pour vous-même';
  END IF;
  
  -- Insérer la nouvelle demande
  INSERT INTO service_requests (
    client_id,
    provider_id,
    service_id,
    service_type,
    title,
    description,
    preferred_date,
    preferred_time,
    address,
    phone,
    estimated_price,
    price_unit,
    status
  ) VALUES (
    p_client_id,
    p_provider_id,
    p_service_id,
    p_service_type,
    p_title,
    p_description,
    p_preferred_date,
    p_preferred_time,
    p_address,
    p_phone,
    p_estimated_price,
    'FCFA',
    'pending'
  ) RETURNING id INTO new_request_id;
  
  -- Retourner l'ID de la nouvelle demande
  RETURN new_request_id;
END;
$$;

-- Donner les permissions appropriées
GRANT EXECUTE ON FUNCTION create_service_request TO authenticated;

-- Vérifier que la fonction existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_service_request'
  ) THEN
    RAISE NOTICE '✅ Fonction create_service_request restaurée !';
    RAISE NOTICE '🎯 Les demandes de service devraient maintenant fonctionner.';
  ELSE
    RAISE NOTICE '❌ Erreur: fonction non créée';
  END IF;
END $$;
