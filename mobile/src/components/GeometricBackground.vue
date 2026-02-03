<template>
  <div class="geometric-background">
    <div class="animation-container" ref="containerRef">
      <!-- 2x2 Grid of identical tiles for seamless looping -->
      <div class="tile" v-for="n in 4" :key="n">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useBackgroundAnimation } from '../composables/useBackgroundAnimation';

const { speedMultiplier } = useBackgroundAnimation();
const containerRef = ref<HTMLElement | null>(null);
let animation: Animation | null = null;

onMounted(() => {
  if (containerRef.value) {
    // Animate from showing the bottom-right quadrant (-50%, -50%) 
    // to showing the top-left quadrant (0, 0)
    animation = containerRef.value.animate(
      [
        { transform: 'translate(-50%, -50%)' },
        { transform: 'translate(0, 0)' }
      ],
      {
        duration: 20000,
        iterations: Infinity,
        easing: 'linear'
      }
    );
  }
});

// Smoothly update playbackRate
watch(speedMultiplier, (newSpeed) => {
  if (animation) {
    animation.playbackRate = newSpeed;
  }
});

onUnmounted(() => {
  if (animation) {
    animation.cancel();
  }
});
</script>

<style scoped>
.geometric-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1A3263 0%, #0d1a33 100%);
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.animation-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  display: flex;
  flex-wrap: wrap;
}

.tile {
  width: 50%;
  height: 50%;
  position: relative;
  /* Removed overflow: hidden to prevent hard cuts at tile boundaries 
     if shapes slightly overlap (though positioning aims to keep them inside) */
}

/* Shape Positioning (Relative to Tile 50% x 50%) */
.shape {
  position: absolute;
  background: linear-gradient(135deg, rgba(84, 119, 146, 0.2), rgba(84, 119, 146, 0.05));
  border-radius: 50px;
  transform: rotate(45deg);
  backdrop-filter: blur(5px);
}

/* Smaller, more distributed shapes */
.shape-1 {
  width: 140px;
  height: 60px;
  top: 10%;
  left: 10%;
}

.shape-2 {
  width: 180px;
  height: 70px;
  top: 50%;
  left: 60%;
  background: linear-gradient(135deg, rgba(250, 185, 91, 0.1), rgba(250, 185, 91, 0.02));
}

.shape-3 {
  width: 100px;
  height: 40px;
  top: 75%;
  left: 20%;
}

.shape-4 {
  width: 160px;
  height: 60px;
  top: 20%;
  left: 70%;
}

.shape-5 {
  width: 120px;
  height: 50px;
  top: 80%;
  left: 80%;
  background: linear-gradient(135deg, rgba(250, 185, 91, 0.08), rgba(250, 185, 91, 0.01));
}
</style>
