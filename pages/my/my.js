//my.js
var app = getApp()
Page({
  data: {
    motto: '欢迎来到职得看',
    userInfo: {},
    featuredTopics: [{
      "type": "topics",
      "id": "0c20f890-4b25-11e7-9b14-eb405934b63b",
      "attributes": {
        "topicId": "0c20f890-4b25-11e7-9b14-eb405934b63b",
        "name": "26位世界级产品经理的持续思考分享 | 海外精选",
        "imgUrl": "http://ailingual-production.oss-cn-shanghai.aliyuncs.com/pics/%E4%B8%93%E9%A2%98%E5%9B%BE%E7%89%87/Rectangle%2018%20Copy%2010%403x.png",
        "description": "26位身经百战的产品经理在博客上分享他们最新的思考和分析",
        "subscriptionsCount": 21,
        "updatedAt": 1499856697615,
        "publishedAt": 1492502232704,
        "createdAt": 1492505847449,
        "proposedBy": "99279540-2a83-11e7-992f-b36260038d03",
        "labels": [
          "Topic",
          "Visible",
          "UGC"
        ],
        "reviewStatus": 1,
        "lastMediumAddedAt": "2017-07-12T23:00:00.000Z",
        "lastMediumTitle": "Stop Using noreply@",
        "type": "featured"
      }
    }]
  },
  //事件处理函数
  goToTopic: function (event) {
    const id = event.target.dataset.id;
    wx.navigateTo({
      url: `../topic/topic?id=${id}`
    })
  },
  onLoad: function () {
    console.log('onLoad')
    var that = this
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function (userInfo) {
      //更新数据
      that.setData({
        userInfo: userInfo
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
