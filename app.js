//app.js
const Auth = require('utils/auth');

App({
  onLaunch: function() {
    console.log('app on launch');
    const that = this;
    //检查storage里是否有userInfo，没有则请求
    if (Auth.getLocalUserInfo() && Auth.getLocalUserId()) {
      console.log('found local user');
      this.globalData.userInfo = Auth.getLocalUserInfo();
      this.globalData.userId = Auth.getLocalUserId();
    } else {
      wx.login({
        success(res) {
          if (res.code) {
            //发起网络请求
            wx.request({
              url: `${that.globalData.apiBase}/wechat/xiaochengxu/on-login`,
              data: {
                code: res.code
              },
              success(res) {
                const sessionKey = res.data['session_key'];

                if (!sessionKey) {
                  return console.log('get session key fail');
                }
                // call wx.getUserInfo, send sessionKey, encryptedData and iv to get complete userInfo,
                // save to globalData
                wx.getUserInfo({
                  withCredentials: true,
                  success(res) {
                    wx.request({
                      url: `${that.globalData.apiBase}/wechat/xiaochengxu/decrypt`,
                      data: {
                        encryptedData: res.encryptedData,
                        iv: res.iv,
                        sessionKey
                      },
                      success(res) {
                        const userInfo = res.data.userInfo;
                        that.globalData.userInfo = userInfo;
                        Auth.setLocalUserInfo(userInfo);
                        console.log('get userInfo success');
                        console.log(userInfo);
                        //获取userId
                        if (!userInfo.unionId) {
                          return console.log('userInfo does not have unionId');
                        }
                        wx.request({
                          method: 'POST',
                          url: `${that.globalData.apiBase}/users/login`,
                          data: {
                            data: {
                              attributes: {
                                wxUnionId: userInfo.unionId,
                                wxUsername: userInfo.nickName,
                                gender: userInfo.gender,
                                profilePicUrl: userInfo.avatarUrl
                              }
                            },
                            meta: {
                              loginType: 'wxUnionId'
                            }
                          },
                          success(res) {
                            const userId = res.data.data.id;
                            console.log('userId:', userId);
                            Auth.setLocalUserId(userId);
                          },
                          fail() {
                            console.log('request /users/login fail');
                          }
                        });
                      },
                      fail() {
                        console.log('request wechat/xiaochengxu/decrypt fail');
                      }
                    });
                  }
                });
              },
              fail(e) {
                console.log('request "wechat/xiaochengxu/on-login" fail');
                console.log(e);
              }
            })
          } else {
            console.log('获取用户登录态失败！' + res.errMsg)
          }
        },
        fail() { console.log('wx.login fail'); }
      });
    }
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
    userId: null,
    apiBase: 'https://ainterest-service-production.ailingual.cn/api/v1'
  }
})
