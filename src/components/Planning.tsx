import { useState } from 'react'
import { usePlanning } from '../hooks/usePlanning'
import './Planning.css'

const Planning = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const { 
    weekSchedule, 
    loading, 
    error, 
    stats, 
    toggleSlotAvailability, 
    refreshSchedule,
    generateDefaultAvailability 
  } = usePlanning()

  // Gestion des erreurs et chargement
  if (loading) {
    return (
      <div className="planning-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement de votre planning...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="planning-container">
        <div className="error-state">
          <p>Erreur: {error}</p>
          <button onClick={refreshSchedule} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const handleSlotClick = async (dayIndex: number, slotIndex: number) => {
    const day = weekSchedule[dayIndex]
    const slot = day.slots[slotIndex]
    
    if (!slot.booking) {
      await toggleSlotAvailability(day.date, slot.start_time)
    }
  }

  return (
    <div className="planning-container">
      <div className="planning-header">
        <div className="planning-title">
          <h2>📅 Mon Planning</h2>
          <p>Gérez vos disponibilités et rendez-vous</p>
        </div>
        
        <div className="planning-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Semaine
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Mois
            </button>
          </div>
          
          <button className="add-availability-btn">
            + Ajouter disponibilité
          </button>
        </div>
      </div>

      <div className="planning-stats">
        <div className="stat-card available">
          <div className="stat-number">{stats.available}</div>
          <div className="stat-label">Créneaux libres</div>
        </div>
        <div className="stat-card booked">
          <div className="stat-number">{stats.booked}</div>
          <div className="stat-label">Rendez-vous</div>
        </div>
        <div className="stat-card unavailable">
          <div className="stat-number">{stats.unavailable}</div>
          <div className="stat-label">Indisponible</div>
        </div>
        <div className="stat-card total">
          <div className="stat-number">{Math.round((stats.booked / stats.total) * 100)}%</div>
          <div className="stat-label">Taux d'occupation</div>
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="week-view">
          <div className="week-header">
            <h3>Semaine du {weekSchedule[0]?.date} au {weekSchedule[6]?.date}</h3>
          </div>
          
          <div className="week-grid">
            <div className="time-column">
              <div className="time-header">Heure</div>
              {Array.from({ length: 22 }, (_, i) => {
                const hour = Math.floor(8 + i / 2)
                const minute = (i % 2) * 30
                return (
                  <div key={i} className="time-slot-label">
                    {`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
                  </div>
                )
              })}
            </div>
            
            {weekSchedule.map((day, dayIndex) => (
              <div key={day.date} className="day-column">
                <div className="day-header">
                  <div className="day-name">{day.dayName}</div>
                  <div className="day-date">{new Date(day.date).getDate()}</div>
                </div>
                
                <div className="day-slots">
                  {day.slots.map((slot, slotIndex) => (
                    <div
                      key={slot.id}
                      className={`time-slot ${
                        slot.booked ? 'booked' : 
                        slot.available ? 'available' : 'unavailable'
                      }`}
                      onClick={() => toggleSlotAvailability(dayIndex, slotIndex)}
                      title={
                        slot.booked 
                          ? `${slot.booked.clientName} - ${slot.booked.service}`
                          : slot.available 
                            ? 'Disponible - Cliquez pour rendre indisponible'
                            : 'Indisponible - Cliquez pour rendre disponible'
                      }
                    >
                      {slot.booked && (
                        <div className="booking-info">
                          <div className="client-name">{slot.booked.clientName}</div>
                          <div className="service-name">{slot.booked.service}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="planning-actions">
        <div className="legend">
          <h4>Légende :</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color booked"></div>
              <span>Réservé</span>
            </div>
            <div className="legend-item">
              <div className="legend-color unavailable"></div>
              <span>Indisponible</span>
            </div>
          </div>
        </div>
        
        <div className="quick-actions">
          <button className="action-btn">📊 Statistiques détaillées</button>
          <button className="action-btn">📧 Envoyer rappels</button>
          <button className="action-btn">⚙️ Paramètres planning</button>
        </div>
      </div>
    </div>
  )
}

export default Planning
