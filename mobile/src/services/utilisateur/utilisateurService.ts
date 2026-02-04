import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from '@/models/User';
import { TypeUtilisateurEnum } from '@/models/TypeUtilisateur';

/**
 * Service pour gérer les utilisateurs Firestore
 * Séparé de l'authentification pour respecter le principe de responsabilité unique
 * 
 * Structure Firestore utilisateurs:
 * {
 *   uid, id_utilisateur, email, nom, prenom, dtn,
 *   sexe: { id_sexe, libelle },
 *   type_utilisateur: { id_type_utilisateur, libelle },
 *   photoUrl, createdAt, updatedAt, last_sync_at
 * }
 */
class UtilisateurService {
  private readonly COLLECTION_NAME = 'utilisateurs';

  private getCollectionRef() {
    return collection(db, this.COLLECTION_NAME);
  }

  /**
   * Récupère un utilisateur par son UID Firebase
   */
  async getByUid(uid: string): Promise<User | null> {
    try {
      const q = query(this.getCollectionRef(), where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      return snapshot.docs[0].data() as User;
    } catch (error) {
      console.error('Erreur getByUid:', error);
      return null;
    }
  }

  /**
   * Récupère un utilisateur par son email
   */
  async getByEmail(email: string): Promise<(User & { _firestore_id?: string }) | null> {
    try {
      const q = query(this.getCollectionRef(), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const userData = snapshot.docs[0].data() as User;
      return {
        ...userData,
        _firestore_id: snapshot.docs[0].id
      };
    } catch (error: any) {
      console.error('Erreur getByEmail:', error);
      
      // Propager les erreurs réseau pour qu'elles soient gérées correctement
      const errorMsg = error?.message?.toLowerCase() || '';
      const errorCode = error?.code?.toLowerCase() || '';
      
      const isNetworkError = 
        errorMsg.includes('network') ||
        errorMsg.includes('failed to fetch') ||
        errorMsg.includes('offline') ||
        errorMsg.includes('unavailable') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('client is offline') ||
        errorCode === 'unavailable' ||
        errorCode === 'deadline-exceeded' ||
        errorCode === 'failed-precondition';
      
      if (isNetworkError) {
        throw new Error('NETWORK_ERROR');
      }
      
      return null;
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getById(id_utilisateur: number): Promise<User | null> {
    try {
      const q = query(this.getCollectionRef(), where('id_utilisateur', '==', id_utilisateur));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      return snapshot.docs[0].data() as User;
    } catch (error) {
      console.error('Erreur getById:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur est de type "Utilisateur" (pas Manager)
   * Méthode robuste: récupère l'utilisateur puis vérifie le type
   */
  async isUtilisateurType(email: string): Promise<{ isUtilisateur: boolean; error?: string }> {
    try {
      // Récupérer l'utilisateur par email d'abord
      const user = await this.getByEmail(email);
      
      if (!user) {
        console.log('❌ isUtilisateurType: Utilisateur non trouvé pour', email);
        return { isUtilisateur: false };
      }

      // Log pour debug
      console.log('🔍 isUtilisateurType - Données utilisateur:');
      console.log('   Email:', user.email);
      console.log('   Type utilisateur:', JSON.stringify(user.type_utilisateur));
      
      // Vérifier le type de plusieurs façons (robustesse)
      // typeId peut être number ou string selon comment Firestore stocke la valeur
      const typeId = user.type_utilisateur?.id_type_utilisateur;
      
      // Convertir en number pour comparer (gère string et number)
      const typeIdNum = Number(typeId);
      const isUtilisateur = typeIdNum === TypeUtilisateurEnum.UTILISATEUR;
      
      console.log('   typeId:', typeId, '(type:', typeof typeId, ')');
      console.log('   typeIdNum:', typeIdNum);
      console.log('   Expected:', TypeUtilisateurEnum.UTILISATEUR);
      console.log('   isUtilisateur:', isUtilisateur);
      
      return { isUtilisateur };
    } catch (error: any) {
      console.error('❌ Erreur isUtilisateurType:', error);
      
      // Détecter les erreurs réseau
      const errorMsg = error?.message?.toLowerCase() || '';
      const isNetworkError = 
        errorMsg.includes('network') ||
        errorMsg.includes('failed to fetch') ||
        errorMsg.includes('offline') ||
        errorMsg.includes('unavailable') ||
        errorMsg.includes('timeout') ||
        error?.code === 'unavailable' ||
        error?.code === 'deadline-exceeded';
      
      if (isNetworkError) {
        return { isUtilisateur: false, error: 'NETWORK_ERROR' };
      }
      
      return { isUtilisateur: false };
    }
  }

  /**
   * Vérifie si l'utilisateur est de type "Manager"
   * Méthode robuste: récupère l'utilisateur puis vérifie le type
   */
  async isManagerType(email: string): Promise<boolean> {
    try {
      const user = await this.getByEmail(email);
      
      if (!user) {
        return false;
      }

      const typeId = user.type_utilisateur?.id_type_utilisateur;
      
      // Convertir en number pour comparer
      return Number(typeId) === TypeUtilisateurEnum.MANAGER;
    } catch (error) {
      console.error('Erreur isManagerType:', error);
      return false;
    }
  }

  /**
   * Met à jour l'UID Firebase d'un utilisateur
   */
  async updateFirebaseUid(email: string, uid: string): Promise<void> {
    try {
      const user = await this.getByEmail(email);
      if (!user || !user._firestore_id) {
        throw new Error('Utilisateur non trouvé');
      }
      
      await updateDoc(doc(db, this.COLLECTION_NAME, user._firestore_id), {
        uid: uid,
        updatedAt: serverTimestamp(),
        last_sync_at: null
      });
    } catch (error) {
      console.error('Erreur updateFirebaseUid:', error);
      throw error;
    }
  }

  /**
   * Met à jour la photo de profil
   */
  async updatePhoto(uid: string, photoUrl: string): Promise<void> {
    try {
      const q = query(this.getCollectionRef(), where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Utilisateur non trouvé');
      }
      
      await updateDoc(doc(db, this.COLLECTION_NAME, snapshot.docs[0].id), {
        photoUrl: photoUrl,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Photo de profil mise à jour');
    } catch (error) {
      console.error('Erreur updatePhoto:', error);
      throw error;
    }
  }
}

export const utilisateurService = new UtilisateurService();
