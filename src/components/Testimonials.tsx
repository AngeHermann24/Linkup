import { Link } from 'react-router-dom'
import './Testimonials.css'

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Marie Kouassi',
      role: 'Propriétaire',
      avatar: '👩🏾',
      rating: 5,
      text: 'Service exceptionnel ! Mon plombier est arrivé à l\'heure et a résolu mon problème rapidement. Je recommande vivement Linkup.',
      service: 'Plomberie'
    },
    {
      name: 'Jean-Baptiste Traoré',
      role: 'Entrepreneur',
      avatar: '👨🏿',
      rating: 5,
      text: 'Grâce à Linkup, j\'ai trouvé un électricien qualifié en moins de 2 heures. Le processus de réservation est très simple.',
      service: 'Électricité'
    },
    {
      name: 'Fatou Diallo',
      role: 'Étudiante',
      avatar: '👩🏿',
      rating: 5,
      text: 'Excellent rapport qualité-prix. Le peintre était professionnel et a fait un travail impeccable dans mon appartement.',
      service: 'Peinture'
    }
  ]

  const trustFeatures = [
    {
      icon: '🛡️',
      title: 'Prestataires vérifiés',
      description: 'Tous nos professionnels sont contrôlés et certifiés'
    },
    {
      icon: '⚡',
      title: 'Intervention rapide',
      description: 'Réponse en moins de 2 heures en moyenne'
    },
    {
      icon: '💯',
      title: 'Garantie satisfaction',
      description: 'Satisfait ou remboursé sur tous nos services'
    },
    {
      icon: '🔒',
      title: 'Paiement sécurisé',
      description: 'Transactions protégées et données chiffrées'
    }
  ]

  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <div className="section-header">
          <h2 className="section-title">Ce que disent nos clients</h2>
          <p className="section-subtitle">
            Plus de 2000 clients satisfaits nous font confiance
          </p>
        </div>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">
                  {testimonial.avatar}
                </div>
                <div className="user-info">
                  <h4 className="user-name">{testimonial.name}</h4>
                  <p className="user-role">{testimonial.role}</p>
                  <div className="rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="star">⭐</span>
                    ))}
                  </div>
                </div>
                <div className="service-badge">
                  {testimonial.service}
                </div>
              </div>
              
              <div className="testimonial-content">
                <div className="quote-icon">"</div>
                <p className="testimonial-text">{testimonial.text}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="trust-section">
          <h3 className="trust-title">Pourquoi nous faire confiance ?</h3>
          <div className="trust-features">
            {trustFeatures.map((feature, index) => (
              <div key={index} className="trust-feature">
                <div className="trust-icon">{feature.icon}</div>
                <div className="trust-content">
                  <h4 className="trust-feature-title">{feature.title}</h4>
                  <p className="trust-feature-description">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="testimonials-cta">
          <h3>Rejoignez des milliers de clients satisfaits</h3>
          <Link to="/register" className="cta-button primary large">
            Réserver maintenant
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
