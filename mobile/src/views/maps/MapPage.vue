<template>
  <ion-page>
    <ion-content :fullscreen="true" class="map-page">
      
      <!-- Spinner Fullscreen pour recherche de ville et suppression -->
      <SpinnerLoader 
        v-if="isSearching || isDeleting" 
        :fullscreen="true" 
        :message="loadingMessage" 
      />
      
      <!-- Filtre de la carte (Tous / Mes signalements) -->
      <div v-if="!reportMode" class="map-filter">
        <button 
          class="filter-btn" 
          :class="{ active: mapFilter === 'all' }"
          @click="mapFilter = 'all'"
        >
          Tous
        </button>
        <button 
          class="filter-btn" 
          :class="{ active: mapFilter === 'mine' }"
          @click="mapFilter = 'mine'"
        >
          Mes signalements
        </button>
      </div>
      
      <!-- Header avec recherche et profil alignés -->
      <div class="map-header">
        <div class="search-header">
          <div class="search-bar">
            <img src="/logo/logo4.png" alt="Logo" class="search-logo" />
            <input 
              type="text" 
              v-model="searchQuery"
              @keyup.enter="searchCity"
              placeholder="Rechercher une ville..." 
              class="search-input"
            />
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>
        <button class="profile-btn" @click="goToProfile">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="7" r="4"/>
            <path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>
          </svg>
        </button>
      </div>

      <!-- Bouton Signaler (flottant en bas à droite) -->
      <button 
        v-if="!reportMode"
        class="report-btn" 
        @click="startReportMode"
        title="Ajouter un signalement"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M2 12h20"/>
        </svg>
      </button>

      <!-- Icône de localisation rouge centrale (en mode signalement) -->
      <div v-if="reportMode" class="center-marker">
        <svg width="40" height="50" viewBox="0 0 24 30" fill="#dc3545">
          <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 14 8 14s8-8.5 8-14c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
        </svg>
      </div>

      <!-- Carte -->
      <div class="map-wrapper">
        <MapComponent 
          ref="mapComponent"
          :markers="currentMarkers"
          @marker-click="showMarkerDetails"
          @map-ready="onMapReady"
        />
      </div>

      <!-- Boutons de validation/annulation (en mode signalement) -->
      <div v-if="reportMode" class="action-buttons">
        <button class="cancel-btn" @click="cancelReportMode" :disabled="isValidating">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button class="validate-btn" @click="validateReport" :disabled="isValidating">
          <span v-if="isValidating" class="btn-spinner"></span>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>

      <!-- Carte flottante des signalements -->
      <div v-if="activeMenu === 'saved'" class="saved-reports-card">
        <div class="card-header">
          <h2>Signalements</h2>
          <button class="close-btn" @click="activeMenu = 'map'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="card-body">
          <!-- Spinner de chargement de la liste -->
          <SpinnerLoader 
            v-if="isLoadingList" 
            :fullscreen="false" 
            message="Chargement des signalements..." 
          />
          
          <!-- Contenu de la liste -->
          <template v-else>
          <!-- Mes signalements -->
          <div class="reports-section">
            <h3 class="section-title">Mes signalements ({{ myReports.length }})</h3>
            <div v-if="myReports.length === 0" class="empty-state-small">
              <p>Aucun signalement pour le moment</p>
            </div>
            <div v-else class="reports-list">
              <div 
                v-for="report in displayedMyReports" 
                :key="report.id"
                class="report-item"
              >
                <div class="report-info">
                  <h3>{{ report.title }}</h3>
                  <p v-if="report.city" class="city-name">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Près de {{ report.city }}
                  </p>
                  <p class="coordinates">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ report.lat.toFixed(6) }}, {{ report.lng.toFixed(6) }}
                  </p>
                </div>
                <div class="report-actions">
                  <button 
                    class="action-btn edit-btn" 
                    @click="openReportDetails(report)"
                    title="Voir/Modifier"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button 
                    class="action-btn delete-btn" 
                    @click="deleteReport(report.id)"
                    title="Supprimer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <button 
              v-if="myReports.length > itemsPerPage"
              @click="showAllMyReports = !showAllMyReports"
              class="show-more-btn"
            >
              {{ showAllMyReports ? 'Voir moins' : `Voir plus (${myReports.length - itemsPerPage} autres)` }}
            </button>
          </div>

          <!-- Tous les signalements -->
          <div class="reports-section">
            <h3 class="section-title">Tous les signalements ({{ allReports.length }})</h3>
            <div v-if="allReports.length === 0" class="empty-state-small">
              <p>Aucun signalement disponible</p>
            </div>
            <div v-else class="reports-list">
              <div 
                v-for="report in displayedAllReports" 
                :key="report.id"
                class="report-item"
              >
                <div class="report-info">
                  <h3>{{ report.title }}</h3>
                  <p v-if="report.city" class="city-name">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Près de {{ report.city }}
                  </p>
                  <p class="coordinates">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ report.lat.toFixed(6) }}, {{ report.lng.toFixed(6) }}
                  </p>
                </div>
                <div class="report-status">
                  <span class="status-badge" :class="'status-' + report.type">
                    {{ getStatusLabel(report.type) }}
                  </span>
                </div>
              </div>
            </div>
            <button 
              v-if="allReports.length > itemsPerPage"
              @click="showAllReports = !showAllReports"
              class="show-more-btn"
            >
              {{ showAllReports ? 'Voir moins' : `Voir plus (${allReports.length - itemsPerPage} autres)` }}
            </button>
          </div>
          </template>
        </div>
      </div>

      <!-- Carte flottante Recap/Dashboard -->
      <div v-if="activeMenu === 'recap'" class="recap-card">
        <div class="card-header">
          <h2>Récapitulatif</h2>
          <button class="close-btn" @click="backToMap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="card-body">
          <!-- Spinner de chargement -->
          <SpinnerLoader 
            v-if="isLoadingList" 
            :fullscreen="false" 
            message="Chargement des statistiques..." 
          />
          
          <!-- Contenu du dashboard -->
          <template v-else>
            <!-- Statistiques principales -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon total">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <h3>{{ totalSignalements }}</h3>
                  <p>Signalements</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon budget">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <h3>{{ formatBudget(totalBudget) }}</h3>
                  <p>Budget Total</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon surface">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <h3>{{ totalSurface }} m²</h3>
                  <p>Surface Totale</p>
                </div>
              </div>
            </div>

            <!-- Progression par statut -->
            <div class="status-section">
              <h3 class="section-title">Progression des signalements</h3>
              <div class="status-progress-list">
                <div v-for="stat in statusStats" :key="stat.label" class="status-progress-item">
                  <div class="status-header">
                    <span class="status-label">{{ stat.label }}</span>
                    <span class="status-count">{{ stat.count }} ({{ stat.percentage }}%)</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :class="'progress-' + stat.type"
                      :style="{ width: stat.percentage + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Diagramme circulaire -->
            <div class="chart-section">
              <h3 class="section-title">Répartition par statut</h3>
              <div class="pie-chart">
                <svg viewBox="0 0 200 200" class="pie-svg">
                  <circle
                    v-for="(segment, index) in pieChartSegments"
                    :key="index"
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    :stroke="segment.color"
                    stroke-width="40"
                    :stroke-dasharray="segment.dashArray"
                    :stroke-dashoffset="segment.dashOffset"
                    :transform="`rotate(-90 100 100)`"
                  />
                </svg>
                <div class="chart-legend">
                  <div v-for="stat in statusStats" :key="stat.label" class="legend-item">
                    <div class="legend-color" :style="{ backgroundColor: stat.color }"></div>
                    <span>{{ stat.label }}: {{ stat.count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Menu horizontal en bas -->
      <div class="bottom-menu">
        <button 
          class="menu-item" 
          :class="{ active: activeMenu === 'map' }"
          @click="backToMap"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21l9-9 3 3 6-6"/>
            <path d="M21 3v6h-6"/>
          </svg>
          <span>Carte</span>
        </button>

        <button 
          class="menu-item" 
          :class="{ active: activeMenu === 'saved' }"
          @click="openSignalementsList"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Signalements</span>
        </button>

        <button 
          class="menu-item" 
          :class="{ active: activeMenu === 'recap' }"
          @click="activeMenu = 'recap'"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span>Recap</span>
        </button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { IonPage, IonContent, toastController, loadingController, alertController, onIonViewWillEnter } from '@ionic/vue';
import MapComponent from '@/components/MapComponent.vue';
import SpinnerLoader from '@/components/SpinnerLoader.vue';
import router from '@/router';
import { signalementService } from '@/services/signalement';
import { Signalement, getStatutLibelle, getStatutType } from '@/models';

const mapComponent = ref<any>(null);
const searchQuery = ref('');
const activeMenu = ref('map');
const savedCount = ref(0);
const reportMode = ref(false);
const showAllMyReports = ref(false);
const showAllReports = ref(false);
const isLoadingList = ref(false); // Pour la liste des signalements seulement
const isSearching = ref(false);
const isDeleting = ref(false);
const isValidating = ref(false); // Pour le bouton de validation
const loadingMessage = ref('Chargement...');
const mapFilter = ref<'all' | 'mine'>('all'); // Filtre pour la carte

const itemsPerPage = 3; // Nombre d'éléments affichés par défaut

// Données de signalements depuis Firestore
const allSignalements = ref<Signalement[]>([]);
const mySignalements = ref<Signalement[]>([]);

// Marqueurs pour la carte (transformés depuis les signalements)
const markers = computed(() => {
  return allSignalements.value.map(sig => signalementService.signalementToMarker(sig));
});

const myReports = computed(() => {
  return mySignalements.value.map(sig => ({
    id: sig.firebase_id || `sig-${sig.id_signalement}`,
    lat: sig.point.latitude,
    lng: sig.point.longitude,
    type: getStatutType(sig.statut.id_statut),
    title: sig.description || 'Signalement',
    city: sig.city,
    category: sig.category,
    statut: sig.statut,
    firebase_id: sig.firebase_id
  }));
});

const allReports = computed(() => {
  return allSignalements.value.map(sig => ({
    id: sig.firebase_id || `sig-${sig.id_signalement}`,
    lat: sig.point.latitude,
    lng: sig.point.longitude,
    type: getStatutType(sig.statut.id_statut),
    title: sig.description || 'Signalement',
    city: sig.city,
    category: sig.category,
    statut: sig.statut,
    firebase_id: sig.firebase_id
  }));
});

const displayedMyReports = computed(() => {
  if (showAllMyReports.value) {
    return myReports.value;
  }
  return myReports.value.slice(0, itemsPerPage);
});

const displayedAllReports = computed(() => {
  if (showAllReports.value) {
    return allReports.value;
  }
  return allReports.value.slice(0, itemsPerPage);
});

// Marqueurs filtrés pour la carte
const currentMarkers = computed(() => {
  if (mapFilter.value === 'mine') {
    return mySignalements.value.map(sig => signalementService.signalementToMarker(sig));
  }
  return markers.value;
});

// Statistiques pour le dashboard
const totalSignalements = computed(() => allSignalements.value.length);

const totalBudget = computed(() => {
  // Pour le moment, budget par défaut de 500 000 Ar par signalement
  // À remplacer quand la colonne budget sera ajoutée
  return allSignalements.value.reduce((sum, sig) => {
    return sum + (sig.budget || 500000);
  }, 0);
});

const totalSurface = computed(() => {
  return allSignalements.value.reduce((sum, sig) => {
    return sum + (sig.surface || 0);
  }, 0);
});

const statusStats = computed(() => {
  const stats = [
    { type: 'danger', label: '🔴 Rejeté', count: 0, color: '#dc3545' },
    { type: 'warning', label: '🟠 En attente', count: 0, color: '#ff9800' },
    { type: 'info', label: '🔵 En cours', count: 0, color: '#2196f3' },
    { type: 'success', label: '🟢 Terminé', count: 0, color: '#28a745' }
  ];

  allSignalements.value.forEach(sig => {
    const type = getStatutType(sig.statut.id_statut);
    const stat = stats.find(s => s.type === type);
    if (stat) stat.count++;
  });

  const total = allSignalements.value.length || 1;
  return stats.map(stat => ({
    ...stat,
    percentage: Math.round((stat.count / total) * 100)
  }));
});

const pieChartSegments = computed(() => {
  const circumference = 2 * Math.PI * 80;
  let currentOffset = 0;
  
  return statusStats.value
    .filter(stat => stat.count > 0)
    .map(stat => {
      const dashLength = (stat.percentage / 100) * circumference;
      const segment = {
        color: stat.color,
        dashArray: `${dashLength} ${circumference}`,
        dashOffset: -currentOffset
      };
      currentOffset += dashLength;
      return segment;
    });
});

const formatBudget = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} M Ar`;
  }
  return `${(amount / 1000).toFixed(0)} K Ar`;
};

// Charger les signalements au montage
onMounted(async () => {
  await loadSignalements();
});

// Recharger les signalements à chaque retour sur la page
onIonViewWillEnter(async () => {
  console.log('🔄 Retour sur MapPage - Rechargement des signalements...');
  await loadSignalements();
  
  // Forcer le rafraîchissement de la carte pour éviter les bugs d'affichage
  setTimeout(() => {
    mapComponent.value?.invalidateSize();
  }, 300);
});

// Charger tous les signalements
const loadSignalements = async (showLoader = false) => {
  // Afficher le loader seulement si demandé (pour la liste)
  if (showLoader) {
    isLoadingList.value = true;
  }
  
  try {
    // Charger tous les signalements
    allSignalements.value = await signalementService.getAllSignalements();
    console.log('✅ Tous les signalements chargés:', allSignalements.value.length);
    console.log('📍 Marqueurs générés:', markers.value);
    
    // Charger mes signalements
    try {
      console.log('🔄 Tentative de chargement de mes signalements...');
      mySignalements.value = await signalementService.getMySignalements();
      savedCount.value = mySignalements.value.length;
      console.log('✅ Mes signalements chargés:', mySignalements.value.length);
    } catch (error) {
      // Si erreur (utilisateur non connecté), on ignore
      console.error('❌ Impossible de charger mes signalements:', error);
      mySignalements.value = [];
    }
    
    console.log('📊 Résumé: Total =', allSignalements.value.length, ', Mes signalements =', mySignalements.value.length);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des signalements:', error);
    showToast('Erreur lors du chargement des signalements', 'danger');
  } finally {
    isLoadingList.value = false;
  }
};

// Rafraîchir les données
const refreshData = async () => {
  await loadSignalements();
  showToast('Données actualisées', 'success');
};

const onMapReady = (map: any) => {
  console.log('Carte prête', map);
};

const searchCity = async () => {
  if (!searchQuery.value.trim()) return;

  isSearching.value = true;
  loadingMessage.value = 'Recherche en cours...';
  
  try {
    // Utiliser l'API Nominatim d'OpenStreetMap pour la recherche
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)},Madagascar&limit=1`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      mapComponent.value?.setView([parseFloat(lat), parseFloat(lon)], 13);
      showToast(`Localisation: ${data[0].display_name.split(',')[0]}`, 'success');
    } else {
      showToast('Ville non trouvée', 'warning');
    }
  } catch (error) {
    console.error('Erreur de recherche:', error);
    showToast('Erreur lors de la recherche', 'danger');
  } finally {
    isSearching.value = false;
  }
};

