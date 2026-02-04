import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser, 
  AuthError 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { User, LoginResponse } from '@/models/User';
import { parametreService } from '../parametre/parametreService';
import { utilisateurService, statutUtilisateurService } from '../utilisateur';

class AuthService {
  // Compteur de tentatives en mémoire (par session)
  private loginAttempts: Map<string, number> = new Map();
  private maxTentatives: number = 3; // Valeur par défaut, sera chargée depuis Firestore

  
  // Initialise le service (charge les paramètres)
  async init(): Promise<void> {
    try {
      this.maxTentatives = await parametreService.getMaxTentatives();
      console.log('🔧 Max tentatives:', this.maxTentatives);
    } catch (error) {
      console.error('Erreur init authService:', error);
    }
  }

  // Incrémente le compteur de tentatives
  private incrementAttempts(email: string): number {
    const current = this.loginAttempts.get(email) || 0;
    const newCount = current + 1;
    this.loginAttempts.set(email, newCount);
    console.log(`⚠️ Tentative ${newCount}/${this.maxTentatives} pour ${email}`);
    return newCount;
  }

  // Réinitialise le compteur de tentatives
  private resetAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  // Retourne le nombre de tentatives restantes
  getRemainingAttempts(email: string): number {
    const current = this.loginAttempts.get(email) || 0;
    return this.maxTentatives - current;
  }

  // Connexion utilisateur
  // Étapes:
  // 1. Vérifier si bloqué
  // 2. Vérifier si c'est un Utilisateur (pas Manager)
  // 3. Authentification Firebase
  // 4. Gestion des tentatives
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // 1. Vérifier si bloqué
      const isBlocked = await statutUtilisateurService.isBlocked(email);
      if (isBlocked) {
        throw new Error('COMPTE_BLOQUE');
      }

      // 2. Vérifier le nombre de tentatives en mémoire
      const currentAttempts = this.loginAttempts.get(email) || 0;
      if (currentAttempts >= this.maxTentatives) {
        throw new Error('COMPTE_BLOQUE');
      }

      // 3. Vérifier si c'est bien un Utilisateur (pas Manager)
      const isUtilisateur = await utilisateurService.isUtilisateurType(email);
      if (!isUtilisateur) {
        throw new Error('MANAGER_NON_AUTORISE');
      }

      // 4. Tenter l'authentification Firebase
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        // Mot de passe incorrect
        if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
          const attempts = this.incrementAttempts(email);
          
          if (attempts >= this.maxTentatives) {
            await statutUtilisateurService.blockUser(email, attempts);
            throw new Error('MAX_TENTATIVES');
          }
        
          const remaining = this.maxTentatives - attempts;
          throw new Error(`TENTATIVE_ECHOUEE:${remaining}`);
        }
        throw authError;
      }
      
      const firebaseUser = userCredential.user;

      // 5. Récupérer les données utilisateur
      const userData = await utilisateurService.getByEmail(email);
      if (!userData) {
        await this.logout();
        throw new Error('UTILISATEUR_NON_TROUVE');
      }

      // 6. Mettre à jour l'UID Firebase
      await utilisateurService.updateFirebaseUid(email, firebaseUser.uid);

      // 7. Obtenir le token
      const token = await firebaseUser.getIdToken();

      // 8. Créer l'objet utilisateur complet
      const completeUser: User = {
        ...userData,
        uid: firebaseUser.uid,
        last_sync_at: new Date().toISOString()
      };

      // 9. Réinitialiser les tentatives
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
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    try {
      // Essayer par UID d'abord
      let user = await utilisateurService.getByUid(firebaseUser.uid);
      if (user) return user;

      // Fallback par email
      if (firebaseUser.email) {
        user = await utilisateurService.getByEmail(firebaseUser.email);
      }

      return user;
    } catch (error) {
      console.error('Erreur getCurrentUser:', error);
      return null;
    }
  }

  /**
   * Écoute les changements d'état d'authentification
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
   * Vérifie si un utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Récupère le token d'authentification actuel
   */
  async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  /**
   * Met à jour la photo de profil
   */
  async updateProfilePhoto(photoUrl: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Utilisateur non connecté');
    }
    await utilisateurService.updatePhoto(firebaseUser.uid, photoUrl);
  }

  // Gestion des erreurs d'authentification
  private handleAuthError(error: any): Error {
    // Si c'est déjà une erreur personnalisée
    if (error.message?.startsWith('COMPTE_BLOQUE') ||
        error.message?.startsWith('MAX_TENTATIVES') ||
        error.message?.startsWith('TENTATIVE_ECHOUEE') ||
        error.message?.startsWith('MANAGER_NON_AUTORISE') ||
        error.message?.startsWith('UTILISATEUR_NON_TROUVE')) {
      return error;
    }

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

// Instance unique du service
export const authService = new AuthService();
export default authService;
