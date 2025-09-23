import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface ServiceImage {
  id: string
  image_url: string
  image_name: string
  is_primary: boolean
  alt_text?: string
}

export interface ServicePricing {
  id: string
  pricing_name: string
  price: number
  duration_minutes?: number
  description?: string
  is_active: boolean
}

export interface ProviderService {
  id: string
  provider_id: string
  service_name: string
  service_type: 'basique' | 'pro'
  title: string
  description?: string
  short_description?: string
  base_price?: number
  price_unit: string
  price_type: 'fixe' | 'horaire' | 'forfait'
  duration_minutes?: number
  is_active: boolean
  images: ServiceImage[]
  primary_image_url?: string
  created_at: string
  updated_at: string
}

export const useServices = () => {
  const { user, profile } = useAuth()
  const [service, setService] = useState<ProviderService | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Charger le service du prestataire
  const loadService = async () => {
    if (!user || !profile) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Récupérer le service avec ses images
      const { data: serviceData, error: serviceError } = await supabase
        .from('provider_services_with_images')
        .select('*')
        .eq('provider_id', user.id)
        .single()

      if (serviceError && serviceError.code !== 'PGRST116') {
        throw serviceError
      }

      if (!serviceData) {
        // Aucun service trouvé, initialiser avec les données du profil
        if (profile.service_category && profile.service_type) {
          await initializeService()
          return
        }
      }

      setService(serviceData)
    } catch (err: any) {
      console.error('Erreur lors du chargement du service:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initialiser le service basé sur le profil
  const initializeService = async () => {
    if (!user || !profile?.service_category || !profile?.service_type) return

    try {
      const { error } = await supabase.rpc('initialize_provider_service', {
        p_provider_id: user.id,
        p_service_name: profile.service_category,
        p_service_type: profile.service_type
      })

      if (error) throw error

      // Recharger le service
      await loadService()
    } catch (err: any) {
      console.error('Erreur lors de l\'initialisation du service:', err)
      setError(err.message)
    }
  }

  // Mettre à jour le service
  const updateService = async (updates: Partial<ProviderService>) => {
    if (!service) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('provider_services')
        .update(updates)
        .eq('id', service.id)
        .select()
        .single()

      if (error) throw error

      setService(prev => prev ? { ...prev, ...data } : null)
      return data
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du service:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Uploader une image
  const uploadImage = async (file: File, isPrimary: boolean = false) => {
    if (!service || !user) return

    try {
      setUploading(true)
      setError(null)

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName)

      // Si c'est l'image principale, désactiver les autres images principales
      if (isPrimary) {
        await supabase
          .from('service_images')
          .update({ is_primary: false })
          .eq('service_id', service.id)
      }

      // Enregistrer l'image en base
      const { data: imageData, error: imageError } = await supabase
        .from('service_images')
        .insert({
          service_id: service.id,
          image_url: urlData.publicUrl,
          image_name: file.name,
          image_size: file.size,
          is_primary: isPrimary,
          alt_text: `Image du service ${service.title}`
        })
        .select()
        .single()

      if (imageError) throw imageError

      // Recharger le service pour mettre à jour les images
      await loadService()

      return imageData
    } catch (err: any) {
      console.error('Erreur lors de l\'upload:', err)
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  // Supprimer une image
  const deleteImage = async (imageId: string, imagePath: string) => {
    if (!service) return

    try {
      setLoading(true)
      setError(null)

      // Supprimer de Supabase Storage
      const fileName = imagePath.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('service-images')
          .remove([`${user?.id}/${fileName}`])
      }

      // Supprimer de la base de données
      const { error } = await supabase
        .from('service_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      // Recharger le service
      await loadService()
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Définir une image comme principale
  const setPrimaryImage = async (imageId: string) => {
    if (!service) return

    try {
      setLoading(true)
      setError(null)

      // Désactiver toutes les images principales
      await supabase
        .from('service_images')
        .update({ is_primary: false })
        .eq('service_id', service.id)

      // Activer l'image sélectionnée comme principale
      const { error } = await supabase
        .from('service_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      if (error) throw error

      // Recharger le service
      await loadService()
    } catch (err: any) {
      console.error('Erreur lors de la définition de l\'image principale:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Charger le service au montage
  useEffect(() => {
    if (user && profile) {
      loadService()
    }
  }, [user, profile])

  return {
    service,
    loading,
    error,
    uploading,
    updateService,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    refreshService: loadService,
    initializeService
  }
}
