<template>
  <Teleport to="body">
    <div 
      v-if="visible" 
      class="ws-notification score-notification"
      :class="type"
      @animationend="handleAnimationEnd"
    >
      <div class="notification-content">
        <span class="notification-icon">{{ icon }}</span>
        <span class="notification-text">{{ message }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  type: 'score' | 'personal-best' | 'achievement'
  icon: string
  message: string
  duration?: number
}>()

const visible = ref(true)

onMounted(() => {
  const duration = props.duration || (props.type === 'score' ? 3000 : props.type === 'personal-best' ? 4000 : 5000)
  
  setTimeout(() => {
    visible.value = false
  }, duration)
})

function handleAnimationEnd(event: AnimationEvent) {
  if (event.animationName === 'fadeOut') {
    visible.value = false
  }
}
</script>

<style scoped>
.ws-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  max-width: 300px;
  font-family: 'Arial', sans-serif;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
}

.ws-notification.score-notification {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
  z-index: 10000;
}

.ws-notification.personal-best-notification {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.4);
  z-index: 10001;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 3.7s;
}

.ws-notification.achievement-notification {
  background: linear-gradient(135deg, #9c27b0, #673ab7);
  box-shadow: 0 4px 16px rgba(156, 39, 176, 0.4);
  z-index: 10002;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 4.7s;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notification-icon {
  font-size: 1.2rem;
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