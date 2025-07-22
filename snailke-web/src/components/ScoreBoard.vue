<template>
  <div class="score-board">
    <div class="scoreboard-header">
      <div class="header-title">
        <h2>🏆 Global Leaderboard</h2>
        <p class="header-subtitle">The fastest snails in the garden!</p>
      </div>
      <div class="header-controls">
        <ConnectionStatus :is-connected="isConnected" :connection-retries="connectionRetries" />
        <RefreshButton :is-refreshing="isRefreshing" @refresh="refreshScores" />
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

      <ScoreItem
        v-for="(scoreItem, index) in scores"
        :key="scoreItem.id"
        :rank="index + 1"
        :username="scoreItem.user?.username || 'Anonymous'"
        :score="scoreItem.score"
        :date="scoreItem.createdAt"
        :is-current-user="scoreItem.userId === authStore.user?.id"
        :is-top-3="index < 3"
        :is-new-score="recentScores.has(scoreItem.id)"
      />
    </div>

    <div v-else class="empty-state">
      <p>🐌 No scores yet!</p>
      <p>Be the first to play and set a high score!</p>
    </div>

    <UserStats v-if="authStore.isAuthenticated" :user-scores="userScores" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { scoresApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketConnection } from '@/composables/useWebSocketConnection'
import ConnectionStatus from './ConnectionStatus.vue'
import RefreshButton from './RefreshButton.vue'
import UserStats from './UserStats.vue'
import ScoreItem from './ScoreItem.vue'

const authStore = useAuthStore()
const { isConnected, connectionRetries, lastScoreEvent, lastLeaderboardUpdate } =
  useWebSocketConnection()

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
  staleTime: 60000,
})

const { data: userScores, refetch: refetchUserScores } = useQuery({
  queryKey: ['userScores', authStore.user?.id],
  queryFn: async () => {
    if (!authStore.user?.id) return []
    try {
      return await scoresApi.getUserScores(authStore.user.id)
    } catch (error) {
      console.error('Failed to fetch user scores:', error)
      return []
    }
  },
  enabled: false,
  refetchInterval: 120000,
  retry: false,
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

async function showLiveScoreNotification(data: any) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const { createApp } = await import('vue')
  const LiveScoreNotification = (await import('./LiveScoreNotification.vue')).default

  const app = createApp(LiveScoreNotification, {
    message: `${data.username} just scored ${data.score.toLocaleString()}!${data.isNewBest ? ' 🏆 New PB!' : ''}`,
  })

  app.mount(container)

  setTimeout(() => {
    app.unmount()
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }, 3000)
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

onUnmounted(() => {})
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

.score-item.header {
  display: grid;
  grid-template-columns: 60px 1fr 100px 120px;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.score-item.header .rank {
  text-align: center;
}

.score-item.header .score {
  text-align: right;
}

.score-item.header .date {
  text-align: right;
}

@media (max-width: 768px) {
  .score-item.header {
    grid-template-columns: 50px 1fr 80px;
    gap: 0.5rem;
    padding: 0.75rem;
    font-size: 0.8rem;
  }

  .score-item.header .date {
    display: none;
  }
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

  .user-stats-summary {
    grid-template-columns: 1fr;
  }
}
</style>
