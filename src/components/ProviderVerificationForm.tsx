import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../pages/ProviderSettings.css'

interface ProviderVerificationFormProps {
  onComplete: () => void
}

const ProviderVerificationForm: React.FC<ProviderVerificationFormProps> = ({ onComplete }) => {
  const [step, setStep] = useState(2) // Commencer directement à l'étape 2
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    profilePhoto: null as File | null,
    idDocument: null as File | null
  })

  const { user, profile } = useAuth()

  // Utiliser les informations déjà présentes dans le profil
  const providerInfo = {
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    serviceCategory: profile?.service_category || '',
    email: profile?.email || user?.email || ''
  }

  const handleFileChange = (field: 'profilePhoto' | 'idDocument', file: File | null) => {
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5MB')
        return
      }

      // Vérifier le type de fichier
      const allowedTypes = field === 'profilePhoto' 
        ? ['image/jpeg', 'image/png', 'image/jpg']
        : ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

      if (!allowedTypes.includes(file.type)) {
        setError(`Type de fichier non autorisé pour ${field === 'profilePhoto' ? 'la photo' : 'le document'}`)
        return
      }
    }

    setFormData(prev => ({ ...prev, [field]: file }))
    setError('')
  }

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${user?.id}/${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('provider-documents')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Erreur upload ${folder}: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('provider-documents')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async () => {
    if (!formData.profilePhoto || !formData.idDocument) {
      setError('Veuillez sélectionner tous les documents requis')
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

      // Mettre à jour le profil avec les URLs des documents
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_photo_url: profilePhotoUrl,
          id_document_url: idDocumentUrl,
          verification_status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) {
        throw updateError
      }

      // Enregistrer les documents dans la table de suivi
      const { error: docError } = await supabase
        .from('provider_documents')
        .insert([
          {
            provider_id: user?.id,
            document_type: 'profile_photo',
            file_name: formData.profilePhoto.name,
            file_url: profilePhotoUrl,
            file_size: formData.profilePhoto.size,
            mime_type: formData.profilePhoto.type
          },
          {
            provider_id: user?.id,
            document_type: 'id_document',
            file_name: formData.idDocument.name,
            file_url: idDocumentUrl,
            file_size: formData.idDocument.size,
            mime_type: formData.idDocument.type
          }
        ])

      if (docError) {
        console.warn('Erreur lors de l\'enregistrement des documents:', docError)
      }

      setSuccess('Documents uploadés avec succès ! Votre demande de vérification a été soumise.')
      setTimeout(() => {
        onComplete()
      }, 2000)

    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="provider-registration">
      <div className="registration-header">
        <h2>🔐 Vérification de votre compte</h2>
        <p>Uploadez vos documents pour finaliser votre inscription</p>
      </div>

      {/* Affichage des informations du profil */}
      <div className="profile-info-display">
        <h3>📋 Vos informations</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Nom complet :</label>
            <span>{providerInfo.fullName}</span>
          </div>
          <div className="info-item">
            <label>Email :</label>
            <span>{providerInfo.email}</span>
          </div>
          <div className="info-item">
            <label>Téléphone :</label>
            <span>{providerInfo.phone || 'Non renseigné'}</span>
          </div>
          <div className="info-item">
            <label>Service :</label>
            <span className="service-badge">{providerInfo.serviceCategory}</span>
          </div>
        </div>
      </div>

      {/* Étape 2: Upload Photo de Profil */}
      {step === 2 && (
        <div className="registration-step">
          <div className="step-header">
            <div className="step-indicator">
              <span className="step-number">1</span>
              <span className="step-title">Photo de profil</span>
            </div>
          </div>

          <div className="upload-section">
            <div className="upload-info">
              <h3>📷 Ajoutez votre photo de profil</h3>
              <p>Cette photo sera visible par vos futurs clients</p>
              <ul>
                <li>Format accepté : JPG, PNG</li>
                <li>Taille maximale : 5MB</li>
                <li>Photo claire et professionnelle recommandée</li>
              </ul>
            </div>

            <div className="file-upload">
              <input
                type="file"
                id="profilePhoto"
                accept="image/jpeg,image/png,image/jpg"
                onChange={(e) => handleFileChange('profilePhoto', e.target.files?.[0] || null)}
                className="file-input"
              />
              <label htmlFor="profilePhoto" className="file-label">
                {formData.profilePhoto ? (
                  <div className="file-selected">
                    <span className="file-icon">✅</span>
                    <span className="file-name">{formData.profilePhoto.name}</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <span className="upload-icon">📷</span>
                    <span>Cliquez pour sélectionner votre photo</span>
                  </div>
                )}
              </label>
            </div>

            <div className="step-actions">
              <button
                onClick={() => setStep(3)}
                disabled={!formData.profilePhoto}
                className="next-btn"
              >
                Continuer vers l'étape suivante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Étape 3: Upload Pièce d'Identité */}
      {step === 3 && (
        <div className="registration-step">
          <div className="step-header">
            <div className="step-indicator">
              <span className="step-number">2</span>
              <span className="step-title">Pièce d'identité</span>
            </div>
          </div>

          <div className="upload-section">
            <div className="upload-info">
              <h3>🆔 Ajoutez votre pièce d'identité</h3>
              <p>Document officiel requis pour la vérification</p>
              <ul>
                <li>Format accepté : JPG, PNG, PDF</li>
                <li>Taille maximale : 5MB</li>
                <li>Document lisible et non expiré</li>
                <li>CNI, Passeport ou Permis de conduire</li>
              </ul>
            </div>

            <div className="file-upload">
              <input
                type="file"
                id="idDocument"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                className="file-input"
              />
              <label htmlFor="idDocument" className="file-label">
                {formData.idDocument ? (
                  <div className="file-selected">
                    <span className="file-icon">✅</span>
                    <span className="file-name">{formData.idDocument.name}</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <span className="upload-icon">🆔</span>
                    <span>Cliquez pour sélectionner votre pièce d'identité</span>
                  </div>
                )}
              </label>
            </div>

            <div className="step-actions">
              <button
                onClick={() => setStep(2)}
                className="prev-btn"
              >
                ← Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.idDocument || loading}
                className="submit-btn"
              >
                {loading ? 'Envoi en cours...' : 'Soumettre ma demande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages d'erreur et succès */}
      {error && (
        <div className="message error-message">
          <span className="message-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="message success-message">
          <span className="message-icon">✅</span>
          <span>{success}</span>
        </div>
      )}
    </div>
  )
}

export default ProviderVerificationForm
