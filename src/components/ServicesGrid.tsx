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

  // Catégories principales (affichées par défaut)
  const mainCategories = [
    { value: 'all', label: 'Tous les services', icon: '🔧' },
    { value: 'Toclo Toclo', label: 'Toclo Toclo', icon: '🏍️' },
    { value: 'Fanicko', label: 'Fanicko', icon: '🚲' },
    { value: 'Technicien de surface', label: 'Technicien de surface', icon: '🧹' },
    { value: 'Peintre', label: 'Peintre', icon: '🎨' },
    { value: 'Jardinage', label: 'Jardinage', icon: '🌱' }
  ]
  
  // Toutes les catégories disponibles
  const allCategories = [
    ...mainCategories,
    { value: 'Ménage', label: 'Ménage', icon: '🧹' },
    { value: 'Mécanicien', label: 'Mécanicien', icon: '🔧' },
    { value: 'Plomberie', label: 'Plomberie', icon: '🔧' },
    { value: 'Électricien', label: 'Électricien', icon: '⚡' },
    { value: 'Coiffure', label: 'Coiffure', icon: '✂️' },
    { value: 'Coiffeuse', label: 'Coiffeuse', icon: '💇‍♀️' },
    { value: 'Traiteur', label: 'Traiteur', icon: '🍽️' },
    { value: 'Maquilleuse', label: 'Maquilleuse', icon: '💄' },
    { value: 'Pâtissier', label: 'Pâtissier', icon: '🎂' }
  ]
  
  // État pour gérer l'affichage des catégories
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [viewMode, setViewMode] = useState<'categories' | 'services'>('categories')
  
  // Catégories à afficher selon l'état
  const categoriesToShow = showAllCategories ? allCategories : mainCategories

  const loadServices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Démarrage du chargement des services prestataires...')

      // STEP 1: Vérifier tous les profils prestataires
      console.log('🔍 STEP 1: Vérification de tous les prestataires...')
      const { data: allProviders, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'prestataire')
        
      if (allError) {
        console.error('❌ Erreur lors de la vérification des prestataires:', allError)
      }
        
      console.log('📋 Tous les prestataires trouvés:', allProviders?.length || 0)
      if (allProviders && allProviders.length > 0) {
        console.log('📄 Détail de tous les prestataires:')
        allProviders.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.full_name} - ${p.service_category} - Status: ${p.verification_status}`)
        })
      }
      
      // STEP 2: Récupérer seulement les prestataires approuvés
      console.log('\n✅ STEP 2: Récupération des prestataires approuvés...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'prestataire')
        .eq('verification_status', 'approved')
        .not('service_category', 'is', null)
        .order('created_at', { ascending: false })
        
      console.log('✅ Prestataires approuvés trouvés:', data?.length || 0)
      
      // STEP 3: Si aucun prestataire approuvé, essayer sans filtre de vérification
      let finalData = data
      if (!data || data.length === 0) {
        console.log('⚠️ Aucun prestataire approuvé trouvé. Test sans filtre de vérification...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'prestataire')
          .not('service_category', 'is', null)
          .order('created_at', { ascending: false })
          
        if (fallbackError) {
          console.error('❌ Erreur requête fallback:', fallbackError)
        } else {
          console.log('🔄 Prestataires sans filtre de vérification:', fallbackData?.length || 0)
          finalData = fallbackData
        }
      }

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      // Transformer les profils prestataires en services
      const transformedServices = (finalData || []).map(provider => ({
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
      console.log('✅ Services chargés depuis les profils prestataires:', transformedServices.length)
      console.log('📋 Détail des services chargés:')
      transformedServices.forEach((s, index) => {
        console.log(`  ${index + 1}. ${s.provider_name} - ${s.service_name} (${s.service_type})`)
      })
      
      // Vérifier les catégories uniques
      const uniqueCategories = [...new Set(transformedServices.map(s => s.service_name))]
      console.log('🏷️ Catégories uniques trouvées:', uniqueCategories)
      
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

  // Filtrer les services avec logique optimisée
  const filteredServices = services.filter(service => {
    // Vérification de recherche optimisée
    const searchLower = searchTerm.toLowerCase().trim()
    const matchesSearch = searchTerm === '' || (
      service.title?.toLowerCase().includes(searchLower) ||
      service.service_name?.toLowerCase().includes(searchLower) ||
      service.provider_name?.toLowerCase().includes(searchLower) ||
      service.short_description?.toLowerCase().includes(searchLower)
    )
    
    // Vérification de catégorie optimisée avec gestion des variantes
    let matchesCategory = false
    
    if (selectedCategory === 'all') {
      matchesCategory = true
    } else {
      const categoryLower = selectedCategory.toLowerCase()
      const serviceLower = service.service_name?.toLowerCase() || ''
      
      // Correspondance exacte
      matchesCategory = service.service_name === selectedCategory ||
                       serviceLower === categoryLower
      
      // Correspondance partielle
      if (!matchesCategory) {
        matchesCategory = serviceLower.includes(categoryLower) ||
                         categoryLower.includes(serviceLower)
      }
      
      // Gestion des variantes spécifiques
      if (!matchesCategory) {
        // Coiffure/Coiffeuse
        if ((categoryLower.includes('coiff') && serviceLower.includes('coiff')) ||
            (categoryLower === 'coiffure' && serviceLower.includes('coiff')) ||
            (categoryLower === 'coiffeuse' && serviceLower.includes('coiff'))) {
          matchesCategory = true
        }
        // Mécanicien/Mécanique
        if ((categoryLower.includes('mécan') && serviceLower.includes('mécan'))) {
          matchesCategory = true
        }
        // Électricien/Électrique
        if ((categoryLower.includes('électr') && serviceLower.includes('électr'))) {
          matchesCategory = true
        }
      }
    }
    
    return matchesSearch && matchesCategory
  })
  
  // Résumé du filtrage (seulement si recherche active)
  if (searchTerm !== '' || selectedCategory !== 'all') {
    console.log(`🔍 Recherche: "${searchTerm}" | Catégorie: "${selectedCategory}" | Résultats: ${filteredServices.length}/${services.length}`)
    
    // Debug spécial pour Coiffure
    if (selectedCategory.toLowerCase().includes('coiff')) {
      console.log('🔍 DEBUG COIFFURE:')
      console.log('Services totaux:', services.length)
      console.log('Services avec "coiff" dans le nom:')
      services.forEach(s => {
        if (s.service_name.toLowerCase().includes('coiff')) {
          console.log(`  - ${s.provider_name}: "${s.service_name}"`)
        }
      })
      console.log('Services filtrés pour coiffure:', filteredServices.length)
      filteredServices.forEach(s => {
        console.log(`  ✅ ${s.provider_name}: "${s.service_name}"`)
      })
    }
  }

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
          <button 
            onClick={loadServices} 
            className="reload-btn"
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginLeft: '1rem'
            }}
          >
            🔄 Recharger
          </button>
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
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="category-filters">
          {categoriesToShow.map((category: { value: string; label: string; icon: string }) => (
            <button
              key={category.value}
              className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category.value)
                setViewMode('services')
                console.log(`🏷️ Catégorie sélectionnée: ${category.label}`)
              }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
          
          {/* Bouton pour afficher plus de catégories */}
          {!showAllCategories && (
            <button
              className="category-btn show-more-btn"
              onClick={() => setShowAllCategories(true)}
              style={{
                background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                border: '2px dashed #9ca3af',
                color: '#6b7280'
              }}
            >
              <span className="category-icon">➕</span>
              <span className="category-label">Plus de catégories</span>
            </button>
          )}
        </div>
      </div>

      {/* Bouton retour aux catégories */}
      {viewMode === 'services' && selectedCategory !== 'all' && (
        <div style={{
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => {
              setViewMode('categories')
              setSelectedCategory('all')
            }}
            style={{
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#374151'
            }}
          >
            ← Retour aux catégories
          </button>
        </div>
      )}
      
      {/* Message de résultats de recherche */}
      {searchTerm && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: '#1e40af'
        }}>
          🔍 <strong>{filteredServices.length}</strong> résultat{filteredServices.length > 1 ? 's' : ''} pour "{searchTerm}"
        </div>
      )}
      
      {/* Message de catégorie sélectionnée */}
      {viewMode === 'services' && selectedCategory !== 'all' && !searchTerm && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: '#0c4a6e'
        }}>
          🏷️ Services de catégorie: <strong>{selectedCategory}</strong> ({filteredServices.length} service{filteredServices.length > 1 ? 's' : ''})
        </div>
      )}
      
      {/* Grille des services */}
      {filteredServices.length === 0 ? (
        <div className="empty-state">
          <h3>Aucun service trouvé</h3>
          <p>
            {searchTerm ? (
              <>Aucun résultat pour "{searchTerm}". Essayez un autre terme de recherche.</>
            ) : (
              <>Essayez de modifier vos critères de recherche ou de sélectionner une autre catégorie.</>
            )}
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="services-grid">
          {filteredServices.map((service, index) => {
            // Vérifier que les données essentielles existent
            if (!service.id || !service.provider_name || !service.service_name) {
              return null
            }
            
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
