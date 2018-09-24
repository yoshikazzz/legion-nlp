
exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function (table) {
    table.increments().notNullable().primary();
    table.string('lineUserId');
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
