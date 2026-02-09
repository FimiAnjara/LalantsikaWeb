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
        <!-- Toggle Tous / Les miens -->
        <div class="toggle-bar">
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'all' }" 
            @click="viewMode = 'all'"
          >Tous</button>
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'mine' }" 
            @click="viewMode = 'mine'"
          >Les miens</button>
        </div>

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

        <!-- Courbe d'évolution des signalements par date -->
        <div class="chart-section timeline-section">
          <h3 class="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Évolution des signalements
          </h3>
          <div class="timeline-chart curve-chart">
            <div class="chart-area">
              <!-- Lignes de grille verticales pour l'axe X (signalements) -->
              <div class="grid-lines-vertical">
                <div v-for="i in 5" :key="'grid-v-' + i" class="grid-line-vertical" :style="{ left: (i * 20) + '%' }">
                  <span class="grid-label-x">{{ Math.round(maxDateCount * i / 5) }}</span>
                </div>
              </div>
              
              <!-- Labels des dates sur l'axe Y -->
              <div class="y-axis-labels">
                <div 
                  v-for="(item, index) in dateChartData" 
                  :key="'label-' + index"
                  class="y-label"
                  :style="{ bottom: (index / (dateChartData.length - 1) * 100) + '%' }"
                >
                  {{ item.label }}
                </div>
              </div>
              
              <!-- SVG pour la courbe -->
              <svg class="curve-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <!-- Dégradé sous la courbe -->
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#4285F4;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#4285F4;stop-opacity:0.05" />
                  </linearGradient>
                </defs>
                
                <!-- Zone sous la courbe -->
                <path
                  :d="curveAreaPath"
                  fill="url(#curveGradient)"
                  class="curve-area"
                />
                
                <!-- Ligne de la courbe -->
                <path
                  :d="curvePath"
                  fill="none"
                  stroke="#4285F4"
                  stroke-width="0.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="curve-line"
                />
                
                <!-- Points sur la courbe -->
                <g class="curve-points">
                  <circle
                    v-for="(point, index) in curvePoints"
                    :key="'point-' + index"
                    :cx="point.x"
                    :cy="point.y"
                    r="1.5"
                    fill="#1967D2"
                    stroke="white"
                    stroke-width="0.5"
                    class="curve-point"
                    :style="{ animationDelay: (index * 0.08 + 0.2) + 's' }"
                    @mouseenter="hoveredPoint = index"
                    @mouseleave="hoveredPoint = null"
                  />
                </g>
              </svg>
              
              <!-- Tooltips -->
              <div
                v-for="(item, index) in dateChartData"
                :key="'tooltip-' + index"
                class="curve-tooltip"
                :class="{ visible: hoveredPoint === index }"
                :style="{
                  left: (item.total / maxDateCount * 100) + '%',
                  bottom: (index / (dateChartData.length - 1) * 100) + '%'
                }"
              >
                <div class="tooltip-content">
                  <div class="tooltip-header">{{ item.label }}</div>
                  <div class="tooltip-row"><strong>{{ item.total }}</strong> signalements</div>
                  <div class="tooltip-details">
                    <div class="tooltip-detail nouveau">● {{ item.nouveau }} nouveaux</div>
                    <div class="tooltip-detail info">● {{ item.info }} en cours</div>
                    <div class="tooltip-detail success">● {{ item.success }} terminés</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Légende -->
            <div class="chart-legend-inline">
              <div class="legend-axis">
                <span class="axis-label">↔ Signalements</span>
                <span class="axis-label">↕ Dates</span>
              </div>
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
import { ref, computed } from 'vue';
import SpinnerLoader from '@/components/SpinnerLoader.vue';
import { Signalement, getStatutType } from '@/models';

// Props
const props = withDefaults(defineProps<{
  signalements: Signalement[];
  mySignalements?: Signalement[];
  isLoading: boolean;
  isFullscreen?: boolean;
}>(), {
  isFullscreen: false,
  mySignalements: () => []
});

// Emits
defineEmits<{
  (e: 'close'): void;
}>();

// Toggle state
const viewMode = ref<'all' | 'mine'>('all');

