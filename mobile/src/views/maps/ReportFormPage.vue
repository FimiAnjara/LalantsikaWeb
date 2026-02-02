<template>
  <ion-page>
    <!-- Spinner de chargement -->
    <SpinnerLoader 
      v-if="isSubmitting" 
      :fullscreen="true" 
      :message="loadingMessage" 
    />
    
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </ion-button>
        </ion-buttons>
        <ion-title>Nouveau signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="report-form-page">
      <div class="form-container">
        
        <!-- Localisation -->
        <div class="location-section">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Localisation
          </h3>
          <div class="location-info">
            <p v-if="cityName" class="city-display">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a1e37" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Près de <strong>{{ cityName }}</strong>
            </p>
            <p v-else-if="isLoadingCity" class="city-loading">
              <span class="mini-spinner"></span>
              Recherche de la localisation...
            </p>
            <p class="coordinates-display">
              <span><strong>Lat:</strong> {{ latitude }}</span>
              <span><strong>Lng:</strong> {{ longitude }}</span>
            </p>
          </div>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="saveReport" class="details-form">

          <!-- Description -->
          <div class="form-group">
            <label for="description">Description du problème *</label>
            <ion-textarea
              id="description"
              v-model="formData.description"
              placeholder="Décrivez le problème en détail..."
              :auto-grow="true"
              :rows="4"
              class="custom-textarea"
              required
            ></ion-textarea>
          </div>

          <!-- Surface estimée -->
          <div class="form-group">
            <label for="surface">Surface estimée (m²) - Optionnel</label>
            <ion-input
              id="surface"
              v-model.number="formData.surface"
              type="number"
              inputmode="decimal"
              placeholder="Ex: 50.5"
              class="custom-input"
            ></ion-input>
          </div>

          <!-- Photo (optionnel) -->
          <div class="form-group">
            <label>Photo - Optionnel</label>
            <button type="button" @click="takePhoto" class="photo-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Ajouter une photo</span>
            </button>
            <div v-if="formData.photoUrl" class="photo-preview">
              <img :src="formData.photoUrl" alt="Photo du signalement" />
              <button type="button" @click="removePhoto" class="remove-photo-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Boutons d'action -->
          <div class="form-actions">
            <button type="button" @click="goBack" class="btn-cancel">
              Annuler
            </button>
            <button type="submit" class="btn-save" :disabled="!isFormValid || isSubmitting">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>

        </form>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton,
  IonInput,
  IonTextarea,
  toastController,
  loadingController,
  actionSheetController
} from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { signalementService } from '@/services/signalement';
import { photoService } from '@/services/photo';
import SpinnerLoader from '@/components/SpinnerLoader.vue';

const route = useRoute();
const router = useRouter();

const latitude = ref('');
const longitude = ref('');
const cityName = ref('');
const isSubmitting = ref(false);
const isLoadingCity = ref(false);
const loadingMessage = ref('Enregistrement en cours...');

const formData = ref({
  description: '',
  surface: null as number | null,
  photoUrl: ''
});

onMounted(async () => {
  // Récupérer les coordonnées
  latitude.value = route.query.lat as string || '';
  longitude.value = route.query.lng as string || '';
  
  // Récupérer le nom de la ville passé en paramètre ou le chercher
  if (route.query.city) {
    cityName.value = route.query.city as string;
  } else if (latitude.value && longitude.value) {
    await fetchCityName();
  }
});

// Récupérer le nom de la ville via reverse geocoding
const fetchCityName = async () => {
  if (!latitude.value || !longitude.value) return;
  
  isLoadingCity.value = true;
  try {
    // Zoom 18 pour obtenir le niveau de détail le plus précis (quartier, rue)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude.value}&lon=${longitude.value}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    if (data && data.address) {
      // Afficher tous les champs disponibles pour le diagnostic
      console.log('📍 ===== DONNÉES DE LOCALISATION =====');
      console.log('📍 Adresse complète:', data.address);
      console.log('📍 neighbourhood (quartier):', data.address.neighbourhood);
      console.log('📍 suburb (banlieue):', data.address.suburb);
      console.log('📍 hamlet (hameau):', data.address.hamlet);
      console.log('📍 village:', data.address.village);
      console.log('📍 town (petite ville):', data.address.town);
      console.log('📍 city_district:', data.address.city_district);
      console.log('📍 city (ville):', data.address.city);
      console.log('📍 municipality:', data.address.municipality);
      console.log('📍 county:', data.address.county);
      console.log('📍 state:', data.address.state);
      console.log('📍 road (rue):', data.address.road);
      console.log('📍 display_name:', data.display_name);
      console.log('📍 =====================================');
      
      // Priorité aux noms de quartiers/lieux précis
      cityName.value = data.address.neighbourhood ||  // Quartier (Ankadifotsy, etc.)
                       data.address.suburb ||          // Banlieue
                       data.address.hamlet ||          // Hameau
                       data.address.village ||         // Village (Ilafy, etc.)
                       data.address.town ||            // Petite ville
                       data.address.city_district ||   // District de ville
                       data.address.city ||            // Ville
                       data.address.municipality ||    // Municipalité
                       data.address.county ||          // Région
                       data.address.state ||           // État/Province
                       'Localisation inconnue';
    }
  } catch (error) {
    console.error('Erreur lors du reverse geocoding:', error);
    cityName.value = '';
  } finally {
    isLoadingCity.value = false;
  }
};

