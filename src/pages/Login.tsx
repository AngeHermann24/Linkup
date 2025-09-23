import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

const Login = () => {
  // Version 1.0.2 - Ultra mobile optimizations
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt started')
    setLoading(true)
    setError('')

    // Timeout de sécurité pour éviter le chargement infini
    const timeoutId = setTimeout(() => {
      console.log('Login timeout - forcing loading to false')
      setLoading(false)
      setError('Timeout de connexion. Veuillez réessayer.')
    }, 10000) // 10 secondes

    try {
      console.log('=== DÉBUT CONNEXION ===')
      console.log('Email:', email)
      console.log('Password length:', password.length)
      
      const { error } = await signIn(email, password)
      clearTimeout(timeoutId)
      
      console.log('=== RÉSULTAT SIGNIN ===')
      console.log('Error:', error)
      console.log('Error message:', error?.message)
      console.log('Error code:', error?.code)

      if (error) {
        console.error('=== ERREUR DE CONNEXION ===')
        console.error('Full error object:', error)
        
        // Messages d'erreur plus clairs
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect. Vérifiez vos identifiants.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Veuillez confirmer votre email avant de vous connecter.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Trop de tentatives. Attendez quelques minutes avant de réessayer.'
        }
        
        setError(errorMessage)
        setLoading(false)
      } else {
        console.log('=== CONNEXION RÉUSSIE ===')
        console.log('Redirection vers /')
        setLoading(false)
        navigate('/')
      }
    } catch (err: any) {
      console.error('=== EXCEPTION LORS DE LA CONNEXION ===')
      console.error('Exception:', err)
      console.error('Exception message:', err?.message)
      clearTimeout(timeoutId)
      setError('Erreur technique. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/Linkup lo.png" alt="Linkup" className="logo-image" />
          </div>
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-subtitle">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button primary"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">
              S'inscrire
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

export default Login
