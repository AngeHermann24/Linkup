import { useState, useRef } from 'react'
import { useServices } from '../hooks/useServices'
import { useAuth } from '../contexts/AuthContext'
import './ServicesManager.css'

const ServicesManager = () => {
  const { profile } = useAuth()
  const { 
    service, 
    loading, 
    error, 
    uploading, 
    updateService, 
    uploadImage, 
    deleteImage, 
    setPrimaryImage,
    initializeService 
  } = useServices()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    short_description: '',
    base_price: '',
    price_type: 'fixe' as 'fixe' | 'horaire' | 'forfait',
    duration_minutes: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialiser le formulaire d'édition
  const startEditing = () => {
    if (service) {
      setEditForm({
        title: service.title || '',
        description: service.description || '',
        short_description: service.short_description || '',
        base_price: service.base_price?.toString() || '',
        price_type: service.price_type || 'fixe',
        duration_minutes: service.duration_minutes?.toString() || ''
      })
      setIsEditing(true)
    }
  }

  // Sauvegarder les modifications
  const saveChanges = async () => {
    try {
      await updateService({
        title: editForm.title,
        description: editForm.description,
        short_description: editForm.short_description,
        base_price: editForm.base_price ? parseFloat(editForm.base_price) : undefined,
        price_type: editForm.price_type,
        duration_minutes: editForm.duration_minutes ? parseInt(editForm.duration_minutes) : undefined
      })
      setIsEditing(false)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
    }
  }

  // Gérer l'upload d'image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB')
      return
    }

    try {
      const isPrimary = !service?.images?.length || service.images.length === 0
      await uploadImage(file, isPrimary)
    } catch (err) {
      console.error('Erreur upload:', err)
    }
  }

  // États de chargement
  if (loading) {
    return (
      <div className="services-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement de vos services...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="services-container">
        <div className="error-state">
          <p>Erreur: {error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // Si aucun service n'est configuré
  if (!service) {
    return (
      <div className="services-container">
        <div className="empty-state">
          <h3>🛠️ Configurez votre service</h3>
          <p>Vous êtes inscrit comme <strong>{profile?.service_category}</strong> ({profile?.service_type})</p>
          <p>Cliquez ci-dessous pour configurer votre offre de service.</p>
          <button onClick={initializeService} className="cta-button primary">
            Configurer mon service
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="services-container">
      <div className="services-header">
        <div className="services-title">
          <h2>🛠️ Mon Service</h2>
          <p>Gérez votre offre de {service.service_name}</p>
        </div>
        
        <div className="services-actions">
          {!isEditing ? (
            <button onClick={startEditing} className="edit-button">
              ✏️ Modifier
            </button>
          ) : (
            <div className="edit-actions">
              <button onClick={saveChanges} className="save-button">
                💾 Sauvegarder
              </button>
              <button onClick={() => setIsEditing(false)} className="cancel-button">
                ❌ Annuler
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="service-content">
        {/* Section Images */}
        <div className="service-images-section">
          <h3>📸 Photos de votre service</h3>
          
          <div className="images-grid">
            {service.images?.map((image) => (
              <div key={image.id} className={`image-card ${image.is_primary ? 'primary' : ''}`}>
                <img src={image.image_url} alt={image.alt_text} />
                <div className="image-overlay">
                  {image.is_primary && <span className="primary-badge">Principal</span>}
                  <div className="image-actions">
                    {!image.is_primary && (
                      <button 
                        onClick={() => setPrimaryImage(image.id)}
                        className="set-primary-btn"
                        title="Définir comme image principale"
                      >
                        ⭐
                      </button>
                    )}
                    <button 
                      onClick={() => deleteImage(image.id, image.image_url)}
                      className="delete-btn"
                      title="Supprimer l'image"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="add-image-card" onClick={() => fileInputRef.current?.click()}>
              <div className="add-image-content">
                {uploading ? (
                  <div className="uploading">
                    <div className="spinner small"></div>
                    <span>Upload...</span>
                  </div>
                ) : (
                  <>
                    <span className="add-icon">📷</span>
                    <span>Ajouter une photo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Section Informations */}
        <div className="service-info-section">
          <h3>ℹ️ Informations du service</h3>
          
          {!isEditing ? (
            <div className="service-display">
              <div className="info-card">
                <h4>{service.title}</h4>
                <div className="service-meta">
                  <span className="service-type">{service.service_type}</span>
                  <span className="service-category">{service.service_name}</span>
                </div>
                
                {service.short_description && (
                  <p className="short-description">{service.short_description}</p>
                )}
                
                {service.description && (
                  <div className="description">
                    <h5>Description détaillée :</h5>
                    <p>{service.description}</p>
                  </div>
                )}
                
                <div className="edit-hint">
                  <p>💡 <strong>Conseil :</strong> Personnalisez votre titre, description et tarifs pour attirer plus de clients !</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="service-edit">
              <div className="edit-section-title">
                <h4>✏️ Personnalisez votre offre</h4>
                <p>Rendez votre service unique et attractif pour vos clients</p>
              </div>
              
              <div className="form-group">
                <label>Titre de votre offre * <span className="field-tip">(Ce que vos clients verront en premier)</span></label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Services de plomberie professionnels à domicile"
                />
              </div>

              <div className="form-group">
                <label>Description courte <span className="field-tip">(Accroche pour attirer l'attention)</span></label>
                <input
                  type="text"
                  value={editForm.short_description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Ex: Intervention rapide, devis gratuit, 10 ans d'expérience"
                  maxLength={100}
                />
                <small>{editForm.short_description.length}/100 caractères</small>
              </div>

              <div className="form-group">
                <label>Description détaillée <span className="field-tip">(Vendez votre expertise !)</span></label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Plombier certifié avec 10 ans d'expérience. Je réalise tous types de travaux : réparations, installations, dépannages d'urgence. Matériel professionnel, devis gratuit, garantie sur les travaux. Disponible 7j/7 pour les urgences."
                  rows={5}
                />
                <small>Conseil: Mentionnez votre expérience, vos spécialités, vos garanties</small>
              </div>
            </div>
          )}
        </div>

        {/* Section Tarifs */}
        <div className="service-pricing-section">
          <h3>💰 Tarification - Fixez vos prix librement</h3>
          
          {!isEditing ? (
            <div className="pricing-display">
              <div className="price-card">
                <div className="price-main">
                  <span className="price-amount">
                    {service.base_price ? `${service.base_price} ${service.price_unit}` : 'Prix sur devis'}
                  </span>
                  <span className="price-type">
                    {service.price_type === 'fixe' && 'Prix fixe'}
                    {service.price_type === 'horaire' && 'Par heure'}
                    {service.price_type === 'forfait' && 'Forfait'}
                  </span>
                </div>
                
                {service.duration_minutes && (
                  <div className="duration">
                    <span>⏱️ Durée estimée: {Math.floor(service.duration_minutes / 60)}h{service.duration_minutes % 60 > 0 ? ` ${service.duration_minutes % 60}min` : ''}</span>
                  </div>
                )}
                
                <div className="pricing-hint">
                  <p>🎯 <strong>Vous décidez :</strong> Ajustez vos tarifs selon votre expérience et la demande !</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="pricing-edit">
              <div className="edit-section-title">
                <h4>💰 Définissez vos tarifs</h4>
                <p>Vous êtes libre de fixer vos prix selon votre expérience et le marché</p>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Prix de base (FCFA) * <span className="field-tip">(Votre tarif principal)</span></label>
                  <input
                    type="number"
                    value={editForm.base_price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, base_price: e.target.value }))}
                    placeholder="Ex: 5000, 15000, 25000..."
                    min="500"
                    step="500"
                  />
                  <small>Conseil: Regardez les prix du marché et ajustez selon votre expérience</small>
                </div>

                <div className="form-group">
                  <label>Type de tarification <span className="field-tip">(Comment vous facturez)</span></label>
                  <select
                    value={editForm.price_type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price_type: e.target.value as any }))}
                  >
                    <option value="fixe">Prix fixe (intervention complète)</option>
                    <option value="horaire">Tarif horaire (par heure de travail)</option>
                    <option value="forfait">Forfait (package complet)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Durée estimée (minutes) <span className="field-tip">(Aide les clients à planifier)</span></label>
                <input
                  type="number"
                  value={editForm.duration_minutes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="Ex: 60 pour 1h, 120 pour 2h..."
                  min="15"
                  max="480"
                  step="15"
                />
                <small>De 15 minutes à 8 heures maximum</small>
              </div>
              
              <div className="pricing-examples">
                <h5>💡 Exemples de tarifs par secteur :</h5>
                <div className="examples-grid">
                  <div className="example-item">
                    <strong>Plomberie :</strong> 8000-15000 FCFA/intervention
                  </div>
                  <div className="example-item">
                    <strong>Mécanique :</strong> 5000-20000 FCFA selon réparation
                  </div>
                  <div className="example-item">
                    <strong>Coiffure :</strong> 2000-8000 FCFA/prestation
                  </div>
                  <div className="example-item">
                    <strong>Jardinage :</strong> 3000-6000 FCFA/heure
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServicesManager
