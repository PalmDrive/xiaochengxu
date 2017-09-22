const Auth = require('../../utils/auth');

Page({
  data: {
    markers: [],
    size: {},
    location: {}
  },
  onLoad() {
    const user = Auth.getLocalUserInfo(),
          userInfo = user.attributes || {},
          that = this;

    wx.getLocation({
      type: 'gcj02',
      success(res) {
        const marker = {
          longitude: res.longitude,
          latitude: res.latitude,
          title: userInfo.wxUsername,
          iconPath: '/images/icon.png',
          width: 60,
          height: 60,
          //iconPath: userInfo.profilePicUrl,
          label: {
            x: 0,
            y: 0,
            fontSize: 12,
            content: userInfo.wxUsername
          }
        };

        that.setData({
          markers: [marker],
          location: {
            longitude: res.longitude,
            latitude: res.latitude
          }
        });
      }
    });
  }
});