import { useState } from 'react'
import { ENDPOINTS, getAuthHeaders, API_BASE_URL } from '../config/api'

/**
 * Hook personnalisé pour gérer les uploads de photos utilisateur
 */
export const usePhotoUpload = () => {
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState(null)

    /**
     * Uploader une photo utilisateur
     * @param {File} file - Le fichier image à uploader
     * @returns {Promise<{success: boolean, path: string, url: string}>}
     */
    const uploadPhoto = async (file) => {
        if (!file) {
            setUploadError('Aucun fichier sélectionné')
            return null
        }

        try {
            setUploading(true)
            setUploadError(null)

            const formData = new FormData()
            formData.append('photo', file)

            // Récupérer le token correct
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            
            if (!token) {
                throw new Error('Token non trouvé. Veuillez vous reconnecter.')
            }

            const response = await fetch(`${API_BASE_URL}/api/storage/upload/user-photo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData,
            })

            console.log(response);

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || `Erreur ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            return {
                success: true,
                path: data.path,
                url: data.url,
            }

        } catch (error) {
            const message = error.message || 'Erreur lors de l\'upload de la photo'
            setUploadError(message)
            console.error('Upload error:', message)
            return null
        } finally {
            setUploading(false)
        }
    }

    /**
     * Supprimer une photo utilisateur
     * @param {string} filename - Le nom du fichier à supprimer
     * @returns {Promise<boolean>}
     */
    const deletePhoto = async (filename) => {
        if (!filename) return false

        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            
            if (!token) {
                console.error('Token non trouvé')
                return false
            }

            const response = await fetch(`${API_BASE_URL}/api/storage/utilisateur/${filename}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            })

            return response.ok
        } catch (error) {
            console.error('Erreur lors de la suppression de la photo:', error)
            return false
        }
    }

    /**
     * Construire l'URL complète d'une photo
     * @param {string} photoPath - Le chemin de la photo
     * @returns {string} L'URL complète
     */
    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null
        if (photoPath.startsWith('http')) return photoPath
        return `${API_BASE_URL}${photoPath}`
    }

    return {
        uploading,
        uploadError,
        uploadPhoto,
        deletePhoto,
        getPhotoUrl,
    }
}

export default usePhotoUpload
