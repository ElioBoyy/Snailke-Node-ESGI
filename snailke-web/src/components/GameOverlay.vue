<script setup lang="ts">
interface Button {
  label: string
  icon: string
  action: string
  variant: 'primary' | 'secondary'
}

defineProps<{
  type: 'menu' | 'paused' | 'gameOver'
  icon: string
  title: string
  description?: string
  finalScore?: number
  showCelebration?: boolean
  isLoading?: boolean
  buttons: Button[]
}>()

defineEmits<{
  startGame: []
  resumeGame: []
  resetGame: []
}>()
</script>

<template>
  <div class="game-overlay">
    <div class="menu-card" :class="{ 'game-over': type === 'gameOver' }">
      <div class="menu-icon">{{ icon }}</div>
      <h3>{{ title }}</h3>
      <p v-if="description" class="menu-description">{{ description }}</p>

      <div v-if="type === 'menu'" class="controls-info">
        <h4>🎮 Controls</h4>
        <div class="control-grid">
          <div class="control-item">⬆️ Up Arrow</div>
          <div class="control-item">⬇️ Down Arrow</div>
          <div class="control-item">⬅️ Left Arrow</div>
          <div class="control-item">➡️ Right Arrow</div>
          <div class="control-item">⏸️ Space (Pause)</div>
        </div>
      </div>

      <div v-if="type === 'gameOver' && finalScore !== undefined" class="final-score">
        <div class="score-display">{{ finalScore.toLocaleString() }}</div>
        <div class="score-label">Final Score</div>
      </div>

      <div v-if="showCelebration" class="celebration">
        <p>🎉 Congratulations! You set a new personal best! 🎉</p>
      </div>

      <div v-if="isLoading" class="submitting">
        <div class="loading-spinner"></div>
        <p>Submitting your score...</p>
      </div>

      <div class="button-group">
        <button
          v-for="button in buttons"
          :key="button.label"
          @click="$emit(button.action)"
          class="action-btn"
          :class="button.variant"
        >
          <span class="btn-icon">{{ button.icon }}</span>
          <span>{{ button.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(33, 150, 243, 0.95));
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.4s ease;
}

.menu-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2.5rem;
  text-align: center;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-card.game-over {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 249, 250, 0.95));
}

.menu-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.menu-card h3 {
  margin: 0 0 1rem;
  font-size: 2rem;
  color: #333;
  font-weight: 700;
}

.menu-description {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.5;
}

.controls-info {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.controls-info h4 {
  margin: 0 0 1rem;
  color: #333;
  font-size: 1.2rem;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.control-item {
  background: white;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.control-item:hover {
  border-color: #4caf50;
  background: #e8f5e8;
}

.final-score {
  margin: 2rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
  border-radius: 20px;
  border: 2px solid rgba(76, 175, 80, 0.2);
}

.score-display {
  font-size: 3rem;
  font-weight: 900;
  color: #4caf50;
  margin-bottom: 0.5rem;
}

.score-label {
  font-size: 1rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.celebration {
  background: linear-gradient(135deg, #fff3e0, #ffeaa7);
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 2px solid rgba(255, 152, 0, 0.2);
}

.celebration p {
  margin: 0;
  font-weight: 600;
  color: #f57c00;
}

.submitting {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: #e3f2fd;
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  color: #1976d2;
  font-weight: 600;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid transparent;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e9ecef;
}

.action-btn.secondary:hover {
  background: #e9ecef;
  border-color: #dee2e6;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1.2rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(60px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
