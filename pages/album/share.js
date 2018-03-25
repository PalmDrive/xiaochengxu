const {request} = require('../../utils/request'),
      AV = require('../../utils/av-weapp-min'),
      Auth = require('../../utils/auth'),
      {toPromise} = require('../../utils/util'),
      app = getApp(),
      baseUrl = app.globalData.apiBase,
      graphql = require('../../utils/graphql');

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
    if (options.capsuleId && options.imgUrl === 'null') {
      this.loadByCapsuleId(options.capsuleId);
    }

    if (!options.id && options.imgUrl) {
      this.setData({
        imgUrl: options.imgUrl.replace('http:','https:')
      });
      return;
    }

    wx.showLoading({
      title: '生成中',
      mask: true
    });

    if (options.id) {
      this.loadById(options.id);
    }

    if (options.couponId) {
      const appName = options.appName || 'qaXiaochengxu';
      this._getSharedPoster(appName, options.couponId)
        .then(poster => {
          this.setData({
            imgUrl: poster.picUrl.replace('http', 'https')
          });
          wx.hideLoading();
        });
    }
  },

  loadByCapsuleId(capsuleId) {
    let param = `
      query TimeCapsules($id: ID) {
        timeCapsules (id: $id) {
          id,
          sharedPicurl,
        }
      }
    `;

    graphql(param, {"id": capsuleId}).then(res => {
      console.log(res);
      const timeCapsules = res.data.timeCapsules || [],
      timeCapsule = timeCapsules.length > 0 ? timeCapsules[0] : {},
      url = timeCapsule.sharedPicurl;

      if (!url) {
        const that = this;
        setTimeout(() => {
          that.loadByCapsuleId(capsuleId);
        }, 3000);
      } else {
        this.setData({
          imgUrl: url.replace('http:','https:')
        });
        wx.hideLoading();
        return;
      }
    });
  },

  loadById(id) {
    request({
      method: 'POST',
      url: `${baseUrl}/users/${Auth.getLocalUserId()}/referral-cards?app_name=days7Xiaochengxu`,
      data: {
        data: {
          productId: id,
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
  },

  _getSharedPoster(appName, couponId) {
    const query = `mutation {
      sharedPoster(appName: "${appName}", couponId: "${couponId}") {
        userId, picUrl
      }
    }`;
    return graphql(query)
      .then(res => res.data.sharedPoster);
  }
});
