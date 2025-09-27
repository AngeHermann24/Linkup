import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProviderRegistration from '../components/ProviderRegistration'
import VerificationPending from '../components/VerificationPending'
import './ProviderVerification.css'

const ProviderVerification = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [verificationStatus, setVerificationStatus] = useState<'not_started' | 'pending' | 'approved' | 'rejected'>('not_started')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    checkVerificationStatus()
  }, [user, navigate])

  const checkVerificationStatus = async () => {
    try {
      setLoading(true)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        return
      }

      setUserProfile(profile)

      // Déterminer le statut de vérification
      if (!profile.submitted_at) {
        setVerificationStatus('not_started')
      } else if (profile.verification_status === 'pending') {
        setVerificationStatus('pending')
      } else if (profile.verification_status === 'approved') {
        setVerificationStatus('approved')
        // Rediriger vers le dashboard si approuvé
        navigate('/dashboard')
      } else if (profile.verification_status === 'rejected') {
        setVerificationStatus('rejected')
      }

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationComplete = () => {
    // Rafraîchir le statut après soumission
    checkVerificationStatus()
  }

  if (loading) {
    return (
      <div className="verification-loading">
        <div className="loading-spinner"></div>
        <p>Vérification de votre statut...</p>
      </div>
    )
  }

  // Si pas encore commencé la vérification
  if (verificationStatus === 'not_started') {
    return (
      <div className="provider-verification-page">
        <div className="verification-intro">
          <h1>🔐 Vérification de votre compte prestataire</h1>
          <p>
            Pour garantir la qualité de notre plateforme, tous les prestataires doivent être vérifiés.
            Ce processus prend généralement 24-48 heures.
          </p>
          <div className="verification-benefits">
            <h3>Avantages de la vérification :</h3>
            <ul>
              <li>✅ Accès complet à la plateforme</li>
              <li>🎯 Recevoir des demandes de clients</li>
              <li>💰 Commencer à gagner de l'argent</li>
              <li>🛡️ Badge de confiance sur votre profil</li>
            </ul>
          </div>
        </div>
        
        <ProviderRegistration onComplete={handleVerificationComplete} />
      </div>
    )
  }

  // Si en attente ou rejeté
  if (verificationStatus === 'pending' || verificationStatus === 'rejected') {
    return (
      <VerificationPending
        providerName={userProfile?.full_name || 'Prestataire'}
        submittedAt={userProfile?.submitted_at}
        verificationStatus={verificationStatus}
        rejectionReason={userProfile?.verification_notes}
      />
    )
  }

  // Par défaut, rediriger vers le dashboard
  return null
}

export default ProviderVerification
