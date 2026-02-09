/**
 * Service Firestore pour les signalements - Côté Visiteur
 * Lit directement depuis la collection Firestore 'signalements'
 * comme le fait l'application mobile, sans passer par le backend.
 */
import { collection, getDocs, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db } from '../../config/firebase'

const COLLECTION_NAME = 'signalements'
const HISTORY_COLLECTION = 'histo_statuts'

/**
 * Récupérer tous les signalements depuis Firestore (lecture unique)
 * @returns {Promise<Array>} Liste des signalements transformés pour l'affichage
 */
export async function getAllSignalements() {
    const colRef = collection(db, COLLECTION_NAME)
    const q = query(colRef, orderBy('daty', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => transformSignalement(doc))
}

/**
 * Récupérer l'historique d'un signalement
 * @param {string} signalementId - ID Firestore du signalement
 * @returns {Promise<Array>} Liste de l'historique des statuts
 */
export async function getSignalementHistory(signalementId) {
    try {
        const colRef = collection(db, HISTORY_COLLECTION)
        const q = query(
            colRef, 
            where('firebase_signalement_id', '==', signalementId),
            orderBy('daty', 'asc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().daty ? new Date(doc.data().daty).toLocaleDateString('fr-FR') : 'N/A'
        }))
    } catch (error) {
        console.error('Error fetching history:', error)
        return []
    }
}

/**
 * S'abonner aux signalements en temps réel via Firestore onSnapshot
 * @param {Function} onData - callback appelé avec la liste des signalements
 * @param {Function} onError - callback appelé en cas d'erreur
 * @returns {Function} unsubscribe - fonction pour se désabonner
 */
export function subscribeToSignalements(onData, onError) {
    const colRef = collection(db, COLLECTION_NAME)
    const q = query(colRef, orderBy('daty', 'desc'))

    return onSnapshot(q, (snapshot) => {
        const signalements = snapshot.docs.map(doc => transformSignalement(doc))
        onData(signalements)
    }, (err) => {
        console.error('Firestore onSnapshot error:', err)
        if (onError) onError(err)
    })
}

/**
 * Transformer un document Firestore en objet utilisable par les composants visiteur
 * Structure alignée sur celle attendue par Signalement.jsx et Recap.jsx
 */
function transformSignalement(doc) {
    const data = doc.data()
    
    const latitude = data.point?.latitude || 0
    const longitude = data.point?.longitude || 0
    const statusLibelle = data.statut?.libelle || 'Nouveau'

    return {
        id: doc.id,
        position: [latitude, longitude],
        problem: data.description || 'Problème de route',
        location: data.city || 'Non spécifié',
        date: data.daty ? new Date(data.daty).toLocaleDateString('fr-FR') : 'N/A',
        status: statusLibelle,
        surface: data.surface || 0,
        budget: data.budget || 0,
        budgetFormatted: data.budget ? Number(data.budget).toLocaleString() + ' Ar' : 'Non défini',
        surfaceFormatted: data.surface ? data.surface + ' m²' : 'N/A',
        entreprise: data.entreprise?.nom || 'Non assignée',
        photo: data.photo || null,
        category: data.category || null
    }
}
