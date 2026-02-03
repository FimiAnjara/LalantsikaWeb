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
          <button class="social-btn google-btn">
            <ion-icon :icon="logoGoogle"></ion-icon>
          </button>
          <button class="social-btn facebook-btn">
            <ion-icon :icon="logoFacebook"></ion-icon>
          </button>
          <button class="social-btn apple-btn">
            <ion-icon :icon="logoApple"></ion-icon>
          </button>
        </div>

        <p class="signup-text">
          Vous n'avez pas de compte ? <a href="#" class="signup-link">Inscrivez-vous</a>
        </p>
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
  IonSpinner,
  toastController 
} from '@ionic/vue';
import { 
  personOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline,
  logoGoogle,
  logoFacebook,
  logoApple
} from 'ionicons/icons';
import router from '@/router';
import { authService } from '@/services/auth';
import { getFullName, isManager } from '@/models/User';
import { useBackgroundAnimation } from '@/composables/useBackgroundAnimation';

const email = ref('testuser@example.com');
const password = ref('password123');
const rememberMe = ref(false);
const showPassword = ref(false);
const loading = ref(false);

const { setSpeed } = useBackgroundAnimation();

onMounted(() => {
  // Reset speed to normal just in case
  setSpeed(1);
});

/* Toast */
const showToast = async (
  message: string,
  color: 'success' | 'danger' | 'warning' = 'danger'
) => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color,
    cssClass: 'custom-toast'
  });
  await toast.present();
};

/* LOGIN */
const handleLogin = async () => {
  if (!email.value || !password.value) {
    await showToast(
      'Veuillez remplir tous les champs',
      'warning'
    );
    return;
  }

  loading.value = true;

  try {
    const response = await authService.login(
      email.value,
      password.value
    );

    if (rememberMe.value) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } else {
      sessionStorage.setItem('authToken', response.token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
    }

    await showToast(
      `Bienvenue ${getFullName(response.user)} !`,
      'success'
    );

    if (isManager(response.user)) {
      router.push({ name: 'Map' });
    } else {
      router.push({ name: 'Map' });
    }
  } catch (error: any) {
    console.error(error);
    
    // Gestion des erreurs de tentatives
    if (error.message === 'COMPTE_BLOQUE') {
      await showToast(
        '🔒 Votre compte est bloqué. Veuillez contacter le responsable pour le déblocage.',
        'danger'
      );
    } else if (error.message === 'MAX_TENTATIVES') {
      await showToast(
        '🚫 Maximum de tentatives atteint ! Votre compte a été bloqué. Contactez le responsable pour le déblocage.',
        'danger'
      );
    } else if (error.message.startsWith('TENTATIVE_ECHOUEE:')) {
      const remaining = error.message.split(':')[1];
      await showToast(
        `❌ Mot de passe incorrect. ${remaining} tentative(s) restante(s) avant blocage.`,
        'warning'
      );
    } else {
      await showToast(
        error.message || 'Erreur lors de la connexion'
      );
    }
  } finally {
    loading.value = false;
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
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.social-btn {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 6px 15px rgba(0,0,0,0.1);
}

.social-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.social-btn ion-icon {
  font-size: 1.5rem;
  color: white;
}

.google-btn { background: #EA4335; }
.facebook-btn { background: #1877F2; }
.apple-btn { background: #000000; }

/* Signup Text */
.signup-text {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.signup-link {
  color: #FAB95B;
  font-weight: 700;
  text-decoration: none;
  position: relative;
}

.signup-link::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -2px;
  left: 0;
  background-color: #FAB95B;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.signup-link:hover::after {
  transform: scaleX(1);
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
</style>
