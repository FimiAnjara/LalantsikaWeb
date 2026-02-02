import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Signalement, 
  CreateSignalementData, 
  UpdateSignalementData,
  UtilisateurRef 
} from '@/models/Signalement';
import { STATUT_OPTIONS, Statut } from '@/models/Statut';
import { Point } from '@/models/Point';
import { auth } from '../firebase/config';

const COLLECTION_NAME = 'signalements';

class SignalementService {
  private getCollectionRef() {
    return collection(db, COLLECTION_NAME);
  }

  private async getCurrentUser(): Promise<UtilisateurRef | null> {
    const firebaseUser = auth.currentUser;
    console.log('🔍 Firebase currentUser:', firebaseUser);
    
    if (!firebaseUser) {
      console.warn('❌ Aucun utilisateur Firebase connecté');
      return null;
    }

    console.log('✅ Firebase UID:', firebaseUser.uid);
    console.log('✅ Firebase Email:', firebaseUser.email);

    try {
      const usersRef = collection(db, 'utilisateurs');
      
      // D'abord chercher par UID
      console.log('🔍 Recherche par UID:', firebaseUser.uid);
      let q = query(usersRef, where('uid', '==', firebaseUser.uid));
      let snapshot = await getDocs(q);
      console.log('📊 Résultat recherche par UID:', snapshot.size, 'documents');

      // Si pas trouvé par UID, chercher par email
      if (snapshot.empty && firebaseUser.email) {
        console.log('🔍 Recherche par email:', firebaseUser.email);
        q = query(usersRef, where('email', '==', firebaseUser.email));
        snapshot = await getDocs(q);
        console.log('📊 Résultat recherche par email:', snapshot.size, 'documents');
      }

      if (snapshot.empty) {
        console.warn('⚠️ Utilisateur non trouvé dans Firestore, utilisation des données Firebase Auth');
        // Retourner un utilisateur basé uniquement sur Firebase Auth
        return {
          firebase_uid: firebaseUser.uid,
          identifiant: firebaseUser.email || 'Utilisateur',
          nom: firebaseUser.displayName?.split(' ')[1] || '',
          prenom: firebaseUser.displayName?.split(' ')[0] || '',
        };
      }

      const userData = snapshot.docs[0].data();
      console.log('✅ Données utilisateur trouvées:', userData);
      
      return {
        id_utilisateur: userData.id_utilisateur,
        identifiant: userData.identifiant || firebaseUser.email,
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        firebase_uid: firebaseUser.uid
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Générer l'horodatage ISO pour la synchronisation
   */
  private getISOTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Créer un nouveau signalement + historique de statut
   */
  async createSignalement(data: CreateSignalementData): Promise<Signalement | null> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const point: Point = {
        latitude: data.latitude,
        longitude: data.longitude
      };

      // Statut par défaut: En attente (id_statut = 1)
      const statut: Statut = STATUT_OPTIONS[0];
      const now = this.getISOTimestamp();

      // Construire l'objet signalement (éviter undefined pour Firestore)
      const signalement: Record<string, any> = {
        daty: now,
        description: data.description || '',
        point,
        statut,
        utilisateur: currentUser,
        synchronized: false,
        last_sync_at: now
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (data.surface !== undefined && data.surface !== null) {
        signalement.surface = data.surface;
      }
      if (data.photo) {
        signalement.photo = data.photo;
      }
      if (data.city) {
        signalement.city = data.city;
      }

      // Ajouter le signalement à Firestore
      const docRef = await addDoc(this.getCollectionRef(), signalement);
      console.log('✅ Signalement créé avec ID:', docRef.id);
      console.log('📝 Utilisateur stocké dans le signalement:', JSON.stringify(currentUser, null, 2));
      console.log('📝 Firebase UID stocké:', currentUser.firebase_uid);

      // historique
      const histoStatutRef = collection(db, 'histo_statuts');
      await addDoc(histoStatutRef, {
        daty: now,
        description: 'Signalement créé',
        statut: statut,
        firebase_signalement_id: docRef.id,
        synchronized: false,
        last_sync_at: now
      });
      console.log('Historique de statut créé pour le signalement:', docRef.id);

      // Retourner le signalement complet avec son ID Firebase
      const result: Signalement = {
        firebase_id: docRef.id,
        daty: now,
        description: data.description || '',
        point,
        statut,
        utilisateur: currentUser,
        synchronized: false,
        last_sync_at: now,
        ...(data.surface !== undefined && data.surface !== null && { surface: data.surface }),
        ...(data.photo && { photo: data.photo }),
        ...(data.city && { city: data.city })
      };

      return result;
    } catch (error) {
      console.log('Erreur lors de la création du signalement:', error);
      throw error;
    }
  }

  /**
   * Récupérer un signalement par son ID Firestore
   */
  async getSignalementById(firebaseId: string): Promise<Signalement | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, firebaseId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        ...docSnap.data() as Signalement,
        firebase_id: docSnap.id
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du signalement:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les signalements
   */
  async getAllSignalements(limitCount?: number): Promise<Signalement[]> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('daty', 'desc')
      ];

      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(this.getCollectionRef(), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data() as Signalement,
        firebase_id: doc.id
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
      throw error;
    }
  }

