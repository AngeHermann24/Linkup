import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import ClientReservations from '../components/ClientReservations'
import './Dashboard.css'

const ReservationsPage = () => {
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <Link to="/dashboard/client" className="dashboard-logo">
            <img src="/Linkup lo.png" alt="Linkup" className="logo-image" />
          </Link>
          
          <nav className="dashboard-menu">
            <Link to="/dashboard/client" className="nav-item">
              🏠 Accueil
            </Link>
            <button 
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="nav-item nav-button"
            >
              🔍 Services
            </button>
            <Link to="/reservations" className="nav-item active">
              📅 Mes Réservations
            </Link>
          </nav>
          
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">{profile?.full_name || 'Client'}</span>
              <span className="user-role">Client</span>
            </div>
            <button onClick={handleSignOut} className="sign-out-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <ClientReservations />
      </main>
    </div>
  )
}

export default ReservationsPage
