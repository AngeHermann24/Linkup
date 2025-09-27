import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import AdminRequests from '../components/AdminRequests'
import AdminServices from '../components/AdminServices'
import AdminDashboardStats from '../components/AdminDashboard'
import './AdminDashboard.css'

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'client' | 'prestataire'
  service_category?: string
  created_at: string
  updated_at: string
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'prestataire'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentSection, setCurrentSection] = useState<'dashboard' | 'users' | 'requests' | 'services'>('dashboard')

  // Vérifier si l'utilisateur est admin (temporairement désactivé pour test)
  useEffect(() => {
    // if (!user || user.email !== 'angeherboua@gmail.com') {
    //   navigate('/login')
    // }
  }, [user, navigate])

  // Charger les utilisateurs
  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtrer les utilisateurs
  useEffect(() => {
    let filtered = users

    // Filtrer par rôle
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole)
    }

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterRole])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.filter(u => u.id !== userId))
      alert('Utilisateur supprimé avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleUpdateUser = async (updatedUser: Partial<User>) => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedUser)
        .eq('id', selectedUser.id)

      if (error) throw error

      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, ...updatedUser } : u
      ))
      setShowEditModal(false)
      setSelectedUser(null)
      alert('Utilisateur mis à jour avec succès')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement du panel d'administration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-nav">
          <div className="admin-logo">
            <img src="/Linkup lo.png" alt="Linkup" className="logo-image" />
            <span className="admin-title">Panel Admin</span>
          </div>
          <div className="admin-navigation">
            <button
              className={`nav-btn ${currentSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentSection('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-btn ${currentSection === 'users' ? 'active' : ''}`}
              onClick={() => setCurrentSection('users')}
            >
              👥 Utilisateurs
            </button>
            <button
              className={`nav-btn ${currentSection === 'requests' ? 'active' : ''}`}
              onClick={() => setCurrentSection('requests')}
            >
              📋 Demandes
            </button>
            <button
              className={`nav-btn ${currentSection === 'services' ? 'active' : ''}`}
              onClick={() => setCurrentSection('services')}
            >
              🛍️ Services
            </button>
          </div>
          <div className="admin-user">
            <span className="admin-name">Admin</span>
            <button onClick={signOut} className="sign-out-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-content">
        {currentSection === 'dashboard' ? (
          <AdminDashboardStats onBack={() => setCurrentSection('users')} />
        ) : currentSection === 'requests' ? (
          <AdminRequests onBack={() => setCurrentSection('users')} />
        ) : currentSection === 'services' ? (
          <AdminServices onBack={() => setCurrentSection('users')} />
        ) : (
        <div className="admin-container">
          <h1 className="page-title">Gestion des Utilisateurs</h1>

          {/* Filtres et Recherche */}
          <div className="admin-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Rechercher par email, nom ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterRole === 'all' ? 'active' : ''}`}
                onClick={() => setFilterRole('all')}
              >
                Tous ({users.length})
              </button>
              <button
                className={`filter-tab ${filterRole === 'client' ? 'active' : ''}`}
                onClick={() => setFilterRole('client')}
              >
                Clients ({users.filter(u => u.role === 'client').length})
              </button>
              <button
                className={`filter-tab ${filterRole === 'prestataire' ? 'active' : ''}`}
                onClick={() => setFilterRole('prestataire')}
              >
                Prestataires ({users.filter(u => u.role === 'prestataire').length})
              </button>
            </div>
          </div>

          {/* Liste des Utilisateurs */}
          <div className="users-grid">
            {filteredUsers.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <div className="user-info">
                    <h3 className="user-name">{user.full_name || 'Nom non défini'}</h3>
                    <span className={`user-role ${user.role}`}>
                      {user.role === 'client' ? '👤 Client' : '🔧 Prestataire'}
                    </span>
                  </div>
                  <div className="user-actions">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="edit-btn"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="delete-btn"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="user-details">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Téléphone:</strong> {user.phone || 'Non défini'}</p>
                  {user.service_category && (
                    <p><strong>Catégorie:</strong> {user.service_category}</p>
                  )}
                  <p><strong>Inscrit le:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="empty-state">
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
        )}
      </main>

      {/* Modal d'édition */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onUpdate={handleUpdateUser}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

// Modal d'édition
const EditUserModal = ({ user, onUpdate, onClose }: {
  user: User
  onUpdate: (user: Partial<User>) => void
  onClose: () => void
}) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    role: user.role,
    service_category: user.service_category || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Modifier l'utilisateur</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Téléphone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Rôle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as 'client' | 'prestataire'})}
            >
              <option value="client">Client</option>
              <option value="prestataire">Prestataire</option>
            </select>
          </div>
          {formData.role === 'prestataire' && (
            <div className="form-group">
              <label>Catégorie de service</label>
              <input
                type="text"
                value={formData.service_category}
                onChange={(e) => setFormData({...formData, service_category: e.target.value})}
              />
            </div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Annuler
            </button>
            <button type="submit" className="save-btn">
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminDashboard
