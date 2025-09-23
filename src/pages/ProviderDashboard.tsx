import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import './Dashboard.css'

const ProviderDashboard = () => {
  const { profile, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const getServiceTypeLabel = (type: string) => {
    return type === 'basique' ? 'Services Basiques' : 'Services Pro'
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <Link to="/dashboard/prestataire" className="dashboard-logo">
            <img src="/Linkup lo.png" alt="Linkup" className="logo-image" />
          </Link>
          
          {/* Bouton hamburger pour mobile */}
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
              className="nav-item active"
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

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-section">
            <h1 className="dashboard-title">
              Bienvenue sur votre tableau de bord prestataire ! 🔧
            </h1>
            <p className="dashboard-subtitle">
              Vous êtes connecté en tant que <strong>prestataire</strong> spécialisé en{' '}
              <strong>{profile?.service_category}</strong> ({profile?.service_type && getServiceTypeLabel(profile.service_type)}).
              Ici vous pourrez bientôt gérer vos services, vos clients et vos revenus.
            </p>
          </div>

          <div className="provider-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>0</h3>
                <p>Services réalisés</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3>0.0</h3>
                <p>Note moyenne</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>0 FCFA</h3>
                <p>Revenus totaux</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>0</h3>
                <p>Clients fidèles</p>
              </div>
            </div>
          </div>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-icon">🔧</div>
              <h3>Mes Services</h3>
              <p>Gérez vos offres, tarifs et disponibilités</p>
              <Link to="/services" className="card-button active">
                Gérer mes services
              </Link>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📅</div>
              <h3>Planning</h3>
              <p>Consultez vos rendez-vous et disponibilités</p>
              <Link to="/planning" className="card-button active">
                Gérer mon planning
              </Link>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">💬</div>
              <h3>Messages</h3>
              <p>Gérez les demandes de vos clients</p>
              <Link to="/requests" className="card-button active">
                Voir mes demandes
              </Link>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📈</div>
              <h3>Statistiques</h3>
              <p>Analysez vos performances et revenus</p>
              <Link to="/statistics" className="card-button active">
                Voir mes statistiques
              </Link>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">🏆</div>
              <h3>Certifications</h3>
              <p>Ajoutez vos diplômes et certifications</p>
              <button className="card-button">Bientôt disponible</button>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">⚙️</div>
              <h3>Paramètres</h3>
              <p>Configurez votre profil et préférences</p>
              <button className="card-button">Bientôt disponible</button>
            </div>
          </div>

          <div className="info-section">
            <div className="info-card provider-tips">
              <h3>💡 Conseils pour réussir sur Linkup</h3>
              <ul>
                <li>Complétez votre profil avec des photos de vos réalisations</li>
                <li>Répondez rapidement aux demandes de clients</li>
                <li>Maintenez une note élevée en fournissant un service de qualité</li>
                <li>Proposez des tarifs compétitifs</li>
                <li>Soyez ponctuel et professionnel</li>
                <li>Demandez des avis à vos clients satisfaits</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProviderDashboard
