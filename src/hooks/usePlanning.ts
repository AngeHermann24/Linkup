import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface TimeSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  booking?: {
    id: string
    client_name: string
    service_type: string
    client_phone: string
    status: string
  }
}

export interface DaySchedule {
  date: string
  dayName: string
  slots: TimeSlot[]
}

export interface PlanningStats {
  total: number
  available: number
  booked: number
  unavailable: number
}

export const usePlanning = () => {
  const { user } = useAuth()
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Générer les dates de la semaine courante
  const getWeekDates = (): string[] => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1))
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDates.push(date.toISOString().split('T')[0])
    }
    return weekDates
  }

  // Charger les données du planning depuis Supabase
  const loadWeekSchedule = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const weekDates = getWeekDates()
      const startDate = weekDates[0]
      const endDate = weekDates[6]

      // Récupérer directement depuis provider_availability au lieu de la vue
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
        .order('start_time')

      if (availabilityError) {
        console.error('Erreur Supabase:', availabilityError)
        throw availabilityError
      }

      console.log('Données récupérées:', availabilityData)

      // Organiser les données par jour
      const weekScheduleData: DaySchedule[] = weekDates.map(dateStr => {
        const date = new Date(dateStr)
        const daySlots = availabilityData?.filter((slot: any) => slot.date === dateStr) || []
        
        return {
          date: dateStr,
          dayName: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
          slots: daySlots.map((slot: any) => ({
            id: `${slot.provider_id}-${slot.date}-${slot.start_time}`,
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
            booking: undefined // Pas de réservations pour l'instant
          }))
        }
      })

      setWeekSchedule(weekScheduleData)
    } catch (err) {
      console.error('Erreur lors du chargement du planning:', err)
      setError('Erreur lors du chargement du planning')
    } finally {
      setLoading(false)
    }
  }

  // Générer les disponibilités par défaut pour la semaine
  const generateDefaultAvailability = async () => {
    if (!user) return

    try {
      setLoading(true)
      const weekDates = getWeekDates()
      
      // Générer des créneaux de 30 minutes de 8h à 18h pour chaque jour
      const availabilitySlots = []
      
      for (const dateStr of weekDates) {
        for (let hour = 8; hour < 18; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
            const endHour = minute === 30 ? hour + 1 : hour
            const endMinute = minute === 30 ? 0 : 30
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`
            
            availabilitySlots.push({
              provider_id: user.id,
              date: dateStr,
              start_time: startTime,
              end_time: endTime,
              is_available: true
            })
          }
        }
      }

      // Insérer les créneaux par petits lots pour éviter les timeouts
      const batchSize = 50
      for (let i = 0; i < availabilitySlots.length; i += batchSize) {
        const batch = availabilitySlots.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('provider_availability')
          .insert(batch)
          .select()

        if (error && !error.message.includes('duplicate')) {
          throw error
        }
      }

      // Recharger les données
      await loadWeekSchedule()
    } catch (err) {
      console.error('Erreur lors de la génération des disponibilités:', err)
      setError('Erreur lors de la génération des disponibilités')
    } finally {
      setLoading(false)
    }
  }

  // Basculer la disponibilité d'un créneau
  const toggleSlotAvailability = async (date: string, startTime: string) => {
    if (!user) return

    try {
      // Trouver le créneau actuel
      const currentSlot = weekSchedule
        .find(day => day.date === date)
        ?.slots.find(slot => slot.start_time === startTime)

      if (!currentSlot || currentSlot.booking) {
        return // Ne pas modifier si le créneau est réservé
      }

      // Mettre à jour dans Supabase
      const { error } = await supabase
        .from('provider_availability')
        .update({ is_available: !currentSlot.is_available })
        .eq('provider_id', user.id)
        .eq('date', date)
        .eq('start_time', startTime)

      if (error) {
        throw error
      }

      // Recharger les données
      await loadWeekSchedule()
    } catch (err) {
      console.error('Erreur lors de la mise à jour du créneau:', err)
      setError('Erreur lors de la mise à jour du créneau')
    }
  }

  // Calculer les statistiques
  const getStats = (): PlanningStats => {
    const allSlots = weekSchedule.flatMap(day => day.slots)
    return {
      total: allSlots.length,
      available: allSlots.filter(slot => slot.is_available && !slot.booking).length,
      booked: allSlots.filter(slot => slot.booking).length,
      unavailable: allSlots.filter(slot => !slot.is_available && !slot.booking).length
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    if (user) {
      loadWeekSchedule()
    }
  }, [user])

  // Générer les disponibilités par défaut si aucune donnée n'existe
  useEffect(() => {
    if (!loading && weekSchedule.every(day => day.slots.length === 0)) {
      generateDefaultAvailability()
    }
  }, [loading, weekSchedule])

  return {
    weekSchedule,
    loading,
    error,
    stats: getStats(),
    toggleSlotAvailability,
    refreshSchedule: loadWeekSchedule,
    generateDefaultAvailability
  }
}
