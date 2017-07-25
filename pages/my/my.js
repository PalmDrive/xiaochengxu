//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth');
Page({
  data: {
    userInfo: {},
    userId: null,
    loading: true,
    favoriteTopics: []
  },
  //事件处理函数
  goToTopic: Util.goToTopic,

  onLoad: function () {
    const that = this;
    //检查storage里是否有需要的数据，没有则请求
    if (Auth.getLocalUserId() && Auth.getLocalUserInfo()) {
      init();
    } else {
      Auth.login(init);
    }

    function init() {
      const userId = Auth.getLocalUserId();

      wx.request({
        url: `${app.globalData.apiBase}/users/${userId}/favorite-topics`,
        success(res) {
          const topics = res.data.data;
          const userTopics = res.data.included;
          topics.forEach(Util.formatTopic);
          that.setData({
            loading: false,
            userInfo: Auth.getLocalUserInfo(),
            userId,
            favoriteTopics: topics
          });
        },
        fail() {
          console.log('request /users/:id/favorite-topics fail');
        }
      });
    }
  }
})
