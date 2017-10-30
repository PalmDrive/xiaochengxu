const {request} = require('../../utils/request'),
      Auth = require('../../utils/auth'),
      {ga} = require('../../utils/util'),
      app = getApp(),
      baseUrl = app.globalData.apiBase;

Page({
  data: {
    album: null,
    processing: false
  },

  onShow() {
    if (this.data.album) {
      ga({
        cid: Auth.getLocalUserId(),
        dp: '%2FalbumBuyPage_XiaoChengXu',
        dt: `album_name:${this.data.album.name},album_id:${this.data.album.id}`
      });
    }
  },

  onLoad(options) {
    const albumId = options.id || '35cb43c0-994b-11e7-83e6-811feeb3ae13';
    request({
      url: `${baseUrl}/users/${albumId}?fields[users]=id,groupInfo,username`
    })
      .then(data => {
        const album = data.data.attributes.groupInfo;
        album.id = data.data.id;
        album.name = data.data.attributes.username;
        this.setData({
          album
        });

        ga({
          cid: Auth.getLocalUserId(),
          dp: '%2FalbumBuyPage_XiaoChengXu',
          dt: `album_name:${this.data.album.name},album_id:${this.data.album.id}`
        });
      });
  },

  buy() {
    const url = `${baseUrl}/wechat/pay/unifiedorder`,
          userInfo = Auth.getLocalUserInfo(),
          attrs = userInfo.attributes || {};

    if (this.data.processing) {
      return;
    }

    this.setData({processing: true});

    request({
      method: 'POST',
      url,
      data: {
        data: {
          totalFee: this.data.album.price,
          name: this.data.album.name,
          openid: attrs.wxOpenId,
          productId: this.data.album.id,
          productType: 'Album'
        }
      }
    })
      .then(data => {
        const params = {
          timeStamp: data.data.timeStamp,
          nonceStr: data.data.nonce_str,
          package: `prepay_id=${data.data.prepay_id}`,
          signType: 'MD5',
          paySign: data.data.paySign
        };

        console.log('params:');
        console.log(params);

        params.success = (res) => {
          console.log('wx requestPayment success');
          console.log(res);
          this.gotoAlbum();
        };
        params.fail = (err) => {
          console.log('wx requestPayment fail');
          console.log(err);
        };
        params.complete = () => {
          console.log('wx requestPayment complete');
          this.setData({processing: false});
        };
        wx.requestPayment(params);
      })
      .catch(err => {
        console.log('wechat unifiedorder request err:');
        console.log(err);
        this.setData({processing: false});
      });
  },

  gotoTrial() {
    const userId = this.data.album.id;
    wx.navigateTo({
      url: `../album/show?id=${userId}`
    });
  },

  gotoAlbum() {
    const userId = this.data.album.id;
    wx.redirectTo({
      url: `../album/show?id=${userId}`
    });
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    return {
      title: `七日辑: ${this.data.album.name}`
    };
  }
});