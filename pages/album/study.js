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
    albums: {
      studying: [],
      studied: []
    },
    mode: 'studying',  // 1: studying  2: studied
    groups: []
  },

  onLoad(options) {
    const userId = Auth.getLocalUserId();
    if (userId) {
      this.loadData();
      this.loadSuggestAlbum();
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
    this.data.albums[this.data.mode] = [];
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
      const data = res.data.map(album => {
        album.completedDays = Object.keys(album.relationships.userAlbum.data.attributes.logs.days).length;
        return album;
      })
      this.data.albums[this.data.mode] = this.data.albums[this.data.mode].concat(data);
      this.setData({
        albums: this.data.albums,
        loadingStatus: loadingStatus
      });
      wx.stopPullDownRefresh();
    });
  },

  loadSuggestAlbum() {
    request({
      url: `${app.globalData.apiBase}/albums?include=media,post&page[size]=1&page[number]=1&fields[albums]=title,description,picurl,price,editorInfo,id,metaData&app_name=${app.globalData.appName}`,
    }).then(res => {
      this.setData({
        groups: res.data
      });
    });
  },

  changeMode(event) {
    const mode = event.currentTarget.dataset.mode;

    if (mode !== this.data.mode) {
      this.setData({mode: mode});
      if (this.data.albums[mode].length === 0) {
        this.loadData();
      }
    }
  }
});
