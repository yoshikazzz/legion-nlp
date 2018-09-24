const express = require('express');
const line = require('@line/bot-sdk');

const db = require('./db');

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(lineConfig);

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text' || event.source.type !== 'user') {
    return Promise.resolve(null);
  }

  return db.getOrCreateUserIdFromLineUserId(event.source.userId).then((userId) => {
    if (event.message.text == "/begin") {
      return db.beginConversation(userId).then(conversation => {
        if (conversation) {
          if (conversation['second_user_id']) {
            return Promise.all(
                [ conversation.first_user_id, conversation.second_user_id ]
                    .map((userId) => {
                      return db.getUser(userId).then((user) => {
                        return client.pushMessage(user['lineUserId'], [
                          {
                            'type': 'text',
                            'text': '会話を開始しました'
                          }
                        ]);
                      })
                    }));
          } else {
            return db.getUser(userId).then((user) => {
              return client.pushMessage(user['lineUserId'], [
                {
                  'type': 'text',
                  'text': '会話相手を待っています'
                }
              ]);
            })
          }
        } else {
          return db.getUser(userId).then((user) => {
            return client.pushMessage(user['lineUserId'], [
              {
                'type': 'text',
                'text': '会話中です'
              }
            ]);
          })
        }
      });
    } else if (event.message.text == "/end") {
      return db.endConversation(userId).then(conversation => {
        if (conversation) {
          return Promise.all(
              [ conversation.first_user_id, conversation.second_user_id ]
                  .map((userId) => {
                    return db.getUser(userId).then((user) => {
                      return client.pushMessage(user['lineUserId'], [
                        {
                          'type': 'text',
                          'text': '会話を終了しました'
                        }
                      ]);
                    })
              }));
        } else {
          return db.getUser(userId).then((user) => {
            return client.pushMessage(user['lineUserId'], [
              {
                'type': 'text',
                'text': '会話中ではありません'
              }
            ]);
          });
        }
      });
    } else {
      return db.getConversationFromUser(userId).then((conversation) => {
        if (conversation) {
          return db.logMessage(conversation['id'], userId, event.message.text).then(() => {
            const oppositeUserId = conversation['first_user_id'] == userId ? conversation['second_user_id'] : conversation['first_user_id'];

            return db.getUser(oppositeUserId).then((user) => {
              return client.pushMessage(user['lineUserId'], [
                {
                  'type': 'text',
                  'text': event.message.text
                }
              ]);
            });
          });
        } else {
          return Promise.resolve(null);
        }
      });
    }
  });

}

app.listen(8081);
