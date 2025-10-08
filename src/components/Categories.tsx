import './Categories.css'

const Categories = () => {
  // Ajout des animations CSS directement
  const floatKeyframes = `
    @keyframes floatBubble {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-10px) rotate(1deg); }
      50% { transform: translateY(-5px) rotate(0deg); }
      75% { transform: translateY(-15px) rotate(-1deg); }
    }
  `
  
  // Injection des styles
  if (typeof document !== 'undefined') {
    const styleElement = document.getElementById('float-animation')
    if (!styleElement) {
      const style = document.createElement('style')
      style.id = 'float-animation'
      style.textContent = floatKeyframes
      document.head.appendChild(style)
    }
  }
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
        
        <div className="categories-grid" style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {categories.map((category) => (
            <div 
              key={category.title} 
              style={{ 
                background: 'white',
                borderRadius: '25px',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                minWidth: '250px',
                maxWidth: '300px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${category.color}20`,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                fontSize: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                background: category.color,
                borderRadius: '50%',
                color: 'white',
                flexShrink: 0
              }}>
                {category.icon}
              </div>
              
              <div style={{
                flex: 1
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#1f2937',
                  margin: 0
                }}>{category.title}</h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0'
                }}>{category.description}</p>
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
