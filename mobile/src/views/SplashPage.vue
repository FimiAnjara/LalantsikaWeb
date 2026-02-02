<template>
  <ion-page>
    <ion-content fullscreen class="splash">
      <div ref="container" class="lottie"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import lottie from 'lottie-web'
import animationData from '@/assets/lottie/logo.json'

const container = ref<HTMLDivElement | null>(null)
const router = useRouter()

onMounted(() => {
  lottie.loadAnimation({
    container: container.value!,
    renderer: 'svg',
    loop: false,
    autoplay: true,
    animationData
  })

  setTimeout(() => {
    router.replace('/login')
  }, 4500) // durée animation
})
</script>

<style scoped>
.splash {
  --background: #0a1e37;
  height: 100%;
  width: 100%;
}

.splash::part(scroll) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.lottie {
  width: 230px;
  height: 230px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
