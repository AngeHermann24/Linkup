-- Script SQL pour le système de demandes de services

-- 1. Table des demandes de services
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE,
  
  -- Informations de la demande
  service_type TEXT NOT NULL, -- Type de service demandé
  title TEXT NOT NULL, -- Titre de la demande
  description TEXT, -- Description détaillée du besoin
  preferred_date DATE, -- Date souhaitée
  preferred_time TIME, -- Heure souhaitée
  address TEXT, -- Adresse d'intervention
  phone TEXT, -- Téléphone du client
  
  -- Informations tarifaires
  estimated_price DECIMAL(10,2), -- Prix estimé du service
  price_unit TEXT DEFAULT 'FCFA',
  
  -- Statut de la demande
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused', 'completed', 'cancelled')),
  
  -- Réponse du prestataire
  provider_response TEXT, -- Message optionnel du prestataire
  response_date TIMESTAMP WITH TIME ZONE, -- Date de réponse
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  
  -- Contenu de la notification
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  
  -- État de la notification
  is_read BOOLEAN DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id 
  ON service_requests(client_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id 
  ON service_requests(provider_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_status 
  ON service_requests(status);

CREATE INDEX IF NOT EXISTS idx_service_requests_created_at 
  ON service_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, is_read);

-- 4. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_requests()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers pour updated_at
CREATE TRIGGER update_service_requests_updated_at 
  BEFORE UPDATE ON service_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_requests();

-- 6. Fonction pour créer une notification automatique
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_request_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, request_id, title, message, type)
  VALUES (p_user_id, p_request_id, p_title, p_message, p_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour traiter une réponse de prestataire
CREATE OR REPLACE FUNCTION respond_to_request(
  p_request_id UUID,
  p_provider_id UUID,
  p_status TEXT,
  p_response TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  request_record service_requests%ROWTYPE;
  client_notification_title TEXT;
  client_notification_message TEXT;
BEGIN
  -- Vérifier que la demande existe et appartient au prestataire
  SELECT * INTO request_record 
  FROM service_requests 
  WHERE id = p_request_id AND provider_id = p_provider_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mettre à jour la demande
  UPDATE service_requests 
  SET 
    status = p_status,
    provider_response = p_response,
    response_date = NOW()
  WHERE id = p_request_id;
  
  -- Créer la notification pour le client
  IF p_status = 'accepted' THEN
    client_notification_title := '✅ Demande acceptée !';
    client_notification_message := 'Votre demande de ' || request_record.service_type || ' a été acceptée. Le prestataire vous contactera bientôt.';
  ELSIF p_status = 'refused' THEN
    client_notification_title := '❌ Demande refusée';
    client_notification_message := 'Votre demande de ' || request_record.service_type || ' a été refusée. Vous pouvez essayer avec un autre prestataire.';
  END IF;
  
  -- Insérer la notification
  PERFORM create_notification(
    request_record.client_id,
    p_request_id,
    client_notification_title,
    client_notification_message,
    CASE WHEN p_status = 'accepted' THEN 'success' ELSE 'warning' END
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Vue pour les demandes avec informations complètes
CREATE OR REPLACE VIEW service_requests_detailed AS
SELECT 
  sr.*,
  -- Informations client
  cp.full_name as client_name,
  cp.email as client_email,
  cp.phone as client_phone_profile,
  -- Informations prestataire
  pp.full_name as provider_name,
  pp.service_category as provider_service,
  -- Informations service
  ps.title as service_title,
  ps.base_price as service_base_price
FROM service_requests sr
LEFT JOIN profiles cp ON sr.client_id = cp.id
LEFT JOIN profiles pp ON sr.provider_id = pp.id
LEFT JOIN provider_services ps ON sr.service_id = ps.id
ORDER BY sr.created_at DESC;

-- 9. Fonction pour créer une nouvelle demande
CREATE OR REPLACE FUNCTION create_service_request(
  p_client_id UUID,
  p_provider_id UUID,
  p_service_id UUID,
  p_service_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_preferred_date DATE,
  p_preferred_time TIME,
  p_address TEXT,
  p_phone TEXT,
  p_estimated_price DECIMAL
)
RETURNS UUID AS $$
DECLARE
  request_id UUID;
  provider_name TEXT;
BEGIN
  -- Récupérer le nom du prestataire
  SELECT full_name INTO provider_name 
  FROM profiles 
  WHERE id = p_provider_id;
  
  -- Créer la demande
  INSERT INTO service_requests (
    client_id, provider_id, service_id, service_type, title, description,
    preferred_date, preferred_time, address, phone, estimated_price
  ) VALUES (
    p_client_id, p_provider_id, p_service_id, p_service_type, p_title, p_description,
    p_preferred_date, p_preferred_time, p_address, p_phone, p_estimated_price
  ) RETURNING id INTO request_id;
  
  -- Créer la notification pour le prestataire
  PERFORM create_notification(
    p_provider_id,
    request_id,
    '🔔 Nouvelle demande de service',
    'Vous avez reçu une nouvelle demande pour ' || p_service_type || '. Consultez votre dashboard pour répondre.',
    'info'
  );
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Fonction pour marquer les notifications comme lues
CREATE OR REPLACE FUNCTION mark_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = true 
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
SELECT 'Tables des demandes de services créées avec succès!' as status;
