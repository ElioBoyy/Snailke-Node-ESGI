<template>
  <div class="score-board">
    <div class="scoreboard-header">
      <div class="header-title">
        <h2>🏆 Global Leaderboard</h2>
        <p class="header-subtitle">The fastest snails in the garden!</p>
      </div>
      <div class="header-controls">
        <div
          class="connection-indicator"
          :class="{ connected: isConnected, disconnected: !isConnected }"
        >
          <div class="status-light"></div>
          <span v-if="isConnected">Live Updates</span>
          <span v-else>Reconnecting... ({{ connectionRetries }})</span>
        </div>
        <button @click="refreshScores" :disabled="isRefreshing" class="refresh-button">
          <span class="refresh-icon" :class="{ spinning: isRefreshing }">🔄</span>
          <span class="refresh-text">{{ isRefreshing ? 'Updating...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Loading scores...</div>

    <div v-else-if="error" class="error">
      <p>Failed to load scores: {{ error.message }}</p>
      <button @click="refreshScores" class="retry-btn">Try Again</button>
    </div>

    <div v-else-if="scores && scores.length > 0" class="scores-list">
      <div class="score-item header">
        <div class="rank">Rank</div>
        <div class="player">Player</div>
        <div class="score">Score</div>
        <div class="date">Date</div>
      </div>

      <div
        v-for="(scoreItem, index) in scores"
        :key="scoreItem.id"
        class="score-item"
        :class="{
          'current-user': scoreItem.userId === authStore.user?.id,
          'top-3': index < 3,
          'new-score': recentScores.has(scoreItem.id),
        }"
      >
        <div class="rank">
          <span v-if="index === 0">🥇</span>
          <span v-else-if="index === 1">🥈</span>
          <span v-else-if="index === 2">🥉</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="player">
          {{ scoreItem.user?.username || 'Anonymous' }}
          <span v-if="scoreItem.userId === authStore.user?.id" class="you-badge">You</span>
        </div>
        <div class="score">{{ scoreItem.score.toLocaleString() }}</div>
        <div class="date">{{ formatDate(scoreItem.createdAt) }}</div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>🐌 No scores yet!</p>
      <p>Be the first to play and set a high score!</p>
    </div>

    <div v-if="authStore.isAuthenticated && userScores && userScores.length > 0" class="user-stats">
      <h3>Your Recent Scores</h3>
      <div class="user-scores-list">
        <div
          v-for="userScore in userScores.slice(0, 5)"
          :key="userScore.id"
          class="user-score-item"
        >
          <span class="user-score">{{ userScore.score.toLocaleString() }}</span>
          <span class="user-date">{{ formatDate(userScore.createdAt) }}</span>
        </div>
      </div>

      <div class="user-stats-summary">
        <div class="stat">
          <span class="label">Games Played:</span>
          <span class="value">{{ userScores.length }}</span>
        </div>
        <div class="stat">
          <span class="label">Best Score:</span>
          <span class="value">{{
            Math.max(...userScores.map((s) => s.score)).toLocaleString()
          }}</span>
        </div>
        <div class="stat">
          <span class="label">Average:</span>
          <span class="value">{{
            Math.round(
              userScores.reduce((sum, s) => sum + s.score, 0) / userScores.length,
            ).toLocaleString()
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { scoresApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketConnection } from '@/composables/useWebSocketConnection'

const authStore = useAuthStore()
const { isConnected, connectionRetries, lastScoreEvent, lastLeaderboardUpdate } = useWebSocketConnection()

const recentScores = ref(new Set<number>())
const isRefreshing = ref(false)

const {
  data: scores,
  isLoading,
  error,
  refetch: refetchScores,
} = useQuery({
  queryKey: ['leaderboard'],
  queryFn: scoresApi.getLeaderboard,
  refetchInterval: 120000,
  staleTime: 60000
})

const { data: userScores, refetch: refetchUserScores } = useQuery({
  queryKey: ['userScores', authStore.user?.id],
  queryFn: () =>
    authStore.user ? scoresApi.getUserScores(authStore.user.id) : Promise.resolve([]),
  enabled: computed(() => !!authStore.user),
  refetchInterval: 120000,
})

async function refreshScores() {
  isRefreshing.value = true
  try {
    await Promise.all([refetchScores(), authStore.user ? refetchUserScores() : Promise.resolve()])

    const currentScores = scores.value || []
    const previousScoreIds = new Set(recentScores.value)

    currentScores.forEach((score) => {
      if (!previousScoreIds.has(score.id)) {
        recentScores.value.add(score.id)
      }
    })

    setTimeout(() => {
      recentScores.value.clear()
    }, 3000)
  } catch (error) {
    console.error('Failed to refresh scores:', error)
  } finally {
    isRefreshing.value = false
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

function handleWebSocketScoreUpdate() {
  if (lastScoreEvent.value) {
    recentScores.value.add(lastScoreEvent.value.score.id)

    setTimeout(() => {
      recentScores.value.delete(lastScoreEvent.value!.score.id)
    }, 3000)
  }
}

function handleLeaderboardUpdate() {
  if (lastLeaderboardUpdate.value) {
    if (lastLeaderboardUpdate.value.userId !== authStore.user?.id) {
      showLiveScoreNotification(lastLeaderboardUpdate.value)
    }
  }
}

function showLiveScoreNotification(data: any) {
  const notification = document.createElement('div')
  notification.className = 'live-score-notification'
  notification.innerHTML = `
    <div class="live-notification-content">
      <span class="live-icon">⚡</span>
      <span class="live-text">
        ${data.username} just scored ${data.score.toLocaleString()}!
        ${data.isNewBest ? ' 🏆 New PB!' : ''}
      </span>
    </div>
  `
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '80px',
    right: '20px',
    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
    zIndex: '9999',
    fontSize: '0.85rem',
    fontWeight: '500',
    maxWidth: '280px',
    animation: 'slideInRight 0.3s ease, fadeOut 0.3s ease 2.2s'
  })

  document.body.appendChild(notification)
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification)
    }
  }, 2500)
}

