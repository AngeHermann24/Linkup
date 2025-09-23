import './Categories.css'

const Categories = () => {
  const categories = [
    {
      icon: '🔧',
      title: 'Mécanicien',
      description: 'Réparation et entretien automobile',
      services: ['Vidange', 'Freins', 'Diagnostic'],
      color: '#ef4444'
    },
    {
      icon: '🚿',
      title: 'Plombier',
      description: 'Installation et réparation sanitaire',
      services: ['Fuite', 'Installation', 'Débouchage'],
      color: '#3b82f6'
    },
    {
      icon: '🎨',
      title: 'Peintre',
      description: 'Peinture intérieure et extérieure',
      services: ['Murs', 'Plafonds', 'Façades'],
      color: '#10b981'
    },
    {
      icon: '⚡',
      title: 'Électricien',
      description: 'Installation électrique et dépannage',
      services: ['Câblage', 'Prises', 'Éclairage'],
      color: '#f59e0b'
    },
    {
      icon: '🏠',
      title: 'Maçon',
      description: 'Construction et rénovation',
      services: ['Murs', 'Fondations', 'Carrelage'],
      color: '#8b5cf6'
    },
    {
      icon: '🌿',
      title: 'Jardinier',
      description: 'Entretien espaces verts',
      services: ['Tonte', 'Taille', 'Plantation'],
      color: '#06b6d4'
    }
  ]

  return (
    <section className="categories">
      <div className="categories-container">
        <div className="section-header">
          <h2 className="section-title">Nos catégories de services</h2>
          <p className="section-subtitle">
            Des professionnels qualifiés dans tous les domaines
          </p>
        </div>
        
        <div className="categories-grid">
          {categories.map((category) => (
            <div 
              key={category.title} 
              className="category-card"
              style={{ '--accent-color': category.color } as React.CSSProperties}
            >
              <div className="category-icon">
                {category.icon}
              </div>
              
              <div className="category-content">
                <h3 className="category-title">{category.title}</h3>
                <p className="category-description">{category.description}</p>
                
                <div className="category-services">
                  {category.services.map((service) => (
                    <span key={service} className="service-tag">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="category-overlay">
                <button className="category-cta">
                  Voir les prestataires
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="categories-footer">
          <p>Plus de 20 catégories disponibles</p>
          <button className="cta-button secondary">
            Voir toutes les catégories
          </button>
        </div>
      </div>
    </section>
  )
}

export default Categories
