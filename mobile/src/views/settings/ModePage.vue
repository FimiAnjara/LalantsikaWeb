<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Sélection du Mode</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="mode-page">
      <div class="mode-container">
        <!-- Header Section -->
        <div class="header-section">
          <ion-icon :icon="contrastOutline" class="header-icon"></ion-icon>
          <h1 class="page-title">Choisissez votre mode</h1>
          <p class="page-subtitle">Personnalisez l'apparence de l'application selon vos préférences</p>
        </div>

        <!-- Mode Cards -->
        <div class="modes-grid">
          <!-- Light Mode -->
          <div
            class="mode-card"
            :class="{ active: selectedMode === 'light' }"
            @click="selectMode('light')"
          >
            <div class="mode-preview light-preview">
              <div class="preview-header"></div>
              <div class="preview-content">
                <div class="preview-card"></div>
                <div class="preview-card"></div>
              </div>
            </div>
            <div class="mode-info">
              <ion-icon :icon="sunnyOutline" class="mode-icon"></ion-icon>
              <h3 class="mode-name">Mode Clair</h3>
              <p class="mode-description">Interface lumineuse et épurée</p>
            </div>
            <div class="mode-check" v-if="selectedMode === 'light'">
              <ion-icon :icon="checkmarkCircle"></ion-icon>
            </div>
          </div>

          <!-- Dark Mode -->
          <div
            class="mode-card"
            :class="{ active: selectedMode === 'dark' }"
            @click="selectMode('dark')"
          >
            <div class="mode-preview dark-preview">
              <div class="preview-header"></div>
              <div class="preview-content">
                <div class="preview-card"></div>
                <div class="preview-card"></div>
              </div>
            </div>
            <div class="mode-info">
              <ion-icon :icon="moonOutline" class="mode-icon"></ion-icon>
              <h3 class="mode-name">Mode Sombre</h3>
              <p class="mode-description">Réduit la fatigue oculaire</p>
            </div>
            <div class="mode-check" v-if="selectedMode === 'dark'">
              <ion-icon :icon="checkmarkCircle"></ion-icon>
            </div>
          </div>

          <!-- Auto Mode -->
          <div
            class="mode-card"
            :class="{ active: selectedMode === 'auto' }"
            @click="selectMode('auto')"
          >
            <div class="mode-preview auto-preview">
              <div class="preview-split">
                <div class="preview-half light"></div>
                <div class="preview-half dark"></div>
              </div>
            </div>
            <div class="mode-info">
              <ion-icon :icon="phonePortraitOutline" class="mode-icon"></ion-icon>
              <h3 class="mode-name">Mode Automatique</h3>
              <p class="mode-description">S'adapte aux paramètres système</p>
            </div>
            <div class="mode-check" v-if="selectedMode === 'auto'">
              <ion-icon :icon="checkmarkCircle"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Additional Options -->
        <div class="options-card">
          <h3 class="options-title">Options supplémentaires</h3>
          <ion-list>
            <ion-item>
              <ion-icon :icon="colorPaletteOutline" slot="start"></ion-icon>
              <ion-label>Couleur d'accentuation</ion-label>
              <div class="color-selector">
                <button
                  v-for="color in accentColors"
                  :key="color.value"
                  class="color-button"
                  :class="{ active: selectedAccent === color.value }"
                  :style="{ background: color.color }"
                  @click="selectAccent(color.value)"
                ></button>
              </div>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="textOutline" slot="start"></ion-icon>
              <ion-label>Taille du texte</ion-label>
              <ion-select v-model="fontSize" interface="popover">
                <ion-select-option value="small">Petit</ion-select-option>
                <ion-select-option value="medium">Normal</ion-select-option>
                <ion-select-option value="large">Grand</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </div>

        <!-- Apply Button -->
        <div class="action-section">
          <ion-button expand="block" @click="applyChanges" class="apply-btn">
            <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
            Appliquer les changements
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  toastController,
} from '@ionic/vue';
import {
  contrastOutline,
  sunnyOutline,
  moonOutline,
  phonePortraitOutline,
  checkmarkCircle,
  colorPaletteOutline,
  textOutline,
  checkmarkOutline,
} from 'ionicons/icons';

const router = useRouter();
const selectedMode = ref('light');
const selectedAccent = ref('blue');
const fontSize = ref('medium');

const accentColors = [
  { value: 'blue', color: '#125ece' },
  { value: 'yellow', color: '#feb000' },
  { value: 'green', color: '#22c55e' },
  { value: 'purple', color: '#8b5cf6' },
  { value: 'red', color: '#ef4444' },
];

