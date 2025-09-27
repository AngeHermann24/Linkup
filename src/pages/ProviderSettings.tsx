import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProviderVerificationForm from '../components/ProviderVerificationForm'
import VerificationPending from '../components/VerificationPending'
import './ProviderSettings.css'

const ProviderSettings = () => {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [verificationStatus, setVerificationStatus] = useState<'not_started' | 'pending' | 'approved' | 'rejected'>('not_started')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        return
      }

      setUserProfile(profileData)

      // Déterminer le statut de vérification
      if (!profileData.submitted_at) {
        setVerificationStatus('not_started')
      } else if (profileData.verification_status === 'pending') {
        setVerificationStatus('pending')
      } else if (profileData.verification_status === 'approved') {
        setVerificationStatus('approved')
      } else if (profileData.verification_status === 'rejected') {
        setVerificationStatus('rejected')
      }

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationComplete = () => {
    checkVerificationStatus()
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getServiceTypeLabel = (type: string) => {
    return type === 'basique' ? 'Services Basiques' : 'Services Pro'
  }

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de vos paramètres...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Header Navigation */}
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <Link to="/dashboard/prestataire" className="dashboard-logo">
            <img src="/Linkup lo.png" alt="Linkup" className="logo-image" />
          </Link>
          
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <nav className={`dashboard-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link 
              to="/dashboard/prestataire" 
              className="nav-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏠 Tableau de bord
            </Link>
            <Link 
              to="/services" 
              className="nav-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🛠️ Mes Services
            </Link>
            <Link 
              to="/planning" 
              className="nav-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📅 Planning
            </Link>
            <Link 
              to="/requests" 
              className="nav-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📋 Demandes
            </Link>
            <Link 
              to="/settings" 
              className="nav-item active"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ⚙️ Paramètres
            </Link>
          </nav>
          
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">{profile?.full_name || 'Prestataire'}</span>
              <span className="user-role">
                {profile?.service_category} - {profile?.service_type && getServiceTypeLabel(profile.service_type)}
              </span>
            </div>
            <button onClick={handleSignOut} className="sign-out-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="settings-main">
        <div className="settings-container">
          <h1 className="settings-title">⚙️ Paramètres du Compte</h1>

          {/* Section Vérification */}
          <div className="settings-section verification-section">
            <div className="section-header">
              <h2>🔐 Vérification du Compte</h2>
              <div className={`verification-badge ${verificationStatus}`}>
                {verificationStatus === 'approved' && '✅ Vérifié'}
                {verificationStatus === 'pending' && '⏳ En attente'}
                {verificationStatus === 'rejected' && '❌ Rejeté'}
                {verificationStatus === 'not_started' && '⚠️ Non vérifié'}
              </div>
            </div>

            {verificationStatus === 'not_started' && (
              <div className="verification-content">
                <div className="verification-info">
                  <h3>Pourquoi se faire vérifier ?</h3>
                  <ul>
                    <li>✅ Recevoir des demandes de clients</li>
                    <li>🎯 Augmenter votre visibilité</li>
                    <li>💰 Commencer à gagner de l'argent</li>
                    <li>🛡️ Badge de confiance sur votre profil</li>
                  </ul>
                  <p className="verification-note">
                    La vérification prend généralement 24-48 heures. Vous devrez fournir une photo de profil et une pièce d'identité.
                  </p>
                </div>
                
                <ProviderVerificationForm onComplete={handleVerificationComplete} />
              </div>
            )}

            {verificationStatus === 'pending' && (
              <VerificationPending
                providerName={userProfile?.full_name || 'Prestataire'}
                submittedAt={userProfile?.submitted_at}
                verificationStatus="pending"
              />
            )}

            {verificationStatus === 'rejected' && (
              <VerificationPending
                providerName={userProfile?.full_name || 'Prestataire'}
                submittedAt={userProfile?.submitted_at}
                verificationStatus="rejected"
                rejectionReason={userProfile?.verification_notes}
              />
            )}

            {verificationStatus === 'approved' && (
              <div className="verification-approved">
                <div className="approved-message">
                  <div className="approved-icon">🎉</div>
                  <h3>Félicitations ! Votre compte est vérifié</h3>
                  <p>Vous pouvez maintenant recevoir des demandes de clients et utiliser toutes les fonctionnalités de la plateforme.</p>
                  
                  <div className="verification-details">
                    <div className="detail-item">
                      <span className="detail-label">Vérifié le :</span>
                      <span className="detail-value">
                        {userProfile?.verified_at ? new Date(userProfile.verified_at).toLocaleDateString('fr-FR') : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Vérifié par :</span>
                      <span className="detail-value">{userProfile?.verified_by || 'Admin Linkup'}</span>
                    </div>
                    {userProfile?.verification_notes && (
                      <div className="detail-item">
                        <span className="detail-label">Notes :</span>
                        <span className="detail-value">{userProfile.verification_notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Informations Personnelles */}
          <div className="settings-section profile-section">
            <div className="section-header">
              <h2>👤 Informations Personnelles</h2>
            </div>
            
            <div className="profile-info">
              <div className="info-grid">
                <div className="info-item">
                  <label>Nom complet</label>
                  <span>{userProfile?.full_name || 'Non renseigné'}</span>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <span>{userProfile?.email || 'Non renseigné'}</span>
                </div>
                <div className="info-item">
                  <label>Téléphone</label>
                  <span>{userProfile?.phone || 'Non renseigné'}</span>
                </div>
                <div className="info-item">
                  <label>Service</label>
                  <span>{userProfile?.service_category || 'Non renseigné'}</span>
                </div>
              </div>
              
              <button className="edit-profile-btn">
                ✏️ Modifier mes informations
              </button>
            </div>
          </div>

          {/* Section Sécurité */}
          <div className="settings-section security-section">
            <div className="section-header">
              <h2>🔒 Sécurité</h2>
            </div>
            
            <div className="security-actions">
              <button className="security-btn">
                🔑 Changer le mot de passe
              </button>
              <button className="security-btn danger" onClick={handleSignOut}>
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProviderSettings
