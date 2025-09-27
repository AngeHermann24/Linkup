import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'client' | 'prestataire'
  service_category?: string
  created_at: string
  updated_at: string
}

export interface AdminStats {
  totalUsers: number
  totalClients: number
  totalProviders: number
  newUsersThisMonth: number
  activeUsers: number
}

export const useAdmin = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalClients: 0,
    totalProviders: 0,
    newUsersThisMonth: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
      calculateStats(data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err)
      setError('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  // Calculer les statistiques
  const calculateStats = (userData: AdminUser[]) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalUsers = userData.length
    const totalClients = userData.filter(u => u.role === 'client').length
    const totalProviders = userData.filter(u => u.role === 'prestataire').length
    const newUsersThisMonth = userData.filter(u => 
      new Date(u.created_at) >= startOfMonth
    ).length

    setStats({
      totalUsers,
      totalClients,
      totalProviders,
      newUsersThisMonth,
      activeUsers: totalUsers // Pour l'instant, on considère tous les utilisateurs comme actifs
    })
  }

  // Rechercher des utilisateurs
  const searchUsers = (searchTerm: string, role?: 'client' | 'prestataire') => {
    let filtered = users

    if (role) {
      filtered = filtered.filter(u => u.role === role)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term) ||
        u.phone?.includes(term)
      )
    }

    return filtered
  }

  // Mettre à jour un utilisateur
  const updateUser = async (userId: string, updates: Partial<AdminUser>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      // Mettre à jour localement
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, ...updates } : u
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err)
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }
  }

  // Supprimer un utilisateur
  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // Mettre à jour localement
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId))
      
      return { success: true }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      return { success: false, error: 'Erreur lors de la suppression' }
    }
  }

  // Suspendre/Activer un utilisateur (pour plus tard)
  const toggleUserStatus = async (userId: string, suspended: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended })
        .eq('id', userId)

      if (error) throw error

      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, suspended } : u
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err)
      return { success: false, error: 'Erreur lors du changement de statut' }
    }
  }

  // Charger les données au montage
  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    stats,
    loading,
    error,
    fetchUsers,
    searchUsers,
    updateUser,
    deleteUser,
    toggleUserStatus
  }
}
