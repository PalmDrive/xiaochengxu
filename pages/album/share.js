const {request} = require('../../utils/request'),
      AV = require('../../utils/av-weapp-min'),
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
    imgUrl: null
  },

  onLoad(options) {
    console.log(options);
    wx.showLoading({
      title: '生成中',
      mask: true
    });
    request({
      method: 'POST',
      url: `${baseUrl}/users/${Auth.getLocalUserId()}/referral-cards?appName=days7Xiaochengxu`,
      data: {
        data: {
          productId: options.id,
          productType: 'Album' 
        }
      }
    }).then(res => {
      console.log(res);
      wx.hideLoading();
      this.setData({
        imgUrl: res.data.picurl.replace('http:','https:')
      });
    });
  },

  saveImage() {
    wx.showLoading({
      title: '下载保存中',
      mask: true
    });
    toPromise(wx.downloadFile)({
      url: this.data.imgUrl,
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
  }
});