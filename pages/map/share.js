const {request} = require('../../utils/request'),
      Auth = require('../../utils/auth'),
      app = getApp(),
      baseUrl = app.globalData.apiBase;

Page({
  data: {
    imgUrls: [],
    imgIndex: 0
  },

  onLoad(options) {
    request({
      url: `${baseUrl}/wechat/chihuo-map/share-img`,
      data: {
        scene: 'hello',
        nickname: '昵称',
        page: 'pages/index/index',
        friendNum: 12,
        cityNum: 17
      }
    }).then(res => {
      this.setData({
        imgUrls: res.data
      });
    })
  },

  saveImage() {
    wx.downloadFile({
      url: this.data.imgUrls[this.data.imgIndex],
      success(res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success(res) {
            wx.showToast({
              title: '保存成功！'
            });
          }
        });
      }
    });
  },
  
  cancel() {

  },

  changeSlide(e) {
    this.setData({
      imgIndex: e.detail.current
    });
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {}
});