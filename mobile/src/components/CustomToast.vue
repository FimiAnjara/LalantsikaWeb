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
  top: calc(env(safe-area-inset-top, 12px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 280px;
  max-width: calc(100vw - 24px);
  width: calc(100vw - 24px);
  background: linear-gradient(135deg, #0e1b33 0%, #1A3263 100%);
  border-radius: 14px;
  box-shadow:
    0 8px 32px rgba(10, 30, 55, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.toast-icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
}

.toast-icon svg {
  width: 22px;
  height: 22px;
}

/* Success Style */
.success .toast-icon {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}
.success .toast-progress {
  background: linear-gradient(90deg, #34d399, #6ee7b7);
}

/* Error Style */
.error .toast-icon {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}
.error .toast-progress {
  background: linear-gradient(90deg, #f87171, #fca5a5);
}

/* Warning Style */
.warning .toast-icon {
  background: rgba(250, 185, 91, 0.15);
  color: #FAB95B;
}
.warning .toast-progress {
  background: linear-gradient(90deg, #FAB95B, #fcd581);
}

/* Info Style */
.info .toast-icon {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}
.info .toast-progress {
  background: linear-gradient(90deg, #60a5fa, #93c5fd);
}

.toast-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
  align-items: flex-start;
}

.toast-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.01em;
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.toast-message {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.5);
}

.toast-close:active {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

.toast-progress {
  height: 2.5px;
  width: 100%;
  animation: progress-shrink linear forwards;
  opacity: 0.8;
}

@keyframes progress-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* Animations - slide from top, centered */
.toast-slide-enter-active {
  animation: slideInDown 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-slide-leave-active {
  animation: slideOutUp 0.25s cubic-bezier(0.55, 0, 1, 0.45);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes slideOutUp {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-100%);
  }
}
</style>
