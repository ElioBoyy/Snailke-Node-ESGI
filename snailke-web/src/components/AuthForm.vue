<template>
  <div class="auth-container">
    <!-- Animated Background -->
    <div class="auth-background">
      <div class="snail-trail"></div>
      <div class="floating-leaves">
        <div class="leaf" v-for="i in 6" :key="i">🍃</div>
      </div>
    </div>

    <!-- Main Auth Card -->
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo-animation">
          <div class="snail-icon">🐌</div>
          <div class="logo-text">Snailke</div>
        </div>
        <p class="auth-subtitle">{{ mode === 'login' ? 'Welcome back, snail racer!' : 'Join the slowest race ever!' }}</p>
      </div>

      <!-- Mode Switcher -->
      <div class="mode-switcher">
        <div class="switcher-track">
          <button 
            @click="mode = 'login'" 
            :class="{ active: mode === 'login' }"
            class="mode-btn"
          >
            <span class="btn-icon">🔑</span>
            <span class="btn-text">Login</span>
          </button>
          <button 
            @click="mode = 'register'" 
            :class="{ active: mode === 'register' }"
            class="mode-btn"
          >
            <span class="btn-icon">✨</span>
            <span class="btn-text">Sign Up</span>
          </button>
          <div class="switcher-indicator" :class="{ 'move-right': mode === 'register' }"></div>
        </div>
      </div>

      <!-- Form Container -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-fields">
          <!-- Username field for registration -->
          <div v-if="mode === 'register'" class="input-group">
            <div class="input-icon">👤</div>
            <div class="input-wrapper">
              <input 
                id="username"
                v-model="form.username" 
                type="text" 
                required 
                placeholder=" "
                :disabled="isLoading"
                class="form-input"
                minlength="3"
                maxlength="50"
              >
              <label for="username" class="floating-label">Username</label>
            </div>
          </div>

          <!-- Email field -->
          <div class="input-group">
            <div class="input-icon">📧</div>
            <div class="input-wrapper">
              <input 
                id="email"
                v-model="form.email" 
                type="email" 
                required 
                placeholder=" "
                :disabled="isLoading"
                class="form-input"
              >
              <label for="email" class="floating-label">Email Address</label>
            </div>
          </div>
          
          <!-- Password field -->
          <div class="input-group">
            <div class="input-icon">🔒</div>
            <div class="input-wrapper">
              <input 
                id="password"
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'"
                required 
                placeholder=" "
                :disabled="isLoading"
                class="form-input"
                :minlength="mode === 'register' ? 6 : undefined"
              >
              <label for="password" class="floating-label">Password</label>
              <button 
                type="button" 
                @click="showPassword = !showPassword"
                class="password-toggle"
                :disabled="isLoading"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <!-- Password strength indicator for registration -->
          <div v-if="mode === 'register' && form.password" class="password-strength">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :class="passwordStrength.class"
                :style="{ width: passwordStrength.width }"
              ></div>
            </div>
            <span class="strength-text">{{ passwordStrength.text }}</span>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="error-banner">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ error }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="success" class="success-banner">
          <span class="success-icon">✅</span>
          <span class="success-text">{{ success }}</span>
        </div>
        
        <!-- Submit Button -->
        <button 
          type="submit" 
          :disabled="isLoading || !isFormValid"
          class="submit-button"
          :class="{ loading: isLoading }"
        >
          <div class="btn-content">
            <span v-if="isLoading" class="loading-spinner"></span>
            <span class="btn-icon" v-if="!isLoading">
              {{ mode === 'login' ? '🚀' : '🌟' }}
            </span>
            <span class="btn-text">
              {{ isLoading ? 'Please wait...' : (mode === 'login' ? 'Start Racing' : 'Join the Race') }}
            </span>
          </div>
        </button>

        <!-- Additional Actions -->
        <div class="form-footer">
          <div v-if="mode === 'login'" class="forgot-password">
            <a href="#" class="link">Forgot your password? 🤔</a>
          </div>
          <div v-else class="terms-notice">
            <p class="terms-text">
              By signing up, you agree to have the most fun playing the slowest snake game ever! 🐌✨
            </p>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { authApi, type LoginData, type RegisterData } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{
  success: []
}>()

const authStore = useAuthStore()
const queryClient = useQueryClient()

const mode = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const form = ref({
  username: '',
  email: '',
  password: ''
})

const error = ref('')
const success = ref('')

