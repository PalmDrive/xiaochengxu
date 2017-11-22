const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase,
    {addAlbumId, getSurveyAndAnswers} = require('../../utils/user'),
    User = require('../../utils/user');

let albumId = undefined;

Page({
  data: {
    sumUp: '一堆技能',
    userInfo: {},
    questions: [],
    answers: []
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    })
    albumId = options.albumId;

    this.setData({sumUp: options.sumUp, userInfo: Auth.getLocalUserInfo()});

    // 加载filter 问题及答案
    User.getFilterQuestions(albumId, false).then(res => {
      this.setData({...res});
    });
  }
})
