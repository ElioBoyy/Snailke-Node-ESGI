<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { authApi } from './services/api'
import { useAuthStore } from './stores/auth'
import { useWebSocketConnection } from './composables/useWebSocketConnection'
import SnakeGame from './components/SnakeGame.vue'
import ScoreBoard from './components/ScoreBoard.vue'
import AuthForm from './components/AuthForm.vue'
import UserProfile from './components/UserProfile.vue'
import Achievements from './components/Achievements.vue'

const authStore = useAuthStore()
const currentView = ref<'game' | 'scores' | 'achievements' | 'profile'>('game')
const showAuthModal = ref(false)
const achievementsKey = ref(0)

const { isConnected, lastScoreEvent, lastPersonalBest } = useWebSocketConnection()

const {
  data: currentUser,
  isSuccess,
  isError,
} = useQuery({
  queryKey: ['currentUser'],
  queryFn: authApi.me,
  retry: false,
  staleTime: 5 * 60 * 1000,
})

watch(
  [currentUser, isSuccess, isError],
  ([user, success, error]) => {
    if (success && user) {
      authStore.setUser(user)
    } else if (error) {
      authStore.clearUser()
    }
  },
  { immediate: true },
)

function showAuth() {
  showAuthModal.value = true
}

function hideAuth() {
  showAuthModal.value = false
}

function handleAuthSuccess() {
  hideAuth()
}

function handleStartGame() {
  currentView.value = 'game'
}
</script>

<template>
  <div id="app" class="webapp-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🐌</span>
          <span class="logo-text">Snailke</span>
        </div>
        <div class="connection-status" :class="{ connected: isConnected }">
          <span class="status-dot"></span>
          <span class="status-text">{{ isConnected ? 'Live' : 'Offline' }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          @click="currentView = 'game'"
          :class="{ active: currentView === 'game' }"
          class="nav-item"
        >
          <span class="nav-icon">🎮</span>
          <span class="nav-label">Play Game</span>
        </button>
        <button
          @click="currentView = 'scores'"
          :class="{ active: currentView === 'scores' }"
          class="nav-item"
        >
          <span class="nav-icon">🏆</span>
          <span class="nav-label">Leaderboard</span>
        </button>
        <button
          v-if="authStore.isAuthenticated"
          @click="currentView = 'achievements'; achievementsKey++"
          :class="{ active: currentView === 'achievements' }"
          class="nav-item"
        >
          <span class="nav-icon">🎖️</span>
          <span class="nav-label">Achievements</span>
        </button>
        <button
          v-if="authStore.isAuthenticated"
          @click="currentView = 'profile'"
          :class="{ active: currentView === 'profile' }"
          class="nav-item"
        >
          <span class="nav-icon">👤</span>
          <span class="nav-label">Profile</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div v-if="authStore.isAuthenticated" class="user-info">
          <div class="user-avatar">{{ authStore.user?.username?.charAt(0).toUpperCase() }}</div>
          <div class="user-details">
            <div class="username">{{ authStore.user?.username }}</div>
            <div class="user-email">{{ authStore.user?.email }}</div>
          </div>
        </div>
        <div v-else class="auth-section">
          <button @click="showAuth" class="auth-btn">
            <span class="nav-icon">🔐</span>
            <span class="nav-label">Login</span>
          </button>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <div class="content-header">
        <h1 class="page-title">
          <span v-if="currentView === 'game'">🎮 Game Arena</span>
          <span v-else-if="currentView === 'scores'">🏆 Leaderboard</span>
          <span v-else-if="currentView === 'achievements'">🎖️ Achievements</span>
          <span v-else-if="currentView === 'profile'">👤 Profile</span>
        </h1>
      </div>

      <div class="content-body">
        <div v-show="currentView === 'game'" class="view-container">
          <SnakeGame @show-auth="showAuth" />
        </div>

        <div v-show="currentView === 'scores'" class="view-container">
          <ScoreBoard />
        </div>

        <div v-show="currentView === 'achievements'" class="view-container">
          <Achievements v-if="authStore.isAuthenticated" :key="achievementsKey" />
          <div v-else class="auth-required-message">
            <div class="message-content">
              <div class="message-icon">🔐</div>
              <h2>Authentication Required</h2>
              <p>You need to be logged in to view achievements.</p>
              <button @click="showAuth" class="auth-btn">Log In / Sign Up</button>
            </div>
          </div>
        </div>

        <div v-show="currentView === 'profile'" class="view-container">
          <UserProfile v-if="authStore.isAuthenticated" @start-game="handleStartGame" />
        </div>
      </div>
    </main>

    <Transition name="modal">
      <div v-if="showAuthModal" class="modal-overlay" @click.self="hideAuth">
        <AuthForm @success="handleAuthSuccess" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.webapp-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  font-family:
    'Segoe UI',
    -apple-system,
    BlinkMacSystemFont,
    'Roboto',
    sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  margin-bottom: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.connection-status.connected {
  background: rgba(76, 175, 80, 0.2);
  color: #a5d6a7;
  border-color: rgba(76, 175, 80, 0.3);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f44336;
  animation: pulse 2s infinite;
  box-shadow: 0 0 6px rgba(244, 67, 54, 0.5);
}

.connection-status.connected .status-dot {
  background: #4caf50;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.5);
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateX(4px);
  color: white;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
}

.nav-icon {
  font-size: 1.2rem;
  min-width: 20px;
}

.nav-label {
  font-weight: 600;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4caf50, #2196f3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-section .auth-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.auth-section .auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
}

.main-content {
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.content-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.content-body {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.view-container {
  width: 100%;
  height: 100%;
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.achievements-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: white;
}

.achievements-placeholder h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.achievements-placeholder p {
  font-size: 1.2rem;
  opacity: 0.8;
  max-width: 400px;
}

.auth-required-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.message-content {
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 3rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 400px;
  width: 100%;
}

.message-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.message-content h2 {
  color: white;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.message-content p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.message-content .auth-btn {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.message-content .auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }

  .content-body {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .webapp-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    flex-direction: row;
    padding: 1rem;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .sidebar-header {
    margin-bottom: 0;
    margin-right: 1rem;
  }

  .logo {
    margin-bottom: 0;
  }

  .sidebar-nav {
    flex-direction: row;
    flex: 1;
    gap: 0.25rem;
  }

  .nav-item {
    flex-direction: column;
    padding: 0.75rem 0.5rem;
    gap: 0.25rem;
    min-width: 0;
  }

  .nav-label {
    font-size: 0.7rem;
    text-align: center;
  }

  .sidebar-footer {
    margin-top: 0;
    margin-left: 1rem;
    padding-top: 0;
    border-top: none;
  }

  .user-info {
    padding: 0.75rem;
  }

  .main-content {
    height: calc(100vh - 100px);
  }

  .content-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .content-body {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .sidebar {
    padding: 0.75rem;
  }

  .logo-text {
    display: none;
  }

  .nav-label {
    display: none;
  }

  .nav-item {
    padding: 0.5rem;
  }

  .connection-status .status-text {
    display: none;
  }

  .user-details {
    display: none;
  }
}

button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
}

button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

.content-body::-webkit-scrollbar {
  width: 6px;
}

.content-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.content-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.content-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
