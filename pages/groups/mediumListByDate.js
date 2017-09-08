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
      url: `${ app.globalData.apiBase }/user-groups`,
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
      url: `${ app.globalData.apiBase }/users/${ this.data.groupId }/group-topics-24hours?date=${ this.data.lastDate }`,
      success: this.loadOver
    });
  },
  /**
   * 数据加载 成功 回调
   */
  loadOver: function (res) {
    // 格式化 medium 日期
    if (!res.data.data) {
      this.setData({
        loadingView: {
          recommendNoMore: true
        }
      });
      return;
    }
    for (let i = res.data.data.length - 1; i >= 0; i--) {
      let topic = res.data.data[i];
      for (let j = topic.relationships.media.data.length - 1; j >= 0; j--) {
        let medium = topic.relationships.media.data[j]; 
        medium.attributes.publishedAt = util.formatTime(new Date(medium.attributes.publishedAt));
      }
    }
    this.data.dateList.push({
      date: formatDateToDay(new Date(res.data.meta.mediumLastDate)),
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
    console.log('页面上拉触底事件的处理函数');
    this.setData({
      loadingView: {
        loadingMore: true
      }
    });
    this.load();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  }
})
// 
function formatDateToDay(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  return year + '年' + month + '月' + day + '日'
}