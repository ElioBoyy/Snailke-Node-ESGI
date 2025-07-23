<script setup lang="ts">
defineProps<{
  value: string | number
  label: string
}>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<style scoped>
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
</style>
