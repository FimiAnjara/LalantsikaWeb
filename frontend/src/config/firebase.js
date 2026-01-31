import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

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

export { auth }
