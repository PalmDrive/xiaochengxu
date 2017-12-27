const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    graphql = require('../../utils/graphql'),
    baseUrl = app.globalData.apiBase,
    {addAlbumId, getSurveyAndAnswers} = require('../../utils/user'),
    User = require('../../utils/user');

let albumId = undefined,
    postId = undefined,
    completeAmount = 0,
    picurl = '',
    reportPicurl = '';

Page({
  data: {
    dayList: [],
    selectedIndex: 4,
    albumAttributes: {},
    editorInfo: {},
    post: {},
    posts: [],
    survey: {},
    media: [],
    questionList: [],
    questionTextList: [],
    questionSelectList: [],
    questionSelectCompleted: false,// 单选题是否都完成了
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
    processing: false,
    wxQrcode: {
      url: '../../images/paid-group/qrcode_qiriji.jpg',
      msg: '关注微信公众号「七日辑」,我们为您推送更新',
      title: '开启推送'
    },
    qrcodeModalHidden: true,
    didUserPay: false,
    completedAll: false,
    questions: [],
    isNewStyle: true,
    viewedMediumCount: 0,
    mediaAndQuestionsCount: 0,
    studyProgress: {}
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    })
    const that = this;
    albumId = options.albumId;
    postId = options.postId;
    that.setData({trial: options.trial === 'true' ? true : false});
  },

  onShow() {
    // 解决从答题页面返回数据不刷新问题
    if (albumId) { // page loaded
      console.log('call _load in onShow');
      Auth.getLocalUserId() && this._load();
    }
  },

  /**
   * 加载数据
   */
  _load() {
    const url = `${app.globalData.apiBase}/albums/post?&include=surveyQuestions`,
          data = {};
    if (albumId) data.albumId = albumId;
    if (postId) data.postId = postId;
    if (this.data.trial) data.isTrial = true;
    wx.showLoading({
      title: '加载中',
    });
    let paramPostId = postId ? `id: "${postId}",` : '';
    const postParam = `${paramPostId}albumId: "${albumId}", userId: "${Auth.getLocalUserId()}"`;

    let param = `{
      post(${postParam}) {
        id,
        picUrl,
        dayIndex,
        metaData,
        media {
          id,
          title,
          duration,
          htmlContent
        }
      },
      albums(id: "${albumId}") {
        id,
        title,
        picurl,
        editorInfo,
        metaData,
        price,
        postIds,
        programStartAt,
        programPromoteAt
      },
      userAlbum(userId: "${Auth.getLocalUserId()}", albumId: "${albumId}") {
        role,
        checkinStatus,
        unlockedDays,
        metaData,
        currentStudyCardCount
      }
    }`;

    // request({
    //   url, data
    // }).then(res => {
    graphql(param).then(res => {
      console.log(res);
      wx.hideLoading();
      const albumAttributes = res.data.albums ? res.data.albums[0] : {},
            metaData = albumAttributes.metaData || {},
            post = res.data.post || {},
            userAlbum = res.data.userAlbum || {};
      albumId = albumAttributes.id;
      postId = post.id;

      let updates = {};
      const role = userAlbum.role;
      updates.didUserPay = role === 2 || role === 1;

      /* 购买成功后弹窗 */
      const flag =  Auth.getLocalKey( `${albumId}_hasShownSubscribedWX`) !== 'true';
      if (updates.didUserPay && flag) {
        updates.qrcodeModalHidden = false;
        Auth.setLocalKey( `${albumId}_hasShownSubscribedWX`, 'true');
        // 关注过服务号, 弹出微信群二维码
        if (Auth.getLocalKey('isSubscribedWX') === 'true') {
          const groupQrcodes = metaData.groupQrCodeMediaIds || [],
                showWxQrcode = albumAttributes.programStartAt ? true : false,
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

      let dayList = userAlbum.checkinStatus || [],
          unlockedDays = userAlbum.unlockedDays || 1,
          selectedIndex = (post && post.dayIndex);
      // -- test start--
      // unlockedDays = 8;
      // selectedIndex = undefined;
      // dayList = [true,true,true,true,true,true,true];
      // -- test end--
      const unfinishedDays = dayList.filter(res => !res);
      if (unlockedDays > albumAttributes.postIds.length || unfinishedDays.length === 0) {
        dayList.push(true);
        if (!selectedIndex) {
          selectedIndex = albumAttributes.postIds.length + 1;
          this._loadAlbum();
        }
      }

      updates.isNewStyle = new Date(albumAttributes.programPromoteAt).getTime() > new Date('2017-11-21').getTime();

      let viewedMediumCount = 0;
      if (userAlbum.currentStudyCardCount && userAlbum.currentStudyCardCount[postId]) {
        viewedMediumCount = userAlbum.currentStudyCardCount[postId];
      }

      const updatesData = {
        albumAttributes,
        editorInfo: albumAttributes.editorInfo,
        post,
        media: post.media,
        selectedIndex,
        dayList,
        unlockedDays,
        ...updates,
        mediaAndQuestionsCount: post.metaData ? post.metaData.cardCount : 0,
        completedAll: dayList[selectedIndex - 1],
        viewedMediumCount: viewedMediumCount
      };

      this.setData(updatesData);

      // 加载任务
      this._loadSurvey();
    });
  },

  _loadAlbum() {
    wx.showLoading({
      title: '加载中',
    });
    // request({
    //   url: `${app.globalData.apiBase}/albums/${albumId}?app_name=${app.globalData.appName}`,
    // }).then(res => {

    let param = `{
      albums(id: "${albumId}") {
        id,
        title,
        picurl,
        editorInfo,
        metaData,
        price,
        postIds,
        posts {
          picUrl,
          id,
          metaData,
          media {
            id,
            title,
            mediumType,
            lastViewedAt,
            summary,
            duration
          }
        },
        programStartAt,
        programPromoteAt
      },
      userAlbum(userId: "${Auth.getLocalUserId()}", albumId: "${albumId}") {
        role,
        checkinStatus,
        unlockedDays,
        metaData,
        currentStudyCardCount
      }
    }`;

    graphql(param).then(res => {
      wx.hideLoading();
      const album = res.data.albums ? res.data.albums[0] : {}
      // post.relationships.media.data
      // 加载filter 问题及答案
      // User.getFilterQuestions(albumId, true).then(res => {
      //   this.setData({questions: res.questions});
      // });
      reportPicurl = res.data.userAlbum.metaData.picurl || '';

      this.setData({
        studyProgress: res.data.userAlbum.metaData.currentStudyCardCount || {},
        posts: album.posts.reverse()
      });

      // 如果是第一次看到结营页面，则显示结营报告页面
      // const flag =  Auth.getLocalKey( `${albumId}_hasShownReport`) !== 'true';
      // if (flag) {
      //   Auth.setLocalKey( `${albumId}_hasShownReport`, 'true');
      //   wx.navigateTo({
      //     url: `../album/share?imgUrl=${reportPicurl}`
      //   });
      // }
    });
  },
  /**
   * 加载数据
   */
  _loadSurvey() {
    completeAmount = 0;
    // @TODO: use getSurveyAndAnswers
    User.getSurveyAndAnswers(postId, albumId, true /* set false when getSurveyAndAnswers is used in daily.js*/)
      .then(res => {
      if (!res.survey) return;
      let questionList = res.survey.surveyQuestions;

      let questionTextList = questionList.filter(res => res.questionType !== 'multi-select' && res.questionType !== 'single-select');

      if (res.userSurveyAnswer) {
        picurl = res.userSurveyAnswer.picurl;
        const answerObj = res.userSurveyAnswer.answers;
        questionList.forEach((res) => {
          res.completed = answerObj[res.id] ? true : false;
          if (res.completed) {
            completeAmount ++;
          }
        });
      }

      let questionSelectList = questionList.filter(res => {
        if (res.questionType === 'multi-select' || res.questionType === 'single-select') {
          return res;
        }
      });

      // let completedAll = false;
      // const list = questionList.filter(res => res.attributes.questionType !== 'desc');
      // if (completeAmount === list.length) {
      //   completedAll = true;
      //   if (this.data.albumAttributes.postIds.length === this.data.dayList.length) {
      //     this.data.dayList.push(true);
      //   }
      // }

      this.setData({
        dayList: this.data.dayList,
        survey: res.survey,
        questionList,
        questionTextList,
        questionSelectList,
        questionSelectCompleted: questionSelectList.filter(res => res.completed).length === questionSelectList.length
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
          postIds = this.data.albumAttributes.postIds,
          newPostId = postIds[index];
    if (this.data.selectedIndex - 1 !== index) {
      if (index === this.data.albumAttributes.postIds.length) {
        this.setData({
          selectedIndex: index + 1
        })
        this._loadAlbum();
      } else if (index < this.data.unlockedDays) {
        this.setData({
          selectedIndex: index + 1
        })
        if (index <= postIds.length - 1) {
          postId = newPostId;
          albumId = albumId;
          this._load();
        }
      } else {
        wx.showToast({
          title: '还未解锁',
          duration: 1000,
          image: '../../images/survey/clock.png'
        })
      }
    }
  },

  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          idx = event.currentTarget.dataset.idx,
          count = this.data.media.length,
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.title},article_id:${medium.id}`,
            ea: 'click_article_in_albumShowPage',
            el: `album_name:${this.data.albumAttributes.title},album_id:${this.data.albumId}`,
            ev: 0
          };
    let index = this.data.selectedIndex,
      key = 'day' + index,
      newPostId = postId;
    if (event.currentTarget.dataset.pindex >= 0) {
      index = event.currentTarget.dataset.pindex;
      key = 'day' + (parseInt(index) + 1);
      newPostId = this.data.posts[index].id
      this.data.posts[index].relationships.media.data[idx].lastViewedAt = (new Date()).getTime();
    } else {
      this.data.media[idx].lastViewedAt = (new Date()).getTime();
    }

    util.goToMedium(event, gaOptions, {
      dayIndex: key,
      mediumIndex: idx + 1,
      count: count,
      albumId: albumId,
      morningPostId: newPostId
    });
    const that = this;
    setTimeout(function(){
      that.setData({
        media: that.data.media,
        posts: that.data.posts
      });
    }, 1000);
  },

  goToAlbumDetail: function(event) {
    wx.navigateTo({
      url: `./buy?showDetail=true&id=${albumId}`
    });
  },

  goToSurveyDetail: function(event) {
    wx.navigateTo({
      url: `../survey/edit?postId=${postId}&albumId=${albumId}`
    });
  },

  goToTextQuestion: function(event) {
    const question = event.currentTarget.dataset.question;
    wx.navigateTo({
      url: `../survey/text-question?postId=${postId}&albumId=${albumId}&surveyQuestionId=${question.id}&dayIndex=${this.data.selectedIndex}&completeAmount=${completeAmount}`
    });
  },

  goToSelectQuestion: function(event) {
    wx.navigateTo({
      url: `../survey/select-question?postId=${postId}&albumId=${albumId}&surveyId=${this.data.survey.id}&qindex=0&completeAmount=${completeAmount}`
    });
  },

  toggleqrcodeModalHidden() {
    const qrcodeModalHidden = !this.data.qrcodeModalHidden;
    this.setData({qrcodeModalHidden});
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
        if (this.data.albumAttributes.programStartAt) {
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

    let param = `
      mutation {
        order (appName: "days7", name: "${this.data.albumAttributes.title}", totalFee: ${price}, openid: "${attrs.wxOpenId}", productId: "${albumId}", productType: "Album"){
          paySign,
          timeStamp,
          orderId,
          prepay_id,
          nonce_str
        }
      }
    `;

    graphql(param).then(data => {
        const params = {
          timeStamp: data.data.order.timeStamp,
          nonceStr: data.data.order.nonce_str,
          package: `prepay_id=${data.data.order.prepay_id}`,
          signType: 'MD5',
          paySign: data.data.order.paySign
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
    let param = `mutation {
      userCouponRedeem(albumId: "${albumId}", id: "${this.data.coupon.userCouponId}") {
        id
      }
    }`;

    return graphql(param);
  },
  // 解锁
  _unlockAlubm() {
    let param = `
      mutation {
        userAlbumUnlock(albumId: "${albumId}", userId: "${Auth.getLocalUserId()}") {
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
    let param = `{
      userCoupons(albumId: "${albumId}", ownerId: "${Auth.getLocalUserId()}",redeemedAt: true) {
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
      const userCoupons = res.data.userCoupons || [];
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

  gotoCard: function(event) {
    if (this.data.completedAll) {
      wx.navigateTo({
        url: `../album/share?imgUrl=${picurl}`
      });
    }
  },

  goToDetailReport: function(event) {
    wx.navigateTo({
      url: `../album/report?albumId=${albumId}`
    });
  },

  gotoReportCard: function(event) {
    wx.navigateTo({
      url: `../album/share?imgUrl=${reportPicurl}`
    });
  },

  startStudy: function(event) {
    const pindex = event.currentTarget.dataset.pindex;
    let pid = postId,
        count = this.data.viewedMediumCount;
    if (pindex >= 0) {
      const post = this.data.posts[pindex];
      count = this.data.studyProgress[post.id] || 0;
      pid = post.id;
    }

    wx.navigateTo({
      url: `../album/study-web?albumId=${albumId}&postId=${pid}&viewedMediumCount=${count}`
    });
  }
})
