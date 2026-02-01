<template>
  <ion-page>
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
        <ion-title>Détails du signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="report-details-page">
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
            <p><strong>Latitude:</strong> {{ latitude }}</p>
            <p><strong>Longitude:</strong> {{ longitude }}</p>
          </div>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="saveDetails" class="details-form">
          
          <!-- Titre -->
          <div class="form-group">
            <label for="title">Titre du signalement</label>
            <ion-input
              id="title"
              v-model="formData.title"
              type="text"
              placeholder="Ex: Route endommagée"
              :clear-input="true"
              class="custom-input"
            ></ion-input>
          </div>

          <!-- Type de problème -->
          <div class="form-group">
            <label for="type">Type de problème</label>
            <select v-model="formData.type" id="type" class="custom-select">
              <option value="danger">🔴 Danger (urgent)</option>
              <option value="warning">🟠 Attention (moyen)</option>
              <option value="info">🔵 Information</option>
            </select>
          </div>

          <!-- Catégorie -->
          <div class="form-group">
            <label for="category">Catégorie</label>
            <select v-model="formData.category" id="category" class="custom-select">
              <option value="">-- Sélectionnez une catégorie --</option>
              <option value="route-endommagee">Route endommagée</option>
              <option value="nid-de-poule">Nid de poule</option>
              <option value="travaux">Travaux en cours</option>
              <option value="accident">Accident</option>
              <option value="inondation">Inondation</option>
              <option value="obstacle">Obstacle sur la route</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label for="description">Description détaillée</label>
            <ion-textarea
              id="description"
              v-model="formData.description"
              placeholder="Décrivez le problème en détail..."
              :auto-grow="true"
              row="4"
              class="custom-textarea"
            ></ion-textarea>
          </div>

          <!-- Date du signalement -->
          <div class="form-group">
            <label for="date">Date du signalement</label>
            <ion-input
              id="date"
              v-model="formData.date"
              type="date"
              class="custom-input"
            ></ion-input>
          </div>

          <!-- Photo (optionnel) -->
          <div class="form-group">
            <label>Photo (optionnel)</label>
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
            <button type="submit" class="btn-save" :disabled="!isFormValid">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Enregistrer
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
  toastController 
} from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const latitude = ref('');
const longitude = ref('');

const formData = ref({
  title: '',
  type: 'danger',
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  photoUrl: ''
});

onMounted(() => {
  // Récupérer les coordonnées depuis la query
  latitude.value = route.query.lat as string || '';
  longitude.value = route.query.lng as string || '';
  formData.value.title = route.query.title as string || '';
});

const isFormValid = computed(() => {
  return formData.value.title.trim() !== '' && 
         formData.value.category !== '' &&
         formData.value.description.trim() !== '';
});

const goBack = () => {
  router.back();
};

const takePhoto = async () => {
  // Simuler la prise de photo (à remplacer par Capacitor Camera API)
  try {
    // TODO: Intégrer Capacitor Camera Plugin
    const toast = await toastController.create({
      message: 'Fonctionnalité photo à venir',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
  } catch (error) {
    console.error('Erreur lors de la prise de photo:', error);
  }
};

const removePhoto = () => {
  formData.value.photoUrl = '';
};

const saveDetails = async () => {
  if (!isFormValid.value) return;

  try {
    // TODO: Sauvegarder dans localStorage ou envoyer à l'API
    const reportDetails = {
      id: route.params.id,
      lat: parseFloat(latitude.value),
      lng: parseFloat(longitude.value),
      ...formData.value,
      updatedAt: new Date().toISOString()
    };

    console.log('Signalement sauvegardé:', reportDetails);

    // Afficher un message de succès
    const toast = await toastController.create({
      message: 'Détails enregistrés avec succès !',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    // Retourner à la page précédente
    setTimeout(() => {
      router.back();
    }, 500);

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    
    const toast = await toastController.create({
      message: 'Erreur lors de l\'enregistrement',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};
</script>

<style scoped>
.report-details-page {
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
