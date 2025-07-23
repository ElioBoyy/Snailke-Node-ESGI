<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  id: string
  modelValue: string
  icon: string
  label: string
  type?: string
  disabled?: boolean
  minlength?: number
  maxlength?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isFocused = ref(false)
const showPassword = ref(false)

const type = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type || 'text'
})

function togglePassword() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="input-group" :class="{ 'focus-within': isFocused }">
    <div class="input-icon">{{ icon }}</div>
    <div class="input-wrapper">
      <input
        :id="id"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :type="type"
        required
        placeholder=" "
        :disabled="disabled"
        class="form-input"
        :minlength="minlength"
        :maxlength="maxlength"
      />
      <label :for="id" class="floating-label">{{ label }}</label>
      <button
        v-if="type === 'password'"
        type="button"
        @click="togglePassword"
        class="password-toggle"
        :disabled="disabled"
      >
        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-group {
  position: relative;
  display: flex;
  align-items: stretch;
  background: #f8f9fa;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.input-group.focus-within,
.input-group:focus-within {
  background: white;
  border-color: #4caf50;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  font-size: 1.2rem;
  color: #666;
  transition: color 0.3s ease;
}

.input-group.focus-within .input-icon,
.input-group:focus-within .input-icon {
  color: #4caf50;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  height: 60px;
  padding: 20px 16px 8px;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: #333;
  outline: none;
  transition: all 0.3s ease;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.floating-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1rem;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus + .floating-label,
.form-input:not(:placeholder-shown) + .floating-label {
  top: 16px;
  font-size: 0.75rem;
  color: #4caf50;
  font-weight: 600;
}

.password-toggle {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.password-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>
