<template>
  <div v-if="password" class="password-strength">
    <div class="strength-bar">
      <div 
        class="strength-fill" 
        :class="strengthLevel.class"
        :style="{ width: strengthLevel.width }"
      ></div>
    </div>
    <span class="strength-text">{{ strengthLevel.text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  password: string
}>()

const strengthLevel = computed(() => {
  const password = props.password
  if (!password) return { width: '0%', class: '', text: '' }
  
  let score = 0
  
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  
  const strengthLevels = [
    { width: '20%', class: 'very-weak', text: 'Very Weak 😰' },
    { width: '35%', class: 'weak', text: 'Weak 😕' },
    { width: '50%', class: 'fair', text: 'Fair 😐' },
    { width: '70%', class: 'good', text: 'Good 😊' },
    { width: '85%', class: 'strong', text: 'Strong 💪' },
    { width: '100%', class: 'very-strong', text: 'Very Strong 🚀' }
  ]
  
  return strengthLevels[Math.min(score, 5)]
})
</script>

<style scoped>
.password-strength {
  margin-top: 0.5rem;
  padding: 0 16px;
}

.strength-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-fill.very-weak { background: #f44336; }
.strength-fill.weak { background: #ff9800; }
.strength-fill.fair { background: #ffeb3b; }
.strength-fill.good { background: #8bc34a; }
.strength-fill.strong { background: #4caf50; }
.strength-fill.very-strong { background: #2196f3; }

.strength-text {
  font-size: 0.8rem;
  font-weight: 600;
}
</style>