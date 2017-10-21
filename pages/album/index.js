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
    groups: [],
    tempAlert: null
  },
  //关闭首次登陆弹窗
  closeHint() {
    util.closeHint(this);
  },

  onLoad(options) {
    /* 免费得七日辑 start */
    request({
      url: `${baseUrl}/users/temp-alert`,
    }).then(d => {
      // d = JSON.parse('{"data":{"title":"恭喜你!","content":"已经有5位朋友帮助了你恭喜免费获取《7天告别爵士乐小白》","link":"/pages/album/show?id=1b259840-b23c-11e7-8905-3f3cfcde362a","type":"referral","picurl":"http://ailingual-production.oss-cn-shanghai.aliyuncs.com/pics/%E4%B8%83%E6%97%A5%E8%BE%91/%E7%95%99%E5%AD%A6%E5%B0%8F%E7%99%BD%E5%A6%82%E4%BD%95%E5%8F%98%E8%BA%AB%E8%80%81%E5%8F%B8%E6%9C%BA/banner%E5%9B%BE.jpg"}}')
      if (d.data) {
        this.setData({
          tempAlert: d.data
        });
      }
    })
    /* 免费得七日辑 end */

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
    util.ga({
      cid: Auth.getLocalUserId(),
      dp: '%2FtoutiaoTab_XiaoChengXu',
      dt: '群头条tab页（小程序）'
    });
  },

  /**
   * 加载数据
   */
  _load(type) {
    return request({
      url: `${app.globalData.apiBase}/albums?include=media,post&page[size]=${this.data.page.size}&page[number]=${this.data.page.number}&fields[albums]=title,description,picurl,price,editorInfo,id,metaData`,
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

  gotoNewGroup() {
    wx.navigateTo({
      url: '../groups/new-group'
    });
  },

  /**
   * 进入Group
   */
  gotoGroup(event) {
    const userId = event.currentTarget.dataset.group.id,
          name = event.currentTarget.dataset.group.attributes.username,
          userInfo = Auth.getLocalUserInfo().attributes || {};
    util.gaEvent({
      cid: Auth.getLocalUserId(),
      ev: 0,
      ea: 'click_toutiao_in_toutiaoTab',
      ec: `toutiao_name:${name},toutiao_id:${userId}`,
      el: `user_name:${userInfo.wxUsername},user_id:${userId}`
    });
    wx.navigateTo({
      url: `../groups/group?id=${userId}`
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
    util.gaEvent({
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
  },
  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          userInfo = Auth.getLocalUserInfo(),
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
            ea: 'click_article_in_groupListPage',
            el: `toutiao_name:${this.data.userName},toutiao_id:${this.data.groupId}`,
            ev: 0
          };
    util.goToMedium(event, gaOptions);
  },
  tempAlertClose: function () {
    this.setData({
      tempAlert: null
    });
  }
});
