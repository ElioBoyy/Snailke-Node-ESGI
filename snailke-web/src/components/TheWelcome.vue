<script setup lang="ts">
import { computed } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { authApi, scoresApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  startGame: []
}>()

const authStore = useAuthStore()
const queryClient = useQueryClient()

const logoutMutation = useMutation({
  mutationFn: authApi.logout,
  onSuccess: () => {
    authStore.clearUser()
    queryClient.clear()
  },
  onError: (error) => {
    console.error('Logout failed:', error)
    authStore.clearUser()
    queryClient.clear()
  },
})

const isLoggingOut = computed(() => logoutMutation.isPending.value)

const { data: userScores } = useQuery({
  queryKey: ['userScores', authStore.user?.id],
  queryFn: () =>
    authStore.user ? scoresApi.getUserScores(authStore.user.id) : Promise.resolve([]),
  enabled: computed(() => !!authStore.user),
})

const { data: leaderboardScores } = useQuery({
  queryKey: ['leaderboard'],
  queryFn: scoresApi.getLeaderboard,
})

const bestScore = computed(() => {
  if (!userScores.value || userScores.value.length === 0) return 0
  return Math.max(...userScores.value.map((s) => s.score))
})

const averageScore = computed(() => {
  if (!userScores.value || userScores.value.length === 0) return 0
  return Math.round(userScores.value.reduce((sum, s) => sum + s.score, 0) / userScores.value.length)
})

const recentGames = computed(() => {
  if (!userScores.value) return []
  return [...userScores.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

const leaderboardRank = computed(() => {
  if (!leaderboardScores.value || !authStore.user) return 'N/A'

  const userRank = leaderboardScores.value.findIndex((score) => score.userId === authStore.user?.id)
  return userRank === -1 ? 'N/A' : `#${userRank + 1}`
})

function handleLogout() {
  logoutMutation.mutate()
}

function formatDate(dateString: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'today'
  } else if (diffDays === 1) {
    return 'yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<template>
  <div class="user-profile">
    <div class="profile-header">
      <div class="user-info">
        <div class="avatar">🐌</div>
        <div class="user-details">
          <h3>{{ authStore.user?.email }}</h3>
          <p class="join-date">Joined {{ formatDate(authStore.user?.createdAt || '') }}</p>
        </div>
      </div>
      <button @click="handleLogout" :disabled="isLoggingOut" class="logout-btn">
        {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
      </button>
    </div>

    <div v-if="authStore.user" class="profile-content">
      <div v-if="userScores && userScores.length > 0" class="quick-stats">
        <div class="stat-card">
          <div class="stat-value">{{ userScores.length }}</div>
          <div class="stat-label">Games Played</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ bestScore.toLocaleString() }}</div>
          <div class="stat-label">Best Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ averageScore.toLocaleString() }}</div>
          <div class="stat-label">Average Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ leaderboardRank }}</div>
          <div class="stat-label">Leaderboard Rank</div>
        </div>
      </div>

      <div v-if="userScores && userScores.length > 0" class="recent-activity">
        <h4>Recent Games</h4>
        <div class="activity-list">
          <div
            v-for="score in recentGames"
            :key="score.id"
            class="activity-item"
            :class="{ 'personal-best': score.score === bestScore }"
          >
            <div class="activity-icon">
              <span v-if="score.score === bestScore">🏆</span>
              <span v-else>🎮</span>
            </div>
            <div class="activity-details">
              <div class="activity-score">{{ score.score.toLocaleString() }} points</div>
              <div class="activity-date">{{ formatDate(score.createdAt) }}</div>
            </div>
            <div v-if="score.score === bestScore" class="best-badge">Personal Best!</div>
          </div>
        </div>
      </div>

      <div v-if="!userScores || userScores.length === 0" class="empty-profile">
        <div class="empty-icon">🐌</div>
        <h3>Welcome to Snailke!</h3>
        <p>Start playing to see your stats and achievements here.</p>
        <button @click="$emit('startGame')" class="start-playing-btn">Start Playing</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Arial', sans-serif;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4caf50;
  border-radius: 50%;
}

.user-details h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.join-date {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.logout-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.logout-btn:hover:not(:disabled) {
  background-color: #d32f2f;
}

.logout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4caf50;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #4caf50;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-activity {
  background-color: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.recent-activity h4 {
  margin-top: 0;
  color: #333;
  font-size: 1.2rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.activity-item:hover {
  background-color: #e9ecef;
}

.activity-item.personal-best {
  background-color: #fff3e0;
  border-left: 4px solid #ff9800;
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-details {
  flex: 1;
}

.activity-score {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.activity-date {
  color: #666;
  font-size: 0.9rem;
}

.best-badge {
  background-color: #ff9800;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-weight: bold;
}

.empty-profile {
  text-align: center;
  padding: 3rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-profile h3 {
  color: #4caf50;
  margin-bottom: 1rem;
}

.empty-profile p {
  color: #666;
  margin-bottom: 2rem;
}

.start-playing-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.start-playing-btn:hover {
  background-color: #45a049;
}

@media (max-width: 768px) {
  .user-profile {
    padding: 1rem;
  }

  .profile-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
