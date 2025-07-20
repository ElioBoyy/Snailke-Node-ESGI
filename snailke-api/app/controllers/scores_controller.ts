import type { HttpContext } from '@adonisjs/core/http'
import transmit from '@adonisjs/transmit/services/main'
import Score from '#models/score'
import { scoreValidator } from '#validators/score'
import AchievementsController from './achievements_controller.js'

export default class ScoresController {
  async store({ request, response, auth }: HttpContext) {
    const user = auth.use('web').user

    if (!user) {
      return response.unauthorized({ message: 'User not authenticated' })
    }

    const { score, speed } = await request.validateUsing(scoreValidator)

    const newScore = await Score.create({
      userId: user.id,
      value: score,
    })

    // Load the user relationship
    await newScore.load('user')

    // Update user's best score if this is better
    const isNewBest = !user.bestScore || score > user.bestScore
    if (isNewBest) {
      user.bestScore = score
      await user.save()
    }

    const scoreData = {
      id: newScore.id,
      userId: newScore.userId,
      score: newScore.value,
      createdAt: newScore.createdAt.toISO(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.toISO(),
        updatedAt: user.updatedAt?.toISO() || null,
      },
    }

    // Emit real-time events
    // Personal notification only to the player
    transmit.broadcast(`user-${user.id}/scores/new`, {
      score: scoreData,
      isNewBest,
      announcement: `You just scored ${score.toLocaleString()} points!`,
    })

    // If it's a new personal best, send personal notification
    if (isNewBest) {
      transmit.broadcast(`user-${user.id}/scores/personal-best`, {
        user: user.username,
        score,
        previousBest: user.bestScore,
      })
    }

    // Broadcast to leaderboard for real-time updates (public info only)
    transmit.broadcast('leaderboard/update', {
      userId: user.id,
      username: user.username,
      score,
      isNewBest,
      timestamp: newScore.createdAt.toISO(),
    })

    // Check for achievements
    const achievementsController = new AchievementsController()
    const newAchievements = await achievementsController.checkAchievements(user.id, 'score')
    await achievementsController.checkAchievements(user.id, 'games_played')
    await achievementsController.checkAchievements(user.id, 'special')
    
    // Check speed achievements if speed was provided
    if (speed) {
      // For Lightning Fast achievement, pass the current score if at max speed
      if (speed >= 10) {
        await achievementsController.checkAchievements(user.id, 'speed', score)
      } else {
        await achievementsController.checkAchievements(user.id, 'speed', speed)
      }
    }

    return response.created({
      score: scoreData,
      newAchievements: newAchievements.map((na) => ({
        id: na.achievement.id,
        name: na.achievement.name,
        description: na.achievement.description,
        icon: na.achievement.icon,
        points: na.achievement.points,
      })),
    })
  }

  async leaderboard({ request, response }: HttpContext) {
    const limit = request.input('limit', 50)

    const scores = await Score.query()
      .preload('user', (query) => {
        query.select('id', 'username', 'email', 'createdAt', 'updatedAt')
      })
      .orderBy('value', 'desc')
      .limit(limit)

    return response.ok({
      scores: scores.map((score) => ({
        id: score.id,
        userId: score.userId,
        score: score.value,
        createdAt: score.createdAt.toISO(),
        user: score.user
          ? {
              id: score.user.id,
              username: score.user.username,
              email: score.user.email,
              createdAt: score.user.createdAt.toISO(),
              updatedAt: score.user.updatedAt?.toISO() || null,
            }
          : null,
      })),
    })
  }
}
