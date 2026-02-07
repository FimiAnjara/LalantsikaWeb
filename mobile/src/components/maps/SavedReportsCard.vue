<template>
  <div class="saved-reports-sheet" :class="{ 'sheet-mode': isSheetMode }">
    <!-- Header (only if not sheet mode) -->
    <div v-if="!isSheetMode" class="card-header">
      <h2>Signalements</h2>
      <button class="close-btn" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Sheet header with title -->
    <div v-if="isSheetMode" class="sheet-header">
      <div class="sheet-header-left">
        <h2 class="sheet-title">Signalements</h2>
        <span class="sheet-count">{{ mergedReports.length }}</span>
      </div>
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
        <!-- Section Filtres compacte -->
        <div class="filters-section">
          <!-- Recherche -->
          <div class="search-bar-mini">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2.5">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
            <input 
              type="text" 
              v-model="searchCity" 
              placeholder="Ville, description..." 
              class="search-input-mini"
            />
            <button v-if="searchCity" class="clear-mini" @click="searchCity = ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          <!-- Chips de filtre rapide -->
          <div class="filter-chips">
            <button 
              class="f-chip" 
              :class="{ active: filterStatus === '' }"
              @click="filterStatus = ''"
            >Tous</button>
            <button 
              class="f-chip f-chip-nouveau" 
              :class="{ active: filterStatus === 'nouveau' }"
              @click="filterStatus = filterStatus === 'nouveau' ? '' : 'nouveau'"
            >
              <span class="f-dot" style="background:#EA4335"></span>
              Nouveau
            </button>
            <button 
              class="f-chip f-chip-info" 
              :class="{ active: filterStatus === 'info' }"
              @click="filterStatus = filterStatus === 'info' ? '' : 'info'"
            >
              <span class="f-dot" style="background:#4285F4"></span>
              En cours
            </button>
            <button 
              class="f-chip f-chip-success" 
              :class="{ active: filterStatus === 'success' }"
              @click="filterStatus = filterStatus === 'success' ? '' : 'success'"
            >
              <span class="f-dot" style="background:#34A853"></span>
              Terminé
            </button>
            <button 
              class="f-chip f-chip-danger" 
              :class="{ active: filterStatus === 'danger' }"
              @click="filterStatus = filterStatus === 'danger' ? '' : 'danger'"
            >
              <span class="f-dot" style="background:#78909C"></span>
              Rejeté
            </button>
          </div>
        </div>

        <!-- Liste unique : mes signalements en premier, puis les autres -->
        <div class="reports-section">
          <div v-if="mergedReports.length === 0" class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <p>{{ hasActiveFilters ? 'Aucun résultat' : 'Aucun signalement' }}</p>
            <button v-if="hasActiveFilters" class="reset-btn" @click="resetFilters">Réinitialiser les filtres</button>
          </div>
          <div v-else class="reports-grid">
            <div 
              v-for="(report, index) in displayedMergedReports" 
              :key="report.id"
              class="report-card" 
              :class="{ 'my-report': report._isMine }"
              :style="{ animationDelay: index * 0.04 + 's' }"
              @click="handleReportClick(report)"
            >
              <div class="card-left">
                <div class="card-status-indicator" :class="'ind-' + report.type"></div>
              </div>
              <div class="card-center">
                <div class="card-title-row">
                  <span class="card-title">{{ report.title }}</span>
                  <span v-if="report._isMine" class="my-badge">Mon signalement</span>
                </div>
                <div class="card-meta">
                  <span v-if="report.city" class="card-city">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EA4335" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ report.city }}
                  </span>
                  <span class="card-status-label" :class="'label-' + report.type">
                    {{ getStatusLabel(report.type) }}
                  </span>
                </div>
              </div>
              <div class="card-right" @click.stop>
                <button 
                  v-if="isSheetMode"
                  class="card-action-btn card-locate" 
                  @click="$emit('locate-report', report)"
                  title="Localiser"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
                </button>
                <button 
                  v-if="report._isMine"
                  class="card-action-btn card-delete" 
                  @click="$emit('delete', report.id)"
                  title="Supprimer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
          <button 
            v-if="mergedReports.length > itemsPerPage"
            @click="showAll = !showAll"
            class="show-more-btn"
          >
            {{ showAll ? 'Voir moins' : `+ ${mergedReports.length - itemsPerPage} autres` }}
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

const props = withDefaults(defineProps<{
  myReports: Report[];
  allReports: Report[];
  isLoading: boolean;
  isSheetMode?: boolean;
  snap?: string;
}>(), {
  isSheetMode: false,
  snap: 'peek'
});

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-details', report: Report): void;
  (e: 'delete', reportId: string): void;
  (e: 'locate-report', report: Report): void;
}>();

// Local state
const showAll = ref(false);
const itemsPerPage = 8;

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
const filterReports = (reports: (Report & { _isMine?: boolean })[]) => {
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
  
  return filtered;
};

// Set of my report IDs for quick lookup
const myReportIds = computed(() => {
  return new Set(props.myReports.map(r => r.id));
});

