
const Auth = require('../../utils/auth');

Page({
  data: {
    hidden: true
  },

  onShow() {
  },

  onReady() {
  },

  onLoad(options) {
    options = options || {};

    if (options.scene) {
      options.friendId = decodeURIComponent(options.scene);
    }

    this.setData({
      friendId: options.friendId || '59ce3d20a22b9d0061312243'
    })

    if (wx.getStorageSync('dazhaxiePageHasShow') && !options.initiative) {
      this.gotoMap();
    } else {
      this.setData({
        hidden: false
      });
      wx.setNavigationBarTitle({ title: '召集吃货抢大闸蟹啦'})
    }
  },

  gotoMap() {
    wx.setStorage({
      key: 'dazhaxiePageHasShow',
      data: true
    })
    wx.redirectTo({
      url: `/pages/map/map?friendId=${this.data.friendId}`
    });
  },

  clearStorage() {
    wx.setStorage({
      key: 'dazhaxiePageHasShow',
      data: false,
      success: () => {
        wx.showToast({
          title: '数据清除成功'
        })
      }
    })
  },

  onShareAppMessage(options) {
    return {
      title: `${Auth.getLocalUserInfo().attributes.wxUsername}正在抢大闸蟹礼券，快来帮Ta吧`,
      imageUrl: 'https://ailingual-production.oss-cn-shanghai.aliyuncs.com/pics/%E4%B8%83%E6%97%A5%E8%BE%91/dazhaxie_shar.png',
      path: `/pages/map/dazhaxie?friendId=${Auth.getLocalUserId()}&from=mapsession`
    }
  }
});