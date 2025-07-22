import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})


// Types
export interface User {
  id: number
  username: string
  email: string
  bestScore?: number
  createdAt: string
  updatedAt: string
}

export interface Score {
  id: number
  userId: number
  score: number
  createdAt: string
  user?: User
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  type: 'score' | 'games_played' | 'streak' | 'speed' | 'special'
  condition: number
  points: number
  createdAt: string
}

export interface UserAchievement extends Achievement {
  progress: number
  unlockedAt: string | null
}

// Auth API
export const authApi = {
  async login(data: LoginData): Promise<User> {
    const response = await api.post('/login', data)
    return response.data.user
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post('/register', data)
    return response.data.user
  },

  async logout(): Promise<void> {
    await api.post('/logout')
  },

  async me(): Promise<User> {
    const response = await api.get('/me')
    return response.data
  },
}

// Scores API
export const scoresApi = {
  async submitScore(score: number, speed?: number): Promise<Score> {
    const response = await api.post('/score', { score, speed })
    return response.data.score
  },

  async getLeaderboard(): Promise<Score[]> {
    const response = await api.get('/leaderboard')
    return response.data.scores
  },

  async getUserScores(userId: number): Promise<Score[]> {
    const response = await api.get(`/users/${userId}/scores`)
    return response.data.scores
  },
}

// Achievements API
export const achievementsApi = {
  async getAchievements(): Promise<Achievement[]> {
    const response = await api.get('/achievements')
    return response.data.achievements
  },

  async getUserAchievements(): Promise<UserAchievement[]> {
    const response = await api.get('/user/achievements')
    return response.data.achievements
  },
}