const goToProfile = () => {
  router.push({ name: 'Profile' });
};

// Obtenir le nom de la ville depuis les coordonnées (reverse geocoding)
const getCityName = async (lat: number, lng: number): Promise<string> => {
  try {
    console.log('📍 Reverse geocoding pour:', lat, lng);
    
    // Zoom 18 pour obtenir le niveau de détail le plus précis (quartier, rue)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
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
      
      // Priorité à suburb (banlieue) + city pour avoir le format "Mahamasina, Antananarivo"
      const suburb = data.address.suburb || 
                     data.address.neighbourhood || 
                     data.address.hamlet || 
                     data.address.village;
      
      const mainCity = data.address.city || 
                       data.address.town || 
                       data.address.municipality ||
                       data.address.county;
      
      let locationName: string;
      
      if (suburb && mainCity) {
        // Format complet: "Mahamasina, Antananarivo"
        locationName = `${suburb}, ${mainCity}`;
      } else if (suburb) {
        // Seulement le quartier
        locationName = suburb;
      } else if (mainCity) {
        // Seulement la ville
        locationName = mainCity;
      } else {
        locationName = data.address.state || 'Localisation inconnue';
      }
      
      console.log('📍 Localisation sélectionnée:', locationName);
      return locationName;
    }
    return 'Localisation inconnue';
  } catch (error) {
    console.error('Erreur lors du reverse geocoding:', error);
    return 'Localisation inconnue';
  }
};

