<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { scoresApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import AuthRequired from './AuthRequired.vue'
import GameStats from './GameStats.vue'
import GameOverlay from './GameOverlay.vue'
import GameControls from './GameControls.vue'

const authStore = useAuthStore()

defineEmits<{
  'show-auth': []
}>()

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 600
const GRID_SIZE = 20
const DEFAULT_SPEED = 5
const HIGH_SCORE_STORAGE_KEY = 'snailke-high-score'

const gameCanvas = ref<HTMLCanvasElement>()

const currentScore = ref(0)
const bestScore = ref(parseInt(localStorage.getItem(HIGH_SCORE_STORAGE_KEY) || '0'))
const gameState = ref<'menu' | 'playing' | 'paused' | 'gameOver'>('menu')
const gameSpeed = ref(DEFAULT_SPEED)

const snailBody = ref([{ x: 200, y: 200 }])
const movementDirection = ref({ x: 0, y: 0 })
const foodPosition = ref({ x: 0, y: 0 })

let gameUpdateTimer: number | null = null

const scoreSubmission = useMutation({
  mutationFn: ({ score, speed }: { score: number; speed: number }) => {
    return scoresApi.submitScore(score, speed)
  },
  onSuccess: (data) => {
    //console.log('Score successfully saved to leaderboard!', data)
  },
  onError: (error) => {
    console.error('Failed to save score:', error)
  },
})

function initializeNewGame() {
  const centerX = Math.floor(CANVAS_WIDTH / GRID_SIZE / 2) * GRID_SIZE
  const centerY = Math.floor(CANVAS_HEIGHT / GRID_SIZE / 2) * GRID_SIZE

  snailBody.value = [{ x: centerX, y: centerY }]
  movementDirection.value = { x: 0, y: 0 }
  currentScore.value = 0

  placeFoodOnBoard()
}

function placeFoodOnBoard() {
  let attempts = 0
  const MAX_PLACEMENT_ATTEMPTS = 30 * 30 - 1 // 30x30 grid - 1 pour le nombre de cases que peut prendre 

  do {
    foodPosition.value = {
      x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE,
      y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE,
    }
    attempts++
  } while (
    snailBody.value.some(
      (segment) => segment.x === foodPosition.value.x && segment.y === foodPosition.value.y,
    ) &&
    attempts < MAX_PLACEMENT_ATTEMPTS
  )
}

function startNewGame() {
  initializeNewGame()
  gameState.value = 'playing'
  beginGameLoop()

  nextTick(() => {
    gameCanvas.value?.focus()
  })
}

function pauseCurrentGame() {
  if (gameState.value === 'playing') {
    gameState.value = 'paused'
    stopGameLoop()
  }
}

function resumeCurrentGame() {
  if (gameState.value === 'paused') {
    gameState.value = 'playing'
    beginGameLoop()

    nextTick(() => {
      gameCanvas.value?.focus()
    })
  }
}

function resetToMainMenu() {
  stopGameLoop()
  gameState.value = 'menu'
  initializeNewGame()
}

function endGameAndSaveScore() {
  gameState.value = 'gameOver'
  stopGameLoop()

  if (currentScore.value > bestScore.value) {
    bestScore.value = currentScore.value
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, currentScore.value.toString())
  }

  if (authStore.isAuthenticated && currentScore.value > 0) {
    scoreSubmission.mutate({
      score: currentScore.value,
      speed: gameSpeed.value,
    })
  }
}

function beginGameLoop() {
  const updateDelay = 200 - gameSpeed.value * 15
  gameUpdateTimer = setInterval(updateGameState, updateDelay)
}

function stopGameLoop() {
  if (gameUpdateTimer) {
    clearInterval(gameUpdateTimer)
    gameUpdateTimer = null
  }
}

function adjustGameSpeed() {
  if (gameState.value === 'playing') {
    stopGameLoop()
    beginGameLoop()
  }
}

function handleSpeedChange(value: string) {
  gameSpeed.value = parseInt(value)
  adjustGameSpeed()
}

