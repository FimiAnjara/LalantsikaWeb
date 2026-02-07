<template>
  <ion-page>
    <!-- Settings Menu (Lateral) -->
    <ion-menu side="start" content-id="main-content" menu-id="settings-menu" type="overlay">
      <ion-header>
        <ion-toolbar color="#0a1e37">
          <ion-title>Paramètres</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeSettings">
              <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item button @click="showAbout" detail>
            <ion-icon :icon="informationCircleOutline" slot="start"></ion-icon>
            <ion-label>À propos</ion-label>
          </ion-item>
          
          <ion-item button @click="refreshData" detail>
            <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
            <ion-label>Rafraîchir les données</ion-label>
          </ion-item>
          
          <ion-item button @click="goToModeSelection" detail>
            <ion-icon :icon="contrastOutline" slot="start"></ion-icon>
            <ion-label>Mode</ion-label>
          </ion-item>
          
          <ion-item button @click="logout" lines="none" class="logout-item">
            <ion-icon :icon="logOutOutline" slot="start" color="danger"></ion-icon>
            <ion-label color="danger">Déconnexion</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-content id="main-content" :fullscreen="true" class="home-page">
      <!-- Header -->
      <div class="header-container">
        <div class="header-content">
          <div class="app-info">
            <img src="/logo.png" alt="Lalantsika" class="app-logo" />
            <h1 class="app-name">Lalantsika</h1>
          </div>
          
          <div class="header-actions">
            <div class="status-indicator" :class="{ online: isOnline }">
              <span class="status-dot"></span>
              <span class="status-text">{{ isOnline ? 'En ligne' : 'Hors ligne' }}</span>
            </div>
            <ion-button fill="clear" @click="goToProfile" class="profile-btn">
              <ion-icon slot="icon-only" :icon="personCircleOutline"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content-container">
        <h2 class="section-title">Accueil</h2>
        
        <!-- Cards Grid -->
        <div class="cards-grid">
          <!-- Acceder a la carte -->
          <div class="action-card primary-card card-animate" style="animation-delay: 0.1s" @click="goToMap">
            <div class="card-icon-wrapper primary">
              <ion-icon :icon="mapOutline"></ion-icon>
            </div>
            <div class="card-content">
              <h3>Accéder à la carte</h3>
              <p>Visualisez les problèmes signalés</p>
            </div>
            <div class="card-preview">
              <div class="map-preview">
                <div class="map-marker"></div>
                <div class="map-marker"></div>
                <div class="map-marker"></div>
              </div>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="card-arrow"></ion-icon>
          </div>

          <!-- Signaler un probleme -->
          <div class="action-card secondary-card card-animate" style="animation-delay: 0.2s" @click="reportProblem">
            <div class="card-icon-wrapper secondary">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
            </div>
            <div class="card-content">
              <h3>Signaler un problème</h3>
              <p>Aidez à améliorer votre route</p>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="card-arrow"></ion-icon>
          </div>

          <!-- Voir mes signalements -->
          <div class="action-card accent-card card-animate" style="animation-delay: 0.3s" @click="viewMyReports">
            <div class="card-icon-wrapper accent">
              <ion-icon :icon="listOutline"></ion-icon>
            </div>
            <div class="card-content">
              <h3>Mes signalements</h3>
              <p>Consultez l'historique de vos signalements</p>
            </div>
            <ion-badge color="primary" class="badge-count">{{ reportsCount }}</ion-badge>
            <ion-icon :icon="chevronForwardOutline" class="card-arrow"></ion-icon>
          </div>

          <!-- About -->
          <div class="action-card info-card card-animate" style="animation-delay: 0.4s" @click="showAbout">
            <div class="card-icon-wrapper info">
              <ion-icon :icon="informationCircleOutline"></ion-icon>
            </div>
            <div class="card-content">
              <h3>À propos</h3>
              <p>En savoir plus sur Lalantsika</p>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="card-arrow"></ion-icon>
          </div>
        </div>
      </div>

      <!-- Settings Button (Floating) -->
      <ion-fab vertical="bottom" horizontal="start" slot="fixed">
        <ion-fab-button @click="openSettings" class="settings-fab">
          <ion-icon :icon="settingsOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButtons,
  menuController,
  alertController,
  toastController,
} from '@ionic/vue';
import {
  personCircleOutline,
  mapOutline,
  alertCircleOutline,
  listOutline,
  informationCircleOutline,
  settingsOutline,
  chevronForwardOutline,
  refreshOutline,
  contrastOutline,
  logOutOutline,
  closeOutline,
} from 'ionicons/icons';

const router = useRouter();
const isOnline = ref(true);
const reportsCount = ref(5);

// Navigation functions
const goToProfile = () => {
  router.push('/profile');
};

