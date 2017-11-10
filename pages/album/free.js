const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

Page({
  data: {
    id: null,
    imgUrl: null,
    users: null,
    referralRules: []
  },
  onLoad(options) {
    this.setData({
      imgUrl: options.imgUrl,
      id: options.id
    });
    this.loadReferees();
  },
  loadReferees() {
    return request({
      url: `${baseUrl}/users/referees`,
      data: {
        productId: this.data.id,
        productType: 'Album'
      }
    }).then(res => {
      const referralRulesData = res.included.filter(el => el.type === 'referralRules')[0];
      this.setData({
        users: res.data,
        referralRules: referralRulesData.attributes.referralRules
      });
    });
  },
  _gotoShare() {
    wx.navigateTo({
      url: `../album/share?id=${this.data.id}`
    });
  },
  // 下拉刷新
  onPullDownRefresh() {
    loadReferees().then(res => {
      wx.stopPullDownRefresh();
    });
  }
});