// Hovered point for tooltip
const hoveredPoint = ref<number | null>(null);

// Data source based on toggle
const activeSignalements = computed(() => {
  return viewMode.value === 'mine' ? (props.mySignalements || []) : props.signalements;
});

// Computed
const totalSignalements = computed(() => activeSignalements.value.length);

const totalBudget = computed(() => {
  return activeSignalements.value.reduce((sum, sig) => {
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
  return activeSignalements.value.reduce((sum, sig) => {
    return sum + (sig.surface || 0);
  }, 0);
});

const statusStats = computed(() => {
  const stats = [
    { type: 'nouveau', label: 'Nouveau', count: 0, color: '#EA4335' },
    { type: 'info', label: 'En cours', count: 0, color: '#4285F4' },
    { type: 'success', label: 'Terminé', count: 0, color: '#34A853' }
  ];

  activeSignalements.value.forEach(sig => {
    const type = getStatutType(sig.statut.id_statut);
    const stat = stats.find(s => s.type === type);
    if (stat) stat.count++;
  });

  const total = activeSignalements.value.length || 1;
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

// Parse date from signalement (handles Firestore timestamps, ISO strings, etc.)
const parseDate = (daty: any): Date | null => {
  if (!daty) return null;
  if (daty instanceof Date) return daty;
  if (typeof daty === 'string') {
    const d = new Date(daty);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof daty === 'object') {
    if (daty._seconds !== undefined) return new Date(daty._seconds * 1000);
    if (daty.seconds !== undefined) return new Date(daty.seconds * 1000);
    if (daty.toDate && typeof daty.toDate === 'function') return daty.toDate();
  }
  if (typeof daty === 'number') return new Date(daty);
  return null;
};

// Date chart data: group signalements by month for curve display
const dateChartData = computed(() => {
  const monthMap = new Map<string, { nouveau: number; info: number; success: number }>();
  
  activeSignalements.value.forEach(sig => {
    const date = parseDate(sig.daty);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { nouveau: 0, info: 0, success: 0 });
    }
    const bucket = monthMap.get(key)!;
    const type = getStatutType(sig.statut.id_statut);
    if (type === 'nouveau') bucket.nouveau++;
    else if (type === 'info') bucket.info++;
    else if (type === 'success') bucket.success++;
    else bucket.nouveau++; // fallback
  });

  // Sort by date key
  const sorted = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  // Take last 6 months max
  const recent = sorted.slice(-6);

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  return recent.map(([key, counts]) => {
    const [, m] = key.split('-');
    const monthIdx = parseInt(m) - 1;
    const total = counts.nouveau + counts.info + counts.success;
    
    return {
      label: monthNames[monthIdx],
      total,
      nouveau: counts.nouveau,
      info: counts.info,
      success: counts.success
    };
  });
});

const maxDateCount = computed(() => {
  if (dateChartData.value.length === 0) return 1;
  return Math.max(...dateChartData.value.map(d => d.total), 1);
});

// Curve path computation (SVG path)
const curvePoints = computed(() => {
  return dateChartData.value.map((item, index) => ({
    x: (item.total / maxDateCount.value) * 100,
    y: 100 - (index / (dateChartData.value.length - 1) * 100)
  }));
});

const curvePath = computed(() => {
  if (curvePoints.value.length === 0) return '';
  
  let path = `M ${curvePoints.value[0].x} ${curvePoints.value[0].y}`;
  
  // Smooth curve using quadratic bezier
  for (let i = 1; i < curvePoints.value.length; i++) {
    const curr = curvePoints.value[i];
    const prev = curvePoints.value[i - 1];
    const cpX = (prev.x + curr.x) / 2;
    path += ` Q ${cpX} ${prev.y}, ${curr.x} ${curr.y}`;
  }
  
  return path;
});

const curveAreaPath = computed(() => {
  if (curvePoints.value.length === 0) return '';
  
  const firstPoint = curvePoints.value[0];
  const lastPoint = curvePoints.value[curvePoints.value.length - 1];
  
  // Start from bottom-left
  let path = `M 0 ${firstPoint.y}`;
  path += ` L ${firstPoint.x} ${firstPoint.y}`;
  
  // Follow the curve
  for (let i = 1; i < curvePoints.value.length; i++) {
    const curr = curvePoints.value[i];
    const prev = curvePoints.value[i - 1];
    const cpX = (prev.x + curr.x) / 2;
    path += ` Q ${cpX} ${prev.y}, ${curr.x} ${curr.y}`;
  }
  
  // Close path to bottom
  path += ` L 0 ${lastPoint.y}`;
  path += ` Z`;
  
  return path;
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

/* Toggle Bar */
.toggle-bar {
  display: flex;
  background: #f0f0f0;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 1.5rem;
}

.toggle-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  background: transparent;
  color: #666;
}

.toggle-btn.active {
  background: #1A3263;
  color: white;
  box-shadow: 0 2px 8px rgba(26, 50, 99, 0.3);
}

.toggle-btn:not(.active):active {
  background: #e0e0e0;
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

/* ===== Curve Chart ===== */
.timeline-section {
  margin-bottom: 2rem;
}

.timeline-chart {
  margin-top: 0.5rem;
}

.curve-chart {
  background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%);
  border: 1px solid #e1e4e8;
  border-radius: 12px;
  padding: 16px;
}

.chart-area {
  position: relative;
  height: 240px;
  padding-left: 60px;
  padding-bottom: 30px;
  padding-right: 10px;
}

/* Grille verticale pour l'axe X (signalements) */
.grid-lines-vertical {
  position: absolute;
  top: 0;
  left: 60px;
  right: 10px;
  bottom: 30px;
}

.grid-line-vertical {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent 0%, #e9ecef 5%, #e9ecef 95%, transparent 100%);
}

.grid-label-x {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 6px;
  font-size: 0.68rem;
  color: #6a737d;
  font-weight: 500;
}

/* Labels des dates sur l'axe Y */
.y-axis-labels {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 30px;
  width: 55px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.y-label {
  position: absolute;
  right: 8px;
  transform: translateY(50%);
  font-size: 0.72rem;
  color: #0a1e37;
  font-weight: 600;
  white-space: nowrap;
}

/* SVG Courbe */
.curve-svg {
  position: absolute;
  top: 0;
  left: 60px;
  right: 10px;
  bottom: 30px;
  width: calc(100% - 70px);
  height: calc(100% - 30px);
  overflow: visible;
}

.curve-area {
  opacity: 0;
  animation: fadeInArea 1s ease-out 0.3s forwards;
}

@keyframes fadeInArea {
  to { opacity: 1; }
}

.curve-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 1.5s ease-out forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

.curve-point {
  opacity: 0;
  transform-origin: center;
  animation: popPoint 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  cursor: pointer;
  transition: all 0.3s ease;
}

.curve-point:hover {
  r: 2;
  fill: #EA4335;
}

@keyframes popPoint {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Tooltips */
.curve-tooltip {
  position: absolute;
  transform: translate(8px, -50%);
  pointer-events: none;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.curve-tooltip.visible {
  opacity: 1;
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.7rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-header {
  font-weight: 700;
  font-size: 0.75rem;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #4285F4;
}

.tooltip-row {
  margin: 4px 0;
  font-size: 0.72rem;
}

.tooltip-details {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.tooltip-detail {
  font-size: 0.65rem;
  margin: 3px 0;
  opacity: 0.9;
}

.tooltip-detail.nouveau { color: #EA4335; }
.tooltip-detail.info { color: #4285F4; }
.tooltip-detail.success { color: #34A853; }

/* Légende */
.chart-legend-inline {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e1e4e8;
}

.legend-axis {
  display: flex;
  gap: 20px;
  font-size: 0.72rem;
  color: #6a737d;
  font-weight: 500;
}

.axis-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot .dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
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

.progress-nouveau {
  background: linear-gradient(90deg, #EA4335 0%, #ff6b7a 100%);
}

.progress-warning {
  background: linear-gradient(90deg, #ff9800 0%, #ffc947 100%);
}

.progress-info {
  background: linear-gradient(90deg, #4285F4 0%, #64b5f6 100%);
}

.progress-success {
  background: linear-gradient(90deg, #34A853 0%, #66bb6a 100%);
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
