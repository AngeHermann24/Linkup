import { useState } from 'react'
import { useRequests } from '../hooks/useRequests'
import './RequestsManager.css'

const RequestsManager = () => {
  const { 
    requests, 
    notifications, 
    loading, 
    error, 
    unreadCount,
    pendingRequests,
    acceptedRequests,
    completedRequests,
    respondToRequest,
    markNotificationsRead
  } = useRequests()

  const [selectedTab, setSelectedTab] = useState<'pending' | 'accepted' | 'completed' | 'all'>('pending')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  const handleAccept = async (requestId: string) => {
    try {
      setRespondingTo(requestId)
      await respondToRequest(requestId, 'accepted', 'Demande acceptée ! Je vous contacterai bientôt.')
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setRespondingTo(null)
    }
  }

  const handleRefuse = async (requestId: string) => {
    try {
      setRespondingTo(requestId)
      await respondToRequest(requestId, 'refused', 'Désolé, je ne peux pas prendre cette demande pour le moment.')
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setRespondingTo(null)
    }
  }

  const getFilteredRequests = () => {
    switch (selectedTab) {
      case 'pending':
        return pendingRequests
      case 'accepted':
        return acceptedRequests
      case 'completed':
        return completedRequests
      default:
        return requests
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM
  }

  if (loading) {
    return (
      <div className="requests-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement de vos demandes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="requests-container">
        <div className="error-state">
          <p>Erreur: {error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="requests-container">
      <div className="requests-header">
        <div className="requests-title">
          <h2>💬 Mes Demandes</h2>
          <p>Gérez les demandes de services de vos clients</p>
        </div>
        
        {unreadCount > 0 && (
          <div className="notifications-badge" onClick={markNotificationsRead}>
            <span className="badge-count">{unreadCount}</span>
            <span className="badge-text">Nouvelles notifications</span>
          </div>
        )}
      </div>

      {/* Onglets de filtrage */}
      <div className="requests-tabs">
        <button 
          className={`tab-btn ${selectedTab === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedTab('pending')}
        >
          ⏳ En attente ({pendingRequests.length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setSelectedTab('accepted')}
        >
          ✅ Acceptées ({acceptedRequests.length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'completed' ? 'active' : ''}`}
          onClick={() => setSelectedTab('completed')}
        >
          🏆 Terminées ({completedRequests.length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          📋 Toutes ({requests.length})
        </button>
      </div>

      {/* Liste des demandes */}
      <div className="requests-list">
        {getFilteredRequests().length === 0 ? (
          <div className="empty-state">
            <h3>Aucune demande</h3>
            <p>
              {selectedTab === 'pending' && 'Vous n\'avez pas de nouvelles demandes en attente.'}
              {selectedTab === 'accepted' && 'Aucune demande acceptée pour le moment.'}
              {selectedTab === 'completed' && 'Aucun service terminé encore.'}
              {selectedTab === 'all' && 'Vous n\'avez reçu aucune demande pour le moment.'}
            </p>
          </div>
        ) : (
          getFilteredRequests().map((request) => (
            <div key={request.id} className={`request-card ${request.status}`}>
              <div className="request-header">
                <div className="request-info">
                  <h3>{request.title}</h3>
                  <div className="request-meta">
                    <span className="service-type">{request.service_type}</span>
                    <span className="request-date">
                      Demandé le {formatDate(request.created_at)}
                    </span>
                  </div>
                </div>
                
                <div className={`status-badge ${request.status}`}>
                  {request.status === 'pending' && '⏳ En attente'}
                  {request.status === 'accepted' && '✅ Acceptée'}
                  {request.status === 'refused' && '❌ Refusée'}
                  {request.status === 'completed' && '🏆 Terminée'}
                </div>
              </div>

              <div className="request-content">
                <div className="client-info">
                  <h4>👤 Informations client :</h4>
                  <p><strong>Nom :</strong> {request.client_name}</p>
                  <p><strong>Téléphone :</strong> {request.phone || request.client_phone_profile || 'Non renseigné'}</p>
                  {request.address && <p><strong>Adresse :</strong> {request.address}</p>}
                </div>

                {request.description && (
                  <div className="request-description">
                    <h4>📝 Description :</h4>
                    <p>{request.description}</p>
                  </div>
                )}

                <div className="request-details">
                  {request.preferred_date && (
                    <div className="detail-item">
                      <span className="detail-label">📅 Date souhaitée :</span>
                      <span className="detail-value">{formatDate(request.preferred_date)}</span>
                    </div>
                  )}
                  
                  {request.preferred_time && (
                    <div className="detail-item">
                      <span className="detail-label">🕒 Heure souhaitée :</span>
                      <span className="detail-value">{formatTime(request.preferred_time)}</span>
                    </div>
                  )}
                  
                  {request.estimated_price && (
                    <div className="detail-item">
                      <span className="detail-label">💰 Budget estimé :</span>
                      <span className="detail-value">{request.estimated_price} {request.price_unit}</span>
                    </div>
                  )}
                </div>

                {request.provider_response && (
                  <div className="provider-response">
                    <h4>💬 Votre réponse :</h4>
                    <p>{request.provider_response}</p>
                    <small>Répondu le {formatDate(request.response_date!)}</small>
                  </div>
                )}
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => handleAccept(request.id)}
                    disabled={respondingTo === request.id}
                  >
                    {respondingTo === request.id ? 'Traitement...' : '✅ Accepter'}
                  </button>
                  <button 
                    className="refuse-btn"
                    onClick={() => handleRefuse(request.id)}
                    disabled={respondingTo === request.id}
                  >
                    {respondingTo === request.id ? 'Traitement...' : '❌ Refuser'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notifications récentes */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          <h3>🔔 Notifications récentes</h3>
          <div className="notifications-list">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className={`notification-item ${notification.type} ${notification.is_read ? 'read' : 'unread'}`}>
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <small>{formatDate(notification.created_at)}</small>
                </div>
                {!notification.is_read && <div className="unread-dot"></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RequestsManager
