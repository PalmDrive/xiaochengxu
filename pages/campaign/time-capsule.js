const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    graphql = require('../../utils/graphql'),
    _ = require('../../vendors/underscore');

Page({
  data: {
    date: util.formatDateToDay(new Date())
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#000000'
    });

    wx.setNavigationBarTitle({
      title: '时间胶囊'
    });
  },

  onShow() {
    // Auth.getLocalUserId();
  },

  addCapsule: function(event) {
    const date = event.detail.value.replace(/-/g, "/");
    const days = util.getDays((new Date()), (new Date(date)));

    if (days > 0) {
      wx.showModal({
        title: '提示',
        content: '解封时间不能选择过去的时间哦',
        confirmText: '我知道了',
        success: function(res) {
          if (res.confirm) {
            console.log('用户点击确定')
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
      return;
    }

    wx.navigateTo({
      url: `./create-capsule?openAt=${date}`
    });
  }
})
