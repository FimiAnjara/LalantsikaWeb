<template>
  <ion-page>
    <ion-content fullscreen class="splash">
      <div class="splash-content">
        <div class="logo-wrapper" :class="{ 'moved-up': step >= 1 }">
           <img src="/logo/logo.png" class="logo-img" :class="{ 'active': startAnim }" alt="Logo" />
        </div>
        
        <div class="text-container" :class="{ 'fade-in': step >= 1 }">
          <h1 class="title">Lalantsika</h1>
        </div>

        <div class="loading-container" :class="{ 'fade-in': step >= 2 }">
          <p class="welcome-msg">Bienvenue</p>
          <div class="simple-loader">
             <div class="loader-bar"></div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useBackgroundAnimation } from '../composables/useBackgroundAnimation'

const router = useRouter()
const step = ref(0)
const startAnim = ref(false)
const { setSpeed } = useBackgroundAnimation()

onMounted(() => {
  // Ensure we start at normal speed
  setSpeed(1)

  // Start logo entrance animation
  setTimeout(() => {
    startAnim.value = true
  }, 100)

  // Wait a bit then move to next step (simulating the animation duration)
  setTimeout(() => {
    nextStep()
  }, 1200)
})

const nextStep = () => {
  if (step.value > 0) return
  step.value = 1
  
  // Show title very quickly
  setTimeout(() => {
    step.value = 2
    
    // Quick look at the welcome message then go
    setTimeout(() => {
      // Accelerate background for transition
      setSpeed(4)
      
      router.replace('/login')
    }, 1200)
  }, 200)
}
</script>

<style scoped>
.splash {
  --background: transparent;
}

.splash::part(scroll) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.splash-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  position: relative;
  width: 100%;
  z-index: 1;
}

.logo-wrapper {
  width: 200px;
  height: 200px;
  margin-bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 2;
}

.logo-wrapper.moved-up {
  transform: translateY(-40px) scale(0.85);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo-img.active {
  opacity: 1;
  transform: scale(1);
}

.text-container {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out;
  text-align: center;
  margin-top: -20px; 
}

.text-container.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.title {
  font-size: 2.8rem;
  font-weight: 800;
  background: linear-gradient(to bottom right, #E8E2DB, #FAB95B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: #E8E2DB; /* Fallback */
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.loading-container {
  margin-top: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transition: opacity 0.8s ease;
  min-height: 80px;
}

.loading-container.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.welcome-msg {
  color: #E8E2DB;
  font-size: 0.85rem;
  margin-bottom: 20px;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: 500;
}

.simple-loader {
  width: 60px;
  height: 4px;
  background: rgba(232, 226, 219, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.loader-bar {
  width: 100%;
  height: 100%;
  background: #FAB95B; /* Golden Yellow */
  transform: translateX(-100%);
  animation: loading 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}
</style>
