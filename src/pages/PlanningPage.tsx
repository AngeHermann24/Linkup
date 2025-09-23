import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import PlanningReal from '../components/PlanningReal'
import './Dashboard.css'

const PlanningPage = () => {
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <Link to="/dashboard/prestataire" className="dashboard-logo">
            <img src="/Linkup lo.png" alt="Linkup" className="logo-image" />
          </Link>
          
          <nav className="dashboard-menu">
            <Link to="/dashboard/prestataire" className="nav-item">
              🏠 Dashboard
            </Link>
            <Link to="/planning" className="nav-item active">
              📅 Planning
            </Link>
            <Link to="/dashboard/prestataire" className="nav-item">
              💬 Messages
            </Link>
            <Link to="/dashboard/prestataire" className="nav-item">
              📊 Statistiques
            </Link>
          </nav>
          
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">{profile?.full_name || 'Prestataire'}</span>
              <span className="user-role">{profile?.service_category}</span>
            </div>
            <button onClick={handleSignOut} className="sign-out-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <PlanningReal />
      </main>
    </div>
  )
}

export default PlanningPage
