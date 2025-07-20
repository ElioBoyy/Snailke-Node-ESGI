import type { HttpContext } from '@adonisjs/core/http'
import Score from '#models/score'

export default class UserScoresController {
  async index({ params, response }: HttpContext) {
    try {
      const userId = params.userId

      const scores = await Score.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .preload('user')

      return response.ok(scores)
    } catch (error) {
      return response.internalServerError({ message: 'Erreur lors de la récupération des scores' })
    }
  }
}
