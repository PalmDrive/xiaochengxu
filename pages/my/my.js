//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth');
Page({
  data: {
    userInfo: {},
    userId: null,
    loading: true,
    favoriteTopics: []
  },
  //事件处理函数
  goToTopic: Util.goToTopic,

  onLoad: function () {
    const that = this;
    that.setData({loading: true});
    //检查storage里是否有需要的数据，没有则请求
    if (Auth.getLocalUserId() && Auth.getLocalUserInfo()) {
      init();
    } else {
      Auth.login(init);
    }

    function init() {
      const userId = Auth.getLocalUserId();

      wx.request({
        url: `${app.globalData.apiBase}/users/${userId}/favorite-topics`,
        success(res) {
          const topics = res.data.data;
          const userTopics = res.data.included;
          topics.forEach(Util.formatTopic);
          that.setData({
            loading: false,
            userInfo: Auth.getLocalUserInfo(),
            userId,
            favoriteTopics: topics
          });
          wx.stopPullDownRefresh();
        },
        fail() {
          console.log('request /users/:id/favorite-topics fail');
        }
      });

      Util.ga({
        cid: Auth.getLocalUserId() || '555',
        dp: '%2FwodeTab_XiaoChengXu',
        dt: '我的tab页（小程序）'
      });
    }
  },

  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.onLoad();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
