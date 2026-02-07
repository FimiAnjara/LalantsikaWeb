<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <transition name="fade">
      <div 
        v-if="modelValue && showBackdrop" 
        class="bottom-sheet-backdrop"
        @click="handleBackdropClick"
      ></div>
    </transition>

    <!-- Sheet -->
    <div 
      ref="sheetRef"
      class="bottom-sheet"
      :class="{ 
        'is-open': modelValue, 
        'is-dragging': isDragging,
        'no-transition': isDragging 
      }"
      :style="sheetStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <!-- Handle bar -->
      <div class="bottom-sheet-handle" ref="handleRef">
        <div class="handle-bar"></div>
      </div>

      <!-- Content -->
      <div 
        class="bottom-sheet-content" 
        ref="contentRef"
        :class="{ 'scrollable': currentSnap === 'half' || currentSnap === 'full' }"
      >
        <slot :snap="currentSnap"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';

export type SnapPoint = 'closed' | 'peek' | 'half' | 'full';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  peekHeight?: number;
  halfHeight?: number;
  fullHeight?: number;
  initialSnap?: SnapPoint;
  showBackdrop?: boolean;
  closeOnBackdrop?: boolean;
  bottomOffset?: number;
}>(), {
  peekHeight: 180,
  halfHeight: 50, // percentage
  fullHeight: 92, // percentage
  initialSnap: 'peek',
  showBackdrop: false,
  closeOnBackdrop: true,
  bottomOffset: 72 // bottom menu height
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'snap-change': [snap: SnapPoint];
}>();

const sheetRef = ref<HTMLElement | null>(null);
const handleRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const currentSnap = ref<SnapPoint>(props.initialSnap);
const translateY = ref(0);

// Touch tracking
let startY = 0;
let startTranslateY = 0;
let lastVelocity = 0;
let lastTimestamp = 0;
let lastY = 0;
let dragStartedOnHandle = false;
let isContentScrolling = false;
let touchStartedOnInteractive = false;

const windowHeight = computed(() => window.innerHeight);

const getSnapY = (snap: SnapPoint): number => {
  const h = windowHeight.value;
  switch (snap) {
    case 'closed': return h;
    case 'peek': return h - props.peekHeight - props.bottomOffset;
    case 'half': return h * (1 - props.halfHeight / 100);
    case 'full': return h * (1 - props.fullHeight / 100);
    default: return h;
  }
};

const sheetStyle = computed(() => {
  if (!props.modelValue) {
    return {
      transform: `translateY(${windowHeight.value}px)`,
      bottom: `${props.bottomOffset}px`
    };
  }
  if (isDragging.value) {
    return {
      transform: `translateY(${translateY.value}px)`,
      bottom: `${props.bottomOffset}px`
    };
  }
  return {
    transform: `translateY(${getSnapY(currentSnap.value)}px)`,
    bottom: `${props.bottomOffset}px`
  };
});

const snapToPoint = (snap: SnapPoint) => {
  currentSnap.value = snap;
  translateY.value = getSnapY(snap);
  emit('snap-change', snap);
  
  if (snap === 'closed') {
    emit('update:modelValue', false);
  }
};

const isInteractiveElement = (el: HTMLElement | null): boolean => {
  while (el && el !== sheetRef.value) {
    const tag = el.tagName?.toLowerCase();
    if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select' || tag === 'textarea') return true;
    if (el.getAttribute('role') === 'button' || el.classList?.contains('clickable')) return true;
    el = el.parentElement;
  }
  return false;
};

const onTouchStart = (e: TouchEvent) => {
  const target = e.target as HTMLElement;
  
  // Check if the touch started on the handle bar area
  dragStartedOnHandle = !!handleRef.value?.contains(target);
  isContentScrolling = false;
  touchStartedOnInteractive = false;

  // If touch started on a button/link/input, let it handle its own click
  if (!dragStartedOnHandle && isInteractiveElement(target)) {
    touchStartedOnInteractive = true;
    startY = e.touches[0].clientY;
    return;
  }
  
  const isScrollableSnap = currentSnap.value === 'half' || currentSnap.value === 'full';
  const isInContent = contentRef.value?.contains(target) && !dragStartedOnHandle;
  
  // If in a scrollable snap and touching content area: let native scroll handle it
  if (isScrollableSnap && isInContent) {
    isContentScrolling = true;
    startY = e.touches[0].clientY;
    return;
  }

  // Otherwise (handle bar, or peek snap) -> start dragging the sheet
  isDragging.value = true;
  startY = e.touches[0].clientY;
  startTranslateY = getSnapY(currentSnap.value);
  lastY = startY;
  lastTimestamp = Date.now();
  lastVelocity = 0;
};

