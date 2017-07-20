// pages/read/read.js
const app = getApp(),
      util = require('../../utils/util'),
      Auth = require('../../utils/auth');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    media: [],
    loading: false,
    loadingMore: false,
    pageNumber: 1
  },
  //点击文章
  goToMedium: util.goToMedium,
  //加载更多
  loadMore() {
    const that = this;
    if (!that.data.loadingMore) {
      console.log('loadMore');
      that.setData({loadingMore: true});
      //获取推荐文章
      wx.request({
        url: `${app.globalData.apiBase}/media/feeds2?userId=${Auth.getLocalUserId()}&subscribed=false`,
        success(res) {
          const media = res.data.data;
          media.forEach(util.formatMedium);
          that.setData({
            media: that.data.media.concat(media),
            loadingMore: false
          });
        },
        fail(res) {
          console.log('request recommended media fail');
        }
      });
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this;
    //获取推荐文章
    that.setData({loading: true});
    wx.request({
      url: `${app.globalData.apiBase}/media/feeds2?userId=${Auth.getLocalUserId()}&subscribed=false`,
      success(res) {
        const media = res.data.data;
        media.forEach(util.formatMedium);
        that.setData({
          media,
          loading: false
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