function updateGameState() {
  if (gameState.value !== 'playing') return

  if (movementDirection.value.x === 0 && movementDirection.value.y === 0) {
    drawGameBoard()
    return
  }

  const snailHead = { ...snailBody.value[0] }
  snailHead.x += movementDirection.value.x
  snailHead.y += movementDirection.value.y

  if (
    snailHead.x < 0 ||
    snailHead.x >= CANVAS_WIDTH ||
    snailHead.y < 0 ||
    snailHead.y >= CANVAS_HEIGHT
  ) {
    endGameAndSaveScore()
    return
  }

  const snailWillEatFood =
    snailHead.x === foodPosition.value.x && snailHead.y === foodPosition.value.y

  const bodyToCheck = snailWillEatFood ? snailBody.value : snailBody.value.slice(0, -1)
  const snailHitItself = bodyToCheck.some(
    (segment) => segment.x === snailHead.x && segment.y === snailHead.y,
  )

  if (snailHitItself) {
    endGameAndSaveScore()
    return
  }

  snailBody.value.unshift(snailHead)

  if (snailHead.x === foodPosition.value.x && snailHead.y === foodPosition.value.y) {
    currentScore.value += 10
    placeFoodOnBoard()
  } else {
    snailBody.value.pop()
  }

  drawGameBoard()
}

function drawGameBoard() {
  const canvas = gameCanvas.value
  if (!canvas) return

  const canvasContext = canvas.getContext('2d')
  if (!canvasContext) return

  canvasContext.fillStyle = '#1a1a1a'
  canvasContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawGrid(canvasContext)

  drawSnail(canvasContext)
  drawFood(canvasContext)
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1

  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_HEIGHT)
    ctx.stroke()
  }

  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_WIDTH, y)
    ctx.stroke()
  }
}

