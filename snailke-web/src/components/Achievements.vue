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
          <div 
            v-for="achievement in recentlyUnlocked" 
            :key="achievement.id"
            class="achievement-card unlocked recent"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-info">
              <h4 class="achievement-name">{{ achievement.name }}</h4>
              <p class="achievement-description">{{ achievement.description }}</p>
              <div class="achievement-meta">
                <span class="achievement-points">{{ achievement.points }} pts</span>
                <span class="achievement-date">{{ formatDate(achievement.unlockedAt!) }}</span>
              </div>
            </div>
            <div class="achievement-badge">✓</div>
          </div>
        </div>
      </div>

      <!-- All Achievements -->
      <div class="section">
        <h3 class="section-title">🎯 All Achievements</h3>
        <div class="achievements-grid">
          <div 
            v-for="achievement in sortedAchievements" 
            :key="achievement.id"
            class="achievement-card"
            :class="{ 
              unlocked: achievement.unlockedAt,
              'in-progress': !achievement.unlockedAt && achievement.progress > 0
            }"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-info">
              <h4 class="achievement-name">{{ achievement.name }}</h4>
              <p class="achievement-description">{{ achievement.description }}</p>
              <div class="achievement-progress" v-if="!achievement.unlockedAt">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${Math.min(100, (achievement.progress / achievement.condition) * 100)}%` }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ achievement.progress.toLocaleString() }} / {{ achievement.condition.toLocaleString() }}
                </span>
              </div>
              <div class="achievement-meta">
                <span class="achievement-points">{{ achievement.points }} pts</span>
                <span 
                  v-if="achievement.unlockedAt" 
                  class="achievement-date"
                >
                  {{ formatDate(achievement.unlockedAt) }}
                </span>
              </div>
            </div>
            <div v-if="achievement.unlockedAt" class="achievement-badge">✓</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { achievementsApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Fetch all achievements
const { 
  data: allAchievements, 
  isLoading: isLoadingAll,
  error: errorAll,
  refetch: refetchAll
} = useQuery({
  queryKey: ['achievements'],
  queryFn: achievementsApi.getAchievements,
})

// Fetch user achievements (only if authenticated)
const { 
  data: userAchievements, 
  isLoading: isLoadingUser,
  error: errorUser,
  refetch: refetchUser
} = useQuery({
  queryKey: ['userAchievements', authStore.user?.id],
  queryFn: achievementsApi.getUserAchievements,
  enabled: computed(() => !!authStore.user),
})

// Computed properties
const isLoading = computed(() => isLoadingAll.value || isLoadingUser.value)
const error = computed(() => errorAll.value || errorUser.value)

// Merge user achievements with all achievements
const sortedAchievements = computed(() => {
  if (!allAchievements.value) return []
  
  const achievements = allAchievements.value.map(achievement => {
    const userAchievement = userAchievements.value?.find(
      ua => ua.id === achievement.id
    )
    
    return {
      ...achievement,
      progress: userAchievement?.progress || 0,
      unlockedAt: userAchievement?.unlockedAt || null
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
  return sortedAchievements.value
    .filter(a => a.unlockedAt)
    .slice(0, 3)
})

const unlockedCount = computed(() => {
  return sortedAchievements.value.filter(a => a.unlockedAt).length
})

const totalCount = computed(() => {
  return sortedAchievements.value.length
})

const totalPoints = computed(() => {
  return sortedAchievements.value
    .filter(a => a.unlockedAt)
    .reduce((sum, a) => sum + a.points, 0)
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return (unlockedCount.value / totalCount.value) * 100
})

// Functions
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

async function refetchAchievements() {
  await Promise.all([refetchAll(), refetchUser()])
}

// Refetch data when component mounts
onMounted(async () => {
  await refetchAchievements()
})
</script>

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

.loading, .error {
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
  to { transform: rotate(360deg); }
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

.achievement-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  opacity: 0.6;
}

.achievement-card.unlocked {
  opacity: 1;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1));
  border-color: rgba(76, 175, 80, 0.4);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
}

.achievement-card.recent {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
  animation: glow 2s ease-in-out infinite alternate;
}

.achievement-card.in-progress {
  opacity: 0.8;
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(33, 150, 243, 0.05));
  border-color: rgba(33, 150, 243, 0.3);
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

@keyframes glow {
  from { box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3); }
  to { box-shadow: 0 12px 48px rgba(255, 215, 0, 0.5); }
}

.achievement-icon {
  font-size: 2.5rem;
  min-width: 60px;
  text-align: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  margin: 0 0 0.5rem;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.achievement-description {
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
}

.achievement-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196F3, #64B5F6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.achievement-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.achievement-points {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.achievement-date {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.achievement-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
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