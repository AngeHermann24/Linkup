import { useState } from 'react'
import { useRequests } from '../hooks/useRequests'
import { useAuth } from '../contexts/AuthContext'
import './ServiceDetailModal.css'

interface ServiceProvider {
  id: string
  provider_id: string
  service_name: string
  service_type: string
  title: string
  short_description?: string
  description?: string
  base_price?: number
  price_unit: string
  price_type: string
  duration_minutes?: number
  created_at: string
  
  provider_name: string
  provider_email: string
  provider_phone?: string
  provider_service: string
  
  images?: Array<{
    id: string
    image_url: string
    alt_text?: string
    is_primary: boolean
  }>
}

interface ServiceDetailModalProps {
  service: ServiceProvider
  onClose: () => void
}

const ServiceDetailModal = ({ service, onClose }: ServiceDetailModalProps) => {
  const { user } = useAuth()
  const { createRequest } = useRequests()
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orderForm, setOrderForm] = useState({
    title: `Demande de ${service.service_name}`,
    description: '',
    preferred_date: '',
    preferred_time: '',
    address: '',
    phone: ''
  })

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      
      await createRequest({
        provider_id: service.provider_id,
        service_id: service.id,
        service_type: service.service_name,
        title: orderForm.title,
        description: orderForm.description,
        preferred_date: orderForm.preferred_date || undefined,
        preferred_time: orderForm.preferred_time || undefined,
        address: orderForm.address,
        phone: orderForm.phone,
        estimated_price: service.base_price
      })

      // Succès
      alert('🎉 Votre demande a été envoyée avec succès ! Le prestataire vous répondra bientôt.')
      onClose()
    } catch (error) {
      console.error('Erreur lors de la commande:', error)
      alert('❌ Erreur lors de l\'envoi de la demande. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    if (name.includes('plomb')) return '🔧'
    if (name.includes('électr')) return '⚡'
    if (name.includes('mécan')) return '🔧'
    if (name.includes('coiff')) return '💇‍♀️'
    if (name.includes('maquill')) return '💄'
    if (name.includes('peint')) return '🎨'
    if (name.includes('jardin')) return '🌱'
    if (name.includes('surface') || name.includes('nettoy')) return '🧹'
    if (name.includes('traiteur')) return '🍽️'
    if (name.includes('pâtiss')) return '🧁'
    if (name.includes('toclo') || name.includes('fanicko')) return '🛠️'
    return '🔧'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{service.title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!showOrderForm ? (
            // Vue détails du service
            <div className="service-details-view">
              {/* Images du service */}
              {service.images && service.images.length > 0 && (
                <div className="service-images">
                  <div className="images-gallery">
                    {service.images.map((image, index) => (
                      <div key={image.id} className={`image-item ${image.is_primary ? 'primary' : ''}`}>
                        <img src={image.image_url} alt={image.alt_text || `Image ${index + 1}`} />
                        {image.is_primary && <span className="primary-badge">Principal</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations du service */}
              <div className="service-info">
                <div className="service-header-detail">
                  <div className="service-icon-large">
                    {getServiceIcon(service.service_name)}
                  </div>
                  <div className="service-meta">
                    <h3>{service.service_name}</h3>
                    <div className="service-type-badge">
                      {service.service_type === 'pro' ? '⭐ Service Pro' : '🔧 Service Basique'}
                    </div>
                  </div>
                </div>

                {service.short_description && (
                  <div className="service-summary">
                    <h4>📋 Résumé</h4>
                    <p>{service.short_description}</p>
                  </div>
                )}

                {service.description && (
                  <div className="service-description-full">
                    <h4>📝 Description complète</h4>
                    <p>{service.description}</p>
                  </div>
                )}

                <div className="service-pricing-detail">
                  <h4>💰 Tarification</h4>
                  <div className="pricing-info">
                    {service.base_price ? (
                      <>
                        <div className="price-main">
                          <span className="price-amount">{service.base_price} {service.price_unit}</span>
                          <span className="price-type">
                            {service.price_type === 'fixe' && '(Prix fixe)'}
                            {service.price_type === 'horaire' && '(Par heure)'}
                            {service.price_type === 'forfait' && '(Forfait)'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="price-on-quote">Prix sur devis - Contactez le prestataire</div>
                    )}
                    
                    {service.duration_minutes && (
                      <div className="duration-info">
                        ⏱️ Durée estimée: {Math.floor(service.duration_minutes / 60)}h
                        {service.duration_minutes % 60 > 0 && ` ${service.duration_minutes % 60}min`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations du prestataire */}
              <div className="provider-info-detail">
                <h4>👤 À propos du prestataire</h4>
                <div className="provider-card">
                  <div className="provider-avatar">
                    {service.provider_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="provider-details">
                    <h5>{service.provider_name}</h5>
                    <p className="provider-specialty">{service.provider_service}</p>
                    <div className="provider-rating">
                      ⭐⭐⭐⭐⭐ <span>4.8/5 (24 avis)</span>
                    </div>
                    <div className="provider-stats">
                      <span className="stat-item">✅ 156 services réalisés</span>
                      <span className="stat-item">🕒 Répond en moyenne en 2h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button className="cancel-btn" onClick={onClose}>
                  Fermer
                </button>
                <button 
                  className="order-btn-modal"
                  onClick={() => setShowOrderForm(true)}
                >
                  📞 Commander ce service
                </button>
              </div>
            </div>
          ) : (
            // Formulaire de commande
            <div className="order-form-view">
              <div className="form-header">
                <h3>📞 Commander le service</h3>
                <p>Remplissez ce formulaire pour envoyer votre demande à {service.provider_name}</p>
              </div>

              <form onSubmit={handleOrder} className="order-form">
                <div className="form-group">
                  <label>Titre de votre demande *</label>
                  <input
                    type="text"
                    value={orderForm.title}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Réparation fuite d'eau"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description détaillée de votre besoin *</label>
                  <textarea
                    value={orderForm.description}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez précisément ce dont vous avez besoin, le problème à résoudre, etc."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date souhaitée</label>
                    <input
                      type="date"
                      value={orderForm.preferred_date}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, preferred_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label>Heure souhaitée</label>
                    <input
                      type="time"
                      value={orderForm.preferred_time}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, preferred_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Adresse d'intervention *</label>
                  <input
                    type="text"
                    value={orderForm.address}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse complète où le service doit être réalisé"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Votre numéro de téléphone *</label>
                  <input
                    type="tel"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ex: +225 07 12 34 56 78"
                    required
                  />
                </div>

                {service.base_price && (
                  <div className="price-summary">
                    <h4>💰 Prix estimé</h4>
                    <div className="price-estimate">
                      {service.base_price} {service.price_unit}
                      <span className="price-note">
                        {service.price_type === 'fixe' && ' (Prix fixe)'}
                        {service.price_type === 'horaire' && ' (Par heure)'}
                        {service.price_type === 'forfait' && ' (Forfait)'}
                      </span>
                    </div>
                    <small>Le prix final sera confirmé par le prestataire</small>
                  </div>
                )}

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="back-btn"
                    onClick={() => setShowOrderForm(false)}
                  >
                    ← Retour
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Envoi...' : '📤 Envoyer la demande'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceDetailModal
