// pages/index/index.js
const app = getApp(),
      util = require('../../utils/util'),
      Auth = require('../../utils/auth');

const tabs = ['推荐', '订阅'];

Page({
  /**
   * 页面的初始数据
   */
  data: {
    media: [],
    subscribedTopicMedia: [],
    loading: false,
    loadingSubscribe: false,
    loadingMore: false,
    loadingMoreSubscribe: false,
    pageNumber: 1,
    tabs,
    selectedTab: tabs[0],
    needRead: false, //当推荐里未领取的文章领完时，needRead变成true
    lastInitedAt: + new Date(),
    pageSize: 8,
    recommendNoMore: false,
    api: {
      recommendUnread: '/media/feeds2',
      recommendRead: '/media/read',
      subscribeTimeLine: '/media/subscribed-timeline'
    },
    showHint: false
  },
  //点击tab
  selectTab(event) {
    const tab = event.target.dataset.tab;
    this.setData({
      selectedTab: tab
    });
  },
  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
      userInfo = Auth.getLocalUserInfo();
    const gaOptions = {
      cid: Auth.getLocalUserId(),
      ec: `article_title:${medium.attributes.title}, article_id:${medium.id}`,
      ea: 'click_article_in_riduTab',
      el: `user_name:${userInfo.nickName}, user_id:${userInfo.openId}`,
      ev: 0
    };
    util.goToMedium(event, gaOptions);
  },

  //加载更多推荐
  loadMore() {
    const now = new Date();
    const that = this;
    if (!that.data.loadingMore && !that.data.recommendNoMore) {
      // console.log('loadMore');
      that.setData({loadingMore: true});
      //获取推荐文章
      let url;
      if (that.data.needRead) {
        url = `${app.globalData.apiBase}/media/read?filterSource=true&mediumType=article&userId=${Auth.getLocalUserId()}&lastInitedAt=${that.data.lastInitedAt}&page[number]=${that.data.pageNumber}&page[size]=${that.data.pageSize}`;
      } else {
        url = `${app.globalData.apiBase}/media/feeds2?filterSource=true&mediumType=article&userId=${Auth.getLocalUserId()}&subscribed=false&page[size]=${that.data.pageSize}`;
      }
      // console.log(`loadMore request begin used ${new Date() - now}ms`);
      wx.request({
        url,
        success(res) {
          // console.log(`loadMore request used ${new Date() - now}ms`);
          const media = res.data.data;
          // console.log('loadMore media length:', media.length);
          media.forEach(util.formatMedium);

          const recommendNoMore = that.data.needRead && media.length < that.data.pageSize;
          if (recommendNoMore) console.log('recommend no more');

          that.setData({
            media: that.data.media.concat(media),
            loadingMore: false,
            pageNumber: that.data.pageNumber + 1,
            recommendNoMore
          });
          // console.log(`loadMore data set used ${new Date() - now}ms`);
        },
        fail(res) {
          console.log('request more recommended media fail');
        }
      });
    }
  },
  //加载更多订阅
  loadMoreSubscribe() {
    const that = this;
    if (!that.data.loadingMoreSubscribe) {
      console.log('load more for subscribe');
      that.setData({ loadingMoreSubscribe: true });
      const lastId = that.data.lastId;
      const url = `${app.globalData.apiBase}/media/subscribed-timeline?userId=${Auth.getLocalUserId()}&page[size]=${that.data.pageSize}&lastId=${lastId}`;
      wx.request({
        url,
        success(res) {
          const media = res.data.data;
          media.forEach(util.formatMedium);

          that.setData({
            subscribedTopicMedia: that.data.subscribedTopicMedia.concat(media),
            loadingMoreSubscribe: false,
            lastId: media[media.length - 1].id
          });
        },
        fail(res) {
          console.log('request more subscribed media fail');
        }
      });
    }
  },
  //关闭首次登陆弹窗
  closeHint: function () {
    util.closeHint(this);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const now = new Date();
    const that = this;
    if (!options || !options.pullDown) {
      that.setData({
        loading: true,
        loadingSubscribe: true,
        needRead: false,
        lastInitedAt: + new Date(),
        recommendNoMore: false
      });
    } else {
      that.setData({
        needRead: false,
        lastInitedAt: + new Date(),
        recommendNoMore: false
      });
    }

    //检查storage里是否有userId，没有则请求
    if (Auth.getLocalUserId()) {
      init();
    } else {
      Auth.login(init, that);
    }

    function init() {
      // console.log(`onLoad request begin used ${new Date() - now}ms`);
      //获取推荐文章
      wx.request({
        url: `${app.globalData.apiBase}/media/feeds2?filterSource=true&mediumType=article&userId=${Auth.getLocalUserId()}&subscribed=false&page[size]=${that.data.pageSize}`,
        success(res) {
          // console.log(`onLoad request used ${new Date() - now}ms`);
          const media = res.data.data;
          const len = media.length;
          // console.log('onload recommend media length:', len);
          media.forEach(util.formatMedium);

          const needRead = len < that.data.pageSize;
          that.setData({
            media,
            loading: false,
            needRead
          });
          // console.log(`onLoad data set used ${new Date() - now}ms`);
          wx.stopPullDownRefresh();

          if (needRead) {
            that.loadMore();
          }
        },
        fail(res) {
          console.log('request recommended media fail');
        }
      });

      util.ga({
        cid: Auth.getLocalUserId() || '555',
        dp: '%2FriduTab_XiaoChengXu',
        dt: '日读tab页（小程序）'
      });

      // //获取订阅专题下的文章
      // wx.request({
      //   url: `${app.globalData.apiBase}/media/subscribed-timeline?userId=${Auth.getLocalUserId()}&page[size]=${that.data.pageSize}`,
      //   success(res) {
      //     const media = res.data.data;
      //     const len = media.length;
      //     console.log('onload subscribed-timeline media length:', len);
      //     media.forEach(util.formatMedium);
      //     that.setData({
      //       subscribedTopicMedia: media,
      //       loadingSubscribe: false,
      //       lastId: media[media.length - 1].id
      //     });
      //   },
      //   fail(res) {
      //     console.log('request /media/subscribed-timeline fail');
      //   }
      // });
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
    this.onLoad({ pullDown: true });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})