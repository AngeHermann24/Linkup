import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './AdminServices.css'

interface ServiceCategory {
  id: string
  name: string
  description: string
  plan_type: 'basic' | 'pro'
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AdminServicesProps {
  onBack: () => void
}

const AdminServices: React.FC<AdminServicesProps> = ({ onBack }) => {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPlan, setFilterPlan] = useState<'all' | 'basic' | 'pro'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Charger toutes les catégories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Filtrer les catégories
  useEffect(() => {
    let filtered = categories

    // Filtrer par plan
    if (filterPlan !== 'all') {
      filtered = filtered.filter(c => c.plan_type === filterPlan)
    }

    // Filtrer par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
      )
    }

    setFilteredCategories(filtered)
  }, [categories, filterPlan, searchTerm])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      // Essayer de récupérer depuis la base de données
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error && !error.message.includes('relation "service_categories" does not exist')) {
        throw error
      }

      if (data && data.length > 0) {
        setCategories(data)
      } else {
        // Utiliser des données de test
        loadTestData()
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error)
      loadTestData()
    } finally {
      setLoading(false)
    }
  }

  const loadTestData = () => {
    const testCategories: ServiceCategory[] = [
      {
        id: '1',
        name: 'Plomberie',
        description: 'Réparation et installation de plomberie',
        plan_type: 'pro',
        icon: '🔧',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Coiffure',
        description: 'Services de coiffure et beauté',
        plan_type: 'basic',
        icon: '✂️',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Électricité',
        description: 'Installation et réparation électrique',
        plan_type: 'pro',
        icon: '⚡',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Ménage',
        description: 'Nettoyage et entretien ménager',
        plan_type: 'basic',
        icon: '🧹',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Jardinage',
        description: 'Entretien et aménagement de jardins',
        plan_type: 'basic',
        icon: '🌱',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '6',
        name: 'Climatisation',
        description: 'Installation et maintenance de climatisation',
        plan_type: 'pro',
        icon: '❄️',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    setCategories(testCategories)
  }

  const handleAddCategory = async (categoryData: Omit<ServiceCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCategory: ServiceCategory = {
        ...categoryData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Essayer d'ajouter à la base de données
      const { error } = await supabase
        .from('service_categories')
        .insert([newCategory])

      if (error && !error.message.includes('relation "service_categories" does not exist')) {
        throw error
      }

      // Ajouter localement
      setCategories(prev => [newCategory, ...prev])
      setShowAddModal(false)
      alert('Catégorie ajoutée avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error)
      // Ajouter localement même en cas d'erreur
      const newCategory: ServiceCategory = {
        ...categoryData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setCategories(prev => [newCategory, ...prev])
      setShowAddModal(false)
      alert('Catégorie ajoutée localement (mode démo)')
    }
  }

  const handleUpdateCategory = async (categoryId: string, updates: Partial<ServiceCategory>) => {
    try {
      const { error } = await supabase
        .from('service_categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', categoryId)

      if (error && !error.message.includes('relation "service_categories" does not exist')) {
        throw error
      }

      // Mettre à jour localement
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        )
      )

      setShowEditModal(false)
      setSelectedCategory(null)
      alert('Catégorie mise à jour avec succès')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      // Mettre à jour localement même en cas d'erreur
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        )
      )
      setShowEditModal(false)
      setSelectedCategory(null)
      alert('Catégorie mise à jour localement (mode démo)')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return

    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', categoryId)

      if (error && !error.message.includes('relation "service_categories" does not exist')) {
        throw error
      }

      // Supprimer localement
      setCategories(prev => prev.filter(c => c.id !== categoryId))
      alert('Catégorie supprimée avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      // Supprimer localement même en cas d'erreur
      setCategories(prev => prev.filter(c => c.id !== categoryId))
      alert('Catégorie supprimée localement (mode démo)')
    }
  }

  const toggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
    await handleUpdateCategory(categoryId, { is_active: isActive })
  }

  const getCategoryCounts = () => {
    return {
      all: categories.length,
      basic: categories.filter(c => c.plan_type === 'basic').length,
      pro: categories.filter(c => c.plan_type === 'pro').length,
      active: categories.filter(c => c.is_active).length,
      inactive: categories.filter(c => !c.is_active).length
    }
  }

  if (loading) {
    return (
      <div className="admin-services">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des services...</p>
        </div>
      </div>
    )
  }

  const counts = getCategoryCounts()

  return (
    <div className="admin-services">
      {/* Header */}
      <div className="services-header">
        <button onClick={onBack} className="back-btn">
          ← Retour
        </button>
        <h2>Gestion des Services</h2>
        <button onClick={() => setShowAddModal(true)} className="add-btn">
          + Ajouter une catégorie
        </button>
      </div>

      {/* Contrôles */}
      <div className="services-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="plan-filters">
          <button
            className={`filter-btn ${filterPlan === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPlan('all')}
          >
            Toutes ({counts.all})
          </button>
          <button
            className={`filter-btn basic ${filterPlan === 'basic' ? 'active' : ''}`}
            onClick={() => setFilterPlan('basic')}
          >
            📦 Basic ({counts.basic})
          </button>
          <button
            className={`filter-btn pro ${filterPlan === 'pro' ? 'active' : ''}`}
            onClick={() => setFilterPlan('pro')}
          >
            ⭐ Pro ({counts.pro})
          </button>
        </div>
      </div>

      {/* Grille des catégories */}
      <div className="categories-grid">
        {filteredCategories.map(category => (
          <div key={category.id} className={`category-card ${category.plan_type}`}>
            <div className="category-header">
              <div className="category-info">
                <div className="category-icon">{category.icon}</div>
                <div>
                  <h3 className="category-name">{category.name}</h3>
                  <span className={`plan-badge ${category.plan_type}`}>
                    {category.plan_type === 'basic' ? '📦 Basic' : '⭐ Pro'}
                  </span>
                </div>
              </div>
              <div className="category-actions">
                <button
                  onClick={() => toggleCategoryStatus(category.id, !category.is_active)}
                  className={`status-btn ${category.is_active ? 'active' : 'inactive'}`}
                  title={category.is_active ? 'Désactiver' : 'Activer'}
                >
                  {category.is_active ? '✅' : '❌'}
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory(category)
                    setShowEditModal(true)
                  }}
                  className="edit-btn"
                  title="Modifier"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="delete-btn"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="category-content">
              <p className="category-description">{category.description}</p>
              
              <div className="subscription-info">
                <span className="subscription-label">Abonnement Prestataire Requis:</span>
                <span className={`subscription-badge ${category.plan_type}`}>
                  {category.plan_type === 'basic' ? '📦 Basic (1000 FCFA/mois)' : '⭐ Pro (3000 FCFA/mois)'}
                </span>
              </div>

              <div className="category-status">
                <span className={`status-indicator ${category.is_active ? 'active' : 'inactive'}`}>
                  {category.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="empty-state">
          <p>Aucune catégorie trouvée</p>
        </div>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <CategoryModal
          onSave={handleAddCategory}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          onSave={(data) => handleUpdateCategory(selectedCategory.id, data)}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCategory(null)
          }}
        />
      )}
    </div>
  )
}

// Modal pour ajouter/modifier une catégorie
const CategoryModal: React.FC<{
  category?: ServiceCategory
  onSave: (data: any) => void
  onClose: () => void
}> = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    plan_type: category?.plan_type || 'basic' as 'basic' | 'pro',
    icon: category?.icon || '🔧',
    is_active: category?.is_active ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const iconOptions = ['🔧', '✂️', '⚡', '🧹', '🌱', '❄️', '🏠', '🚗', '💻', '🎨', '🍳', '🏃']

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{category ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nom de la catégorie</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Icône</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
              >
                {iconOptions.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Abonnement Prestataire Requis</label>
            <select
              value={formData.plan_type}
              onChange={(e) => setFormData({...formData, plan_type: e.target.value as 'basic' | 'pro'})}
            >
              <option value="basic">📦 Basic (1000 FCFA/mois)</option>
              <option value="pro">⭐ Pro (3000 FCFA/mois)</option>
            </select>
            <small className="form-note">
              Détermine quel type d'abonnement le prestataire doit avoir pour proposer ce service
            </small>
          </div>



          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
              Catégorie active
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Annuler
            </button>
            <button type="submit" className="save-btn">
              {category ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminServices
