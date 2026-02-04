<template>
  <ion-page>
    <!-- Spinner de chargement -->
    <SpinnerLoader 
      v-if="isSubmitting || isLoading" 
      :fullscreen="true" 
      :message="isLoading ? 'Chargement...' : loadingMessage" 
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
        <ion-title>{{ pageTitle }}</ion-title>
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

          <!-- Photos (optionnel - plusieurs possibles) -->
          <div class="form-group">
            <label>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Photos - Optionnel
              <span class="photo-count" v-if="formData.photos.length > 0">({{ formData.photos.length }})</span>
            </label>
            
            <!-- Grille de photos -->
            <div class="photos-grid" v-if="formData.photos.length > 0">
              <div 
                v-for="(photo, index) in formData.photos" 
                :key="index" 
                class="photo-item"
              >
                <img :src="photo" :alt="'Photo ' + (index + 1)" />
                <button type="button" @click="removePhoto(index)" class="remove-photo-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <span class="photo-number">{{ index + 1 }}</span>
              </div>
            </div>
            
            <!-- Bouton ajouter photo -->
            <button type="button" @click="addPhoto" class="photo-btn" :class="{ 'has-photos': formData.photos.length > 0 }">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>{{ formData.photos.length > 0 ? 'Ajouter une autre photo' : 'Ajouter une photo' }}</span>
            </button>
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
import { Signalement } from '@/models/Signalement';

// Props pour le mode édition
const props = defineProps<{
  editMode?: boolean;
  signalementId?: string;
}>();

const route = useRoute();
const router = useRouter();

const latitude = ref('');
const longitude = ref('');
const cityName = ref('');
const isSubmitting = ref(false);
const isLoading = ref(false);
const isLoadingCity = ref(false);
const loadingMessage = ref('Enregistrement en cours...');
const existingSignalement = ref<Signalement | null>(null);

// Titre dynamique
const pageTitle = computed(() => props.editMode ? 'Modifier le signalement' : 'Nouveau signalement');

const formData = ref({
  description: '',
  surface: null as number | null,
  photos: [] as string[] // Tableau de photos (URLs ou base64)
});

onMounted(async () => {
  // Mode édition: charger le signalement existant
  if (props.editMode && props.signalementId) {
    await loadExistingSignalement();
  } else {
    // Mode création: récupérer les coordonnées de la route
    latitude.value = route.query.lat as string || '';
    longitude.value = route.query.lng as string || '';
    
    // Récupérer le nom de la ville passé en paramètre ou le chercher
    if (route.query.city) {
      cityName.value = route.query.city as string;
    } else if (latitude.value && longitude.value) {
      await fetchCityName();
    }
  }
});

// Charger un signalement existant pour modification
const loadExistingSignalement = async () => {
  if (!props.signalementId) return;
  
  isLoading.value = true;
  
  try {
    const signalement = await signalementService.getSignalementById(props.signalementId);
    
    if (signalement) {
      existingSignalement.value = signalement;
      
      // Remplir le formulaire avec les données existantes
      latitude.value = signalement.point.latitude.toString();
      longitude.value = signalement.point.longitude.toString();
      cityName.value = signalement.city || '';
      formData.value.description = signalement.description || '';
      formData.value.surface = signalement.surface || null;
      
      // Charger les photos de l'historique de création
      const histoStatuts = await signalementService.getHistoStatuts(props.signalementId);
      if (histoStatuts.length > 0) {
        // Récupérer toutes les images de tous les historiques
        const allImages: string[] = [];
        for (const histo of histoStatuts) {
          if (histo.images && Array.isArray(histo.images)) {
            allImages.push(...histo.images);
          } else if (histo.image) {
            allImages.push(histo.image);
          }
        }
        formData.value.photos = allImages;
      }
    } else {
      throw new Error('Signalement non trouvé');
    }
  } catch (error) {
    console.error('Erreur lors du chargement du signalement:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du chargement du signalement',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
    router.back();
  } finally {
    isLoading.value = false;
  }
};

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

const addPhoto = async () => {
  try {
    // Vérifier si on est sur une plateforme native
    const isNative = photoService.isNativePlatform();
    
    // Afficher le choix entre caméra et galerie
    const actionSheet = await actionSheetController.create({
      header: 'Ajouter une photo',
      subHeader: !isNative ? '(Mode navigateur: sélection depuis fichiers)' : undefined,
      buttons: [
        {
          text: isNative ? 'Prendre une photo' : 'Prendre/Choisir une photo',
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
    // Demander les permissions si nécessaire
    await photoService.requestPermissions();
    
    const result = await photoService.takePhoto({ quality: 80 });
    if (result && result.dataUrl) {
      formData.value.photos.push(result.dataUrl);
      const toast = await toastController.create({
        message: `Photo ${formData.value.photos.length} ajoutée !`,
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
      formData.value.photos.push(result.dataUrl);
      const toast = await toastController.create({
        message: `Photo ${formData.value.photos.length} ajoutée !`,
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

const removePhoto = (index: number) => {
  formData.value.photos.splice(index, 1);
};

const saveReport = async () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  loadingMessage.value = props.editMode ? 'Modification en cours...' : 'Enregistrement en cours...';

  try {
    if (props.editMode && props.signalementId) {
      // Mode édition: mettre à jour le signalement existant
      // Construire l'objet de mise à jour sans valeurs undefined (Firebase les refuse)
      const updateData: Record<string, any> = {
        description: formData.value.description
      };
      
      // N'ajouter que les champs avec des valeurs définies
      if (formData.value.surface !== null && formData.value.surface !== undefined) {
        updateData.surface = formData.value.surface;
      }
      if (formData.value.photos.length > 0) {
        updateData.photos = formData.value.photos;
      }
      
      await signalementService.updateSignalement(props.signalementId, updateData);

      console.log('Signalement modifié:', props.signalementId);

      const toast = await toastController.create({
        message: 'Signalement modifié avec succès !',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      // Retourner à la page de détails
      setTimeout(() => {
        router.back();
      }, 1000);
    } else {
      // Mode création: créer un nouveau signalement avec photos multiples
      const signalement = await signalementService.createSignalement({
        latitude: parseFloat(latitude.value),
        longitude: parseFloat(longitude.value),
        description: formData.value.description,
        surface: formData.value.surface || undefined,
        photos: formData.value.photos.length > 0 ? formData.value.photos : undefined,
        city: cityName.value || undefined
      });

      console.log('Signalement créé:', signalement);

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
    }

  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

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
  --color: #0a1e37;
  --placeholder-color: #999;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #0a1e37;
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

.photo-btn.has-photos {
  padding: 0.75rem;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-color: #4caf50;
  color: #2e7d32;
}

.photo-btn:hover {
  background: #e9ecef;
  border-color: #0a1e37;
  color: #0a1e37;
}

.photo-btn.has-photos:hover {
  background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
}

/* Label photo avec icône */
.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.photo-count {
  background: #0a1e37;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.25rem;
}

/* Grille de photos */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background: #f5f5f5;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-item:hover img {
  transform: scale(1.05);
}

.photo-item .remove-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(220, 53, 69, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.photo-item:hover .remove-photo-btn {
  opacity: 1;
}

.photo-item .remove-photo-btn:hover {
  background: #dc3545;
  transform: scale(1.1);
}

.photo-number {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(10, 30, 55, 0.8);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
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
