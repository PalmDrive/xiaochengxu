const nameSpace = 'zdk_xiaochengxu';

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
  return getLocalUserInfo().id;
};

const _initPage = page => {
  page.onLoad();
  const systemInfo = wx.getSystemInfoSync();
  let title, content;
  if (systemInfo.platform === 'ios') {
    title = 'iOS用户福利';
    content = 'App Store中下载“职得看”，获得更好体验。';
  } else {
    title = '小程序Tips';
    content = '点击右上角按钮，选择“添加到桌面”，可随时访问。';
  }
  page.setData({
    showHint: true,
    firstLoginHint: {title, content}
  });
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
        apiBase = app.globalData.apiBase;
  return new Promise((resolve, reject) => {
    // 获取登陆凭证code
    wx.login({ 
      success(res) { 
        if (res.code) {
           //用code, 通过服务器获取session_key
          wx.request({
            url: `${apiBase}/wechat/xiaochengxu/on-login?from=miniProgram`,
            data: {
              code: res.code
            },
            success(res) {
              resolve(res.data);
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
const login = function(page) {
  const userInfo = {};
  return _getWechatBaseUserInfo.call(this)
    .then(data => {
      userInfo.wxUnionId = data.unionid;
      return new Promise((resolve, reject) => {
        // Ask user info
        wx.getUserInfo({
          success(res) {
            const fetchedUserInfo = res.userInfo;
            userInfo.wxUsername = fetchedUserInfo.nickName;
            userInfo.gender = fetchedUserInfo.gender;
            userInfo.profilePicUrl = fetchedUserInfo.avatarUrl;
          },
          fail(err) { // 用户没有授权获取用户信息
            console.log('用户没有授权获取用户信息');
            reject(err);
          },
          complete() {
            console.log('getUserInfo complete called');
            _loginRequest.call(this, userInfo, page)
              .then(resolve, reject);
          }
        })
      });
    });
};
/**
 * @param  String
 * @param  {
 *           wxUnionId 
 *           wxUsername
 *           gender
 *           profilePicUrl
 *         }
 * @param  {Function}
 * @param  {Page}
 * @return {Promise} The resolved data is the data from the server
 * 
 * @notes: DO NOT use es6 =>, because the context 'this' needs to be passed
 */
const _loginRequest = function(userInfo, page) {
  const app = getApp() || this,
        apiBase = app.globalData.apiBase;
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
      console.log('userId:', userId);
      console.log('jwt:', jwt);
      //setLocalUserId(userId);
      setLocalJWT(jwt);
      setLocalUserInfo({
        id: userId,
        attributes: userInfo
      });
      !page && (page = getCurrentPages()[0]);
      if (page) {
        _initPage(page);
      }
      return data.data;
    }, () => console.log('request /users/login fail'));
}

module.exports = {
  login,
  getLocalUserInfo,
  setLocalUserInfo,
  getLocalUserId,
  getLocalJWT,
  setLocalJWT
};