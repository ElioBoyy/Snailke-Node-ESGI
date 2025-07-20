import { ref, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { Transmit } from '@adonisjs/transmit-client'
import { useAuthStore } from '@/stores/auth'

export interface ScoreEvent {
  score: {
    id: number
    userId: number
    score: number
    createdAt: string
    user: {
      id: number
      username: string
      email: string
      createdAt: string
      updatedAt: string | null
    }
  }
  isNewBest: boolean
  announcement: string
}

export interface PersonalBestEvent {
  user: string
  score: number
  previousBest: number
}

export interface LeaderboardUpdateEvent {
  userId: number
  username: string
  score: number
  isNewBest: boolean
  timestamp: string
}

export function useWebSocketConnection() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  const isConnected = ref(false)
  const connectionRetries = ref(0)

  const lastScoreEvent = ref<ScoreEvent | null>(null)
  const lastPersonalBest = ref<PersonalBestEvent | null>(null)
  const lastLeaderboardUpdate = ref<LeaderboardUpdateEvent | null>(null)

  let webSocketClient: Transmit | null = null
  let reconnectionTimer: number | null = null

  function establishConnection() {
    try {
      webSocketClient = new Transmit({
        baseUrl: import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3333',
      })

      const publicLeaderboardChannel = webSocketClient.subscription('leaderboard/update')

      let personalScoreChannel: any = null
      let personalBestChannel: any = null
      let achievementChannel: any = null

      if (authStore.user) {
        const userId = authStore.user.id
        personalScoreChannel = webSocketClient.subscription(`user-${userId}/scores/new`)
        personalBestChannel = webSocketClient.subscription(`user-${userId}/scores/personal-best`)
        achievementChannel = webSocketClient.subscription(`user-${userId}/achievements/new`)
      }

      webSocketClient.on('connected', () => {
        isConnected.value = true
        connectionRetries.value = 0

        if (reconnectionTimer) {
          clearTimeout(reconnectionTimer)
          reconnectionTimer = null
        }
      })

      webSocketClient.on('disconnected', () => {
        isConnected.value = false
        scheduleReconnectionAttempt()
      })

      publicLeaderboardChannel.onMessage((data: LeaderboardUpdateEvent) => {
        lastLeaderboardUpdate.value = data

        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      })

      if (personalScoreChannel) {
        personalScoreChannel.onMessage((data: ScoreEvent) => {
          lastScoreEvent.value = data

          displayScoreNotification(data)
        })
      }

      if (personalBestChannel) {
        personalBestChannel.onMessage((data: PersonalBestEvent) => {
          lastPersonalBest.value = data

          displayPersonalBestNotification(data)
        })
      }

      if (achievementChannel) {
        achievementChannel.onMessage((data: any) => {
          displayAchievementNotification(data)

          queryClient.invalidateQueries({ queryKey: ['achievements'] })
          queryClient.invalidateQueries({ queryKey: ['userAchievements'] })
        })
      }

      publicLeaderboardChannel.create()
      if (personalScoreChannel) personalScoreChannel.create()
      if (personalBestChannel) personalBestChannel.create()
      if (achievementChannel) achievementChannel.create()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      scheduleReconnectionAttempt()
    }
  }

  function closeConnection() {
    if (webSocketClient) {
      webSocketClient = null
    }
    isConnected.value = false

    if (reconnectionTimer) {
      clearTimeout(reconnectionTimer)
      reconnectionTimer = null
    }
  }

  function scheduleReconnectionAttempt() {
    if (reconnectionTimer) return

    connectionRetries.value++

    const delayMs = Math.min(1000 * Math.pow(2, connectionRetries.value), 30000)
    const maxRetries = 10

    reconnectionTimer = setTimeout(() => {
      if (connectionRetries.value < maxRetries) {
        establishConnection()
      } else {
        console.log('Max reconnection attempts reached. Please refresh the page.')
      }
      reconnectionTimer = null
    }, delayMs)
  }

  function displayScoreNotification(data: ScoreEvent) {
    const notification = document.createElement('div')
    notification.className = 'ws-notification score-notification'
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">🎯</span>
        <span class="notification-text">${data.announcement}</span>
      </div>
    `

    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
      zIndex: '10000',
      animation: 'slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s',
      fontSize: '0.9rem',
      fontWeight: '600',
      maxWidth: '300px',
    })

    document.body.appendChild(notification)

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  function displayPersonalBestNotification(data: PersonalBestEvent) {
    const notification = document.createElement('div')
    notification.className = 'ws-notification personal-best-notification'
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">🏆</span>
        <span class="notification-text">
          New personal best: ${data.score.toLocaleString()} points!
        </span>
      </div>
    `

    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #ff9800, #f57c00)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(255, 152, 0, 0.4)',
      zIndex: '10001',
      animation: 'slideInRight 0.3s ease, fadeOut 0.3s ease 3.7s',
      fontSize: '0.9rem',
      fontWeight: '600',
      maxWidth: '300px',
    })

    document.body.appendChild(notification)

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 4000)
  }

  function displayAchievementNotification(data: any) {
    const notification = document.createElement('div')
    notification.className = 'ws-notification achievement-notification'
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">🏅</span>
        <span class="notification-text">
          Achievement unlocked: ${data.achievement.name}!
        </span>
      </div>
    `

    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #9c27b0, #673ab7)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(156, 39, 176, 0.4)',
      zIndex: '10002',
      animation: 'slideInRight 0.3s ease, fadeOut 0.3s ease 4.7s',
      fontSize: '0.9rem',
      fontWeight: '600',
      maxWidth: '300px',
    })

    document.body.appendChild(notification)

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 5000)
  }

  function setupNotificationStyles() {
    if (document.getElementById('ws-notification-styles')) return

    const style = document.createElement('style')
    style.id = 'ws-notification-styles'
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      
      .ws-notification {
        font-family: 'Arial', sans-serif;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      .notification-icon {
        font-size: 1.2rem;
      }
    `
    document.head.appendChild(style)
  }

  onMounted(() => {
    setupNotificationStyles()

    establishConnection()
  })

  onUnmounted(() => {
    closeConnection()
  })

  return {
    isConnected,
    connectionRetries,

    lastScoreEvent,
    lastPersonalBest,
    lastLeaderboardUpdate,

    connect: establishConnection,
    disconnect: closeConnection,
  }
}