onMounted(() => {
  // Load saved preferences
  const savedMode = localStorage.getItem('theme-mode') || 'light';
  const savedAccent = localStorage.getItem('accent-color') || 'blue';
  const savedFontSize = localStorage.getItem('font-size') || 'medium';

  selectedMode.value = savedMode;
  selectedAccent.value = savedAccent;
  fontSize.value = savedFontSize;
});

const selectMode = (mode: string) => {
  selectedMode.value = mode;
};

const selectAccent = (accent: string) => {
  selectedAccent.value = accent;
};

const applyChanges = async () => {
  // Save preferences
  localStorage.setItem('theme-mode', selectedMode.value);
  localStorage.setItem('accent-color', selectedAccent.value);
  localStorage.setItem('font-size', fontSize.value);

  // Apply theme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  let isDark = selectedMode.value === 'dark';

  if (selectedMode.value === 'auto') {
    isDark = prefersDark.matches;
  }

  document.body.classList.toggle('dark', isDark);

  // Show success message
  const toast = await toastController.create({
    message: 'Paramètres appliqués avec succès',
    duration: 2000,
    color: 'success',
    position: 'top',
  });
  await toast.present();

  // Navigate back
  setTimeout(() => {
    router.back();
  }, 500);
};
</script>

<style scoped>
.mode-page {
  --background: #f8f9fa;
}

.mode-container {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  text-align: center;
  padding: 2rem 0;
}

.header-icon {
  font-size: 4rem;
  color: #0a1e37;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #6c757d;
  margin: 0;
}

/* Modes Grid */
.modes-grid {
  display: grid;
  gap: 1rem;
  margin: 2rem 0;
}

.mode-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(10, 30, 55, 0.15);
}

.mode-card.active {
  border-color: #0a1e37;
  box-shadow: 0 8px 24px rgba(10, 30, 55, 0.2);
}

/* Mode Preview */
.mode-preview {
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.light-preview {
  background: #ffffff;
}

.light-preview .preview-header {
  height: 30px;
  background: linear-gradient(135deg, #0a1e37 0%, #081729 100%);
}

.light-preview .preview-content {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.light-preview .preview-card {
  height: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.dark-preview {
  background: #1a1a1a;
}

.dark-preview .preview-header {
  height: 30px;
  background: linear-gradient(135deg, #0a1e37 0%, #081729 100%);
}

.dark-preview .preview-content {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dark-preview .preview-card {
  height: 20px;
  background: #2d2d2d;
  border-radius: 4px;
}

.auto-preview {
  background: transparent;
  padding: 0;
}

.preview-split {
  display: flex;
  height: 100%;
}

.preview-half {
  flex: 1;
  position: relative;
}

.preview-half.light {
  background: #ffffff;
}

.preview-half.dark {
  background: #1a1a1a;
}

.preview-half.light::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(135deg, #0a1e37 0%, #081729 100%);
}

.preview-half.dark::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(135deg, #0a1e37 0%, #081729 100%);
}

/* Mode Info */
.mode-info {
  text-align: center;
}

.mode-icon {
  font-size: 2.5rem;
  color: #0a1e37;
  margin-bottom: 0.5rem;
}

.mode-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.25rem;
}

.mode-description {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
}

.mode-check {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  color: #22c55e;
  animation: scaleIn 0.3s ease;
}

/* Options Card */
.options-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.options-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1rem;
}

ion-list {
  background: transparent;
  padding: 0;
}

ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
  margin-bottom: 1rem;
}

ion-item:last-child {
  margin-bottom: 0;
}

/* Color Selector */
.color-selector {
  display: flex;
  gap: 0.5rem;
}

.color-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-button:hover {
  transform: scale(1.1);
}

.color-button.active {
  border-color: white;
  box-shadow: 0 0 0 2px #0a1e37, 0 2px 8px rgba(10, 30, 55, 0.3);
}

/* Action Section */
.action-section {
  margin-top: 2rem;
}

.apply-btn {
  --background: linear-gradient(135deg, #0a1e37 0%, #081729 100%);
  --box-shadow: 0 4px 16px rgba(10, 30, 55, 0.3);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  height: 48px;
}

.apply-btn:hover {
  --box-shadow: 0 6px 20px rgba(10, 30, 55, 0.4);
}

/* Animations */
@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

/* Responsive Design */
@media (min-width: 768px) {
  .modes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
