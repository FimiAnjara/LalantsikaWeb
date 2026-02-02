<template>
  <div class="spinner-overlay" :class="{ 'fullscreen': fullscreen, 'inline': !fullscreen }">
    <div class="spinner-container">
      <div class="spinner-arc"></div>
      <p v-if="message" class="spinner-message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string;
  fullscreen?: boolean;
}>();
</script>

<style scoped>
.spinner-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-overlay.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 30, 55, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

.spinner-overlay.inline {
  padding: 2rem;
  width: 100%;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner-arc {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  animation: spin 1s linear infinite;
}

.spinner-arc::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 4px solid transparent;
  border-top-color: #cfb824;
  border-right-color: rgba(207, 184, 36, 0.6);
  border-bottom-color: rgba(207, 184, 36, 0.2);
  border-left-color: transparent;
}

/* Effet de tête plus grande */
.spinner-arc::after {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background: #cfb824;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(207, 184, 36, 0.8);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.spinner-message {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Version inline (fond clair) */
.spinner-overlay.inline .spinner-message {
  color: #0a1e37;
  text-shadow: none;
}
</style>
