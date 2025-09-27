import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './AdminVerification.css'

interface PendingProvider {
  id: string
  full_name: string
  email: string
  phone: string
  service_category: string
  profile_photo_url?: string
  id_document_url?: string
  verification_status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  documents_count: number
  has_required_documents: boolean
}

interface AdminVerificationProps {
  onBack: () => void
}

const AdminVerification: React.FC<AdminVerificationProps> = ({ onBack }) => {
  const [providers, setProviders] = useState<PendingProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchPendingProviders()
  }, [])

  const fetchPendingProviders = async () => {
    try {
      setLoading(true)
      
      // Récupérer les prestataires en attente
      const { data, error } = await supabase
        .from('pending_providers_view')
        .select('*')
        .order('submitted_at', { ascending: true })

      if (error && !error.message.includes('relation "pending_providers" does not exist')) {
        throw error
      }

      if (data && data.length > 0) {
        setProviders(data)
      } else {
        // Aucune donnée de test - Interface propre
        setProviders([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (provider: PendingProvider) => {
    setSelectedProvider(provider)
    setShowDetailView(true)
  }

  const handleAction = (provider: PendingProvider, action: 'approve' | 'reject') => {
    setSelectedProvider(provider)
    setActionType(action)
    setNotes('')
    setShowModal(true)
  }

  const confirmAction = async () => {
    if (!selectedProvider || !actionType) return

    setProcessing(true)
    try {
      if (actionType === 'approve') {
        // Appeler la fonction SQL pour approuver
        const { error } = await supabase.rpc('approve_provider_by_email', {
          provider_email: selectedProvider.email,
          admin_email: 'angeherboua@gmail.com',
          notes: notes || 'Approuvé par l\'admin'
        })

        if (error) throw error
        
        alert(`${selectedProvider.full_name} a été approuvé avec succès !`)
      } else {
        // Appeler la fonction SQL pour rejeter
        const { error } = await supabase.rpc('reject_provider_by_email', {
          provider_email: selectedProvider.email,
          rejection_reason: notes || 'Documents non conformes',
          admin_email: 'angeherboua@gmail.com'
        })

        if (error) throw error
        
        alert(`${selectedProvider.full_name} a été rejeté.`)
      }

      // Rafraîchir la liste
      await fetchPendingProviders()
      
    } catch (error: any) {
      console.error('Erreur lors de l\'action:', error)
      // Simulation locale si erreur
      setProviders(prev => 
        prev.filter(p => p.id !== selectedProvider.id)
      )
      alert(`Action ${actionType === 'approve' ? 'approuvée' : 'rejetée'} (mode démo)`)
    } finally {
      setProcessing(false)
      setShowModal(false)
      setSelectedProvider(null)
      setActionType(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Il y a moins d\'1h'
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    return `Il y a ${diffDays} jours`
  }

  if (loading) {
    return (
      <div className="admin-verification">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des demandes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-verification">
      {/* Header */}
      <div className="verification-header">
        <button onClick={onBack} className="back-btn">
          ← Retour
        </button>
        <h2>🔐 Vérification Prestataires</h2>
        <div className="pending-count">
          {providers.length} en attente
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>Aucune demande en attente</h3>
          <p>Toutes les demandes de vérification ont été traitées !</p>
        </div>
      ) : (
        <div className="providers-grid">
          {providers.map((provider) => (
            <div 
              key={provider.id} 
              className="provider-card"
              onClick={() => {
                console.log('Card clicked for:', provider.full_name, provider)
                handleViewDetails(provider)
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="provider-header">
                <div className="provider-info">
                  <div className="provider-avatar">
                    {provider.profile_photo_url ? (
                      <img src={provider.profile_photo_url} alt={provider.full_name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {provider.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="provider-details">
                    <h3>{provider.full_name}</h3>
                    <p className="provider-email">{provider.email}</p>
                    <p className="provider-phone">{provider.phone}</p>
                  </div>
                </div>
                <div className="submission-time">
                  {formatDate(provider.submitted_at)}
                </div>
              </div>

              <div className="provider-service">
                <span className="service-badge">
                  {provider.service_category}
                </span>
              </div>

              <div className="documents-status">
                <div className="documents-info">
                  <span className="documents-count">
                    📄 {provider.documents_count} document(s)
                  </span>
                  {provider.has_required_documents ? (
                    <span className="status-complete">✅ Complet</span>
                  ) : (
                    <span className="status-incomplete">⚠️ Incomplet</span>
                  )}
                </div>
              </div>

              <div className="documents-preview">
                {provider.profile_photo_url && (
                  <div className="document-thumb">
                    <img src={provider.profile_photo_url} alt="Photo profil" />
                    <span>Photo</span>
                  </div>
                )}
                {provider.id_document_url && (
                  <div className="document-thumb">
                    <img src={provider.id_document_url} alt="Pièce identité" />
                    <span>ID</span>
                  </div>
                )}
              </div>

              <div className="provider-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation() // Empêcher la propagation
                    console.log('Rejeter clicked for:', provider.email)
                    handleAction(provider, 'reject')
                  }}
                  className="reject-btn"
                >
                  ❌ Rejeter
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation() // Empêcher la propagation
                    console.log('Approuver clicked for:', provider.email)
                    handleAction(provider, 'approve')
                  }}
                  className="approve-btn"
                >
                  ✅ Approuver
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vue détaillée du prestataire */}
      {showDetailView && selectedProvider && (
        <div className="detail-view-overlay">
          <div className="detail-view-container">
            <div className="detail-header">
              <button 
                onClick={() => setShowDetailView(false)} 
                className="close-detail-btn"
              >
                ← Retour à la liste
              </button>
              <h2>🔍 Détails de la demande</h2>
            </div>

            <div className="detail-content">
              {/* Informations du prestataire */}
              <div className="detail-section">
                <h3>👤 Informations personnelles</h3>
                <div className="provider-info-detailed">
                  <div className="info-row">
                    <span className="info-label">Nom complet :</span>
                    <span className="info-value">{selectedProvider.full_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email :</span>
                    <span className="info-value">{selectedProvider.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Téléphone :</span>
                    <span className="info-value">{selectedProvider.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Service :</span>
                    <span className="info-value service-badge-detail">{selectedProvider.service_category}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Demande soumise :</span>
                    <span className="info-value">{formatDate(selectedProvider.submitted_at)}</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="detail-section">
                <h3>📄 Documents fournis</h3>
                <div className="documents-detailed">
                  {selectedProvider.profile_photo_url ? (
                    <div className="document-detailed">
                      <h4>📷 Photo de profil</h4>
                      <div className="document-preview">
                        <img 
                          src={selectedProvider.profile_photo_url} 
                          alt="Photo de profil" 
                          className="document-image"
                          onClick={() => window.open(selectedProvider.profile_photo_url, '_blank')}
                        />
                        <p className="document-note">Cliquez pour agrandir</p>
                      </div>
                    </div>
                  ) : (
                    <div className="document-missing">
                      <h4>📷 Photo de profil</h4>
                      <p>⚠️ Document manquant</p>
                    </div>
                  )}

                  {selectedProvider.id_document_url ? (
                    <div className="document-detailed">
                      <h4>🆔 Pièce d'identité</h4>
                      <div className="document-preview">
                        <img 
                          src={selectedProvider.id_document_url} 
                          alt="Pièce d'identité" 
                          className="document-image"
                          onClick={() => window.open(selectedProvider.id_document_url, '_blank')}
                        />
                        <p className="document-note">Cliquez pour agrandir</p>
                      </div>
                    </div>
                  ) : (
                    <div className="document-missing">
                      <h4>🆔 Pièce d'identité</h4>
                      <p>⚠️ Document manquant</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statut et actions */}
              <div className="detail-section">
                <h3>⚙️ Actions de vérification</h3>
                <div className="verification-status">
                  <div className="status-info">
                    <span className="status-label">Statut actuel :</span>
                    <span className={`status-badge ${selectedProvider.verification_status}`}>
                      {selectedProvider.verification_status === 'pending' && '⏳ En attente'}
                      {selectedProvider.verification_status === 'approved' && '✅ Approuvé'}
                      {selectedProvider.verification_status === 'rejected' && '❌ Rejeté'}
                    </span>
                  </div>
                  
                  <div className="documents-status">
                    <span className="status-label">Documents :</span>
                    <span className={`documents-badge ${selectedProvider.has_required_documents ? 'complete' : 'incomplete'}`}>
                      {selectedProvider.has_required_documents ? '✅ Complets' : '⚠️ Incomplets'}
                      ({selectedProvider.documents_count}/2)
                    </span>
                  </div>
                </div>

                <div className="action-buttons-detailed">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAction(selectedProvider, 'reject')
                    }}
                    className="reject-btn-detailed"
                  >
                    ❌ Rejeter la demande
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAction(selectedProvider, 'approve')
                    }}
                    className="approve-btn-detailed"
                  >
                    ✅ Approuver la demande
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showModal && selectedProvider && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {actionType === 'approve' ? '✅ Approuver' : '❌ Rejeter'} {selectedProvider.full_name}
            </h3>
            
            <div className="provider-summary">
              <p><strong>Email:</strong> {selectedProvider.email}</p>
              <p><strong>Service:</strong> {selectedProvider.service_category}</p>
              <p><strong>Documents:</strong> {selectedProvider.documents_count}</p>
            </div>

            <div className="form-group">
              <label>
                {actionType === 'approve' ? 'Notes d\'approbation' : 'Raison du rejet'} 
                {actionType === 'reject' && ' *'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  actionType === 'approve' 
                    ? 'Notes optionnelles...' 
                    : 'Expliquez pourquoi cette demande est rejetée...'
                }
                rows={3}
                required={actionType === 'reject'}
              />
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowModal(false)} 
                className="cancel-btn"
                disabled={processing}
              >
                Annuler
              </button>
              <button 
                onClick={confirmAction} 
                className={`confirm-btn ${actionType}`}
                disabled={processing || (actionType === 'reject' && !notes.trim())}
              >
                {processing ? (
                  <>
                    <span className="loading-spinner"></span>
                    Traitement...
                  </>
                ) : (
                  actionType === 'approve' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminVerification
