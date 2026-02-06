<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="isOpen" class="lightbox-overlay" @click="close">
        <!-- Close button -->
        <button class="lightbox-close" @click="close">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <!-- Navigation arrows -->
        <button 
          v-if="photos.length > 1" 
          class="nav-btn prev" 
          @click.stop="prevPhoto"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        
        <button 
          v-if="photos.length > 1" 
          class="nav-btn next" 
          @click.stop="nextPhoto"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        
        <!-- Main image -->
        <div class="lightbox-content" @click.stop>
          <img 
            :src="photos[currentIndex]" 
            :alt="'Photo ' + (currentIndex + 1)"
            class="lightbox-image"
            @click.stop
          />
        </div>
        
        <!-- Counter -->
        <div v-if="photos.length > 1" class="photo-counter">
          {{ currentIndex + 1 }} / {{ photos.length }}
        </div>
        
        <!-- Thumbnails -->
        <div v-if="photos.length > 1" class="thumbnails-bar" @click.stop>
          <div 
            v-for="(photo, index) in photos" 
            :key="index"
            class="thumb"
            :class="{ active: index === currentIndex }"
            @click="currentIndex = index"
          >
            <img :src="photo" :alt="'Miniature ' + (index + 1)" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  photos: string[];
  initialIndex?: number;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const currentIndex = ref(props.initialIndex || 0);

watch(() => props.initialIndex, (newIndex) => {
  if (newIndex !== undefined) {
    currentIndex.value = newIndex;
  }
});

watch(() => props.isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const close = () => {
  emit('close');
};

const prevPhoto = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  } else {
    currentIndex.value = props.photos.length - 1;
  }
};

const nextPhoto = () => {
  if (currentIndex.value < props.photos.length - 1) {
    currentIndex.value++;
  } else {
    currentIndex.value = 0;
  }
};

// Handle keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;
  
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') prevPhoto();
  if (e.key === 'ArrowRight') nextPhoto();
};

// Add keyboard listener when component is mounted
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown);
}
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.lightbox-close {
  position: absolute;
  top: env(safe-area-inset-top, 1rem);
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s ease;
}

.lightbox-close:active {
  background: rgba(255, 255, 255, 0.2);
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s ease;
}

.nav-btn:active {
  background: rgba(255, 255, 255, 0.2);
}

.nav-btn.prev {
  left: 0.5rem;
}

.nav-btn.next {
  right: 0.5rem;
}

.lightbox-content {
  max-width: 100%;
  max-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.photo-counter {
  position: absolute;
  top: env(safe-area-inset-top, 1rem);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.thumbnails-bar {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom, 1rem) + 1rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  max-width: 90%;
  overflow-x: auto;
}

.thumb {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.2s ease;
  flex-shrink: 0;
  border: 2px solid transparent;
}

.thumb.active {
  opacity: 1;
  border-color: white;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Animations */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
