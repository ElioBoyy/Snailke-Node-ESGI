<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { achievementsApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import AchievementCard from './AchievementCard.vue'

const authStore = useAuthStore()

const {
  data: allAchievements,
  isLoading: isLoadingAll,
  error: errorAll,
  refetch: refetchAll,
} = useQuery({
  queryKey: ['achievements'],
  queryFn: achievementsApi.getAchievements,
})

const {
  data: userAchievements,
  isLoading: isLoadingUser,
  error: errorUser,
  refetch: refetchUser,
} = useQuery({
  queryKey: ['userAchievements', authStore.user?.id],
  queryFn: async () => {
    if (!authStore.user?.id) return []
    try {
      return await achievementsApi.getUserAchievements()
    } catch (error) {
      console.error('Failed to fetch user achievements:', error)
      return []
    }
  },
  enabled: false,
  retry: false,
})

const isLoading = computed(() => isLoadingAll.value || isLoadingUser.value)
const error = computed(() => errorAll.value || errorUser.value)

// Merge user achievements with all achievements
const sortedAchievements = computed(() => {
  if (!allAchievements.value) return []

  const achievements = allAchievements.value.map((achievement) => {
    const userAchievement = userAchievements.value?.find((ua) => ua.id === achievement.id)

    return {
      ...achievement,
      progress: userAchievement?.progress || 0,
      unlockedAt: userAchievement?.unlockedAt || null,
    }
  })

  // Sort: unlocked first (by unlock date desc), then by progress desc, then by points asc
  return achievements.sort((a, b) => {
    if (a.unlockedAt && b.unlockedAt) {
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
    }
    if (a.unlockedAt) return -1
    if (b.unlockedAt) return 1

    const aProgress = (a.progress / a.condition) * 100
    const bProgress = (b.progress / b.condition) * 100

    if (aProgress !== bProgress) {
      return bProgress - aProgress
    }

    return a.points - b.points
  })
})

const recentlyUnlocked = computed(() => {
  return sortedAchievements.value.filter((a) => a.unlockedAt).slice(0, 3)
})

const unlockedCount = computed(() => {
  return sortedAchievements.value.filter((a) => a.unlockedAt).length
})

const totalCount = computed(() => {
  return sortedAchievements.value.length
})

const totalPoints = computed(() => {
  return sortedAchievements.value.filter((a) => a.unlockedAt).reduce((sum, a) => sum + a.points, 0)
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return (unlockedCount.value / totalCount.value) * 100
})

async function refetchAchievements() {
  await Promise.all([refetchAll(), refetchUser()])
}

onMounted(async () => {
  await refetchAchievements()
})
</script>

<template>
  <div class="user-achievements">
    <div class="achievements-header">
      <div class="header-title">
        <h2>🎖️ Achievements</h2>
        <p class="header-subtitle">Track your progress and unlock rewards!</p>
      </div>
      <div class="achievements-stats" v-if="userAchievements">
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <div class="stat-label">Unlocked</div>
            <div class="stat-value">{{ unlockedCount }}/{{ totalCount }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <div class="stat-label">Total Points</div>
            <div class="stat-value">{{ totalPoints.toLocaleString() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-label">Progress</div>
            <div class="stat-value">{{ Math.round(progressPercentage) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading achievements...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>Failed to load achievements: {{ error.message }}</p>
      <button @click="refetchAchievements" class="retry-btn">Try Again</button>
    </div>

    <div v-else class="achievements-content">
      <!-- Recently Unlocked -->
      <div v-if="recentlyUnlocked.length > 0" class="section">
        <h3 class="section-title">🌟 Recently Unlocked</h3>
        <div class="achievements-grid">
          <AchievementCard
            v-for="achievement in recentlyUnlocked"
            :key="achievement.id"
            :achievement="achievement"
            :is-recent="true"
          />
        </div>
      </div>

      <!-- All Achievements -->
      <div class="section">
        <h3 class="section-title">🎯 All Achievements</h3>
        <div class="achievements-grid">
          <AchievementCard
            v-for="achievement in sortedAchievements"
            :key="achievement.id"
            :achievement="achievement"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-achievements {
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
}

.achievements-header {
  margin-bottom: 2rem;
}

.header-title {
  text-align: center;
  margin-bottom: 1.5rem;
}

.header-title h2 {
  margin: 0;
  font-size: 2rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-subtitle {
  margin: 0.5rem 0 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.achievements-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  max-width: 500px;
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
}

.stat-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1.5rem;
  min-width: 32px;
  text-align: center;
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
  font-size: 1.1rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.8);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(244, 67, 54, 0.4);
}

.achievements-content {
  max-width: 1000px;
  margin: 0 auto;
}

.section {
  margin-bottom: 3rem;
}

.section-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .user-achievements {
    padding: 0.5rem;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .achievement-card {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.3rem;
  }
}

/* Scrollbar */
.achievements::-webkit-scrollbar {
  width: 6px;
}

.achievements::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.achievements::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.achievements::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
