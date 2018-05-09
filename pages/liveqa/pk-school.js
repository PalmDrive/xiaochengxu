const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql'),
      {saveFormId} = require('../../utils/user');

const QA_SURVEY_ID = 'QASurvey',
      soundEffectSrc = {
        rightAnswer: 'https://cdn.ailingual.cn/audios/liveqa/right_answer_audio.mp3',
        wrongAnswer: 'https://cdn.ailingual.cn/audios/liveqa/wrong_answer_audio.mp3',
        allPass: 'https://cdn.ailingual.cn/audios/liveqa/all_pass_audio.mp3',
      },
      questionAttrs = 'id, content, questionType, questionOrder, options, surveyId, difficulty';

class LivePk {
  /**
   * @param {number} TIMER
   */
  constructor (settings) {
    let questions,
        liveId,
        liveSchoolId,
        ranking; // 守方学校排名

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
        question: null,
        timer: settings.TIMER,
        defSchool: {points: 0}, // 守方学校
        state: 0,
        result: {},
        pkCount: 0,
        questionIndex: 0,
        ossUrl: 'http://cdn.gecacademy.cn/miniprogram/version_2/',
        hidePkImage: false
      },

      onLoad(options) {
        liveId = options.liveId
        liveSchoolId = options.liveSchoolId
        ranking = options.ranking
        this._fetchData()
        setTimeout(() => {
          this.setData({hidePkImage: true})
        }, 2000)
      },

      selectAnswer(e) {
        if (processing) {
          console.log('double click prevented.');
          return;
        };
        processing = true;

        const question = this.data.question,
              user = this.data.user,
              option = e.currentTarget.dataset.option;

        if(!option) {
          processing = false;
          throw('option is invalid');
        }

        question.options.forEach(op => {
          if (option.value === op.value) {
            op.selected = true;
            user.leftTime = this.data.timer;
            user.isRight = op.isRight ? true : false;
            op.showWrong = !op.isRight
          }
        });
        question.selected = true;
        this.setData({question});

        if (option.isRight) {
          this._playSound('rightAnswer')
        } else {
          this._playSound('wrongAnswer')
        }

        if (question.schoolSelected) {
          this._savePkScore(user.leftTime, settings.TIMER - question.pkTime, user.isRight, question.isRight)
        }
      },

      onShareAppMessage(options) {
        return {
          title: `${this.data.user.wxUsername}邀你参战为母校争光 瓜分50万大奖`,
          path: `/pages/liveqa/pk-success?liveId=${liveId}&liveSchoolId=${liveSchoolId}&userId=${this.data.user.id}`,
          imageUrl: 'http://cdn.gecacademy.cn/miniprogram/version_2/success_share.jpg'
        };
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
        // pk 失败
        if (this.data.questionIndex < 4) {
          wx.showToast({title: '你放弃了战斗', duration: 2000, icon: 'none'});
        }
      },

      formSubmit(e) {
        const event = {
          currentTarget: e.detail.target
        };
        saveFormId(this.data.user.id, e.detail.formId);
        this.selectAnswer(event);
      },

      _fetchData() {
        const user = Auth.getLocalUserInfo(),
              beginningOfDay = new Date(),
              endOfDay = new Date(),
              variables = {
                couponFilter: {name: '答题成绩分享'}
              },

              query = `query q($couponFilter: JSON) {
                liveSchools (id: "${liveSchoolId}") {
                  id, name, points, ranking, profilePicUrl
                }
                userPkQuestions(userId: "${user.id}", rank: ${parseInt(ranking)}) {
                  content,id,options,pkTime,isRight,difficulty
                }
                remainingPkCount(userId: "${user.id}")
                coupons(filter: $couponFilter) {
                  id
                }
              }`;

        beginningOfDay.setHours(0, 0, 0, 0);
        endOfDay.setHours(23, 59, 59, 0);

        return graphql(query, variables)
          .then(res => {
            const pkCount = res.data.remainingPkCount;
            couponId = res.data.coupons[0] ? res.data.coupons[0].id : null;

            const userPkQuestions = res.data.userPkQuestions || [];
            const school = res.data.liveSchools ? res.data.liveSchools[0] : {}

            if (!school.profilePicUrl) {
              school.firstLetter = school.name.substr(0,1)
              school.hiddenImage = true
            }

            userPkQuestions.map(obj => {
              obj.options.map(opt => {
                if (!opt.isRight && !obj.schoolSelectedOption && !obj.isRight) {
                  obj.schoolSelectedOption = opt.value
                  return
                }

                if (obj.isRight && opt.isRight) {
                  obj.schoolSelectedOption = opt.value
                  return
                }
              })
              return obj
            })

            const d = {
              user:  _.extend({
                id: user.id
              }, user.attributes),
              question: userPkQuestions[0],
              defSchool: school,
              pkCount: pkCount
            };
            questions = userPkQuestions
            this.setData(d);

            if (pkCount <= 0) {
              wx.showToast({
                title: '今日挑战次数剩余为0，明日再战',
                icon: 'none',
                duration: 2000
              })
              setTimeout(() => {
                wx.redirectTo({url: `/pages/liveqa/index`});
              }, 1000)
            } else {
              this._countDown();
            }
          })
      },

