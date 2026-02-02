import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, UserType, LoginResponse, getFullName } from '@/models/User';

// Nombre maximum de tentatives avant blocage
const MAX_LOGIN_ATTEMPTS = 3;

// Interface pour le statut utilisateur
interface StatutUtilisateur {
  id_statut_utilisateur?: number;
  date_: string;
  etat: number; // 0 = bloqué, 1 = actif
  id_utilisateur?: number;
  firebase_uid?: string;
  email?: string;
  tentatives_echouees?: number;
}

/**
 * Service d'authentification Firebase
 */
class AuthService {
  // Compteur de tentatives en mémoire (par session)
  private loginAttempts: Map<string, number> = new Map();

  /**
   * Vérifier si l'utilisateur est bloqué
   */
  private async isUserBlocked(email: string): Promise<boolean> {
    try {
      const statutRef = collection(db, 'statut_utilisateurs');
      const q = query(
        statutRef,
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
      console.error('Erreur lors de la vérification du statut:', error);
      return false;
    }
  }

  /**
   * Bloquer un utilisateur
   */
  private async blockUser(email: string, id_utilisateur?: number): Promise<void> {
    try {
      const statutRef = collection(db, 'statut_utilisateurs');
      await addDoc(statutRef, {
        date_: new Date().toISOString(),
        etat: 0, // 0 = bloqué
        email: email,
        id_utilisateur: id_utilisateur || null,
        tentatives_echouees: MAX_LOGIN_ATTEMPTS,
        raison: 'Nombre maximum de tentatives de connexion atteint'
      });
      console.log('⛔ Utilisateur bloqué:', email);
    } catch (error) {
      console.error('Erreur lors du blocage de l\'utilisateur:', error);
    }
  }

  /**
   * Incrémenter le compteur de tentatives
   */
  private incrementAttempts(email: string): number {
    const current = this.loginAttempts.get(email) || 0;
    const newCount = current + 1;
    this.loginAttempts.set(email, newCount);
    console.log(`⚠️ Tentative ${newCount}/${MAX_LOGIN_ATTEMPTS} pour ${email}`);
    return newCount;
  }

  /**
   * Réinitialiser le compteur de tentatives
   */
  private resetAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  /**
   * Obtenir le nombre de tentatives restantes
   */
  getRemainingAttempts(email: string): number {
    const current = this.loginAttempts.get(email) || 0;
    return MAX_LOGIN_ATTEMPTS - current;
  }
  /**
   * Connexion avec email et mot de passe
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // 1. Vérifier si l'utilisateur est bloqué
      const isBlocked = await this.isUserBlocked(email);
      if (isBlocked) {
        throw new Error('COMPTE_BLOQUE');
      }

      // 2. Vérifier le nombre de tentatives en mémoire
      const currentAttempts = this.loginAttempts.get(email) || 0;
      if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
        throw new Error('COMPTE_BLOQUE');
      }

      // 3. Tenter l'authentification Firebase
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        // Mot de passe incorrect ou autre erreur d'auth
        if (authError.code === 'auth/wrong-password' || 
            authError.code === 'auth/invalid-credential') {
          const attempts = this.incrementAttempts(email);
          
          if (attempts >= MAX_LOGIN_ATTEMPTS) {
            // Bloquer l'utilisateur dans Firestore
            await this.blockUser(email);
            throw new Error('MAX_TENTATIVES');
          }
          
          // Retourner l'erreur avec le nombre de tentatives restantes
          const remaining = MAX_LOGIN_ATTEMPTS - attempts;
          throw new Error(`TENTATIVE_ECHOUEE:${remaining}`);
        }
        throw authError;
      }
      
      const firebaseUser = userCredential.user;

      // 4. Rechercher l'utilisateur dans Firestore par email
      const usersRef = collection(db, 'utilisateurs');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await this.logout();
        throw new Error('Utilisateur non trouvé dans la base de données');
      }

      // Récupérer les données utilisateur (premier résultat)
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      // Mettre à jour le UID Firebase et last_sync_at
      await updateDoc(doc(db, 'utilisateurs', userDoc.id), {
        uid: firebaseUser.uid,
        updatedAt: serverTimestamp(),
        last_sync_at: new Date().toISOString()
      });

      // Obtenir le token
      const token = await firebaseUser.getIdToken();

      // Créer l'objet utilisateur complet
      const completeUser: User = {
        ...userData,
        uid: firebaseUser.uid,
        last_sync_at: new Date().toISOString()
      };

      // 5. Connexion réussie - Réinitialiser les tentatives
      this.resetAttempts(email);
      console.log('✅ Connexion réussie pour:', email);

      return {
        user: completeUser,
        token
      };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Obtenir l'utilisateur actuellement connecté
   */
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      return null;
    }

    try {
      // Rechercher l'utilisateur dans Firestore par UID
      const usersRef = collection(db, 'utilisateurs');
      const q = query(usersRef, where('uid', '==', firebaseUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as User;
        return userData;
      }

      // Si pas de UID, chercher par email
      const emailQuery = query(usersRef, where('email', '==', firebaseUser.email!));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        const userData = emailSnapshot.docs[0].data() as User;
        return userData;
      }

      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Écouter les changements d'état d'authentification
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Obtenir le token d'authentification actuel
   */
  async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  async getUserById(id_utilisateur: number): Promise<User | null> {
    try {
      const usersRef = collection(db, 'utilisateurs');
      const q = query(usersRef, where('id_utilisateur', '==', id_utilisateur));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data() as User;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Gestion des erreurs Firebase Auth
   */
  private handleAuthError(error: AuthError): Error {
    let message = 'Une erreur est survenue lors de la connexion';

    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Adresse email invalide';
        break;
      case 'auth/user-disabled':
        message = 'Ce compte a été désactivé';
        break;
      case 'auth/user-not-found':
        message = 'Aucun compte associé à cette adresse email';
        break;
      case 'auth/wrong-password':
        message = 'Mot de passe incorrect';
        break;
      case 'auth/invalid-credential':
        message = 'Identifiants invalides. Vérifiez votre email et mot de passe';
        break;
      case 'auth/too-many-requests':
        message = 'Trop de tentatives. Veuillez réessayer plus tard';
        break;
      case 'auth/network-request-failed':
        message = 'Erreur de connexion. Vérifiez votre connexion internet';
        break;
      default:
        message = error.message || message;
    }

    return new Error(message);
  }
}

// Exporter une instance unique du service
export const authService = new AuthService();
export default authService;
