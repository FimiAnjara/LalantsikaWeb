import { Preferences } from '@capacitor/preferences';
import { auth } from '../firebase/config';
import { browserLocalPersistence, browserSessionPersistence, setPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

/**
 * Clés de stockage pour la session
 */
const STORAGE_KEYS = {
  SESSION_EXPIRY: 'session_expiry',
  SESSION_DURATION: 'session_duration',
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REMEMBER_ME: 'remember_me'
};

/**
 * Durées de session prédéfinies (en millisecondes)
 */
export const SESSION_DURATIONS = {
  SHORT: 1 * 60 * 60 * 1000,        // 1 heure
  MEDIUM: 24 * 60 * 60 * 1000,       // 24 heures (1 jour)
  LONG: 7 * 24 * 60 * 60 * 1000,     // 7 jours
  VERY_LONG: 30 * 24 * 60 * 60 * 1000 // 30 jours
};

/**
 * Durée par défaut de session (24 heures)
 */
const DEFAULT_SESSION_DURATION = SESSION_DURATIONS.MEDIUM;

/**
 * Service de gestion de session
 * Gère la durée de vie des sessions utilisateur
 */
class SessionService {
  private sessionDuration: number = DEFAULT_SESSION_DURATION;

  /**
   * Initialise le service avec la durée de session sauvegardée
   */
  async init(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.SESSION_DURATION });
      if (value) {
        this.sessionDuration = parseInt(value, 10);
      }
      console.log('📅 Durée de session configurée:', this.formatDuration(this.sessionDuration));
    } catch (error) {
      console.error('Erreur init sessionService:', error);
    }
  }

  /**
   * Configure la durée de session
   * @param duration Durée en millisecondes
   */
  async setSessionDuration(duration: number): Promise<void> {
    this.sessionDuration = duration;
    await Preferences.set({
      key: STORAGE_KEYS.SESSION_DURATION,
      value: duration.toString()
    });
    console.log('📅 Nouvelle durée de session:', this.formatDuration(duration));
  }

  /**
   * Obtient la durée de session actuelle
   */
  getSessionDuration(): number {
    return this.sessionDuration;
  }

  /**
   * Configure la persistance Firebase
   * - Sur Android/iOS natif : Firebase persiste automatiquement (IndexedDB)
   * - Sur Web : utilise localStorage ou sessionStorage selon "Remember Me"
   */
  async configureFirebasePersistence(rememberMe: boolean): Promise<void> {
    try {
      // Sur mobile natif, Firebase persiste automatiquement via IndexedDB
      // On utilise indexedDBLocalPersistence qui fonctionne sur toutes les plateformes
      if (Capacitor.isNativePlatform()) {
        // Sur Android/iOS, toujours persister localement
        // La durée de session est gérée par notre sessionService, pas Firebase
        await setPersistence(auth, indexedDBLocalPersistence);
        console.log('🔐 Persistance Firebase (Natif): IndexedDB LOCAL');
      } else {
        // Sur Web, respecter le choix "Remember Me"
        const persistence = rememberMe 
          ? browserLocalPersistence 
          : browserSessionPersistence;
        
        await setPersistence(auth, persistence);
        console.log('🔐 Persistance Firebase (Web):', rememberMe ? 'LOCAL' : 'SESSION');
      }
      
      await Preferences.set({
        key: STORAGE_KEYS.REMEMBER_ME,
        value: rememberMe.toString()
      });
    } catch (error) {
      console.error('Erreur configuration persistance:', error);
    }
  }

  /**
   * Démarre une nouvelle session
   * @param token Token d'authentification
   * @param userData Données utilisateur
   * @param rememberMe Activer "Se souvenir de moi" (sur web uniquement)
   * 
   * La session expire après la durée configurée (par défaut 24h)
   * Sur Android, l'utilisateur reste connecté tant que la session n'expire pas
   */
  async startSession(token: string, userData: any, rememberMe: boolean = false): Promise<void> {
    const expiryTime = Date.now() + this.sessionDuration;

    // Configurer la persistance Firebase
    await this.configureFirebasePersistence(rememberMe);

    // Sauvegarder les données de session avec @capacitor/preferences
    // Ces données persistent même après fermeture de l'app sur Android
    await Promise.all([
      Preferences.set({ key: STORAGE_KEYS.AUTH_TOKEN, value: token }),
      Preferences.set({ key: STORAGE_KEYS.USER_DATA, value: JSON.stringify(userData) }),
      Preferences.set({ key: STORAGE_KEYS.SESSION_EXPIRY, value: expiryTime.toString() }),
      Preferences.set({ key: STORAGE_KEYS.REMEMBER_ME, value: rememberMe.toString() })
    ]);

    console.log('✅ Session démarrée');
    console.log('   📅 Durée:', this.formatDuration(this.sessionDuration));
    console.log('   ⏰ Expire le:', new Date(expiryTime).toLocaleString());
  }

  /**
   * Vérifie si la session est encore valide
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const { value: expiryStr } = await Preferences.get({ key: STORAGE_KEYS.SESSION_EXPIRY });
      
      if (!expiryStr) {
        return false;
      }

      const expiryTime = parseInt(expiryStr, 10);
      const isValid = Date.now() < expiryTime;

      if (!isValid) {
        console.log('⏰ Session expirée');
        await this.clearSession();
      }

      return isValid;
    } catch (error) {
      console.error('Erreur vérification session:', error);
      return false;
    }
  }

  /**
   * Prolonge la session actuelle
   */
  async extendSession(): Promise<void> {
    const { value: rememberMe } = await Preferences.get({ key: STORAGE_KEYS.REMEMBER_ME });
    
    if (rememberMe === 'true') {
      const newExpiry = Date.now() + this.sessionDuration;
      await Preferences.set({
        key: STORAGE_KEYS.SESSION_EXPIRY,
        value: newExpiry.toString()
      });
      console.log('🔄 Session prolongée jusqu\'au:', new Date(newExpiry).toLocaleString());
    }
  }

  /**
   * Récupère le temps restant avant expiration (en ms)
   */
  async getRemainingTime(): Promise<number> {
    const { value: expiryStr } = await Preferences.get({ key: STORAGE_KEYS.SESSION_EXPIRY });
    
    if (!expiryStr) {
      return 0;
    }

    const expiryTime = parseInt(expiryStr, 10);
    const remaining = expiryTime - Date.now();
    
    return Math.max(0, remaining);
  }

  /**
   * Récupère les données de session
   */
  async getSessionData(): Promise<{ token: string | null; user: any | null }> {
    const [tokenResult, userResult] = await Promise.all([
      Preferences.get({ key: STORAGE_KEYS.AUTH_TOKEN }),
      Preferences.get({ key: STORAGE_KEYS.USER_DATA })
    ]);

    return {
      token: tokenResult.value,
      user: userResult.value ? JSON.parse(userResult.value) : null
    };
  }

  /**
   * Efface toutes les données de session
   */
  async clearSession(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: STORAGE_KEYS.AUTH_TOKEN }),
      Preferences.remove({ key: STORAGE_KEYS.USER_DATA }),
      Preferences.remove({ key: STORAGE_KEYS.SESSION_EXPIRY }),
      Preferences.remove({ key: STORAGE_KEYS.REMEMBER_ME })
    ]);
    console.log('🗑️ Session effacée');
  }

  /**
   * Formate une durée en texte lisible
   */
  formatDuration(ms: number): string {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  }

  /**
   * Vérifie si "Se souvenir de moi" est activé
   */
  async isRememberMeEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.REMEMBER_ME });
    return value === 'true';
  }
}

export const sessionService = new SessionService();