      _nextQuestion() {
        if (this.data.questionIndex < questions.length - 1) {
          this.setData({
            question: questions[this.data.questionIndex + 1],
            timer: settings.TIMER,
            questionIndex: this.data.questionIndex + 1
          });
          this._countDown();
        } else {
          // 挑战完成
          this._savePkPoints()
        }
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
          const question = this.data.question;

          if (timer === 0) {
            this._clearTimer();
            if (question.schoolSelected) {
              this.setData({question});
              this._savePkScore(0, settings.TIMER - question.pkTime, false, question.isRight)
            } else {
              this._savePkScore(0, 0, false, false)
            }
          } else {
            timer -= 1;
            this.setData({timer});
            if (liveId && ((settings.TIMER - timer) === question.pkTime)) { // pk
              this.data.question.schoolSelected = true;
              if (question.selected) { // 攻方先答完，显示答案
                this.setData({question});
                this._savePkScore(this.data.user.leftTime, timer, this.data.user.isRight, question.isRight)
              }
              return
            }
          }
        }, 1000);
      },

      _playSound(name) {
        let ctx = audioCtxs[name];

        if (!audioCtxs[name]) {
          audioCtxs[name] = wx.createInnerAudioContext();
          ctx = audioCtxs[name];
          ctx.src = soundEffectSrc[name];
        }

        ctx.play();
      },

      _savePkScore(userLeftTime, schoolLeftTime, userAnswer, schoolAnswer) {
        const query = `mutation {
          calculatePkATKAndDEF(liveId: "${liveId}", userLeftTime: ${userLeftTime}, schoolLeftTime: ${schoolLeftTime}, userAnswer: ${userAnswer}, schoolAnswer: ${schoolAnswer}, round: ${this.data.questionIndex + 1})
        }`;
        return graphql(query)
          .then(res => {
            const calculatePkATKAndDEF = res.data.calculatePkATKAndDEF;
            const oldDEF = this.data.defSchool.DEF || 0
            const oldATK = this.data.user.points || 0
            this.data.defSchool.DEF = calculatePkATKAndDEF.DEF + oldDEF
            this.data.user.points = calculatePkATKAndDEF.ATK + oldATK
            this.setData({
              user: this.data.user,
              defSchool: this.data.defSchool
            })
            this._clearTimer();
            setTimeout(() => {
              processing = false;
              this._nextQuestion();
            }, 2000);
        })
      },

      _savePkPoints() {
        const query = `mutation {
          calculatePkPoints(liveId: "${liveId}")
        }`;
        return graphql(query)
          .then(res => {
            const calculatePkPoints = res.data.calculatePkPoints;
            if (!calculatePkPoints) return
            if (calculatePkPoints.points > 0) {
              // 挑战成功
              this._playSound('allPass');
            }
            this.setData({
              result: calculatePkPoints,
              state: 1
            })
        })
      },

      clickFirstButton() {
        if (this.data.pkCount > 0) {
          wx.navigateBack({
            delta: 1
          })
        } else {
          wx.showToast({
            title: '今日挑战次数剩余为0，明日再战',
            icon: 'none',
            duration: 2000
          })

          setTimeout(() => {
            wx.redirectTo({url: `/pages/liveqa/index`});
          }, 2000)
        }
      }
    };
  }
}

const controller = new LivePk({
  TIMER: 15
});
Page(controller);
