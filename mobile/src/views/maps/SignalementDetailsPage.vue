<template>
  <ion-page>
    <!-- Spinner de chargement -->
    <SpinnerLoader 
      v-if="isLoading" 
      :fullscreen="true" 
      message="Chargement du signalement..." 
    />
    
    <!-- Lightbox pour afficher les photos en grand -->
    <PhotoLightbox 
      :photos="currentGalleryPhotos"
      :initial-index="lightboxIndex"
      :is-open="showLightbox"
      @close="showLightbox = false"
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
        
        <!-- Header avec statut -->
        <div class="status-header">
          <span class="status-badge" :style="{ backgroundColor: getStatutColor(signalement.statut.id_statut) }">
            {{ signalement.statut.libelle }}
          </span>
          <span class="date-info">{{ formatDate(signalement.daty) }}</span>
        </div>
        
        <!-- Galerie de photos horizontale -->
        <div class="photos-gallery" v-if="allPhotos.length > 0">
          <div class="gallery-scroll">
            <div 
              v-for="(photo, index) in displayedPhotos" 
              :key="index"
              class="gallery-photo"
              @click="openLightbox(allPhotos, index)"
            >
              <img :src="photo" :alt="'Photo ' + (index + 1)" />
            </div>
            <!-- Bouton voir plus -->
            <div 
              v-if="allPhotos.length > maxPhotosToShow && !showAllPhotos"
              class="gallery-photo see-more"
              @click="showAllPhotos = true"
            >
              <span class="more-count">+{{ allPhotos.length - maxPhotosToShow }}</span>
              <span class="more-text">Voir tout</span>
            </div>
          </div>
          <div class="photos-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {{ allPhotos.length }} photo{{ allPhotos.length > 1 ? 's' : '' }}
          </div>
        </div>
        
        <!-- Pas de photos -->
        <div v-else class="no-photos">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Aucune photo</span>
        </div>
        
        <!-- Informations principales -->
        <div class="info-card">
          <!-- Localisation -->
          <div class="info-row location">
            <div class="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="info-details">
              <span class="info-label">Localisation</span>
              <span class="info-value">{{ signalement.city || 'Lieu non défini' }}</span>
              <span class="info-sub">{{ signalement.point.latitude.toFixed(5) }}, {{ signalement.point.longitude.toFixed(5) }}</span>
            </div>
          </div>
          
          <!-- Signalé par -->
          <div class="info-row">
            <div class="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a1e37" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="info-details">
              <span class="info-label">Signalé par</span>
              <span class="info-value">{{ getUserName(signalement.utilisateur) }}</span>
            </div>
          </div>
          
          <!-- Surface -->
          <div class="info-row" v-if="signalement.surface">
            <div class="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#17a2b8" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
            </div>
            <div class="info-details">
              <span class="info-label">Surface estimée</span>
              <span class="info-value">{{ formatSurface(signalement.surface) }}</span>
            </div>
          </div>
          
          <!-- Budget -->
          <div class="info-row" v-if="signalement.budget">
            <div class="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="info-details">
              <span class="info-label">Budget estimé</span>
              <span class="info-value">{{ formatBudget(signalement.budget) }}</span>
            </div>
          </div>
          
          <!-- Entreprise -->
          <div class="info-row" v-if="signalement.entreprise">
            <div class="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div class="info-details">
              <span class="info-label">Entreprise responsable</span>
              <span class="info-value">{{ signalement.entreprise.nom }}</span>
            </div>
          </div>
        </div>
        
        <!-- Description -->
        <div class="description-card" v-if="signalement.description">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="17" y1="10" x2="3" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
            Description
          </h3>
          <p>{{ signalement.description }}</p>
        </div>
        
        <!-- Historique des statuts -->
        <div class="history-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Historique
            <span class="badge" v-if="histoStatuts.length > 0">{{ histoStatuts.length }}</span>
          </h3>
          
          <div v-if="isLoadingHistory" class="loading-state">
            <span class="spinner"></span>
            Chargement...
          </div>
          
          <div v-else-if="histoStatuts.length === 0" class="empty-state">
            Aucun historique disponible
          </div>
          
          <div v-else class="timeline">
            <div 
              v-for="(histo, index) in histoStatuts" 
              :key="histo.id" 
              class="timeline-item"
            >
              <div class="timeline-dot" :style="{ backgroundColor: getStatutColor(histo.statut?.id_statut || 1) }"></div>
              <div class="timeline-connector" v-if="index < histoStatuts.length - 1"></div>
              
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-status" :style="{ color: getStatutColor(histo.statut?.id_statut || 1) }">
                    {{ histo.statut?.libelle || 'Inconnu' }}
                  </span>
                  <span class="timeline-date">{{ formatDateShort(histo.daty) }}</span>
                </div>
                
                <p v-if="histo.description" class="timeline-description">{{ histo.description }}</p>
                
                <!-- Photos de l'historique -->
                <div v-if="getHistoImages(histo).length > 0" class="timeline-photos">
                  <div 
                    v-for="(img, imgIdx) in getHistoImages(histo).slice(0, 3)" 
                    :key="imgIdx"
                    class="timeline-photo"
                    @click="openLightbox(getHistoImages(histo), imgIdx)"
                  >
                    <img :src="img" :alt="'Photo ' + (imgIdx + 1)" />
                    <div v-if="imgIdx === 2 && getHistoImages(histo).length > 3" class="photo-more">
                      +{{ getHistoImages(histo).length - 3 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      <!-- Signalement non trouvé -->
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
  toastController
} from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { signalementService } from '@/services/signalement';
import { Signalement, formatBudget, formatSurface, UtilisateurRef } from '@/models/Signalement';
import { getStatutColor } from '@/models/Statut';
import SpinnerLoader from '@/components/SpinnerLoader.vue';
import PhotoLightbox from '@/components/PhotoLightbox.vue';
import { auth } from '@/services/firebase/config';

const route = useRoute();
const router = useRouter();

const signalement = ref<Signalement | null>(null);
const histoStatuts = ref<any[]>([]);
const isLoading = ref(true);
const isLoadingHistory = ref(false);

// Lightbox state
const showLightbox = ref(false);
const lightboxIndex = ref(0);
const currentGalleryPhotos = ref<string[]>([]);

// Photos display
const maxPhotosToShow = 5;
const showAllPhotos = ref(false);

// L'utilisateur peut modifier si c'est son signalement
const canEdit = computed(() => {
  if (!signalement.value || !auth.currentUser) return false;
  return signalement.value.utilisateur?.firebase_uid === auth.currentUser.uid;
});

// Toutes les photos du signalement (de tous les historiques)
const allPhotos = computed(() => {
  const photos: string[] = [];
  histoStatuts.value.forEach(histo => {
    photos.push(...getHistoImages(histo));
  });
  return photos;
});

// Photos à afficher (limitées ou toutes)
const displayedPhotos = computed(() => {
  if (showAllPhotos.value) return allPhotos.value;
  return allPhotos.value.slice(0, maxPhotosToShow);
});

// Récupérer les images d'un historique
const getHistoImages = (histo: any): string[] => {
  if (!histo) return [];
  const images: string[] = [];
  
  if (histo.images && Array.isArray(histo.images)) {
    images.push(...histo.images);
  }
  if (histo.image && !images.includes(histo.image)) {
    images.push(histo.image);
  }
  
  return images;
};

// Ouvrir la lightbox
const openLightbox = (photos: string[], index: number = 0) => {
  currentGalleryPhotos.value = photos;
  lightboxIndex.value = index;
  showLightbox.value = true;
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
    
    signalement.value = await signalementService.getSignalementById(signalementId);
    
    if (signalement.value) {
      await loadHistoStatuts(signalementId);
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
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
  } catch (error) {
    console.error('Erreur historique:', error);
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

const formatDate = (daty: any): string => {
  if (!daty) return '';
  try {
    let date: Date;
    
    // Gérer les Timestamps Firestore (objet avec seconds/nanoseconds)
    if (daty && typeof daty === 'object' && 'seconds' in daty) {
      date = new Date(daty.seconds * 1000);
    } else {
      date = new Date(daty);
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

const formatDateShort = (daty: any): string => {
  if (!daty) return '';
  try {
    let date: Date;
    
    // Gérer les Timestamps Firestore (objet avec seconds/nanoseconds)
    if (daty && typeof daty === 'object' && 'seconds' in daty) {
      date = new Date(daty.seconds * 1000);
    } else {
      date = new Date(daty);
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

const getUserName = (utilisateur?: UtilisateurRef): string => {
  if (!utilisateur) return 'Utilisateur inconnu';
  
  if (utilisateur.prenom && utilisateur.nom) {
    return `${utilisateur.prenom} ${utilisateur.nom}`;
  }
  
  return utilisateur.identifiant || 'Utilisateur';
};
</script>

<style scoped>
.details-page {
  --background: #f5f7fa;
}

ion-toolbar {
  --background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  --color: white;
}

ion-title {
  font-weight: 600;
  font-size: 1rem;
}

ion-button {
  --color: white;
}

.details-container {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

/* Status Header */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.date-info {
  color: #666;
  font-size: 0.85rem;
}

/* Photos Gallery */
.photos-gallery {
  background: white;
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.gallery-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.gallery-scroll::-webkit-scrollbar {
  height: 4px;
}

.gallery-scroll::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 2px;
}

.gallery-scroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.gallery-photo {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  scroll-snap-align: start;
  position: relative;
}

.gallery-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.gallery-photo:active img {
  transform: scale(0.95);
}

.gallery-photo.see-more {
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.more-count {
  font-size: 1.5rem;
  font-weight: 700;
}

.more-text {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.photos-count {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.no-photos {
  background: #e9ecef;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* Info Card */
.info-card {
  background: white;
  border-radius: 12px;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.info-row {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  gap: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.info-label {
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-weight: 600;
  color: #0a1e37;
  font-size: 0.95rem;
}

.info-sub {
  font-size: 0.75rem;
  color: #999;
  font-family: monospace;
}

/* Description Card */
.description-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.description-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 0.75rem 0;
}

.description-card p {
  margin: 0;
  color: #444;
  line-height: 1.6;
  font-size: 0.9rem;
  white-space: pre-wrap;
}

/* History Card */
.history-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.history-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 1rem 0;
}

.badge {
  background: #0a1e37;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.loading-state, .empty-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #999;
  font-size: 0.85rem;
  padding: 1rem 0;
}

.spinner {
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
.timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 0.75rem;
  position: relative;
  padding-bottom: 1rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}

.timeline-connector {
  position: absolute;
  left: 5px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: #e9ecef;
}

.timeline-content {
  flex: 1;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.75rem;
}

.timeline-item:first-child .timeline-content {
  background: linear-gradient(135deg, #e8f4fd 0%, #d4ecfd 100%);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.timeline-status {
  font-weight: 600;
  font-size: 0.85rem;
}

.timeline-date {
  font-size: 0.7rem;
  color: #888;
}

.timeline-description {
  margin: 0.5rem 0 0 0;
  color: #555;
  font-size: 0.8rem;
  line-height: 1.4;
}

.timeline-photos {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.timeline-photo {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.timeline-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-more {
  position: absolute;
  inset: 0;
  background: rgba(10, 30, 55, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Not Found */
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
