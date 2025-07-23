<script setup lang="ts">
defineProps<{
  isRefreshing: boolean
}>()

defineEmits<{
  refresh: []
}>()
</script>

<template>
  <button @click="$emit('refresh')" :disabled="isRefreshing" class="refresh-button">
    <span class="refresh-icon" :class="{ spinning: isRefreshing }">🔄</span>
    <span class="refresh-text">{{ isRefreshing ? 'Updating...' : 'Refresh' }}</span>
  </button>
</template>

<style scoped>
.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.3);
}

.refresh-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(33, 150, 243, 0.4);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.refresh-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