function drawSnail(ctx: CanvasRenderingContext2D) {
  snailBody.value.forEach((bodySegment, segmentIndex) => {
    if (segmentIndex === 0) {
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(bodySegment.x, bodySegment.y, GRID_SIZE, GRID_SIZE)

      ctx.fillStyle = '#FFF'
      ctx.font = `${GRID_SIZE - 4}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('🐌', bodySegment.x + GRID_SIZE / 2, bodySegment.y + GRID_SIZE - 2)
    } else {
      ctx.fillStyle = segmentIndex % 2 === 0 ? '#8BC34A' : '#689F38'
      ctx.fillRect(bodySegment.x, bodySegment.y, GRID_SIZE, GRID_SIZE)
    }
  })
}

function drawFood(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(foodPosition.value.x, foodPosition.value.y, GRID_SIZE, GRID_SIZE)

  ctx.fillStyle = '#FFF'
  ctx.font = `${GRID_SIZE - 4}px Arial`
  ctx.textAlign = 'center'
  ctx.fillText('🥬', foodPosition.value.x + GRID_SIZE / 2, foodPosition.value.y + GRID_SIZE - 2)
}

let lastDirectionChangeTime = 0
const DIRECTION_CHANGE_COOLDOWN = 100

function handlePlayerInput(event: KeyboardEvent) {
  if (gameState.value !== 'playing') {
    if (event.key === ' ') {
      event.preventDefault()
      if (gameState.value === 'menu' || gameState.value === 'gameOver') {
        startNewGame()
      } else if (gameState.value === 'paused') {
        resumeCurrentGame()
      }
    }
    return
  }

  event.preventDefault()

  const currentTime = Date.now()
  if (currentTime - lastDirectionChangeTime < DIRECTION_CHANGE_COOLDOWN) {
    return
  }

  const newDirection = { ...movementDirection.value }

  switch (event.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      tryChangeDirection(newDirection, 0, -GRID_SIZE)
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      tryChangeDirection(newDirection, 0, GRID_SIZE)
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      tryChangeDirection(newDirection, -GRID_SIZE, 0)
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      tryChangeDirection(newDirection, GRID_SIZE, 0)
      break
    case ' ':
      pauseCurrentGame()
      return
  }

  if (
    newDirection.x !== movementDirection.value.x ||
    newDirection.y !== movementDirection.value.y
  ) {
    movementDirection.value = newDirection
    lastDirectionChangeTime = currentTime
  }
}

function tryChangeDirection(
  newDirection: { x: number; y: number },
  deltaX: number,
  deltaY: number,
) {
  const isHorizontalMove = deltaX !== 0
  const isVerticalMove = deltaY !== 0
  const snailHasBody = snailBody.value.length > 1

  if (isHorizontalMove) {
    if (movementDirection.value.x === 0 || !snailHasBody) {
      newDirection.x = deltaX
      newDirection.y = 0
    }
  } else if (isVerticalMove) {
    if (movementDirection.value.y === 0 || !snailHasBody) {
      newDirection.x = 0
      newDirection.y = deltaY
    }
  }
}

function focusGameCanvas() {
  gameCanvas.value?.focus()
}

onMounted(() => {
  initializeNewGame()
  drawGameBoard()

  window.addEventListener('keydown', handlePlayerInput)

  nextTick(() => {
    focusGameCanvas()
  })
})

onUnmounted(() => {
  stopGameLoop()
  window.removeEventListener('keydown', handlePlayerInput)
})
</script>

<template>
  <div class="snake-game">
    <AuthRequired v-if="!authStore.isAuthenticated" @show-auth="$emit('show-auth')" />

    <div v-else class="game-content">
      <div class="game-header">
        <GameStats :current-score="currentScore" :best-score="bestScore" :game-speed="gameSpeed" />
      </div>

      <div class="game-container">
        <canvas
          ref="gameCanvas"
          :width="CANVAS_WIDTH"
          :height="CANVAS_HEIGHT"
          tabindex="0"
          class="game-canvas"
          @click="focusGameCanvas"
        ></canvas>

        <GameOverlay
          v-if="gameState === 'menu'"
          type="menu"
          icon="🐌"
          title="Welcome to Snailke!"
          description="Guide your snail through the garden and collect delicious lettuce!"
          :buttons="[
            { label: 'Start Adventure', icon: '🚀', action: 'startGame', variant: 'primary' },
          ]"
          @start-game="startNewGame"
        />

        <GameOverlay
          v-if="gameState === 'paused'"
          type="paused"
          icon="⏸️"
          title="Game Paused"
          description="Take a breath, snail racer!"
          :buttons="[
            { label: 'Resume', icon: '▶️', action: 'resumeGame', variant: 'primary' },
            { label: 'Restart', icon: '🔄', action: 'resetGame', variant: 'secondary' },
          ]"
          @resume-game="resumeCurrentGame"
          @reset-game="resetToMainMenu"
        />

        <GameOverlay
          v-if="gameState === 'gameOver'"
          type="gameOver"
          icon="💫"
          :title="currentScore > bestScore ? 'New Record!' : 'Game Over!'"
          :final-score="currentScore"
          :show-celebration="currentScore > bestScore"
          :is-loading="authStore.isAuthenticated && scoreSubmission.isPending.value"
          :buttons="[
            { label: 'Play Again', icon: '🎮', action: 'startGame', variant: 'primary' },
            { label: 'Main Menu', icon: '🏠', action: 'resetGame', variant: 'secondary' },
          ]"
          @start-game="startNewGame"
          @reset-game="resetToMainMenu"
        />
      </div>

      <GameControls
        :game-state="gameState"
        :game-speed="gameSpeed"
        @pause="pauseCurrentGame"
        @reset="resetToMainMenu"
        @speed-change="handleSpeedChange"
      />
    </div>
  </div>
</template>

<style scoped>
.snake-game {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  overflow: hidden;
}

.game-header {
  width: 100%;
  max-width: 800px;
  margin-bottom: 1.5rem;
}

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

.game-container {
  position: relative;
  margin-bottom: 1rem;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.game-canvas {
  background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
  display: block;
  border-radius: 18px;
  cursor: pointer;
}

.game-canvas:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

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

/* Auth Required Styles */
.auth-required {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-message {
  text-align: center;
  max-width: 500px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
}

.auth-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.auth-message h2 {
  color: white;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.auth-message p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.auth-description {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 0.95rem !important;
  margin-bottom: 2rem !important;
}

.auth-btn-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  border: none;
  padding: 1.25rem 2.5rem;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(76, 175, 80, 0.4);
  margin: 0 auto;
}

.auth-btn-large:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 48px rgba(76, 175, 80, 0.6);
  background: linear-gradient(135deg, #66bb6a, #4caf50);
}

.auth-btn-large .btn-icon {
  font-size: 1.4rem;
}

@media (max-width: 480px) {
  .snake-game {
    padding: 1rem;
  }

  .game-header {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .game-canvas {
    width: 100%;
    height: auto;
  }

  .game-controls {
    justify-content: center;
  }

  .auth-message {
    padding: 2rem 1.5rem;
  }

  .auth-message h2 {
    font-size: 1.7rem;
  }

  .auth-btn-large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
}
</style>
