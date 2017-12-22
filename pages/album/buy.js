const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    graphql = require('../../utils/graphql'),
    {addAlbumId} = require('../../utils/user'),
    baseUrl = app.globalData.apiBase,
    WxParse = require('../../utils/wxParse/wxParse.js'),
    he = require('../../utils/he.js');

function loadData(id) {
  // return request({
  //   url: `${app.globalData.apiBase}/albums/${id}?app_name=${app.globalData.appName}`,
  // });
  let param = `{
    albums(id: "${id}") {
      id,
      title,
      picurl,
      editorInfo,
      metaData,
      price,
      postIds,
      description,
      catalog,
      programStartAt,
      programPromoteAt,
      descriptionHtmlContent
    },
    userAlbum(userId: "${Auth.getLocalUserId()}", albumId: "${id}") {
      role
    }
  }`;

  return graphql(param);
}

const PAID_USER_ROLE = 2;
let _showPaymentModal = false;

Page({
  data: {
    albumId: null,
    albumAttributes: {},
    metaData: {},
    loadingStatus: 'LOADING', // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
    didUserPay: false, // 用户是否已经购买
    groupInfo: {},
    showHint: false,
    modalShown: false,
    qrcodeModalHidden: true,
    processing: false,
    editorInfo: {},
    catalog: [],
    trial: false,
    role: 0,
    username: '',
    dayLogs: {},
    shareAlert: false,
    // 选择的优惠券的id 默认是-1
    couponIndex: -1,
    coupon: null,
    // 用于 choice-coupon
    coupons: null,
    tempAlert: null,
    programStartAt: 0,
    selectedIndex: 0,
    screenHeight: 667,
    toView: '#',
    showDetail: false // 只是展示七日辑详情 (购买页面没有底部的bar)
  },

  //关闭首次登陆弹窗
  closeHint: function () {
    util.closeHint(this);
  },

  onLoad(options) {
    _showPaymentModal = options.showPaymentModal === 'true';

    const updates = {
            albumId: options.id,
            trial: options.trial,
            loadingStatus: 'LOADING'
          },
          that = this;

    this.setData({
      showDetail: options.showDetail
    });

    this.getTempAlert();
    this.getScenes(options);

  },

  onShow(e) {
    if (this.data.albumAttributes.title) {
      util.ga({
        cid: Auth.getLocalUserId(),
        dp: '%2FalbumShowPage_XiaoChengXu',
        dt: `album_name:${this.data.albumAttributes.title},album_id:${this.data.albumId}`
      });
    }
  },

  /**
   * 加载数据
   */
  _load() {
    loadData(this.data.albumId)
      .then(this._onLoadSuccess);
  },
  /**
   * 数据加载 成功 回调
   */
  _onLoadSuccess: function (res) {
    // 找到已解锁到第几天
    const role = res.data.userAlbum ? res.data.userAlbum.role : 0;

    let updates = {};

    const attributes = res.data.albums ? res.data.albums[0] : {},
          metaData = attributes.metaData;
    if (attributes.descriptionHtmlContent) {
      const html = attributes.descriptionHtmlContent,
        decoded = he.decode(html);
      WxParse.wxParse('htmlContent', 'html', decoded, this, 0);
    }
    updates.albumAttributes = attributes;
    updates.metaData = metaData;
    updates.programStartAt = attributes.programStartAt || 0;
    updates.editorInfo = attributes.editorInfo;
    updates.catalog = attributes.catalog;
    updates.loadingStatus = null;
    updates.role = role;
    updates.didUserPay = role === 2 || role === 1;

    this.setData(updates);

    // 设置标题
    wx.setNavigationBarTitle({
      title: updates.title
    });

    let gaName = '%2FalbumBuyPage_XiaoChengXu';
    if (!updates.didUserPay) {
      gaName = '%2FalbumShowPage_XiaoChengXu';
    }
    util.ga({
      cid: Auth.getLocalUserId(),
      dp: gaName,
      dt: `album_name:${this.data.albumAttributes.title},album_id:${this.data.albumId}`
    });

    if (_showPaymentModal && !updates.didUserPay) {
      this.showPay();
    }
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    const title = this.data.albumAttributes.title;
    return {
      title: `七日辑: ${title}`
    };
  },

  buy() {
    const price = this.data.coupon ? (this.data.albumAttributes.price - this.data.coupon.quota) : this.data.albumAttributes.price;

    // 使用完优惠券是否是0元
    if (price <= 0) {
      return this._useCoupon()
      .then(res => {
        return Promise.all([
          this._unlockAlubm(),
          addAlbumId(this.data.albumId) // important, update the _albumIdsMap cache
        ]);
      })
      .then(res => {
        if (this.data.programStartAt) {
          wx.redirectTo({
            url: `/pages/album/daily?albumId=${this.data.albumId}`
          });
        } else {
          loadData(this.data.albumId)
            .then(this._onLoadSuccess)
            .then(res => {
              this.setData({
                trial: false,
                processing: false,
                payView: false,
              });
            });
        }
      });
    }

    const url = `${baseUrl}/wechat/pay/unifiedorder?name=days7`,
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
          totalFee: price,
          name: this.data.albumAttributes.title,
          openid: attrs.wxOpenId,
          productId: this.data.albumId,
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

        // console.log('params:');
        // console.log(params);

        params.success = (res) => {
          console.log('wx requestPayment success');
          console.log(res);
          this.setData({
            trial: false,
            payView: false
          });
          Promise.all([
            this.data.coupon && this._useCoupon(),
            addAlbumId(this.data.albumId) // important, update the _albumIdsMap cache
          ])
            .then(() => {
              if (this.data.programStartAt) {
                wx.redirectTo({
                  url: `/pages/album/daily?albumId=${this.data.albumId}`
                });
              } else {
                wx.redirectTo({
                  url: `/pages/album/show?id=${this.data.albumId}`
                });
              }
            });
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
        wx.showToast({
          title: '哎呀，出错了',
          icon: 'loading'
        });
        this.setData({processing: false});
      });
  },

  // 显示支付的 底部 弹窗
  showPay () {
    this.findCoupon()
    .then(d => {
      if (this.data.coupons.length > 0) {
        this.setData({
          payView: true,
          couponIndex: 0,
          coupon: this.data.coupons[0]
        });
      } else {
        this.setData({
          payView: true
        });
      }
    });
  },
  // 隐藏 支付页面
  hidePay () {
    this.setData({
      payView: false
    });
  },
  none (event) {
    console.log(event);
    return null;
  },

  gotoTrial() {
    const albumId = this.data.albumId;
    let url = `../album/show?id=${albumId}&trial=${true}`;

    if (this.data.albumAttributes.programStartAt) {
      url = `../album/daily?albumId=${albumId}&trial=true`;
    }
    wx.navigateTo({url});
  },

  gotoFree() {
    wx.navigateTo({
      url: `../album/free?id=${this.data.albumId}&imgUrl=${this.data.albumAttributes.picurl}`
    });
  },

  closeAlert(options) {
    if (options.currentTarget.dataset.type === 'guide') {
      const showed = Auth.getLocalShowed();
      showed.freeGuide = true
      Auth.setLocalShowed(showed);
    }
    this.setData({
      shareAlert: null
    });
  },
  showGuide() {
    const showed = Auth.getLocalShowed();
    if (showed.freeGuide) {
      this.setData({
        shareAlert: null
      });
    } else if (this.data.shareAlert) {
      this.setData({
        shareAlert: {
          guide: true
        }
      });
    }
  },
  // 选择优惠券
  gotoChoiceCoupon() {
    wx.navigateTo({
      url: `../album/choice-coupon?coupons=${JSON.stringify(this.data.coupons)}`
    });
  },
  // 使用优惠券
  _useCoupon() {
    return request({
      url: `${app.globalData.apiBase}/user-coupons/${this.data.coupon.userCouponId}/redeem`,
      method: 'POST',
      data: {
        albumId: this.data.albumId
      }
    }).then(res => {
      console.log(res);
    });
  },
  // 解锁
  _unlockAlubm() {
    // return request({
    //   url: `${app.globalData.apiBase}/albums/${this.data.albumId}/unlock`,
    //   method: 'POST',
    //   data: {
    //   }
    // }).then(res => {
    //   console.log(res);
    // });

    let param = `
      mutation {
        userAlbumUnlock(albumId: "${this.data.albumId}", userId: "${Auth.getLocalUserId()}") {
          id
        }
      }
    `;

    return graphql(param).then(res => {
      console.log(res);
    });
  },

  // 查账 coupons
  findCoupon: function () {
    // return request({
    //   url: `${baseUrl}/user-coupons`,
    //   data: {
    //     redeemedAt: true,
    //     albumId: this.data.albumId
    //   },
    //   method: 'GET'
    // }).then(res => {


    let param = `{
      userCoupons(albumId: "${this.data.albumId}", ownerId: "${Auth.getLocalUserId()}",redeemedAt: true) {
        id,
        displayName,
        Coupon {
          id,
          expiredAt,
          albumId,
          value,
        }
      }
    }`;

    return graphql(param).then(res => {
      const userCoupons = res.data.userCoupons;
      const couponsData = userCoupons.map(d => {
        const coupon = d.Coupon || {};
        return {
          couponId: coupon.id,
          userCouponId: d.id,
          quota: coupon.value,
          name: d.displayName,
          validityTerm: `有效期至${this._formatDateToDay(new Date(coupon.expiredAt))}`,
          range: coupon.albumId ? `仅限购买“${d.displayName}”` : '全场通用，最高折扣50元',
        }
      });
      this.setData({
        coupons: couponsData
      });
      return res.data;
    });
  },

  /**
   * @return 'xxxx年x月x日'
   */
  _formatDateToDay(date) {
    const year = date.getFullYear(),
          month = date.getMonth() + 1,
          day = date.getDate();
    return year + '-' + month + '-' + day;
  },
  tempAlertClose: function () {
    this.setData({
      tempAlert: null
    });
  },
  tempAlertGoList: function () {
    this.setData({
      tempAlert: null
    });
  },
  changeTab: function(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'category') {
      this.setData({
        toView: 'category',
        selectedIndex: 1
      });
    } else {
      this.setData({
        toView: '#',
        selectedIndex: 0
      });
    }
  },

  getTempAlert() {
    /* 免费得七日辑 start */
    this.data.tempAlert && this.setData({
      tempAlert: null
    });
    if (this.data.tempAlert === false) {
      this.setData({
        tempAlert: false
      });
    } else {
      // request({
      //   url: `${baseUrl}/users/temp-alert`,
      // }).then(d => {
      let param = `{
        users(id: "${Auth.getLocalUserId()}") {
          id,tempAlert,isSubscribedWX
        }
      }`;

      return graphql(param).then(d => {
        const obj = d.data.users ? d.data.users[0] : undefined;
        if (obj) {
          this.setData({
            tempAlert: obj.tempAlert
          });
        }

        if (obj.isSubscribedWX) {
          Auth.setLocalKey( `isSubscribedWX`, obj.isSubscribedWX + "")
        }
      })
    }
    /* 免费得七日辑 end */
  },

  pageInit(options) {
    const updates = {
            albumId: options.id,
            trial: options.trial,
            loadingStatus: 'LOADING'
          },
          that = this;

    wx.getSystemInfo({
      success(res) {
        updates.username = Auth.getLocalUserInfo().attributes.wxUsername;
        updates.screenHeight = res.windowHeight
        that.setData(updates);
        Auth.getLocalUserId() && that._load();
      },
      fail() {
        that.setData(updates);
      }
    });
  },

  getScenes(options) {
    options.scene = '1509356068e6hjsieiadak1x4unmi';
    // 免费得 判断是否是从好友的 二维码进入的
    if (options.scene) {
      // options.scene = decodeURIComponent(options.scene);
      options.scene = '1509356068e6hjsieiadak1x4unmi';
      // request({
      //   url: `${baseUrl}/scenes/${options.scene}`
      // }).then(res => {
      //
      let param = `{
        scenes(uuid: "${options.scene}") {
          id,uuid,productId,createdBy
        }
      }`;

      return graphql(param).then(res => {
        const obj = res.data.scenes ? res.data.scenes[0] : {};
        options.id = obj.productId || '';
        this.setData({
          id: options.id
        });
        this.pageInit(options);

        let param = `
          mutation {
            referral(userId: "${obj.createdBy}", refereeId: "${Auth.getLocalUserId()}", productId: "${this.data.albumId}") {
              id,User{
                wxUsername,username
              }
            }
          }
        `;

        return graphql(param);
        // return request({
        //   method: 'POST',
        //   url: `${baseUrl}/referrals`,
        //   data: {
        //     data: {
        //       attributes: {
        //         refereeId: Auth.getLocalUserId(),
        //         productId: this.data.albumId,
        //         userId: obj.createdBy
        //       }
        //     }
        //   }
        // })
      }).then(res => {
        let user = res.data.referral.User || {};
        this.setData({
          shareAlert: {
            alert: true,
            username: user.username || user.wxUsername
          }
        });
      });
    } else {
      // 显示新手引导
      this.showGuide();
      this.pageInit(options);
    }
  }
})
