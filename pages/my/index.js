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
      {icon: 'my_order', title: '订单', tip: '', action: 'goToOrder'},
      {icon: 'my_card', title: '卡券', tip: '点击查看详情', action: 'goToCoupon'},
      {icon: 'my_achieve', title: '成就', tip: '完成一个七日辑就可获得一个成就', action: 'goToAchieve'},
      {icon: 'my_free', title: '优惠得', tip: '点击查看哪些朋友帮助了你', action: 'goToFree'}
      ],
      [
      // {icon: '客服', title: '在线', tip: '周一至周五 10:00-20:00', action: ''}
      ],
    ];
    this.setData({items: items,userInfo: Auth.getLocalUserInfo().attributes});
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
    Auth.getLocalUserId() && this._loadRemindTime();
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
      let flag = false;
      for (let i = 0; i < this.data.items[1].length; i++ ) {
        let obj = this.data.items[1][i];
        if (obj.title === '学习提醒时间') {
          obj.tip = (hour + ":" + min);
          this.data.items[1][i] = obj;
          flag = true;
        }
      }
      if (!flag) {
        this.data.items[1].push({icon: 'my_time', title: '学习提醒时间', tip: (hour + ":" + min), action: 'goToRemindTime'})
      }

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