const goToMap = () => {
  router.push('/map');
};

const reportProblem = () => {
  // TODO: Navigate to report page
  console.log('Navigate to report problem page');
};

const viewMyReports = () => {
  router.push('/map?filter=myreports');
};

const goToModeSelection = async () => {
  await menuController.close('settings-menu');
  router.push('/mode');
};

const showAbout = async () => {
  await menuController.close('settings-menu');
  const alert = await alertController.create({
    header: 'À propos de Lalantsika',
    message:
      'Lalantsika est une application qui permet de signaler et visualiser les problèmes routiers pour améliorer la sécurité de tous.',
    buttons: ['OK'],
  });
  await alert.present();
};

const openSettings = async () => {
  await menuController.open('settings-menu');
};
const closeSettings = async () => {
  await menuController.close('settings-menu');
};

const refreshData = async () => {
  await menuController.close('settings-menu');
  const toast = await toastController.create({
    message: 'Données rafraîchies avec succès',
    duration: 2000,
    color: 'success',
    position: 'top',
  });
  await toast.present();
};

const logout = async () => {
  await menuController.close('settings-menu');
  const alert = await alertController.create({
    header: 'Déconnexion',
    message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
      },
      {
        text: 'Déconnexion',
        role: 'confirm',
        handler: () => {
          router.replace('/login');
        },
      },
    ],
  });
  await alert.present();
};
</script>

<style scoped>
.home-page {
  --background: #f8f9fa;
}

/* Header */
.header-container {
  background: linear-gradient(135deg, #0a1e37 0%, #081729 100%);
  padding: 1rem 1.5rem 2rem;
  box-shadow: 0 4px 12px rgba(10, 30, 55, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-logo {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
}

.app-name {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 2s infinite;
}

.status-indicator.online .status-dot {
  background: #22c55e;
}

.status-text {
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.profile-btn {
  --color: white;
  font-size: 2rem;
}

/* Content */
.content-container {
  padding: 1.5rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 1.5rem;
  letter-spacing: -0.5px;
}

/* Cards Grid */
.cards-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

.action-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(18, 94, 206, 0.15);
}

.action-card:active {
  transform: translateY(-2px);
}

.primary-card {
  grid-column: 1 / -1;
  flex-direction: column;
  align-items: flex-start;
  min-height: 180px;
}

.primary-card:hover {
  border-color: #feb000;
}

.card-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.card-icon-wrapper.primary {
  background: linear-gradient(135deg, #0a1e37 0%, #081729 100%);
  color: white;
}

.card-icon-wrapper.secondary {
  background: linear-gradient(135deg, #feb000 0%, #d99600 100%);
  color: white;
}

.card-icon-wrapper.accent {
  background: linear-gradient(135deg, #125ece 0%, #0d4a9f 100%);
  color: white;
}

.card-icon-wrapper.info {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.25rem;
}

.card-content p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
}

.card-arrow {
  font-size: 1.25rem;
  color: #adb5bd;
  flex-shrink: 0;
}

.badge-count {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

/* Map Preview */
.card-preview {
  width: 100%;
  margin-top: 1rem;
}

.map-preview {
  height: 100px;
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.map-marker {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #125ece;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.map-marker:nth-child(1) {
  top: 30%;
  left: 25%;
}

.map-marker:nth-child(2) {
  top: 50%;
  left: 60%;
}

.map-marker:nth-child(3) {
  top: 70%;
  left: 40%;
}

/* Settings FAB */
.settings-fab {
  --background: linear-gradient(135deg, #125ece 0%, #0d4a9f 100%);
  --box-shadow: 0 4px 16px rgba(18, 94, 206, 0.3);
}

/* Menu */
ion-menu ion-toolbar {
  --background: linear-gradient(135deg, #0a1e37 0%, #081729 100%);
  --color: white;
}

ion-menu ion-content {
  --background: white;
}

ion-menu ion-list {
  background: white;
  padding: 1rem 0;
}

ion-menu ion-item {
  --padding-start: 1rem;
  --color: #1a1a1a;
  --background: transparent;
  font-size: 1rem;
  margin: 0.25rem 0.5rem;
  border-radius: 8px;
}

ion-menu ion-item ion-icon {
  color: #0a1e37;
}

ion-menu ion-item ion-label {
  color: #1a1a1a;
}

ion-menu ion-item:hover {
  --background: rgba(10, 30, 55, 0.05);
}

.logout-item {
  margin-top: 2rem;
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

/* Animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.card-animate {
  animation: cardSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.section-title {
  animation: fadeInLeft 0.4s ease-out both;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.header-container {
  animation: headerSlide 0.5s ease-out both;
}

@keyframes headerSlide {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (min-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .primary-card {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1024px) {
  .content-container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>
