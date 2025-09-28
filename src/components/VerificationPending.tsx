
import './VerificationPending.css'

interface VerificationPendingProps {
  providerName: string
  submittedAt?: string
  verificationStatus: 'pending' | 'rejected'
  rejectionReason?: string
}

const VerificationPending: React.FC<VerificationPendingProps> = ({
  providerName,
  submittedAt,
  verificationStatus,
  rejectionReason
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'récemment'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (verificationStatus === 'rejected') {
    return (
      <div className="verification-status rejected">
        <div className="status-container">
          <div className="status-icon rejected">❌</div>
          <div className="status-content">
            <h2>Demande rejetée</h2>
            <p className="status-message">
              Bonjour {providerName}, votre demande de vérification a été rejetée.
            </p>
            
            {rejectionReason && (
              <div className="rejection-reason">
                <h4>Raison du rejet :</h4>
                <p>{rejectionReason}</p>
              </div>
            )}

            <div className="next-steps">
              <h4>Que faire maintenant ?</h4>
              <ul>
                <li>📧 Contactez notre support à <strong>support@linkup.cm</strong></li>
                <li>📱 Appelez-nous au <strong>+237 123 456 789</strong></li>
                <li>🔄 Soumettez une nouvelle demande avec les documents corrigés</li>
              </ul>
            </div>

            <div className="action-buttons">
              <button className="contact-btn">
                📧 Contacter le Support
              </button>
              <button className="retry-btn">
                🔄 Nouvelle Demande
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="verification-status pending">
      <div className="status-container">
        <div className="status-icon pending">⏳</div>
        <div className="status-content">
          <h2>Compte en attente de validation</h2>
          <p className="status-message">
            Bonjour {providerName}, votre compte est actuellement en cours de vérification.
          </p>
          
          <div className="verification-info">
            <div className="info-item">
              <span className="info-label">📅 Demande soumise :</span>
              <span className="info-value">{formatDate(submittedAt)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">⏱️ Délai habituel :</span>
              <span className="info-value">24-48 heures</span>
            </div>
            <div className="info-item">
              <span className="info-label">📧 Notification :</span>
              <span className="info-value">Par email une fois validé</span>
            </div>
          </div>

          <div className="verification-steps">
            <h4>Processus de vérification :</h4>
            <div className="steps-list">
              <div className="step completed">
                <div className="step-icon">✅</div>
                <div className="step-text">Documents reçus</div>
              </div>
              <div className="step current">
                <div className="step-icon">🔍</div>
                <div className="step-text">Vérification en cours</div>
              </div>
              <div className="step pending">
                <div className="step-icon">⭐</div>
                <div className="step-text">Validation finale</div>
              </div>
            </div>
          </div>

          <div className="patience-message">
            <div className="patience-icon">🙏</div>
            <p>
              Merci de votre patience ! Notre équipe examine soigneusement chaque demande 
              pour garantir la qualité de notre plateforme.
            </p>
          </div>

          <div className="contact-info">
            <h4>Besoin d'aide ?</h4>
            <div className="contact-methods">
              <div className="contact-method">
                <span className="contact-icon">📧</span>
                <span>support@linkup.cm</span>
              </div>
              <div className="contact-method">
                <span className="contact-icon">📱</span>
                <span>+237 123 456 789</span>
              </div>
              <div className="contact-method">
                <span className="contact-icon">💬</span>
                <span>Chat en ligne (9h-18h)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerificationPending
