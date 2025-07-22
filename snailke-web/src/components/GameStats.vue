<template>
  <div class="game-stats">
    <div class="stat-card current-score">
      <div class="stat-icon">🎯</div>
      <div class="stat-info">
        <div class="stat-label">Score</div>
        <div class="stat-value">{{ currentScore.toLocaleString() }}</div>
      </div>
    </div>
    <div class="stat-card high-score">
      <div class="stat-icon">👑</div>
      <div class="stat-info">
        <div class="stat-label">Best</div>
        <div class="stat-value">{{ bestScore.toLocaleString() }}</div>
      </div>
    </div>
    <div class="stat-card speed-indicator">
      <div class="stat-icon">⚡</div>
      <div class="stat-info">
        <div class="stat-label">Speed</div>
        <div class="stat-value">{{ gameSpeed }}/10</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentScore: number
  bestScore: number
  gameSpeed: number
}>()
</script>

<style scoped>
.game-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 1.8rem;
  min-width: 40px;
  text-align: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>