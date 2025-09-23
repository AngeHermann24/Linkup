import { Link } from 'react-router-dom'
import './Pricing.css'

const Pricing = () => {
  const plans = [
    {
      name: 'Basique',
      price: '1 000',
      period: 'mois',
      description: 'Parfait pour commencer',
      features: [
        'Accès à tous les services',
        'Support client 24/7',
        'Réservation en ligne',
        'Paiement sécurisé',
        'Historique des services'
      ],
      popular: false,
      color: '#6b7280'
    },
    {
      name: 'Pro',
      price: '3 000',
      period: 'mois',
      description: 'Pour les utilisateurs réguliers',
      features: [
        'Tout du plan Basique',
        'Services prioritaires',
        'Remises exclusives',
        'Prestataires premium',
        'Support téléphonique',
        'Garantie satisfaction',
        'Rapports détaillés'
      ],
      popular: true,
      color: '#2563eb'
    }
  ]

  return (
    <section className="pricing" id="tarifs">
      <div className="pricing-container">
        <div className="section-header">
          <h2 className="section-title">Tarification claire et transparente</h2>
          <p className="section-subtitle">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </div>
        
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              style={{ '--plan-color': plan.color } as React.CSSProperties}
            >
              {plan.popular && (
                <div className="popular-badge">
                  ⭐ Plus populaire
                </div>
              )}
              
              <div className="pricing-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
                
                <div className="price-container">
                  <span className="price">{plan.price}</span>
                  <span className="currency">FCFA</span>
                  <span className="period">/ {plan.period}</span>
                </div>
              </div>
              
              <div className="features-list">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="feature-icon">✓</div>
                    <span className="feature-text">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/register" className={`plan-button ${plan.popular ? 'primary' : 'secondary'}`}>
                {plan.popular ? 'Commencer maintenant' : 'Choisir ce plan'}
              </Link>
            </div>
          ))}
        </div>
        
        <div className="pricing-footer">
          <div className="provider-cta">
            <h3>Vous êtes un prestataire ?</h3>
            <p>Rejoignez notre réseau de professionnels qualifiés</p>
            <Link to="/register" className="cta-button primary large">
              S'inscrire en tant que prestataire
            </Link>
          </div>
          
          <div className="pricing-note">
            <p>💡 Tous nos plans incluent une période d'essai gratuite de 7 jours</p>
            <p>🔒 Aucun engagement, résiliez à tout moment</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing
