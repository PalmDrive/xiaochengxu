const app = getApp(),
      User = require('../../utils/user'),
      _ = require('../../vendors/underscore'),
      Auth = require('../../utils/auth'),
      Util = require('../../utils/util'),
      {request} = require('../../utils/request'),
      graphql = require('../../utils/graphql');
/**
 * @return {Object} answer
 * {
    surveyQuestionId, content, pics[]
   }
 */
function getAnswerForQuestion(userSurveyAnswer, id) {
  if (!userSurveyAnswer.answers) return undefined;
  const ans = userSurveyAnswer.answers[id];
  if (ans) {
    ans.updatedAt = ans.updatedAt || userSurveyAnswer.updatedAt;
    ans.displayedUpdatedAt = Util.formatDateToDay(new Date(ans.updatedAt));
  }
  return ans;
};

let _survey,
    _isUploading,
    _postId,
    _albumId,
    _peerAnswersPageNumber = 1,
    _peerAnswersPageSize = 50, // @todo: 暂时没有分页加载，最多就加载50条
    _finishedLoadPeerAnswers = false,
    _picNumber = 1,
    _dayIndex,
    _completeAmount = 0,
    _picurl = '';

Page({
  data: {
    question: {},
    answer: {},
    mode: 'edit', //read
    user: {},
    peerAnsweers: [],
    userSurveyAnswersCount: null,
    committed: false,
    allQuestionList: []
  },

  onLoad(options) {

    // 设置导航栏背景色
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    });

    // 初始化全局参数
    _completeAmount = parseInt(options.completeAmount);
    _isUploading = false;
    _picNumber = 1;
    _finishedLoadPeerAnswers = false;
    _postId = options.postId; //67048f40-c7f0-11e7-a5a5-61b12f2788b2
    _albumId = options.albumId;
    _dayIndex = options.dayIndex; //7dd578b0-c7f0-11e7-a5a5-61b12f2788b2
    const questionId = options.surveyQuestionId,
          updates = {
            user: Auth.getLocalUserInfo(),
            question: {},
            answer: {},
            allQuestionList: []
          };
    User.getSurveyAndAnswers(_postId, _albumId, false /* set false when getSurveyAndAnswers is used in daily.js*/)
      .then(data => {
        _survey = data.survey;
        const question = data.survey.surveyQuestions.filter(d => d.id === questionId)[0];
        question.picurlList = [];
        if (data.userSurveyAnswer) {
          _picurl = data.userSurveyAnswer.picurl;
          const answer = getAnswerForQuestion(data.userSurveyAnswer, questionId);
          if (answer) {
            this._afterSave();
            updates.answer = answer;
            question.picurlList = answer.pics || [];
            if (answer.pics.length > 0) {
              const pic = answer.pics[answer.pics.length - 1];
              _picNumber = parseInt(pic.id.substr(4,1));
            }
          }
        }
        updates.question = question;
        if (updates.answer.content || question.picurlList.length > 0 || question.questionType === 'desc') {
          updates.committed = true;
        }
        updates.allQuestionList = data.survey.surveyQuestions;
        this.setData(updates);
      });
  },

  onInput: _.debounce(function(event) {
    const content = event.detail.value;
    this.data.answer.content = content;
  }, 600),

  bindblur() {
    wx.pageScrollTo({
      scrollTop: 5000
    });
  },

  bindconfirm() {
    wx.pageScrollTo({
      scrollTop: 5000
    });
  },

  gotoEdit() {
    this.setData({mode: 'edit', committed: false});
  },

  save() {
    if (this.data.committed) {
      wx.navigateBack({
        delta: 1
      })
      return ;
    }

    const url =  `${app.globalData.apiBase}/surveys/${_survey.id}/user-survey-answers`,
          data = {
             data: [],
             meta: {
               userId: Auth.getLocalUserId(),
               isNew: 'false', // 这样不会把整个survey 答案重置
             }
          },
          answer = this.data.answer,
          that = this,
          now = +new Date();

    if (_isUploading) {
      return;
    }

    if ((this.data.question.questionType === 'text' || this.data.question.questionType === 'text & pic') && !answer.content) {
      wx.showToast({
        title: '请先输入答案',
        duration: 1000,
        image: '../../images/survey/delete.jpg'
      });
      return;
    }
    _isUploading = true;
    data.data.push({
      attributes: {
        surveyQuestionId: this.data.question.id,
        content: answer.content,
        createdAt: now,
        updatedAt: now
      }
    });
    this.setData({
      committed: true,
      answer: this.data.answer
    });
    // request({
    //   url,
    //   method: 'post',
    //   data
    // }).then(res => {
    const answerContent = (!answer.content || answer.content === 'undefined') ? '' : answer.content;
    graphql(`
      mutation {
        userSurveyAnswer(
          userId: "${Auth.getLocalUserId()}",
          surveyId: "${_survey.id}",
          answers: [{
            content: "${answerContent}",
            surveyQuestionId: "${this.data.question.id}"
          }]) {
          id
        }
      }
      `
    ).then(res => {
      //console.log( `upload form over`);
      _isUploading = false;
      wx.showToast({
        title: '提交成功',
        duration: 1000,
        complete() {
          that._afterSave();
        }
      });
      const list = this.data.allQuestionList.filter(res => res.questionType !== 'desc');
      if (_completeAmount >= list.length - 1) {
        /* 购买成功后弹窗 */
        const flag =  Auth.getLocalKey( `${_postId}_hasShownCompleteCard`) !== 'true';
        if (flag) {
          Auth.setLocalKey(`${_postId}_hasShownCompleteCard`, 'true');
          if (!_picurl) {
            User.getSurveyAndAnswers(_postId, _albumId, true)
              .then(res => {
              if (!res.survey) return;
              if (res.userSurveyAnswer) {
                _picurl = res.userSurveyAnswer.picurl;
              }
              wx.navigateTo({
                url: `../album/share?imgUrl=${_picurl}`
              });
            });
          } else {
            wx.navigateTo({
              url: `../album/share?imgUrl=${_picurl}`
            });
          }
        }
      }
    });
  },

  _loadPeerAnswers() {
    if (!_finishedLoadPeerAnswers) {
      return User.getPeerAnswers(_postId, _albumId, {
        number: _peerAnswersPageNumber,
        size: _peerAnswersPageSize
      })
        .then(res => {
          const updates = {};
          //updates.userSurveyAnswersCount = res.meta.userSurveyAnswersCount;
          const peerAnsweers = res.data.userSurveyAnswers.map(d => {
            const ans = getAnswerForQuestion(d, this.data.question.id);

            // add user
            if (ans && d.user) {
              ans.user = d.user;
            }
            return ans;
          })
            .filter(el => el && el.user && el.user.id !== Auth.getLocalUserId());
          updates.peerAnsweers = this.data.peerAnsweers.concat(peerAnsweers);
          updates.userSurveyAnswersCount = updates.peerAnsweers.length;

          this.setData(updates);

          _finishedLoadPeerAnswers = peerAnsweers.length < _peerAnswersPageSize;
        });
    }
  },

  _afterSave() {
    const updates = {};
    this.setData({mode: 'read'});
    _peerAnswersPageNumber = 1;
    return this._loadPeerAnswers();
  },

  addPic: function(event) {
    const that = this,
          qid = event.currentTarget.dataset.qid;
    wx.chooseImage({
      sizeType: 'compressed',
      success: function(res) {
        wx.showLoading({
          title: '上传中...'
        });
        let newPicList = [];
        for (let i = 0; i < res.tempFilePaths.length; i++) {
          _picNumber ++;
          wx.uploadFile({
            url: `${app.globalData.apiBase}/surveys/${_survey.id}/photo`,
            filePath: res.tempFilePaths[i],
            name: 'photo',
            formData:{
              isNew: 'false', // 整个survey 答案重置
              userId: Auth.getLocalUserId(),
              surveyQuestionId: qid,
              picId: `pic_${_picNumber}`
            },
            success: function(res){
            },
            fail: function(res){
            },
            complete: function(data){
              if (i === res.tempFilePaths.length - 1) {
                wx.hideLoading();
              }
            },
          })

          that.data.question.picurlList.push({id: `pic_${_picNumber}`, url: res.tempFilePaths[i]});
        }

        that.setData({
          question: that.data.question
        });
      }
    })
  },

  delete: function(event) {
    const idx = event.currentTarget.dataset.idx,
          picid = event.currentTarget.dataset.picid;
    this.data.question.picurlList.splice(idx,1);

    this.setData({
      question: this.data.question
    });

    request({
      url: `${app.globalData.apiBase}/surveys/${_survey.id}/photo?userId=${Auth.getLocalUserId()}&surveyQuestionId=${this.data.question.id}&picId=${picid}`,
      method: 'delete',
    }).then(res => {
      //console.log( `delete ${picid} over`);
    });
  },

  gotoMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
            ea: 'click_article_in_albumShowPage',
            el: `album_name:${_survey.title},album_id:${_albumId}`,
            ev: 0
          },
          metaData = this.data.question.metaData || {},
          relatedMedium = metaData.relatedMedium;
    if (relatedMedium) {
      Util.goToMedium(event, gaOptions, {
        dayIndex: 'day' + _dayIndex,
        mediumIndex: relatedMedium.index + 1,
        count: relatedMedium.mediaCount,
        albumId: _albumId,
        morningPostId: _postId
      });
    }
  }
});
