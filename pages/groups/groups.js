const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth');
Page({
  data: {
    loadingStatus: null, // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
    dateList: [],
    showHint: false
  },
  //关闭首次登陆弹窗
  closeHint() {
    util.closeHint(this);
  },

  onLoad(options) {
    this.setData({
      loadingStatus: 'LOADING'
    });
    Auth.getLocalUserId() && this._load().then(this._loadOver);
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
  _load() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}/relationships/groups?from=miniProgram`,
        success: resolve,
        fail: reject
      });
    });
  },

  /**
   * 数据加载 成功 回调
   */
  _loadOver(res) {
    this.setData({
      loadingStatus: null,
      groups: res.data.data
    });
  },

  gotoNewGroup() {
    wx.navigateTo({
      url: '../groups/new-group'
    });
  },

  /**
   * 
   */
  gotoGroup(event) {
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
  onShareAppMessage() {
    return {
      title: '我的群头条'
    };
  },
  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this._load().then(res => {
      wx.stopPullDownRefresh();
      this._loadOver(res);
    });
  }
});