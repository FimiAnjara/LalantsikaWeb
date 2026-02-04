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
    } catch (error) {
      console.error('Erreur getByEmail:', error);
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
   * Utilise la structure imbriquée: type_utilisateur.id_type_utilisateur
   */
  async isUtilisateurType(email: string): Promise<boolean> {
    try {
      const q = query(
        this.getCollectionRef(),
        where('email', '==', email),
        where('type_utilisateur.id_type_utilisateur', '==', TypeUtilisateurEnum.UTILISATEUR)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Erreur isUtilisateurType:', error);
      return false;
    }
  }

  /**
   * Vérifie si l'utilisateur est de type "Manager"
   * Utilise la structure imbriquée: type_utilisateur.id_type_utilisateur
   */
  async isManagerType(email: string): Promise<boolean> {
    try {
      const q = query(
        this.getCollectionRef(),
        where('email', '==', email),
        where('type_utilisateur.id_type_utilisateur', '==', TypeUtilisateurEnum.MANAGER)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
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
