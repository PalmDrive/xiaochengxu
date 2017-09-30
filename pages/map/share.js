const {request} = require('../../utils/request'),
      Auth = require('../../utils/auth'),
      {toPromise} = require('../../utils/util'),
      app = getApp(),
      baseUrl = app.globalData.apiBase;

function onError(err) {
  wx.showModal({
    title: '错误',
    content: err.message || err
  });
  console.log(err);
}

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
    });
  },

  saveImage() {
    toPromise(wx.downloadFile)({
      url: this.data.imgUrls[this.data.imgIndex],
    })
    .then(res => {
      return toPromise(wx.saveImageToPhotosAlbum)({
        filePath: res.tempFilePath,
      });
    })
    .then(() => {
      wx.showToast({
        title: '保存成功'
      });
    })
    .catch(onError);
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