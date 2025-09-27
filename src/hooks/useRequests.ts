import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface ServiceRequest {
  id: string
  client_id: string
  provider_id: string
  service_id?: string
  service_type: string
  title: string
  description?: string
  preferred_date?: string
  preferred_time?: string
  address?: string
  phone?: string
  estimated_price?: number
  price_unit: string
  status: 'pending' | 'accepted' | 'refused' | 'completed' | 'cancelled'
  provider_response?: string
  response_date?: string
  created_at: string
  updated_at: string
  
  // Informations détaillées (de la vue)
  client_name?: string
  client_email?: string
  client_phone_profile?: string
  provider_name?: string
  provider_service?: string
  provider_phone?: string
  service_title?: string
  service_base_price?: number
}

export interface Notification {
  id: string
  user_id: string
  request_id?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
}

export const useRequests = () => {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les demandes selon le rôle
  const loadRequests = async () => {
    if (!user || !profile) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase.from('service_requests_detailed').select('*')

      // Filtrer selon le rôle
      if (profile.role === 'prestataire') {
        query = query.eq('provider_id', user.id)
      } else if (profile.role === 'client') {
        query = query.eq('client_id', user.id)
      }

      const { data, error: requestsError } = await query.order('created_at', { ascending: false })

      if (requestsError) throw requestsError

      setRequests(data || [])
    } catch (err: any) {
      console.error('Erreur lors du chargement des demandes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Charger les notifications
  const loadNotifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications(data || [])
    } catch (err: any) {
      console.error('Erreur lors du chargement des notifications:', err)
    }
  }

  // Créer une nouvelle demande (côté client)
  const createRequest = async (requestData: {
    provider_id: string
    service_id?: string
    service_type: string
    title: string
    description?: string
    preferred_date?: string
    preferred_time?: string
    address?: string
    phone?: string
    estimated_price?: number
  }) => {
    if (!user) throw new Error('Utilisateur non connecté')

    try {
      setLoading(true)
      setError(null)
      
      console.log('Création d\'une demande de service:', requestData)

      // Solution temporaire : insertion directe simple
      const requestToInsert = {
        client_id: user.id,
        provider_id: requestData.provider_id,
        service_type: requestData.service_type || 'basic',
        title: requestData.title || 'Demande de service',
        description: requestData.description,
        preferred_date: requestData.preferred_date,
        preferred_time: requestData.preferred_time,
        address: requestData.address,
        phone: requestData.phone,
        estimated_price: requestData.estimated_price,
        price_unit: 'FCFA',
        status: 'pending'
      }
      
      console.log('Données à insérer:', requestToInsert)
      
      const { data, error } = await supabase
        .from('service_requests')
        .insert(requestToInsert)
        .select()
        .single()

      if (error) {
        console.error('Erreur RPC:', error)
        throw error
      }

      console.log('Demande créée avec succès:', data)
      
      // Recharger les demandes
      await loadRequests()
      
      return data
    } catch (err: any) {
      console.error('Erreur lors de la création de la demande:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Répondre à une demande (côté prestataire)
  const respondToRequest = async (
    requestId: string, 
    status: 'accepted' | 'refused', 
    response?: string
  ) => {
    if (!user) throw new Error('Utilisateur non connecté')

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.rpc('respond_to_request', {
        p_request_id: requestId,
        p_provider_id: user.id,
        p_status: status,
        p_response: response || null
      })

      if (error) throw error

      if (!data) {
        throw new Error('Impossible de traiter cette demande')
      }

      // Recharger les demandes
      await loadRequests()
      await loadNotifications()

      return true
    } catch (err: any) {
      console.error('Erreur lors de la réponse:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Marquer les notifications comme lues
  const markNotificationsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        p_user_id: user.id
      })

      if (error) throw error

      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
    } catch (err: any) {
      console.error('Erreur lors du marquage des notifications:', err)
    }
  }

  // Obtenir le nombre de notifications non lues
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Obtenir les demandes par statut
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const acceptedRequests = requests.filter(r => r.status === 'accepted')
  const completedRequests = requests.filter(r => r.status === 'completed')

  // Charger les données au montage
  useEffect(() => {
    if (user && profile) {
      loadRequests()
      loadNotifications()
    }
  }, [user, profile])

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user) return

    // Écouter les nouvelles demandes
    const requestsSubscription = supabase
      .channel('service_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: profile?.role === 'prestataire' 
            ? `provider_id=eq.${user.id}` 
            : `client_id=eq.${user.id}`
        },
        () => {
          loadRequests()
        }
      )
      .subscribe()

    // Écouter les nouvelles notifications
    const notificationsSubscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      requestsSubscription.unsubscribe()
      notificationsSubscription.unsubscribe()
    }
  }, [user, profile])

  return {
    requests,
    notifications,
    loading,
    error,
    unreadCount,
    pendingRequests,
    acceptedRequests,
    completedRequests,
    createRequest,
    respondToRequest,
    markNotificationsRead,
    refreshRequests: loadRequests,
    refreshNotifications: loadNotifications
  }
}
