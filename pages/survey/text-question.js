const app = getApp(),
      User = require('../../utils/user'),
      _ = require('../../vendors/underscore'),
      Auth = require('../../utils/auth'),
      Util = require('../../utils/util'),
      {request} = require('../../utils/request');
/**
 * @return {Object} answer
 * {
    surveyQuestionId, content, pics[]
   }
 */
function getAnswerForQuestion(userSurveyAnswer, id) {
  const ans = userSurveyAnswer.attributes.answers.filter(el => el && el.surveyQuestionId === id)[0];
  if (ans) {
    ans.updatedAt = ans.updatedAt || userSurveyAnswer.attributes.updatedAt;
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
    _finishedLoadPeerAnswers = false;

Page({
  data: {
    question: {},
    answer: {},
    mode: 'edit', //read
    user: {},
    peerAnsweers: [],
    userSurveyAnswersCount: null
  },

  onLoad(options) {
    _postId = options.postId; //67048f40-c7f0-11e7-a5a5-61b12f2788b2
    _albumId = options.albumId; //7dd578b0-c7f0-11e7-a5a5-61b12f2788b2
    const questionId = options.surveyQuestionId,
          updates = {
            user: Auth.getLocalUserInfo(),
            question: {},
            answer: {}
          };
    User.getSurveyAndAnswers(_postId, _albumId, true /* set false when getSurveyAndAnswers is used in daily.js*/)
      .then(data => {
        _survey = data;
        const question = data.relationships.surveyQuestions.data.filter(d => d.id === questionId)[0];
        const userSurveyAnswer = data.relationships.userSurveyAnswer && data.relationships.userSurveyAnswer.data;
        updates.question = question;

        console.log('question:', question);

        if (userSurveyAnswer) {
          const answer = getAnswerForQuestion(userSurveyAnswer, questionId);
          if (answer) {
            this._afterSave();
            updates.answer = answer;
          }
        }
        this.setData(updates);
      });
  },

  onInput: _.debounce(function(event) {
    const //questionId = event.currentTarget.dataset.qid,
          content = event.detail.value;
    this.data.answer.content = content;

    this.setData({
      question: this.data.question,
      answer: this.data.answer
    });
  }, 600),

  gotoEdit() {
    this.setData({mode: 'edit'});
  },

  save() {
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
    _isUploading = true;
    data.data.push({
      attributes: {
        surveyQuestionId: this.data.question.id,
        content: answer.content,
        createdAt: now,
        updatedAt: now
      }
    });
    request({
      url,
      method: 'post',
      data
    }).then(res => {
      //console.log( `upload form over`);
      _isUploading = false;
      wx.showToast({
        title: '提交成功',
        duration: 1000,
        complete() {
          that._afterSave();
        }
      });
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
          const peerAnsweers = res.data.map(d => {
            const ans = getAnswerForQuestion(d, this.data.question.id);
            // add user
            if (ans) {
              ans.user = d.relationships.user.data.attributes;
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
  }
});
