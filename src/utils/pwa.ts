// Utilitaires PWA pour Linkup

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔧 PWA: Enregistrement du Service Worker...')
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('✅ PWA: Service Worker enregistré:', registration.scope)
      
      // Écouter les mises à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        if (newWorker) {
          console.log('🔄 PWA: Nouvelle version détectée')
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 PWA: Nouvelle version prête')
              
              // Notifier l'utilisateur qu'une mise à jour est disponible
              if (confirm('Une nouvelle version de Linkup est disponible. Voulez-vous la charger ?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                window.location.reload()
              }
            }
          })
        }
      })
      
      // Écouter les changements de contrôleur
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 PWA: Nouveau Service Worker actif')
        window.location.reload()
      })
      
    } catch (error) {
      console.error('❌ PWA: Erreur enregistrement Service Worker:', error)
    }
  } else {
    console.warn('⚠️ PWA: Service Workers non supportés')
  }
}

export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      
      for (const registration of registrations) {
        await registration.unregister()
        console.log('🗑️ PWA: Service Worker désenregistré')
      }
    } catch (error) {
      console.error('❌ PWA: Erreur désenregistrement:', error)
    }
  }
}

export const checkForUpdates = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      
      if (registration) {
        await registration.update()
        console.log('🔍 PWA: Vérification des mises à jour...')
      }
    } catch (error) {
      console.error('❌ PWA: Erreur vérification mises à jour:', error)
    }
  }
}

export const isPWAInstalled = (): boolean => {
  // Vérifier si l'app est en mode standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  
  // Vérifier pour iOS
  const isInWebAppiOS = (window.navigator as any).standalone === true
  
  // Vérifier pour Chrome/Edge
  const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches
  
  return isStandalone || isInWebAppiOS || isInWebAppChrome
}

// Gestionnaire d'installation PWA
let deferredPrompt: any = null

export const initPWAInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🚀 PWA: Installation disponible')
    // Empêcher l'affichage automatique
    e.preventDefault()
    // Stocker l'événement pour l'utiliser plus tard
    deferredPrompt = e
    
    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('pwa-installable'))
  })
  
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA: Application installée avec succès')
    deferredPrompt = null
    
    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('pwa-installed'))
  })
}

export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('❌ PWA: Aucune installation disponible')
    return false
  }
  
  try {
    // Afficher le prompt d'installation
    deferredPrompt.prompt()
    
    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`🎯 PWA: Choix utilisateur: ${outcome}`)
    
    // Nettoyer la référence
    deferredPrompt = null
    
    return outcome === 'accepted'
  } catch (error) {
    console.error('❌ PWA: Erreur installation:', error)
    return false
  }
}

export const isPWAInstallable = (): boolean => {
  return deferredPrompt !== null
}

export const getPWADisplayMode = (): string => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone'
  }
  
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui'
  }
  
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen'
  }
  
  return 'browser'
}

export const addToHomeScreenPrompt = (): Promise<boolean> => {
  return new Promise((resolve) => {
    let deferredPrompt: any = null
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
      
      // Déclencher immédiatement l'installation
      if (deferredPrompt) {
        deferredPrompt.prompt()
        
        deferredPrompt.userChoice.then((choiceResult: any) => {
          resolve(choiceResult.outcome === 'accepted')
          deferredPrompt = null
        })
      }
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { once: true })
    
    // Timeout après 5 secondes
    setTimeout(() => {
      resolve(false)
    }, 5000)
  })
}

// Analytics PWA
export const trackPWAInstall = (): void => {
  console.log('📊 PWA: Installation trackée')
  
  // Ici vous pouvez ajouter votre code d'analytics
  // Par exemple : gtag('event', 'pwa_install', { event_category: 'PWA' })
}

export const trackPWAUsage = (): void => {
  const displayMode = getPWADisplayMode()
  console.log('📊 PWA: Mode d\'affichage:', displayMode)
  
  // Tracker l'utilisation en mode PWA
  if (displayMode === 'standalone') {
    console.log('📱 PWA: Utilisé en mode app')
    // gtag('event', 'pwa_usage', { event_category: 'PWA', mode: 'standalone' })
  }
}
