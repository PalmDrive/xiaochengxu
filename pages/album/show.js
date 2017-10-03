const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request');

function loadData(groupId) {
  return request({
    url: `${app.globalData.apiBase}/groups/${groupId}/topics-24hours?from=miniProgram`,
  });
}

function loadUserData(groupId) {
  return request({
    url: `${app.globalData.apiBase}/groups/${groupId}/relationships/users`
  });
}

const PAID_USER_ROLE = 2;

Page({
  data: {
    userName: null, // group or toutiao name actually
    groupId: null,
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
    subscribersCount: 0
  },

  //关闭首次登陆弹窗
  closeHint: function () {
    util.closeHint(this);
  },

  onLoad(options) {
    //console.log(getCurrentPages()[1]);
    const bannerImageRatio = 375 / 400, // width / height
          updates = {
            groupId: options.id,
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
    if (this.data.userName) {
      util.ga({
        cid: Auth.getLocalUserId(),
        dp: '%2FalbumShowPage_XiaoChengXu',
        dt: `album_name:${this.data.userName},album_id:${this.data.groupId}`
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
            el: `album_name:${this.data.userName},album_id:${this.data.groupId}`,
            ev: 0
          };
    util.goToMedium(event, gaOptions);
  },
  /**
   * 加载数据
   */
  _load() {
    loadUserData(this.data.groupId)
      .then(data => {
        const updates = {
          author: data.relationships.author.data,
          subscribers: data.data,
          subscribersCount: data.meta.count
        };
        this.setData(updates);
      });

    loadData(this.data.groupId)
      .then(this._onLoadSuccess);
  },
  /**
   * 数据加载 成功 回调
   */
  _onLoadSuccess: function (res) {
    const getHintMsg = (post, postIndex) => {
      let msg = ' ';
      if (!updates.didUserPay) {
        if (postIndex > 1) {
          msg = `还未解锁。解锁只需${updates.groupInfo.price/100}元`;
        }
      } else if (!post.meta.unlocked) {
        msg = '还未解锁，一天解锁一课哦';
      }
      return msg;
    };

    let updates = {
      posts: res.data
    };

    // 没有数据 显示loading页的加载完毕
    if (!res.data || !res.data.length) {
      return this.setData({loadingStatus: 'LOADED_ALL'});
    }

    // 找到已解锁到第几天
    updates.current = res.data.filter(d => d.meta.unlocked).length;

    const group = res.included[0],
          groupInfo = group.attributes.groupInfo;
    groupInfo.pageviews = util.shortNumber(groupInfo.pageviews);
    updates.userName = res.included[0].attributes.username;
    updates.groupInfo = groupInfo;
    updates.loadingStatus = null;

    updates.didUserPay = group.relationships && group.relationships.userGroup.data.attributes.role === PAID_USER_ROLE;

    updates.posts.forEach((post, index) => {
      post.hint = getHintMsg(post, updates.posts.length - index);
    });

    this.setData(updates);

    // 设置标题
    wx.setNavigationBarTitle({
      title: updates.userName
    });

    util.ga({
      cid: Auth.getLocalUserId(),
      dp: '%2FalbumShowPage_XiaoChengXu',
      dt: `album_name:${this.data.userName},album_id:${this.data.groupId}`
    });
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    const title = this.data.userName;
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
    console.log(e.detail.current);
    this.setData({current: this.data.posts.length - e.detail.current});
  }
})