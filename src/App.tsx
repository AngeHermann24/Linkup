import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ClientDashboard from './pages/ClientDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProviderSettings from './pages/ProviderSettings'

import ProtectedRoute from './components/ProtectedRoute'
import PWAInstaller from './components/PWAInstaller'
import { registerServiceWorker, trackPWAUsage } from './utils/pwa'
import './App.css'
import PlanningPage from './pages/PlanningPage'
import ServicesPage from './pages/ServicesPage'
import StatisticsPage from './pages/StatisticsPage'
import RequestsPage from './pages/RequestsPage'
import ReservationsPage from './pages/ReservationsPage'

// Composant pour rediriger automatiquement les utilisateurs connectés
const AuthRedirect = () => {
  const { user, profile, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }
  
  if (user && profile) {
    if (profile.role === 'client') {
      return <Navigate to="/dashboard/client" replace />
    } else if (profile.role === 'prestataire') {
      return <Navigate to="/dashboard/prestataire" replace />
    }
  }
  
  return <LandingPage />
}

function App() {
  useEffect(() => {
    // Enregistrer le Service Worker
    registerServiceWorker()
    
    // Tracker l'utilisation PWA
    trackPWAUsage()
  }, [])

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Page d'accueil */}
            <Route path="/" element={<AuthRedirect />} />
            
            {/* Authentification */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Dashboards protégés */}
            <Route 
              path="/dashboard/client" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/prestataire" 
              element={
                <ProtectedRoute requiredRole="prestataire">
                  <ProviderDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/planning" 
              element={
                <ProtectedRoute requiredRole="prestataire">
                  <PlanningPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/services" 
              element={
                <ProtectedRoute requiredRole="prestataire">
                  <ServicesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/statistics" 
              element={
                <ProtectedRoute requiredRole="prestataire">
                  <StatisticsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/requests" 
              element={
                <ProtectedRoute requiredRole="prestataire">
                  <RequestsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredRole="prestataire">
                  <ProviderSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reservations" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ReservationsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Panel Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Route par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Composant d'installation PWA */}
          <PWAInstaller />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
