import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './ProviderRegistration.css'

interface ProviderRegistrationProps {
  onComplete: () => void
}

const ProviderRegistration: React.FC<ProviderRegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    serviceCategory: '',
    profilePhoto: null as File | null,
    idDocument: null as File | null
  })

  const { user } = useAuth()
  const navigate = useNavigate()

  const serviceCategories = [
    { name: 'Coiffure', type: 'basic', icon: '✂️' },
    { name: 'Ménage', type: 'basic', icon: '🧹' },
    { name: 'Jardinage', type: 'basic', icon: '🌱' },
    { name: 'Peinture', type: 'basic', icon: '🎨' },
    { name: 'Cuisine', type: 'basic', icon: '🍳' },
    { name: 'Couture', type: 'basic', icon: '🧵' },
    { name: 'Plomberie', type: 'pro', icon: '🔧' },
    { name: 'Électricité', type: 'pro', icon: '⚡' },
    { name: 'Climatisation', type: 'pro', icon: '❄️' },
    { name: 'Réparation Auto', type: 'pro', icon: '🚗' },
    { name: 'Informatique', type: 'pro', icon: '💻' },
    { name: 'Maçonnerie', type: 'pro', icon: '🏗️' }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleFileChange = (field: 'profilePhoto' | 'idDocument', file: File | null) => {
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5MB')
        return
      }
      
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.')
        return
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: file }))
    setError('')
  }

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user?.id}/${folder}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('provider-documents')
      .upload(fileName, file)

    if (error) {
      throw new Error(`Erreur upload ${folder}: ${error.message}`)
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('provider-documents')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('Vous devez être connecté')
      return
    }

    // Validation
    if (!formData.fullName || !formData.phone || !formData.serviceCategory) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!formData.profilePhoto || !formData.idDocument) {
      setError('Veuillez uploader votre photo de profil et votre pièce d\'identité')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Upload des fichiers
      const [profilePhotoUrl, idDocumentUrl] = await Promise.all([
        uploadFile(formData.profilePhoto, 'profile'),
        uploadFile(formData.idDocument, 'identity')
      ])

      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'prestataire',
          service_category: formData.serviceCategory,
          profile_photo_url: profilePhotoUrl,
          id_document_url: idDocumentUrl,
          verification_status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Enregistrer les documents dans la table provider_documents
      const documents = [
        {
          provider_id: user.id,
          document_type: 'profile_photo',
          file_name: formData.profilePhoto.name,
          file_url: profilePhotoUrl,
          file_size: formData.profilePhoto.size,
          mime_type: formData.profilePhoto.type
        },
        {
          provider_id: user.id,
          document_type: 'id_document',
          file_name: formData.idDocument.name,
          file_url: idDocumentUrl,
          file_size: formData.idDocument.size,
          mime_type: formData.idDocument.type
        }
      ]

      const { error: documentsError } = await supabase
        .from('provider_documents')
        .insert(documents)

      if (documentsError) throw documentsError

      setSuccess('Votre demande a été soumise avec succès ! Vous recevrez une notification une fois votre compte validé.')
      
      // Rediriger vers le dashboard après 3 secondes
      setTimeout(() => {
        onComplete()
        navigate('/dashboard')
      }, 3000)

    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error)
      setError(error.message || 'Une erreur est survenue lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone || !formData.serviceCategory) {
        setError('Veuillez remplir tous les champs')
        return
      }
    }
    setStep(step + 1)
    setError('')
  }

  const prevStep = () => {
    setStep(step - 1)
    setError('')
  }

  if (success) {
    return (
      <div className="provider-registration">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Demande soumise avec succès !</h2>
          <p>{success}</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="provider-registration">
      <div className="registration-header">
        <h2>Inscription Prestataire</h2>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="step-content">
          <h3>Informations personnelles</h3>
          
          <div className="form-group">
            <label>Nom complet *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Votre nom complet"
              required
            />
          </div>

          <div className="form-group">
            <label>Numéro de téléphone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+237 123 456 789"
              required
            />
          </div>

          <div className="form-group">
            <label>Catégorie de service *</label>
            <div className="service-categories">
              {serviceCategories.map((category) => (
                <div
                  key={category.name}
                  className={`service-option ${formData.serviceCategory === category.name ? 'selected' : ''} ${category.type}`}
                  onClick={() => handleInputChange('serviceCategory', category.name)}
                >
                  <div className="service-icon">{category.icon}</div>
                  <div className="service-info">
                    <div className="service-name">{category.name}</div>
                    <div className="service-type">
                      {category.type === 'basic' ? '📦 Basic (1000 FCFA/mois)' : '⭐ Pro (3000 FCFA/mois)'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="step-actions">
            <button onClick={nextStep} className="next-btn">
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-content">
          <h3>Photo de profil</h3>
          <p className="step-description">
            Ajoutez une photo de profil professionnelle qui sera visible par les clients.
          </p>

          <div className="file-upload-section">
            <div className="file-upload">
              <input
                type="file"
                id="profilePhoto"
                accept="image/jpeg,image/png,image/jpg"
                onChange={(e) => handleFileChange('profilePhoto', e.target.files?.[0] || null)}
                className="file-input"
              />
              <label htmlFor="profilePhoto" className="file-label">
                <div className="upload-icon">📷</div>
                <div className="upload-text">
                  {formData.profilePhoto ? (
                    <span className="file-selected">✅ {formData.profilePhoto.name}</span>
                  ) : (
                    <>
                      <span>Cliquez pour choisir une photo</span>
                      <small>JPG, PNG - Max 5MB</small>
                    </>
                  )}
                </div>
              </label>
            </div>

            {formData.profilePhoto && (
              <div className="file-preview">
                <img
                  src={URL.createObjectURL(formData.profilePhoto)}
                  alt="Aperçu photo de profil"
                  className="preview-image"
                />
              </div>
            )}
          </div>

          <div className="step-actions">
            <button onClick={prevStep} className="prev-btn">
              ← Précédent
            </button>
            <button onClick={nextStep} className="next-btn">
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step-content">
          <h3>Pièce d'identité</h3>
          <p className="step-description">
            Uploadez une photo claire de votre carte d'identité ou passeport pour vérification.
          </p>

          <div className="file-upload-section">
            <div className="file-upload">
              <input
                type="file"
                id="idDocument"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                className="file-input"
              />
              <label htmlFor="idDocument" className="file-label">
                <div className="upload-icon">🆔</div>
                <div className="upload-text">
                  {formData.idDocument ? (
                    <span className="file-selected">✅ {formData.idDocument.name}</span>
                  ) : (
                    <>
                      <span>Cliquez pour choisir votre pièce d'identité</span>
                      <small>JPG, PNG, PDF - Max 5MB</small>
                    </>
                  )}
                </div>
              </label>
            </div>

            {formData.idDocument && formData.idDocument.type.startsWith('image/') && (
              <div className="file-preview">
                <img
                  src={URL.createObjectURL(formData.idDocument)}
                  alt="Aperçu pièce d'identité"
                  className="preview-image"
                />
              </div>
            )}
          </div>

          <div className="verification-info">
            <h4>🔐 Processus de vérification</h4>
            <ul>
              <li>✅ Vos documents seront vérifiés par notre équipe</li>
              <li>⏱️ La vérification prend généralement 24-48h</li>
              <li>📧 Vous recevrez une notification par email</li>
              <li>🚀 Une fois approuvé, vous pourrez recevoir des demandes</li>
            </ul>
          </div>

          <div className="step-actions">
            <button onClick={prevStep} className="prev-btn">
              ← Précédent
            </button>
            <button 
              onClick={handleSubmit} 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Soumission en cours...
                </>
              ) : (
                'Soumettre ma demande'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderRegistration
