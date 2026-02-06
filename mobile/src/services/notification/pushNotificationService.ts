import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { utilisateurService } from '../utilisateur';
import { toastService } from '../toast';

/**
 * Service de gestion des Push Notifications
 * Gère l'enregistrement du token FCM et la réception des notifications
 */
class PushNotificationService {
  private initialized = false;
  private currentToken: string | null = null;

  /**
   * Initialise les push notifications
   * À appeler après une connexion réussie
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Les push notifications ne fonctionnent que sur les plateformes natives
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Push notifications: non disponible sur le web');
      return;
    }

    try {
      // Demander la permission
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        const newStatus = await PushNotifications.requestPermissions();
        if (newStatus.receive !== 'granted') {
          console.log('❌ Permission push notifications refusée');
          return;
        }
      } else if (permStatus.receive !== 'granted') {
        console.log('❌ Permission push notifications non accordée');
        return;
      }

      // Enregistrer les listeners
      this.registerListeners();

      // S'enregistrer pour recevoir les notifications
      await PushNotifications.register();
      
      this.initialized = true;
      console.log('✅ Push notifications initialisées');
    } catch (error) {
      console.error('❌ Erreur initialisation push notifications:', error);
    }
  }

  /**
   * Enregistre les listeners pour les événements push
   */
  private registerListeners(): void {
    // Quand on reçoit le token d'enregistrement
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('� ============================================');
      console.log('📱 FCM Token reçu:', token.value);
      console.log('🔑 ============================================');
      this.currentToken = token.value;
    });

    // Erreur d'enregistrement
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Erreur enregistrement push:', error);
    });

    // Notification reçue quand l'app est au premier plan
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('📬 Notification reçue (foreground):', notification);
      
      // Afficher un toast avec la notification
      if (notification.title) {
        toastService.info(notification.body || '', notification.title);
      }
    });

    // Notification cliquée
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('👆 Notification cliquée:', action);
      
      // Gérer l'action selon les données de la notification
      this.handleNotificationAction(action);
    });
  }

  /**
   * Gère l'action quand une notification est cliquée
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const data = action.notification.data;
    
    if (!data) return;

    // Navigation selon le type de notification
    switch (data.type) {
      case 'new_signalement':
      case 'status_update':
        if (data.signalement_id) {
          // Naviguer vers le détail du signalement
          // router.push({ name: 'SignalementDetails', params: { id: data.signalement_id } });
          console.log('🔗 Navigation vers signalement:', data.signalement_id);
        }
        break;
      default:
        console.log('📌 Type de notification non géré:', data.type);
    }
  }

  /**
   * Récupère le token FCM actuel
   * Attend que le token soit disponible si nécessaire
   */
  async getToken(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      console.log('ℹ️ getToken: Plateforme web, pas de FCM token');
      return null;
    }

    // Si déjà initialisé et token disponible
    if (this.currentToken) {
      console.log('🔑 FCM Token actuel disponible:', this.currentToken);
      return this.currentToken;
    }

    // Initialiser si pas encore fait
    if (!this.initialized) {
      await this.init();
    }

    // Attendre un peu que le token arrive
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkToken = () => {
        if (this.currentToken) {
          resolve(this.currentToken);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkToken, 500);
        } else {
          console.warn('⚠️ Timeout en attendant le FCM token');
          resolve(null);
        }
      };
      
      checkToken();
    });
  }

  /**
   * Enregistre le token FCM pour un utilisateur dans Firestore
   * À appeler après chaque connexion réussie
   * 
   * @param idUtilisateur L'ID de l'utilisateur (id_utilisateur)
   */
  async registerTokenForUser(idUtilisateur: number): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('📱 Push: Plateforme non native, skip');
        return true;
      }

      // Initialiser si pas encore fait
      if (!this.initialized) {
        await this.init();
      }

      // Récupérer le token
      const token = await this.getToken();
      
      if (!token) {
        console.warn('⚠️ Pas de FCM token disponible');
        return false;
      }

      console.log('📱 Enregistrement FCM token pour utilisateur:', idUtilisateur);
      
      // Mettre à jour dans Firestore via utilisateurService
      const success = await utilisateurService.updateFcmToken(idUtilisateur, token);
      
      if (success) {
        console.log('✅ FCM token enregistré dans Firestore');
      } else {
        console.error('❌ Échec enregistrement FCM token');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Erreur enregistrement FCM token:', error);
      return false;
    }
  }

  /**
   * Supprime le token FCM (à appeler lors de la déconnexion)
   */
  async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await PushNotifications.removeAllListeners();
      this.currentToken = null;
      this.initialized = false;
      console.log('✅ Push notifications désenregistrées');
    } catch (error) {
      console.error('❌ Erreur désenregistrement push:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
