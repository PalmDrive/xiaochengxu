const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase,
    User = require('../../utils/user');

let surveyId = undefined,
    albumId = undefined,
    postId = undefined,
    isUploading = false,
    completeAmount = 0,
    cardImageUrl = '';

Page({
  data: {
    questionList: [],
    qindex: 0,
    attributes: {},
    selectedAnwser: [],
    rightAnwser: [],
    committed: false,
    preButtonDisable: false,
    nextButtonDisable: false,
    allQuestionList: []
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    });
    surveyId = options.surveyId;
    postId = options.postId;
    albumId = options.albumId;
    completeAmount = parseInt(options.completeAmount);

    const qindex = parseInt(options.qindex);
    this._loadSurvey(qindex);
  },

  _loadSurvey(qindex) {
    User.getSurveyAndAnswers(postId, albumId, false)
      .then(res => {

      let questionList = res.relationships.surveyQuestions.data;
      let answerList = res.relationships.userSurveyAnswer ? [res.relationships.userSurveyAnswer] : [];

      if (answerList.length > 0) {
        cardImageUrl = answerList[0].data.attributes.cardImageUrl;
        answerList = answerList[0].data.attributes.answers;
      }

      let list = questionList.filter(res => {
        if (res.attributes.questionType === 'multi-select' || res.attributes.questionType === 'single-select') {
           res.attributes.answer = answerList.filter(answer => { // 拿到已选择的答案列表
            if (answer && answer.surveyQuestionId === res.id && Array.isArray(answer.content)) {
              res.attributes.options = res.attributes.options.map(option => {
                answer.content.map(ans => {
                  if (option.value === ans.value) { // question.options 里选择的答案selected = true
                    option.selected = true;
                  }
                });
                return option;
              });
              return answer;
            }
          });
          return res;
        }
      });

      const attributes = list[qindex].attributes;
      let committed = false;

      list[qindex].attributes.options = attributes.options.map(res => {
        res.selected = res.selected ? res.selected : false;
        if (res.selected) {
          committed = true;
        }
        return res;
      });

      const rightAnwser = attributes.options.filter((res, i) => res.isRight === true);
      const selectedAnwser = attributes.answer.length > 0 ? attributes.answer[0].content : [];
      console.log(list);

      let nextButtonDisable = false;
      let preButtonDisable = false;
      if (qindex === list.length - 1) {
        nextButtonDisable = true;
      }
      if (qindex === 0) {
        preButtonDisable = true;
      }

      this.setData({
        questionList: list,
        qindex,
        attributes,
        rightAnwser,
        preButtonDisable,
        nextButtonDisable,
        selectedAnwser: selectedAnwser,
        committed: committed,
        allQuestionList: questionList
      });

    });
  },

  bindClick: function(event) {
    const index = event.currentTarget.dataset.idx;

    if (this.data.attributes.questionType === 'single-select') {
      this.data.attributes.options = this.data.attributes.options.map((res, i) => {
        res.selected = false;
        return res;
      });
    }

    this.data.attributes.options[index].selected = !this.data.attributes.options[index].selected;

    const selectedAnwser = this.data.attributes.options.filter((res, i) => res.selected === true);
    this.data.questionList[this.data.qindex].attributes = this.data.attributes;
    this.setData({
      questionList: this.data.questionList,
      attributes: this.data.attributes,
      selectedAnwser
    });
  },

  prePage: function(event) {
    if (this.data.qindex - 1 < 0) {
      return;
    }
    this.changePage(this.data.qindex - 1);
  },

  changePage(index) {
    this.data.questionList[this.data.qindex].attributes.answer = [{
      content: this.data.selectedAnwser
    }];
    this.onLoad({
      surveyId: surveyId,
      postId: postId,
      albumId: albumId,
      qindex: index
    })
  },

  commit: function() {
    // 下一页
    if (this.data.committed) {
      if (this.data.qindex + 1 < this.data.questionList.length) {
        this.changePage(this.data.qindex + 1);
      } else {
        wx.navigateBack({
          delta: 1
        })
      }
      return;
    }

    // 提交答案
    if (isUploading) {
      return;
    }

    let data = {
      data: [
        {
          attributes: {
            surveyQuestionId: this.data.questionList[this.data.qindex].id,
            content: this.data.selectedAnwser,
          }
        }
      ],
      meta: {
        userId: Auth.getLocalUserId()
      }
    };

    if (this.data.selectedAnwser.length > 0) {
      isUploading = true;
      request({
        url: `${app.globalData.apiBase}/surveys/${surveyId}/user-survey-answers`,
        method: 'post',
        data
      }).then(res => {
        isUploading = false;
        wx.showToast({
          title: '提交成功',
          duration: 1000
        });

        this.setData({
          committed: true
        })
        const list = this.data.allQuestionList.filter(res => res.attributes.questionType !== 'desc');
        if (completeAmount === list.length - 1) {
          wx.navigateTo({
            url: `../album/share?imgUrl=${cardImageUrl}`
          });
        }
      });
    } else {
      wx.showToast({
        title: '请先答完这道题',
        duration: 1000,
        image: '../../images/survey/delete.jpg'
      });
    }
  }
})
