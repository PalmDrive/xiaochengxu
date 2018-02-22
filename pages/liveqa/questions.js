const mockData = require('../../utils/mockData'),
      utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

Page({
  data: {
    live: null,
    user: null,
    survey: null,
    question: null,
    answers: {}
  },

  onLoad(options) {
    this._fetchData()
      .then(data => {
        this.setData({
          //live: data.live,
          user: data.user,
          survey: data.survey,
          question: this._getQuestion(1, data.survey)
        });
      });
  },

  selectAnswer(e) {
    const option = e.target.dataset.option,
          answers = {
            [this.data.question.id]: {
              content: option.value
            }
          },
          user = this.data.user;

    this.data.question.options.forEach(op => {
      op.selected = option.value === op.value;
    });

    this._updateUserSurveyAnswer(user.userSurveyAnswerId, answers)
      .then(userSurveyAnswer => {
        user.userSurveyAnswerId = userSurveyAnswer.id;
        this.setData({
          user: user,
          question: this.data.question
        });

        setTimeout(() => {
          this._nextQuestion();
        }, 500);
      })
      .catch(err => {
        console.log('Data is not saved. Error:');
        // 数据没有保存上
        console.log(err);
      });
  },

  _fetchData() {
    const user = Auth.getLocalUserInfo(),
          surveyId = 'survey-1',
          query = `query($surveyId: ID, $userId: ID) {
            survey(id: $surveyId) {
              id,
              surveyQuestions {
                id, content, questionType, questionOrder, options
              }
            }
            userSurveyAnswer(userId: $userId, surveyId: $surveyId) {
              id, answers
            }
          }`,
          variables = {surveyId, userId: user.id};
    return graphql(query, variables)
      .then(res => {
        const userSurveyAnswer = res.data.userSurveyAnswer || {};
        this._setQuestionOptions(res.data.survey.surveyQuestions, userSurveyAnswer.answers);
        const data = {
          survey: res.data.survey,
          user: _.extend({
            id: user.id,
            userSurveyAnswerId: userSurveyAnswer.id
          }, user.attributes),
        };
        return data;
      });
    // return new Promise(resolve => {
    //   _.extend(mockData.user, user.attributes, {id: user.id});
    //   resolve(mockData);
    // });
  },

  _getQuestion(questionOrder, survey) {
    return _.where(survey.surveyQuestions, {questionOrder})[0];
  },

  _nextQuestion() {
    const order = this.data.question.questionOrder + 1,
          question = this._getQuestion(order, this.data.survey);

    if (question) {
      this.setData({question});
    } else {
      console.log('Done');
    }
  },

  _updateUserSurveyAnswer(ansId, answers, isNew) {
    const query = `mutation ($ansId: ID, $answers: JSON, $isNew: Boolean) {
      userSurveyAnswer(
         surveyId: "${this.data.survey.id}",
         userId: "${this.data.user.id}",
         isNew: $isNew,
         answers: $answers,
         id: $ansId
      ) {
        id, surveyId, userId, answers
      }
    }`,
    variables = {
      ansId, answers, isNew
    };
    return graphql(query, variables)
      .then(res => res.data);
  },

  _setQuestionOptions(questions, answers) {
    answers = answers || {};
    const key = 'value';
    questions.forEach(q => {
      const ans = answers[q.id];
      if (ans) {
        const option = _.where(q.options, {[key]: ans.content})[0];
        if (option) {
          option.selected = true;
        }
      }
    });
    return questions;
  }
});
