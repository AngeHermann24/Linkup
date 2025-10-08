import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import ServicesGrid from '../components/ServicesGrid'
import './Dashboard.css'
import './ClientDashboard.css'
import './ProfessionalHeader.css'

const ClientDashboard = () => {
  const { profile, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="dashboard-container">
      <header className="modern-header">
        <div className="header-layout">
          {/* À gauche : Nom + Rôle dans une carte élégante */}
          <div className="user-card">
            <div className="user-info">
              <span className="user-name">{profile?.full_name || 'Hermann'}</span>
              <span className="user-role">CLIENT</span>
            </div>
          </div>
          
          {/* Au centre : Logo Linkup */}
          <div className="center-logo">
            <Link to="/dashboard/client" className="logo-link">
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
            to="/dashboard/client" 
            className="nav-link active"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            🏠 Accueil
          </Link>
          <button 
            onClick={() => {
              document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
              setIsMobileMenuOpen(false)
            }}
            className="nav-link nav-btn"
          >
            🔍 Services
          </button>
          <Link 
            to="/reservations" 
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            📅 Mes Réservations
          </Link>
        </nav>
      </header>

      <main className="dashboard-main">
        <div className="client-dashboard-content">
          {/* Section Hero moderne */}
          <div className="hero-section">
            <div className="hero-content">
              <div className="hero-text">
                <div className="greeting">
                  <span className="greeting-text">Bonjour</span>
                  <span className="user-name">{profile?.full_name || 'Client'}</span>
                  <div className="greeting-emoji">👋</div>
                </div>
                <h1 className="hero-title">
                  Trouvez le <span className="highlight">prestataire parfait</span> pour tous vos besoins
                </h1>
                <p className="hero-description">
                  Accédez à notre réseau de professionnels qualifiés et réservez vos services en quelques clics.
                </p>
                <div className="hero-stats">
                  <div className="stat-item">
                    <div className="stat-number">500+</div>
                    <div className="stat-label">Prestataires</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">15</div>
                    <div className="stat-label">Catégories</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">4.8/5</div>
                    <div className="stat-label">Satisfaction</div>
                  </div>
                </div>
                
                {/* Bouton pour descendre vers les services */}
                <div className="scroll-to-services">
                  <button 
                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                    className="scroll-button"
                  >
                    <span>Découvrir nos services</span>
                    <div className="scroll-arrow">↓</div>
                  </button>
                </div>
              </div>
              <div className="hero-visual">
                <div className="bubbles-container">
                  <div className="bubble bubble-1"></div>
                  <div className="bubble bubble-2"></div>
                  <div className="bubble bubble-3"></div>
                  <div className="bubble bubble-4"></div>
                  <div className="bubble bubble-5"></div>
                  <div className="bubble bubble-6"></div>
                  <div className="bubble bubble-7"></div>
                  <div className="bubble bubble-8"></div>
                </div>
                <div className="hero-circle"></div>
              </div>
            </div>
          </div>

          {/* Section Services avec header amélioré */}
          <div className="services-section" id="services">
            <div className="services-indicator">
              <div className="indicator-line"></div>
              <div className="indicator-text">Services Disponibles</div>
            </div>
            <ServicesGrid />
          </div>
        </div>
      </main>
    </div>
  )
}

export default ClientDashboard
