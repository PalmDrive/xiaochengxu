const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;
    
Page({
  data: {
    id: null,
    imgUrl: null,
    users: null
  },
  onLoad(options) {
    this.setData({
      imgUrl: options.imgUrl,
      id: options.id
    });
    request({
      url: `${baseUrl}/users/referees`,
      data: {
        productId: options.id,
        productType: 'Album'
      }
    }).then(res => {
      this.setData({
        users: res.data
      });
    });
  },
  _gotoShare() {
    wx.navigateTo({
      url: `../album/share?id=${this.data.id}`
    });
  }
});
