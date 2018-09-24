
exports.up = function(knex, Promise) {
  return knex.schema.createTable('conversations', function (table) {
    table.increments().notNullable().primary();
    table.integer('first_user_id').unsigned().notNullable();
    table.integer('second_user_id').unsigned();
    table.datetime('ended_at');
    table.timestamps();
    table.foreign('first_user_id').references('users.id');
    table.foreign('second_user_id').references('users.id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
