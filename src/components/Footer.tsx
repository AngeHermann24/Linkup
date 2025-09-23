import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    services: [
      'Plomberie',
      'Électricité',
      'Peinture',
      'Mécanique',
      'Jardinage',
      'Maçonnerie'
    ],
    company: [
      'À propos',
      'Notre équipe',
      'Carrières',
      'Presse',
      'Partenaires'
    ],
    support: [
      'Centre d\'aide',
      'Contact',
      'FAQ',
      'Signaler un problème',
      'Statut du service'
    ],
    legal: [
      'CGU',
      'Politique de confidentialité',
      'Mentions légales',
      'Cookies'
    ]
  }

  const socialLinks = [
    { name: 'Facebook', icon: '📘', url: '#' },
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'LinkedIn', icon: '💼', url: '#' },
    { name: 'YouTube', icon: '📺', url: '#' }
  ]

  return (
    <footer className="footer" id="contact">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-icon">🔗</div>
              <span className="logo-text">Linkup</span>
            </div>
            <p className="footer-description">
              La plateforme qui connecte les particuliers avec les meilleurs prestataires de services. 
              Rapide, sécurisé et fiable.
            </p>
            <div className="social-links">
              {socialLinks.map((social) => (
                <a 
                  key={social.name} 
                  href={social.url} 
                  className="social-link"
                  aria-label={social.name}
                >
                  <span className="social-icon">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4 className="link-title">Services</h4>
              <ul className="link-list">
                {footerLinks.services.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer-link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="link-group">
              <h4 className="link-title">Entreprise</h4>
              <ul className="link-list">
                {footerLinks.company.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer-link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="link-group">
              <h4 className="link-title">Support</h4>
              <ul className="link-list">
                {footerLinks.support.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer-link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="link-group">
              <h4 className="link-title">Légal</h4>
              <ul className="link-list">
                {footerLinks.legal.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer-link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-newsletter">
          <div className="newsletter-content">
            <h3 className="newsletter-title">Restez informé</h3>
            <p className="newsletter-description">
              Recevez nos dernières actualités et offres spéciales
            </p>
          </div>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Votre adresse email"
              className="newsletter-input"
            />
            <button className="newsletter-button">
              S'abonner
            </button>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} Linkup. Tous droits réservés.
            </p>
            <div className="footer-bottom-links">
              <a href="#" className="footer-bottom-link">Conditions générales</a>
              <a href="#" className="footer-bottom-link">Confidentialité</a>
              <a href="#" className="footer-bottom-link">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
