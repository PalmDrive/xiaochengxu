const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

Page({
  data: {
    message: '支付中'
  },

  onLoad(options) {
    wx.setNavigationBarTitle({title: '支付中'});
    getApp().globalData.paySuccessUrl = `https://www.gecacademy.cn/#/success?orderId=${options.orderId}`
    // wx.navigateBack();
    const params = {
      timeStamp: options.timeStamp,
      nonceStr: options.nonceStr,
      package: `prepay_id=${options.prepay_id}`,
      signType: 'MD5',
      paySign: options.paySign
    };

    params.success = (res) => {
      console.log('wx requestPayment success');
      console.log(res);
      this.setData({
        message: '支付成功'
      });
      wx.navigateBack();
    };
    params.fail = (err) => {
      console.log('wx requestPayment fail');
      console.log(err);
    };
    params.complete = () => {
      console.log('wx requestPayment complete');
    };
    wx.requestPayment(params);
  }
});
