import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './AdminDashboard.css'

interface DashboardStats {
  totalClients: number
  totalProviders: number
  validatedProviders: number
  totalRequests: number
  pendingRequests: number
  acceptedRequests: number
  rejectedRequests: number
  completedRequests: number
  cancelledRequests: number
  potentialRevenue: number
  monthlySubscriptionRevenue: number
  totalCategories: number
  basicCategories: number
  proCategories: number
}

interface AdminDashboardProps {
  onBack: () => void
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProviders: 0,
    validatedProviders: 0,
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    rejectedRequests: 0,
    completedRequests: 0,
    cancelledRequests: 0,
    potentialRevenue: 0,
    monthlySubscriptionRevenue: 0,
    totalCategories: 0,
    basicCategories: 0,
    proCategories: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Récupérer les statistiques depuis la base de données
      const [
        usersResult,
        requestsResult,
        categoriesResult,
        servicesResult
      ] = await Promise.allSettled([
        // Statistiques des utilisateurs
        supabase
          .from('profiles')
          .select('role, suspended, service_category'),
        
        // Statistiques des demandes
        supabase
          .from('service_requests')
          .select('status'),
        
        // Statistiques des catégories
        supabase
          .from('service_categories')
          .select('plan_type, is_active'),
        
        // Statistiques des services (pour revenus potentiels)
        supabase
          .from('services')
          .select('price, category')
      ])

      // Traiter les résultats
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data || [] : []
      const requests = requestsResult.status === 'fulfilled' ? requestsResult.value.data || [] : []
      const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data || [] : []
      const services = servicesResult.status === 'fulfilled' ? servicesResult.value.data || [] : []

      // Calculer les statistiques
      const totalClients = users.filter(u => u.role === 'client').length
      const totalProviders = users.filter(u => u.role === 'prestataire').length
      const validatedProviders = users.filter(u => u.role === 'prestataire' && !u.suspended).length

      const totalRequests = requests.length
      const pendingRequests = requests.filter(r => r.status === 'pending').length
      const acceptedRequests = requests.filter(r => r.status === 'accepted').length
      const rejectedRequests = requests.filter(r => r.status === 'rejected').length
      const completedRequests = requests.filter(r => r.status === 'completed').length
      const cancelledRequests = requests.filter(r => r.status === 'cancelled').length

      const totalCategories = categories.length
      const basicCategories = categories.filter(c => c.plan_type === 'basic').length
      const proCategories = categories.filter(c => c.plan_type === 'pro').length

      // Calculer les revenus potentiels
      const potentialRevenue = services.reduce((total, service) => {
        return total + (service.price || 0)
      }, 0)

      // Calculer les revenus d'abonnements (estimation)
      const basicProviders = users.filter(u => 
        u.role === 'prestataire' && 
        categories.some((c: any) => c.plan_type === 'basic' && c.name === u.service_category)
      ).length
      const proProviders = users.filter(u => 
        u.role === 'prestataire' && 
        categories.some((c: any) => c.plan_type === 'pro' && c.name === u.service_category)
      ).length

      const monthlySubscriptionRevenue = (basicProviders * 1000) + (proProviders * 3000)

