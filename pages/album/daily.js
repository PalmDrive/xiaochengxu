const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

let albumId = undefined,
    postId = undefined;

Page({
  data: {
    dayList: [],
    selectedIndex: 4,
    albumAttributes: {},
    editorInfo: {},
    post: {},
    survey: {},
    media: [],
    questionList: [],
    unlockedDays: 1,
    userSurveyAnswersCountMsg: '',
    answerList: [],
    userInfo: Auth.getLocalUserInfo().attributes,
    trial: false,
    shareAlert: false,
    // 选择的优惠券的id 默认是-1
    couponIndex: -1,
    coupon: null,
    // 用于 choice-coupon
    coupons: null,
    tempAlert: null,
    payView: false,
    processing: false
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    })
    const that = this;
    function init() {
      albumId = options.albumId;
      postId = options.postId;
      that.setData({trial: options.trial === 'true' ? true : false});
      Auth.getLocalUserId() && that._load();
    }

    // 免费得 判断是否是从好友的 二维码进入的
    if (options.scene) {
      options.scene = decodeURIComponent(options.scene);
      request({
        url: `${baseUrl}/scenes/${options.scene}`
      }).then(res => {
        options.albumId = res.data.attributes.productId;

        init();
        return request({
          method: 'POST',
          url: `${baseUrl}/referrals`,
          data: {
            data: {
              attributes: {
                refereeId: Auth.getLocalUserId(),
                productId: options.albumId,
                userId: res.data.attributes.createdBy
              }
            }
          }
        })
      }).then(res => {
        this.setData({
          shareAlert: {
            alert: true,
            username: res.included.attributes.username
          }
        });
      });
    } else {
      // 显示新手引导
      this.showGuide();
      init();
    }
  },

  /**
   * 加载数据
   */
  _load() {
    const url = `${app.globalData.apiBase}/albums/post`,
          data = {};
    if (albumId) data.albumId = albumId;
    if (postId) data.postId = postId;
    if (this.data.trial) data.isTrial = true;
    request({
      url, data
    }).then(res => {
      const albumAttributes = res.data.attributes || {},
            post = res.data.relationships.post.data || {},
            postRelationships = post.relationships || {};
      albumId = res.data.id;
      postId = post.id;
      this.setData({
        albumAttributes,
        editorInfo: albumAttributes.editorInfo,
        post,
        media: postRelationships.media ? postRelationships.media.data : [],
        selectedIndex: post.attributes && post.attributes.dayIndex,
        dayList: res.meta.checkinStatus,
        unlockedDays: res.meta.unlockedDays
      });

      // 加载任务
      this._loadSurvey();
    });
  },

  /**
   * 加载数据
   */
  _loadSurvey() {
    request({
      url: `${app.globalData.apiBase}/morning-posts/${postId}/survey?albumId=${albumId}`,
    }).then(res => {
      const count = res.meta ? res.meta.userSurveyAnswersCount : 0;
      let msg = `已提交${count}人`;
      if (count === 0) {
        msg = '成为第1个提交任务的人吧';
      }

      let questionList = res.included ? res.included.filter(res => res.type === 'SurveyQuestions') : [];
      let answerList = res.included ? res.included.filter(res => res.type === 'userSurveyAnswers') : [];

      if (answerList.length > 0 ) {
        answerList = answerList[0].attributes.answers;
        questionList.map(res => {
          answerList.filter(answer => {
             if (answer.surveyQuestionId === res.id) {
               res.answerPics = answer.pics;
               res.answerContent = answer.content;
             }
          })
          return res;
        });
      }

      this.setData({
        survey: res.data,
        questionList,
        answerList,
        userSurveyAnswersCountMsg: msg
      });
    });
  },

/**
  * 分享给好友 事件
  */
 onShareAppMessage: function () {
    return {
      title: `七日辑: ${this.data.albumAttributes.title}`
    };
  },

  goToPost: function(event) {
    const index = event.currentTarget.dataset.index,
          newPostId = this.data.albumAttributes.postIds[index]

    if (index < this.data.unlockedDays && this.data.selectedIndex - 1 !== index) {
      this.setData({
        selectedIndex: index + 1
      })
      postId = newPostId;
      albumId = albumId;
      this._load();
    }
  },

  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          index = this.data.selectedIndex,
          idx = event.currentTarget.dataset.idx,
          count = this.data.media.length,
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
            ea: 'click_article_in_albumShowPage',
            el: `album_name:${this.data.albumAttributes.title},album_id:${this.data.albumId}`,
            ev: 0
          };
    const key = 'day' + index;
    util.goToMedium(event, gaOptions, {
      dayIndex: key,
      mediumIndex: idx + 1,
      count: count,
      albumId: albumId,
      morningPostId: postId
    });
  },

  goToAlbumDetail: function(event) {
    wx.navigateTo({
      url: `./show?showDetail=true&id=${albumId}`
    });
  },

  goToSurveyDetail: function(event) {
    wx.navigateTo({
      url: `../survey/edit?postId=${postId}&albumId=${albumId}`
    });
  },


    buy() {
      const price = this.data.coupon ? (this.data.albumAttributes.price - this.data.coupon.quota) : this.data.albumAttributes.price;

      // 使用完优惠券是否是0元
      if (price <= 0) {
        return this._useCoupon()
        .then(res => {
          return Promise.all([
            this._unlockAlubm(),
            addAlbumId(albumId) // important, update the _albumIdsMap cache
          ]);
        })
        .then(res => {
          if (this.data.albumAttributes.metaData.programStartAt) {
            wx.redirectTo({
              url: `/pages/album/daily?albumId=${albumId}`
            });
          } else {
            loadData(albumId)
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
            productId: albumId,
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
              addAlbumId(albumId) // important, update the _albumIdsMap cache
            ])
              .then(() => {
                this._load();
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
          albumId: albumId
        }
      }).then(res => {
        console.log(res);
      });
    },
    // 解锁
    _unlockAlubm() {
      return request({
        url: `${app.globalData.apiBase}/albums/${albumId}/unlock`,
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
          albumId: albumId
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
    }
})
