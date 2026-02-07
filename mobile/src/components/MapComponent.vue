<template>
  <div ref="mapContainer" class="leaflet-map"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    type: string;
    title: string;
  }>;
}>();

const emit = defineEmits<{
  markerClick: [marker: any];
  mapReady: [map: any];
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const markerLayers: L.Marker[] = [];
let searchMarker: L.Marker | null = null;

// Antananarivo par défaut
const defaultCenter: [number, number] = [-18.8792, 47.5079];
const defaultZoom = 13;

const initMap = () => {
  if (!mapContainer.value) return;

  // Attendre un peu pour que le conteneur soit correctement dimensionné
  setTimeout(() => {
    if (!mapContainer.value) return;

    // Initialiser la carte
    map = L.map(mapContainer.value, {
      zoomControl: false,
      attributionControl: false
    }).setView(
      props.center || defaultCenter,
      props.zoom || defaultZoom
    );

    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 3
    }).addTo(map);

    // Forcer le recalcul de la taille de la carte
    setTimeout(() => {
      map?.invalidateSize();
    }, 200);

    // Essayer d'obtenir la position actuelle
    if (navigator.geolocation && !props.center) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          map?.setView(userLocation, defaultZoom);
          
          // Ajouter un marqueur pour la position de l'utilisateur
          L.marker(userLocation, {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: `<div class="user-marker-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#4285F4" stroke="white" stroke-width="2">
                  <circle cx="12" cy="12" r="8"/>
                </svg>
              </div>`,
              iconSize: [24, 24]
            })
          }).addTo(map!).bindPopup('Votre position');
        },
        (error) => {
          console.warn('Géolocalisation échouée, utilisation de la position par défaut:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    emit('mapReady', map);
    
    // Mettre à jour les marqueurs après l'initialisation de la carte
    updateMarkers();
  }, 100);
};

