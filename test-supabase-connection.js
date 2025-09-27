// Test rapide de connexion Supabase
// Exécuter avec: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js')

// Remplacez par vos vraies valeurs
const supabaseUrl = 'VOTRE_SUPABASE_URL'
const supabaseKey = 'VOTRE_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔍 Test de connexion Supabase...')
    
    // Test 1: Connexion basique
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message)
      return
    }
    
    console.log('✅ Connexion Supabase: OK')
    
    // Test 2: Vérifier la fonction RPC
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('create_service_request', {
        p_client_id: '00000000-0000-0000-0000-000000000000',
        p_provider_id: '00000000-0000-0000-0000-000000000000',
        p_service_type: 'test',
        p_title: 'Test'
      })
    
    if (rpcError) {
      console.log('⚠️ Fonction RPC create_service_request:', rpcError.message)
    } else {
      console.log('✅ Fonction RPC: Disponible')
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err.message)
  }
}

testConnection()
