<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Mon Profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="profile-page">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="avatar-container">
          <div class="avatar">
            <span class="avatar-initial">{{ user.prenom?.charAt(0) || 'U' }}</span>
          </div>
        </div>
        <h2 class="user-name">{{ user.name || 'Utilisateur' }}</h2>
        <p class="user-email">{{ user.email }}</p>
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-value">{{ user.reportsCount }}</span>
            <span class="stat-label">Signalements</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ user.joinDate }}</span>
            <span class="stat-label">Membre depuis</span>
          </div>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="profile-content">
        <!-- Personal Information -->
        <div class="section-card">
          <h3 class="section-title">
            <ion-icon :icon="personCircleOutline"></ion-icon>
            Informations personnelles
          </h3>
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Prénom</ion-label>
              <ion-input
                v-model="user.prenom"
                :readonly="!isEditing"
                placeholder="Votre prénom"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Nom</ion-label>
              <ion-input
                v-model="user.nom"
                :readonly="!isEditing"
                placeholder="Votre nom"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Identifiant</ion-label>
              <ion-input
                v-model="user.identifiant"
                :readonly="true"
                placeholder="Identifiant"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input
                v-model="user.email"
                :readonly="true"
                type="email"
                placeholder="votre@email.com"
              ></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Téléphone</ion-label>
              <ion-input
                v-model="user.phone"
                :readonly="!isEditing"
                type="tel"
                placeholder="+261 XX XX XXX XX"
              ></ion-input>
            </ion-item>
          </ion-list>
        </div>

        <!-- Preferences -->
        <div class="section-card">
          <h3 class="section-title">
            <ion-icon :icon="settingsOutline"></ion-icon>
            Préférences
          </h3>
          <ion-list>
            <ion-item>
              <ion-icon :icon="notificationsOutline" slot="start"></ion-icon>
              <ion-label>Notifications</ion-label>
              <ion-toggle v-model="preferences.notifications"></ion-toggle>
            </ion-item>
            <ion-item>
              <ion-icon :icon="locationOutline" slot="start"></ion-icon>
              <ion-label>Partager ma position</ion-label>
              <ion-toggle v-model="preferences.location"></ion-toggle>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="mailOutline" slot="start"></ion-icon>
              <ion-label>Notifications par email</ion-label>
              <ion-toggle v-model="preferences.emailNotifications"></ion-toggle>
            </ion-item>
          </ion-list>
        </div>

        <!-- Account Actions -->
        <div class="section-card">
          <h3 class="section-title">
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            Compte
          </h3>
          <ion-list>
            <ion-item button @click="changePassword" detail>
              <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
              <ion-label>Changer le mot de passe</ion-label>
            </ion-item>
            <ion-item button @click="showDeleteConfirm" detail lines="none" class="danger-item">
              <ion-icon :icon="trashOutline" slot="start" color="danger"></ion-icon>
              <ion-label color="danger">Supprimer le compte</ion-label>
            </ion-item>
          </ion-list>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button
            v-if="!isEditing"
            expand="block"
            @click="isEditing = true"
            class="primary-btn"
          >
            <ion-icon :icon="createOutline" slot="start"></ion-icon>
            Modifier le profil
          </ion-button>
          <template v-else>
            <ion-button expand="block" @click="saveProfile" class="primary-btn">
              <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
              Enregistrer
            </ion-button>
            <ion-button expand="block" fill="outline" @click="cancelEdit">
              Annuler
            </ion-button>
          </template>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  alertController,
  toastController,
} from '@ionic/vue';
import {
  personOutline,
  personCircleOutline,
  cameraOutline,
  settingsOutline,
  notificationsOutline,
  locationOutline,
  mailOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  trashOutline,
  createOutline,
  checkmarkOutline,
} from 'ionicons/icons';
import { authService } from '@/services/auth';
import { getFullName } from '@/models/User';
import router from '@/router';

const isEditing = ref(false);
const loading = ref(true);

const user = ref({
  id: 0,
  name: '',
  prenom: '',
  nom: '',
  email: '',
  phone: '',
  identifiant: '',
  reportsCount: 0,
  joinDate: '',
});

const originalUser = ref({ ...user.value });

