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
    loadingMore: false,
    showHint: false
  },
  //点击专题
  goToTopic: function(event) {
    const topic = event.currentTarget.dataset.topic,
      userInfo = Auth.getLocalUserInfo();
    const gaOptions = {
      cid: Auth.getLocalUserId(),
      ec: `topic_name:${topic.attributes.name}, topic_id:${topic.id}`,
      ea: 'click_topic_in_zhuantiTab',
      el: `user_name:${userInfo.nickName}, user_id:${userInfo.openId}`,
      ev: 1
    };
    util.goToTopic(event, gaOptions);
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
  //关闭首次登陆弹窗
  closeHint: function() {
    util.closeHint(this);
  },

  onLoad: function () {
    const that = this;
    that.setData({
      initedAt: + new Date()
    });
    //检查storage里是否有userId，没有则请求
    if (Auth.getLocalUserId()) {
      init();
    } else {
      Auth.login(init, that);
    }

    function init() {
      const userId = Auth.getLocalUserId(),
        userIdQuery = `?userId=` + userId;
      //获取精选专题
      wx.request({
        url: `${app.globalData.apiBase}/topics/featured${userIdQuery}`,
        success(res) {
          that.setData({
            featuredTopics: res.data.data
          });

          wx.stopPullDownRefresh();
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

      util.ga({
        cid: Auth.getLocalUserId() || '555',
        dp: '%2FzhuantiTab_XiaoChengXu',
        dt: '专题tab页（小程序）'
      });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.onLoad();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore();
  }
})
