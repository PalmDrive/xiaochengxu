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
    media: [],
    questionList: [],
    unlockedDays: 1,
    userSurveyAnswersCountMsg: '',
    answerList: [],
    userInfo: Auth.getLocalUserInfo().attributes
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    })
    albumId = options.albumId;
    postId = options.postId;
    Auth.getLocalUserId() && this._load();
  },

  /**
   * 加载数据
   */
  _load() {
    let url = `${app.globalData.apiBase}/albums/post`;
    if (albumId && postId) {
      url += `?postId=${postId}&albumId=${albumId}`
    }
    request({
      url: url,
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
        media: postRelationships.media.data,
        selectedIndex: post.attributes.dayIndex,
        dayList: res.meta.checkinStatus,
        unlockedDays: res.meta.unlockedDays
      })

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
      const count = res.meta.userSurveyAnswersCount;
      let msg = `已提交${count}人，做完后才可查看别人的哦`;
      if (count === 0) {
        msg = '成为第1个提交任务的人吧';
      }

      let questionList = res.included.filter(res => {
        return res.type === 'SurveyQuestions';
      })
      let answerList = res.included.filter(res => {
        return res.type === 'userSurveyAnswers';
      })

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
        })
      }

      this.setData({
        questionList,
        answerList,
        userSurveyAnswersCountMsg: msg
      })
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
      // wx.redirectTo({
      //   url: `./survey?postId=${newPostId}&albumId=${albumId}`
      // });

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
      url: `./survey-detail?postId=${postId}&albumId=${albumId}`
    });
  }
})
