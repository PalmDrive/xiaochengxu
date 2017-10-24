//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request'),
  baseUrl = app.globalData.apiBase;

Page({
  data: {
    coupons: [{
      quota: '￥49',
      name: '七日辑折扣券',
      validityTerm: '有效期至2017-12-12',
      range: '全场通用，最高折扣50元',
    },{
      quota: '￥49',
      name: '七日辑折扣券',
      validityTerm: '有效期至2017-12-12',
      range: '全场通用，最高折扣50元',
    }]
  },
  onLoad: function () {
    this.findCoupon().then(res => {
      console.log(res);
    });
  },
  findCoupon: function () {
    return request({
      url: `${baseUrl}/user-coupons`,
      method: 'GET'
    }).then(res => {
      this.setData({
        coupons: res.data
      });
      return res.data;
    });
  },
  // 
  getCoupon: function () {
    return request({
      url: `${baseUrl}/user-coupons`,
      method: 'POST',
      data: {
        data: {
          attributes: {
            ownerId: Auth.getLocalUserId(),
            couponId: '1',
          }
        },
      }
    });
  }
});
