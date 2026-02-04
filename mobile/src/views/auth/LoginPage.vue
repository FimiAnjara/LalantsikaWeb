<template>
  <ion-page>
    <ion-content class="login-content" :fullscreen="true">
      <!-- Top Section (Transparent to show GeometricBackground) -->
      <div class="top-section">
        <div class="logo-wrapper">
          <div class="logo-circle">
            <img src="/logo/logo.png" alt="Logo" class="logo-img">
          </div>
        </div>
      </div>
      
      <!-- Bottom Sheet Form -->
      <div class="form-container">
        <h2 class="title">Bonjour !</h2>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <div class="input-wrapper">
              <ion-icon class="input-icon" :icon="personOutline"></ion-icon>
              <ion-input
                type="email"
                placeholder="Nom d'utilisateur ou Email"
                class="form-input"
                v-model="email"
                required
              ></ion-input>
            </div>
          </div>

          <div class="form-group">
            <div class="input-wrapper">
              <ion-icon class="input-icon" :icon="lockClosedOutline"></ion-icon>
              <ion-input
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mot de passe"
                class="form-input"
                v-model="password"
                required
              ></ion-input>
              <ion-icon 
                :icon="showPassword ? eyeOffOutline : eyeOutline"
                class="eye-icon"
                @click="showPassword = !showPassword"
              ></ion-icon>
            </div>
          </div>

          <div class="form-options">
            <div class="remember-me">
              <ion-checkbox v-model="rememberMe"></ion-checkbox>
              <span>Se souvenir de moi</span>
            </div>
            <a href="#" class="forgot-password">Mot de passe oublié ?</a>
          </div>

          <ion-button 
            expand="block" 
            class="login-btn"
            type="submit"
            :disabled="loading"
          >
            <span v-if="!loading">Se connecter</span>
            <ion-spinner v-else name="crescent"></ion-spinner>
          </ion-button>
        </form>

        <div class="divider">
          <span>ou continuer avec</span>
        </div>

        <div class="social-buttons">
          <button 
            class="google-login-btn" 
            @click="handleGoogleLogin"
            :disabled="googleLoading"
          >
            <ion-spinner v-if="googleLoading" name="crescent" class="google-spinner"></ion-spinner>
            <template v-else>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="google-icon">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continuer avec Google</span>
            </template>
          </button>
        </div>


      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, 
  IonContent, 
  IonInput, 
  IonButton, 
  IonCheckbox, 
  IonIcon, 
  IonSpinner
} from '@ionic/vue';
import { 
  personOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline
} from 'ionicons/icons';
import router from '@/router';
import { authService, googleAuthService, sessionService } from '@/services/auth';
import { toastService } from '@/services/toast';
import { getFullName, isManager } from '@/models/User';
import { useBackgroundAnimation } from '@/composables/useBackgroundAnimation';

const email = ref('testuser@example.com');
const password = ref('password123');
const rememberMe = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const googleLoading = ref(false);

const { setSpeed } = useBackgroundAnimation();

onMounted(() => {
  // Reset speed to normal just in case
  setSpeed(1);
});

/* LOGIN */
const handleLogin = async () => {
  if (!email.value || !password.value) {
    toastService.warning('Veuillez remplir tous les champs');
    return;
  }

  loading.value = true;

  try {
    const response = await authService.login(
      email.value,
      password.value
    );

    await saveUserSession(response);

    toastService.success(
      `Bienvenue ${getFullName(response.user)} !`,
      'Connexion réussie'
    );

    // Attendre que le toast s'affiche avant de naviguer
    setTimeout(() => {
      router.push({ name: 'Map' });
    }, 800);
  } catch (error: any) {
    console.error(error);
    handleLoginError(error);
  } finally {
    loading.value = false;
  }
};

/* GOOGLE LOGIN */
const handleGoogleLogin = async () => {
  googleLoading.value = true;

  try {
    const response = await googleAuthService.signIn();
    
    await saveUserSession(response);

    toastService.success(
      `Bienvenue ${getFullName(response.user)} !`,
      'Connexion Google réussie'
    );

    // Attendre que le toast s'affiche avant de naviguer
    setTimeout(() => {
      router.push({ name: 'Map' });
    }, 800);
  } catch (error: any) {
    console.error(error);
    
    if (error.message === 'Connexion annulée') {
      // Ne rien afficher si l'utilisateur a annulé
      return;
    }
    
    toastService.error(error.message || 'Erreur lors de la connexion Google');
  } finally {
    googleLoading.value = false;
  }
};

/* Sauvegarder la session utilisateur */
const saveUserSession = async (response: any) => {
  await sessionService.startSession(response.token, response.user, rememberMe.value);
};

/* Gestion des erreurs de connexion */
const handleLoginError = (error: any) => {
  if (error.message === 'COMPTE_BLOQUE') {
    toastService.error(
      'Votre compte est bloqué. Contactez le responsable pour le déblocage.',
      'Compte bloqué'
    );
  } else if (error.message === 'MAX_TENTATIVES') {
    toastService.error(
      'Maximum de tentatives atteint ! Votre compte a été bloqué.',
      'Compte bloqué'
    );
  } else if (error.message === 'NETWORK_ERROR') {
    toastService.error(
      'Vérifiez votre connexion internet et réessayez.',
      'Erreur de connexion'
    );
  } else if (error.message === 'MANAGER_NON_AUTORISE') {
    toastService.error(
      'Les managers ne peuvent pas se connecter sur l\'application mobile.',
      'Accès refusé'
    );
  } else if (error.message.startsWith('TENTATIVE_ECHOUEE:')) {
    const remaining = error.message.split(':')[1];
    toastService.warning(
      `Mot de passe incorrect. ${remaining} tentative(s) restante(s) avant blocage.`
    );
  } else {
    toastService.error(error.message || 'Erreur lors de la connexion');
  }
};
</script>

