<template>
  <div class="recap-card" :class="{ 'fullscreen-mode': isFullscreen }">
    <div class="card-header">
      <div class="header-left">
        <h2>Récapitulatif</h2>
        <span class="header-subtitle">Vue d'ensemble</span>
      </div>
      <button class="close-btn" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="card-body">
      <!-- Spinner de chargement -->
      <SpinnerLoader 
        v-if="isLoading" 
        :fullscreen="false" 
        message="Chargement des statistiques..." 
      />
      
      <!-- Contenu du dashboard -->
      <template v-else>
        <!-- Statistiques principales -->
        <div class="stats-grid">
          <div class="stat-card" style="animation-delay: 0.05s">
            <div class="stat-icon total">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3 class="stat-number">{{ totalSignalements }}</h3>
              <p>Signalements</p>
            </div>
          </div>

          <div class="stat-card" style="animation-delay: 0.1s">
            <div class="stat-icon budget">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3 class="stat-number">{{ formattedBudget }}</h3>
              <p>Budget Total</p>
            </div>
          </div>

          <div class="stat-card" style="animation-delay: 0.15s">
            <div class="stat-icon surface">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3 class="stat-number">{{ totalSurface }} m²</h3>
              <p>Surface Totale</p>
            </div>
          </div>
        </div>

        <!-- Progression par statut -->
        <div class="status-section">
          <h3 class="section-title">Progression des signalements</h3>
          <div class="status-progress-list">
            <div 
              v-for="(stat, index) in statusStats" 
              :key="stat.label" 
              class="status-progress-item"
              :style="{ animationDelay: (index * 0.1 + 0.2) + 's' }"
            >
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
                class="pie-segment"
                :style="{ animationDelay: (index * 0.15 + 0.4) + 's' }"
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SpinnerLoader from '@/components/SpinnerLoader.vue';
import { Signalement, getStatutType } from '@/models';

// Props
const props = withDefaults(defineProps<{
  signalements: Signalement[];
  isLoading: boolean;
  isFullscreen?: boolean;
}>(), {
  isFullscreen: false
});

// Emits
defineEmits<{
  (e: 'close'): void;
}>();

// Computed
const totalSignalements = computed(() => props.signalements.length);

const totalBudget = computed(() => {
  return props.signalements.reduce((sum, sig) => {
    return sum + (sig.budget || 500000);
  }, 0);
});

const formattedBudget = computed(() => {
  const amount = totalBudget.value;
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} M Ar`;
  }
  return `${(amount / 1000).toFixed(0)} K Ar`;
});

const totalSurface = computed(() => {
  return props.signalements.reduce((sum, sig) => {
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

  props.signalements.forEach(sig => {
    const type = getStatutType(sig.statut.id_statut);
    const stat = stats.find(s => s.type === type);
    if (stat) stat.count++;
  });

  const total = props.signalements.length || 1;
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
</script>

<style scoped>
.recap-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  background: white;
}

.recap-card.fullscreen-mode {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  color: white;
  padding-top: calc(env(safe-area-inset-top) + 1rem);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.card-header h2 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0;
}

.header-subtitle {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 2px;
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

.close-btn:active {
  transform: scale(0.9);
}

.close-btn svg {
  stroke: white;
}

.card-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

/* Stats Grid */
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
  animation: statPopIn 0.4s ease-out both;
}

@keyframes statPopIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  stroke: white;
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

.stat-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0a1e37;
}

.stat-number {
  transition: all 0.5s ease;
}

.stat-info p {
  margin: 0.15rem 0 0 0;
  font-size: 0.7rem;
  color: #666;
  font-weight: 500;
}

/* Status Section */
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
  animation: statPopIn 0.4s ease-out both;
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
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
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

/* Chart Section */
.chart-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 16px;
  animation: statPopIn 0.4s ease-out 0.5s both;
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

.pie-segment {
  animation: pieGrow 0.6s ease-out both;
}

@keyframes pieGrow {
  from {
    stroke-dasharray: 0 1000;
  }
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
