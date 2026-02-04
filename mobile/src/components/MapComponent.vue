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
      attributionControl: true
    }).setView(
      props.center || defaultCenter,
      props.zoom || defaultZoom
    );

    // Ajouter les contrôles de zoom en bas à gauche
    L.control.zoom({
      position: 'bottomleft'
    }).addTo(map);

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
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin-container">
        <div class="marker-pin-shape">
          <div class="marker-icon-inner">
            ${getMarkerIconSVG(markerData.type)}
          </div>
        </div>
        <div class="marker-shadow"></div>
      </div>`,
      iconSize: [40, 50],
      iconAnchor: [20, 50]
    });

    const marker = L.marker([markerData.lat, markerData.lng], {
      icon: markerIcon
    })
      .addTo(map!)
      .bindPopup(markerData.title)
      .on('click', () => {
        emit('markerClick', markerData);
      });

    markerLayers.push(marker);
  });
};

const getMarkerIconSVG = (type: string): string => {
  const icons: Record<string, string> = {
    danger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 5v2h2v-2h-2z"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>'
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

// Exposer les méthodes publiques
defineExpose({
  setView,
  getCenter,
  invalidateSize,
  setSearchMarker,
  clearSearchMarker
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

:deep(.marker-pin) {
  width: 32px;
  height: 42px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

:deep(.marker-pin svg) {
  transform: rotate(45deg);
}

:deep(.marker-pin.danger) {
  background: #dc3545;
}

:deep(.marker-pin.warning) {
  background: #ffc107;
}

:deep(.marker-pin.info) {
  background: #17a2b8;
}

:deep(.marker-pin.success) {
  background: #28a745;
}

/* Nouveau style de marqueur - Pin rouge style Google Maps */
:deep(.marker-pin-container) {
  position: relative;
  width: 40px;
  height: 50px;
}

:deep(.marker-pin-shape) {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #e53935 0%, #c62828 50%, #b71c1c 100%);
  border-radius: 50% 50% 50% 0;
  transform: translateX(-50%) rotate(-45deg);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid #fff;
}

:deep(.marker-icon-inner) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.marker-icon-inner svg) {
  width: 18px;
  height: 18px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

:deep(.marker-shadow) {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 6px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, transparent 70%);
  border-radius: 50%;
}

/* Animation au survol */
:deep(.custom-marker:hover .marker-pin-shape) {
  transform: translateX(-50%) rotate(-45deg) scale(1.1);
  transition: transform 0.2s ease;
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
