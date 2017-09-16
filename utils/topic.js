// utils/topic.js
const app = getApp();

let _subscribedTopicIds = null;

function subscribe(userId, topicId, isForGroup) {
  return new Promise((resolve, reject) => {
    wx.request({
      method: 'POST',
      url: `${app.globalData.apiBase}/topics/${topicId}/subscribe?from=miniProgram`,
      data: {
        data: {
          attributes: { userId }
        },
        meta: {
          action: 'subscribeTopic'
        }
      },
      success(res) {
        // Update _subscribedTopicIds
        if (!isForGroup) {
          _subscribedTopicIds.push(topicId);
        }
        
        resolve(res);
      },
      fail(res) {
        console.log('Topic.subscribe fail');
        reject(res);
      }
    });
  })
}

function unsubscribe(userId, topicId, isForGroup) {
  return new Promise((resolve, reject) => {
    wx.request({
      method: 'POST',
      url: `${app.globalData.apiBase}/topics/${topicId}/unsubscribe?from=miniProgram`,
      data: {
        data: {
          attributes: { userId }
        },
        meta: {
          action: 'unsubscribeTopic'
        }
      },
      success(res) {
        if (!isForGroup) {
          // update _subscribedTopicIds
          _subscribedTopicIds = _subscribedTopicIds.filter(id => id !== topicId);
        }
        
        resolve(res);
      },
      fail(res) {
        console.log('Topic.unsubscribe fail');
        reject(res);
      }
    });
  });
}

function getGroupSubscribedTopicIds(groupId) {
  const url = `${app.globalData.apiBase}/users/${groupId}/favorite-topic-ids?from=miniProgram`;
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      success(res) {
        resolve(res.data.data);
      },
      fail(res) {
        reject(res);
      }
    });
  });
}

function getSubscribedTopicIds(userId, force) {
  if (force || !_subscribedTopicIds) {
    const url = `${app.globalData.apiBase}/users/${userId}/favorite-topic-ids?from=miniProgram`;
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success(res) {
          _subscribedTopicIds = res.data.data || [];
          resolve(_subscribedTopicIds);
        },
        fail(res) {
          reject(res);
        }
      });
    });
  } else {
    // return data from the cache
    return new Promise((resolve, reject) => {
      resolve(_subscribedTopicIds);
    });
  }
}


module.exports = {
  subscribe,
  unsubscribe,
  getSubscribedTopicIds,
  getGroupSubscribedTopicIds
};