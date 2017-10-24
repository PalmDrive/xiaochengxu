const nameSpace = 'qiriji_xiaochengxu';

const {request} = require('request');

const getLocalJWT = () => {
  return wx.getStorageSync(`${nameSpace}:jwt`);
};

const setLocalJWT = jwt => {
  wx.setStorageSync(`${nameSpace}:jwt`, jwt);
};

const getLocalUserInfo = () => {
  return wx.getStorageSync(`${nameSpace}:userInfo`) || {};
};

const setLocalUserInfo = userInfo => {
  wx.setStorageSync(`${nameSpace}:userInfo`, userInfo);
};

const getLocalUserId = () => {
  //return 'a16bf0b0-65f8-11e7-8bad-1f67fd9ef4e8';
  return getLocalUserInfo().id;
};

const setLocalSessionKey = sessionKey => {
  wx.setStorageSync(`${nameSpace}:sessionKey`, sessionKey);
};

const getLocalSessionKey = () => {
  return wx.getStorageSync(`${nameSpace}:sessionKey`);
};

const getLocalAchieve = (key) => {
  return wx.getStorageSync(`${nameSpace}:${key}`);
};

const setLocalAchieve = (key, hideAchieve) => {
  wx.setStorageSync(`${nameSpace}:${key}`, hideAchieve);
};

/**
 * Get code and send to the server
 * The server uses the code to get the basic info
 * @return {Promise}
 * {
 *   openid <string> 用户唯一标识
 *   session_key<string> 会话密钥
 *   unionid 用户在开放平台的唯一标识符。本字段在满足一定条件的情况下才返回。
 * }
 *
 * @notes: DO NOT use es6 =>, because the context 'this' needs to be passed
 */
const _getWechatBaseUserInfo = function() {
  const app = getApp() || this,
        apiBase = app.globalData.apiBase,
        name = 'days7';
  return new Promise((resolve, reject) => {
    // 获取登陆凭证code
    wx.login({
      success(res) {
        if (res.code) {
           //用code, 通过服务器获取session_key
          wx.request({
            url: `${apiBase}/wechat/xiaochengxu/on-login?from=miniProgram`,
            data: {
              code: res.code,
              name
            },
            success(res) {
              if (res.statusCode.toString()[0] !== '2') {
                console.log('Error in get base user info');
                reject(res.data);
              } else {
                console.log('base user data:', res.data);
                setLocalSessionKey(res.data.session_key);
                resolve(res.data);
              }
            },
            fail(err) {
              reject(err);
            }
          })
        } else {
          console.log('获取用户登录态失败: ', res.errMsg);
          reject(res.errMsg);
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
};

/**
 * @return {Promise} The resolved data is the data
 * from _loginRequest, which is the data from the login endpoint
 *
 * @notes: DO NOT use es6 =>, because the context 'this' needs to be passed
 */
const login = function() {
  const userInfo = {};
  let result = false;
  return _getWechatBaseUserInfo.call(this)
    .then(data => {
      userInfo.wxUnionId = data.unionid; // 不是所有用户都有
      userInfo.wxOpenId = data.openid;
      userInfo.clientPlatform = 'wechatMiniApplet';
      return new Promise((resolve, reject) => {
        // Ask user info
        wx.getUserInfo({
          success(res) {
            const fetchedUserInfo = res.userInfo;
            userInfo.wxUsername = fetchedUserInfo.nickName;
            userInfo.gender = fetchedUserInfo.gender;
            userInfo.profilePicUrl = fetchedUserInfo.avatarUrl;
            result = true;
          },
          fail(err) { // 用户没有授权获取用户信息
            console.log('用户没有授权获取用户信息');
            // reject(err);
          },
          complete() {
            console.log('getUserInfo complete called');
            if (result) {
              _loginRequest.call(this, userInfo)
                .then(resolve, reject);
            } else {
              openTip().then(r => {
                userInfo.wxUsername = r.wxUsername;
                userInfo.gender = r.gender;
                userInfo.profilePicUrl = r.profilePicUrl;
                _loginRequest.call(this, userInfo)
                  .then(resolve, reject);
              });
            }
          }
        })
      });
    });
};

const openTip = function() {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: '用户未授权',
      content: '如需正常使用小程序功能，请打开用户信息进行授权。',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定');
          openSetting().then(r => {
            resolve(r)
          })
        }
      }
    })
  });
}

const openSetting = function() {
  return new Promise((resolve, reject) => {
    wx.openSetting({
        success: (res) => {
          if (res.authSetting["scope.userInfo"]===true){
            const userInfo = {};
            let result = false;
            wx.getUserInfo({
              success(res) {
                const fetchedUserInfo = res.userInfo;
                userInfo.wxUsername = fetchedUserInfo.nickName;
                userInfo.gender = fetchedUserInfo.gender;
                userInfo.profilePicUrl = fetchedUserInfo.avatarUrl;
                result = true;
              },
              fail(err) { // 用户没有授权获取用户信息
                console.log('用户没有授权获取用户信息');
              },
              complete() {
                console.log('getUserInfo complete called');
                resolve(userInfo);
              }
            })
          }
          else{
            resolve(openTip());
          }
        }
      });
  });
}

/**
 * @param  String
 * @param  {
 *           wxUnionId
 *           wxUsername
 *           gender
 *           profilePicUrl
 *         }
 * @return {Promise} The resolved data is the data from the server
 *
 * @notes: DO NOT use es6 =>, because the context 'this' needs to be passed
 */
const _loginRequest = function(userInfo) {
  const app = getApp() || this,
        apiBase = app.globalData.apiBase;

  if (!userInfo.wxUnionId && !userInfo.wxOpenId) {
    return new Promise((resolve, reject) => reject('wxUnionId missing'));
  }

  return request({
    method: 'POST',
    url: `${apiBase}/users/login?from=miniProgram`,
    data: {
      data: {
        attributes: userInfo
      },
      meta: {
        loginType: 'wxUnionId'
      }
    }
  })
    .then(data => {
      const userId = data.data.id,
            jwt = data.data.accessToken;
      userInfo.role = data.data.attributes.role;
      console.log('userId:', userId);
      console.log('jwt:', jwt);
      setLocalJWT(jwt);
      setLocalUserInfo({
        id: userId,
        attributes: userInfo
      });
      return data.data;
    }, () => console.log('request /users/login fail'));
}

const decryptData = (encryptedData, iv, sessionKey) => {
  const app = getApp() || this,
        apiBase = app.globalData.apiBase;
  let promise = new Promise(resolve => resolve(sessionKey));
  if (!sessionKey) {
    promise = _getWechatBaseUserInfo()
      .then(data => data.session_key);
  }

  return promise
  .then(sessionKey => {
    return request({
      url: `${apiBase}/wechat/xiaochengxu/decrypt&name=days7`,
      data: {
        encryptedData,
        iv,
        sessionKey
      }
    });
  });
}

module.exports = {
  login,
  getLocalUserInfo,
  setLocalUserInfo,
  getLocalUserId,
  getLocalJWT,
  setLocalJWT,
  decryptData,
  getLocalSessionKey,
  getLocalAchieve,
  setLocalAchieve
};
