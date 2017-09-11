const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth');
Page({
  data: {
    loadingView: {
      loading: true,
    },
    dateList: []
  },

  onLoad: function (options) {
    this.load();
  },

  onShow() {
    util.ga({
      cid: Auth.getLocalUserId(),
      dp: '%2FtoutiaoTab_XiaoChengXu',
      dt: '群头条tab页（小程序）'
    });
  },

  /**
   * 加载数据
   */
  load: function (event) {
    wx.request({
      url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}/relationships/groups?from=miniProgram`,
      success: this.loadOver
    });
  },
  /**
   * 数据加载 成功 回调
   */
  loadOver: function (res) {
    this.setData({
      loadingView: null,
      groups: res.data.data
    });
  },
  /**
   * 
   */
  gotoGroup: function (event) {
    const userId = event.currentTarget.dataset.id,
          name = event.currentTarget.dataset.name,
          userInfo = Auth.getLocalUserInfo();
    util.gaEvent({
      cid: Auth.getLocalUserId(),
      ev: 0,
      ea: 'click_toutiao_in_toutiaoTab',
      ec: `toutiao_name:${name},toutiao_id:${userId}`,
      el: `user_name:${userInfo.nickName},user_id:${userId}`
    });
    wx.navigateTo({
      url: `../groups/group?id=${userId}`
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '我的群头条'
    };
  }
});