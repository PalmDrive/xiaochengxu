// pages/read/read.js
const app = getApp(),
      util = require('../../utils/util');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    media: []
  },

  goToMedium: util.goToMedium,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this;
    //获取推荐文章
    wx.request({
      url: `${app.globalData.apiBase}/media/351d8540-6940-11e7-82a5-bf71cd1429e6/related-media`,
      success(res) {
        const media = res.data.data;
        media.forEach(util.formatMedium);
        that.setData({
          media
        });
      },
      fail(res) {
        console.log('request recommended media fail');
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})