  /**
   * Récupérer les signalements de l'utilisateur connecté
   */
  async getMySignalements(): Promise<Signalement[]> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('🔍 Recherche des signalements pour firebase_uid:', firebaseUser.uid);
      console.log('🔍 Email de l\'utilisateur:', firebaseUser.email);

      // D'abord récupérer TOUS les signalements pour voir leur structure
      const allSnapshot = await getDocs(this.getCollectionRef());
      console.log('📊 TOUS les signalements dans Firestore:', allSnapshot.size);
      
      allSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📄 Signalement #${index + 1}:`, {
          id: doc.id,
          utilisateur: data.utilisateur,
          firebase_uid_present: !!data.utilisateur?.firebase_uid,
          firebase_uid_value: data.utilisateur?.firebase_uid
        });
      });

      // Maintenant chercher avec le filtre
      const q = query(
        this.getCollectionRef(),
        where('utilisateur.firebase_uid', '==', firebaseUser.uid),
        orderBy('daty', 'desc')
      );

      const snapshot = await getDocs(q);
      console.log('📊 Mes signalements trouvés avec le filtre:', snapshot.size);

      if (snapshot.size === 0) {
        console.warn('⚠️ Aucun signalement trouvé pour cet utilisateur');
        console.warn('⚠️ Vérifiez que firebase_uid dans Firestore correspond à:', firebaseUser.uid);
      }

      return snapshot.docs.map(doc => ({
        ...doc.data() as Signalement,
        firebase_id: doc.id
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de mes signalements:', error);
      throw error;
    }
  }

  /**
   * Récupérer les signalements par statut
   */
  async getSignalementsByStatut(id_statut: number): Promise<Signalement[]> {
    try {
      const q = query(
        this.getCollectionRef(),
        where('statut.id_statut', '==', id_statut),
        orderBy('daty', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data() as Signalement,
        firebase_id: doc.id
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements par statut:', error);
      throw error;
    }
  }

  /**
   * Récupérer les signalements non synchronisés
   */
  async getUnsyncedSignalements(): Promise<Signalement[]> {
    try {
      const q = query(
        this.getCollectionRef(),
        where('synchronized', '==', false)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data() as Signalement,
        firebase_id: doc.id
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements non synchronisés:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un signalement
   */
  async updateSignalement(firebaseId: string, data: UpdateSignalementData): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, firebaseId);
      
      const updateData: Partial<DocumentData> = {
        ...data,
        synchronized: false,
        last_sync_at: this.getISOTimestamp()
      };

      // Si on met à jour le statut, mettre à jour l'objet complet
      if (data.id_statut) {
        const statut = STATUT_OPTIONS.find(s => s.id_statut === data.id_statut);
        if (statut) {
          updateData.statut = statut;
          delete updateData.id_statut;
        }
      }

      await updateDoc(docRef, updateData);
      console.log('Signalement mis à jour:', firebaseId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du signalement:', error);
      throw error;
    }
  }

  /**
   * Supprimer un signalement
   */
  async deleteSignalement(firebaseId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, firebaseId);
      await deleteDoc(docRef);
      console.log('Signalement supprimé:', firebaseId);
    } catch (error) {
      console.error('Erreur lors de la suppression du signalement:', error);
      throw error;
    }
  }

  /**
   * Marquer un signalement comme synchronisé
   */
  async markAsSynced(firebaseId: string, id_signalement: number): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, firebaseId);
      await updateDoc(docRef, {
        id_signalement,
        synchronized: true,
        last_sync_at: this.getISOTimestamp()
      });
      console.log('Signalement marqué comme synchronisé:', firebaseId);
    } catch (error) {
      console.error('Erreur lors du marquage de synchronisation:', error);
      throw error;
    }
  }

  /**
   * Convertir un signalement pour l'affichage sur la carte
   */
  signalementToMarker(signalement: Signalement): {
    id: string;
    lat: number;
    lng: number;
    type: string;
    title: string;
    city?: string;
  } {
    // Déterminer le type basé sur le statut
    const typeMap: Record<number, string> = {
      1: 'warning', // En attente
      2: 'info',    // En cours
      3: 'success', // Terminé
      4: 'danger'   // Rejeté
    };

    return {
      id: signalement.firebase_id || `sig-${signalement.id_signalement}`,
      lat: signalement.point.latitude,
      lng: signalement.point.longitude,
      type: typeMap[signalement.statut.id_statut] || 'info',
      title: signalement.description || 'Signalement',
      city: signalement.city
    };
  }
}

// Export une instance unique du service
export const signalementService = new SignalementService();
export default signalementService;
