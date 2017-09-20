// utils/topic.js
const app = getApp();

let _subscribedTopicIds = null;

function subscribe(userId, topicId, isForGroup) {
  return request({
    method: 'POST',
    url: `${app.globalData.apiBase}/topics/${topicId}/subscribe?from=miniProgram`,
    data: {
      data: {
        attributes: { userId }
      },
      meta: {
        action: 'subscribeTopic'
      }
    }
  }).then((res) => {
    // Update _subscribedTopicIds
    if (!isForGroup) {
      _subscribedTopicIds.push(topicId);
    }
    
    return res;
  }, (res) => {
    console.log('Topic.subscribe fail');
    return res;
  });
}
function unsubscribe(userId, topicId, isForGroup) {
  return request({
      method: 'POST',
      url: `${app.globalData.apiBase}/topics/${topicId}/unsubscribe?from=miniProgram`,
      data: {
        data: {
          attributes: { userId }
        },
        meta: {
          action: 'unsubscribeTopic'
        }
      }
    }).then((res) => {
      if (!isForGroup) {
        // update _subscribedTopicIds
        _subscribedTopicIds = _subscribedTopicIds.filter(id => id !== topicId);
      }
      
      return res;
    }, (res) => {
      console.log('Topic.unsubscribe fail');
      return res;
    });
}

function getGroupSubscribedTopicIds(groupId) {
  const url = `${app.globalData.apiBase}/users/${groupId}/favorite-topic-ids?from=miniProgram`;
  return request({
          url
        }).then((res) => {
          return res.data
        }, (res) => {
          reject(res);
        });
}

function getSubscribedTopicIds(userId, force) {
  if (force || !_subscribedTopicIds) {
    const url = `${app.globalData.apiBase}/users/${userId}/favorite-topic-ids?from=miniProgram`;
    return request({
            url
          }).then((res) => {
            _subscribedTopicIds = res.data || [];
            return _subscribedTopicIds;
          }, (res) => {
            return res;
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