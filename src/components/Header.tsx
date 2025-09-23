import { Link } from 'react-router-dom'
import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src="/Linkup lo.png" alt="Linkup" className="logo-image" />
        </Link>
        
        <nav className="nav">
          <a href="#accueil" className="nav-link">Accueil</a>
          <a href="#tarifs" className="nav-link">Tarifs</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>
        
        <div className="header-actions">
          <Link to="/login" className="auth-link">
            Connexion
          </Link>
          <Link to="/register" className="cta-button primary">
            S'inscrire
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
