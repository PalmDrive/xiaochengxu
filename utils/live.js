const utils = require('./util'),
      Auth = require('./auth'),
      _ = require('../vendors/underscore'),
      graphql = require('./graphql'),
      {saveFormId} = require('./user');

const QA_SURVEY_ID = 'QASurvey',
      soundEffectSrc = {
        rightAnswer: 'https://cdn.ailingual.cn/audios/liveqa/right_answer_audio.mp3',
        wrongAnswer: 'https://cdn.ailingual.cn/audios/liveqa/wrong_answer_audio.mp3',
        allPass: 'https://cdn.ailingual.cn/audios/liveqa/all_pass_audio.mp3',
      },
      questionAttrs = 'id, content, questionType, questionOrder, options, surveyId, difficulty';

class Live {
  /**
   * @param {number} TIMER
   */
  constructor (settings) {
    // cache userSurveyAnswers, userLive, questionRewards
    let userSurveyAnswers = [],
        userLive,
        questionRewards;

    let countDownTimer,
        couponId, // 用户生成分享海报
        processing = false;
    const audioCtxs = {
      rightAnswer: null,
      wrongAnswer: null,
      allPass: null,
    };

    return {
      data: {
        user: null,
        survey: null,
        question: null,
        timer: settings.TIMER,
        status: "答题中", // 答题中，回答错误，回答正确，已超时
        modal: 0, // 1: 显示积分翻倍modal， 2： 显示红包奖励modal
        state: 0, // 0: 答题进行中 1: 打错or超级答题结束 2: 通关
        pager: null,
        reward: {
          points: null,
          cash: null
        }, // 记录回答一个题目正确以后获得的reward
      },

      onLoad(options) {
        this._fetchData()
          .then(data => {
            userLive = data.userLive;
            questionRewards = data.questionRewards;

            this._setQuestionOptions(data.survey.surveyQuestions);
            const d = {
              user: data.user,
              survey: data.survey,
              question: data.question
            };
            if (!data.question) {
              if (userLive.status === 303) {
                d.state = 2
              } else {
                d.state = 1;
              }
            }

            if (!this.data.state) this._countDown();

            d.pager = this._getPager();
            this.setData(d);
          });
      },

      selectAnswer(e) {
        if (processing) {
          console.log('double click prevented.');
          return;
        };
        processing = true;
        this._clearTimer();

        const question = this.data.question,
              user = this.data.user,
              option = e.currentTarget.dataset.option;

        if(!option) {
          processing = false;
          throw('option is invalid');
        }

        const answer = this._newAnswer(option);

        question.options.forEach(op => {
          op.selected = option.value === op.value;
        });
        question.selected = true;
        this.setData({question});

        this._saveUserSurveyAnswer(answer)
          .then(this._onSaveUserSurveyAnswer)
          .catch(err => {
            processing = false;
            console.log('Data is not saved. Error:');
            // 数据没有保存上
            console.log(err);
          });
      },

      onShareAppMessage(options) {
        return {
          title: `${this.data.user.wxUsername}邀请你参加高校答题番位争夺战`,
          path: '/pages/liveqa/index',
          imageUrl: 'http://cdn.gecacademy.cn/miniprogram/qa_cover.jpg'
        };
      },

      gotoReviveTasks() {
        wx.navigateTo({
          url: '/pages/liveqa/revive-tasks'
        });
      },

      gotoSharedPosterForAllPass() {
        let params = {
          points: this.data.user.qaRewardToday.points,
          school: this.data.user.myLiveSchool.name,
          ranking: this.data.user.myLiveSchool.rtRanking,
        };
        params = JSON.stringify(params);
        const url = `/pages/album/share?couponId=${couponId}&params=${params}`;

        wx.navigateTo({url});
      },

      onHide() {
        this._clearTimer();
      },

      onUnload() {
        this._clearTimer();
      },

      formSubmit(e) {
        const event = {
          currentTarget: e.detail.target
        };
        saveFormId(this.data.user.id, e.detail.formId);
        this.selectAnswer(event);
      },

      _fetchQuestion(id) {
        if (id) {
          return graphql(`query {
            surveyQuestions(id: "${id}")
          }`)
          .then(res => res.data.surveyQuestions[0]);
        } else {
          return graphql(`query {
            question
          }`)
          .then(res => {
            userLive = res.data.question.userLive;
            return res.data.question.question;
          });
        }
      },

      _fetchData() {
        const user = Auth.getLocalUserInfo(),
              beginningOfDay = new Date(),
              endOfDay = new Date(),
              variables = {
                couponFilter: {name: '答题成绩分享'}
              },
              query = `query q($couponFilter: JSON) {
                question
                users(id: "${user.id}") {
                  qaRewardToday {
                    points, cash
                  },
                  extraQALives,
                  myLiveSchool {
                    name, rtRanking
                  }
                }
                questionRewards {
                  cash,
                  bonus,
                  points,
                  index
                }
                coupons(filter: $couponFilter) {
                  id
                }
              }`;

        beginningOfDay.setHours(0, 0, 0, 0);
        endOfDay.setHours(23, 59, 59, 0);

        return graphql(query, variables)
          .then(res => {
            const data = res.data.question,
                  question = data.question,
                  survey = {
                    surveyQuestions: question ? [question] : [],
                    id: question && question.surveyId
                  };

            if (data.todayAns) {
              userSurveyAnswers = data.todayAns;
            }

            couponId = res.data.coupons[0] ? res.data.coupons[0].id : null;

            return {
              survey: survey,
              user: _.extend({
                id: user.id
              }, user.attributes, res.data.users[0]),
              question,
              questionRewards: res.data.questionRewards,
              userLive: data.userLive,
            };
          });
      },

      _nextQuestion() {
        let currIndex = null,
            nextQuestionId = null,
            nextQuestion = null,
            totalQuestionsCount = questionRewards.length,
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
        if (currIndex && currIndex < userSurveyAnswers.length - 1) {
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
                    timer: settings.TIMER,
                    user: this.data.user
                  };

            if (question) {
              survey.surveyQuestions.push(question);
              this._setQuestionOptions(survey.surveyQuestions);
              data.pager = this._getPager();
              this._countDown();
            } else {
              if (userLive.status === 303) {
                // 牛逼, 通关了
                data.state = 2;
                this._playSound('allPass');

                // Get liveschool ranking
                graphql(`query {
                  users(id: "${this.data.user.id}") {
                    myLiveSchool { rtRanking }
                  }
                }`)
                  .then(res => {
                    _.extend(data.user.myLiveSchool, res.data.users[0].myLiveSchool);
                    this.setData(data);
                  });
              } else {
                data.state = 1;
              }
            }

            this.setData(data);

            processing = false;
          });
      },

