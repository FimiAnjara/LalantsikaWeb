<template>
  <div class="saved-reports-card">
    <div class="card-header">
      <h2>Signalements</h2>
      <button class="close-btn" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="card-body">
      <!-- Spinner de chargement de la liste -->
      <SpinnerLoader 
        v-if="isLoading" 
        :fullscreen="false" 
        message="Chargement des signalements..." 
      />
      
      <!-- Contenu de la liste -->
      <template v-else>
        <!-- Section Filtres -->
        <div class="filters-section">
          <div class="filter-row">
            <!-- Recherche par ville -->
            <div class="filter-input-container">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                v-model="searchCity" 
                placeholder="Rechercher une ville..." 
                class="filter-input"
              />
              <button v-if="searchCity" class="clear-btn" @click="searchCity = ''">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="filter-row">
            <!-- Filtre par statut -->
            <div class="filter-select-container">
              <select v-model="filterStatus" class="filter-select">
                <option value="">Tous les statuts</option>
                <option value="warning">🟠 Nouveau</option>
                <option value="info">🔵 En cours</option>
                <option value="success">🟢 Terminé</option>
              </select>
            </div>
            
            <!-- Tri par date -->
            <div class="filter-select-container">
              <select v-model="sortOrder" class="filter-select">
                <option value="desc">Plus récents</option>
                <option value="asc">Plus anciens</option>
              </select>
            </div>
          </div>
          
          <!-- Résultats du filtre -->
          <div v-if="hasActiveFilters" class="filter-results">
            <span>{{ filteredAllReports.length }} résultat(s)</span>
            <button class="reset-filters-btn" @click="resetFilters">
              Réinitialiser
            </button>
          </div>
        </div>

        <!-- Mes signalements -->
        <div class="reports-section">
          <h3 class="section-title">Mes signalements ({{ filteredMyReports.length }})</h3>
          <div v-if="filteredMyReports.length === 0" class="empty-state-small">
            <p>{{ hasActiveFilters ? 'Aucun résultat pour ces filtres' : 'Aucun signalement pour le moment' }}</p>
          </div>
          <div v-else class="reports-list">
            <div 
              v-for="report in displayedMyReports" 
              :key="report.id"
              class="report-item clickable"
              @click="$emit('open-details', report)"
            >
              <div class="report-info">
                <h3>{{ report.title }}</h3>
                <p v-if="report.city" class="city-name">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ report.city }}
                </p>
                <p class="coordinates">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ report.lat.toFixed(4) }}, {{ report.lng.toFixed(4) }}
                </p>
              </div>
              <div class="report-right">
                <span class="status-badge" :class="'status-' + report.type">
                  {{ getStatusLabel(report.type) }}
                </span>
                <div class="report-actions" @click.stop>
                  <button 
                    class="action-btn delete-btn" 
                    @click="$emit('delete', report.id)"
                    title="Supprimer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button 
            v-if="filteredMyReports.length > itemsPerPage"
            @click="showAllMyReports = !showAllMyReports"
            class="show-more-btn"
          >
            {{ showAllMyReports ? 'Voir moins' : `Voir plus (${filteredMyReports.length - itemsPerPage} autres)` }}
          </button>
        </div>

        <!-- Tous les signalements -->
        <div class="reports-section">
          <h3 class="section-title">Tous les signalements ({{ filteredAllReports.length }})</h3>
          <div v-if="filteredAllReports.length === 0" class="empty-state-small">
            <p>{{ hasActiveFilters ? 'Aucun résultat pour ces filtres' : 'Aucun signalement disponible' }}</p>
          </div>
          <div v-else class="reports-list">
            <div 
              v-for="report in displayedAllReports" 
              :key="report.id"
              class="report-item clickable"
              @click="$emit('open-details', report)"
            >
              <div class="report-info">
                <h3>{{ report.title }}</h3>
                <p v-if="report.city" class="city-name">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ report.city }}
                </p>
                <p class="coordinates">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ report.lat.toFixed(4) }}, {{ report.lng.toFixed(4) }}
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
            v-if="filteredAllReports.length > itemsPerPage"
            @click="showAllReports = !showAllReports"
            class="show-more-btn"
          >
            {{ showAllReports ? 'Voir moins' : `Voir plus (${filteredAllReports.length - itemsPerPage} autres)` }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SpinnerLoader from '@/components/SpinnerLoader.vue';

// Props
interface Report {
  id: string;
  lat: number;
  lng: number;
  type: string;
  title: string;
  city?: string;
  category?: string;
  statut?: any;
  firebase_id?: string;
  date?: string;
}

const props = defineProps<{
  myReports: Report[];
  allReports: Report[];
  isLoading: boolean;
}>();

// Emits
defineEmits<{
  (e: 'close'): void;
  (e: 'open-details', report: Report): void;
  (e: 'delete', reportId: string): void;
}>();

// Local state
const showAllMyReports = ref(false);
const showAllReports = ref(false);
const itemsPerPage = 3;

// Filtres
const searchCity = ref('');
const filterStatus = ref('');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Vérifier si des filtres sont actifs
const hasActiveFilters = computed(() => {
  return searchCity.value.trim() !== '' || filterStatus.value !== '';
});

// Réinitialiser les filtres
const resetFilters = () => {
  searchCity.value = '';
  filterStatus.value = '';
  sortOrder.value = 'desc';
};

// Fonction de filtrage
const filterReports = (reports: Report[]) => {
  let filtered = [...reports];
  
  // Filtre par ville
  if (searchCity.value.trim()) {
    const search = searchCity.value.toLowerCase().trim();
    filtered = filtered.filter(r => 
      r.city?.toLowerCase().includes(search) || 
      r.title?.toLowerCase().includes(search)
    );
  }
  
  // Filtre par statut
  if (filterStatus.value) {
    filtered = filtered.filter(r => r.type === filterStatus.value);
  }
  
  // Tri par date (si disponible) ou par id
  filtered.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  return filtered;
};

// Computed pour les listes filtrées
const filteredMyReports = computed(() => filterReports(props.myReports));
const filteredAllReports = computed(() => filterReports(props.allReports));

const displayedMyReports = computed(() => {
  if (showAllMyReports.value) {
    return filteredMyReports.value;
  }
  return filteredMyReports.value.slice(0, itemsPerPage);
});

const displayedAllReports = computed(() => {
  if (showAllReports.value) {
    return filteredAllReports.value;
  }
  return filteredAllReports.value.slice(0, itemsPerPage);
});

// Methods
const getStatusLabel = (type: string) => {
  const labels: Record<string, string> = {
    'danger': '🔴 Rejeté',
    'warning': '🟠 En attente',
    'info': '🔵 En cours',
    'success': '🟢 Terminé'
  };
  return labels[type] || type;
};
</script>

<style scoped>
.saved-reports-card {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  background: white;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
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
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  color: white;
  padding-top: calc(env(safe-area-inset-top) + 1rem);
}

.card-header h2 {
  font-size: 1.15rem;
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
}

.close-btn svg {
  stroke: white;
}

.card-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
  padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
}

