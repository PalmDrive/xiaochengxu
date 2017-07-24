const apiBase = 'https://ainterest-service-production.ailingual.cn/api/v1';
const nameSpace = 'zdk_xiaochengxu';

const getLocalUserInfo = () => {
  return wx.getStorageSync(`${nameSpace}:userInfo`);
};

const setLocalUserInfo = userInfo => {
  wx.setStorageSync(`${nameSpace}:userInfo`, userInfo);
};

const getLocalUserId = () => {
  return wx.getStorageSync(`${nameSpace}:userId`);
};

const setLocalUserId = userId => {
  wx.setStorageSync(`${nameSpace}:userId`, userId);
};

const login = cb => {
  wx.login({
    success(res) {
      if (res.code) {
        //发起网络请求
        wx.request({
          url: `${apiBase}/wechat/xiaochengxu/on-login`,
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
                  url: `${apiBase}/wechat/xiaochengxu/decrypt`,
                  data: {
                    encryptedData: res.encryptedData,
                    iv: res.iv,
                    sessionKey
                  },
                  success(res) {
                    const userInfo = res.data.userInfo;
                    setLocalUserInfo(userInfo);
                    console.log('get userInfo success');
                    console.log(userInfo);
                    //获取userId
                    if (!userInfo.unionId) {
                      return console.log('userInfo does not have unionId');
                    }
                    wx.request({
                      method: 'POST',
                      url: `${apiBase}/users/login`,
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
                        setLocalUserId(userId);
                        cb();
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
};

module.exports = {
  login,
  getLocalUserInfo,
  setLocalUserInfo,
  getLocalUserId,
  setLocalUserId
};