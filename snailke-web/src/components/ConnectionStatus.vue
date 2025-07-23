<script setup lang="ts">
defineProps<{
  isConnected: boolean
  connectionRetries: number
}>()
</script>

<template>
  <div class="connection-indicator" :class="{ connected: isConnected, disconnected: !isConnected }">
    <div class="status-light"></div>
    <span v-if="isConnected">Live Updates</span>
    <span v-else>Reconnecting... ({{ connectionRetries }})</span>
  </div>
</template>

<style scoped>
.connection-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.connection-indicator.connected {
  background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
  color: #2e7d32;
  border-color: rgba(76, 175, 80, 0.2);
}

.connection-indicator.disconnected {
  background: linear-gradient(135deg, #ffebee, #fce4ec);
  color: #c62828;
  border-color: rgba(198, 40, 40, 0.2);
}

.status-light {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.connected .status-light {
  background: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
}

.disconnected .status-light {
  background: #f44336;
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.6);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
