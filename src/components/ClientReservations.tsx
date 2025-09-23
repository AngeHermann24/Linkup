import { useState } from 'react'
import { useRequests } from '../hooks/useRequests'
import { useAuth } from '../contexts/AuthContext'
import './ClientReservations.css'

const ClientReservations = () => {
  const { profile } = useAuth()
  const { 
    requests, 
    notifications, 
    loading, 
    error, 
    unreadCount,
    pendingRequests,
    acceptedRequests,
    completedRequests,
    markNotificationsRead
  } = useRequests()

  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'refused'>('all')
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

  const getFilteredRequests = () => {
    switch (selectedTab) {
      case 'pending':
        return requests.filter(r => r.status === 'pending')
      case 'accepted':
        return requests.filter(r => r.status === 'accepted')
      case 'completed':
        return requests.filter(r => r.status === 'completed')
      case 'refused':
        return requests.filter(r => r.status === 'refused')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'accepted': return '✅'
      case 'refused': return '❌'
      case 'completed': return '🏆'
      case 'cancelled': return '🚫'
      default: return '📋'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'accepted': return 'Acceptée'
      case 'refused': return 'Refusée'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return 'Inconnue'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'accepted': return 'green'
      case 'refused': return 'red'
      case 'completed': return 'purple'
      case 'cancelled': return 'gray'
      default: return 'blue'
    }
  }

  if (loading) {
    return (
      <div className="reservations-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement de vos réservations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reservations-container">
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
    <div className="reservations-container">
      <div className="reservations-header">
        <div className="reservations-title">
          <h2>📅 Mes Réservations</h2>
          <p>Suivez l'état de vos demandes de services</p>
        </div>
        
        {unreadCount > 0 && (
          <div className="notifications-badge" onClick={markNotificationsRead}>
            <span className="badge-count">{unreadCount}</span>
            <span className="badge-text">Nouvelles notifications</span>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="reservations-stats">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{requests.filter(r => r.status === 'pending').length}</div>
            <div className="stat-label">En attente</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{requests.filter(r => r.status === 'accepted').length}</div>
            <div className="stat-label">Acceptées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-number">{requests.filter(r => r.status === 'completed').length}</div>
            <div className="stat-label">Terminées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{requests.length}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
      </div>

      {/* Onglets de filtrage */}
      <div className="reservations-tabs">
        <button 
          className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          📋 Toutes ({requests.length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedTab('pending')}
        >
          ⏳ En attente ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setSelectedTab('accepted')}
        >
          ✅ Acceptées ({requests.filter(r => r.status === 'accepted').length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'completed' ? 'active' : ''}`}
          onClick={() => setSelectedTab('completed')}
        >
          🏆 Terminées ({requests.filter(r => r.status === 'completed').length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'refused' ? 'active' : ''}`}
          onClick={() => setSelectedTab('refused')}
        >
          ❌ Refusées ({requests.filter(r => r.status === 'refused').length})
        </button>
      </div>

      {/* Liste des réservations */}
      <div className="reservations-list">
        {getFilteredRequests().length === 0 ? (
          <div className="empty-state">
            <h3>Aucune réservation</h3>
            <p>
              {selectedTab === 'all' && 'Vous n\'avez pas encore fait de demande de service.'}
              {selectedTab === 'pending' && 'Aucune demande en attente.'}
              {selectedTab === 'accepted' && 'Aucune demande acceptée pour le moment.'}
              {selectedTab === 'completed' && 'Aucun service terminé encore.'}
              {selectedTab === 'refused' && 'Aucune demande refusée.'}
            </p>
            <button 
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="cta-button"
            >
              🔍 Découvrir nos services
            </button>
          </div>
        ) : (
          getFilteredRequests().map((request) => (
            <div key={request.id} className={`reservation-card ${request.status}`}>
              <div className="reservation-header">
                <div className="reservation-info">
                  <h3>{request.title}</h3>
                  <div className="reservation-meta">
                    <span className="service-type">{request.service_type}</span>
                    <span className="reservation-date">
                      Demandé le {formatDate(request.created_at)}
                    </span>
                  </div>
                </div>
                
                <div className={`status-badge ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)} {getStatusText(request.status)}
                </div>
              </div>

              <div className="reservation-content">
                <div className="provider-info">
                  <h4>👤 Prestataire :</h4>
                  <p><strong>{request.provider_name}</strong></p>
                  <p className="provider-service">{request.provider_service}</p>
                  
                  {/* Afficher le numéro seulement si la commande est acceptée */}
                  {request.status === 'accepted' && (
                    <div className="provider-contact">
                      <div className="contact-item">
                        <span className="contact-label">📞 Téléphone :</span>
                        <a href={`tel:${request.provider_phone || request.client_phone_profile}`} className="contact-value phone-link">
                          {request.provider_phone || request.client_phone_profile || 'Non renseigné'}
                        </a>
                      </div>
                      <div className="contact-note">
                        ℹ️ Vous pouvez maintenant contacter directement le prestataire
                      </div>
                    </div>
                  )}
                </div>

                {request.description && (
                  <div className="reservation-description">
                    <h4>📝 Description :</h4>
                    <p>{request.description}</p>
                  </div>
                )}

                <div className="reservation-details">
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
                  
                  {request.address && (
                    <div className="detail-item">
                      <span className="detail-label">📍 Adresse :</span>
                      <span className="detail-value">{request.address}</span>
                    </div>
                  )}
                  
                  {request.estimated_price && (
                    <div className="detail-item">
                      <span className="detail-label">💰 Prix estimé :</span>
                      <span className="detail-value">{request.estimated_price} {request.price_unit}</span>
                    </div>
                  )}
                </div>

                {request.provider_response && (
                  <div className="provider-response">
                    <h4>💬 Réponse du prestataire :</h4>
                    <p>{request.provider_response}</p>
                    <small>Répondu le {formatDate(request.response_date!)}</small>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className="next-steps">
                    <h4>🎯 Prochaines étapes :</h4>
                    <ul>
                      <li>📞 <strong>Contactez le prestataire</strong> au numéro ci-dessus pour convenir des détails</li>
                      <li>📅 <strong>Confirmez la date et l'heure</strong> d'intervention</li>
                      <li>📍 <strong>Précisez l'adresse exacte</strong> et les accès</li>
                      <li>💰 <strong>Confirmez le tarif final</strong> avant l'intervention</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notifications récentes */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          <h3>🔔 Notifications récentes</h3>
          <div className="notifications-list">
            {notifications.slice(0, 3).map((notification) => (
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

export default ClientReservations