// Gestion des signalements enregistrés
const openReportDetails = (report: any) => {
  // Naviguer vers la nouvelle page de détails du signalement
  router.push({ 
    name: 'SignalementDetails', 
    params: { id: report.firebase_id || report.id }
  });
};

const showMarkerDetails = (marker: any) => {
  console.log('Marqueur cliqué:', marker);
  // Naviguer vers les détails du signalement
  router.push({ 
    name: 'SignalementDetails', 
    params: { id: marker.id }
  });
};

const deleteReport = async (reportId: string) => {
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: 'Voulez-vous vraiment supprimer ce signalement ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: () => {
          // Retourner false pour que le handler gère manuellement la fermeture
          // Cela permet d'afficher le spinner avant la fermeture
          performDelete(reportId);
          return true; // Ferme immédiatement le dialog
        }
      }
    ]
  });
  await alert.present();
};

// Fonction séparée pour effectuer la suppression
const performDelete = async (reportId: string) => {
  isDeleting.value = true;
  loadingMessage.value = 'Suppression en cours...';
  
  try {
    await signalementService.deleteSignalement(reportId);
    await loadSignalements(); // Recharger la liste
    await showToast('Signalement supprimé', 'success');
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    await showToast('Erreur lors de la suppression', 'danger');
  } finally {
    isDeleting.value = false;
  }
};

