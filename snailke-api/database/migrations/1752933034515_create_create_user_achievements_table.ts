import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_achievements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .integer('achievement_id')
        .unsigned()
        .references('id')
        .inTable('achievements')
        .onDelete('CASCADE')
      table.integer('progress').defaultTo(0)
      table.timestamp('unlocked_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['user_id', 'achievement_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
