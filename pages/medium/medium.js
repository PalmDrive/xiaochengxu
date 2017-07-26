// pages/medium/medium.js
const app = getApp(),
      util = require('../../utils/util.js'),
      Auth = require('../../utils/auth.js'),
      WxParse = require('../../utils/wxParse/wxParse.js'),
      he = require('../../utils/he.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    medium: {},
    relatedMedia: [],
    relatedTopics: [],
    loading: true,
    showHint: false
  },
  //事件处理函数
  goToTopic: function (event) {
    const id = event.currentTarget.dataset.id;
    wx.redirectTo({
      url: `../topic/topic?id=${id}`
    })
  },
  goToMedium(event) {
    const mediumId = event.currentTarget.dataset.id;
    wx.redirectTo({
      url: `medium?id=${mediumId}`
    })
  },
  //关闭首次登陆弹窗
  closeHint: function () {
    util.closeHint(this);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this,
      mediumId = options.id;

    //检查storage里是否有userId，没有则请求
    if (Auth.getLocalUserId()) {
      init();
    } else {
      Auth.login(init, that);
    }

    function init() {
      //获取文章数据
      wx.request({
        url: `${app.globalData.apiBase}/media/${mediumId}?fields[media]=htmlContent,title,topics,source,sourcePicUrl,author,publishedAt`,
        success(result) {
          const medium = result.data.data,
            css = result.data.meta.css || '';

          if (Object.keys(medium.attributes.topics).length === 0) {
            delete medium.attributes.topics;
          } else {
            medium.attributes.topic = medium.attributes.topics[Object.keys(medium.attributes.topics)[0]];
          }

          if (medium.attributes.publishedAt) {
            medium.attributes.publishedAt = util.convertDate(new Date(medium.attributes.publishedAt));
          } else {
            medium.attributes.publishedAt = '';
          }

          const html = medium.attributes.htmlContent,
            decoded = he.decode(html);
          WxParse.wxParse('htmlContent', 'html', decoded, that, 0);

          that.setData({
            medium,
            loading: false
          });

          util.ga({
            cid: Auth.getLocalUserId() || '555',
            dp: '%2FarticlePage_XiaoChengXu',
            dt: `article_title:${medium.attributes.title},article_id:${mediumId}`
          });
        },
        fail() {
          console.log('medium page request medium data fail');
        }
      });
    }

    // //获取推荐文章
    // wx.request({
    //   url: `${app.globalData.apiBase}/media/${mediumId}/related-media`,
    //   success(result) {
    //     const relatedMedia = result.data.data;
    //     relatedMedia.forEach(util.formatMedium);
    //     that.setData({
    //       relatedMedia
    //     });
    //   },
    //   fail() {
    //     console.log('medium page request related-media data fail');
    //   }
    // });
    // //获取推荐专题
    // wx.request({
    //   url: `${app.globalData.apiBase}/media/${mediumId}/related-topics`,
    //   success(result) {
    //     const topics = result.data.data;
    //     topics.forEach(t => {
    //       if (t.attributes.lastMediumAddedAt) {
    //         t.attributes.lastMediumAddedAt = util.convertDate(new Date(t.attributes.lastMediumAddedAt));
    //       }
    //       if (t.attributes.lastMediumTitle) {
    //         t.attributes.lastMediumTitle = t.attributes.lastMediumTitle.slice(0, 15) + '...';
    //       }
    //     });
    //     that.setData({
    //       relatedTopics: topics
    //     });
    //   },
    //   fail() {
    //     console.log('medium page request related-topics data fail');
    //   }
    // });
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