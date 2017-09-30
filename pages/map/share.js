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
    wx.showLoading({
      title: '生成中',
      mask: true
    });
    const userInfo = Auth.getLocalUserInfo();
    request({
      url: `${baseUrl}/wechat/chihuo-map/share-img`,
      data: {
        scene: options.friendId,
        page: 'pages/index/index',
        title: `${userInfo.attributes.wxUsername} 的吃货地图`,
        subtitle: `${userInfo.attributes.wxUsername} 在 12 名吃货的带领下吃遍了 17 个城市，快来扩充TA的吃货版图吧`,
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({
        imgUrls: res.data
      });
    })
    .catch(err => {
      wx.hideLoading();
      console.log(err);
    });
  },

  saveImage() {
    wx.showLoading({
      title: '下载保存中',
      mask: true
    });
    toPromise(wx.downloadFile)({
      url: this.data.imgUrls[this.data.imgIndex],
    })
    .then(res => {
      return toPromise(wx.saveImageToPhotosAlbum)({
        filePath: res.tempFilePath,
      });
    })
    .then(() => {
      wx.hideLoading();
      setTimeout(() => {
        wx.showToast({
          title: '保存成功'
        });
      }, 500);
    })
    .catch(err => {
      wx.hideLoading();
      onError(err);
    });
  },
  
  cancel() {
    wx.navigateBack();
  },

  changeSlide(e) {
    this.setData({
      imgIndex: e.detail.current
    });
  }
});