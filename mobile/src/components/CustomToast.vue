<template>
  <Transition name="toast-slide">
    <div v-if="visible" class="custom-toast" :class="type">
      <div class="toast-content">
        <div class="toast-icon">
          <!-- Success Icon -->
          <svg v-if="type === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Error Icon -->
          <svg v-else-if="type === 'error'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <!-- Warning Icon -->
          <svg v-else-if="type === 'warning'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <!-- Info Icon -->
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="toast-text">
          <span class="toast-title" v-if="title">{{ title }}</span>
          <span class="toast-message">{{ message }}</span>
        </div>
        <button class="toast-close" @click="close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="toast-progress" :style="{ animationDuration: duration + 'ms' }"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

export interface ToastProps {
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref(false);
let timeoutId: ReturnType<typeof setTimeout>;

onMounted(() => {
  visible.value = true;
  startTimer();
});

const startTimer = () => {
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      close();
    }, props.duration);
  }
};

const close = () => {
  visible.value = false;
  clearTimeout(timeoutId);
  setTimeout(() => {
    emit('close');
  }, 300); // Wait for animation
};

watch(() => props.message, () => {
  clearTimeout(timeoutId);
  startTimer();
});
</script>

<style scoped>
.custom-toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 300px;
  max-width: 90vw;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.toast-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

.toast-icon svg {
  width: 24px;
  height: 24px;
}

/* Success Style */
.success .toast-icon {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.success .toast-progress {
  background: linear-gradient(90deg, #28a745, #34ce57);
}

/* Error Style */
.error .toast-icon {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.error .toast-progress {
  background: linear-gradient(90deg, #dc3545, #ff6b7a);
}

/* Warning Style */
.warning .toast-icon {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.warning .toast-progress {
  background: linear-gradient(90deg, #ff9800, #ffc107);
}

/* Info Style */
.info .toast-icon {
  background: rgba(26, 50, 99, 0.1);
  color: #1A3263;
}

.info .toast-progress {
  background: linear-gradient(90deg, #1A3263, #3e5f9e);
}

.toast-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1A3263;
}

.toast-message {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  background: #f8f9fa;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #999;
}

.toast-close:hover {
  background: #e9ecef;
  color: #666;
}

.toast-progress {
  height: 3px;
  width: 100%;
  animation: progress-shrink linear forwards;
}

@keyframes progress-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* Animations */
.toast-slide-enter-active {
  animation: slideDown 0.3s ease-out;
}

.toast-slide-leave-active {
  animation: slideUp 0.3s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -100%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -100%);
  }
}
</style>
