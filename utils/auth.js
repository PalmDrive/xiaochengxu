const nameSpace = 'zdk_xiaochengxu';

const {request} = require('request');

const getLocalJWT = () => {
  return wx.getStorageSync(`${nameSpace}:jwt`);
};

const setLocalJWT = jwt => {
  wx.setStorageSync(`${nameSpace}:jwt`, jwt);
};

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

// page is the page obj
const login = (cb, page, app) => {
  if (!app) app = getApp();
  const apiBase = app.globalData.apiBase;
  
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
                    loginRequest(apiBase, {
                      wxUnionId: userInfo.unionId,
                      wxUsername: userInfo.nickName,
                      gender: userInfo.gender,
                      profilePicUrl: userInfo.avatarUrl
                    }, page)
                      .then(cb);
                  },
                  fail() {
                    console.log('request wechat/xiaochengxu/decrypt fail');
                  }
                });
              },
              fail() {
                loginRequest(apiBase, {
                  wxUnionId: res.data.unionid
                }, cb, page);
              }
            });
          },
          fail(e) {
            console.log('request "wechat/xiaochengxu/on-login" fail');
            console.log(e);
          }
        });
      } else {
        console.log('获取用户登录态失败！' + res.errMsg);
      }
    },
    fail() { console.log('wx.login fail'); }
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
 */
const loginRequest = (apiBase, data, page) => {
  return request({
    method: 'POST',
    url: `${apiBase}/users/login?from=miniProgram`,
    data: {
      data: {
        attributes: data
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
      setLocalUserId(userId);
      setLocalJWT(jwt);
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
  setLocalUserId,
  getLocalJWT,
  setLocalJWT
};