//app.js
const env = 'production';
//const env = 'dev';

const API_BASES = {
  production: 'https://ainterest-service-production.ailingual.cn/api/v1',
  staging: 'https://ainterest-service-staging.ailingual.cn/api/v1',
  dev: 'http://localhost:5000/api/v1'
};

const apiBase = API_BASES[env];

const getPage = () => {
  let _page;

  return new Promise((resolve, reject) => {
    const handle = setInterval(() => {
      _page = getCurrentPages()[0];
      if (_page) {
        clearInterval(handle);
        console.log('interval cleared.');
        resolve(_page);
      }
    }, 250);
  });
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

App({
  onShow() {
    const Auth = require('utils/auth');

    //console.log('app on show');
    // Auth.setLocalJWT(null);
    // Auth.setLocalUserInfo(null);

    const _afterLogin = () => {
      const {getSubscribedTopicIds} = require('utils/topic');
      // Async fetch the user's subscribed topic ids
      getSubscribedTopicIds(Auth.getLocalUserId(), true);
      getPage()
        .then(_initPage);     
    };

    //检查storage里是否有userId，没有则请求
    if (!Auth.getLocalUserId() || !Auth.getLocalJWT()) {
      Auth.login.call(this)
        .then(_afterLogin, err => {
          console.log('auth.login err:', err);
        });
    }
  },

  globalData: {
    apiBase
  }
})
