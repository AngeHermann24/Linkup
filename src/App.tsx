import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import './components/ProtectedRoute.css'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ClientDashboard from './pages/ClientDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import PlanningPage from './pages/PlanningPage'
import ServicesPage from './pages/ServicesPage'
import StatisticsPage from './pages/StatisticsPage'
import RequestsPage from './pages/RequestsPage'
import ReservationsPage from './pages/ReservationsPage'

import './App.css'

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
              path="/reservations" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ReservationsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Route par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
