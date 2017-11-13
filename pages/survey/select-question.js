const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

let surveyId = undefined,
    isUploading = false;

Page({
  data: {
    questionList: [],
    qindex: 0,
    attributes: {},
    selectedAnwser: [],
    rightAnwser: [],
    committed: false,
    preButtonDisable: false,
    nextButtonDisable: false
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    });
    surveyId = options.surveyId;

    const qindex = parseInt(options.qindex),
          list = JSON.parse(options.questionList),
          attributes = list[qindex].attributes;

    let committed = false;
    list[0].attributes.options = attributes.options.map(res => {
      res.selected = res.selected ? res.selected : false;
      if (res.selected) {
        committed = true;
      }
      return res;
    });

    const rightAnwser = attributes.options.filter((res, i) => res.isRight === true);
    const selectedAnwser = attributes.answer ? attributes.answer[0].content : [];
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
      committed: committed
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

    this.setData({
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
    this.onLoad({
      surveyId: surveyId,
      questionList: JSON.stringify(this.data.questionList),
      qindex: index
    })
  },

  commit: function() {
    // 下一页
    if (this.data.committed) {
      if (this.data.qindex + 1 < this.data.questionList.length) {
        this.changePage(this.data.qindex + 1);
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
