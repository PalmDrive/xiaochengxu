const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    graphql = require('../../utils/graphql');

Page({
  data: {
    userInfo: {},
    timeCapsules: [],
    date: new Date()
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#000000'
    });
    wx.setNavigationBarTitle({
      title: '时间胶囊'
    })
  },

  onShow() {
    Auth.getLocalUserId() && this.loadData();

    this.setData({
      userInfo: Auth.getLocalUserInfo().attributes
    });
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    return {
      title: '时间胶囊'
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadData();
  },

  loadData() {
    wx.showLoading({
      title: '加载中',
    });
    let param = `{
      timeCapsules (userId: "${Auth.getLocalUserId()}") {
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
          wxUsername,
          profilePicUrl
        }
      }
    }`;

    graphql(param).then(res => {
      console.log(res);
      const timeCapsules = res.data.timeCapsules || [],
            that = this;

      timeCapsules.map(capsule => {

        const days = util.getDays((new Date()), (new Date(capsule.openAt)));
        capsule.title = unescape(capsule.title);
        capsule.openAtString = days < 0 ? Math.abs(days) : undefined;
        capsule.openAtString1 = util.formatDateToDay(new Date(capsule.openAt));
        capsule.createdAtString = util.formatDateToDay(new Date(capsule.createdAt));
        capsule.ownerName = capsule.owner.wxUsername || '匿名';
        capsule.isCreator = capsule.ownerName === that.data.userInfo.wxUsername;
        return capsule;
      })
      that.setData({
        timeCapsules: timeCapsules
      });
      wx.hideLoading();

      wx.stopPullDownRefresh();
    });
  },

  shareToOther: function(event) {
    const index = event.currentTarget.dataset.idx,
          obj = this.data.timeCapsules[index];

    wx.navigateTo({
      url: `../album/share?imgUrl=${obj.sharedPicurl}&capsuleId=${obj.id}`//${sharedPicurl}`
    });
  },

  goToCapsule: function(event) {
    const index = event.currentTarget.dataset.idx,
          capsule = this.data.timeCapsules[index],
          capsuleId = capsule.id,
          openAtString = capsule.openAtString;
    if (openAtString) {
      wx.showToast({
        title: `${openAtString}天后解封`,
        duration: 1000,
        image: '../../images/campaign/capsule.png'
      });
      return;
    }
    wx.navigateTo({
      url: `./show-capsule?capsuleId=${capsuleId}`
    });
  },

  addCapsule: function(event)  {
    wx.navigateTo({
      url: `./time-capsule`
    });
  }
})