// Merged list: my reports first (tagged), then the rest
const mergedReports = computed(() => {
  // Tag all reports with _isMine
  const allTagged = filterReports(
    props.allReports.map(r => ({
      ...r,
      _isMine: myReportIds.value.has(r.id)
    }))
  );
  
  // Sort: mine first, then by date
  allTagged.sort((a, b) => {
    // Mine first
    if (a._isMine && !b._isMine) return -1;
    if (!a._isMine && b._isMine) return 1;
    // Then by date
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  return allTagged;
});

const displayedMergedReports = computed(() => {
  if (showAll.value) {
    return mergedReports.value;
  }
  return mergedReports.value.slice(0, itemsPerPage);
});

// Handle report click - in sheet mode, locate on map; otherwise open details
const handleReportClick = (report: Report) => {
  if (props.isSheetMode) {
    emit('locate-report', report);
  } else {
    emit('open-details', report);
  }
};

// Methods
const getStatusLabel = (type: string) => {
  const labels: Record<string, string> = {
    'danger': 'Rejeté',
    'warning': 'En attente',
    'nouveau': 'Nouveau',
    'info': 'En cours',
    'success': 'Terminé'
  };
  return labels[type] || type;
};
</script>

<style scoped>
.saved-reports-sheet {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.saved-reports-sheet.sheet-mode {
  background: transparent;
}

/* ===== Sheet Header ===== */
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.sheet-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sheet-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.01em;
}

.sheet-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 12px;
  background: #1A3263;
  color: white;
  font-size: 0.72rem;
  font-weight: 600;
}

/* ===== Card Header (non-sheet) ===== */
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
}

.close-btn svg { stroke: white; }

.card-body {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

/* ===== Filters Section ===== */
.filters-section {
  margin-bottom: 16px;
}

.search-bar-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border-radius: 10px;
  padding: 0 12px;
  height: 38px;
  margin-bottom: 10px;
  transition: background 0.2s;
}

.search-bar-mini:focus-within {
  background: #eeeeee;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.15);
}

.search-input-mini {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  color: #1a1a1a;
  padding: 0;
}

.search-input-mini::placeholder {
  color: #aaa;
}

.clear-mini {
  background: none;
  border: none;
  padding: 4px;
  display: flex;
  cursor: pointer;
  border-radius: 50%;
}

.clear-mini:active { background: #ddd; }

/* Filter chips row */
.filter-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 2px;
}

.filter-chips::-webkit-scrollbar { display: none; }

.f-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 16px;
  border: 1.5px solid #e0e0e0;
  background: white;
  font-size: 0.75rem;
  font-weight: 500;
  color: #555;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.f-chip.active {
  background: #1A3263;
  color: white;
  border-color: #1A3263;
}

.f-chip-nouveau.active { background: #EA4335; border-color: #EA4335; }
.f-chip-info.active { background: #4285F4; border-color: #4285F4; }
.f-chip-success.active { background: #34A853; border-color: #34A853; }
.f-chip-danger.active { background: #78909C; border-color: #78909C; }

.f-chip:not(.active):active { background: #f5f5f5; transform: scale(0.96); }

.f-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.f-chip.active .f-dot { background: white !important; }

/* ===== Sections ===== */
.reports-section {
  margin-bottom: 18px;
}

/* ===== Report Cards ===== */
.reports-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  animation: cardIn 0.25s ease-out both;
}

.report-card:active {
  transform: scale(0.98);
  background: #fafafa;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Left indicator */
.card-left {
  flex-shrink: 0;
}

.card-status-indicator {
  width: 4px;
  height: 36px;
  border-radius: 2px;
}

.ind-nouveau { background: #EA4335; }
.ind-info { background: #4285F4; }
.ind-success { background: #34A853; }
.ind-danger { background: #78909C; }
.ind-warning { background: #FBBC04; }

/* Center content */
.card-center {
  flex: 1;
  min-width: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.card-title {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}

.my-badge {
  flex-shrink: 0;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 2px 7px;
  border-radius: 8px;
  background: #EEF2FF;
  color: #4F46E5;
  border: 1px solid #C7D2FE;
  white-space: nowrap;
}

/* My report card highlight */
.report-card.my-report {
  border-left: 3px solid #4F46E5;
  background: #FAFAFF;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.card-city {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.76rem;
  color: #666;
  font-weight: 500;
}

.card-status-label {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.label-nouveau { background: #FEE2E2; color: #DC2626; }
.label-info { background: #DBEAFE; color: #2563EB; }
.label-success { background: #D1FAE5; color: #059669; }
.label-danger { background: #F1F5F9; color: #64748B; }
.label-warning { background: #FEF3C7; color: #D97706; }

/* Right actions */
.card-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.card-action-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-action-btn:active { transform: scale(0.88); }

.card-locate {
  background: #EEF2FF;
  color: #4285F4;
}

.card-locate svg { stroke: #4285F4; }
.card-locate:active { background: #DBEAFE; }

.card-delete {
  background: #FEF2F2;
  color: #EF4444;
}

.card-delete svg { stroke: #EF4444; }
.card-delete:active { background: #FEE2E2; }

/* ===== Empty State ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  gap: 8px;
}

.empty-state p {
  color: #999;
  font-size: 0.85rem;
  margin: 0;
}

.reset-btn {
  background: none;
  border: none;
  color: #4285F4;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  margin-top: 4px;
}

.reset-btn:active { opacity: 0.7; }

/* ===== Show More ===== */
.show-more-btn {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  background: #f8f9fa;
  border: 1px dashed #ddd;
  border-radius: 10px;
  color: #4285F4;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.show-more-btn:active {
  background: #eef2ff;
}
</style>
