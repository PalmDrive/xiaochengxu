const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth');

Page({
  data: {
    loadingView: {
      loading: true
    },
    dateList: []
  },
  onLoad: function (options) {
    this.setData({
      groupId: options.id
    });
    this.load();

    wx.request({
      method: 'POST',
      url: `${app.globalData.apiBase}/user-groups?from=miniProgram`,
      data: {
        data: {
          attributes: {
            userId: Auth.getLocalUserId(),
            groupId: options.id
          }
        },
      }
    });
  },
  //点击专题
  goToTopic: function(event) {
    const topic = event.currentTarget.dataset.topic,
    userInfo = Auth.getLocalUserInfo();
    const gaOptions = {
      cid: Auth.getLocalUserId(),
      ec: `topic_name:${topic.attributes.name}, topic_id:${topic.id}`,
      ea: 'click_topic_in_group',
      el: `user_name:${userInfo.nickName}, user_id:${userInfo.openId}`,
      ev: 1
    };
    util.goToTopic(event, gaOptions);
  },
  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
      userInfo = Auth.getLocalUserInfo(),
      gaOptions = {
      cid: Auth.getLocalUserId(),
      ec: `article_title:${medium.title}, article_id:${medium.id}`,
      ea: 'click_article_in_riduTab',
      el: `user_name:${userInfo.nickName}, user_id:${userInfo.openId}`,
      ev: 0
    };
    util.goToMedium(event, gaOptions);
  },
  /**
   * 加载数据
   */
  load: function (event) {
    wx.request({
      url: `${app.globalData.apiBase}/users/${this.data.groupId}/group-topics-24hours?date=${this.data.lastDate}&from=miniProgram`,
      success: this.loadOver
    });
  },
  /**
   * 数据加载 成功 回调
   */
  loadOver: function (res) {
    // 没有数据 显示loading页的加载完毕
    if (!res.data.data) {
      this.setData({
        loadingView: {
          recommendNoMore: true
        }
      });
      return;
    }
    if (!this.data.newMddiumCount) {
      let newMddiumCount = 0;
      res.data.data.forEach(group => {
        newMddiumCount += group.relationships.media.data.length;
      });
      this.setData({
        newMddiumCount: newMddiumCount
      });
    }
    this.data.dateList.push({
      date: util.formatDateToDay(new Date(res.data.meta.mediumLastDate)),
      topics: res.data.data
    });
    this.setData({
      userName: res.data.included[0].attributes.username,
      loadingView: null,
      lastDate: res.data.meta.mediumLastDate,
      dateList: this.data.dateList,
    });
    // 设置标题
    wx.setNavigationBarTitle({
      title: res.data.included[0].attributes.username
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.setData({
      loadingView: {
        loadingMore: true
      }
    });
    this.load();
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    return {
      title: `今日更新${this.data.newMddiumCount}篇`
    }
  }
})