const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

Page({
  data: {
    url: ''
  },

  onShow: function () {
    console.log('on show')
    const paySuccessUrl = getApp().globalData.paySuccessUrl
    getApp().globalData.paySuccessUrl=''
    if (paySuccessUrl) {
      this.setData({
        url: paySuccessUrl
      })
    }
  },

  onLoad(options) {
    wx.setNavigationBarTitle({title: '集思学院课程详情'});
    // wx.navigateTo({url: `/pages/liveqa/pay?orderId=1526437080dr3dk6ac1vxdho94fgvi`});
    this.setData({
      url: `https://www.gecacademy.cn/#/chip?id=${options.courseId}`
    });
  }
})
