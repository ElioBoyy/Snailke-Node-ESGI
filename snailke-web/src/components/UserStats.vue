<template>
  <div v-if="userScores && userScores.length > 0" class="user-stats">
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
</template>

<script setup lang="ts">
import type { Score } from '@/services/api'

defineProps<{
  userScores: Score[] | undefined
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
  .user-stats-summary {
    grid-template-columns: 1fr;
  }
}
</style>