// Mode signalement
const startReportMode = () => {
  reportMode.value = true;
  showToast('Déplacez la carte pour positionner le marqueur', 'primary');
};

const cancelReportMode = () => {
  reportMode.value = false;
};

// Ouvrir la liste des signalements avec chargement
const openSignalementsList = async () => {
  activeMenu.value = 'saved';
  // Recharger les données avec le spinner
  await loadSignalements(true);
};

// Obtenir le label du statut
const getStatusLabel = (type: string, statut?: any) => {
  if (statut) {
    return getStatutLibelle(statut.id_statut);
  }
  const labels: Record<string, string> = {
    'danger': '🔴 Rejeté',
    'warning': '🟠 En attente',
    'info': '🔵 En cours',
    'success': '🟢 Terminé'
  };
  return labels[type] || type;
};

const validateReport = async () => {
  const center = mapComponent.value?.getCenter();
  if (center) {
    // Activer le spinner sur le bouton
    isValidating.value = true;
    
    try {
      // Obtenir le nom de la ville
      const cityName = await getCityName(center[0], center[1]);
      
      // Créer un rapport temporaire
      const tempReport = {
        id: `temp-${Date.now()}`,
        lat: center[0],
        lng: center[1],
        type: 'danger',
        title: `Signalement - ${new Date().toLocaleString()}`,
        city: cityName
      };
      
      // Arrêter le mode signalement
      reportMode.value = false;
      
      // Naviguer directement vers le formulaire de détails
      router.push({
        name: 'ReportForm',
        query: {
          lat: tempReport.lat,
          lng: tempReport.lng,
          title: tempReport.title,
          city: tempReport.city
        }
      });
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      showToast('Erreur lors de la validation', 'danger');
    } finally {
      isValidating.value = false;
    }
  } else {
    showToast('Impossible de récupérer la position', 'danger');
  }
};

