<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  message: string
}>()

const visible = ref(true)

onMounted(() => {
  setTimeout(() => {
    visible.value = false
  }, 2500)
})

function handleAnimationEnd(event: AnimationEvent) {
  if (event.animationName === 'fadeOut') {
    visible.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="live-score-notification" @animationend="handleAnimationEnd">
      <div class="live-notification-content">
        <span class="live-icon">⚡</span>
        <span class="live-text">{{ message }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.live-score-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  z-index: 9999;
  font-size: 0.85rem;
  font-weight: 500;
  max-width: 280px;
  animation:
    slideInRight 0.3s ease,
    fadeOut 0.3s ease 2.2s;
}

.live-notification-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.live-icon {
  font-size: 1rem;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
