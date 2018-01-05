const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    graphql = require('../../utils/graphql'),
    _ = require('../../vendors/underscore');

Page({
  data: {
    userInfo: Auth.getLocalUserInfo().attributes,
    date: '2017年11月23日',  // util.formatDateToDay
    from: '我',
    capsuleId: '',
    timeCapsule: {}
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#000000'
    });

    wx.setNavigationBarTitle({
      title: '时间胶囊'
    });
    this.setData({
      capsuleId: options.capsuleId
    });
    Auth.getLocalUserId() && this.loadData();

  },

  onShow() {
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    return {
      title: '时间胶囊'
    }
  },

  loadData() {
    wx.showLoading({
      title: '加载中',
    });
    let param = `
      query TimeCapsules($id: ID) {
        timeCapsules (id: $id) {
          id,
          coverPicurl,
          sharedPicurl,
          title,
          content,
          openAt,
          createdAt,
          owner {
            id,
            wxUsername,
            profilePicUrl
          },
          participants {
            id,
            profilePicUrl
          }
        }
      }
    `;

    graphql(param, {"id": this.data.capsuleId}).then(res => {
      console.log(res);
      const timeCapsules = res.data.timeCapsules || [];

      timeCapsules.map(capsule => {
        const days = util.getDays((new Date()), (new Date(capsule.openAt)));
        capsule.title = unescape(capsule.title);
        capsule.content = unescape(capsule.content);
        capsule.openAtString = days < 0 ? Math.abs(days) : undefined;
        capsule.createdAtString = util.formatDateToDay(new Date(capsule.createdAt));
        capsule.ownerName = capsule.owner.wxUsername || '匿名';
        capsule.isCreator = capsule.ownerName === this.data.userInfo.wxUsername;
        return capsule;
      })
      this.setData({
        timeCapsule: timeCapsules.length > 0 ? timeCapsules[0] : {}
      });
      wx.hideLoading();
    });
  },

  shareToOther: function(event) {
    wx.navigateTo({
      url: `../album/share?imgUrl=${this.data.timeCapsule.sharedPicurl}`
    });
  },
})
