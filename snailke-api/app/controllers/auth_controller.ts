import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator, loginValidator } from '#validators/auth'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const user = await User.create(payload)

    return response.created({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bestScore: user.bestScore,
      },
    })
  }

  async login({ request, response, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    await auth.use('web').login(user)

    return response.ok({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bestScore: user.bestScore,
      },
    })
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()

    return response.ok({
      message: 'Logout successful',
    })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.use('web').user

    if (!user) {
      return response.unauthorized({ message: 'User not authenticated' })
    }

    return response.ok({
      id: user.id,
      username: user.username,
      email: user.email,
      bestScore: user.bestScore,
    })
  }
}
