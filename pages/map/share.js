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
    const data = {
      scene: options.friendId,
      page: 'pages/map/map',
      title: `${options.username} 的吃货地图`,
      subtitle: `${options.username} 已经召集了 ${options.count} 个吃货，击败了全国66%的人`,
    };
    //console.log('share data:', data);
    request({
      url: `${baseUrl}/wechat/chihuo-map/share-img`,
      data
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
    this.data.imgUrls[this.data.imgIndex] = 'https://ailingual-production.oss-cn-shanghai.aliyuncs.com/pics/shar-img/59cf64e5ee920a0044c67492-1.png'
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