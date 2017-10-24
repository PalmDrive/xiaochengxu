const app = getApp(),
      util = require('../../utils/util.js'),
      Auth = require('../../utils/auth.js'),
      WxParse = require('../../utils/wxParse/wxParse.js'),
      he = require('../../utils/he.js'),
      {request} = require('../../utils/request');

let albumId = null;
let index = null;

function getSelectedMedium(media) {
  return media.filter(m => m.selected)[0];
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    mediumId: '',
    media: [],
    selectedMedium: null,
    loading: true,
    videoSize: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this,
      mediumId = options.id,
      heightToWidth = 0.75;

    albumId = options.albumId;
    index = options.idx;

    const sysInfo = wx.getSystemInfoSync();

    that.setData({
      mediumId,
      videoSize: {
        width: sysInfo.windowWidth,
        height: heightToWidth * sysInfo.windowWidth
      }
    });

    Auth.getLocalUserId() && this._load();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
   onReady: function (e) {
     // 使用 wx.createAudioContext 获取 audio 上下文 context
     this.audioCtx = wx.createAudioContext('myAudio')
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

  selectMedium(e) {
    const media = this.data.media,
          id = e.currentTarget.dataset.itemid;

    media.forEach(m => m.selected = m.id === id);
    this.setData({
      media,
      selectedMedium: getSelectedMedium(media)
    });
    this.audioCtx.play()
  },

  _load() {
    const mediumId = this.data.mediumId;
    request({
      url: `${app.globalData.apiBase}/media/${mediumId}?from=miniProgram`
    }).then(result => {
      let media = result.data;

      if (!Array.isArray(media)) {
        media = [media];
      }

      // select the first video
      media[0].selected = true;
      media.forEach(m => m.attributes.durationString = util.convertTime(m.attributes.duration));
      this.setData({
        media,
        selectedMedium: getSelectedMedium(media),
        loading: false
      });

      // util.ga({
      //   cid: Auth.getLocalUserId() || '555',
      //   dp: '%2FarticlePage_XiaoChengXu',
      //   dt: `article_title:${medium.attributes.title},article_id:${mediumId}`
      // });
    }, () => {
      console.log('medium page request medium data fail');
    });
  },
  endedEvent() {
    const media = this.data.media;
    let index = media.indexOf(getSelectedMedium(media));
    if (index >= 0 && index < media.length - 1) {
      index ++;
      media.forEach(m => m.selected = m.id === media[index].id);
      this.setData({
        media,
        selectedMedium: media[index]
      });
      this.audioCtx.play()
    }
  },
  audioPlay: function () {
    this.audioCtx.play()
  },
  audioPause: function () {
    this.audioCtx.pause()
  },
  audio14: function () {
    this.audioCtx.seek(14)
  },
  audioStart: function () {
    this.audioCtx.seek(0)
  }
})
