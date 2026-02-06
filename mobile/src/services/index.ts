// Services d'authentification
export { default as authService } from './auth';
export { googleAuthService, sessionService, SESSION_DURATIONS } from './auth';

// Services de référence (données statiques avec cache)
export { sexeService, typeUtilisateurService, statutService } from './reference';

// Services utilisateur
export { utilisateurService, statutUtilisateurService } from './utilisateur';

// Services de signalement
export { signalementService, histoStatutService } from './signalement';

// Services de paramètres
export { parametreService } from './parametre';

// Services de notification
export { toastService } from './toast';