const updateMarkers = () => {
  if (!map) {
    console.log('updateMarkers: carte non initialisée');
    return;
  }
  
  // Supprimer d'abord tous les anciens marqueurs
  markerLayers.forEach(marker => {
    marker.off(); // Supprimer tous les event listeners
    marker.remove();
  });
  markerLayers.length = 0;
  
  if (!props.markers || props.markers.length === 0) {
    console.log('updateMarkers: aucun marqueur à afficher');
    return;
  }

  console.log('updateMarkers: affichage de', props.markers.length, 'marqueurs');

  // Ajouter les nouveaux marqueurs
  props.markers.forEach(markerData => {
    console.log('Ajout marqueur:', markerData.id, markerData.lat, markerData.lng, markerData.type);
    const colors = getMarkerColors(markerData.type);
    const iconPath = getMarkerIconPath(markerData.type);
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="gm-pin-marker">
        <svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.8 14 24 14 24s14-14.2 14-24C28 6.27 21.73 0 14 0z" fill="${colors.bg}"/>
          <circle cx="14" cy="14" r="8" fill="white"/>
          ${iconPath}
        </svg>
      </div>`,
      iconSize: [28, 38],
      iconAnchor: [14, 38]
    });

    const marker = L.marker([markerData.lat, markerData.lng], {
      icon: markerIcon
    })
      .addTo(map!)
      .on('click', () => {
        // Close any open popup before emitting
        map?.closePopup();
        emit('markerClick', markerData);
      });

    markerLayers.push(marker);
  });
};

const getMarkerColors = (type: string): { bg: string; border: string } => {
  const colorMap: Record<string, { bg: string; border: string }> = {
    nouveau: { bg: '#EA4335', border: '#c5221f' },
    danger: { bg: '#78909C', border: '#546E7A' },
    info: { bg: '#4285F4', border: '#1a73e8' },
    warning: { bg: '#FBBC04', border: '#e5a349' },
    success: { bg: '#34A853', border: '#1e8b4d' }
  };
  return colorMap[type] || colorMap.info;
};

// Icônes SVG dans le cercle blanc du pin pour montrer l'avancement
const getMarkerIconPath = (type: string): string => {
  const icons: Record<string, string> = {
    // Nouveau - point d'exclamation (alerte rouge)
    nouveau: `<g transform="translate(9.5, 9.5) scale(0.38)">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#EA4335" stroke-width="2.5"/>
      <line x1="12" y1="8" x2="12" y2="13" stroke="#EA4335" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="12" cy="16" r="1.2" fill="#EA4335"/>
    </g>`,
    // En cours (info) - flèches de rotation
    info: `<g transform="translate(9, 9) scale(0.42)">
      <path d="M21 12a9 9 0 1 1-6.22-8.56" fill="none" stroke="#4285F4" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M21 3v5h-5" fill="none" stroke="#4285F4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,
    // Terminé (success) - check
    success: `<g transform="translate(9, 9) scale(0.42)">
      <polyline points="20 6 9 17 4 12" fill="none" stroke="#34A853" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,
    // Rejeté (danger) - croix
    danger: `<g transform="translate(9, 9) scale(0.42)">
      <line x1="18" y1="6" x2="6" y2="18" stroke="#78909C" stroke-width="3" stroke-linecap="round"/>
      <line x1="6" y1="6" x2="18" y2="18" stroke="#78909C" stroke-width="3" stroke-linecap="round"/>
    </g>`,
    // Fallback warning
    warning: `<g transform="translate(9.5, 9.5) scale(0.38)">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="#FBBC04" stroke="#e5a349" stroke-width="1"/>
    </g>`
  };
  return icons[type] || icons.info;
};

// Méthode publique pour recentrer la carte
const setView = (center: [number, number], zoom?: number) => {
  if (map) {
    map.setView(center, zoom || map.getZoom());
  }
};

// Méthode pour obtenir le centre actuel de la carte
const getCenter = (): [number, number] | null => {
  if (map) {
    const center = map.getCenter();
    return [center.lat, center.lng];
  }
  return null;
};

// Méthode pour forcer le rafraîchissement de la carte
const invalidateSize = () => {
  if (map) {
    setTimeout(() => {
      map?.invalidateSize();
    }, 100);
  }
};

// Méthode pour ajouter/mettre à jour le marqueur de recherche (cercle bleu)
const setSearchMarker = (lat: number, lng: number, label?: string) => {
  if (!map) return;
  
  // Supprimer l'ancien marqueur de recherche s'il existe
  if (searchMarker) {
    searchMarker.remove();
    searchMarker = null;
  }
  
  // Créer le nouveau marqueur de recherche (style cercle bleu comme la position utilisateur)
  searchMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'search-location-marker',
      html: `<div class="search-marker-icon">
        <div class="search-marker-pulse"></div>
        <div class="search-marker-dot"></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }).addTo(map);
  
  if (label) {
    searchMarker.bindPopup(label).openPopup();
  }
};

// Méthode pour supprimer le marqueur de recherche
const clearSearchMarker = () => {
  if (searchMarker) {
    searchMarker.remove();
    searchMarker = null;
  }
};

// Méthode pour obtenir l'instance Leaflet brute (pour projections avancées)
const getMapInstance = (): L.Map | null => map;

// Exposer les méthodes publiques
defineExpose({
  setView,
  getCenter,
  invalidateSize,
  setSearchMarker,
  clearSearchMarker,
  getMapInstance
});

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

watch(() => props.markers, updateMarkers, { deep: true, immediate: true });
</script>

<style scoped>
.leaflet-map {
  width: 100%;
  height: 100%;
  z-index: 0;
}

:deep(.user-marker-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* ========================================
   GOOGLE MAPS PIN MARKERS
   ======================================== */
:deep(.gm-pin-marker) {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.2s ease;
  cursor: pointer;
}

:deep(.gm-pin-marker svg) {
  display: block;
}

/* Hover / tap effect */
:deep(.custom-marker:hover .gm-pin-marker) {
  transform: scale(1.15);
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
}

/* Marqueur de recherche - cercle bleu avec animation pulse */
:deep(.search-marker-icon) {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.search-marker-dot) {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.5);
  z-index: 2;
}

:deep(.search-marker-pulse) {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(33, 150, 243, 0.3);
  border-radius: 50%;
  animation: searchPulse 2s ease-out infinite;
  z-index: 1;
}

@keyframes searchPulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
</style>
