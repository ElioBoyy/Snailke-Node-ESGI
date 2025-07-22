<template>
  <div
    class="score-item"
    :class="{
      'current-user': isCurrentUser,
      'top-3': isTop3,
      'new-score': isNewScore,
    }"
  >
    <div class="rank">
      <span v-if="rank === 1">🥇</span>
      <span v-else-if="rank === 2">🥈</span>
      <span v-else-if="rank === 3">🥉</span>
      <span v-else>{{ rank }}</span>
    </div>
    <div class="player">
      {{ username || 'Anonymous' }}
      <span v-if="isCurrentUser" class="you-badge">You</span>
    </div>
    <div class="score">{{ score.toLocaleString() }}</div>
    <div class="date">{{ formatDate(date) }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  rank: number
  username: string
  score: number
  date: string
  isCurrentUser?: boolean
  isTop3?: boolean
  isNewScore?: boolean
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

<style scoped>
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

@media (max-width: 768px) {
  .score-item {
    grid-template-columns: 50px 1fr 80px;
    gap: 0.5rem;
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .date {
    display: none;
  }
}
</style>