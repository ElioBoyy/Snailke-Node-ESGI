import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import transmit from '@adonisjs/transmit/services/main'
import Achievement from '#models/achievement'
import UserAchievement from '#models/user_achievement'
import User from '#models/user'

export default class AchievementsController {
  async index({ response }: HttpContext) {
    const achievements = await Achievement.query().where('isHidden', false).orderBy('points', 'asc')

    return response.ok({
      achievements: achievements.map((achievement) => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        condition: achievement.condition,
        points: achievement.points,
        createdAt: achievement.createdAt.toISO(),
      })),
    })
  }

  async userAchievements({ auth, response }: HttpContext) {
    const user = auth.use('web').user

    if (!user) {
      return response.unauthorized({ message: 'User not authenticated' })
    }

    const userAchievements = await UserAchievement.query()
      .where('userId', user.id)
      .preload('achievement')
      .orderBy('unlockedAt', 'desc')

    return response.ok({
      achievements: userAchievements.map((userAchievement) => ({
        id: userAchievement.achievement.id,
        name: userAchievement.achievement.name,
        description: userAchievement.achievement.description,
        icon: userAchievement.achievement.icon,
        type: userAchievement.achievement.type,
        condition: userAchievement.achievement.condition,
        points: userAchievement.achievement.points,
        progress: userAchievement.progress,
        unlockedAt: userAchievement.unlockedAt?.toISO() || null,
        createdAt: userAchievement.createdAt.toISO(),
      })),
    })
  }

  async checkAchievements(userId: number, triggerType: string, value?: number) {
    const user = await User.findOrFail(userId)
    await user.load('scores')
    await user.load('userAchievements', (query) => {
      query.preload('achievement')
    })

    const achievements = await Achievement.query().where('type', triggerType)

    const newAchievements: any[] = []

    for (const achievement of achievements) {
      const existingUserAchievement = user.userAchievements.find(
        (ua) => ua.achievementId === achievement.id
      )

      if (existingUserAchievement?.unlockedAt) {
        continue // Already unlocked
      }

      let progress = 0
      let shouldUnlock = false

      switch (achievement.type) {
        case 'score':
          progress = user.bestScore || 0
          shouldUnlock = progress >= achievement.condition
          break
        case 'games_played':
          progress = user.scores.length
          shouldUnlock = progress >= achievement.condition
          break
        case 'speed':
          if (value) {
            if (achievement.name === 'Speed Demon') {
              // Speed Demon: Complete a game at maximum speed (speed 10)
              progress = value >= 10 ? 1 : 0
              shouldUnlock = value >= 10
            } else if (achievement.name === 'Lightning Fast') {
              // Lightning Fast: Score 300 points at max speed
              // Value represents the score achieved at max speed
              progress = value
              shouldUnlock = progress >= achievement.condition
            }
          }
          break
        case 'special':
          // Handle special achievements
          if (achievement.name === 'First Game') {
            // First game achievement should unlock on the first score submission
            progress = user.scores.length >= 1 ? 1 : 0
            shouldUnlock = user.scores.length >= 1
          }
          break
      }

      if (existingUserAchievement) {
        existingUserAchievement.progress = progress
        if (shouldUnlock && !existingUserAchievement.unlockedAt) {
          existingUserAchievement.unlockedAt = DateTime.now()
          newAchievements.push({
            achievement,
            userAchievement: existingUserAchievement,
          })
        }
        await existingUserAchievement.save()
      } else {
        const userAchievement = await UserAchievement.create({
          userId: user.id,
          achievementId: achievement.id,
          progress: progress,
          unlockedAt: shouldUnlock ? DateTime.now() : null,
        })

        if (shouldUnlock) {
          newAchievements.push({
            achievement,
            userAchievement,
          })
        }
      }
    }

    // Emit WebSocket events for new achievements (only to the specific user)
    for (const { achievement, userAchievement } of newAchievements) {
      transmit.broadcast(`user-${user.id}/achievements/new`, {
        userId: user.id,
        username: user.username,
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points,
        },
        unlockedAt: userAchievement.unlockedAt?.toISO(),
      })
    }

    return newAchievements
  }
}
