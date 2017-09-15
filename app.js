const _afterLogin = () => {
  const {getSubscribedTopicIds} = require('utils/topic');
  // Async fetch the user's subscribed topic ids
  getSubscribedTopicIds(Auth.getLocalUserId(), true);
};

//app.js
App({
  onLaunch: function() {
    const Auth = require('utils/auth');

    //检查storage里是否有userId，没有则请求
    if (!Auth.getLocalUserId()) Auth.login(_afterLogin, null, this);
  },

  getUserInfo: function(cb) {
    var that = this
    if (this.globalData.userInfo) {
      typeof cb == "function" && cb(this.globalData.userInfo)
    } else {
      //调用登录接口
      wx.getUserInfo({
        withCredentials: false,
        success: function(res) {
          that.globalData.userInfo = res.userInfo
          typeof cb == "function" && cb(that.globalData.userInfo)
        }
      })
    }
  },

  globalData: {
    userInfo: null,
    apiBase: 'https://ainterest-service-production.ailingual.cn/api/v1',
    // apiBase: 'https://ainterest-service-staging.ailingual.cn/api/v1',
    // apiBase: 'http://localhost:5000/api/v1',
  }
})
