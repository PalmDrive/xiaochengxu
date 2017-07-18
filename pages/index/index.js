//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    featuredTopics: []
  },
  //事件处理函数
  goToTopic: function(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../topic/topic?id=${id}`
    })
  },
  onLoad: function () {
    console.log('onLoad')
    var that = this
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      })
    });
    //获取精选专题
    wx.request({
      url: `${app.globalData.apiBase}/topics/featured`,
      success(res) {
        console.log('request featured topics success');
        that.setData({
          featuredTopics: res.data.data
        });
      },
      fail(res) {
        console.log('request featured topics fail');
      }
    });
  }
})
