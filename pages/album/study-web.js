const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase,
    User = require('../../utils/user');

Page({
  data: {
    url: ''
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    });

    const url = `https://ainterest.ailingual.cn/posts/${options.postId}?albumId=${options.albumId}&userId=${Auth.getLocalUserId()}&viewedMediumCount=${options.viewedMediumCount}`;

    console.log('web url:', url);

    this.setData({
      url
    });
  }
})
