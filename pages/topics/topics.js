//topics.js
//获取应用实例
var app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth');
Page({
  data: {
    featuredTopics: [],
    sections: [], //分块专题
    initedAt: +new Date(),
    loadingMore: false
  },
  //点击专题
  goToTopic: function(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../topic/topic?id=${id}`
    })
  },
  //加载更多猜你喜欢
  loadMore() {
    const that = this;
    if (!that.data.loadingMore) {
      console.log('load more guess-you-like');
      that.setData({ loadingMore: true });
      const url = `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}/suggested-topics?initedAt=${that.data.initedAt}`;
      wx.request({
        url,
        success(res) {
          const topics = res.data.data;
          topics.forEach(util.formatTopic);
          that.setData({
            guessTopics: that.data.guessTopics.concat(topics),
            loadingMore: false
          });
        },
        fail(res) {
          console.log('request more guess-you-like topics fail');
        }
      });
    }
  },

  onLoad: function () {
    const that = this;
    const userId = Auth.getLocalUserId(),
          userIdQuery = userId ? `?userId=` + userId : '';
    //获取精选专题
    wx.request({
      url: `${app.globalData.apiBase}/topics/featured${userIdQuery}`,
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
      url: `${app.globalData.apiBase}/topics/homepage${userIdQuery}`,
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
      url: `${app.globalData.apiBase}/users/${userId}/suggested-topics?initedAt=${that.data.initedAt}`,
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
