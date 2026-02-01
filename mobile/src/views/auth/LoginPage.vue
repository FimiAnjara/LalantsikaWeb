<template>
  <ion-page>
    <ion-content class="login-content">
      <div class="logo-section">
        <div class="logo-placeholder">
          <div class="lalana-texte">
            <img src="/logo/lalantsika.png" alt="" class="lalana-img">  
          </div>
          <div class="logo-circle">
            <img src="/logo/logo.png" alt="" class="logo-img rotating-logo">
          </div>
        </div>
      </div>
      
      <div class="form-container">
        <h1 class="title">Welcome back</h1>
        <p class="subtitle">Sign in to enjoy the best experience</p>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 6l10 7 10-7"/>
              </svg>
              <ion-input
                type="email"
                placeholder="email@example.com"
                class="form-input"
                v-model="email"
                required
              ></ion-input>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <ion-input
                :type="showPassword ? 'text' : 'password'"
                placeholder="password"
                class="form-input"
                v-model="password"
                required
              ></ion-input>
              <svg 
                v-if="!showPassword"
                class="eye-icon"
                @click="showPassword = !showPassword"
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg 
                v-else
                class="eye-icon"
                @click="showPassword = !showPassword"
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </div>
          </div>

          <div class="form-options">
            <div class="remember-me">
              <ion-checkbox v-model="rememberMe"></ion-checkbox>
              <span>Remember me</span>
            </div>
            <a href="#" class="forgot-password">Forgot Password?</a>
          </div>

          <ion-button 
            expand="block" 
            class="login-btn"
            type="submit"
            :disabled="loading"
          >
            <span v-if="!loading">Log in</span>
            <ion-spinner v-else name="circles"></ion-spinner>
          </ion-button>
        </form>

        <div class="divider">
          <span>Or login with</span>
        </div>

        <div class="social-buttons">
          <button class="social-btn google-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>
          <button class="social-btn apple-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          </button>
          <button class="social-btn facebook-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
        </div>

        <p class="signup-text">
          Don't have an account? Contact us!
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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
import router from '@/router';
import { authService } from '@/services/auth';
import { getFullName, isManager } from '@/models/User';

const email = ref('testuser@example.com');
const password = ref('password123');
const rememberMe = ref(false);
const showPassword = ref(false);
const loading = ref(false);

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
  --background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0;
  height: 100%;
}

.logo-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.lalana-texte {
  order: 1;
}

.lalana-img {
  margin-bottom: 20px;
  width: 100px;
  height: auto;
}

.logo-circle {
  order: 2;
  width: 150px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Ombre au sol sous le logo */
.logo-circle::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 20px;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: shadowPulse 4s infinite;
}

@keyframes shadowPulse {
  0%, 100% {
    opacity: 0.5;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translateX(-50%) scale(1.1);
  }
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Animation de rotation avec pause */
.rotating-logo {
  animation: spinAndPause 4s infinite;
}

@keyframes spinAndPause {
  /* Rotation de 0% à 50% de l'animation (2 secondes sur 4) */
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(360deg);
  }
  /* Pause de 50% à 100% (2 secondes de repos) */
  100% {
    transform: rotateY(360deg);
  }
}

.form-container {
  background: white;
  border-radius: 28px 28px 28px 28px;
  padding: 2rem 1.5rem 2.5rem;
  width: 100%;
  min-height: 75vh;
  animation: slideUp 0.6s ease-out;
}

.title {
  color: #000;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.3rem 0;
  text-align: center;
}

.subtitle {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-label {
  display: block;
  color: #333;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.4rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid #ddd;
  border-radius: 20px;
  background: #ffffff;
  transition: border-color 0.3s ease;
}


.input-icon {
  position: absolute;
  left: 1rem;
  width: 20px;
  height: 20px;
  color: #0a1e37;
  z-index: 10;
  pointer-events: none;
}

.form-input {
  --background: transparent;
  --padding-start: 3rem;
  --padding-end: 3rem;
  --padding-top: 0.9rem;
  --padding-bottom: 0.9rem;
  --placeholder-color: #999;
  --placeholder-opacity: 1;
  --color: #333;
  border: none;
  font-size: 0.95rem;
  flex: 1;
}

.form-input {
  --highlight-color-focused: #b1a352;  /* Couleur quand focus (jaune) */
  --highlight-height: 2px;          /* Épaisseur du soulignement */
}

.eye-icon {
  position: absolute;
  right: 1rem;
  width: 20px;
  height: 20px;
  color: #0a1e37;
  cursor: pointer;
  z-index: 10;
  transition: color 0.3s ease;
}

.eye-icon:hover {
  color: #0a1e37;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.remember-me ion-checkbox {
  --size: 18px;
  margin: 0;
}

.forgot-password {
  color: #0a1e37;
  text-decoration: none;
  font-weight: 500;
}

.login-btn {
  --background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  --border-radius: 12px;
  --padding-top: 1rem;
  --padding-bottom: 1rem;
  color: #dabe24;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
  font-size: 1rem;
  text-transform: none;
}

.divider {
  text-align: center;
  position: relative;
  margin: 1.5rem 0;
  color: #999;
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background: #e0e0e0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.social-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.social-btn {
  width: 55px;
  height: 55px;
  border-radius: 20px;
  border: 2px solid #e0e0e0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.social-btn ion-icon,
.social-btn svg {
  font-size: 1.6rem;
  width: 24px;
  height: 24px;
}

.google-btn:hover {
  background: #fff;
  border-color: #DB4437;
}

.google-btn svg {
  display: block;
}

.apple-btn:hover {
  background: #000;
  border-color: #000;
}

.apple-btn svg {
  color: #000;
}

.apple-btn:hover svg {
  color: #fff;
}

.facebook-btn:hover {
  background: #1877F2;
  border-color: #1877F2;
}

.facebook-btn svg {
  color: #1877F2;
}

.facebook-btn:hover svg {
  color: #fff;
}

.signup-text {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.signup-link {
  color: #0a1e37;
  font-weight: 600;
  text-decoration: none;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
