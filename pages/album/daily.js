const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
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
    mediaAndQuestionsCount: 0
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
    request({
      url, data
    }).then(res => {
      wx.hideLoading();
      const albumAttributes = res.data.attributes || {},
            metaData = albumAttributes.metaData || {},
            post = res.data.relationships.post.data || {},
            postRelationships = post.relationships || {};
      albumId = res.data.id;
      postId = post.id;

      let updates = {};
      const role = res.data.relationships.userAlbum.data.attributes.role;
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

      let surveysQuestionData = res.included.filter(res => res.type === 'surveyQuestions') || [],
          media = postRelationships.media ? postRelationships.media.data : [],
          dataAll = [];
      media = media.map(medium => {
        let duration = medium.attributes.duration || 0;
        medium.attributes.durationString = util.convertTime(duration);
        dataAll.push(medium);

        // 找出文章卡片对应的问题
        let questions = surveysQuestionData.filter(q => q.attributes.mediumId === medium.id);
        if (questions.length > 0) {
          dataAll = dataAll.concat(questions);
        }
        return medium;
      });

      let dayList = res.meta.checkinStatus,
          unlockedDays = res.meta.unlockedDays,
          selectedIndex = post.attributes && post.attributes.dayIndex;
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

      const updatesData = {
        albumAttributes,
        editorInfo: albumAttributes.editorInfo,
        post,
        media,
        selectedIndex,
        dayList,
        unlockedDays,
        ...updates,
        mediaAndQuestionsCount: dataAll.length,
        completedAll: dayList[selectedIndex - 1]
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
    request({
      url: `${app.globalData.apiBase}/albums/${albumId}?app_name=${app.globalData.appName}`,
    }).then(res => {
      wx.hideLoading();

      // post.relationships.media.data
      // 加载filter 问题及答案
      User.getFilterQuestions(albumId, true).then(res => {
        this.setData({questions: res.questions});
      });
      reportPicurl = res.included[0].userAlbum.data.attributes.metaData.picurl;

      this.setData({
        posts: res.data.relationships.posts.data.reverse()
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
      if (!res.relationships) return;
      let questionList = res.relationships.surveyQuestions.data;
      let answerList = res.relationships.userSurveyAnswer ? [res.relationships.userSurveyAnswer] : [];

      let questionTextList = questionList.filter(res => res.attributes.questionType !== 'multi-select' && res.attributes.questionType !== 'single-select');

      if (answerList.length > 0) {
        picurl = answerList[0].data.attributes.picurl;
        answerList = answerList[0].data.attributes.answers;
        questionList.forEach((res) => {
          res.attributes.completed = answerList.filter(a => a && a.surveyQuestionId === res.id).length > 0;
          if (res.attributes.completed) {
            completeAmount ++;
          }
        });
      }

      let questionSelectList = questionList.filter(res => {
        if (res.attributes.questionType === 'multi-select' || res.attributes.questionType === 'single-select') {
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
        survey: res,
        questionList,
        questionTextList,
        questionSelectList,
        questionSelectCompleted: questionSelectList.filter(res => res.attributes.completed).length === questionSelectList.length,
        viewedMediumCount: res.attributes.metaData.currentStudyCardCount || 0
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
      if (index < this.data.unlockedDays) {
        this.setData({
          selectedIndex: index + 1
        })
        if (index <= postIds.length - 1) {
          postId = newPostId;
          albumId = albumId;
          this._load();
        }
      } else if (index === this.data.albumAttributes.postIds.length) {
        this.setData({
          selectedIndex: index + 1
        })
        this._loadAlbum();
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
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
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
      this.data.posts[index].relationships.media.data[idx].attributes.lastViewedAt = (new Date()).getTime();
    } else {
      this.data.media[idx].attributes.lastViewedAt = (new Date()).getTime();
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
    wx.navigateTo({
      url: `../album/study-web?albumId=${albumId}&postId=${postId}&viewedMediumCount=${this.data.viewedMediumCount}`
    });
  }
})