      _saveUserSurveyAnswer(answer) {
        const query = `mutation {
          userSurveyAnswer (
             surveyId: "${answer.surveyId}",
             userId: "${answer.userId}",
             surveyQuestionId: ${answer.surveyQuestionId},
             isNew: false,
             status: ${answer.status},
             content: "${answer.content}",
             difficulty: ${answer.difficulty}
          ) {
            id, status, cash, points, content, userId, surveyId, surveyQuestionId, difficulty
            user {
              extraQALives,
              qaRewardToday {
                cash, points
              }
            }
          }
        }`;

        return graphql(query);
      },

      _onSaveUserSurveyAnswer(res) {
        const user = this.data.user,
              ans = res.data.userSurveyAnswer,
              status = ans.status,
              data = {};

        userSurveyAnswers.push(ans);

        const reward = questionRewards[userSurveyAnswers.length - 1];

        ['points', 'cash'].forEach(f => {
          if (ans[f]) reward[f] = ans[f];
        });
        data.reward = reward;

        let wait = 1000;

        if (status) {
          this._playSound('rightAnswer');

          _.extend(user, ans.user);
          data.user = user;
          if (reward.bonus) {
            wait = 3000;
            this._showModal(1, wait + 200, data);
          } else if (reward.cash) {
            wait = 3000;
            this._showModal(2, wait + 200, data);
          } else {
            wx.showToast({
              title: `积分 +${reward.points}`,
              duration: wait,
              icon: 'none'
            });
          }

          this.setData(data);
          // this.setData({
          //   status: '回答正确',
          //   //question
          // });
          setTimeout(() => {
            this._nextQuestion();
          }, wait);
        } else {
          this._playSound('wrongAnswer');
          // this.setData({
          //   status: '回答错误'
          // });

          // 如果有复活卡，自动应用复活卡
          if (user.extraQALives > 0) {
            this._redeemExtraLiveAndGoOn(wait);
          } else {
            setTimeout(() => {
              processing = false;
              this.setData({state: 1});
            }, wait);
          }
        }
      },

