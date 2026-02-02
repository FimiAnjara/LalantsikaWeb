import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { HistoStatut, CreateHistoStatutData } from '@/models/HistoStatut';
import { STATUT_OPTIONS } from '@/models/Statut';

// Nom de la collection Firestore
const COLLECTION_NAME = 'histo_statuts';

/**
 * Service pour gérer l'historique des statuts dans Firestore
 */
class HistoStatutService {
  /**
   * Obtenir la référence de la collection
   */
  private getCollectionRef() {
    return collection(db, COLLECTION_NAME);
  }

  /**
   * Générer l'horodatage ISO
   */
  private getISOTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Créer un nouvel historique de statut
   */
  async createHistoStatut(data: CreateHistoStatutData): Promise<HistoStatut | null> {
    try {
      const statut = STATUT_OPTIONS.find(s => s.id_statut === data.id_statut);
      if (!statut) {
        throw new Error('Statut invalide');
      }

      const histoStatut: Omit<HistoStatut, 'id_histo_statut' | 'firebase_id'> = {
        daty: this.getISOTimestamp(),
        description: data.description,
        image: data.image,
        statut,
        id_signalement: data.id_signalement,
        firebase_signalement_id: data.firebase_signalement_id,
        synchronized: false,
        last_sync_at: this.getISOTimestamp()
      };

      const docRef = await addDoc(this.getCollectionRef(), histoStatut);

      console.log('Historique de statut créé:', docRef.id);

      return {
        ...histoStatut,
        firebase_id: docRef.id
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'historique de statut:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique d'un signalement
   */
  async getHistoriqueBySignalement(firebase_signalement_id: string): Promise<HistoStatut[]> {
    try {
      const q = query(
        this.getCollectionRef(),
        where('firebase_signalement_id', '==', firebase_signalement_id),
        orderBy('daty', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data() as HistoStatut,
        firebase_id: doc.id
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  /**
   * Récupérer les historiques non synchronisés
   */
  async getUnsyncedHistoriques(): Promise<HistoStatut[]> {
    try {
      const q = query(
        this.getCollectionRef(),
        where('synchronized', '==', false)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data() as HistoStatut,
        firebase_id: doc.id
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des historiques non synchronisés:', error);
      throw error;
    }
  }
}

// Export une instance unique du service
export const histoStatutService = new HistoStatutService();
export default histoStatutService;
