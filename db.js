const config = require('./knexfile');
const knex = require('knex')(config);

knex.getOrCreateUserIdFromLineUserId = (userId) => {
  return knex('users')
      .where('lineUserId', userId)
      .first()
      .then(user => {
        if (user) {
          return user['id'];
        } else {
          const user = {
            'created_at': knex.raw('NOW()'),
            'updated_at': knex.raw('NOW()')
          };

          user['lineUserId'] = userId;

          return knex('users')
              .insert(user)
              .then((ids) => { return ids[0]; });
        }
      })
      ;
};

knex.beginConversation = (userId) => {
  return knex('conversations')
      .whereNull('ended_at')
      .whereRaw('(first_user_id = ? OR second_user_id = ?)', [ userId, userId ])
      .first()
      .then(conversation => {
        if (conversation) {
          return null;
        } else {
          return knex('conversations')
              .whereNull('ended_at')
              .whereNull('second_user_id')
              .first()
              .then(conversation => {
                if (conversation) {
                  return knex('conversations')
                      .where('id', conversation['id'])
                      .update({
                        second_user_id: userId,
                        updated_at: knex.raw('NOW()')
                      })
                      .then(() => { return knex('conversations').where('id', conversation['id']).first(); });
                } else {
                  return knex('conversations')
                      .insert({
                        first_user_id: userId,
                        created_at: knex.raw('NOW()'),
                        updated_at: knex.raw('NOW()')
                      })
                      .then((ids) => {
                        return knex('conversations').where('id', ids[0]).first();
                  });
                }
              });
        }
      });
};

knex.endConversation = (userId) => {
  return knex.transaction(trx => {
    return trx('conversations')
        .forUpdate()
        .whereNull('ended_at')
        .whereNotNull('first_user_id')
        .whereNotNull('second_user_id')
        .whereRaw('(first_user_id = ? OR second_user_id = ?)', [userId, userId])
        .first()
        .then(conversation => {
          if (conversation) {
            return trx('conversations')
                .where('id', conversation['id'])
                .update({
                  ended_at: knex.raw('NOW()') ,
                  updated_at: knex.raw('NOW()')
                })
                .then(() => {
                  return trx('conversations')
                      .where('id', conversation['id'])
                      .first();
                });
          } else {
            return null;
          }
        });
  });
};

knex.getConversationFromUser = (userId) => {
  return knex('conversations')
      .whereNull('ended_at')
      .whereNotNull('first_user_id')
      .whereNotNull('second_user_id')
      .whereRaw('(first_user_id = ? OR second_user_id = ?)', [userId, userId])
      .first();
};

knex.getUser = (userId) => {
  return knex('users')
      .where('id', userId)
      .first();
};

knex.logMessage = (conversationId, userId, text) => {
  return knex('messages').insert({
    'conversation_id': conversationId,
    'user_id': userId,
    'text': text,
    'created_at': knex.raw('NOW()'),
    'updated_at': knex.raw('NOW()')
  });
};

module.exports = knex;

knex.migrate.latest([config]);