<style scoped>
.login-content {
  --background: transparent;
}

/* Header Section */
.top-section {
  height: 35vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.logo-circle {
  width: 130px;
  height: 130px;
  background: rgba(255, 255, 255, 0.1); /* Glassmorphism */
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 35px; /* Squircle */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.3);
  animation: floatLogo 6s ease-in-out infinite;
}

@keyframes floatLogo {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 5px 15px rgba(0,0,0,0.2));
}

.app-name {
  color: #E8E2DB;
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
  text-transform: capitalize;
  text-shadow: 0 4px 15px rgba(0,0,0,0.3);
  letter-spacing: 1px;
}

/* Bottom Sheet */
.form-container {
  background: white;
  border-top-left-radius: 40px;
  border-top-right-radius: 40px;
  padding: 2.5rem 2rem;
  min-height: 65vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
}

.title {
  color: #1A3263;
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 2rem 0;
  text-align: center;
}

.form-group {
  margin-bottom: 1.2rem;
}

/* Pill Input Styles */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #E0E0E0;
  border-radius: 999px; /* Pill shape */
  background: #F8F9FA; /* Slight grey background input */
  padding: 5px 20px;
  height: 60px; /* Taller input */
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #1A3263;
  background: #ffffff;
  box-shadow: 0 4px 15px rgba(26, 50, 99, 0.15);
  transform: translateY(-1px);
}

.input-icon {
  font-size: 1.4rem;
  color: #999;
  margin-right: 12px;
}

.input-wrapper:focus-within .input-icon {
  color: #1A3263;
}

.form-input {
  --background: transparent;
  --padding-start: 0;
  --padding-end: 0;
  --placeholder-color: #999;
  --color: #333;
  margin-top: -2px; 
}

.eye-icon {
  font-size: 1.4rem;
  color: #999;
  cursor: pointer;
}

/* Options */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  padding: 0 10px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.remember-me ion-checkbox {
  --size: 18px;
  --checkbox-background-checked: #1A3263;
  --border-color-checked: #1A3263;
  margin: 0;
}

.forgot-password {
  color: #1A3263;
  text-decoration: none;
  font-weight: 600;
}

/* Login Button */
.login-btn {
  --background: linear-gradient(90deg, #1A3263 0%, #3e5f9e 100%);
  --background-activated: #0d1a33;
  --border-radius: 999px;
  --box-shadow: 0 10px 25px rgba(26, 50, 99, 0.4);
  height: 60px;
  font-size: 1.15rem;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.5px;
  color: white;
  margin: 0 0 2rem 0;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  --box-shadow: 0 14px 28px rgba(26, 50, 99, 0.5);
}

.login-btn:active {
  transform: scale(0.98);
}

/* Divider */
.divider {
  text-align: center;
  position: relative;
  margin: 0 0 1.5rem 0;
  color: #999;
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background: #E0E0E0;
}

.divider::before { left: 0; }
.divider::after { right: 0; }

/* Social Buttons */
.social-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.google-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 60px;
  border-radius: 999px;
  border: 2px solid #E0E0E0;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  padding: 0 24px;
  font-size: 1.05rem;
  font-weight: 600;
  color: #333;
}

.google-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  border-color: #4285F4;
  background: #f8f9ff;
}

.google-login-btn:active {
  transform: scale(0.98);
}

.google-login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.google-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.google-spinner {
  width: 24px;
  height: 24px;
  color: #4285F4;
}



@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Breakpoints */

/* Small Phones (iPhone SE, small Androids) - Width based */
@media (max-width: 375px) {
  .form-container {
    padding: 2rem 1.5rem;
    border-top-left-radius: 30px;
    border-top-right-radius: 30px;
  }

  .title {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
  }

  .logo-circle {
    width: 110px;
    height: 110px;
    border-radius: 28px;
  }

  .app-name {
    font-size: 2rem;
  }
  
  .social-btn {
    width: 45px;
    height: 45px;
  }
}

/* Short Screens (Old phones or landscapeish) - Height based */
@media (max-height: 700px) {
  .top-section {
    height: 30vh;
  }
  
  .form-container {
    min-height: 70vh;
    padding: 1.5rem 1.5rem;
  }
  
  .logo-wrapper {
    gap: 10px;
  }
  
  .logo-circle {
    width: 100px;
    height: 100px;
    padding: 15px;
  }
  
  .app-name {
    font-size: 1.8rem;
  }
  
  .title {
    margin-bottom: 1.5rem;
  }
  
  .form-options {
    margin-bottom: 1.5rem;
  }
  
  .login-btn {
    height: 50px;
    margin-bottom: 1.5rem;
  }
}

/* Very Small Screens */
@media (max-width: 340px) {
  .form-container {
    padding: 1.5rem 1rem;
  }
  
  .input-wrapper {
    height: 50px;
    padding: 0 15px;
  }
  
  .app-name {
    font-size: 1.6rem;
  }
}
</style>
