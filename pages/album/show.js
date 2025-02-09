const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    graphql = require('../../utils/graphql'),
    {addAlbumId} = require('../../utils/user'),
    baseUrl = app.globalData.apiBase;

function loadData(id) {
  return request({
    url: `${app.globalData.apiBase}/albums/${id}?app_name=${app.globalData.appName}`,
  });
}

function loadUserData(id) {
  return request({
    url: `${app.globalData.apiBase}/albums/${id}/relationships/users`
  });
}

const PAID_USER_ROLE = 2;

Page({
  data: {
    userRole: null,
    albumId: null,
    album: {},
    albumAttributes: {},
    loadingStatus: 'LOADING', // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
    posts: [],
    didUserPay: false, // 用户是否已经购买
    groupInfo: {},
    showHint: false,
    modalShown: false,
    qrcodeModalHidden: true,
    bannerImage: {},
    current: 0,
    author: {},
    subscribers: [],
    subscribersCount: 0,
    processing: false,
    editorInfo: {},
    // catalog: [],
    trial: false,
    role: 0,
    hideAchieveTip: true,
    achieveProcess: 0,
    hideAchieveCard: true,
    username: '',
    dayLogs: {},
    shareAlert: false,
    // 选择的优惠券的id 默认是-1
    couponIndex: -1,
    coupon: null,
    // 用于 choice-coupon
    coupons: null,
    tempAlert: null,
    payView: false,
    programStartAt: 0,
    selectedIndex: 0,
    // descriptionPicUrl: '',
    // targetAudience: '',
    // buyNotes: '',
    toView: '#',
    screenHeight: 667,
    wxQrcode: {
      url: '../../images/paid-group/qrcode_qiriji.jpg',
      msg: '关注微信公众号「七日辑」,我们为您推送更新',
      title: '开启推送'
    }
  },

  //关闭首次登陆弹窗
  closeHint: function () {
    util.closeHint(this);
  },

  onLoad(options) {
    /* 免费得七日辑 start */
    this.data.tempAlert && this.setData({
      tempAlert: null
    });
    if (this.data.tempAlert === false) {
      this.setData({
        tempAlert: false
      });
    } else {
      request({
        url: `${baseUrl}/users/temp-alert`,
      }).then(d => {
        // d = {data:{title:"恭喜你!",content:"已经有5位朋友帮助了你\n恭喜免费获取\n《7天告别爵士乐小白》",link:"/pages/album/show?id=1b259840-b23c-11e7-8905-3f3cfcde362a","type":"referral","picurl":"http://ailingual-production.oss-cn-shanghai.aliyuncs.com/pics/%E4%B8%83%E6%97%A5%E8%BE%91/%E7%95%99%E5%AD%A6%E5%B0%8F%E7%99%BD%E5%A6%82%E4%BD%95%E5%8F%98%E8%BA%AB%E8%80%81%E5%8F%B8%E6%9C%BA/banner%E5%9B%BE.jpg"}}
        if (d.data) {
          this.setData({
            tempAlert: d.data
          });
        }

        if (d.meta) {
          Auth.setLocalKey(`isSubscribedWX`, String(d.meta.isSubscribedWX));
        }
      })
    }
    /* 免费得七日辑 end */

    //console.log(getCurrentPages()[1]);
    const bannerImageRatio = 375 / 400, // width / height
          updates = {
            albumId: options.id,
            trial: options.trial,
            loadingStatus: 'LOADING'
          },
          that = this;

    this.setData({
      userRole: Auth.getLocalUserInfo().attributes.role
    });
    function init() {
      //console.log(getCurrentPages()[1]);
      const bannerImageRatio = 375 / 400, // width / height
            updates = {
              albumId: options.id,
              trial: options.trial,
              loadingStatus: 'LOADING'
            };
      //console.log(this);
      wx.getSystemInfo({
        success(res) {
          updates.bannerImage = {height: res.windowWidth / bannerImageRatio};
          updates.username = Auth.getLocalUserInfo().attributes.wxUsername;
          updates.screenHeight = res.windowHeight
          that.setData(updates);
          Auth.getLocalUserId() && that._load();
        },
        fail() {
          updates.bannerImage = {height: 400};
          that.setData(updates);
        }
      });
    }

    // 免费得 判断是否是从好友的 二维码进入的
    if (options.scene) {
      options.scene = decodeURIComponent(options.scene);
      request({
        url: `${baseUrl}/scenes/${options.scene}`
      }).then(res => {
        options.id = res.data.attributes.productId;
        this.setData({
          id: options.id
        });
        init();
        return request({
          method: 'POST',
          url: `${baseUrl}/referrals`,
          data: {
            data: {
              attributes: {
                refereeId: Auth.getLocalUserId(),
                productId: this.data.albumId,
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

  onShow(e) {
    if (this.data.albumAttributes.title) {
      util.ga({
        cid: Auth.getLocalUserId(),
        dp: '%2FalbumShowPage_XiaoChengXu',
        dt: `album_name:${this.data.albumAttributes.title},album_id:${this.data.albumId}`
      });
    }

    // 开始学习 获得成就
    // if (this.data.achieveProcess === 7 && Auth.getLocalKey( `${this.data.albumId}_end_isShowed`) !== "true") {
    //   this.setData({hideAchieveTip: false});
    //   Auth.setLocalKey( `${this.data.albumId}_end_isShowed`, "true")
    // }
  },

  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          index = event.currentTarget.dataset.index,
          idx = event.currentTarget.dataset.idx,
          count = event.currentTarget.dataset.count,
          userInfo = Auth.getLocalUserInfo(),
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
            ea: 'click_article_in_albumShowPage',
            el: `album_name:${this.data.albumAttributes.title},album_id:${this.data.albumId}`,
            ev: 0
          };
    const key = 'day' + (this.data.posts.length - index);
    if (!this.data.dayLogs[key]) {
      this.data.dayLogs[key] = 1;
      this.data.achieveProcess = this.data.achieveProcess + 1;
      this.setData({achieveProcess: this.data.achieveProcess});
    }
    util.goToMedium(event, gaOptions, {
      dayIndex: key,
      mediumIndex: idx + 1,
      count: count,
      albumId: this.data.albumId,
      morningPostId: this._getMorningPostId()
    });
  },

  _getMorningPostId() {
    const posts = this.data.posts,
          index = posts.length - this.data.current;
    return posts[index].id;
  },

  /**
   * 加载数据
   */
  _load() {
    loadUserData(this.data.albumId)
      .then(data => {
        const updates = {
          author: data.relationships.author.data,
          subscribers: data.data,
          subscribersCount: data.meta.count
        };
        this.setData(updates);
      });

    loadData(this.data.albumId)
      .then(this._onLoadSuccess);
  },
  /**
   * 数据加载 成功 回调
   */
  _onLoadSuccess: function (res) {
    // 找到已解锁到第几天
    const morningPosts = res.data.relationships.posts.data;
    const role = res.included[0].userAlbum.data.attributes.role;

    let updates = {
      posts: morningPosts
    };
    const getHintMsg = (post, postIndex) => {
      let msg = ' ';
      if (!updates.didUserPay) {
        if (postIndex > 1) {
          msg = `还未解锁。解锁只需${updates.albumAttributes.price/100}元`;
        }
      } else if (!post.meta.unlocked) {
        msg = '还未解锁，一天解锁一课哦';
      }
      return '';
    };
    const attributes = res.data.attributes,
          metaData = attributes.metaData;
    updates.current = morningPosts.filter(d => d.meta.unlocked).length;
    updates.album = res.data;
    updates.albumAttributes = attributes;
    updates.programStartAt = attributes.programStartAt || 0;
    // updates.targetAudience = metaData.targetAudience || '目标人群'
    // updates.descriptionPicUrl = metaData.descriptionPicUrl || ''
    // updates.buyNotes = metaData.buyNotes || ''
    // updates.picurl = res.data.attributes.picurl;
    updates.editorInfo = attributes.editorInfo;
    // updates.catalog = attributes.catalog;
    updates.loadingStatus = null;
    updates.role = role;
    updates.didUserPay = role === 2 || role === 1;
    if (!updates.didUserPay) {
      updates.trial = true;
    }
    // 阅读进度
    let logs = res.included[0].userAlbum.data.attributes.logs.days;
    let length = 0;
    for(var key in logs) {
      length = length + 1;
    }
    updates.achieveProcess = length;
    updates.dayLogs = logs;

    // 是否弹出开始学习或者获得成就
    // const flagStart = updates.achieveProcess === 0 && Auth.getLocalKey("hideAchieveStart") !== "true" && Auth.getLocalKey( `${this.data.albumId}_start_isShowed`) !== "true";;
    // const flagEnd = updates.achieveProcess === 7 && Auth.getLocalKey("hideAchieveEnd") !== "true" && Auth.getLocalKey( `${this.data.albumId}_end_isShowed`) !== "true"
    // if (updates.didUserPay) {
    //   if (flagStart) {
    //     updates.hideAchieveTip = false;
    //     Auth.setLocalKey( `${this.data.albumId}_start_isShowed`, "true")
    //   }
    //   if (flagEnd) {
    //     updates.hideAchieveTip = false;
    //     Auth.setLocalKey( `${this.data.albumId}_end_isShowed`, "true")
    //   }
    // }

    // 购买成功后弹出进群二维码或者服务号二维码
    const flag =  Auth.getLocalKey( `${this.data.albumId}_hasShownSubscribedWX`) !== 'true';
    if (updates.didUserPay && flag) {
      updates.qrcodeModalHidden = false;
      Auth.setLocalKey(`${this.data.albumId}_hasShownSubscribedWX`, 'true');
      // 关注过服务号, 弹出微信群二维码
      if (Auth.getLocalKey('isSubscribedWX') === 'true') {
        const groupQrcodes = metaData.groupQrCodeMediaIds || [],
              showWxQrcode = attributes.programStartAt ? true : false,
              newGroupQrcodes = groupQrcodes.filter(item => {
                return item.active;
              }),
              codeUrl = newGroupQrcodes.length > 0 ?  newGroupQrcodes[0].url : undefined;
        if (showWxQrcode && codeUrl) {
          updates.wxQrcode = {
            url: codeUrl,
            msg: `进群请扫下面的二维码。老师会在群中讲解知识要点、点评每日任务。`,
            title: `报名成功`
          };
        }
      }
    }

    updates.posts.forEach((post, index) => {
      post.hint = getHintMsg(post, updates.posts.length - index);
    });

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

  copyWechatId() {
    const wechatId = 'zhixiaobin123';
    wx.setClipboardData({
      data: wechatId,
      success() {
        wx.showToast({
          title: '复制成功'
        });
      },
      fail() {
        wx.showToast({
          title: '哎呀，复制失败了。麻烦手动复制吧。'
        });
      }
    })
  },

  toggleModalShown() {
    const modalShown = !this.data.modalShown;
    this.setData({modalShown});
  },

  toggleqrcodeModalHidden() {
    const qrcodeModalHidden = !this.data.qrcodeModalHidden;
    this.setData({qrcodeModalHidden});
  },

  toggleAchieveOK() {
    const hideAchieveTip = !this.data.hideAchieveTip;
    this.setData({hideAchieveTip});
  },

  toggleAchieveCardOK() {
    const hideAchieveCard = !this.data.hideAchieveCard;
    this.setData({hideAchieveCard});
  },

  toggleAchieveNoMore() {
    const hideAchieveTip = !this.data.hideAchieveTip;
    this.setData({hideAchieveTip});
    if (this.data.achieveProcess === 0) {
      Auth.setLocalKey("hideAchieveStart", "true");
    }
    if (this.data.achieveProcess === 7) {
      Auth.setLocalKey("hideAchieveEnd", "true");
    }
  },

  listenSwiper(e) {
    this.setData({current: this.data.posts.length - e.detail.current});
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
              loadData(this.data.albumId)
                .then(this._onLoadSuccess);
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
        albumId: this.data.albumId
      }
    }).then(res => {
      console.log(res);
    });
  },
  // 解锁
  _unlockAlubm() {
    return request({
      url: `${app.globalData.apiBase}/albums/${this.data.albumId}/unlock`,
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
        albumId: this.data.albumId
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
  gotoTrial() {
    const userId = this.data.albumId;
    wx.navigateTo({
      url: `../album/show?id=${userId}&trial=${true}`
    });
  },

  gotoFree() {
    wx.navigateTo({
      url: `../album/free?id=${this.data.albumId}&imgUrl=${this.data.albumAttributes.picurl}`
    });
  },

  _getFromId(e) {
    const tap = this[e.currentTarget.dataset.tap],
          formId = e.detail.formId;

    let param = `
      mutation {
        userAlbumAddFromid(albumId: "${this.data.albumId}", userId: "${Auth.getLocalUserId()}", formid: "${formId}") {
          id
        }
      }
    `;

    return graphql(param).then((d) => {
      console.log(d);
    });
  },
})
