//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request');
Page({
  data: {
    userInfo: {},
    userId: null,
    favoriteTopics: [],
    page: {number: 1, size: 10},
    items: [],
    loadingStatus: null
  },
  //事件处理函数
  goToTopic: Util.goToTopic,

  onLoad: function (options) {
    if (options && options.pullDown) {
      this.setData({ 'page.number': 1, loadingStatus: 'LOADING' });
    }
    Auth.getLocalUserId() && this._load();
  },

  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    Util.ga({
      cid: Auth.getLocalUserId() || '555',
      dp: '%2FwodeTab_XiaoChengXu',
      dt: '已购tab页（小程序）'
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // this.setData({ loading: true, noMore: false, 'page.number': 1 });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({favoriteTopics: []});
    this.onLoad({pullDown: true});
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.loadingStatus != 'LOADING' && !this.data.loadingStatus != 'LOADED_ALL') {
      const pageNumber = this.data.page.number + 1;
      this.setData({loadingMore: 'LOADING_MORE', 'page.number': pageNumber});
      this.getTopics(pageNumber);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '七日辑-已购'
    };
  },

  updateData: function(topics) {
    topics.forEach(Util.formatAlbum);
    const data = {
      loadingStatus: 'LOADED',
      favoriteTopics: this.data.favoriteTopics.concat(topics)
    };
    if (topics.length < this.data.page.size) {
      data.loadingStatus = 'LOADED_ALL';
    }
    this.setData(data);
    wx.stopPullDownRefresh();
  },

  getTopics: function(pageNumber) {
    request({
      url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}/relationships/albums?page[size]=${this.data.page.size}&page[number]=${this.data.page.number}&fields[albums]=title,picurl&filter=unlocked`
    }).then((res) => {
      const topics = res.data;
      this.updateData([]);
    }, () => {
      console.log('my page, getTopics request fail');
    });
  },
  /**
   * 进入七日辑
   */
  gotoPaidGroup(event) {
    const group = event.currentTarget.dataset.group,
          id = group.id,
          name = group.username,
          userInfo = Auth.getLocalUserInfo().attributes || {};
    Util.gaEvent({
      cid: Auth.getLocalUserId(),
      ev: 0,
      ea: 'click_qiriji_in_toutiaoTab',
      ec: `qiriji_name:${name},toutiao_id:${id}`,
      el: `user_name:${userInfo.wxUsername},user_id:${id}`
    });

    wx.navigateTo({
      url: `../album/show?id=${id}`
    });
  },
  _load() {
    const userId = Auth.getLocalUserId();
    const data = {
      userInfo: Auth.getLocalUserInfo().attributes,
      userId
    };
    this.setData(data);
    this.getTopics(1);
  }
})
