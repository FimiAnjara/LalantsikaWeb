import axios from 'axios'

// URL de base de l'API backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Créer une instance axios avec configuration par défaut
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000, // 30 secondes
})

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
    (config) => {
        // Récupérer le token depuis localStorage ou sessionStorage
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Gérer les erreurs d'authentification
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Token expiré ou invalide
                    console.warn('🔒 Session expirée, redirection vers login...')
                    localStorage.removeItem('auth_token')
                    sessionStorage.removeItem('auth_token')
                    localStorage.removeItem('user')
                    sessionStorage.removeItem('user')
                    
                    // Rediriger vers la page de connexion si pas déjà dessus
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login'
                    }
                    break
                    
                case 403:
                    console.error('⛔ Accès refusé')
                    break
                    
                case 404:
                    console.error('❌ Ressource non trouvée')
                    break
                    
                case 500:
                    console.error('🔥 Erreur serveur')
                    break
                    
                default:
                    console.error('❌ Erreur:', error.response.status)
            }
        } else if (error.request) {
            // La requête a été faite mais pas de réponse
            console.error('📡 Erreur réseau - Pas de réponse du serveur')
        } else {
            console.error('❌ Erreur de configuration:', error.message)
        }
        
        return Promise.reject(error)
    }
)

// Helper pour stocker le token
export const setAuthToken = (token, remember = false) => {
    if (remember) {
        localStorage.setItem('auth_token', token)
    } else {
        sessionStorage.setItem('auth_token', token)
    }
}

// Helper pour stocker l'utilisateur
export const setUser = (user, remember = false) => {
    const userData = JSON.stringify(user)
    if (remember) {
        localStorage.setItem('user', userData)
    } else {
        sessionStorage.setItem('user', userData)
    }
}

// Helper pour récupérer l'utilisateur
export const getUser = () => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
}

// Helper pour récupérer le token
export const getToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
}

// Helper pour vérifier si l'utilisateur est connecté
export const isAuthenticated = () => {
    return !!getToken()
}

// Helper pour déconnexion
export const logout = () => {
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('user')
}

export default api
    