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
    mediumId: '',
    medium: {},
    relatedMedia: [],
    relatedTopics: [],
    loading: true,
    showHint: false
  },
  //事件处理函数
  goToTopic: util.goToTopic,
  goToMedium: util.goToMedium,
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
    that.setData({mediumId});

    Auth.getLocalUserId() && this._load();

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
    // console.log('onShow');
    const userId = Auth.getLocalUserId(),
      mediumId = this.data.mediumId;
    if (userId && mediumId) {
      // console.log('记录足迹');
      wx.request({
        method: 'POST',
        url: `${app.globalData.apiBase}/media/${mediumId}/views?from=miniProgram`,
        data: {
          data: {attributes: {userId}}
        },
        success(res) {},
        fail() {
          console.log('Medium page, onShow, record lastViewedAt fail');
        }
      });
    }
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
    const medium = this.data.medium,
      userInfo = Auth.getLocalUserInfo();
    util.gaEvent({
      cid: Auth.getLocalUserId(),
      ec: `article_title:${medium.attributes.title}, article_id:${medium.id}`,
      ea: 'share_article',
      el: `user_name:${userInfo.nickName}, user_id:${userInfo.openId}`,
      ev: 4
    });
    return {
      title: medium.attributes.title
    };
  },

  _load() {
    const mediumId = this.data.mediumId;
    wx.request({
      url: `${app.globalData.apiBase}/media/${mediumId}?fields[media]=htmlContent,title,topics,source,sourcePicUrl,author,publishedAt&from=miniProgram`,
      success: (result) => {
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
        WxParse.wxParse('htmlContent', 'html', decoded, this, 0);

        this.setData({
          medium,
          loading: false
        });

        util.ga({
          cid: Auth.getLocalUserId() || '555',
          dp: '%2FarticlePage_XiaoChengXu',
          dt: `article_title:${medium.attributes.title},article_id:${mediumId}`
        });
      },
      fail: () => {
        console.log('medium page request medium data fail');
      }
    });
  }
})