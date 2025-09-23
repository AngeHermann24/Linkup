import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './Planning.css'

const PlanningDebug = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availabilities, setAvailabilities] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setDebugInfo('Aucun utilisateur connecté')
        setLoading(false)
        return
      }

      try {
        setDebugInfo(`Chargement pour l'utilisateur: ${user.id}`)
        setLoading(true)
        setError(null)

        // Test de connexion Supabase
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', user.id)
          .single()

        if (testError) {
          setDebugInfo(`Erreur de connexion Supabase: ${testError.message}`)
          setError(testError.message)
          return
        }

        setDebugInfo(`Utilisateur trouvé: ${testData.full_name || 'Sans nom'}`)

        // Vérifier si la table provider_availability existe
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('provider_availability')
          .select('*')
          .eq('provider_id', user.id)
          .limit(10)

        if (availabilityError) {
          setDebugInfo(`Erreur table availability: ${availabilityError.message}`)
          setError(`Table provider_availability non trouvée: ${availabilityError.message}`)
          return
        }

        setAvailabilities(availabilityData || [])
        setDebugInfo(`${availabilityData?.length || 0} disponibilités trouvées`)

      } catch (err: any) {
        console.error('Erreur:', err)
        setError(err.message)
        setDebugInfo(`Erreur générale: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const generateTestAvailability = async () => {
    if (!user) return

    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      
      const testSlots = [
        {
          provider_id: user.id,
          date: today,
          start_time: '08:00:00',
          end_time: '08:30:00',
          is_available: true
        },
        {
          provider_id: user.id,
          date: today,
          start_time: '08:30:00',
          end_time: '09:00:00',
          is_available: true
        }
      ]

      const { data, error } = await supabase
        .from('provider_availability')
        .insert(testSlots)
        .select()

      if (error) {
        setError(`Erreur insertion: ${error.message}`)
        return
      }

      setAvailabilities(prev => [...prev, ...(data || [])])
      setDebugInfo(`${data?.length || 0} créneaux ajoutés avec succès`)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="planning-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement du planning...</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>{debugInfo}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="planning-container">
      <div className="planning-header">
        <div className="planning-title">
          <h2>🔧 Planning Debug</h2>
          <p>Mode débogage pour diagnostiquer les problèmes</p>
        </div>
      </div>

      <div className="debug-info" style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '12px', 
        marginBottom: '2rem',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        <h3>Informations de débogage :</h3>
        <p><strong>Utilisateur ID:</strong> {user?.id || 'Non connecté'}</p>
        <p><strong>Status:</strong> {debugInfo}</p>
        <p><strong>Nombre de disponibilités:</strong> {availabilities.length}</p>
        
        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#dc2626', 
            padding: '1rem', 
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <strong>Erreur:</strong> {error}
          </div>
        )}
      </div>

      <div className="actions" style={{ marginBottom: '2rem' }}>
        <button 
          className="cta-button primary" 
          onClick={generateTestAvailability}
          disabled={loading}
        >
          Créer 2 créneaux de test
        </button>
      </div>

      {availabilities.length > 0 && (
        <div className="availabilities-list" style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <h3>Disponibilités existantes :</h3>
          {availabilities.map((slot, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              marginBottom: '0.5rem'
            }}>
              <strong>{slot.date}</strong> - {slot.start_time} à {slot.end_time}
              <span style={{ 
                marginLeft: '1rem',
                color: slot.is_available ? '#10b981' : '#ef4444'
              }}>
                {slot.is_available ? '✅ Disponible' : '❌ Indisponible'}
              </span>
            </div>
          ))}
        </div>
      )}

      {availabilities.length === 0 && !error && (
        <div className="empty-state">
          <h3>Aucune disponibilité trouvée</h3>
          <p>Cliquez sur le bouton ci-dessus pour créer des créneaux de test.</p>
        </div>
      )}
    </div>
  )
}

export default PlanningDebug
