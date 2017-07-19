//index.js
//获取应用实例
var app = getApp(),
    util = require('../../utils/util');
Page({
  data: {
    featuredTopics: []
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
    //获取猜你喜欢
    wx.request({
      url: `${app.globalData.apiBase}/topics/guess`,
      success(res) {
        const topics = res.data.data;
        topics.forEach(t => {
          // 格式化时间
          if (t.attributes.lastMediumAddedAt) {
            t.attributes.lastMediumAddedAt = util.convertDate(new Date(t.attributes.lastMediumAddedAt));
          } else {
            t.attributes.lastMediumAddedAt = '';
          }

          if (t.attributes.lastMediumTitle) {
            t.attributes.lastMediumTitle = t.attributes.lastMediumTitle.slice(0, 15) + '...';
          }
        });
        that.setData({
          guessTopics: topics
        });
      }
    });
  }
})
