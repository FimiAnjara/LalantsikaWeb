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
import { App } from '@capacitor/app';
import { useRouter } from 'vue-router';
import { pushNotificationService } from './services/notification';
import GeometricBackground from './components/GeometricBackground.vue';

const router = useRouter();

onMounted(async () => {
  // Initialiser les notifications push uniquement sur mobile
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Plateforme native détectée - Initialisation des notifications push...');
    await pushNotificationService.init();
    
    // Gérer le bouton retour Android
    App.addListener('backButton', ({ canGoBack }) => {
      const currentRoute = router.currentRoute.value;
      const routeName = currentRoute.name as string;
      
      // Sur la page principale (Map), quitter l'app
      if (routeName === 'Map' || routeName === 'Home') {
        App.exitApp();
        return;
      }
      
      // Sur Login, Splash, Welcome : quitter l'app (pas de retour)
      if (['Login', 'SplashPage', 'Welcome'].includes(routeName)) {
        App.exitApp();
        return;
      }
      
      // Pour les autres pages, retour normal
      if (canGoBack) {
        router.back();
      } else {
        // Fallback : aller à la carte
        router.push({ name: 'Map' });
      }
    });
  } else {
    console.log('🌐 Mode navigateur - Les notifications push natives ne sont pas disponibles');
  }
});
</script>
