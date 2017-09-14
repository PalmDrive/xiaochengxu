const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth');
Page({
  data: {},

  onLoad: function (options) {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '我的群头条'
    };
  }
});