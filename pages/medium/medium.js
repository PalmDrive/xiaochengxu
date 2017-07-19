// pages/medium/medium.js
const app = getApp(),
      util = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    medium: {},
    relatedMedia: [],
    relatedTopics: []
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

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this,
      mediumId = options.id;

    //获取文章数据
    wx.request({
      url: `${app.globalData.apiBase}/media/${mediumId}?fields[media]=title,picurl,summary,link,topics`,
      success(result) {
        const medium = result.data.data;

        // 把文章所属专题id放到medium.topicId
        const topicIds = Object.keys(medium.attributes.topics);
        medium.topicId = topicIds.length ? topicIds[0] : '';

        that.setData({
          medium
        });
      },
      fail() {
        console.log('medium page request medium data fail');
      }
    });
    //获取推荐文章
    wx.request({
      url: `${app.globalData.apiBase}/media/${mediumId}/related-media`,
      success(result) {
        const relatedMedia = result.data.data;
        relatedMedia.forEach(m => {
          // if (Object.keys(m.attributes.topics).length === 0) {
          //   delete m.attributes.topics;
          // } else {
          //   m.attributes.topic = m.attributes.topics[Object.keys(m.attributes.topics)[0]];
          // }

          if (m.attributes.publishedAt) {
            m.attributes.publishedAt = util.convertDate(new Date(m.attributes.publishedAt));
          } else {
            m.attributes.publishedAt = '';
          }
        });
        that.setData({
          relatedMedia
        });
      },
      fail() {
        console.log('medium page request related-media data fail');
      }
    });
    //获取推荐专题
    wx.request({
      url: `${app.globalData.apiBase}/media/${mediumId}/related-topics`,
      success(result) {
        const topics = result.data.data;
        topics.forEach(t => {
          if (t.attributes.lastMediumAddedAt) {
            t.attributes.lastMediumAddedAt = util.convertDate(new Date(t.attributes.lastMediumAddedAt));
          }
          if (t.attributes.lastMediumTitle) {
            t.attributes.lastMediumTitle = t.attributes.lastMediumTitle.slice(0, 15) + '...';
          }
        });
        that.setData({
          relatedTopics: topics
        });
      },
      fail() {
        console.log('medium page request related-topics data fail');
      }
    });
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