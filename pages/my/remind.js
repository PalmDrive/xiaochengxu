//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request');
Page({
  data: {
    time: '20:00',
    selectedIndex: 0,
    timeArray: ['9:00', '12:00', '16:00', '19:00', '20:00']
  },

  onLoad: function (options) {
    Auth.getLocalUserId() && this._load();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const that = this;

    Util.ga({
      cid: Auth.getLocalUserId() || '555',
      dp: '%2FwodeTab_XiaoChengXu',
      dt: '设置打卡时间（小程序）'
    });
  },

  onUnload: function () {
    const times = this.data.time.split(':');
    const milliseconds = (parseInt(times[0]) * 60 + parseInt(times[1])) * 60 * 1000;
    const url = `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}`;
    request({
      method: 'PUT',
      url,
      data: {
        data: {
          attributes: {
            dailyReminderTime: milliseconds
          }
        }
      }
    }).then(res => {
      console.log(res)
    })
  },

  _load: function() {
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
      const result = hour + ":" + min;
      const index = this.data.timeArray.indexOf(result)
      const selectedIndex = index !== -1 ? index : 5
      this.setData({
        time: result,
        selectedIndex
      })
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '七日辑-打卡提示时间'
    };
  },

  bindTimeChange: function(e) {
    this.setData({
      time: e.detail.value,
      selectedIndex: 5
    })
  },

  selectTime: function(event) {
    const index = event.currentTarget.dataset.index;
    this.setData({
      selectedIndex: index,
      time: this.data.timeArray[index]
    })
  }
});
