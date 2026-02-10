<template>
  <ion-page>
    <ion-content :fullscreen="true" class="welcome-page">
      <!-- Contenu de la page -->
      <div class="welcome-container">
        <!-- Logo et nom de l'app -->
        <div class="logo-section">
          <div class="logo-icon-wrapper">
             <img src="/logo/logo.png" alt="Lalantsika Logo" class="app-logo" />
          </div>
          <h1 class="app-name">Lalantsika</h1>
        </div>

        <!-- Bouton Get Started -->
        <div class="button-section">
          <ion-button 
            expand="block" 
            class="get-started-button"
            @click="handleGetStarted"
          >
            Commencer
          </ion-button>
          <p class="login-hint">J'ai déjà un compte</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { 
  IonPage, 
  IonContent, 
  IonButton
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useBackgroundAnimation } from '../composables/useBackgroundAnimation';
import { sessionService } from '@/services/auth';

const router = useRouter();
const { setSpeed } = useBackgroundAnimation();

onMounted(() => {
  // Reset speed to normal (simulating deceleration)
  setTimeout(() => {
    setSpeed(1);
  }, 100);
});

const handleGetStarted = async () => {
  // Marquer que l'utilisateur a vu la page de bienvenue
  await sessionService.completeFirstLaunch();
  
  // Naviguer vers la page de login
  router.push('/login');
};
</script>

<style scoped>
.welcome-page {
  --background: transparent;
}

/* Container principal */
.welcome-container {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 30px 50px;
}

/* Section logo */
.logo-section {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.logo-icon-wrapper {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  padding: 15px;
  background: rgba(232, 226, 219, 0.05); /* Slight off-white background */
  border-radius: 40px; /* Squircle/Rounded rect to match shapes */
  border: 1px solid rgba(232, 226, 219, 0.1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  transform: rotate(0deg); /* Reset rotation */
}

.app-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 15px rgba(0,0,0,0.4));
  transform: scale(1.1);
}

.app-name {
  font-size: 2rem; /* Slightly larger */
  font-weight: 900;
  background: linear-gradient(to right, #E8E2DB 20%, #FAB95B 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: #E8E2DB;
  margin: 10px 0 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); /* Drop shadow on gradient text */
  font-family: system-ui, -apple-system, sans-serif;
}

/* Section bouton */
.button-section {
  padding: 0 10px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

/* Bouton Get Started - White Pill Style */
.get-started-button {
  --background: #FFFFFF; /* Pure white/off-white for the pill */
  --color: #1A3263; /* Deep Blue text */
  --border-radius: 9999px; /* Full pill shape */
  --box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  height: 56px;
  font-size: 16px;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.get-started-button:hover {
  transform: translateY(-2px);
  --box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.get-started-button:active {
  transform: scale(0.98) translateY(0);
}

.login-hint {
  color: rgba(232, 226, 219, 0.6);
  font-size: 0.9rem;
  margin-top: 10px;
}

/* Animation d'entrée */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  animation: fadeInUp 0.8s ease-out;
}

.button-section {
  animation: fadeInUp 0.8s ease-out 0.3s backwards;
}

/* Responsive */
@media (max-height: 600px) {
  .logo-icon-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .app-name {
    font-size: 28px;
  }
  
  .get-started-button {
    height: 50px;
    font-size: 16px;
  }
}
</style>