// Retourner à la carte et rafraîchir
const backToMap = () => {
  activeMenu.value = 'map';
  // Forcer le rafraîchissement de la carte après fermeture des modales
  setTimeout(() => {
    mapComponent.value?.invalidateSize();
  }, 200);
};

const showToast = async (message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'danger') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    position: 'top',
    color
  });
  await toast.present();
};
</script>

<style scoped>
.map-page {
  --background: #ffffff;
}

/* Header avec recherche et profil alignés */
.map-header {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  max-width: 100vw;
  box-sizing: border-box;
}

.profile-btn {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #0a1e37;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.profile-btn:hover {
  background: #1a3a5f;
  transform: scale(1.05);
}

/* Filtre de la carte */
.map-filter {
  position: absolute;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  display: flex;
  background: white;
  border-radius: 25px;
  padding: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  gap: 4px;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
  color: #666;
  white-space: nowrap;
}

.filter-btn.active {
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(10, 30, 55, 0.3);
}

.filter-btn:not(.active):hover {
  background: #f0f0f0;
  color: #0a1e37;
}

/* Barre de recherche */
.search-header {
  flex: 1;
  display: flex;
}

.search-bar {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: rgb(251, 251, 251);
  border-radius: 12px;
  padding: 0 1rem;
  height: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 0.75rem;
}

.search-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}
  
.search-icon {
  color: #999;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.75rem 0;
  font-size: 0.95rem;
  background-color: rgb(251, 251, 251);
  color: #0a1e37;
  min-width: 0;
  width: 100%;
}

.search-input::placeholder {
  color: #999;
}

/* Bouton Signaler (en bas à droite) */
.report-btn {
  position: fixed;
  bottom: 100px;
  right: 1rem;
  z-index: 1000;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(10, 30, 55, 0.4);
  transition: all 0.3s ease;
}

