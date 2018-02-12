const Auth = require('../../utils/auth'),
      {request} = require('../../utils/request'),
      app = getApp();

Page({
  data: {
    role: 0, // 0: audience, 1: host
    url: null
  },

  onLoad(options) {
    const user = Auth.getLocalUserInfo();
    const role = user.attributes.wxUsername === 'Yujun' ? 1 : 0,
          roleToType = {
            0: 'player',
            1: 'pusher'
          };

    this._getLiveUrl(roleToType[role])
      .then(url => {
        console.log(`role: ${role}`);
        console.log(`url: ${url}`);
        
        this.setData({
          role, url
        });
      });
  },

  _getLiveUrl(type) {
    return request({
      url: `${app.globalData.apiBase}/gec/live-url?type=${type}`
    })
      .then(res => res.data.url);
  },

  onPusherStateChange(e) {
    console.log('on pusher state change:');
    console.log(e.detail);
  },

  onPusherNetStatus(e) {
    console.log('on pusher net status:');
    console.log(e.detail);
  },

  onPlayerStateChange(e) {
    console.log('on player state change e:');
    console.log(e);
  },

  onPlayerNetStatus(e) {
    console.log('on player net status e:');
    console.log(e);
  }
});
