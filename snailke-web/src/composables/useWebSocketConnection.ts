import { ref, onMounted, onUnmounted, createApp } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { Transmit } from '@adonisjs/transmit-client'
import { useAuthStore } from '@/stores/auth'
import ScoreNotification from '@/components/ScoreNotification.vue'
import LiveScoreNotification from '@/components/LiveScoreNotification.vue'

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

          setTimeout(() => queryClient.invalidateQueries({ queryKey: ['achievements'] }), 100)
          setTimeout(() => queryClient.invalidateQueries({ queryKey: ['userAchievements'] }), 200)
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
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    const app = createApp(ScoreNotification, {
      type: 'score',
      icon: '🎯',
      message: data.announcement
    })
    
    app.mount(container)
    
    setTimeout(() => {
      app.unmount()
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
    }, 3500)
  }

  function displayPersonalBestNotification(data: PersonalBestEvent) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    const app = createApp(ScoreNotification, {
      type: 'personal-best',
      icon: '🏆',
      message: `New personal best: ${data.score.toLocaleString()} points!`
    })
    
    app.mount(container)
    
    setTimeout(() => {
      app.unmount()
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
    }, 4500)
  }

  function displayAchievementNotification(data: any) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    const app = createApp(ScoreNotification, {
      type: 'achievement',
      icon: '🏅',
      message: `Achievement unlocked: ${data.achievement.name}!`
    })
    
    app.mount(container)
    
    setTimeout(() => {
      app.unmount()
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
    }, 5500)
  }


  onMounted(() => {
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
