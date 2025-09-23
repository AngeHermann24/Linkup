import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SimpleAuth from './components/SimpleAuth'

// Dashboards simplifiés
const SimpleDashboard = ({ type }: { type: 'client' | 'prestataire' }) => (
  <div style={{ 
    minHeight: '100vh', 
    padding: '2rem',
    background: '#f8fafc'
  }}>
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        🎉 Dashboard {type === 'client' ? 'Client' : 'Prestataire'}
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Bienvenue ! L'authentification fonctionne correctement.
      </p>
      
      {type === 'prestataire' && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '12px',
            cursor: 'pointer'
          }}>
            📅 Planning
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '12px',
            cursor: 'pointer'
          }}>
            🛠️ Mes Services
          </div>
        </div>
      )}
      
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Déconnexion
      </button>
    </div>
  </div>
)

function AppSimple() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SimpleAuth />} />
          <Route path="/login" element={<SimpleAuth />} />
          <Route path="/dashboard/client" element={<SimpleDashboard type="client" />} />
          <Route path="/dashboard/prestataire" element={<SimpleDashboard type="prestataire" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default AppSimple
