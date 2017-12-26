const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase,
    User = require('../../utils/user'),
    graphql = require('../../utils/graphql');

let surveyId = undefined,
    albumId = undefined,
    postId = undefined,
    isUploading = false,
    completeAmount = 0,
    picurl = '';

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

      let questionList = res.survey.surveyQuestions;
      let answerObj = {};
      if (res.userSurveyAnswer) {
        picurl = res.userSurveyAnswer.picurl;
        answerObj = res.userSurveyAnswer.answers;
      }

      let list = questionList.filter(res => {
        if (res.questionType === 'multi-select' || res.questionType === 'single-select') {
          let answer = answerObj[res.id];
          if (answer) {
            if (Array.isArray(answer.content)) {
              res.options = res.options.map(option => {
                answer.content.map(ans => {
                  if (option.value === ans) { // question.options 里选择的答案selected = true
                    option.selected = true;
                  }
                });
                return option;
              });
            }
            res.answer = answer;
          }
          //  res.answer = answerList.filter(answer => { // 拿到已选择的答案列表
          //   if (answer && answer.surveyQuestionId === res.id && Array.isArray(answer.content)) {
          //     res.options = res.options.map(option => {
          //       answer.content.map(ans => {
          //         if (option.value === ans) { // question.options 里选择的答案selected = true
          //           option.selected = true;
          //         }
          //       });
          //       return option;
          //     });
          //     return answer;
          //   }
          // });
          return res;
        }
      });

      const questionItem = list[qindex];
      let committed = false;

      list[qindex].options = questionItem.options.map(res => {
        res.selected = res.selected ? res.selected : false;
        if (res.selected) {
          committed = true;
        }
        return res;
      });

      const rightAnwser = questionItem.options.filter((res, i) => res.isRight === true);
      const selectedAnwser = questionItem.answer && questionItem.answer.content ? questionItem.answer.content : [];
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
        attributes: questionItem,
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

    let selectedAnwser = this.data.attributes.options.map((res, i) => {
      if (res.selected) {
        return res.value;
      }
    });
    selectedAnwser = selectedAnwser.filter(res => res);
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
    this.data.questionList[this.data.qindex].answer = [{
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
      // request({
      //   url: `${app.globalData.apiBase}/surveys/${surveyId}/user-survey-answers`,
      //   method: 'post',
      //   data
      // }).then(res => {
      graphql(`
        mutation {
          userSurveyAnswer(
            userId: "${Auth.getLocalUserId()}",
            surveyId: "${surveyId}",
            answers: [{
              content: ${JSON.stringify(this.data.selectedAnwser)},
              surveyQuestionId: "${this.data.questionList[this.data.qindex].id}"
            }]) {
            id
          }
        }
        `
      ).then(res => {
        isUploading = false;
        wx.showToast({
          title: '提交成功',
          duration: 1000
        });

        this.setData({
          committed: true
        })

        wx.pageScrollTo({
          scrollTop: 5000
        });

        const list = this.data.allQuestionList.filter(res => res.questionType !== 'desc');
        if (completeAmount === list.length - 1) {
          if (!picurl) {
            User.getSurveyAndAnswers(postId, albumId, true)
              .then(res => {
              if (!res.survey) return;
              if (res.userSurveyAnswer) {
                picurl = res.userSurveyAnswer.picurl;
              }
              wx.navigateTo({
                url: `../album/share?imgUrl=${picurl}`
              });
            });
          } else {
            wx.navigateTo({
              url: `../album/share?imgUrl=${picurl}`
            });
          }
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
