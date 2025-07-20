import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // Initialize user from localStorage if available
  let initialUser: User | null = null
  try {
    const storedUser = localStorage.getItem('snailke-user')
    if (storedUser) {
      initialUser = JSON.parse(storedUser)
    }
  } catch (error) {
    console.warn('Failed to parse stored user data:', error)
    localStorage.removeItem('snailke-user')
  }
  
  const user = ref<User | null>(initialUser)
  const isAuthenticated = computed(() => !!user.value)

  function setUser(userData: User | null) {
    user.value = userData
    try {
      if (userData) {
        localStorage.setItem('snailke-user', JSON.stringify(userData))
      } else {
        localStorage.removeItem('snailke-user')
      }
    } catch (error) {
      console.warn('Failed to update localStorage:', error)
    }
  }

  function clearUser() {
    user.value = null
    try {
      localStorage.removeItem('snailke-user')
    } catch (error) {
      console.warn('Failed to remove user from localStorage:', error)
    }
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser,
  }
})