const onTouchMove = (e: TouchEvent) => {
  // If touch started on interactive element, check if it turned into a drag
  if (touchStartedOnInteractive) {
    const currentY = e.touches[0].clientY;
    const diff = Math.abs(currentY - startY);
    // If user moved significantly, cancel the interactive touch and start drag
    if (diff > 15) {
      touchStartedOnInteractive = false;
      isDragging.value = true;
      startY = currentY;
      startTranslateY = getSnapY(currentSnap.value);
      lastY = currentY;
      lastTimestamp = Date.now();
      lastVelocity = 0;
    }
    return;
  }
  
  // If content is scrolling normally, check if we should take over
  if (isContentScrolling) {
    const scrollTop = contentRef.value?.scrollTop ?? 0;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    // User is pulling down while content is at top -> take over as sheet drag
    if (scrollTop <= 0 && diff > 8) {
      isContentScrolling = false;
      isDragging.value = true;
      startY = currentY;
      startTranslateY = getSnapY(currentSnap.value);
      lastY = currentY;
      lastTimestamp = Date.now();
      lastVelocity = 0;
    }
    return;
  }
  
  if (!isDragging.value) return;
  
  // Prevent scroll on content while dragging the sheet
  e.preventDefault();

  const currentY = e.touches[0].clientY;
  const now = Date.now();
  const dt = now - lastTimestamp;
  
  if (dt > 0) {
    lastVelocity = (currentY - lastY) / dt;
  }
  
  lastY = currentY;
  lastTimestamp = now;

  const diff = currentY - startY;
  const newTranslateY = startTranslateY + diff;
  
  // Clamp between full and closed
  const minY = getSnapY('full');
  const maxY = getSnapY('closed');
  translateY.value = Math.max(minY, Math.min(maxY, newTranslateY));
};

const onTouchEnd = () => {
  if (touchStartedOnInteractive) {
    touchStartedOnInteractive = false;
    return; // Let the click event fire naturally
  }
  if (isContentScrolling) {
    isContentScrolling = false;
    return;
  }
  if (!isDragging.value) return;
  isDragging.value = false;

  const currentY = translateY.value;
  const velocity = lastVelocity;
  
  // Fast swipe detection
  const VELOCITY_THRESHOLD = 0.4;
  
  if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
    // Fast swipe
    if (velocity > 0) {
      // Swipe down
      if (currentSnap.value === 'full') snapToPoint('half');
      else if (currentSnap.value === 'half') snapToPoint('peek');
      else snapToPoint('closed');
    } else {
      // Swipe up
      if (currentSnap.value === 'peek') snapToPoint('half');
      else if (currentSnap.value === 'half') snapToPoint('full');
      else snapToPoint('full');
    }
    return;
  }

  // Slow drag - snap to nearest
  const peekY = getSnapY('peek');
  const halfY = getSnapY('half');
  const fullY = getSnapY('full');
  const closedY = getSnapY('closed');

  const distances = [
    { snap: 'full' as SnapPoint, dist: Math.abs(currentY - fullY) },
    { snap: 'half' as SnapPoint, dist: Math.abs(currentY - halfY) },
    { snap: 'peek' as SnapPoint, dist: Math.abs(currentY - peekY) },
    { snap: 'closed' as SnapPoint, dist: Math.abs(currentY - closedY) },
  ];

  distances.sort((a, b) => a.dist - b.dist);
  snapToPoint(distances[0].snap);
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    snapToPoint('closed');
  }
};

// Watch for open/close - always reset to initial snap when opened
watch(() => props.modelValue, (val, oldVal) => {
  if (val && !oldVal) {
    // Reset state when opening
    isDragging.value = false;
    isContentScrolling = false;
    
    nextTick(() => {
      currentSnap.value = props.initialSnap;
      translateY.value = getSnapY(props.initialSnap);
      emit('snap-change', props.initialSnap);
      
      // Reset scroll position of content
      if (contentRef.value) {
        contentRef.value.scrollTop = 0;
      }
    });
  }
});

// Cleanup
onUnmounted(() => {
  isDragging.value = false;
});

// Expose methods for parent
defineExpose({
  snapToPoint,
  currentSnap
});
</script>

<style scoped>
.bottom-sheet-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1049;
}

.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  height: 100vh;
  z-index: 1050;
  background: white;
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bottom-sheet.no-transition {
  transition: none !important;
}

.bottom-sheet-handle {
  display: flex;
  justify-content: center;
  padding: 10px 0 6px 0;
  cursor: grab;
  flex-shrink: 0;
  touch-action: none;
}

.handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d0d0d0;
  transition: background 0.2s;
}

.bottom-sheet.is-dragging .handle-bar {
  background: #999;
}

.bottom-sheet-content {
  flex: 1;
  overflow: hidden;
  padding: 0 16px 16px 16px;
}

.bottom-sheet-content.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
