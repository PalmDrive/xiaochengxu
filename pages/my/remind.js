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
  //事件处理函数
  goToTopic: Util.goToTopic,

  onLoad: function (options) {
    // console.log('onLoad');
    const that = this;


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

  onHide: function () {

  },

  _load: function() {
    request({
      url: `${app.globalData.apiBase}/users/${Auth.getLocalUserId()}?fields[users]=dailyReminderTime`
    }).then(res => {
      console.log(res);
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
      time: e.detail.value
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
