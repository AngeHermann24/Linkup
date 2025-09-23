import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

const Register = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: undefined as 'client' | 'prestataire' | undefined,
    serviceType: undefined as 'basique' | 'pro' | undefined,
    serviceCategory: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const basicServices = [
    'Toclo Toclo',
    'Fanicko',
    'Technicien de surface',
    'Peintre',
    'Jardinier'
  ]

  const proServices = [
    'Mécanicien',
    'Plombier',
    'Électricien',
    'Coiffeuse',
    'Traiteur',
    'Maquilleuse',
    'Pâtissier'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
        setError('Veuillez remplir tous les champs')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }
      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
        return
      }
    }
    
    if (step === 2 && !formData.role) {
      setError('Veuillez choisir un rôle')
      return
    }

    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.role === 'prestataire' && (!formData.serviceType || !formData.serviceCategory)) {
      setError('Veuillez choisir un type de service et une catégorie')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await signUp(formData.email, formData.password, {
      role: formData.role,
      full_name: formData.fullName,
      phone: formData.phone,
      service_type: formData.role === 'prestataire' ? formData.serviceType : undefined,
      service_category: formData.role === 'prestataire' ? formData.serviceCategory : undefined,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Redirection vers la page de connexion avec message de succès
      navigate('/login', { 
        state: { message: 'Inscription réussie ! Veuillez vous connecter.' }
      })
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/Linkup lo.png" alt="Linkup" className="logo-image" />
          </div>
          <h1 className="auth-title">Inscription</h1>
          <p className="auth-subtitle">
            Étape {step} sur {formData.role === 'prestataire' ? '3' : '2'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Étape 1: Informations personnelles */}
          {step === 1 && (
            <div className="form-step">
              <h3 className="step-title">Informations personnelles</h3>
              
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Nom complet
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="form-input"
                  placeholder="Votre nom complet"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Téléphone (optionnel)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="form-input"
                  placeholder="+225 XX XX XX XX"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="auth-button primary"
              >
                Continuer
              </button>
            </div>
          )}

          {/* Étape 2: Choix du rôle */}
          {step === 2 && (
            <div className="form-step">
              <h3 className="step-title">Choisissez votre rôle</h3>
              
              <div className="role-selection">
                <div 
                  className={`role-card ${formData.role === 'client' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('role', 'client')}
                >
                  <div className="role-icon">👤</div>
                  <h4>Client</h4>
                  <p>Je recherche des services</p>
                </div>

                <div 
                  className={`role-card ${formData.role === 'prestataire' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('role', 'prestataire')}
                >
                  <div className="role-icon">🔧</div>
                  <h4>Prestataire</h4>
                  <p>Je propose mes services</p>
                </div>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="auth-button secondary"
                >
                  Retour
                </button>
                
                {formData.role === 'client' ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-button primary"
                  >
                    {loading ? 'Inscription...' : 'S\'inscrire'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="auth-button primary"
                    disabled={!formData.role}
                  >
                    Continuer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Étape 3: Choix des services (prestataires uniquement) */}
          {step === 3 && formData.role === 'prestataire' && (
            <div className="form-step">
              <h3 className="step-title">Choisissez votre service</h3>
              
              <div className="service-type-selection">
                <div 
                  className={`service-type-card ${formData.serviceType === 'basique' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('serviceType', 'basique')}
                >
                  <h4>Services Basiques</h4>
                  <p>Services généraux et d'entretien</p>
                </div>

                <div 
                  className={`service-type-card ${formData.serviceType === 'pro' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('serviceType', 'pro')}
                >
                  <h4>Services Pro</h4>
                  <p>Services spécialisés et techniques</p>
                </div>
              </div>

              {formData.serviceType && (
                <div className="service-categories">
                  <h4>Choisissez votre spécialité :</h4>
                  <div className="categories-grid">
                    {(formData.serviceType === 'basique' ? basicServices : proServices).map((service) => (
                      <div
                        key={service}
                        className={`category-option ${formData.serviceCategory === service ? 'selected' : ''}`}
                        onClick={() => handleInputChange('serviceCategory', service)}
                      >
                        {service}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-buttons">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="auth-button secondary"
                >
                  Retour
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !formData.serviceType || !formData.serviceCategory}
                  className="auth-button primary"
                >
                  {loading ? 'Inscription...' : 'S\'inscrire'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Déjà un compte ?{' '}
            <Link to="/login" className="auth-link">
              Se connecter
            </Link>
          </p>
          <Link to="/" className="auth-link">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
