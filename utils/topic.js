// utils/topic.js
const app = getApp();

function subscribe(userId, topicId, cb) {
  wx.request({
    method: 'POST',
    url: `${app.globalData.apiBase}/topics/${topicId}/subscribe`,
    data: {
      data: {
        attributes: { userId }
      },
      meta: {
        action: 'subscribeTopic'
      }
    },
    success(res) {
      cb(res);
    },
    fail() {
      console.log('Topic.subscribe fail');
    }
  });
}

function unsubscribe(userId, topicId, cb) {
  wx.request({
    method: 'POST',
    url: `${app.globalData.apiBase}/topics/${topicId}/unsubscribe`,
    data: {
      data: {
        attributes: { userId }
      },
      meta: {
        action: 'unsubscribeTopic'
      }
    },
    success(res) {
      cb(res);
    },
    fail() {
      console.log('Topic.unsubscribe fail');
    }
  });
}

module.exports = {
  subscribe,
  unsubscribe
};