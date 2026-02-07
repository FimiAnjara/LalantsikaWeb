<template>
  <ion-page>
    <ion-content :fullscreen="true" class="map-page">
      
      <!-- Spinner Fullscreen pour recherche de ville, suppression et déconnexion -->
      <SpinnerLoader 
        v-if="isSearching || isDeleting || isLoggingOut" 
        :fullscreen="true" 
        :message="loadingMessage" 
      />
      
      <!-- Header Google Maps style -->
      <div class="gm-header">
        <!-- Barre de recherche style Google Maps -->
        <div class="gm-search-bar">
          <img src="/logo/logo4.png" alt="Logo" class="gm-search-logo" />
          <input 
            type="text" 
            v-model="searchQuery"
            @keyup.enter="searchCity"
            placeholder="Rechercher une ville..." 
            class="gm-search-input"
          />
          <button class="gm-profile-btn" @click="toggleProfileMenu">
            <img v-if="userPhotoUrl" :src="userPhotoUrl" alt="Profil" class="gm-profile-photo" />
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="#547792">
              <circle cx="12" cy="8" r="4"/>
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0" fill="#547792"/>
            </svg>
          </button>
        </div>

        <!-- Filtres chips style Google Maps -->
        <div v-if="!reportMode" class="gm-chips-row">
          <button 
            class="gm-chip" 
            :class="{ active: mapFilter === 'all' }"
            @click="mapFilter = 'all'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
            </svg>
            <span>Tous</span>
          </button>
          <button 
            class="gm-chip" 
            :class="{ active: mapFilter === 'mine' }"
            @click="mapFilter = 'mine'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Les miens</span>
          </button>
          <button 
            class="gm-chip gm-chip--nouveau" 
            :class="{ active: mapFilter === 'nouveau' }"
            @click="mapFilter = 'nouveau'"
          >
            <span class="gm-chip-dot" style="background:#EA4335;"></span>
            <span>Nouveau</span>
          </button>
          <button 
            class="gm-chip gm-chip--info" 
            :class="{ active: mapFilter === 'info' }"
            @click="mapFilter = 'info'"
          >
            <span class="gm-chip-dot" style="background:#4285F4;"></span>
            <span>En cours</span>
          </button>
          <button 
            class="gm-chip gm-chip--success" 
            :class="{ active: mapFilter === 'success' }"
            @click="mapFilter = 'success'"
          >
            <span class="gm-chip-dot" style="background:#34A853;"></span>
            <span>Terminé</span>
          </button>
          <button 
            class="gm-chip gm-chip--danger" 
            :class="{ active: mapFilter === 'danger' }"
            @click="mapFilter = 'danger'"
          >
            <span class="gm-chip-dot" style="background:#78909C;"></span>
            <span>Rejeté</span>
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
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      <!-- Icône de localisation centrale (en mode signalement) - Rouge Google Maps -->
      <div v-if="reportMode" class="center-marker">
        <svg width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0C8.96 0 0 8.96 0 20c0 14 20 36 20 36s20-22 20-36C40 8.96 31.04 0 20 0z" fill="#EA4335"/>
          <circle cx="20" cy="20" r="8" fill="white"/>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button class="validate-btn" @click="validateReport" :disabled="isValidating">
          <span v-if="isValidating" class="btn-spinner"></span>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
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

      <!-- Menu horizontal en bas - style moderne flottant -->
      <div class="gm-bottom-menu">
        <button 
          class="gm-menu-item" 
          :class="{ active: activeMenu === 'map' }"
          @click="backToMap"
        >
          <div class="gm-menu-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
          </div>
          <span>Carte</span>
        </button>

        <button 
          class="gm-menu-item" 
          :class="{ active: activeMenu === 'saved' }"
          @click="openSignalementsList"
        >
          <div class="gm-menu-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span>Signalements</span>
        </button>

        <button 
          class="gm-menu-item" 
          :class="{ active: activeMenu === 'recap' }"
          @click="activeMenu = 'recap'"
        >
          <div class="gm-menu-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
              <path d="M22 12A10 10 0 0 0 12 2v10z"/>
            </svg>
          </div>
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
const mapFilter = ref<'all' | 'mine' | 'nouveau' | 'info' | 'success' | 'danger'>('all'); // Filtre pour la carte
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
  let source = allSignalements.value;
  
  if (mapFilter.value === 'mine') {
    source = mySignalements.value;
  }
  
  const mapped = source.map(sig => signalementService.signalementToMarker(sig));
  
  // Filtrage par statut
  if (['nouveau', 'info', 'success', 'danger'].includes(mapFilter.value)) {
    return mapped.filter(m => m.type === mapFilter.value);
  }
  
  return mapped;
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
  --background: #E8E2DB;
}

/* ========================================
   HEADER - Google Maps Style
   ======================================== */
.gm-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1010;
  padding: calc(env(safe-area-inset-top, 12px) + 10px) 14px 0 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Barre de recherche pill Google Maps */
.gm-search-bar {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 28px;
  height: 48px;
  padding: 0 6px 0 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08);
  gap: 10px;
  transition: box-shadow 0.2s ease;
}

.gm-search-bar:focus-within {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
}

.gm-search-logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
  flex-shrink: 0;
}

.gm-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1A3263;
  background: transparent;
  min-width: 0;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.gm-search-input::placeholder {
  color: #547792;
  font-weight: 400;
}

