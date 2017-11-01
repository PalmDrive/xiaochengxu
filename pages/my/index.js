//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request');
Page({
  data: {
    userInfo: {},
    userId: null,
    items: []
  },

  onLoad: function (options) {
    const items = [
      [
      // {icon: '礼品卡', title: '礼品卡', tip: '你还有50个礼品卡', action: ''},
      {icon: '订单', title: '订单', tip: '', action: 'goToOrder'},
      {icon: '礼品卡', title: '卡券', tip: '点击查看详情', action: 'goToCoupon'},
      {icon: '成就', title: '成就', tip: '完成一个七日辑就可获得一个成就', action: 'goToAchieve'}
      ],
      [
      // {icon: '打卡', title: '打卡提示时间', tip: '20:00', action: 'goToRemindTime'}
      // ,
      // {icon: '客服', title: '在线', tip: '周一至周五 10:00-20:00', action: ''}
      ],
    ];

    if (Auth.getLocalUserInfo().attributes.role === 'admin') {
      items[0].push({icon: '免费得', title: '免费得', tip: '点击查看详情', action: 'goToFree'});
    }
    this.setData({items: items,userInfo: Auth.getLocalUserInfo().attributes});
    Auth.getLocalUserId() && this._loadRemindTime();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    Util.ga({
      cid: Auth.getLocalUserId() || '555',
      dp: '%2FwodeTab_XiaoChengXu',
      dt: '我的tab页（小程序）'
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '七日辑-我的页面'
    };
  },

  _loadRemindTime: function() {
    request({
      url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}?fields[users]=dailyReminderTime`
    }).then(res => {
      let time = res.data.attributes.dailyReminderTime,
          min = "00",
          hour = "20";
      if (time) {
        const m = ((time / 1000 / 60) % 60)
        min = m < 10 ? ('0' + m) : m;
        const h = Math.floor((time / 1000 / 60) / 60)
        hour = h < 10 ? ('0' + h) : h;
      }
      this.data.items[1].push({icon: '打卡', title: '打卡提示时间', tip: (hour + ":" + min), action: 'goToRemindTime'})
      this.setData({
        items: this.data.items
      })
    });
  },

  goToAchieve() {
    wx.navigateTo({
      url: './achievements'
    });
  },

  goToOrder() {
    wx.navigateTo({
      url: './order'
    });
  },

  goToFree() {
    wx.navigateTo({
      url: './free'
    });
  },

  goToCoupon() {
    wx.navigateTo({
      url: './coupon'
    });
  },
  goToRemindTime() {
    wx.navigateTo({
      url: './remind'
    });
  }
});
