// pages/medium/medium.js
const app = getApp(),
      util = require('../../utils/util.js'),
      Auth = require('../../utils/auth.js'),
      WxParse = require('../../utils/wxParse/wxParse.js'),
      he = require('../../utils/he.js'),
      {request} = require('../../utils/request');

let albumId = null,
    index = null,
    morningPostId = null;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    mediumId: '',
    nextMediumId: '',
    prevMediumId: '',
    nextMediumType: '',
    prevMediumType: '',
    medium: {},
    relatedMedia: [],
    relatedTopics: [],
    loading: true,
    showHint: false,
    clientHeight: 0,
    mediumIndex: 1,
    mediumCount: 1,
    dayIndex: '',
    current: 0
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
    albumId = options.albumId;
    index = options.dayIndex;
    morningPostId = options.morningPostId;

    wx.getSystemInfo({
      success: function (res) {
        that.setData({clientHeight: res.windowHeight});
      }
    })
    that.setData({mediumId, dayIndex: index.replace('day', 'Day '), mediumIndex: options.mediumIndex, mediumCount: options.count});

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
    const userId = Auth.getLocalUserId(),
          mediumId = this.data.mediumId;

    util.mediumPageOnShow({
      userId,
      mediumId,
      albumId,
      index
    });
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

  gotoNext() {
    // TODO: add ga tracking
    let type = this.data.nextMediumType;
    if (this.data.nextMediumType !== 'video' && this.data.nextMediumType !== 'audio') {
      type = 'medium';
    }
    const url = `/pages/medium/${type}?id=${this.data.nextMediumId}&morningPostId=${morningPostId}&albumId=${albumId}&dayIndex=${index}&mediumIndex=${(parseInt(this.data.mediumIndex) + 1)}&count=${this.data.mediumCount}`;

    wx.redirectTo({url});
  },

  gotoPrev() {
    // TODO: add ga tracking

    let type = this.data.prevMediumType;
    if (this.data.prevMediumType !== 'video' && this.data.prevMediumType !== 'audio') {
      type = 'medium';
    }

    const url = `/pages/medium/${type}?id=${this.data.prevMediumId}&morningPostId=${morningPostId}&albumId=${albumId}&dayIndex=${index}&mediumIndex=${(parseInt(this.data.mediumIndex) - 1)}&count=${this.data.mediumCount}`;

    wx.redirectTo({url});
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const medium = this.data.medium,
      userInfo = Auth.getLocalUserInfo().attributes || {};
    util.gaEvent({
      cid: Auth.getLocalUserId(),
      ec: `article_title:${medium.attributes.title}, article_id:${medium.id}`,
      ea: 'share_article',
      el: `user_name:${userInfo.wxUsername}, user_id:${userInfo.openId}`,
      ev: 4
    });
    return {
      title: medium.attributes.title
    };
  },

  _load() {
    let url =  `${app.globalData.apiBase}/media/${this.data.mediumId}?fields[media]=htmlContent,title,topics,source,sourcePicUrl,author,publishedAt,metaData&meta[prev]=true`;
    if (morningPostId) {
      url += `&morningPostId=${morningPostId}`
    }
    const mediumId = this.data.mediumId;
    request({
      url
    }).then(result => {
      const medium = result.data,
        css = result.meta.css || '';

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
        nextMediumId: result.meta && result.meta.next,
        prevMediumId: result.meta && result.meta.prev,
        nextMediumType: result.meta && result.meta.nextMedium && result.meta.nextMedium.mediumType || '',
        prevMediumType: result.meta && result.meta.prevMedium &&result.meta.prevMedium.mediumType || '',
        medium,
        loading: false
      });

      util.ga({
        cid: Auth.getLocalUserId() || '555',
        dp: '%2FarticlePage_XiaoChengXu',
        dt: `article_title:${medium.attributes.title},article_id:${mediumId}`
      });
    }, () => {
      console.log('medium page request medium data fail');
    });
  },
 scroll: function(e) {
  if (e.detail.scrollTop < 1) {
    this.setData({ current: 0});
  }
   console.log('scroll y: ' + e.detail.scrollTop);
 }
})
