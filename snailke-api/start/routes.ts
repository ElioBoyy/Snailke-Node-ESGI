/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const ScoresController = () => import('#controllers/scores_controller')
const UserScoresController = () => import('#controllers/user_scores_controller')
const AchievementsController = () => import('#controllers/achievements_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    router.post('/register', [AuthController, 'register'])
    router.post('/login', [AuthController, 'login'])
    router.post('/logout', [AuthController, 'logout'])
    router.get('/leaderboard', [ScoresController, 'leaderboard'])
    router.get('/achievements', [AchievementsController, 'index'])
  })
  .prefix('/api')

router
  .group(() => {
    router.get('/me', [AuthController, 'me'])
    router.post('/score', [ScoresController, 'store'])
    router.get('/users/:userId/scores', [UserScoresController, 'index'])
    router.get('/user/achievements', [AchievementsController, 'userAchievements'])
  })
  .prefix('/api')
  .middleware(middleware.auth())

// WebSocket route for real-time updates
transmit.registerRoutes()
