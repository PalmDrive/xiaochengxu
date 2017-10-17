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
    title: null, // group or toutiao name actually
    albumId: null,
    loadingStatus: null, // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
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
    trial: false
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

    wx.getSystemInfo({
      success(res) {
        updates.bannerImage = {height: res.windowWidth / bannerImageRatio};
        that.setData(updates);
        Auth.getLocalUserId() && that._load();
      },
      fail() {
        updates.bannerImage = {height: 400};
        that.setData(updates);
      }
    });
  },

  onShow() {
    if (this.data.title) {
      util.ga({
        cid: Auth.getLocalUserId(),
        dp: '%2FalbumShowPage_XiaoChengXu',
        dt: `album_name:${this.data.title},album_id:${this.data.albumId}`
      });
    }
  },

  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          userInfo = Auth.getLocalUserInfo(),
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
            ea: 'click_article_in_albumShowPage',
            el: `album_name:${this.data.title},album_id:${this.data.albumId}`,
            ev: 0
          };
    util.goToMedium(event, gaOptions);
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
    let posts = []
    for(var i = morningPosts.length - 1; i >= 0; i--){
      posts[morningPosts.length - 1 - i] = morningPosts[i];
    }
    let updates = {
      posts: posts
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
      return msg;
    };

    updates.current = posts.filter(d => d.meta.unlocked).length;

    this.data.title = res.data.attributes.title
    updates.title = res.data.attributes.title;
    updates.price = res.data.attributes.price;
    updates.picurl = res.data.attributes.picurl;
    updates.editorInfo = res.data.attributes.editorInfo;
    updates.catalog = res.data.attributes.catalog;
    updates.loadingStatus = null;

    updates.didUserPay = role === 2;

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
          this.setData({didUserPay: true});
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
    const userId = this.data.albumId;
    wx.navigateTo({
      url: `../album/show?id=${userId}&trial=${true}`
    });
  }
})
