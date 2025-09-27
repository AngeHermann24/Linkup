import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ServiceDetailModal from './ServiceDetailModal'
import './ServicesGrid.css'

interface ServiceProvider {
  id: string
  provider_id: string
  service_name: string
  service_type: string
  title: string
  short_description?: string
  description?: string
  base_price?: number
  price_unit: string
  price_type: string
  duration_minutes?: number
  created_at: string
  
  // Informations prestataire
  provider_name: string
  provider_email: string
  provider_phone?: string
  provider_service: string
  
  // Images
  images?: Array<{
    id: string
    image_url: string
    alt_text?: string
    is_primary: boolean
  }>
}

const ServicesGrid = () => {
  // const { user } = useAuth() // Pas utilisé pour l'instant
  const [services, setServices] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceProvider | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Catégories de services Linkup
  const categories = [
    { value: 'all', label: 'Tous les services', icon: '🔧' },
    // Services Basic
    { value: 'Toclo Toclo', label: 'Toclo Toclo', icon: '🏍️' },
    { value: 'Fanicko', label: 'Fanicko', icon: '🚲' },
    { value: 'Technicien de surface', label: 'Technicien de surface', icon: '🧹' },
    { value: 'Peintre', label: 'Peintre', icon: '🎨' },
    { value: 'Jardinage', label: 'Jardinage', icon: '🌱' },
    { value: 'Ménage', label: 'Ménage', icon: '🧹' },
    // Services Pro
    { value: 'Mécanicien', label: 'Mécanicien', icon: '🔧' },
    { value: 'Plomberie', label: 'Plomberie', icon: '🔧' },
    { value: 'Électricien', label: 'Électricien', icon: '⚡' },
    { value: 'Coiffure', label: 'Coiffure', icon: '✂️' },
    { value: 'Traiteur', label: 'Traiteur', icon: '🍽️' },
    { value: 'Maquilleuse', label: 'Maquilleuse', icon: '💄' },
    { value: 'Pâtissier', label: 'Pâtissier', icon: '🎂' }
  ]

  const loadServices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Chargement des services prestataires...')

      // Test 1: Récupérer TOUS les prestataires d'abord
      const { data: allProviders, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'prestataire')
        
      console.log('TOUS les prestataires:', allProviders?.length || 0)
      console.log('Détail TOUS prestataires:', allProviders?.map(p => ({
        nom: p.full_name,
        service: p.service_category,
        statut: p.verification_status
      })))

      // Test 2: Récupérer seulement les approuvés
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'prestataire')
        .eq('verification_status', 'approved')
        .not('service_category', 'is', null)
        .order('created_at', { ascending: false })
        
      console.log('Prestataires approuvés:', data?.length || 0)

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      // Transformer les profils prestataires en services
      const transformedServices = (data || []).map(provider => ({
        id: provider.id,
        provider_id: provider.id,
        service_name: provider.service_category,
        service_type: provider.service_type || 'basic',
        title: `${provider.service_category} - ${provider.full_name}`,
        short_description: `Services de ${provider.service_category.toLowerCase()} professionnels`,
        description: `${provider.full_name} propose des services de ${provider.service_category.toLowerCase()} de qualité. Contactez-nous pour plus d'informations.`,
        base_price: provider.service_type === 'pro' ? 3000 : 1000,
        price_unit: 'FCFA',
        price_type: 'fixed',
        duration_minutes: 60,
        created_at: provider.created_at,
        
        // Informations prestataire
        provider_name: provider.full_name,
        provider_email: provider.email,
        provider_phone: provider.phone,
        provider_service: provider.service_category,
        
        // Images par défaut
        images: provider.profile_photo_url ? [{
          id: '1',
          image_url: provider.profile_photo_url,
          alt_text: `Photo de ${provider.full_name}`,
          is_primary: true
        }] : []
      }))

      setServices(transformedServices)
      console.log('Services chargés depuis les profils prestataires:', transformedServices.length)
      console.log('Détail des services:', transformedServices.map(s => ({ 
        nom: s.provider_name, 
        service: s.service_name,
        titre: s.title 
      })))
      
      if (transformedServices.length === 0) {
        console.warn('Aucun prestataire approuvé trouvé. Vérifiez que des prestataires ont été approuvés via l\'admin.')
      }
      
    } catch (err: any) {
      console.error('Erreur lors du chargement des services:', err)
      setError(`Erreur de connexion: ${err.message}. Vérifiez votre connexion internet et les paramètres Supabase.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  // Filtrer les services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
                           service.service_name === selectedCategory ||
                           service.service_name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                           selectedCategory.toLowerCase().includes(service.service_name.toLowerCase())
    
    // Debug pour chaque service
    if (selectedCategory === 'all') {
      console.log(`Service ${service.provider_name}:`, {
        service_name: service.service_name,
        matchesSearch,
        matchesCategory,
        included: matchesSearch && matchesCategory
      })
    }
    
    return matchesSearch && matchesCategory
  })
  
  console.log('Services totaux:', services.length)
  console.log('Catégorie sélectionnée:', selectedCategory)
  console.log('Services filtrés:', filteredServices.length)

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    if (name.includes('plomb')) return '🔧'
    if (name.includes('électr')) return '⚡'
    if (name.includes('mécan')) return '🔧'
    if (name.includes('coiff')) return '💇‍♀️'
    if (name.includes('maquill')) return '💄'
    if (name.includes('peint')) return '🎨'
    if (name.includes('jardin')) return '🌱'
    if (name.includes('surface') || name.includes('nettoy')) return '🧹'
    if (name.includes('traiteur')) return '🍽️'
    if (name.includes('pâtiss')) return '🧁'
    if (name.includes('toclo') || name.includes('fanicko')) return '🛠️'
    return '🔧'
  }

  const getPrimaryImage = (service: ServiceProvider) => {
    if (!service.images || service.images.length === 0) return null
    return service.images.find(img => img.is_primary) || service.images[0]
  }

  if (loading) {
    return (
      <div className="services-grid-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des services disponibles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="services-grid-container">
        <div className="error-state">
          <p>Erreur: {error}</p>
          <button onClick={loadServices} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="services-grid-container">
      <div className="services-header">
        <div className="services-title">
          <h2>🎆 Découvrez Nos Services</h2>
          <p>Une sélection de professionnels qualifiés à votre service</p>
        </div>
        
        <div className="services-stats">
          <div className="stats-item premium">
            <div className="stats-number">{services.length}</div>
            <div className="stats-label">Professionnels</div>
          </div>
          <div className="stats-item premium">
            <div className="stats-number">{filteredServices.length}</div>
            <div className="stats-label">Services trouvés</div>
          </div>
          <div className="stats-item premium">
            <div className="stats-number">24/7</div>
            <div className="stats-label">Support</div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="services-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher un service ou prestataire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.value}
              className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.value)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grille des services */}
      {filteredServices.length === 0 ? (
        <div className="empty-state">
          <h3>Aucun service trouvé</h3>
          <p>Essayez de modifier vos critères de recherche ou de sélectionner une autre catégorie.</p>
        </div>
      ) : (
        <div className="services-grid">
          {filteredServices.map((service, index) => {
            // Vérifier que les données essentielles existent
            if (!service.id || !service.provider_name || !service.service_name) {
              console.warn('Service avec données manquantes:', service)
              return null
            }
            
            console.log(`Rendu service ${index + 1}:`, service.provider_name, service.service_name)
            
            const primaryImage = getPrimaryImage(service)
            const uniqueKey = `${service.id}-${service.provider_name}-${index}`
            
            return (
              <div key={uniqueKey} className="service-card" onClick={() => setSelectedService(service)}>
                <div className="service-image">
                  {primaryImage ? (
                    <img src={primaryImage.image_url} alt={primaryImage.alt_text || service.title} />
                  ) : (
                    <div className="service-icon">
                      {getServiceIcon(service.service_name)}
                    </div>
                  )}
                  <div className="service-badge">
                    {service.service_type === 'pro' ? '⭐ Pro' : '🔧 Basique'}
                  </div>
                </div>

                <div className="service-content">
                  <div className="service-header">
                    <h3 className="service-title">{service.title || `${service.service_name} - ${service.provider_name}`}</h3>
                    <div className="service-category">{service.service_name || 'Service'}</div>
                  </div>

                  <div className="provider-info">
                    <span className="provider-name">👤 {service.provider_name || 'Prestataire'}</span>
                    <div className="service-rating">
                      ⭐⭐⭐⭐⭐ <span>(4.8)</span>
                    </div>
                  </div>

                  {service.short_description && (
                    <p className="service-description">{service.short_description}</p>
                  )}

                  <div className="service-details">
                    <div className="service-price">
                      {service.base_price ? (
                        <>
                          <span className="price-amount">{service.base_price} {service.price_unit}</span>
                          <span className="price-type">
                            {service.price_type === 'fixe' && 'Prix fixe'}
                            {service.price_type === 'horaire' && '/heure'}
                            {service.price_type === 'forfait' && 'Forfait'}
                          </span>
                        </>
                      ) : (
                        <span className="price-on-quote">Prix sur devis</span>
                      )}
                    </div>

                    {service.duration_minutes && (
                      <div className="service-duration">
                        ⏱️ {Math.floor(service.duration_minutes / 60)}h
                        {service.duration_minutes % 60 > 0 && `${service.duration_minutes % 60}min`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="service-actions">
                  <button className="view-details-btn">
                    👁️ Voir détails
                  </button>
                  <button 
                    className="order-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedService(service)
                    }}
                  >
                    📞 Commander
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de détails du service */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  )
}

export default ServicesGrid
