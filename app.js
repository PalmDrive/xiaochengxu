//app.js
const Auth = require('utils/auth');

App({
  onLaunch: function() {
    console.log('app on launch');
    // console.log(wx.getSystemInfoSync());
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
    apiBase: 'https://ainterest-service-production.ailingual.cn/api/v1'
  }
})
