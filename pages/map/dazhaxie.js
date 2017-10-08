
Page({
  data: {
  },

  onShow() {
  },

  onReady() {
    wx.setNavigationBarTitle({ title: '召集吃货抢大闸蟹啦'})
  },

  onLoad(options) {
    if (wx.getStorageSync('dazhaxiePageHasShow')) {
      wx.switchTab({
        url: `/pages/groups/groups`
      });
    } else {
      wx.setStorage({
        key: 'dazhaxiePageHasShow',
        data: true
      })
    }
  },

  gotoMap() {
    wx.navigateTo({
      url: `/pages/map/map`
    });
  },

  onShareAppMessage(options) {
    return {
      title: '召集吃货抢大闸蟹啦',
      imageUrl: 'https://ailingual-production.oss-cn-shanghai.aliyuncs.com/pics/%E4%B8%83%E6%97%A5%E8%BE%91/dazhaxie_shar.png'
    }
  }
});