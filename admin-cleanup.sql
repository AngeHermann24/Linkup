-- =====================================================
-- SCRIPT DE NETTOYAGE - PANEL ADMIN LINKUP
-- À utiliser SEULEMENT si vous voulez tout recommencer
-- =====================================================

-- ⚠️ ATTENTION: Ce script supprime TOUTES les données !
-- Utilisez-le seulement en développement

-- Supprimer les vues
DROP VIEW IF EXISTS admin_provider_subscriptions CASCADE;
DROP VIEW IF EXISTS admin_dashboard_stats CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS admin_search_users(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS admin_search_requests(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS admin_search_categories(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS can_provider_offer_service(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_admin(TEXT) CASCADE;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_service_categories_updated_at ON service_categories;
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
DROP TRIGGER IF EXISTS update_provider_subscriptions_updated_at ON provider_subscriptions;
DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;

-- Supprimer les fonctions de trigger
DROP FUNCTION IF EXISTS update_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_service_categories_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_services_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_provider_subscriptions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_service_requests_updated_at() CASCADE;

-- Supprimer les tables (dans l'ordre des dépendances)
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS provider_subscriptions CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
-- Note: Ne pas supprimer profiles si elle est utilisée ailleurs

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Nettoyage terminé. Vous pouvez maintenant réexécuter le script complet.';
END $$;
