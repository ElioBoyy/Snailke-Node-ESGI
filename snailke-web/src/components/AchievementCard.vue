<script setup lang="ts">
defineProps<{
  achievement: {
    id: number
    icon: string
    name: string
    description: string
    points: number
    condition: number
    progress: number
    unlockedAt: string | null
  }
  isRecent?: boolean
}>()

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
</script>

<template>
  <div 
    class="achievement-card"
    :class="{ 
      unlocked: achievement.unlockedAt,
      'in-progress': !achievement.unlockedAt && achievement.progress > 0,
      recent: isRecent
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
</template>

<style scoped>
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
</style>