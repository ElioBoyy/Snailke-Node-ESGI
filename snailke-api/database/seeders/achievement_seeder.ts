import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Achievement from '#models/achievement'

export default class extends BaseSeeder {
  async run() {
    await Achievement.createMany([
      // Score-based achievements
      {
        name: 'First Steps',
        description: 'Score your first 50 points',
        icon: '🌱',
        type: 'score',
        condition: 50,
        points: 100,
        isHidden: false,
      },
      {
        name: 'Getting the Hang of It',
        description: 'Score 200 points in a single game',
        icon: '🎯',
        type: 'score',
        condition: 200,
        points: 200,
        isHidden: false,
      },
      {
        name: 'Snail Master',
        description: 'Score 500 points in a single game',
        icon: '👑',
        type: 'score',
        condition: 500,
        points: 500,
        isHidden: false,
      },
      {
        name: 'Legendary Snail',
        description: 'Score 1000 points in a single game',
        icon: '🏆',
        type: 'score',
        condition: 1000,
        points: 1000,
        isHidden: false,
      },
      {
        name: 'Garden Champion',
        description: 'Score 2000 points in a single game',
        icon: '🌟',
        type: 'score',
        condition: 2000,
        points: 2000,
        isHidden: false,
      },

      // Games played achievements
      {
        name: 'First Game',
        description: 'Complete your first game',
        icon: '🚀',
        type: 'special',
        condition: 1,
        points: 50,
        isHidden: false,
      },
      {
        name: 'Dedicated Player',
        description: 'Play 10 games',
        icon: '🎮',
        type: 'games_played',
        condition: 10,
        points: 300,
        isHidden: false,
      },
      {
        name: 'Game Enthusiast',
        description: 'Play 25 games',
        icon: '🕹️',
        type: 'games_played',
        condition: 25,
        points: 500,
        isHidden: false,
      },
      {
        name: 'Snail Veteran',
        description: 'Play 50 games',
        icon: '🏅',
        type: 'games_played',
        condition: 50,
        points: 1000,
        isHidden: false,
      },
      {
        name: 'Marathon Player',
        description: 'Play 100 games',
        icon: '⭐',
        type: 'games_played',
        condition: 100,
        points: 2000,
        isHidden: false,
      },

      // Speed achievements
      {
        name: 'Speed Demon',
        description: 'Complete a game at maximum speed',
        icon: '⚡',
        type: 'speed',
        condition: 10,
        points: 300,
        isHidden: false,
      },
      {
        name: 'Lightning Fast',
        description: 'Score 300 points at max speed',
        icon: '🌪️',
        type: 'speed',
        condition: 300,
        points: 800,
        isHidden: false,
      },

      // Hidden/Secret achievements
      {
        name: 'Secret Garden',
        description: 'You found the secret!',
        icon: '🔒',
        type: 'special',
        condition: 1,
        points: 1500,
        isHidden: true,
      },
    ])
  }
}
