<template>
  <div class="game-controls">
    <button @click="$emit('pause')" :disabled="gameState !== 'playing'">
      ⏸️ Pause
    </button>
    <button @click="$emit('reset')">
      🔄 Reset
    </button>
    <div class="speed-control">
      <label>Speed: </label>
      <input
        type="range"
        :value="gameSpeed"
        @change="$emit('speedChange', ($event.target as HTMLInputElement).value)"
        min="1"
        max="10"
        :disabled="gameState === 'playing'"
      />
      <span>{{ gameSpeed }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  gameState: 'menu' | 'playing' | 'paused' | 'gameOver'
  gameSpeed: number
}>()

defineEmits<{
  pause: []
  reset: []
  speedChange: [value: string]
}>()
</script>

<style scoped>
.game-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.game-controls button {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.game-controls button:hover:not(:disabled) {
  background-color: #1976d2;
}

.game-controls button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.speed-control input[type='range'] {
  width: 100px;
}
</style>