// Charger les données utilisateur
onMounted(async () => {
  try {
    const currentUser = await authService.getCurrentUser();
    
    if (currentUser) {
      user.value = {
        id: currentUser.id_utilisateur || 0,
        name: getFullName(currentUser),
        prenom: currentUser.prenom || '',
        nom: currentUser.nom || '',
        email: currentUser.email || '',
        phone: '', // Le champ phone n'existe pas dans le modèle actuel
        identifiant: currentUser.identifiant || '',
        reportsCount: 0, // À calculer depuis la base de données
        joinDate: formatJoinDate(currentUser.last_sync_at || new Date().toISOString())
      };
      originalUser.value = { ...user.value };
    } else {
      // Rediriger vers login si pas d'utilisateur
      router.push({ name: 'Login' });
    }
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du chargement du profil',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
});

// Formater la date d'inscription
const formatJoinDate = (dateString?: string) => {
  if (!dateString) return 'Récemment';
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
};

const preferences = ref({
  notifications: true,
  location: true,
  emailNotifications: false,
});

const saveProfile = async () => {
  // TODO: Implement save logic
  originalUser.value = { ...user.value };
  isEditing.value = false;
  
  const toast = await toastController.create({
    message: 'Profil mis à jour avec succès',
    duration: 2000,
    color: 'success',
    position: 'top',
  });
  await toast.present();
};

const cancelEdit = () => {
  user.value = { ...originalUser.value };
  isEditing.value = false;
};

const changePassword = async () => {
  const alert = await alertController.create({
    header: 'Changer le mot de passe',
    inputs: [
      {
        name: 'currentPassword',
        type: 'password',
        placeholder: 'Mot de passe actuel',
      },
      {
        name: 'newPassword',
        type: 'password',
        placeholder: 'Nouveau mot de passe',
      },
      {
        name: 'confirmPassword',
        type: 'password',
        placeholder: 'Confirmer le mot de passe',
      },
    ],
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
      },
      {
        text: 'Modifier',
        handler: (data) => {
          // TODO: Implement password change logic
          console.log('Change password:', data);
        },
      },
    ],
  });
  await alert.present();
};

const showDeleteConfirm = async () => {
  const alert = await alertController.create({
    header: 'Supprimer le compte',
    message:
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: () => {
          // TODO: Implement account deletion logic
          console.log('Delete account');
        },
      },
    ],
  });
  await alert.present();
};
</script>

<style scoped>
.profile-page {
  --background: #ffffff;
}

/* Profile Header */
.profile-header {
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  padding: 2rem 1.5rem 2rem;
  text-align: center;
  position: relative;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(10, 30, 55, 0.2);
  border: 4px solid white;
}

.avatar-initial {
  color: #dabe24;
  font-size: 2.5rem;
  font-weight: 700;
  text-transform: uppercase;
}

.user-name {
  color: #0a1e37;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.user-email {
  color: #666;
  font-size: 0.875rem;
  margin: 0 0 1.5rem;
}

.user-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  background: white;
  border: 1px solid #e9ecef;
  padding: 1rem;
  border-radius: 16px;
  max-width: 300px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  color: #0a1e37;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  color: #666;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #e9ecef;
}

/* Profile Content */
.profile-content {
  padding: 1.5rem;
  background: #f8f9fa;
}

.section-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #0a1e37;
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f8f9fa;
}

.section-title ion-icon {
  font-size: 1.5rem;
  color: #dabe24;
}

ion-list {
  background: transparent;
  padding: 0;
}

ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
  margin-bottom: 0.5rem;
}

ion-item::part(native) {
  border-radius: 8px;
}

ion-label {
  font-weight: 500;
}

.danger-item {
  margin-top: 0.5rem;
}

/* Action Buttons */
.action-buttons {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.primary-btn {
  --background: linear-gradient(135deg, #0a1e37 0%, #1a3a5f 100%);
  --box-shadow: 0 4px 16px rgba(10, 30, 55, 0.3);
  --border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  height: 48px;
}

ion-button[fill='outline'] {
  --border-color: #0a1e37;
  --color: #0a1e37;
  --border-radius: 12px;
  font-weight: 600;
  height: 48px;
}

/* Responsive Design */
@media (min-width: 768px) {
  .profile-content {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
