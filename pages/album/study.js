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
    groups: [],
    showSuggestAlbum: false,
    tempAlert: null
  },

  onShow() {
    /* 免费得七日辑 start */
    this.data.tempAlert && this.setData({
      tempAlert: null
    });
    if (this.data.tempAlert === false) {
      this.setData({
        tempAlert: false
      });
    } else {
      request({
        url: `${baseUrl}/users/temp-alert`,
      }).then(d => {
        // d = {data:{title:"恭喜你!",content:"已经有5位朋友帮助了你\n恭喜免费获取\n《7天告别爵士乐小白》",link:"/pages/album/show?id=1b259840-b23c-11e7-8905-3f3cfcde362a","type":"referral","picurl":"http://ailingual-production.oss-cn-shanghai.aliyuncs.com/pics/%E4%B8%83%E6%97%A5%E8%BE%91/%E7%95%99%E5%AD%A6%E5%B0%8F%E7%99%BD%E5%A6%82%E4%BD%95%E5%8F%98%E8%BA%AB%E8%80%81%E5%8F%B8%E6%9C%BA/banner%E5%9B%BE.jpg"}}
        if (d.data) {
          this.setData({
            tempAlert: d.data
          });
        }

        if (d.meta) {
          // 是否关注了七日辑的服务号
          Auth.setLocalKey( `isSubscribedWX`, d.meta.isSubscribedWX + "")
        }
      })
    }
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
      url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}/relationships/albums?include=media,post&page[size]=${this.data.page[this.data.mode].size}&page[number]=${this.data.page[this.data.mode].number}&fields[albums]=title,picurl,metaData&app_name=${app.globalData.appName}&filter[unlocked]=true&filter[status]=${status}`,
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

      this.loadSuggestAlbum();
    });
  },

  loadSuggestAlbum() {
    request({
      url: `${app.globalData.apiBase}/albums?include=media,post&page[size]=1&page[number]=1&fields[albums]=title,description,picurl,price,editorInfo,id,metaData&app_name=${app.globalData.appName}`,
    }).then(res => {

      let showSuggestAlbum = false;
      const studingCount = this.data.albums["studying"].filter(r => r.id === res.data[0].id).length;
      const studiedCount = this.data.albums["studied"].filter(r => r.id === res.data[0].id).length;
      if (studingCount + studiedCount === 0) {
        showSuggestAlbum = true;
      }

      this.setData({
        groups: res.data,
        showSuggestAlbum
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
  },

  tempAlertClose: function () {
    this.setData({
      tempAlert: null
    });
  },

  tempAlertGoList: function () {
    this.data.tempAlert = false;
  }
});
