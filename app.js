//app.js
const env = 'production';
//const env = 'dev';
const {reloadPage, showHint} = require('utils/util');

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

const AV = require('utils/av-weapp-min.js');
AV.init({
  appId: 'l7Ffw76ym9wuEsz4mUEJNcbS-gzGzoHsz',
  appKey: 'bp8ie0RFdBG9nHkGHpOknCMQ',
});

App({
  onShow(options) {
    const app = this,
          Auth = require('utils/auth');
    //console.log('app onShow options:', options);
    // for testing
    //options.shareTicket = '20071b2b-df8b-4422-8ed7-4ed9c1f7b526';
    if (options.shareTicket) {
      this.globalData.shareTicket = options.shareTicket;
    }

    console.log('app on show');
    // Auth.setLocalJWT(null);
    // Auth.setLocalUserInfo(null);

    const _afterLogin = () => {
      // Async fetch the user's subscribed topic ids
      getPage()
        //page.onLoad() do not work in the ios and android device
        //while working in the simulator
        //page.onLoad();
        .then(page => {
          reloadPage(page);
        });

      wx.showToast({title: '登陆成功'});
    };

    const _login = () => {
      Auth.login.call(app)
        .then(_afterLogin)
        .catch(err => {
          wx.showToast({
            title: '微信登陆出错了, 请稍后再试',
            duration: 3000,
            icon: 'loading'
          });
          wx.showModal({
            title: '出错了',
            content: JSON.stringify(err)
          });
          console.log('Auth.log err:', err);
        });
    };

    //检查storage里是否有userId，没有则请求
    const userInfo = Auth.getLocalUserInfo(),
          userAttrs = userInfo.attributes || {};
    if (!Auth.getLocalUserId() || !Auth.getLocalJWT() || !userAttrs.wxOpenId) {
      _login();
    } else if (env !== 'dev') {
      wx.checkSession({
        fail(err) {
          console.log('wx checkSession failed:', err);
          _login();
        }
      });
    }
  },

  globalData: {
    apiBase,
    env,
    appName: 'days7Xiaochengxu'
  }
})
