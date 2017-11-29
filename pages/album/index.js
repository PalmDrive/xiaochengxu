const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

Page({
  data: {
    loadingStatus: null, // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
    dateList: [],
    showHint: false,
    page: {number: 1, size: 5},
    groups: []
  },
  //关闭首次登陆弹窗
  closeHint() {
    util.closeHint(this);
  },

  onLoad(options) {
    const userId = Auth.getLocalUserId();
    //console.log('groups page on load called. userId:', userId);
    this.setData({
      loadingStatus: 'LOADING'
    });
    if (userId) {
      //console.log('calling _load');
      this._load('paid_group')
        .then(this._loadPaidGroupOver);
    }
  },

  onShow() {

    /* 免费得七日辑 end */

    util.ga({
      cid: Auth.getLocalUserId(),
      dp: '%2FtoutiaoTab_XiaoChengXu',
      dt: '群头条tab页（小程序）'
    });
    const {getPurchasedAlbumIdsMap} = require('../../utils/user');
    getPurchasedAlbumIdsMap(true);
  },

  /**
   * 加载数据
   */
  _load(type) {
    return request({
      url: `${app.globalData.apiBase}/albums?include=media,post&page[size]=${this.data.page.size}&page[number]=${this.data.page.number}&fields[albums]=programStartAt,title,description,picurl,price,editorInfo,id,metaData&app_name=${app.globalData.appName}`,
    });
  },

  /**
   * paidGroup 数据加载 成功 回调
   */
  _loadPaidGroupOver(res) {
    this.data.page.number ++;
    // console.log('=============')
    // console.log(res.data);
    // console.log('=============')
    let loadingStatus;
    if (!res.data.length) {
      loadingStatus = 'LOADED_ALL';
    } else {
      loadingStatus = null;
    }
    this.setData({
      groups: this.data.groups.concat(res.data),
      loadingStatus: loadingStatus
    });
  },

  /**
   * 进入七日辑
   */
  gotoPaidGroup(event) {
    const album = event.currentTarget.dataset.group;
    util.goToAlbum(album);
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '七日辑'
    };
  },
  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.data.page.number = 1;
    this.data.groups = [];
    this._load('paid_group').then(res => {
      wx.stopPullDownRefresh();
      return this._loadPaidGroupOver(res);
    });
  },
  /**
   * 上拉加载
   */
  onReachBottom() {
    if (this.data.loadingStatus === null) {
      this.setData({
        loadingStatus: 'LOADING_MORE'
      })
      console.log('LOADING_MORE');
      this._load('paid_group').then(this._loadPaidGroupOver);
    }
  }
});
