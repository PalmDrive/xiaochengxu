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
    console.log(res.data);
    console.log('----------')
    this.setData({
      loadingView: null,
      groups: res.data.data
    });
  },
  /**
   * 
   */
  goGroups: function (event) {
    const userId = event.currentTarget.dataset.id;
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