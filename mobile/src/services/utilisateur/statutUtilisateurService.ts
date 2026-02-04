import { 
  collection, query, where, getDocs, addDoc, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Interface pour le statut utilisateur (bloqué/actif)
 */
export interface StatutUtilisateur {
  id_statut_utilisateur?: string;
  date_: string;
  etat: number; // 0 = bloqué, 1 = actif
  email: string;
  id_utilisateur?: number;
  firebase_uid?: string;
  tentatives_echouees?: number;
  raison?: string;
  synchronized?: boolean;
}

/**
 * Service pour gérer le statut des utilisateurs (blocage/déblocage)
 */
class StatutUtilisateurService {
  private readonly COLLECTION_NAME = 'statut_utilisateurs';

  private getCollectionRef() {
    return collection(db, this.COLLECTION_NAME);
  }

  /**
   * Vérifie si un utilisateur est bloqué
   */
  async isBlocked(email: string): Promise<boolean> {
    try {
      const q = query(
        this.getCollectionRef(),
        where('email', '==', email),
        orderBy('date_', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const lastStatus = snapshot.docs[0].data() as StatutUtilisateur;
        console.log('🔍 Dernier statut utilisateur:', lastStatus);
        return lastStatus.etat === 0; // 0 = bloqué
      }
      
      return false; // Pas de statut = pas bloqué
    } catch (error) {
      console.error('Erreur isBlocked:', error);
      return false;
    }
  }

  /**
   * Bloque un utilisateur
   */
  async blockUser(email: string, tentatives: number, id_utilisateur?: number): Promise<void> {
    try {
      await addDoc(this.getCollectionRef(), {
        date_: new Date().toISOString(),
        etat: 0, // 0 = bloqué
        email: email,
        id_utilisateur: id_utilisateur || null,
        tentatives_echouees: tentatives,
        raison: 'Nombre maximum de tentatives de connexion atteint',
        synchronized: false,
      });
      console.log('⛔ Utilisateur bloqué:', email);
    } catch (error) {
      console.error('Erreur blockUser:', error);
      throw error;
    }
  }

  /**
   * Débloque un utilisateur
   */
  async unblockUser(email: string): Promise<void> {
    try {
      await addDoc(this.getCollectionRef(), {
        date_: new Date().toISOString(),
        etat: 1, // 1 = actif
        email: email,
        raison: 'Débloqué manuellement',
        synchronized: false,
      });
      console.log('✅ Utilisateur débloqué:', email);
    } catch (error) {
      console.error('Erreur unblockUser:', error);
      throw error;
    }
  }
}

export const statutUtilisateurService = new StatutUtilisateurService();
