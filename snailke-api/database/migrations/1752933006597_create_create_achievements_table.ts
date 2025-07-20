import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'achievements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').notNullable()
      table.string('icon').notNullable()
      table.enum('type', ['score', 'games_played', 'streak', 'speed', 'special']).notNullable()
      table.integer('condition').notNullable()
      table.integer('points').defaultTo(100)
      table.boolean('is_hidden').defaultTo(false)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
