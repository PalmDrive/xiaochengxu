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
  onLoad: function () {
    this.load();
  },
  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
      userInfo = Auth.getLocalUserInfo();
    const gaOptions = {
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
      url: `${ app.globalData.apiBase }/users/c3452410-88a1-11e7-8930-17fadd5442f9/group-topics-24hours?date=${ this.data.lastDate }`,
      success: this.loadOver
    });
  },
  /**
   * 数据加载 成功 回调
   */
  loadOver: function (res) {
    for (let i = res.data.topics.length - 1; i >= 0; i--) {
      let topic = res.data.topics[i]
      for (let i = topic.mediums.length - 1; i >= 0; i--) {
        let medium = topic.mediums[i]
        medium.publishedAt = formatTime(new Date(medium.publishedAt));
      }
    }
    console.log(formatTime(new Date(res.data.date)));
    this.data.dateList.push({
      date: formatTime(new Date(res.data.date)),
      topics: res.data.topics
    });
    console.log(res.data.date);
    this.setData({
      loadingView: null,
      lastDate: res.data.date,
      dateList: this.data.dateList,
    });
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('页面上拉触底事件的处理函数');
    this.setData({
      loadingView: {
        loadingMore: true
      }
    });
    this.load();
  }
})
function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  return year + '年' + month + '月' + day + '日'
}