import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SupabaseTest = () => {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setTestResult('Test en cours...')
    
    try {
      console.log('=== TEST CONNEXION SUPABASE ===')
      
      // Test 1: Vérifier la configuration
      console.log('URL Supabase:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Clé anonyme existe:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
      
      // Test 2: Tester une requête simple
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      console.log('Test requête profiles:', { data, error })
      
      if (error) {
        setTestResult(`❌ Erreur de connexion: ${error.message}`)
      } else {
        setTestResult('✅ Connexion Supabase OK')
      }
      
      // Test 3: Vérifier l'état de l'auth
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session actuelle:', session)
      
    } catch (err: any) {
      console.error('Erreur test:', err)
      setTestResult(`❌ Erreur technique: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    setLoading(true)
    setTestResult('Test auth en cours...')
    
    try {
      // Tester avec des identifiants de test
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
      
      console.log('Test auth result:', { data, error })
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setTestResult('✅ Auth fonctionne (erreur attendue pour test@example.com)')
        } else {
          setTestResult(`⚠️ Erreur auth: ${error.message}`)
        }
      } else {
        setTestResult('⚠️ Auth a réussi avec des identifiants de test (inattendu)')
      }
      
    } catch (err: any) {
      setTestResult(`❌ Erreur test auth: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      minWidth: '300px',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>🔧 Debug Supabase</h4>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={testConnection}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Test Connexion
        </button>
        
        <button
          onClick={testAuth}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Test Auth
        </button>
      </div>
      
      {testResult && (
        <div style={{
          padding: '0.75rem',
          background: testResult.includes('✅') ? '#f0fdf4' : 
                     testResult.includes('⚠️') ? '#fefce8' : '#fef2f2',
          border: `1px solid ${testResult.includes('✅') ? '#10b981' : 
                                testResult.includes('⚠️') ? '#f59e0b' : '#ef4444'}`,
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#1f2937'
        }}>
          {testResult}
        </div>
      )}
      
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
        Ouvrez la console (F12) pour plus de détails
      </div>
    </div>
  )
}

export default SupabaseTest