watch(lastScoreEvent, handleWebSocketScoreUpdate)
watch(lastLeaderboardUpdate, handleLeaderboardUpdate)

onMounted(() => {
  if (lastScoreEvent.value) {
    handleWebSocketScoreUpdate()
  }
  if (lastLeaderboardUpdate.value) {
    handleLeaderboardUpdate()
  }
})

onUnmounted(() => {
})
</script>

<style scoped>
.score-board {
  width: 100%;
  height: 100%;
  padding: 0;
  font-family: 'Arial', sans-serif;
  overflow-y: auto;
}

.scoreboard-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.header-title {
  text-align: center;
  margin-bottom: 1.5rem;
}

.header-title h2 {
  margin: 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #4caf50, #2196f3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
}

.header-subtitle {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 1.1rem;
  opacity: 0.8;
}

.header-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

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

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
}

.error {
  text-align: center;
  padding: 2rem;
  color: #f44336;
}

.retry-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 1rem;
}

.scores-list {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.score-item {
  display: grid;
  grid-template-columns: 60px 1fr 100px 120px;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: all 0.3s ease;
  color: white;
}

.score-item.header {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.score-item:not(.header):hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.score-item.current-user {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.1));
  border-left: 4px solid #2196f3;
}

.score-item.top-3:not(.header) {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.1));
}

.score-item.new-score {
  animation: highlight 3s ease-out;
}

@keyframes highlight {
  0% {
    background-color: #4caf50;
    color: white;
  }
  100% {
    background-color: transparent;
  }
}

.rank {
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.you-badge {
  background-color: #2196f3;
  color: white;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-weight: bold;
}

.score {
  text-align: right;
  font-weight: bold;
  color: #4caf50;
  font-size: 1.1rem;
}

.date {
  text-align: right;
  color: #666;
  font-size: 0.9rem;
}

.user-stats {
  margin-top: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-left: 4px solid #2196f3;
}

.user-stats h3 {
  margin-top: 0;
  color: white;
}

.user-scores-list {
  margin-bottom: 1.5rem;
}

.user-score-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.user-score {
  font-weight: bold;
  color: #4caf50;
}

.user-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.user-stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat .label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.25rem;
}

.stat .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

@media (max-width: 768px) {
  .score-board {
    padding: 1rem;
  }

  .scoreboard-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-controls {
    justify-content: center;
  }

  .score-item {
    grid-template-columns: 50px 1fr 80px;
    gap: 0.5rem;
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .date {
    display: none;
  }

  .user-stats-summary {
    grid-template-columns: 1fr;
  }
}
</style>
