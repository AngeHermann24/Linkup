import { Link } from 'react-router-dom'
import './HowItWorks.css'

const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      icon: '🔍',
      title: 'Choisissez votre service',
      description: 'Parcourez nos catégories et sélectionnez le service dont vous avez besoin.'
    },
    {
      number: '2',
      icon: '📅',
      title: 'Réservez en ligne',
      description: 'Choisissez votre créneau et confirmez votre réservation en quelques clics.'
    },
    {
      number: '3',
      icon: '🏠',
      title: 'Le prestataire vient à vous',
      description: 'Votre professionnel se déplace chez vous à l\'heure convenue.'
    }
  ]

  return (
    <section className="how-it-works">
      <div className="how-it-works-container">
        <div className="section-header">
          <h2 className="section-title">Comment ça marche ?</h2>
          <p className="section-subtitle">
            Trois étapes simples pour obtenir le service dont vous avez besoin
          </p>
        </div>
        
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={step.number} className="step">
              <div className="step-number">
                <span>{step.number}</span>
              </div>
              
              <div className="step-icon">
                {step.icon}
              </div>
              
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <div className="connector-line"></div>
                  <div className="connector-arrow">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="how-it-works-cta">
          <Link to="/register" className="cta-button primary large">
            Commencer maintenant
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
