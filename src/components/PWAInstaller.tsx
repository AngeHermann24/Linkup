import { useState, useEffect } from 'react'
import './PWAInstaller.css'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches
      
      setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome)
    }

    checkIfInstalled()

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 PWA: Événement beforeinstallprompt détecté')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      
      // Afficher la bannière après 3 secondes
      setTimeout(() => {
        setShowInstallBanner(true)
      }, 3000)
    }

    // Écouter l'installation
    const handleAppInstalled = () => {
      console.log('✅ PWA: Application installée avec succès')
      setIsInstalled(true)
      setIsInstallable(false)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      console.log('🚀 PWA: Déclenchement de l\'installation')
      await deferredPrompt.prompt()
      
      const choiceResult = await deferredPrompt.userChoice
      console.log('👤 PWA: Choix utilisateur:', choiceResult.outcome)
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA: Installation acceptée')
      } else {
        console.log('❌ PWA: Installation refusée')
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
      setShowInstallBanner(false)
    } catch (error) {
      console.error('❌ PWA: Erreur lors de l\'installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
  }

  // Instructions d'installation pour iOS
  const getIOSInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (window.navigator as any).standalone
    
    return isIOS && !isInStandaloneMode
  }

  if (isInstalled) {
    return (
      <div className="pwa-status installed">
        <div className="pwa-status-content">
          <span className="pwa-icon">✅</span>
          <span>Linkup est installé !</span>
        </div>
      </div>
    )
  }

  if (getIOSInstructions()) {
    return (
      <div className="pwa-banner ios-instructions">
        <div className="pwa-banner-content">
          <div className="pwa-banner-text">
            <h3>📱 Installer Linkup</h3>
            <p>
              Appuyez sur <span className="ios-share-icon">⬆️</span> puis 
              <strong> "Ajouter à l'écran d'accueil"</strong>
            </p>
          </div>
          <button onClick={handleDismiss} className="pwa-dismiss">✕</button>
        </div>
      </div>
    )
  }

  if (showInstallBanner && isInstallable) {
    return (
      <div className="pwa-banner">
        <div className="pwa-banner-content">
          <div className="pwa-banner-icon">
            <img src="/icon-72.png" alt="Linkup" />
          </div>
          <div className="pwa-banner-text">
            <h3>Installer Linkup</h3>
            <p>Accédez rapidement à vos services depuis votre écran d'accueil</p>
          </div>
          <div className="pwa-banner-actions">
            <button onClick={handleInstallClick} className="pwa-install-btn">
              Installer
            </button>
            <button onClick={handleDismiss} className="pwa-dismiss">✕</button>
          </div>
        </div>
      </div>
    )
  }

  // Bouton d'installation discret
  if (isInstallable) {
    return (
      <button onClick={handleInstallClick} className="pwa-install-floating">
        <span className="pwa-install-icon">📱</span>
        <span className="pwa-install-text">Installer l'app</span>
      </button>
    )
  }

  return null
}

export default PWAInstaller