const isFormValid = computed(() => {
  return formData.value.description.trim() !== '' &&
         latitude.value !== '' &&
         longitude.value !== '';
});

const goBack = () => {
  router.back();
};

const takePhoto = async () => {
  try {
    // Afficher le choix entre caméra et galerie
    const actionSheet = await actionSheetController.create({
      header: 'Ajouter une photo',
      buttons: [
        {
          text: 'Prendre une photo',
          icon: 'camera',
          handler: () => {
            captureFromCamera();
          }
        },
        {
          text: 'Choisir depuis la galerie',
          icon: 'images',
          handler: () => {
            pickFromGallery();
          }
        },
        {
          text: 'Annuler',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  } catch (error) {
    console.error('Erreur lors de l\'affichage du menu photo:', error);
  }
};

const captureFromCamera = async () => {
  try {
    const result = await photoService.takePhoto({ quality: 80 });
    if (result && result.dataUrl) {
      formData.value.photoUrl = result.dataUrl;
      const toast = await toastController.create({
        message: 'Photo ajoutée !',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
    }
  } catch (error: any) {
    console.error('Erreur lors de la prise de photo:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la prise de photo',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const pickFromGallery = async () => {
  try {
    const result = await photoService.pickFromGallery({ quality: 80 });
    if (result && result.dataUrl) {
      formData.value.photoUrl = result.dataUrl;
      const toast = await toastController.create({
        message: 'Photo ajoutée !',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
    }
  } catch (error: any) {
    console.error('Erreur lors de la sélection de photo:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la sélection de photo',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const removePhoto = () => {
  formData.value.photoUrl = '';
};

const saveReport = async () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  loadingMessage.value = 'Enregistrement en cours...';

  try {
    // Utiliser le service pour créer le signalement
    // Champs utilisateur uniquement: point, description, surface, photo, city
    // daty et utilisateur sont ajoutés automatiquement
    const signalement = await signalementService.createSignalement({
      latitude: parseFloat(latitude.value),
      longitude: parseFloat(longitude.value),
      description: formData.value.description,
      surface: formData.value.surface || undefined,
      photo: formData.value.photoUrl || undefined,
      city: cityName.value || undefined
    });

    console.log('Signalement créé:', signalement);

    isSubmitting.value = false;

    const toast = await toastController.create({
      message: 'Signalement enregistré avec succès !',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    // Retourner à la page de la carte
    setTimeout(() => {
      router.push({ name: 'Map' });
    }, 1000);

  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    isSubmitting.value = false;

    let errorMessage = 'Erreur lors de l\'enregistrement';
    
    if (error.message === 'Utilisateur non connecté') {
      errorMessage = 'Vous devez être connecté pour créer un signalement';
    } else if (error.code) {
      // Erreur Firebase
      errorMessage = `Erreur Firebase: ${error.code} - ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    const toast = await toastController.create({
      message: errorMessage,
      duration: 5000,
      color: 'danger'
    });
    await toast.present();

    // Si non connecté, rediriger vers login
    if (error.message === 'Utilisateur non connecté') {
      setTimeout(() => {
        router.push({ name: 'Login' });
      }, 1500);
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.report-form-page {
  --background: #f5f5f5;
}

ion-toolbar {
  --background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  --color: white;
}

ion-title {
  font-weight: 600;
}

ion-button {
  --color: white;
}

.form-container {
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

/* Section localisation */
.location-section {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.location-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 1rem 0;
}

.location-info p {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.city-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem !important;
  color: #0a1e37 !important;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-bottom: 0.75rem !important;
}

.city-display strong {
  color: #2e7d32;
}

.city-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top-color: #cfb824;
  border-radius: 50%;
  animation: mini-spin 0.8s linear infinite;
}

@keyframes mini-spin {
  to { transform: rotate(360deg); }
}

.coordinates-display {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem !important;
  color: #999 !important;
}

.coordinates-display span {
  display: flex;
  gap: 0.25rem;
}

/* Formulaire */
.details-form {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #0a1e37;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.custom-input,
.custom-textarea {
  --background: #f8f9fa;
  --border-radius: 10px;
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 0.75rem;
  --padding-bottom: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 0.95rem;
}

.custom-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.custom-select:focus {
  outline: none;
  border-color: #0a1e37;
  background: white;
}

/* Bouton photo */
.photo-btn {
  width: 100%;
  padding: 1rem;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.photo-btn:hover {
  background: #e9ecef;
  border-color: #0a1e37;
  color: #0a1e37;
}

.photo-preview {
  position: relative;
  margin-top: 1rem;
  border-radius: 10px;
  overflow: hidden;
}

.photo-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-photo-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  background: rgba(220, 53, 69, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-photo-btn:hover {
  background: #dc3545;
  transform: scale(1.1);
}

/* Boutons d'action */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: #e9ecef;
  color: #666;
}

.btn-cancel:hover {
  background: #dee2e6;
}

.btn-save {
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(10, 30, 55, 0.3);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
