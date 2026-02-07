<template>
  <ion-app>
    <GeometricBackground />
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { pushNotificationService } from './services/notification';
import GeometricBackground from './components/GeometricBackground.vue';

onMounted(async () => {
  // Initialiser les notifications push uniquement sur mobile
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Plateforme native détectée - Initialisation des notifications push...');
    await pushNotificationService.init();
  } else {
    console.log('🌐 Mode navigateur - Les notifications push natives ne sont pas disponibles');
  }
});
</script>
