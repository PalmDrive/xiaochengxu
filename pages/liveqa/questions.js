const mockData = require('../../utils/mockData'),
      utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

// cache userSurveyAnswers
let userSurveyAnswers = [];

const QA_SURVEY_ID = 'QASurvey',
      questionAttrs = 'id, content, questionType, questionOrder, options, surveyId, difficulty',
      answerAttrs = 'id, content, surveyId, surveyQuestionId, status, userId, difficulty';

Page({
  data: {
    live: null,
    user: null,
    survey: null,
    question: null
  },

  onLoad(options) {
    this._fetchData()
      .then(data => {
        this._setQuestionOptions(data.survey.surveyQuestions);

        this.setData({
          //live: data.live,
          user: data.user,
          survey: data.survey,
          question: data.question
        });
      });
  },

  selectAnswer(e) {
    const option = e.target.dataset.option,
          question = this.data.question,
          user = this.data.user,
          answer = {
            surveyId: QA_SURVEY_ID,
            userId: user.id,
            status: option.isRight ? 1 : 0,
            content: option.value,
            surveyQuestionId: question.id,
            difficulty: question.difficulty
          };

    // if (option.isRight) {
    //   userSurveyAnswers.status = 100;
    //
    //   if (!userSurveyAnswers.answers[question.id]) { // 防止重复增加streak
    //     userSurveyAnswers.streak = userSurveyAnswers.streak + 1;
    //   }
    // } else {
    //   userSurveyAnswers.status = 200; // 因打错导致答题结束
    //   userSurveyAnswers.streak = 0;
    // }

    userSurveyAnswers.push(answer);

    question.options.forEach(op => {
      op.selected = option.value === op.value;
    });

    this._saveUserSurveyAnswer(answer)
      .then(res => {
        this.setData({
          question
        });

        if (option.isRight) {
          setTimeout(() => {
            this._nextQuestion();
          }, 500);
        } else {
          console.log('Wrong answer');
        }
      })
      .catch(err => {
        console.log('Data is not saved. Error:');
        // 数据没有保存上
        console.log(err);
      });
  },

  _fetchQuestion(id) {
    if (id) {
      return graphql(`query {
        surveyQuestions(id: "${id}") {
          ${questionAttrs}
        }
      }`)
      .then(res => res.data.surveyQuestions[0]);
    } else {
      return graphql(`query {
        question {
          ${questionAttrs}
        }
      }`)
      .then(res => res.data.question);
    }
  },

  _fetchData() {
    const user = Auth.getLocalUserInfo(),
          beginningOfDay = new Date(),
          endOfDay = new Date(),
          query = `query($userId: ID, $surveyId: ID, $filter: JSON) {
            question {
              ${questionAttrs}
            },
            userSurveyAnswers(userId: $userId, surveyId: $surveyId, filter: $filter) {
              ${answerAttrs}
            }
          }`,
          variables = {
            surveyId: QA_SURVEY_ID,
            userId: user.id,
            filter: {
              createdAt: {
                $gt: beginningOfDay,
                $lte: endOfDay,
              }
            }
          };

    beginningOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 0);

    return graphql(query, variables)
      .then(res => {
        const question = res.data.question,
              survey = {
                surveyQuestions: [question],
                id: question && question.surveyId
              };

        if (res.data.userSurveyAnswers) {
          userSurveyAnswers = res.data.userSurveyAnswers;
        }

        const data = {
          survey: survey,
          user: _.extend({
            id: user.id
          }, user.attributes),
          question
        };
        return data;
      });
  },

  _nextQuestion() {
    let currIndex = 0,
        nextQuestionId = null,
        nextQuestion = null,
        promise;

    // 确定当前question的index
    userSurveyAnswers.forEach((ans, i) => {
      if (ans.surveyQuestionId === this.data.question.id) {
        currIndex = i;
        return;
      }
    });

    // 先从userSurveyAnswers和this.data.survey.surveyQuestions
    // 中去取cached住的surveyQuestion
    if (currIndex < userSurveyAnswers.length - 1) {
      nextQuestionId = userSurveyAnswers[currIndex + 1].surveyQuestionId;
    }
    if (nextQuestionId) {
      nextQuestion = _.findWhere(this.data.survey.surveyQuestions, {
        id: nextQuestionId
      });

      if (!nextQuestion) {
        // 在cache中都没有找到，但有question id
        promise = this._fetchQuestion(nextQuestionId);
      } else {
        promise = new Promise(resolve => resolve(nextQuestion));
      }
    } else {
      // 在cache中都没有找到，且没有question id
      promise = this._fetchQuestion();
    }

    return promise
      .then(question => {
        const survey = this.data.survey,
              data = {
                question,
                survey,
              };

        survey.surveyQuestions.push(question);
        this._setQuestionOptions(survey.surveyQuestions);

        this.setData(data);
      });
  },

  _saveUserSurveyAnswer(answer) {
    const query = `mutation {
      userSurveyAnswer (
         surveyId: "${answer.surveyId}",
         userId: "${answer.userId}",
         surveyQuestionId: "${answer.surveyQuestionId}"
         isNew: false,
         status: ${answer.status},
         content: "${answer.content}",
         difficulty: ${answer.difficulty}
      ) {
        id
      }
    }`;

    return graphql(query);
  },

  _setQuestionOptions(questions) {
    const key = 'value';
    questions.forEach(q => {
      const ans = _.findWhere(userSurveyAnswers, {
        surveyQuestionId: q.id
      });
      if (ans) {
        const option = _.findWhere(q.options, {[key]: ans.content});
        if (option) {
          option.selected = true;
        }
      }
    });
    return questions;
  }
});