      setStats({
        totalClients,
        totalProviders,
        validatedProviders,
        totalRequests,
        pendingRequests,
        acceptedRequests,
        rejectedRequests,
        completedRequests,
        cancelledRequests,
        potentialRevenue,
        monthlySubscriptionRevenue,
        totalCategories,
        basicCategories,
        proCategories
      })

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      // Utiliser des données de test en cas d'erreur
      setStats({
        totalClients: 25,
        totalProviders: 15,
        validatedProviders: 12,
        totalRequests: 45,
        pendingRequests: 8,
        acceptedRequests: 20,
        rejectedRequests: 5,
        completedRequests: 10,
        cancelledRequests: 2,
        potentialRevenue: 450000,
        monthlySubscriptionRevenue: 25000,
        totalCategories: 12,
        basicCategories: 6,
        proCategories: 6
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' FCFA'
  }

  const getRequestsSuccessRate = () => {
    if (stats.totalRequests === 0) return 0
    return Math.round((stats.completedRequests / stats.totalRequests) * 100)
  }

  const getProvidersValidationRate = () => {
    if (stats.totalProviders === 0) return 0
    return Math.round((stats.validatedProviders / stats.totalProviders) * 100)
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <button onClick={onBack} className="back-btn">
          ← Retour
        </button>
        <div className="header-content">
          <h2>📊 Tableau de Bord Admin</h2>
          <button 
            onClick={handleRefresh} 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            disabled={refreshing}
          >
            {refreshing ? '🔄' : '↻'} Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="stats-grid">
        {/* Utilisateurs */}
        <div className="stats-section">
          <h3>👥 Utilisateurs</h3>
          <div className="stats-cards">
            <div className="stat-card primary">
              <div className="stat-icon">👤</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalClients}</div>
                <div className="stat-label">Clients inscrits</div>
              </div>
            </div>
            
            <div className="stat-card secondary">
              <div className="stat-icon">🔧</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalProviders}</div>
                <div className="stat-label">Prestataires inscrits</div>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.validatedProviders}</div>
                <div className="stat-label">Prestataires validés</div>
                <div className="stat-percentage">{getProvidersValidationRate()}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Demandes */}
        <div className="stats-section">
          <h3>📋 Demandes de Services</h3>
          <div className="stats-cards">
            <div className="stat-card info">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalRequests}</div>
                <div className="stat-label">Total demandes</div>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{stats.pendingRequests}</div>
                <div className="stat-label">En attente</div>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.acceptedRequests}</div>
                <div className="stat-label">Acceptées</div>
              </div>
            </div>
            
            <div className="stat-card danger">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-number">{stats.rejectedRequests}</div>
                <div className="stat-label">Refusées</div>
              </div>
            </div>
            
            <div className="stat-card completed">
              <div className="stat-icon">🎉</div>
              <div className="stat-content">
                <div className="stat-number">{stats.completedRequests}</div>
                <div className="stat-label">Terminées</div>
                <div className="stat-percentage">{getRequestsSuccessRate()}% succès</div>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="stats-section">
          <h3>🛍️ Services & Catégories</h3>
          <div className="stats-cards">
            <div className="stat-card info">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalCategories}</div>
                <div className="stat-label">Total catégories</div>
              </div>
            </div>
            
            <div className="stat-card basic">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-number">{stats.basicCategories}</div>
                <div className="stat-label">Catégories Basic</div>
                <div className="stat-note">1000 FCFA/mois</div>
              </div>
            </div>
            
            <div className="stat-card pro">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-number">{stats.proCategories}</div>
                <div className="stat-label">Catégories Pro</div>
                <div className="stat-note">3000 FCFA/mois</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenus */}
        <div className="stats-section">
          <h3>💰 Revenus</h3>
          <div className="stats-cards">
            <div className="stat-card revenue">
              <div className="stat-icon">💳</div>
              <div className="stat-content">
                <div className="stat-number">{formatCurrency(stats.monthlySubscriptionRevenue)}</div>
                <div className="stat-label">Revenus abonnements/mois</div>
                <div className="stat-note">Estimation basée sur les prestataires actifs</div>
              </div>
            </div>
            
            <div className="stat-card potential">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-number">{formatCurrency(stats.potentialRevenue)}</div>
                <div className="stat-label">Revenus potentiels services</div>
                <div className="stat-note">Basé sur les prix des services</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et insights */}
      <div className="insights-section">
        <div className="insight-card">
          <h4>📊 Aperçu des Performances</h4>
          <div className="performance-metrics">
            <div className="metric">
              <span className="metric-label">Taux de validation prestataires:</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill success" 
                  style={{ width: `${getProvidersValidationRate()}%` }}
                ></div>
              </div>
              <span className="metric-value">{getProvidersValidationRate()}%</span>
            </div>
            
            <div className="metric">
              <span className="metric-label">Taux de succès des demandes:</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill primary" 
                  style={{ width: `${getRequestsSuccessRate()}%` }}
                ></div>
              </div>
              <span className="metric-value">{getRequestsSuccessRate()}%</span>
            </div>
            
            <div className="metric">
              <span className="metric-label">Ratio Client/Prestataire:</span>
              <div className="ratio-display">
                <span className="ratio-number">
                  {stats.totalProviders > 0 ? Math.round(stats.totalClients / stats.totalProviders * 10) / 10 : 0}:1
                </span>
              </div>
              <span className="metric-note">clients par prestataire</span>
            </div>
          </div>
        </div>

        <div className="insight-card">
          <h4>🎯 Recommandations</h4>
          <div className="recommendations">
            {stats.pendingRequests > 10 && (
              <div className="recommendation warning">
                <span className="rec-icon">⚠️</span>
                <span>Beaucoup de demandes en attente ({stats.pendingRequests}). Encouragez les prestataires à répondre plus rapidement.</span>
              </div>
            )}
            
            {getProvidersValidationRate() < 80 && (
              <div className="recommendation info">
                <span className="rec-icon">💡</span>
                <span>Taux de validation prestataires faible ({getProvidersValidationRate()}%). Vérifiez les profils en attente.</span>
              </div>
            )}
            
            {stats.totalClients / stats.totalProviders > 5 && (
              <div className="recommendation success">
                <span className="rec-icon">📈</span>
                <span>Excellent ratio client/prestataire ! Continuez à recruter des prestataires de qualité.</span>
              </div>
            )}
            
            {stats.monthlySubscriptionRevenue > 50000 && (
              <div className="recommendation success">
                <span className="rec-icon">💰</span>
                <span>Revenus d'abonnements excellents ! Envisagez d'ajouter de nouvelles catégories de services.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
