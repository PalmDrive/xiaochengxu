//app.js
const env = 'production';
//const env = 'dev';

const API_BASES = {
  production: 'https://ainterest-service-production.ailingual.cn/api/v1',
  staging: 'https://ainterest-service-staging.ailingual.cn/api/v1',
  dev: 'http://localhost:5000/api/v1'
};

App({
  onLaunch: function() {
    const Auth = require('utils/auth');

    const _afterLogin = () => {
      const {getSubscribedTopicIds} = require('utils/topic');
      // Async fetch the user's subscribed topic ids
      getSubscribedTopicIds(Auth.getLocalUserId(), true);
    };

    //检查storage里是否有userId，没有则请求
    if (!Auth.getLocalUserId() || !Auth.getLocalJWT()) Auth.login(_afterLogin, null, this);
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
    apiBase: API_BASES[env],
  }
})
