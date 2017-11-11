//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request'),
  {getPurchasedAlbums} = require('../../utils/user');

const page = {
  number: 1,
  size: 5
};

Page({
  data: {
    albums: [],
    userInfo: {},
    userId: null,
    loadingStatus: null
  },
  //事件处理函数
  goToTopic: Util.goToTopic,

  onLoad: function (options) {
    if (options && options.pullDown) {
      this.setData({loadingStatus: 'LOADING' });
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
    this.onLoad({pullDown: true});
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.loadingStatus != 'LOADING' && !this.data.loadingStatus != 'LOADED_ALL') {
      page.number = page.number + 1;
      this.setData({loadingMore: 'LOADING_MORE'});
      this.getPurchasedAlbums();
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

  updateData: function(albums) {
    albums.forEach(Util.formatAlbum);
    const data = {
      loadingStatus: 'LOADED',
      albums: this.data.albums.concat(albums)
    };
    if (albums.length < page.size) {
      data.loadingStatus = 'LOADED_ALL';
    }
    this.setData(data);
    wx.stopPullDownRefresh();
  },

  getPurchasedAlbums: function() {
    getPurchasedAlbums(Auth.getLocalUserId(), {
      page: {
        number: page.number,
        size: page.size
      }
    })
    .then(res => {
      this.updateData(res);
    }, () => {
      console.log('my page, getPurchasedAlbums request fail');
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

    Util.goToAlbum(group);
  },

  _load() {
    const userId = Auth.getLocalUserId();
    const data = {
      userInfo: Auth.getLocalUserInfo().attributes,
      userId
    };
    this.setData(data);
    this.getPurchasedAlbums();
  }
})