// Password strength validation
const passwordStrength = computed(() => {
  const password = form.value.password
  if (!password) return { width: '0%', class: '', text: '' }
  
  let score = 0
  const feedback = []
  
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  
  if (password.length < 6) feedback.push('At least 6 characters')
  if (!/[A-Z]/.test(password)) feedback.push('uppercase letter')
  if (!/[0-9]/.test(password)) feedback.push('number')
  
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

// Form validation
const isFormValid = computed(() => {
  const emailValid = form.value.email && /\S+@\S+\.\S+/.test(form.value.email)
  const passwordValid = form.value.password && form.value.password.length >= (mode.value === 'register' ? 6 : 1)
  const usernameValid = mode.value === 'login' || (form.value.username && form.value.username.length >= 3)
  
  return emailValid && passwordValid && usernameValid
})

// Mutations
const loginMutation = useMutation({
  mutationFn: (data: LoginData) => authApi.login(data),
  onSuccess: (user) => {
    authStore.setUser(user)
    queryClient.invalidateQueries({ queryKey: ['userScores'] })
    error.value = ''
    success.value = `Welcome back, ${user.username}! 🎉`
    setTimeout(() => {
      resetForm()
      emit('success')
    }, 1500)
  },
  onError: (err: Error & { response?: { data?: { message?: string } } }) => {
    error.value = err.response?.data?.message || 'Invalid email or password. Please try again! 🔐'
    success.value = ''
  }
})

const registerMutation = useMutation({
  mutationFn: (data: RegisterData) => authApi.register(data),
  onSuccess: (user) => {
    authStore.setUser(user)
    queryClient.invalidateQueries({ queryKey: ['userScores'] })
    error.value = ''
    success.value = `Account created! Welcome to Snailke, ${user.username}! 🌟`
    setTimeout(() => {
      resetForm()
      emit('success')
    }, 2000)
  },
  onError: (err: Error & { response?: { data?: { message?: string } } }) => {
    const message = err.response?.data?.message || 'Registration failed. Please try again! ✨'
    error.value = message.includes('email') ? 'This email is already taken! Try another one 📧' : message
    success.value = ''
  }
})

const isLoading = computed(() => 
  loginMutation.isPending.value || registerMutation.isPending.value
)

// Functions
function handleSubmit() {
  if (!isFormValid.value) return
  
  error.value = ''
  success.value = ''
  
  if (mode.value === 'login') {
    loginMutation.mutate({
      email: form.value.email,
      password: form.value.password
    })
  } else {
    registerMutation.mutate({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password
    })
  }
}

function resetForm() {
  form.value = {
    username: '',
    email: '',
    password: ''
  }
  showPassword.value = false
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* Main Container */
.auth-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

/* Animated Background */
.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.1;
}

.snail-trail {
  position: absolute;
  top: 20%;
  left: -10%;
  width: 120%;
  height: 200px;
  background: linear-gradient(45deg, transparent 48%, rgba(76, 175, 80, 0.1) 50%, transparent 52%);
  animation: slideTrail 20s linear infinite;
}

.floating-leaves {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.leaf {
  position: absolute;
  font-size: 2rem;
  animation: float 15s infinite ease-in-out;
  opacity: 0.7;
}

.leaf:nth-child(1) { left: 10%; animation-delay: 0s; }
.leaf:nth-child(2) { left: 20%; animation-delay: 2s; }
.leaf:nth-child(3) { left: 30%; animation-delay: 4s; }
.leaf:nth-child(4) { left: 70%; animation-delay: 6s; }
.leaf:nth-child(5) { left: 80%; animation-delay: 8s; }
.leaf:nth-child(6) { left: 90%; animation-delay: 10s; }

@keyframes slideTrail {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes float {
  0%, 100% { transform: translateY(100vh) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* Main Auth Card */
.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(60px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.snail-icon {
  font-size: 3rem;
  animation: bounce 2s infinite;
}

.logo-text {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4CAF50, #2196F3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.8;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

/* Mode Switcher */
.mode-switcher {
  margin-bottom: 2rem;
}

.switcher-track {
  position: relative;
  display: flex;
  background: #f8f9fa;
  border-radius: 50px;
  padding: 4px;
  overflow: hidden;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  background: transparent;
  border-radius: 46px;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
}

.mode-btn.active {
  color: white;
}

.btn-icon {
  font-size: 1.2rem;
}

.switcher-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 46px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.switcher-indicator.move-right {
  transform: translateX(100%);
  background: linear-gradient(135deg, #2196F3, #1976D2);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

/* Form Styles */
.auth-form {
  position: relative;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

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

.input-group:focus-within {
  background: white;
  border-color: #4CAF50;
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

.input-group:focus-within .input-icon {
  color: #4CAF50;
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
  color: #4CAF50;
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

/* Password Strength */
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

/* Messages */
.error-banner, .success-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  animation: slideIn 0.3s ease;
}

.error-banner {
  background: #ffebee;
  color: #c62828;
  border: 1px solid rgba(198, 40, 40, 0.2);
}

.success-banner {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.error-icon, .success-icon {
  font-size: 1.2rem;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Submit Button */
.submit-button {
  width: 100%;
  height: 60px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
}

.submit-button.loading {
  background: #999;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-icon {
  font-size: 1.2rem;
}

/* Form Footer */
.form-footer {
  text-align: center;
}

.link {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.link:hover {
  color: #45a049;
  text-decoration: underline;
}

.terms-text {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 640px) {
  .auth-container {
    padding: 1rem;
  }
  
  .auth-card {
    padding: 2rem;
    border-radius: 20px;
  }
  
  .logo-text {
    font-size: 2rem;
  }
  
  .snail-icon {
    font-size: 2.5rem;
  }
  
  .form-input {
    height: 56px;
    padding: 18px 12px 6px;
  }
  
  .floating-label {
    left: 12px;
  }
  
  .form-input:focus + .floating-label,
  .form-input:not(:placeholder-shown) + .floating-label {
    left: 12px;
    top: 14px;
  }
  
  .submit-button {
    height: 56px;
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }
  
  .logo-animation {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .mode-btn {
    padding: 0.75rem;
  }
  
  .btn-text {
    display: none;
  }
}
</style>