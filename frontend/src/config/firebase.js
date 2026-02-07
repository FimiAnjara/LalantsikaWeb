import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL, deleteObject } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'

// Configuration Firebase - À remplacer par vos valeurs
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDyiDpodbZ2yPLNFnERQAt-oXGs1-RZq4M",
    authDomain: "lalantsika-project.firebaseapp.com",
    databaseURL: "https://lalantsika-project-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "lalantsika-project",
    storageBucket: "lalantsika-project.firebasestorage.app",
    messagingSenderId: "681061277527",
    appId: "1:681061277527:web:ef6250570defc155512812",
    measurementId: "G-MP6R0PCT51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const storage = getStorage(app)
const db = getFirestore(app)

/**
 * Authentifier avec email e  t mot de passe
 * @returns {Promise<{success: boolean, idToken?: string, error?: string}>}
 */
export async function firebaseSignIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const idToken = await userCredential.user.getIdToken()

        return {
            success: true,
            idToken: idToken,
            uid: userCredential.user.uid,
            email: userCredential.user.email,
        }
    } catch (error) {
        console.error('Firebase auth error:', error)

        let errorMessage = 'Erreur d\'authentification'
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Email invalide'
                break
            case 'auth/user-disabled':
                errorMessage = 'Compte désactivé'
                break
            case 'auth/user-not-found':
                errorMessage = 'Utilisateur non trouvé'
                break
            case 'auth/wrong-password':
                errorMessage = 'Mot de passe incorrect'
                break
            case 'auth/invalid-credential':
                errorMessage = 'Email ou mot de passe incorrect'
                break
            case 'auth/too-many-requests':
                errorMessage = 'Trop de tentatives. Réessayez plus tard.'
                break
        }

        return {
            success: false,
            error: errorMessage,
        }
    }
}

/**
 * Upload une image en Base64 vers Firebase Storage
 * @param {string} base64Data - Données de l'image en base64 (avec ou sans préfixe data:image/...)
 * @param {string} folder - Dossier de destination (ex: 'signalements', 'profiles')
 * @param {string} filename - Nom du fichier (optionnel, généré automatiquement si non fourni)
 * @returns {Promise<string>} URL publique de l'image uploadée
 */
export async function uploadBase64Image(base64Data, folder = 'signalements', filename = null) {
    try {
        const user = auth.currentUser
        if (!user) {
            throw new Error('Utilisateur non connecté')
        }

        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const finalFilename = filename || `${user.uid}_${timestamp}_${randomId}`

        // Déterminer le format de l'image
        let format = 'jpeg'
        let pureBase64 = base64Data

        if (base64Data.startsWith('data:image/')) {
            const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
            if (matches) {
                format = matches[1]
                pureBase64 = matches[2]
            }
        }

        const storageRef = ref(storage, `${folder}/${finalFilename}.${format}`)
        console.log('📤 Upload vers Firebase Storage:', `${folder}/${finalFilename}.${format}`)

        const snapshot = await uploadString(storageRef, pureBase64, 'base64', {
            contentType: `image/${format}`
        })

        const downloadURL = await getDownloadURL(snapshot.ref)
        console.log('🔗 URL publique:', downloadURL)

        return downloadURL
    } catch (error) {
        console.error('❌ Erreur lors de l\'upload:', error)
        throw error
    }
}

/**
 * Upload un fichier vers Firebase Storage
 * @param {File} file - Fichier à uploader
 * @param {string} folder - Dossier de destination
 * @param {string} filename - Nom du fichier (optionnel)
 * @returns {Promise<string>} URL publique de l'image uploadée
 */
export async function uploadFile(file, folder = 'signalements', filename = null) {
    try {
        const user = auth.currentUser
        if (!user) {
            throw new Error('Utilisateur non connecté')
        }

        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const extension = file.name?.split('.').pop() || 'jpg'
        const finalFilename = filename || `${user.uid}_${timestamp}_${randomId}`

        const storageRef = ref(storage, `${folder}/${finalFilename}.${extension}`)
        console.log('📤 Upload fichier vers Firebase Storage:', `${folder}/${finalFilename}.${extension}`)

        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type || 'image/jpeg'
        })

        const downloadURL = await getDownloadURL(snapshot.ref)
        console.log('🔗 URL publique:', downloadURL)

        return downloadURL
    } catch (error) {
        console.error('❌ Erreur lors de l\'upload:', error)
        throw error
    }
}

/**
 * Supprimer une image de Firebase Storage
 * @param {string} imageUrl - URL de l'image à supprimer
 */
export async function deleteImage(imageUrl) {
    try {
        const urlPath = decodeURIComponent(imageUrl.split('/o/')[1]?.split('?')[0] || '')
        if (!urlPath) {
            console.warn('⚠️ Impossible d\'extraire le chemin de l\'image:', imageUrl)
            return
        }

        const storageRef = ref(storage, urlPath)
        await deleteObject(storageRef)
        console.log('🗑️ Image supprimée:', urlPath)
    } catch (error) {
        if (error.code === 'storage/object-not-found') {
            console.log('⚠️ Image déjà supprimée ou inexistante')
            return
        }
        console.error('❌ Erreur lors de la suppression:', error)
        throw error
    }
}

/**
 * Vérifie si une chaîne est une URL
 */
export function isUrl(str) {
    return str?.startsWith('http://') || str?.startsWith('https://')
}

/**
 * Vérifie si une chaîne est du base64
 */
export function isBase64(str) {
    return str?.startsWith('data:image/')
}

/**
 * Convertit une image en URL si c'est du base64
 */
export async function ensureImageUrl(imageData, folder = 'signalements') {
    if (!imageData) return null
    if (isUrl(imageData)) return imageData
    if (isBase64(imageData)) return await uploadBase64Image(imageData, folder)
    return imageData
}

export { auth, storage, db }