/* Bouton profil dans la barre de recherche */
.gm-profile-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #E8E2DB;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  transition: transform 0.2s ease, background 0.2s ease;
}

.gm-profile-btn:active {
  transform: scale(0.92);
}

.gm-profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* ========================================
   CHIPS / FILTRES - Google Maps Style
   ======================================== */
.gm-chips-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 2px 4px 2px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.gm-chips-row::-webkit-scrollbar {
  display: none;
}

.gm-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #1A3263;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.gm-chip svg {
  stroke: #547792;
  flex-shrink: 0;
}

.gm-chip.active {
  background: #1A3263;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(26, 50, 99, 0.35);
}

.gm-chip.active svg {
  stroke: #FAB95B;
}

.gm-chip:not(.active):active {
  background: #f0ece7;
  transform: scale(0.96);
}

/* Dots de couleur dans les chips de statut */
.gm-chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Chips de statut actifs avec leur couleur propre */
.gm-chip--nouveau.active {
  background: #EA4335;
  color: #fff;
  box-shadow: 0 2px 8px rgba(234, 67, 53, 0.35);
}
.gm-chip--nouveau.active .gm-chip-dot { background: #fff !important; }

.gm-chip--info.active {
  background: #4285F4;
  color: #fff;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.35);
}
.gm-chip--info.active .gm-chip-dot { background: #fff !important; }

.gm-chip--success.active {
  background: #34A853;
  color: #fff;
  box-shadow: 0 2px 8px rgba(52, 168, 83, 0.35);
}
.gm-chip--success.active .gm-chip-dot { background: #fff !important; }

.gm-chip--danger.active {
  background: #78909C;
  color: #fff;
  box-shadow: 0 2px 8px rgba(120, 144, 156, 0.35);
}
.gm-chip--danger.active .gm-chip-dot { background: #fff !important; }

/* ========================================
   BOUTON SIGNALER - Flottant
   ======================================== */
.report-btn {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 90px);
  right: 16px;
  z-index: 1000;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #FAB95B;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(250, 185, 91, 0.45);
  transition: all 0.25s ease;
}

.report-btn:active {
  transform: scale(0.92);
  box-shadow: 0 2px 10px rgba(250, 185, 91, 0.5);
}

/* ========================================
   MARQUEUR CENTRAL (mode signalement)
   ======================================== */
.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  z-index: 999;
  pointer-events: none;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translate(-50%, -100%);
  }
  50% {
    transform: translate(-50%, -106%);
  }
}

/* ========================================
   BOUTONS D'ACTION (mode signalement)
   ======================================== */
.action-buttons {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 90px);
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cancel-btn,
.validate-btn {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #547792;
}

.cancel-btn:active {
  transform: scale(0.92);
  background: #456478;
}

.validate-btn {
  background: #1A3263;
}

.validate-btn:active:not(:disabled) {
  transform: scale(0.92);
  background: #142850;
}

.validate-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner dans les boutons */
.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: btn-spin 0.8s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

/* ========================================
   MAP
   ======================================== */
.map-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 72px;
  width: 100%;
  background: #E8E2DB;
}

/* ========================================
   BOTTOM MENU - Style moderne flottant
   ======================================== */
.gm-bottom-menu {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #1A3263;
  padding: 6px 0 calc(env(safe-area-inset-bottom, 6px) + 4px) 0;
  border-radius: 0;
  box-shadow: none;
}

.gm-menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px 4px 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.gm-menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.gm-menu-item svg {
  stroke: #8a9bba;
  transition: stroke 0.25s ease;
}

.gm-menu-item span {
  font-size: 0.68rem;
  font-weight: 500;
  color: #8a9bba;
  letter-spacing: 0.02em;
  transition: color 0.25s ease;
}

/* État actif */
.gm-menu-item.active .gm-menu-icon {
  background: rgba(250, 185, 91, 0.15);
}

.gm-menu-item.active svg {
  stroke: #FAB95B;
}

.gm-menu-item.active span {
  color: #FAB95B;
  font-weight: 600;
}

/* Ligne horizontale indicateur actif */
.gm-menu-item.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 3px;
  background: #FAB95B;
  border-radius: 0 0 3px 3px;
}

.gm-menu-item:active:not(.active) {
  opacity: 0.7;
}

/* ========================================
   RESPONSIVE - Adaptation appareils
   ======================================== */

/* Petits écrans (< 360px) */
@media screen and (max-width: 360px) {
  .gm-header {
    padding-top: calc(env(safe-area-inset-top, 8px) + 6px);
    padding-left: 10px;
    padding-right: 10px;
  }
  .gm-search-bar {
    height: 44px;
    border-radius: 22px;
  }
  .gm-search-input {
    font-size: 14px;
  }
  .gm-chip {
    padding: 6px 12px;
    font-size: 12px;
  }
  .gm-bottom-menu {
    padding-top: 4px;
  }
  .gm-menu-item span {
    font-size: 0.62rem;
  }
}

/* Grands écrans (> 420px) */
@media screen and (max-height: 700px) {
  .gm-header {
    padding-top: calc(env(safe-area-inset-top, 8px) + 6px);
    gap: 6px;
  }
  .gm-search-bar {
    height: 44px;
  }
  .gm-chip {
    padding: 6px 14px;
  }
}

/* Très grands écrans (tablette) */
@media screen and (min-width: 768px) {
  .gm-header {
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
  }
  .gm-bottom-menu {
    max-width: 500px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0;
  }
}
</style>
