//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request');
Page({
  data: {
    userInfo: {},
    userId: null,
    loading: false,
    favoriteTopics: [],
    page: {number: 1, size: 8},
    noMore: false,
    items: []
  },
  //事件处理函数
  goToTopic: Util.goToTopic,

  onLoad: function (options) {
    if (options && options.pullDown) {
      this.setData({ 'page.number': 1, noMore: false });
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
      dt: '我的成就（小程序）'
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.setData({ loading: true, noMore: false, 'page.number': 1 });
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
    if (!this.data.loadingMore && !this.data.noMore) {
      const pageNumber = this.data.page.number + 1;
      this.setData({loadingMore: true, 'page.number': pageNumber});
      this.getTopics(pageNumber);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '七日辑-成就'
    };
  },

  updateData: function(topics) {
    topics.forEach(Util.getAchieveProgress);

    const data = {
      loadingMore: false,
      favoriteTopics: this.data.favoriteTopics.concat(topics)
    };
    if (topics.length < this.data.page.size) {
      data.noMore = true;
    }
    this.setData(data);
    wx.stopPullDownRefresh();
  },

  getTopics: function(pageNumber) {
    request({
      url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}/relationships/albums?page[size]=${this.data.page.size}&page[number]=${this.data.page.number}&fields[albums]=title,picurl&filter=unlocked`
    }).then((res) => {
      const topics = res.data;
      this.updateData(topics);
    }, () => {
      console.log('my page, getTopics request fail');
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
