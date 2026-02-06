import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import { utilisateurService } from '../utilisateur';
import { User, LoginResponse } from '@/models/User';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

/**
 * Service d'authentification Google
 * Gère la connexion via Google Sign-In sur mobile et web
 */
class GoogleAuthService {
  private initialized = false;

  /**
   * Vérifie si l'appareil a une connexion internet
   */
  private async checkNetworkConnection(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      console.log('📡 Network status:', status);
      return status.connected;
    } catch (error) {
      console.error('Erreur vérification réseau:', error);
      return true;
    }
  }

  /**
   * Initialise Google Auth
   * À appeler au démarrage de l'application
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.initialized = true;
      console.log('✅ Google Auth initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation Google Auth:', error);
    }
  }

  /**
   * Connexion avec Google
   */
  async signIn(): Promise<LoginResponse> {
    try {
      await this.init();

      // 0. Vérifier la connexion internet en premier
      const isConnected = await this.checkNetworkConnection();
      if (!isConnected) {
        throw new Error('NETWORK_ERROR');
      }

      // 1. Obtenir les credentials Google via Firebase Authentication
      console.log('🔄 Connexion Google en cours...');
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      if (!result.user?.email) {
        throw new Error('Impossible de récupérer l\'email Google');
      }

      console.log('✅ Google Sign-In réussi:', result.user.email);

      // 2. Créer le credential Firebase pour le web
      let firebaseUser = auth.currentUser;

      // Sur mobile, le plugin gère automatiquement Firebase Auth
      // Sur web, on doit utiliser signInWithCredential
      if (!Capacitor.isNativePlatform() && result.credential?.idToken) {
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        firebaseUser = userCredential.user;
      }

      if (!firebaseUser) {
        throw new Error('Erreur d\'authentification Firebase');
      }

      console.log('✅ Firebase Auth réussi:', firebaseUser.email);

      // 3. Vérifier si l'utilisateur existe dans Firestore
      const email = firebaseUser.email!;
      const userData = await utilisateurService.getByEmail(email);

      if (!userData) {
        // Déconnecter si l'utilisateur n'existe pas
        await this.signOut();
        throw new Error('UTILISATEUR_NON_INSCRIT');
      }

      // 4. Vérifier si c'est un utilisateur (pas manager)
      const userTypeResult = await utilisateurService.isUtilisateurType(email);
      
      // Vérifier si c'est une erreur réseau
      if (userTypeResult.error === 'NETWORK_ERROR') {
        await this.signOut();
        throw new Error('NETWORK_ERROR');
      }
      
      if (!userTypeResult.isUtilisateur) {
        await this.signOut();
        throw new Error('MANAGER_NON_AUTORISE');
      }

      // 5. Mettre à jour l'UID Firebase
      await utilisateurService.updateFirebaseUid(email, firebaseUser.uid);

      // 6. Obtenir le token
      const token = await firebaseUser.getIdToken();

      // 7. Créer l'objet utilisateur complet
      const completeUser: User = {
        ...userData,
        uid: firebaseUser.uid,
        last_sync_at: new Date().toISOString()
      };

      console.log('✅ Connexion Google complète pour:', email);

      return {
        user: completeUser,
        token
      };
    } catch (error: any) {
      console.error('❌ Erreur connexion Google:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      
      // Gestion des erreurs spécifiques
      if (error.message === 'UTILISATEUR_NON_INSCRIT') {
        throw new Error('Cet email n\'est pas enregistré. Contactez l\'administrateur.');
      }
      if (error.message === 'MANAGER_NON_AUTORISE') {
        throw new Error('Les managers ne peuvent pas se connecter sur l\'application mobile.');
      }
      if (error.message === 'NETWORK_ERROR') {
        throw new Error('Vérifiez votre connexion internet et réessayez.');
      }
      if (error.message?.includes('popup_closed') || error.message?.includes('cancelled') || error.message?.includes('CANCELED')) {
        throw new Error('Connexion annulée');
      }
      
      // "No credentials available" - Aucun compte Google sur l'appareil ou configuration incorrecte
      if (error.message?.includes('No credentials available') || error.message?.includes('NoCredentialException')) {
        throw new Error('Aucun compte Google disponible. Veuillez ajouter un compte Google dans les paramètres de votre appareil.');
      }
      
      // Erreurs spécifiques Google Sign-In sur mobile
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Vérifiez votre connexion internet et réessayez.');
      }
      if (error.code === 12501 || error.message?.includes('12501')) {
        // Google Sign-In cancelled by user on Android
        throw new Error('Connexion annulée');
      }
      if (error.code === 10 || error.message?.includes('DEVELOPER_ERROR') || error.message?.includes('10:')) {
        // Configuration error - SHA-1 missing or misconfigured
        console.error('❌ ERREUR DE CONFIGURATION: Vérifiez que le SHA-1 est ajouté dans Firebase Console');
        throw new Error('Erreur de configuration Google. Contactez le support.');
      }
      if (error.code === 7 || error.message?.includes('NETWORK_ERROR') || error.message?.includes('7:')) {
        throw new Error('Vérifiez votre connexion internet et réessayez.');
      }
      
      throw new Error('Erreur lors de la connexion Google');
    }
  }

  /**
   * Déconnexion Google
   */
  async signOut(): Promise<void> {
    try {
      await FirebaseAuthentication.signOut();
      console.log('✅ Déconnexion Google');
    } catch (error) {
      console.error('Erreur déconnexion Google:', error);
    }
  }
}

export const googleAuthService = new GoogleAuthService();
