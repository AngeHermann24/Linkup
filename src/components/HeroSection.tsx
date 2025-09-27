import { Link } from 'react-router-dom'
import './HeroSection.css'

const HeroSection = () => {
  return (
    <section className="hero" id="accueil">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Trouvez le bon prestataire,
              <span className="gradient-text"> rapidement et en confiance</span>
            </h1>
            <p className="hero-subtitle">
              Connectez-vous avec des professionnels qualifiés près de chez vous. 
              Réservez en ligne, payez en sécurité, et profitez d'un service de qualité.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="cta-button primary large">
                Réserver un service
              </Link>
              <Link to="/register" className="cta-button secondary large">
                Devenir prestataire
              </Link>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="video-container">
              <div className="video-placeholder">
                <div className="play-button">
                  <div className="play-icon">▶</div>
                </div>
                <div className="video-overlay">
                  <h3>Découvrez Linkup en 2 minutes</h3>
                  <p>Voir comment ça marche</p>
                </div>
              </div>
            </div>
            
            <div className="floating-cards">
              <div className="service-card card-1">
                <div className="service-icon">🔧</div>
                <span>Réparation</span>
              </div>
              <div className="service-card card-2">
                <div className="service-icon">🎨</div>
                <span>Peinture</span>
              </div>
              <div className="service-card card-3">
                <div className="service-icon">🚿</div>
                <span>Plomberie</span>
              </div>
              <div className="service-card card-4">
                <div className="service-icon">⚡</div>
                <span>Électricité</span>
              </div>
              <div className="service-card card-5">
                <div className="service-icon">✂️</div>
                <span>Coiffure</span>
              </div>
              <div className="service-card card-6">
                <div className="service-icon">🍽️</div>
                <span>Traiteur</span>
              </div>
              <div className="service-card card-7">
                <div className="service-icon">🧹</div>
                <span>Ménage</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-number">500+</div>
            <div className="stat-label">Prestataires</div>
          </div>
          <div className="stat">
            <div className="stat-number">2000+</div>
            <div className="stat-label">Services réalisés</div>
          </div>
          <div className="stat">
            <div className="stat-number">4.8/5</div>
            <div className="stat-label">Satisfaction client</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
