//index.js
//获取应用实例
var app = getApp(),
    util = require('../../utils/util');
Page({
  data: {
    featuredTopics: [],
    sections: [] //分块专题
  },
  //事件处理函数
  goToTopic: function(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../topic/topic?id=${id}`
    })
  },
  onLoad: function () {
    var that = this
    //获取精选专题
    wx.request({
      url: `${app.globalData.apiBase}/topics/featured`,
      success(res) {
        that.setData({
          featuredTopics: res.data.data
        });
      },
      fail(res) {
        console.log('request featured topics fail');
      }
    });
    //获取首页分块专题
    wx.request({
      url: `${app.globalData.apiBase}/topics/homepage`,
      success(res) {
        const sections = res.data.data;
        sections.forEach(section => {
          section.topics.forEach(util.formatTopic);
        });
        that.setData({
          sections
        });
      },
      fail() {
        console.log('request /topics/homepage fail');
      }
    });
    //获取猜你喜欢
    wx.request({
      url: `${app.globalData.apiBase}/topics/guess`,
      success(res) {
        const topics = res.data.data;
        topics.forEach(util.formatTopic);
        that.setData({
          guessTopics: topics
        });
      }
    });
  }
})
