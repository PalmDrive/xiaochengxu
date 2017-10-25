//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request'),
  baseUrl = app.globalData.apiBase;
Page({
  data: {
    albums: null
  },

  onLoad: function (options) {
    request({
      url: `${baseUrl}/users/referees`,
      data: {
        productType: 'Album'
      }
    }).then(res => {
      this.setData({
        albums: res.data
      });
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
    this.onLoad({pullDown: true});
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
    return {
      title: '七日辑-免费得列表'
    };
  },

  gotoAlbum: function (event) {
    const album = event.currentTarget.dataset.album;
    wx.navigateTo({
      url: `../album/free?id=${album.id}&imgUrl=${album.attributes.picurl}`
    }); 
  }
});
