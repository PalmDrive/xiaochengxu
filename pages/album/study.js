const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

Page({
  data: {
    loadingStatus: null, // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
    page: {
      studying: {number: 1, size: 5},
      studied: {number: 1, size: 5}
    },
    groups: {
      studying: [],
      studied: []
    },
    mode: 'studying'  // 1: studying  2: studied
  },

  onLoad(options) {
    const userId = Auth.getLocalUserId();
    if (userId) {
      this.loadData();
    }

    const that = this;
    wx.getSystemInfo({
      success(res) {
        that.setData({screenWidth: res.windowWidth});
      },
      fail() {
        that.setData({screenWidth: 375});
      }
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
      title: '七日辑 - 学习页面'
    };
  },
  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.data.page[this.data.mode].number = 1;
    this.data.groups[this.data.mode] = [];
    this.loadData();
  },
  /**
   * 上拉加载
   */
  onReachBottom() {
    if (this.data.loadingStatus === null) {
      this.setData({
        loadingStatus: 'LOADING_MORE'
      })
      this.loadData();
    }
  },

  loadData() {

    const status = this.data.mode === 'studying' ? 1 : 2;

    this.setData({
      loadingStatus: 'LOADING'
    });
    request({
      url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}/relationships/albums?include=media,post&page[size]=${this.data.page[this.data.mode].size}&page[number]=${this.data.page[this.data.mode].number}&fields[albums]=title,picurl,metaData&app_name=${app.globalData.appName}&filter=unlocked&filter[status]=${status}`,
    }).then(res => {
      this.data.page[this.data.mode].number ++;
      let loadingStatus;
      if (!res.data.length) {
        loadingStatus = 'LOADED_ALL';
      } else {
        loadingStatus = null;
      }
      this.data.groups[this.data.mode] = this.data.groups[this.data.mode].concat(res.data);
      this.setData({
        groups: this.data.groups,
        loadingStatus: loadingStatus
      });
      wx.stopPullDownRefresh();
    });
  },

  changeMode(event) {
    const mode = event.currentTarget.dataset.mode;

    if (mode !== this.data.mode) {
      this.setData({mode: mode});
      if (this.data.groups[mode].length === 0) {
        this.loadData();
      }
    }
  }
});
