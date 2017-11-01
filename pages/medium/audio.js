const app = getApp(),
      util = require('../../utils/util.js'),
      Auth = require('../../utils/auth.js'),
      WxParse = require('../../utils/wxParse/wxParse.js'),
      he = require('../../utils/he.js'),
      {request} = require('../../utils/request');

let albumId = null,
    index = null;

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
    videoSize: {},
    isAudioShow: true,
    css: '',
    toView: '#',
    isPlaying: false,
    nowTime: '00:00',
    totalTime: '00:00'
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
        height: sysInfo.screenHeight
      }
    });

    Auth.getLocalUserId() && this._load();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
   onReady: function (e) {
     // 使用 wx.createAudioContext 获取 audio 上下文 context
    //  this.audioCtx = wx.createAudioContext('myAudio')
    let manager = wx.getBackgroundAudioManager();
    manager.onWaiting(() => {
      if (this.data.selectedMedium && manager.src === this.data.selectedMedium.attributes.video) {
        wx.showLoading({
          mask: true,
          title: '加载中..',
        })
      }
    })

    manager.onTimeUpdate(() => {

      if (this.data.selectedMedium && manager.src === this.data.selectedMedium.attributes.video) {
        wx.hideLoading()
        this.setData({
          nowTime: util.convertTime(manager.currentTime),
          isPlaying: true
        });
      }
    })
    manager.onEnded(() => {
      if (this.data.selectedMedium && manager.src === this.data.selectedMedium.attributes.video) {
        this.setData({
          isPlaying: false
        });

        const media = this.data.media;
        let index = media.indexOf(getSelectedMedium(media));
        if (index >= 0 && index < media.length - 1) {
          index ++;
          media.forEach(m => m.selected = m.id === media[index].id);
          this.setData({
            media,
            selectedMedium: media[index]
          });
          this.play()
        }
      }
    })
    // manager.onPause((e) => {
    //   console.log(e)
    //   wx.showLoading({
    //     title: e,
    //   })
    // })
    //
    // manager.onStop((e) => {
    //   wx.showLoading({
    //     title: e,
    //   })
    // })
    //
    // manager.onError((e) => {
    //   wx.showLoading({
    //     title: e,
    //   })
    // })
    //
    // wx.onBackgroundAudioPause(() => {
    //   wx.showLoading({
    //     title: e
    //   })
    // })
    //
    // wx.onBackgroundAudioStop(() => {
    //   wx.showLoading({
    //     title: e + 'stop'
    //   })
    // })

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

    let index = 0;
    media.forEach((m,i) => {
      m.selected = m.id === id;
      if (m.id === id) {
        index = i;
      }
    });
    this.setData({
      media,
      selectedMedium: getSelectedMedium(media),
      toView: `content-${index}`
    });
    this.audioCtx.pause();
    const src = getSelectedMedium(media).attributes.video;
    if (src) {
      this.audioCtx.setSrc(src);
      this.play();
    }
  },

  _load() {
    wx.showLoading({
      title: '加载中..',
    })
    const mediumId = this.data.mediumId;
    request({
      url: `${app.globalData.apiBase}/media/${mediumId}?fields[media]=mediumType,htmlContent,title,duration,relatedArticles,video,author&meta[prev]=true&css=true`
    }).then(result => {
      wx.hideLoading()
      let media = result.data,
          css = result.meta.css;

      if (!Array.isArray(media)) {
        media = [media];
      }
      // media = media.splice(0, 1);

      let html = '';
      // select the first video
      media[0].selected = true;
      media.forEach((m,i) => {
        m.attributes.durationString =    util.convertTime(m.attributes.duration);
        let tip = `第${(i + 1)}节文稿: `
        if (media.length === 1) {
          tip = '';
        }
        m.attributes.tipTitle = `${tip}${m.attributes.title}`

        let content = `<div class="audio-text-content">${he.decode(m.attributes.htmlContent)}</div>`;
        WxParse.wxParse('htmlContent' + i, 'html', content, this, 0);
        if (i === media.length - 1) {
          WxParse.wxParseTemArray("htmlContentArray",'htmlContent', media.length, this);
        }
      });

      this.setData({
        nextMediumId: result.meta && result.meta.next,
        prevMediumId: result.meta && result.meta.prev,
        media,
        selectedMedium: getSelectedMedium(media),
        loading: false,
        css
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
  clickText() {
    this.setData({isAudioShow: false});
  },
  clickAudio() {
    this.setData({isAudioShow: true});
  },
  gotoNext() {
    // TODO: add ga tracking
    const url = `/pages/medium/audio?id=${this.data.nextMediumId}&morningPostId=${morningPostId}&albumId=${albumId}`;

    wx.redirectTo({url});
  },

  gotoPrev() {
    // TODO: add ga tracking
    const url = `/pages/medium/audio?id=${this.data.prevMediumId}&morningPostId=${morningPostId}&albumId=${albumId}`;

    wx.redirectTo({url});
  },

  playOrPause() {
    if (this.data.selectedMedium) {
      let nowState = !this.data.isPlaying;
      this.setData({
        isPlaying: nowState
      });
      if (nowState) {
        this.play();
      } else {
        wx.pauseBackgroundAudio();
      }
    }
  },

  play() {

    let attr = this.data.selectedMedium.attributes;
    wx.playBackgroundAudio({
      dataUrl: attr.video,
      title: attr.title,
      coverImgUrl: '',
      singer: attr.author
    })
  }
})
