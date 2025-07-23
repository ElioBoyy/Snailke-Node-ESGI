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
      // Clear all localStorage
      localStorage.clear()
      
      // Clear all cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
      })
    } catch (error) {
      console.warn('Failed to clear user data:', error)
    }
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser,
  }
})