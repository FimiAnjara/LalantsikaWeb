<template>
  <ion-page>
    <!-- Spinner de chargement -->
    <SpinnerLoader 
      v-if="isLoading" 
      :fullscreen="true" 
      message="Chargement du signalement..." 
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
        <ion-title>Détails du signalement</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="editSignalement" v-if="canEdit">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="details-page">
      <div v-if="signalement" class="details-container">
        
        <!-- Section principale avec photos et infos côte à côte -->
        <div class="main-section">
          <!-- Photos du signalement (première entrée historique) -->
          <div class="photo-section">
            <div v-if="mainPhotos.length > 0" class="main-photos-container">
              <!-- Photo principale -->
              <div class="photo-container main-photo" @click="openGalleryMain(0)">
                <img :src="mainPhotos[0]" alt="Photo du signalement" class="signalement-photo" />
                <div class="photo-overlay">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <!-- Badge nombre de photos -->
                <div v-if="mainPhotos.length > 1" class="photos-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                  {{ mainPhotos.length }}
                </div>
              </div>
              <!-- Miniatures des autres photos -->
              <div v-if="mainPhotos.length > 1" class="photo-thumbnails">
                <div 
                  v-for="(photo, index) in mainPhotos.slice(1, 4)" 
                  :key="index"
                  class="thumbnail"
                  @click="openGalleryMain(index + 1)"
                >
                  <img :src="photo" :alt="'Photo ' + (index + 2)" />
                  <div v-if="index === 2 && mainPhotos.length > 4" class="more-overlay">
                    +{{ mainPhotos.length - 4 }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-photo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Pas de photo</span>
            </div>
          </div>
          
          <!-- Informations principales -->
          <div class="info-section">
            <!-- Statut -->
            <div class="status-badge-container">
              <span class="status-badge" :style="{ backgroundColor: getStatutColor(signalement.statut.id_statut) }">
                {{ signalement.statut.libelle }}
              </span>
            </div>
            
            <!-- Localisation -->
            <div class="info-item location-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Lieu</span>
                <span class="info-value">{{ signalement.city || 'Non défini' }}</span>
                <span class="coordinates">
                  {{ signalement.point.latitude.toFixed(6) }}, {{ signalement.point.longitude.toFixed(6) }}
                </span>
              </div>
            </div>
            
            <!-- Surface -->
            <div class="info-item" v-if="signalement.surface">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a1e37" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Surface</span>
                <span class="info-value">{{ formatSurface(signalement.surface) }}</span>
              </div>
            </div>
            
            <!-- Budget -->
            <div class="info-item" v-if="signalement.budget">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Budget</span>
                <span class="info-value">{{ formatBudget(signalement.budget) }}</span>
              </div>
            </div>
            
            <!-- Entreprise -->
            <div class="info-item" v-if="signalement.entreprise">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Entreprise responsable</span>
                <span class="info-value">{{ signalement.entreprise.nom }}</span>
              </div>
            </div>
            
            <!-- Utilisateur -->
            <div class="info-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a1e37" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Signalé par</span>
                <span class="info-value">{{ getUserName(signalement.utilisateur) }}</span>
              </div>
            </div>
            
            <!-- Date -->
            <div class="info-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Date du signalement</span>
                <span class="info-value">{{ formatDate(signalement.daty) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Description -->
        <div class="description-section">
          <h3>Description</h3>
          <p>{{ signalement.description || 'Aucune description fournie.' }}</p>
        </div>
        
        <!-- Historique des statuts avec photos -->
        <div class="history-section">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Historique des statuts
            <span class="history-count" v-if="histoStatuts.length > 0">({{ histoStatuts.length }})</span>
          </h3>
          
          <div v-if="isLoadingHistory" class="loading-history">
            <span class="mini-spinner"></span>
            Chargement de l'historique...
          </div>
          
          <div v-else-if="histoStatuts.length === 0" class="empty-history">
            <p>Aucun historique disponible</p>
          </div>
          
          <div v-else class="history-timeline">
            <div 
              v-for="(histo, index) in histoStatuts" 
              :key="histo.id" 
              class="history-item"
              :class="{ 'first-item': index === 0 }"
            >
              <div class="timeline-marker">
                <div class="marker-dot" :style="{ backgroundColor: getStatutColor(histo.statut?.id_statut || 1) }"></div>
                <div v-if="index < histoStatuts.length - 1" class="marker-line"></div>
              </div>
              
              <div class="history-content">
                <!-- Header avec statut et date -->
                <div class="history-header">
                  <span class="history-status" :style="{ color: getStatutColor(histo.statut?.id_statut || 1) }">
                    {{ histo.statut?.libelle || 'Statut inconnu' }}
                  </span>
                  <span class="history-date">{{ formatDate(histo.daty) }}</span>
                </div>
                
                <!-- Description -->
                <p v-if="histo.description" class="history-description">{{ histo.description }}</p>
                
                <!-- Galerie de photos (nouveau design) -->
                <div v-if="getHistoImages(histo).length > 0" class="history-gallery">
                  <div class="gallery-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>{{ getHistoImages(histo).length }} photo{{ getHistoImages(histo).length > 1 ? 's' : '' }}</span>
                  </div>
                  <div class="gallery-grid" :class="{ 'single': getHistoImages(histo).length === 1, 'double': getHistoImages(histo).length === 2, 'multi': getHistoImages(histo).length > 2 }">
                    <div 
                      v-for="(image, imgIndex) in getHistoImages(histo).slice(0, 4)" 
                      :key="imgIndex"
                      class="gallery-item"
                      @click="openGallery(histo, imgIndex)"
                    >
                      <img :src="image" :alt="'Photo ' + (imgIndex + 1)" />
                      <!-- Overlay pour voir plus de photos -->
                      <div v-if="imgIndex === 3 && getHistoImages(histo).length > 4" class="more-photos-overlay">
                        <span>+{{ getHistoImages(histo).length - 4 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      <!-- Message si signalement non trouvé -->
      <div v-else-if="!isLoading" class="not-found">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Signalement non trouvé</h3>
        <p>Le signalement demandé n'existe pas ou a été supprimé.</p>
        <button @click="goBack" class="btn-back">Retour</button>
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
  toastController,
  modalController
} from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { signalementService } from '@/services/signalement';
import { Signalement, formatBudget, formatSurface, formatSignalementDate, UtilisateurRef } from '@/models/Signalement';
import { getStatutColor } from '@/models/Statut';
import SpinnerLoader from '@/components/SpinnerLoader.vue';
import { auth } from '@/services/firebase/config';

const route = useRoute();
const router = useRouter();

const signalement = ref<Signalement | null>(null);
const histoStatuts = ref<any[]>([]);
const isLoading = ref(true);
const isLoadingHistory = ref(false);

// L'utilisateur peut modifier si c'est son signalement
const canEdit = computed(() => {
  if (!signalement.value || !auth.currentUser) return false;
  return signalement.value.utilisateur?.firebase_uid === auth.currentUser.uid;
});

// Photos principales (du premier historique - la création)
const mainPhotos = computed(() => {
  if (histoStatuts.value.length === 0) return [];
  
  // Trouver l'historique de création (le dernier dans la liste car trié desc)
  const creationHisto = histoStatuts.value[histoStatuts.value.length - 1];
  return getHistoImages(creationHisto);
});

// Récupérer les images d'un historique (gère les deux formats: images[] et image)
const getHistoImages = (histo: any): string[] => {
  if (!histo) return [];
  
  const images: string[] = [];
  
  // Nouveau format: tableau d'images
  if (histo.images && Array.isArray(histo.images)) {
    images.push(...histo.images);
  }
  
  // Ancien format: image unique
  if (histo.image && !images.includes(histo.image)) {
    images.push(histo.image);
  }
  
  return images;
};

// Ouvrir la galerie d'images pour un historique
const openGallery = (histo: any, startIndex: number = 0) => {
  const images = getHistoImages(histo);
  if (images.length > 0 && images[startIndex]) {
    openImage(images[startIndex]);
  }
};

// Ouvrir la galerie principale
const openGalleryMain = (index: number = 0) => {
  if (mainPhotos.value.length > 0 && mainPhotos.value[index]) {
    openImage(mainPhotos.value[index]);
  }
};

onMounted(async () => {
  await loadSignalement();
});

const loadSignalement = async () => {
  isLoading.value = true;
  
  try {
    const signalementId = route.params.id as string;
    
    if (!signalementId) {
      throw new Error('ID du signalement manquant');
    }
    
    // Charger le signalement
    signalement.value = await signalementService.getSignalementById(signalementId);
    
    if (signalement.value) {
      // Charger l'historique des statuts
      await loadHistoStatuts(signalementId);
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement du signalement:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du chargement',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    isLoading.value = false;
  }
};

const loadHistoStatuts = async (signalementId: string) => {
  isLoadingHistory.value = true;
  
  try {
    histoStatuts.value = await signalementService.getHistoStatuts(signalementId);
    console.log('Historique chargé:', histoStatuts.value);
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error);
  } finally {
    isLoadingHistory.value = false;
  }
};

const goBack = () => {
  router.back();
};

const editSignalement = () => {
  if (signalement.value?.firebase_id) {
    router.push({
      name: 'EditSignalement',
      params: { id: signalement.value.firebase_id }
    });
  }
};

const formatDate = (daty: string): string => {
  if (!daty) return 'Non définie';
  try {
    const date = new Date(daty);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return daty;
  }
};

const getUserName = (utilisateur?: UtilisateurRef): string => {
  if (!utilisateur) return 'Utilisateur inconnu';
  
  if (utilisateur.prenom && utilisateur.nom) {
    return `${utilisateur.prenom} ${utilisateur.nom}`;
  }
  
  return utilisateur.identifiant || 'Utilisateur';
};

const openImage = (imageUrl: string) => {
  // Ouvrir l'image en plein écran
  window.open(imageUrl, '_blank');
};
</script>

<style scoped>
.details-page {
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

.details-container {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

/* Section principale */
.main-section {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

/* Photo */
.photo-section {
  flex: 0 0 140px;
  width: 140px;
}

.photo-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.photo-container:active {
  transform: scale(0.98);
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-container:hover .photo-overlay {
  opacity: 1;
}

.signalement-photo {
  width: 100%;
  height: 140px;
  display: block;
  object-fit: cover;
}

.no-photo {
  background: #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  color: #999;
  font-size: 0.75rem;
  height: 140px;
}

/* Informations */
.info-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-badge-container {
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.info-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.info-label {
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-weight: 600;
  color: #0a1e37;
  font-size: 0.95rem;
}

.coordinates {
  font-size: 0.75rem;
  color: #999;
  font-family: monospace;
}

/* Description */
.description-section {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.description-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 0.75rem 0;
}

.description-section p {
  margin: 0;
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Historique */
.history-section {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 1rem 0;
}

.loading-history,
.empty-history {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #999;
  font-size: 0.9rem;
  padding: 1rem 0;
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e9ecef;
  border-top-color: #0a1e37;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Timeline */
.history-timeline {
  position: relative;
}

.history-item {
  display: flex;
  gap: 1rem;
  padding-bottom: 1.5rem;
}

.history-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.marker-line {
  width: 2px;
  flex: 1;
  background: #e9ecef;
  margin-top: 4px;
}

.history-content {
  flex: 1;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.75rem;
  overflow: hidden;
}

.first-item .history-content {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.history-status {
  font-weight: 600;
  font-size: 0.85rem;
}

.history-date {
  font-size: 0.7rem;
  color: #999;
}

.history-description {
  margin: 0.25rem 0 0 0;
  color: #555;
  font-size: 0.8rem;
  line-height: 1.4;
}

.history-count {
  background: #0a1e37;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

/* Galerie de photos dans l'historique */
.history-gallery {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.gallery-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.gallery-grid {
  display: grid;
  gap: 0.5rem;
}

.gallery-grid.single {
  grid-template-columns: 1fr;
}

.gallery-grid.double {
  grid-template-columns: repeat(2, 1fr);
}

.gallery-grid.multi {
  grid-template-columns: repeat(4, 1fr);
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.gallery-item:hover {
  transform: scale(1.02);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-photos-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 30, 55, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
}

/* Photos principales améliorées */
.main-photos-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.main-photo {
  position: relative;
}

.photos-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(10, 30, 55, 0.85);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.photo-thumbnails {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
}

.thumbnail {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.thumbnail:hover img {
  transform: scale(1.05);
}

.more-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 30, 55, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
  font-weight: 700;
}

/* État non trouvé */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.not-found h3 {
  margin: 1rem 0 0.5rem;
  color: #0a1e37;
}

.not-found p {
  color: #999;
  margin-bottom: 1.5rem;
}

.btn-back {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
</style>
