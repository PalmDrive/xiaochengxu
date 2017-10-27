//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request'),
  baseUrl = app.globalData.apiBase;

Page({
  data: {
    selectedId: -1,
    coupons: null
  },
  onLoad: function (options) {
    this.setData({
      coupons: JSON.parse(options.coupons),
      selectedId: this.getPrevPageCouponIndex()
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
            couponIndex: '1',
          }
        },
      }
    });
  },
  // 选择coupon
  choiceCoupon: function (event) {
    const couponIndex = event.currentTarget.dataset.selectedid;
    this.setPrevPageCouponIndex(couponIndex);
    this.setData({
      selectedId: couponIndex
    });
  },
  setPrevPageCouponIndex(couponIndex) {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    console.log(this.data.coupons[couponIndex]);
    prevPage.setData({
      couponIndex: couponIndex,
      coupon: this.data.coupons[couponIndex] || null
    });
  },
  getPrevPageCouponIndex() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    return prevPage.data.couponIndex;
  }
});
