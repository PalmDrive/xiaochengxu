const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request');
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
    // for testing
    console.log('page load options:');
    console.log(options);
    options = options || {};
    if (options.scene) {
      const scene = decodeURIComponent(options.scene);
      console.log('scene:', scene);
    }

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
      url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}/relationships/groups?include=media&page[size]=${this.data.page.size}&page[number]=${this.data.page.number}&role=${type}`,
    });
  },

  /**
   * Group 数据加载 成功 回调
   */
  _loadGroupOver(res) {
    let loadingStatus = null;
    if (!res.data.length) {
      loadingStatus = 'LOADED_ALL';
    }
    res.data.forEach(group => {
      if (group.attributes.role === 'group') {
        const media = group.relationships.media;
        group.lastPublishedAt = media && media.meta && util.convertDate(new Date(media.meta.publishedAt));
      }
    });
    this.data.page.number ++;
    this.setData({
      loadingStatus: loadingStatus,
      groups: this.data.groups.concat(res.data)
    });
  },

  /**
   * paidGroup 数据加载 成功 回调
   */
  _loadPaidGroupOver(res) {
    this.data.page.number ++;
    this.setData({
      groups: this.data.groups.concat(res.data)
    });
    if (res.data.length === this.data.page.size) {
      this._load('paid_group').then(this._loadPaidGroupOver);
    } else {
      this.data.page.number = 1;
      this._load('group').then(this._loadGroupOver);
    }
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
          userId = group.id,
          name = group.username,
          role = group.relationships && group.relationships.userGroup.data.attributes.role || null,
          userInfo = Auth.getLocalUserInfo().attributes || {},
          groupInfo = group.attributes.groupInfo;

    util.gaEvent({
      cid: Auth.getLocalUserId(),
      ev: 0,
      ea: 'click_qiriji_in_toutiaoTab',
      ec: `qiriji_name:${name},toutiao_id:${userId}`,
      el: `user_name:${userInfo.wxUsername},user_id:${userId}`
    });

    if (role || !groupInfo.price) {
      wx.navigateTo({
        url: `../album/show?id=${userId}`
      });
    } else {
      wx.navigateTo({
        url: `../album/buy?id=${userId}`
      });
    }
  },

  gotoMap() {
    if (wx.getStorageSync('dazhaxiePageHasShow')) {
      wx.navigateTo({
        url: `/pages/map/map?friendId=59ce3d20a22b9d0061312243`
      });
    } else {
      wx.navigateTo({
        url: `/pages/map/dazhaxie?friendId=59ce3d20a22b9d0061312243`
      });
    }
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
      this._load('group').then(this._loadGroupOver);
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
});
