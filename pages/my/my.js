//my.js
var app = getApp();
Page({
  data: {
    userInfo: {}
  },
  //事件处理函数
  goToTopic: function (event) {
    const id = event.target.dataset.id;
    wx.navigateTo({
      url: `../topic/topic?id=${id}`
    });
  },
  onLoad: function () {
    var that = this;
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function (userInfo) {
      //更新数据
      that.setData({
        userInfo: userInfo
      });
    });
  }
})
