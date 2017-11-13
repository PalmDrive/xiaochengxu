const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    {addAlbumId} = require('../../utils/user'),
    baseUrl = app.globalData.apiBase;

Component({

  behaviors: [],

  properties: {
    price: {
      type: Number
    },
    programStartAt: {
      type: Number
    },
    albumId: {
      type: String
    },
    title: {
      type: String
    }
  },
  data: {
    // 选择的优惠券的id 默认是-1
    couponIndex: -1,
    coupon: null,
    // 用于 choice-coupon
    coupons: null,
    tempAlert: null,
    payView: false,
    processing: false
  }, // 私有数据，可用于模版渲染

  // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
  attached: function(){

  },
  moved: function(){},
  detached: function(){},

  methods: {
    buy() {
      const price = this.data.coupon ? (this.properties.price - this.data.coupon.quota) : this.properties.price;

      // 使用完优惠券是否是0元
      if (price <= 0) {
        return this._useCoupon()
        .then(res => {
          return Promise.all([
            this._unlockAlubm(),
            addAlbumId(this.properties.albumId) // important, update the _albumIdsMap cache
          ]);
        })
        .then(res => {
          if (this.properties.programStartAt) {
            wx.redirectTo({
              url: `/pages/album/daily?albumId=${this.properties.albumId}`
            });
          } else {
            loadData(this.properties.albumId)
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
            name: this.properties.title,
            openid: attrs.wxOpenId,
            productId: this.properties.albumId,
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
              addAlbumId(this.properties.albumId) // important, update the _albumIdsMap cache
            ])
              .then(() => {
                if (this.properties.programStartAt) {
                  wx.redirectTo({
                    url: `/pages/album/daily?albumId=${this.properties.albumId}`
                  });
                } else {
                  loadData(this.properties.albumId)
                    .then(this._onLoadSuccess);
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
          albumId: this.properties.albumId
        }
      }).then(res => {
        console.log(res);
      });
    },
    // 解锁
    _unlockAlubm() {
      return request({
        url: `${app.globalData.apiBase}/albums/${this.properties.albumId}/unlock`,
        method: 'POST',
        data: {
        }
      }).then(res => {
        console.log(res);
      });
    },

    // 查账 coupons
    findCoupon: function () {
      return request({
        url: `${baseUrl}/user-coupons`,
        data: {
          redeemedAt: true,
          albumId: this.properties.albumId
        },
        method: 'GET'
      }).then(res => {
        const coupons = {};
        res.included && res.included.map(c => {
          if (c.type = 'Coupons') {
            coupons[c.id] = c;
          }
        });
        const couponsData = res.data.map(d => {
          return {
            couponId: coupons[d.relationships.coupon.data.id].id,
            userCouponId: d.id,
            quota: coupons[d.relationships.coupon.data.id].attributes.value,
            name: d.attributes.displayName,
            validityTerm: `有效期至${this._formatDateToDay(new Date(coupons[d.relationships.coupon.data.id].attributes.expiredAt))}`,
            range: coupons[d.relationships.coupon.data.id].attributes.albumId ? `仅限购买“${coupons[d.relationships.coupon.data.id].attributes.albumId}”` : '全场通用，最高折扣50元',
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
      this.data.tempAlert = false;
    },
  }

})
