const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

function loadData(id) {
  return request({
    url: `${app.globalData.apiBase}/albums/${id}`,
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
    title: null, // group or toutiao name actually
    albumId: null,
    loadingStatus: 'LOADING', // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
    posts: [],
    didUserPay: false, // 用户是否已经购买
    groupInfo: {},
    showHint: false,
    modalShown: false,
    qrcodeModalShown: false,
    bannerImage: {},
    current: 0,
    author: {},
    subscribers: [],
    subscribersCount: 0,
    price: 0,
    picurl: '',
    processing: false,
    editorInfo: {},
    catalog: [],
    trial: false,
    role: 0,
    hideAchieveTip: true,
    achieveProcess: 0,
    hideAchieveCard: true,
    username: '',
    dayLogs: {},
    shareAlert: false
  },

  //关闭首次登陆弹窗
  closeHint: function () {
    util.closeHint(this);
  },

  onLoad(options) {
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
      console.log(this);
      wx.getSystemInfo({
        success(res) {
          updates.bannerImage = {height: res.windowWidth / bannerImageRatio};
          updates.username = Auth.getLocalUserInfo().attributes.wxUsername;
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
        console.log(res);
        this.setData({
          shareAlert: {
            alert: true,
            username: res.included.attributes.username
          }
        });
      });
    } else {
      init();
    }
  },

  onShow() {
    if (this.data.title) {
      util.ga({
        cid: Auth.getLocalUserId(),
        dp: '%2FalbumShowPage_XiaoChengXu',
        dt: `album_name:${this.data.title},album_id:${this.data.albumId}`
      });
    }
    if (this.data.achieveProcess === 7 && Auth.getLocalAchieve( `${this.data.albumId}_end_isShowed`) !== "true") {
      this.setData({hideAchieveTip: false});
      Auth.setLocalAchieve( `${this.data.albumId}_end_isShowed`, "true")
    }
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
            el: `album_name:${this.data.title},album_id:${this.data.albumId}`,
            ev: 0
          };
    const key = 'day' + (6 - index + 1);
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
          msg = `还未解锁。解锁只需${updates.price/100}元`;
        }
      } else if (!post.meta.unlocked) {
        msg = '还未解锁，一天解锁一课哦';
      }
      return '';
    };

    updates.current = morningPosts.filter(d => d.meta.unlocked).length;

    this.data.title = res.data.attributes.title
    updates.title = res.data.attributes.title;
    updates.price = res.data.attributes.price;
    updates.picurl = res.data.attributes.picurl;
    updates.editorInfo = res.data.attributes.editorInfo;
    updates.catalog = res.data.attributes.catalog;
    updates.loadingStatus = null;
    updates.role = role;
    updates.didUserPay = role === 2 || role === 1;

    // 阅读进度
    let logs = res.included[0].userAlbum.data.attributes.logs.days;
    let length = 0;
    for(var key in logs) {
      length = length + 1;
    }
    updates.achieveProcess = length;
    updates.dayLogs = logs;

    // 是否弹出开始学习或者获得成就
    const flagStart = updates.achieveProcess === 0 && Auth.getLocalAchieve("hideAchieveStart") !== "true" && Auth.getLocalAchieve( `${this.data.albumId}_start_isShowed`) !== "true";;
    const flagEnd = updates.achieveProcess === 7 && Auth.getLocalAchieve("hideAchieveEnd") !== "true" && Auth.getLocalAchieve( `${this.data.albumId}_end_isShowed`) !== "true"
    if (updates.didUserPay) {
      if (flagStart) {
        updates.hideAchieveTip = false;
        Auth.setLocalAchieve( `${this.data.albumId}_start_isShowed`, "true")
      }
      if (flagEnd) {
        updates.hideAchieveTip = false;
        Auth.setLocalAchieve( `${this.data.albumId}_end_isShowed`, "true")
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
      dt: `album_name:${this.data.title},album_id:${this.data.albumId}`
    });
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    const title = this.data.title;
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

  toggleQrcodeModalShown() {
    const qrcodeModalShown = !this.data.qrcodeModalShown;
    this.setData({qrcodeModalShown});
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
      Auth.setLocalAchieve("hideAchieveStart", "true");
    }
    if (this.data.achieveProcess === 7) {
      Auth.setLocalAchieve("hideAchieveEnd", "true");
    }
  },

  listenSwiper(e) {
    this.setData({current: this.data.posts.length - e.detail.current});
  },

  buy() {
    const url = `${baseUrl}/wechat/pay/unifiedorder?from=miniProgram`,
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
          totalFee: this.data.price,
          name: this.data.title,
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

        console.log('params:');
        console.log(params);

        params.success = (res) => {
          console.log('wx requestPayment success');
          console.log(res);
          this.setData({trial: false});
          loadData(this.data.albumId)
            .then(this._onLoadSuccess);
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

  gotoTrial() {
    const userId = this.data.albumId;
    wx.navigateTo({
      url: `../album/show?id=${userId}&trial=${true}`
    });
  },

  gotoFree() {
    wx.navigateTo({
      url: `../album/free?id=${this.data.albumId}&imgUrl=${this.data.picurl}`
    });
  },

  _getFromId(e) {
    const tap = this[e.currentTarget.dataset.tap],
          formId = e.detail.formId;

    request({
      method: 'POST',
      url: `${baseUrl}/user-album/formid`,
      data: {
        userId: Auth.getLocalUserId(),
        albumId: this.data.albumId,
        formid: formId
      }
    }).then((d) => {
      // wx.showToast({
      //   title: formId || 'null'
      // })
    });
  },
  closeAlert() {
    this.setData({
      shareAlert: null
    });
  },
  showGuide() {
    this.setData({
      shareAlert: {
        guide: true
      }
    });
  }
})
