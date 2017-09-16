//app.js
const env = 'production';
//const env = 'dev';

const API_BASES = {
  production: 'https://ainterest-service-production.ailingual.cn/api/v1',
  staging: 'https://ainterest-service-staging.ailingual.cn/api/v1',
  dev: 'http://localhost:5000/api/v1'
};

const apiBase = API_BASES[env];

App({
  onShow() {
    const Auth = require('utils/auth');

    //console.log('app on show');
    Auth.setLocalJWT(null);
    Auth.setLocalUserInfo(null);

    const _afterLogin = () => {
      const {getSubscribedTopicIds} = require('utils/topic');
      // Async fetch the user's subscribed topic ids
      getSubscribedTopicIds(Auth.getLocalUserId(), true);
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
