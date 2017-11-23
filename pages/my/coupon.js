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
onLoad: function () {
  this.setData({
    selectedId: this.getPrevPageCouponIndex()
  });
  this.findCoupon().then(res => {
    console.log(res);
  });
},
findCoupon: function () {
  return request({
    url: `${baseUrl}/user-coupons`,
    method: 'GET'
  }).then(res => {
    const coupons = {};
    res.included.map(c => {
      if (c.type = 'Coupons') {
        coupons[c.id] = c;
      }
    });
    const couponsData = res.data.map(d => {
      return {
        couponId: coupons[d.relationships.coupon.data.id].id,
        userCouponId: d.id,
        quota: coupons[d.relationships.coupon.data.id].attributes.value,
        name: d.attributes.displayName,
        validityTerm: `有效期至${this._formatDateToDay(new Date(coupons[d.relationships.coupon.data.id].attributes.expiredAt))}`,
        range: coupons[d.relationships.coupon.data.id].attributes.albumId ? `仅限购买“${coupons[d.relationships.coupon.data.id].attributes.albumTitle}”` : `全场通用，最高折扣${coupons[d.relationships.coupon.data.id].attributes.value/100}元`,
        redeemedAt: d.attributes.redeemedAt
      }
    });
    this.setData({
      coupons: couponsData
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
/**
 * @return 'xxxx年x月x日'
 */
_formatDateToDay(date) {
  const year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate();
  return year + '-' + month + '-' + day;
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
},
// 接受coupon
acceptCoupon(couponId) {
  return request({
    url: `${baseUrl}/user-coupons/${couponId}/accept`,
    method: 'POST'
  });
},
// 赠送coupon
giftCoupon(couponId) {
  return request({
    url: `${baseUrl}/user-coupons/${couponId}/gift`,
    method: 'POST'
  });
},
// 下拉刷新
onPullDownRefresh() {
  this.findCoupon().then(res => {
    wx.stopPullDownRefresh();
  });
},
});
