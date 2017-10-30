//my.js
const app = getApp(),
  Util = require('../../utils/util'),
  Auth = require('../../utils/auth'),
  {request} = require('../../utils/request');
Page({
  data: {
    userInfo: {},
    userId: null,
    loading: true,
    favoriteTopics: [],
    loaded: false,
    page: {number: 1, size: 8},
    noMore: false,
    items: []
  },
  //事件处理函数
  goToTopic: Util.goToTopic,

  onLoad: function (options) {
    // console.log('onLoad');
    const that = this;

    if (options && options.pullDown) {
      that.setData({ 'page.number': 1, noMore: false });
    }

    Auth.getLocalUserId() && this._load();
    const items = [
      [
      // {icon: '礼品卡', title: '礼品卡', tip: '你还有50个礼品卡', action: ''},
      {icon: '订单', title: '订单', tip: '', action: 'goToOrder'},
      {icon: '礼品卡', title: '卡券', tip: '点击查看详情', action: 'goToCoupon'},
      // {icon: '免费得', title: '免费得', tip: '1个活动进行中，点击查看详情', action: ''},
      {icon: '成就', title: '成就', tip: '完成一个七日辑就可获得一个成就', action: 'goToAchieve'}
      ],
      [
      {icon: '打卡', title: '打卡提示时间', tip: '20:00', action: 'goToRemindTime'}
      // ,
      // {icon: '客服', title: '在线', tip: '周一至周五 10:00-20:00', action: ''}
      ],
    ];
    if (Auth.getLocalUserInfo().attributes.role === 'admin') {
      items[0].push({icon: '免费得', title: '免费得', tip: '点击查看详情', action: 'goToFree'});
    }
    that.setData({items: items});
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
    const that = this;

    Util.ga({
      cid: Auth.getLocalUserId() || '555',
      dp: '%2FwodeTab_XiaoChengXu',
      dt: '我的tab页（小程序）'
    });

    if (that.data.loaded && that.data.loading) {
      // console.log('do stuff onShow');
      //更新订阅列表
      const cb = topics => {
        topics.forEach(Util.formatTopic);
        const data = {
          loading: false,
          favoriteTopics: topics
        };
        if (topics.length < that.data.page.size) {
          console.log('onShow no more');
          data.noMore = true;
        }
        that.setData(data);
      };
      that.getTopics(1, cb);
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.data.loaded) {
      this.setData({ loading: true, noMore: false, 'page.number': 1 });
    }
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
    this.onLoad({pullDown: true});
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    const that = this;
    if (!this.data.loadingMore && !this.data.noMore) {
      const pageNumber = this.data.page.number + 1;
      that.setData({loadingMore: true, 'page.number': pageNumber});
      const cb = topics => {
        topics.forEach(Util.formatTopic);

        const data = {
          loadingMore: false,
          favoriteTopics: that.data.favoriteTopics.concat(topics)
        };
        if (topics.length < that.data.page.size) {
          data.noMore = true;
        }
        that.setData(data);
      };
      this.getTopics(pageNumber, cb);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '七日辑-我的页面'
    };
  }
});
