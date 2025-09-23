import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './Statistics.css'

interface StatisticsData {
  totalBookings: number
  completedBookings: number
  pendingBookings: number
  cancelledBookings: number
  totalRevenue: number
  averageRating: number
  totalAvailableSlots: number
  occupancyRate: number
  monthlyBookings: { month: string; count: number }[]
  recentBookings: any[]
  topServices: { service: string; count: number }[]
}

const Statistics = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<StatisticsData>({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalAvailableSlots: 0,
    occupancyRate: 0,
    monthlyBookings: [],
    recentBookings: [],
    topServices: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    if (user) {
      loadStatistics()
    }
  }, [user, selectedPeriod])

  const loadStatistics = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Calculer les dates selon la période sélectionnée
      const now = new Date()
      let startDate: Date

      switch (selectedPeriod) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      // Récupérer les réservations
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', user.id)
        .gte('created_at', startDate.toISOString())

      if (bookingsError) throw bookingsError

      // Récupérer les disponibilités
      const { data: availability, error: availabilityError } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])

      if (availabilityError) throw availabilityError

      // Calculer les statistiques
      const totalBookings = bookings?.length || 0
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0
      const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0
      
      const totalRevenue = bookings
        ?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.price || 0), 0) || 0

      const totalAvailableSlots = availability?.length || 0
      const occupancyRate = totalAvailableSlots > 0 ? (totalBookings / totalAvailableSlots) * 100 : 0

      // Statistiques mensuelles
      const monthlyBookings = generateMonthlyStats(bookings || [])

      // Services les plus demandés
      const serviceStats = (bookings || []).reduce((acc: any, booking) => {
        const service = booking.service_type || 'Service'
        acc[service] = (acc[service] || 0) + 1
        return acc
      }, {})

      const topServices = Object.entries(serviceStats)
        .map(([service, count]) => ({ service, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Réservations récentes
      const recentBookings = (bookings || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      setStats({
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue,
        averageRating: 4.5, // Simulé pour l'instant
        totalAvailableSlots,
        occupancyRate,
        monthlyBookings,
        recentBookings,
        topServices
      })

    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyStats = (bookings: any[]) => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const monthlyData = new Array(12).fill(0)

    bookings.forEach(booking => {
      const month = new Date(booking.created_at).getMonth()
      monthlyData[month]++
    })

    return months.map((month, index) => ({
      month,
      count: monthlyData[index]
    }))
  }

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="statistics-container">
        <div className="error-state">
          <p>Erreur: {error}</p>
          <button onClick={loadStatistics} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <div className="statistics-title">
          <h2>📊 Mes Statistiques</h2>
          <p>Analysez vos performances et votre activité</p>
        </div>
        
        <div className="period-selector">
          <button 
            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            7 jours
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            Ce mois
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('year')}
          >
            Cette année
          </button>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.totalBookings}</h3>
            <p>Réservations totales</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedBookings}</h3>
            <p>Services terminés</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingBookings}</h3>
            <p>En attente</p>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{stats.totalRevenue.toLocaleString()} FCFA</h3>
            <p>Revenus générés</p>
          </div>
        </div>

        <div className="stat-card rating">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.averageRating}/5</h3>
            <p>Note moyenne</p>
          </div>
        </div>

        <div className="stat-card occupancy">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.occupancyRate.toFixed(1)}%</h3>
            <p>Taux d'occupation</p>
          </div>
        </div>
      </div>

      {/* Graphique mensuel */}
      <div className="chart-section">
        <h3>📈 Évolution des réservations</h3>
        <div className="monthly-chart">
          {stats.monthlyBookings.map((month, index) => (
            <div key={index} className="chart-bar">
              <div 
                className="bar" 
                style={{ 
                  height: `${Math.max(month.count * 10, 5)}px`,
                  backgroundColor: month.count > 0 ? '#3b82f6' : '#e5e7eb'
                }}
              ></div>
              <span className="bar-label">{month.month}</span>
              <span className="bar-value">{month.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-section">
        {/* Services les plus demandés */}
        <div className="top-services">
          <h3>🏆 Services les plus demandés</h3>
          {stats.topServices.length > 0 ? (
            <div className="services-list">
              {stats.topServices.map((service, index) => (
                <div key={index} className="service-item">
                  <span className="service-rank">#{index + 1}</span>
                  <span className="service-name">{service.service}</span>
                  <span className="service-count">{service.count} réservations</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Aucune donnée disponible</p>
          )}
        </div>

        {/* Réservations récentes */}
        <div className="recent-bookings">
          <h3>🕒 Réservations récentes</h3>
          {stats.recentBookings.length > 0 ? (
            <div className="bookings-list">
              {stats.recentBookings.map((booking, index) => (
                <div key={index} className="booking-item">
                  <div className="booking-info">
                    <span className="booking-service">{booking.service_type}</span>
                    <span className="booking-date">
                      {new Date(booking.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <span className={`booking-status ${booking.status}`}>
                    {booking.status === 'completed' && '✅ Terminé'}
                    {booking.status === 'pending' && '⏳ En attente'}
                    {booking.status === 'confirmed' && '✔️ Confirmé'}
                    {booking.status === 'cancelled' && '❌ Annulé'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Aucune réservation récente</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Statistics
