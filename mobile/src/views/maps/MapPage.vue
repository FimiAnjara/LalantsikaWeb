<template>
  <ion-page>
    <ion-content :fullscreen="true" class="map-page">
      
      <!-- Spinner Fullscreen pour recherche de ville, suppression et déconnexion -->
      <SpinnerLoader 
        v-if="isSearching || isDeleting || isLoggingOut" 
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
        <div class="profile-container">
          <button class="profile-btn" @click="toggleProfileMenu">
            <img v-if="userPhotoUrl" :src="userPhotoUrl" alt="Photo de profil" class="profile-photo" />
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="7" r="4"/>
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>
            </svg>
          </button>
        </div>
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
      <SavedReportsCard
        v-if="activeMenu === 'saved'"
        :my-reports="myReports"
        :all-reports="allReports"
        :is-loading="isLoadingList"
        @close="activeMenu = 'map'"
        @open-details="openReportDetails"
        @delete="deleteReport"
      />

      <!-- Carte flottante Recap/Dashboard -->
      <RecapCard
        v-if="activeMenu === 'recap'"
        :signalements="allSignalements"
        :is-loading="isLoadingList"
        @close="backToMap"
      />

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
import { IonPage, IonContent, alertController, actionSheetController, onIonViewWillEnter } from '@ionic/vue';
import MapComponent from '@/components/MapComponent.vue';
import SpinnerLoader from '@/components/SpinnerLoader.vue';
import SavedReportsCard from '@/components/maps/SavedReportsCard.vue';
import RecapCard from '@/components/maps/RecapCard.vue';
import router from '@/router';
import { signalementService } from '@/services/signalement';
import { authService } from '@/services/auth';
import { toastService } from '@/services/toast';
import { Signalement, getStatutType } from '@/models';
import { auth, db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const mapComponent = ref<any>(null);
const searchQuery = ref('');
const activeMenu = ref('map');
const reportMode = ref(false);
const isLoadingList = ref(false); // Pour la liste des signalements seulement
const isSearching = ref(false);
const isDeleting = ref(false);
const isValidating = ref(false); // Pour le bouton de validation
const loadingMessage = ref('Chargement...');
const mapFilter = ref<'all' | 'mine'>('all'); // Filtre pour la carte
const userPhotoUrl = ref<string | null>(null); // Photo de profil utilisateur
const isLoggingOut = ref(false); // Spinner pour la déconnexion

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

// Marqueurs filtrés pour la carte
const currentMarkers = computed(() => {
  if (mapFilter.value === 'mine') {
    return mySignalements.value.map(sig => signalementService.signalementToMarker(sig));
  }
  return markers.value;
});

// Charger les signalements au montage
onMounted(async () => {
  await loadSignalements();
  await loadUserPhoto();
});

// Charger la photo de profil de l'utilisateur
const loadUserPhoto = async () => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    // Chercher dans Firestore
    const usersRef = collection(db, 'utilisateurs');
    let q = query(usersRef, where('uid', '==', firebaseUser.uid));
    let snapshot = await getDocs(q);

    if (snapshot.empty && firebaseUser.email) {
      q = query(usersRef, where('email', '==', firebaseUser.email));
      snapshot = await getDocs(q);
    }

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      if (userData.photoUrl) {
        userPhotoUrl.value = userData.photoUrl;
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la photo de profil:', error);
  }
};

// Recharger les signalements à chaque retour sur la page
onIonViewWillEnter(async () => {
  console.log('🔄 Retour sur MapPage - Rechargement des signalements...');
  await loadSignalements();
  await loadUserPhoto();
  
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
      console.log('✅ Mes signalements chargés:', mySignalements.value.length);
    } catch (error) {
      // Si erreur (utilisateur non connecté), on ignore
      console.error('❌ Impossible de charger mes signalements:', error);
      mySignalements.value = [];
    }
    
    console.log('📊 Résumé: Total =', allSignalements.value.length, ', Mes signalements =', mySignalements.value.length);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des signalements:', error);
    toastService.error('Erreur lors du chargement des signalements');
  } finally {
    isLoadingList.value = false;
  }
};

// Rafraîchir les données
const refreshData = async () => {
  await loadSignalements();
  toastService.success('Données actualisées');
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
      const { lat, lon, display_name } = data[0];
      const locationName = display_name.split(',')[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      // Centrer la carte sur le lieu trouvé
      mapComponent.value?.setView([latitude, longitude], 14);
      
      // Ajouter un marqueur bleu sur le lieu recherché
      mapComponent.value?.setSearchMarker(latitude, longitude, locationName);
      
      toastService.success(`Localisation: ${locationName}`);
    } else {
      toastService.warning('Ville non trouvée');
    }
  } catch (error) {
    console.error('Erreur de recherche:', error);
    toastService.error('Erreur lors de la recherche');
  } finally {
    isSearching.value = false;
  }
};

// Gestion du menu profil avec Action Sheet
const toggleProfileMenu = async () => {
  const actionSheet = await actionSheetController.create({
    header: 'Menu',
    cssClass: 'profile-action-sheet',
    buttons: [
      {
        text: 'Mon Profil',
        icon: 'person-circle-outline',
        handler: () => {
          router.push({ name: 'Profile' });
        }
      },
      {
        text: 'Déconnexion',
        icon: 'log-out-outline',
        role: 'destructive',
        handler: () => {
          showLogoutConfirm();
        }
      },
      {
        text: 'Annuler',
        icon: 'close-outline',
        role: 'cancel'
      }
    ]
  });
  await actionSheet.present();
};

const showLogoutConfirm = async () => {
  const alert = await alertController.create({
    header: 'Déconnexion',
    message: 'Voulez-vous vraiment vous déconnecter ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Déconnexion',
        role: 'destructive',
        handler: () => {
          performLogout();
          return true;
        }
      }
    ]
  });
  await alert.present();
};

const performLogout = async () => {
  isLoggingOut.value = true;
  loadingMessage.value = 'Déconnexion en cours...';
  
  try {
    await authService.logout();
    toastService.success('À bientôt !', 'Déconnexion réussie');
    
    setTimeout(() => {
      router.push({ name: 'Login' });
    }, 800);
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    toastService.error('Erreur lors de la déconnexion');
  } finally {
    isLoggingOut.value = false;
  }
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
    toastService.success('Signalement supprimé');
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    toastService.error('Erreur lors de la suppression');
  } finally {
    isDeleting.value = false;
  }
};

// Mode signalement
const startReportMode = () => {
  reportMode.value = true;
  toastService.info('Déplacez la carte pour positionner le marqueur');
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
      toastService.error('Erreur lors de la validation');
    } finally {
      isValidating.value = false;
    }
  } else {
    toastService.error('Impossible de récupérer la position');
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
  z-index: 1010;
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
  overflow: hidden;
  padding: 0;
}

.profile-btn .profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.profile-btn:hover {
  background: #1a3a5f;
  transform: scale(1.05);
}

/* Container du profil */
.profile-container {
  position: relative;
}

/* Filtre de la carte */
.map-filter {
  position: absolute;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1005;
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

</style>
