import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import './Dashboard.css'
import './ProfessionalHeader.css'

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
      <header className="modern-header">
        <div className="header-layout">
          {/* À gauche : Nom + Rôle dans une carte élégante */}
          <div className="user-card">
            <div className="user-info">
              <span className="user-name">{profile?.full_name || 'Prestataire'}</span>
              <span className="user-role">PRESTATAIRE</span>
            </div>
          </div>
          
          {/* Au centre : Logo Linkup */}
          <div className="center-logo">
            <Link to="/dashboard/prestataire" className="logo-link">
              <img src="/Linkup lo.png" alt="Linkup" className="header-logo-img" />
            </Link>
          </div>
          
          {/* À droite : Bouton Déconnexion moderne */}
          <div className="logout-section">
            <button onClick={handleSignOut} className="modern-logout-btn">
              Déconnexion
            </button>
          </div>
        </div>
        
        {/* Menu hamburger en bas à gauche */}
        <button 
          className="hamburger-menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        {/* Menu mobile */}
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link 
            to="/dashboard/prestataire" 
            className="nav-link active"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            🏠 Tableau de bord
          </Link>
          <Link 
            to="/services" 
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            🛠️ Mes Services
          </Link>
          <Link 
            to="/planning" 
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            📅 Planning
          </Link>
          <Link 
            to="/requests" 
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            📋 Demandes
          </Link>
          <Link 
            to="/settings" 
            className="nav-link"
            onClick={() => {
              console.log('Navigation vers /settings')
              setIsMobileMenuOpen(false)
            }}
            style={{ 
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              borderRadius: '8px',
              margin: '0.5rem',
              fontWeight: '600'
            }}
          >
            ⚙️ Paramètres
          </Link>
        </nav>
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
              <Link to="/settings" className="card-button active">
                Accéder aux paramètres
              </Link>
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
