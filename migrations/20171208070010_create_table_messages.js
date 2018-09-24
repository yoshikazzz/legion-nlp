
exports.up = function(knex, Promise) {
  return knex.schema.createTable('messages', function (table) {
    table.increments().notNullable().primary();
    table.integer('conversation_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.text('text').notNullable();
    table.timestamps();
    table.foreign('conversation_id').references('conversations.id');
    table.foreign('user_id').references('users.id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('messages');
};