.report-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(10, 30, 55, 0.5);
}

.report-btn svg {
  width: 24px;
  height: 24px;
}

/* Icône centrale rouge */
.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  z-index: 999;
  pointer-events: none;
  filter: drop-shadow(0 4px 8px rgba(220, 53, 69, 0.4));
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translate(-50%, -100%);
  }
  50% {
    transform: translate(-50%, -105%);
  }
}

/* Boutons d'action (validation/annulation) */
.action-buttons {
  position: absolute;
  bottom: 100px;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cancel-btn,
.validate-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #dc3545;
}

.cancel-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.validate-btn {
  background: #28a745;
}

.validate-btn:hover:not(:disabled) {
  background: #218838;
  transform: scale(1.1);
}

.validate-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Spinner dans les boutons */
.btn-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: btn-spin 0.8s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

/* Map */
.map-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 80px;
  width: 100%;
  background: #ffffff;
}

/* Bottom Menu */
.bottom-menu {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-around;
  background: #0a1e37;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
}

.menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.menu-item svg {
  width: 24px;
  height: 24px;
  stroke: #ffffff;
  transition: stroke 0.3s ease;
}

.menu-item span {
  font-size: 0.75rem;
  color: #ffffff;
  transition: color 0.3s ease;
}

.menu-item.active svg {
  stroke: rgb(207, 184, 36);
  color: rgb(207, 184, 36);
}

.menu-item.active span {
  color: rgb(207, 184, 36);
  font-weight: 600;
}

.menu-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 3px;
  background: linear-gradient(90deg, rgb(207, 184, 36) 0%, rgb(207, 184, 36) 100%);
  border-radius: 0 0 3px 3px;
}

.badge {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  background: #dc3545;
  color: white;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 600;
}

/* Carte flottante des signalements */
.saved-reports-card,
.recap-card {
  position: absolute;
  top: 10vh;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  background: white;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.card-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.close-btn svg {
  stroke: white;
}

.card-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-state p {
  margin-top: 1rem;
  color: #999;
  font-size: 0.95rem;
}

.empty-state-small {
  padding: 1.5rem 1rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

.reports-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.report-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.report-info {
  flex: 1;
}

.report-info h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 0.5rem 0;
}

.city-name {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: #0a1e37;
  font-weight: 500;
  margin: 0 0 0.3rem 0;
}

.city-name svg {
  stroke: #dc3545;
}

.coordinates {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #999;
  margin: 0;
}

.coordinates svg {
  stroke: #999;
}

.report-actions {
  display: flex;
  gap: 0.5rem;
}

.report-status {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-danger {
  background: #ffebee;
  color: #dc3545;
}

.status-warning {
  background: #fff3cd;
  color: #ff9800;
}

.status-info {
  background: #e3f2fd;
  color: #2196f3;
}

.status-success {
  background: #e8f5e9;
  color: #28a745;
}

.show-more-btn {
  width: 100%;
  padding: 0.75rem;
  margin-top: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  color: #0a1e37;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.show-more-btn:hover {
  background: #e9ecef;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #0a1e37;
}

.edit-btn:hover {
  background: #1a3a5f;
  transform: scale(1.1);
}

.edit-btn svg {
  stroke: white;
}

.delete-btn {
  background: #dc3545;
}

.delete-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.delete-btn svg {
  stroke: white;
}

/* Dashboard Recap Styles */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  text-align: center;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 22px;
  height: 22px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.budget {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.surface {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon svg {
  stroke: white;
}

.stat-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0a1e37;
}

.stat-info p {
  margin: 0.15rem 0 0 0;
  font-size: 0.7rem;
  color: #666;
  font-weight: 500;
}

.status-section,
.chart-section {
  margin-top: 2rem;
}

.status-progress-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.status-progress-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.status-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0a1e37;
}

.status-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s ease;
}

.progress-danger {
  background: linear-gradient(90deg, #dc3545 0%, #ff6b7a 100%);
}

.progress-warning {
  background: linear-gradient(90deg, #ff9800 0%, #ffc947 100%);
}

.progress-info {
  background: linear-gradient(90deg, #2196f3 0%, #64b5f6 100%);
}

.progress-success {
  background: linear-gradient(90deg, #28a745 0%, #66bb6a 100%);
}

.chart-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 16px;
}

.pie-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.pie-svg {
  width: 200px;
  height: 200px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.chart-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #0a1e37;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

</style>
