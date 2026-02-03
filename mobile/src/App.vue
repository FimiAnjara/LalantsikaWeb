<template>
  <ion-app>
    <GeometricBackground />
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import GeometricBackground from './components/GeometricBackground.vue';
</script>