/* Filtres */
.filters-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.filter-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.filter-row:last-of-type {
  margin-bottom: 0;
}

.filter-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 0 0.75rem;
  border: 1px solid #e9ecef;
  gap: 0.5rem;
}

.filter-input-container svg {
  stroke: #999;
  flex-shrink: 0;
}

.filter-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.6rem 0;
  font-size: 0.85rem;
  background: transparent;
  color: #0a1e37;
}

.filter-input::placeholder {
  color: #999;
}

.clear-btn {
  background: #e9ecef;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.clear-btn svg {
  stroke: #666;
}

.filter-select-container {
  flex: 1;
}

.filter-select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
  font-size: 0.8rem;
  color: #0a1e37;
  cursor: pointer;
  outline: none;
}

.filter-results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.8rem;
  color: #666;
}

.reset-filters-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.reset-filters-btn:hover {
  text-decoration: underline;
}

/* Sections */
.empty-state-small {
  padding: 1.5rem 1rem;
  text-align: center;
  color: #999;
  font-size: 0.85rem;
}

.reports-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.report-item.clickable {
  cursor: pointer;
}

.report-item.clickable:hover {
  background: #e9ecef;
  border-color: #0a1e37;
}

.report-item.clickable:active {
  transform: scale(0.98);
}

.report-info {
  flex: 1;
  min-width: 0;
}

.report-info h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 0.35rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.city-name {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #0a1e37;
  font-weight: 500;
  margin: 0 0 0.2rem 0;
}

.city-name svg {
  stroke: #dc3545;
  flex-shrink: 0;
}

.coordinates {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #999;
  margin: 0;
}

.coordinates svg {
  stroke: #999;
  flex-shrink: 0;
}

.report-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
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
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.7rem;
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
  padding: 0.6rem;
  margin-top: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  color: #0a1e37;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  background: #e9ecef;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn {
  background: #dc3545;
}

.delete-btn:hover {
  background: #c82333;
}

.delete-btn svg {
  stroke: white;
}
</style>
