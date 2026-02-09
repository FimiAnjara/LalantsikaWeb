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
import { Network } from '@capacitor/network';

class AuthService {
  // Compteur de tentatives en mémoire (par session)
  private loginAttempts: Map<string, number> = new Map();
  private readonly DEFAULT_MAX_TENTATIVES: number = 3; // Valeur par défaut si erreur réseau

  /**
   * Vérifie si l'appareil a une connexion internet
   */
  async checkNetworkConnection(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      console.log('📡 Network status:', status);
      return status.connected;
    } catch (error) {
      console.error('Erreur vérification réseau:', error);
      // En cas d'erreur, on essaie quand même
      return true;
    }
  }

  /**
   * Récupère la valeur maximale de tentatives depuis Firestore
   * (toujours à jour, pas de cache)
   */
  private async getMaxTentatives(): Promise<number> {
    try {
      const maxTentatives = await parametreService.getMaxTentatives();
      console.log('🔧 Max tentatives (Firestore):', maxTentatives);
      return maxTentatives;
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer maxTentatives depuis Firestore, utilisation valeur par défaut:', this.DEFAULT_MAX_TENTATIVES);
      return this.DEFAULT_MAX_TENTATIVES;
    }
  }

  // Incrémente le compteur de tentatives
  private incrementAttempts(email: string, maxTentatives: number): number {
    const current = this.loginAttempts.get(email) || 0;
    const newCount = current + 1;
    this.loginAttempts.set(email, newCount);
    console.log(`⚠️ Tentative ${newCount}/${maxTentatives} pour ${email}`);
    return newCount;
  }

  // Réinitialise le compteur de tentatives
  private resetAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  // Retourne le nombre de tentatives restantes (utilise la valeur par défaut)
  getRemainingAttempts(email: string): number {
    const current = this.loginAttempts.get(email) || 0;
    return this.DEFAULT_MAX_TENTATIVES - current;
  }

  // Connexion utilisateur
  // Étapes:
  // 1. Vérifier la connexion internet
  // 2. Récupérer le nombre max de tentatives depuis Firestore (toujours à jour)
  // 3. Authentification Firebase (login + mot de passe)
  // 4. Vérifier si l'utilisateur existe dans Firestore
  // 5. Vérifier si le compte est bloqué
  // 6. Vérifier si c'est un Utilisateur (pas Manager)
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const isConnected = await this.checkNetworkConnection();
      if (!isConnected) {
        throw new Error('NETWORK_ERROR');
      }

      // Récupérer la valeur actuelle depuis Firestore (pas de cache)
      const maxTentatives = await this.getMaxTentatives();

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
          const attempts = this.incrementAttempts(email, maxTentatives);
          if (attempts >= maxTentatives) {
            try {
              await statutUtilisateurService.blockUser(email, attempts);
            } catch (blockError) {
              console.warn('Impossible de bloquer l\'utilisateur:', blockError);
            }
            throw new Error('MAX_TENTATIVES');
          }
        
          const remaining = maxTentatives - attempts;
          throw new Error(`TENTATIVE_ECHOUEE:${remaining}`);
        }
        throw authError;
      }
      
      const firebaseUser = userCredential.user;
      const userData = await utilisateurService.getByEmail(email);
      if (!userData) {
        await this.logout();
        throw new Error('UTILISATEUR_NON_TROUVE');
      }

      const isBlocked = await statutUtilisateurService.isBlocked(email);
      if (isBlocked) {
        await this.logout();
        throw new Error('COMPTE_BLOQUE');
      }

      const currentAttempts = this.loginAttempts.get(email) || 0;
      if (currentAttempts >= maxTentatives) {
        await this.logout();
        throw new Error('COMPTE_BLOQUE');
      }

      const userTypeResult = await utilisateurService.isUtilisateurType(email);
      if (userTypeResult.error === 'NETWORK_ERROR') {
        throw new Error('NETWORK_ERROR');
      }
      
      if (!userTypeResult.isUtilisateur) {
        await this.logout();
        throw new Error('MANAGER_NON_AUTORISE');
      }

      await utilisateurService.updateFirebaseUid(email, firebaseUser.uid);

      const { pushNotificationService } = await import('../notification');
      const fcmToken = await pushNotificationService.getToken();
      
      if (fcmToken && userData.id_utilisateur) {
        console.log('📱 FCM Token actuel:', fcmToken);
        console.log('📱 Mise à jour du FCM token pour utilisateur:', userData.id_utilisateur);
        
        const tokenUpdated = await utilisateurService.updateFcmToken(
          userData.id_utilisateur, 
          fcmToken
        );
        
        if (tokenUpdated) {
          console.log('✅ FCM token mis à jour avec succès dans Firestore');
        } else {
          console.warn('⚠️ Échec de la mise à jour du FCM token');
        }
      } else if (!fcmToken) {
        console.log('ℹ️ Pas de FCM token disponible (mode web ou permissions refusées)');
      }

      const token = await firebaseUser.getIdToken();

      const completeUser: User = {
        ...userData,
        uid: firebaseUser.uid,
        last_sync_at: new Date().toISOString()
      };

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
      // Import dynamique pour éviter les dépendances circulaires
      const { sessionService } = await import('./sessionService');
      
      // Effacer la session locale
      await sessionService.clearSession();
      
      // Déconnexion Firebase
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
        error.message?.startsWith('UTILISATEUR_NON_TROUVE') ||
        error.message?.startsWith('NETWORK_ERROR')) {
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
