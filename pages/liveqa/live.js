const Auth = require('../../utils/auth');

Page({
  data: {
    role: 0 // 0: audience, 1: host
  },

  // onLoad(options) {
  //   const user = Auth.getLocalUserInfo() || {attributes: {}};
  //   const role = user.attributes.wxUsername === 'Yujun' ? 1 : 0;
  //
  //   this.setData({
  //     role
  //   });
  //   console.log(`role: ${role}`);
  // },
  //
  onPusherStateChange(e) {
    console.log('on pusher state change e:');
    console.log(e);
  },

  onPusherNetStatus(e) {
    console.log('on pusher net status e:');
    console.log(e);
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
