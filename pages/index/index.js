// pages/index/index.js
const app = getApp(),
      util = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      {getSubscribedTopicIds} = require('../../utils/topic');
      
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
        url = `${app.globalData.apiBase}/media/read?filterSource=true&mediumType=article&userId=${Auth.getLocalUserId()}&lastInitedAt=${that.data.lastInitedAt}&page[number]=${that.data.pageNumber}&page[size]=${that.data.pageSize}&from=miniProgram`;
      } else {
        url = `${app.globalData.apiBase}/media/feeds2?filterSource=true&mediumType=article&userId=${Auth.getLocalUserId()}&subscribed=false&page[size]=${that.data.pageSize}&from=miniProgram`;
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
        recommendNoMore: false
      });
    } else {
      that.setData({
        needRead: false,
        recommendNoMore: false
      });
    }

    //检查storage里是否有userId，没有则请求
    // @TODO: 移到page.js
    if (Auth.getLocalUserId()) {
      init();
    } else {
      Auth.login(init, that);
    }

    function init() {
      // console.log(`onLoad request begin used ${new Date() - now}ms`);
      //获取推荐文章
      wx.request({
        url: `${app.globalData.apiBase}/media/feeds2?filterSource=true&mediumType=article&userId=${Auth.getLocalUserId()}&subscribed=false&page[size]=${that.data.pageSize}&from=miniProgram`,
        success(res) {
          // console.log(res.data);
          // console.log(`onLoad request used ${new Date() - now}ms`);
          const media = res.data.data;
          const lastInitedAt = res.data.meta && res.data.meta.now;
          const len = media.length;
          const needRead = len < that.data.pageSize;
          // console.log('onload recommend media length:', len);
          media.forEach(util.formatMedium);
          
          const data = {
            media,
            loading: false,
            needRead
          };
          if (lastInitedAt) {
            data.lastInitedAt = lastInitedAt;
          }
          that.setData(data);
          // console.log(`onLoad data set used ${new Date() - now}ms`);
          wx.stopPullDownRefresh();

          if (needRead) {
            that.loadMore();
          }

          // Async fetch the user's subscribed topic ids
          getSubscribedTopicIds(Auth.getLocalUserId(), true);
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
    // this.onLoad({ pullDown: true });
    const that = this;
    wx.request({
      url: `${app.globalData.apiBase}/media/feeds2?from=miniProgram&mediumType=article&userId=${Auth.getLocalUserId()}&subscribed=false&page[size]=${that.data.pageSize}`,
      success(res) {
        // console.log('pull down refresh request success');
        const media = res.data.data;
        const len = media.length;
        const lastInitedAt = res.data.meta && res.data.meta.now;
        let needRead;
        if (len) {
          needRead = len < that.data.pageSize;
          media.forEach(util.formatMedium);
          const data = {
            media,
            pageNumber: 1,
            needRead,
            recommendNoMore: false
          };
          if (lastInitedAt) {
            data.lastInitedAt = lastInitedAt;
          }
          that.setData(data);
        }
        wx.stopPullDownRefresh();
        if (needRead) {
          that.loadMore();
        }
      },
      fail(res) {
        wx.stopPullDownRefresh();
        console.log('request recommended media fail');
      }
    });
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
    return {
      title: '日读'
    };
  }
})