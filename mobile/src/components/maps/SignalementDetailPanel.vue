<template>
  <div class="detail-panel">
    <!-- Header avec bouton retour -->
    <div class="panel-header">
      <button class="back-btn" @click="$emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h2 class="panel-title">Détail du signalement</h2>
      <button class="edit-btn" v-if="canEdit" @click="signalement && $emit('edit', signalement)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>

    <!-- Spinner de chargement -->
    <SpinnerLoader 
      v-if="isLoading" 
      :fullscreen="false" 
      message="Chargement du signalement..." 
    />

    <div v-else-if="signalement" class="panel-body">
      <!-- Statut + Date -->
      <div class="status-header">
        <span class="status-badge" :style="{ backgroundColor: getStatutColor(signalement.statut.id_statut) }">
          {{ signalement.statut.libelle }}
        </span>
        <span class="date-info">{{ formatDate(signalement.daty) }}</span>
      </div>

      <!-- Galerie de photos -->
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>Aucune photo</span>
      </div>

      <!-- Informations principales -->
      <div class="info-card">
        <!-- Localisation -->
        <div class="info-row">
          <div class="info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a1e37" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="info-details">
            <span class="info-label">Signalé par</span>
            <span class="info-value" v-if="isMySignalement" style="color: #28a745; font-weight: 700;">Signalement créé par vous</span>
            <span class="info-value" v-else>{{ getUserName(signalement.utilisateur) }}</span>
          </div>
        </div>

        <!-- Surface -->
        <div class="info-row" v-if="signalement.surface">
          <div class="info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#17a2b8" stroke-width="2">
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="info-details">
            <span class="info-label">Budget estimé</span>
            <span class="info-value">{{ formatBudgetValue(signalement.budget) }}</span>
          </div>
        </div>

        <!-- Entreprise -->
        <div class="info-row" v-if="signalement.entreprise">
          <div class="info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2">
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Historique
          <span class="badge" v-if="histoStatuts.length > 0">{{ histoStatuts.length }}</span>
        </h3>

        <SpinnerLoader 
          v-if="isLoadingHistory" 
          :fullscreen="false" 
          message="Chargement de l'historique..." 
        />

        <div v-else-if="histoStatuts.length === 0" class="empty-history">
          Aucun historique disponible
        </div>

        <div v-else class="timeline">
          <div 
            v-for="(histo, index) in histoStatuts" 
            :key="index" 
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
    <div v-else class="not-found">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>Signalement non trouvé</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { signalementService } from '@/services/signalement';
import { Signalement, formatBudget, formatSurface, UtilisateurRef } from '@/models/Signalement';
import { getStatutColor } from '@/models/Statut';
import { auth } from '@/services/firebase/config';
import SpinnerLoader from '@/components/SpinnerLoader.vue';

const props = defineProps<{
  signalementId: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'edit', signalement: Signalement): void;
  (e: 'open-lightbox', photos: string[], index: number): void;
}>();

const signalement = ref<Signalement | null>(null);
const histoStatuts = ref<any[]>([]);
const isLoading = ref(true);
const isLoadingHistory = ref(false);

const maxPhotosToShow = 5;
const showAllPhotos = ref(false);

const canEdit = computed(() => {
  if (!signalement.value || !auth.currentUser) return false;
  return signalement.value.utilisateur?.firebase_uid === auth.currentUser.uid;
});

const isMySignalement = computed(() => {
  if (!signalement.value || !auth.currentUser) return false;
  return signalement.value.utilisateur?.firebase_uid === auth.currentUser.uid;
});

const allPhotos = computed(() => {
  const photos: string[] = [];
  histoStatuts.value.forEach(histo => {
    photos.push(...getHistoImages(histo));
  });
  return photos;
});

const displayedPhotos = computed(() => {
  if (showAllPhotos.value) return allPhotos.value;
  return allPhotos.value.slice(0, maxPhotosToShow);
});

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

const openLightbox = (photos: string[], index: number = 0) => {
  emit('open-lightbox', photos, index);
};

const loadSignalement = async (id: string) => {
  isLoading.value = true;
  showAllPhotos.value = false;

  try {
    signalement.value = await signalementService.getSignalementById(id);

    if (signalement.value) {
      await loadHistoStatuts(id);
    }
  } catch (error) {
    console.error('Erreur chargement signalement:', error);
  } finally {
    isLoading.value = false;
  }
};

// Charger le signalement quand l'ID change
watch(() => props.signalementId, async (newId) => {
  if (newId) {
    await loadSignalement(newId);
  }
}, { immediate: true });

