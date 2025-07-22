<template>
  <div 
    class="activity-item"
    :class="{ 'personal-best': isPersonalBest }"
  >
    <div class="activity-icon">
      <span v-if="isPersonalBest">🏆</span>
      <span v-else>🎮</span>
    </div>
    <div class="activity-details">
      <div class="activity-score">{{ score.toLocaleString() }} points</div>
      <div class="activity-date">{{ formatDate(date) }}</div>
    </div>
    <div v-if="isPersonalBest" class="best-badge">
      Personal Best!
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  score: number
  date: string
  isPersonalBest?: boolean
}>()

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

<style scoped>
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
</style>