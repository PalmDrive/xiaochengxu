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
    // Auth.getLocalUserId();
    this.setData({
      timeCapsule: {
        coverPicurl: 'http://ailingual-production.oss-cn-shanghai.aliyuncs.com/medium_picurl/501de553-a7b7-452d-94bd-c22d2c1798c1.png',
        title: '主题主题主题',
        content: '我是一句话，有时候，它会伴随着狂风，下得很凶暴。这们的雨尽管下在春天，但不是典型的春雨，只会损物而不会“润物”，自然不会使人“喜”，也不可能得到“好”评。'
      }
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

  loadData() {
    wx.showLoading({
      title: '加载中',
    });
    let param = `{
      timeCapsules (id: "${this.data.capsuleId}") {
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
    }`;

    graphql(param).then(res => {
      console.log(res);
      const timeCapsules = res.data.timeCapsules || [];

      timeCapsules.map(capsule => {
        const days = util.getDays((new Date()), (new Date(capsule.openAt)));

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

  hareToOther: function(event) {
    wx.navigateTo({
      url: `../album/share?imgUrl=${his.data.timeCapsule.sharedPicurl}`
    });
  },
})