const loadHistoStatuts = async (signalementId: string) => {
  isLoadingHistory.value = true;

  try {
    const histoList = await signalementService.getHistoStatuts(signalementId);
    histoStatuts.value = histoList.sort((a: any, b: any) => {
      const dateA = parseHistoDate(a.daty);
      const dateB = parseHistoDate(b.daty);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Erreur historique:', error);
  } finally {
    isLoadingHistory.value = false;
  }
};

const formatDate = (daty: any): string => {
  if (!daty) return '';
  try {
    const date = parseHistoDate(daty);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return String(daty);
  }
};

const formatDateShort = (daty: string): string => {
  if (!daty) return '';
  try {
    const date = parseHistoDate(daty);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return daty;
  }
};

const parseHistoDate = (daty: any): Date => {
  if (!daty) return new Date();
  if (daty instanceof Date) return daty;
  if (typeof daty === 'string') {
    const parsed = new Date(daty);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (typeof daty === 'object') {
    if (daty._seconds !== undefined) return new Date(daty._seconds * 1000);
    if (daty.seconds !== undefined) return new Date(daty.seconds * 1000);
    if (daty.toDate && typeof daty.toDate === 'function') return daty.toDate();
  }
  if (typeof daty === 'number') return new Date(daty);
  return new Date(daty);
};

const getUserName = (utilisateur?: UtilisateurRef): string => {
  if (!utilisateur) return 'Utilisateur inconnu';
  if (utilisateur.prenom && utilisateur.nom) {
    return `${utilisateur.prenom} ${utilisateur.nom}`;
  }
  return utilisateur.identifiant || 'Utilisateur';
};

const formatBudgetValue = (budget?: number): string => {
  if (!budget) return '';
  return formatBudget(budget);
};

const formatSurfaceValue = (surface?: number): string => {
  if (!surface) return '';
  return formatSurface(surface);
};
</script>

<style scoped>
.detail-panel {
  padding: 0;
  height: 100%;
  overflow-y: auto;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 5;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f5f7fa;
  cursor: pointer;
  color: #0a1e37;
  flex-shrink: 0;
  transition: background 0.2s;
}

.back-btn:active {
  background: #e0e3e8;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0;
  flex: 1;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f5f7fa;
  cursor: pointer;
  color: #0a1e37;
  flex-shrink: 0;
  transition: background 0.2s;
}

.edit-btn:active {
  background: #e0e3e8;
}

/* Body */
.panel-body {
  padding: 1rem;
  padding-bottom: 6rem;
}



/* Status Header */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.status-badge {
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
}

.date-info {
  color: #666;
  font-size: 0.8rem;
}

/* Photos Gallery */
.photos-gallery {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.6rem;
  margin-bottom: 0.75rem;
}

.gallery-scroll {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.gallery-scroll::-webkit-scrollbar {
  height: 3px;
}

.gallery-scroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.gallery-photo {
  flex-shrink: 0;
  width: 110px;
  height: 110px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  scroll-snap-align: start;
}

.gallery-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.gallery-photo:active img {
  transform: scale(0.95);
}

.gallery-photo.see-more {
  background: linear-gradient(135deg, #0a1e37, #1a3a5f);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.more-count {
  font-size: 1.3rem;
  font-weight: 700;
}

.more-text {
  font-size: 0.65rem;
  margin-top: 2px;
}

.photos-count {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.25rem;
}

.no-photos {
  background: #f0f0f0;
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #999;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

/* Info Card */
.info-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.25rem 0;
  margin-bottom: 0.75rem;
}

.info-row {
  display: flex;
  align-items: flex-start;
  padding: 0.6rem 0.85rem;
  gap: 0.6rem;
  border-bottom: 1px solid #eee;
}

.info-row:last-child {
  border-bottom: none;
}

.info-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.info-label {
  font-size: 0.7rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-weight: 600;
  color: #0a1e37;
  font-size: 0.88rem;
}

.info-sub {
  font-size: 0.7rem;
  color: #999;
  font-family: monospace;
}

/* Description Card */
.description-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.85rem;
  margin-bottom: 0.75rem;
}

.description-card h3 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 0.5rem 0;
}

.description-card p {
  margin: 0;
  color: #444;
  line-height: 1.5;
  font-size: 0.85rem;
  white-space: pre-wrap;
}

/* History Card */
.history-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.85rem;
}

.history-card h3 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 0.75rem 0;
}

.badge {
  background: #0a1e37;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
}

.empty-history {
  color: #999;
  font-size: 0.8rem;
  padding: 0.5rem 0;
}

/* Timeline */
.timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 0.6rem;
  position: relative;
  padding-bottom: 0.75rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
}

.timeline-connector {
  position: absolute;
  left: 4px;
  top: 16px;
  bottom: 0;
  width: 2px;
  background: #e9ecef;
}

.timeline-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 0.6rem;
}

.timeline-item:first-child .timeline-content {
  background: linear-gradient(135deg, #e8f4fd, #d4ecfd);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2rem;
}

.timeline-status {
  font-weight: 600;
  font-size: 0.8rem;
}

.timeline-date {
  font-size: 0.65rem;
  color: #888;
}

.timeline-description {
  margin: 0.4rem 0 0 0;
  color: #555;
  font-size: 0.75rem;
  line-height: 1.4;
}

.timeline-photos {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.5rem;
}

.timeline-photo {
  width: 48px;
  height: 48px;
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
  font-size: 0.8rem;
  font-weight: 600;
}

/* Not Found */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
  color: #999;
}

.not-found p {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
}
</style>