      _setQuestionOptions(questions) {
        const key = 'value';
        questions.forEach((q, i) => {
          const ans = _.findWhere(userSurveyAnswers, {
            surveyQuestionId: q.id
          });
          if (ans) {
            const option = _.findWhere(q.options, {[key]: ans.content});
            if (option) {
              option.selected = true;
            }
          }

          // for testing
          //q.options[0]. selected = true;
        });
        return questions;
      },

      _clearTimer() {
        if (countDownTimer) {
          clearInterval(countDownTimer);
          countDownTimer = null;
        }
      },

      _countDown() {
        // for dev
        //return;
        this._clearTimer();

        const user = this.data.user,
              wait = 1000;
        countDownTimer = setInterval(() => {
          let timer = this.data.timer;
          if (timer === 0) {
            this._clearTimer();
            // this.setData({
            //   status: '已超时',
            // });
            // Save an answer with content null
            const answer = this._newAnswer({
              value: null, isRight: 0
            });
            return this._saveUserSurveyAnswer(answer)
              .then(this._onSaveUserSurveyAnswer)
          } else {
            timer -= 1;
            this.setData({timer});
          }
        }, 1000);
      },

      _getPager() {
        const page = userSurveyAnswers.length + 1,
              pages = questionRewards.length,
              pagerLength = 13;
        let pager = utils.getPager(page, pages, pagerLength);
        pager = pager.map(p => {
          const obj = {label: p};
          if (obj.label !== '...') {
            const reward = _.findWhere(questionRewards, {index: Number(p)});
            reward.active = reward.index === page;
            _.extend(obj, reward || {});
          }

          return obj;
        });
        return pager;
      },

      _redeemExtraLiveAndGoOn(wait) {
        return this._redeemExtraLive()
          .then(updatedUser => {
            this.setData({user: updatedUser});
            wx.showToast({title: '自动扣除复活卡1张', duration: wait, icon: 'none'});
            setTimeout(() => {
              this._nextQuestion();
            }, wait);
          });
      },

      _updateUserLive(data) {
        const query = `mutation userLive($data: JSON) {
                userLive(id: "${userLive.id}", data: $data) {
                  id, status
                }
              }`,
              variables = {
                data
              };
        return graphql(query, variables)
          .then(res => {
            // Update local userLive cache
            _.extend(userLive, data);
            return res;
          });
      },

      _redeemExtraLive() {
        const user = this.data.user;

        return this._updateUserLive({status: 100})
          .then(() => {
            user.extraQALives = user.extraQALives - 1;
            return user;
          });
      },

      _newAnswer(option) {
        const question = this.data.question,
              user = this.data.user,
              answer = {
                surveyId: QA_SURVEY_ID,
                userId: user.id,
                status: option.isRight ? 1 : 0,
                content: option.value ? option.value : null,
                surveyQuestionId: question.id,
                difficulty: question.difficulty
              };
        return answer;
      },

      _showModal(modal, duration, data) {
        duration = duration || 1000;

        if (data) {
          data.modal = modal;
        } else {
          this.setData({modal});
        }

        setTimeout(() => {
          this.setData({modal: 0});
        }, duration);

        return data;
      },

      _playSound(name) {
        let ctx = audioCtxs[name];

        if (!audioCtxs[name]) {
          audioCtxs[name] = wx.createInnerAudioContext();
          ctx = audioCtxs[name];
          ctx.src = soundEffectSrc[name];
        }

        ctx.play();
      }
    };
  }
}

module.exports = Live;
