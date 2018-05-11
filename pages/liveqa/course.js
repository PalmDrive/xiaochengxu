const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

Page({
  data: {
    url: ''
  },

  onLoad(options) {
    wx.setNavigationBarTitle({title: '集思学院课程详情'});
    const url =
    `http://www.gecacademy.cn/#/chip?id=${options.courseId}`;
    console.log('web url:', url);

    this.setData({
      url
    });
  }
})
