const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

let albumId = undefined,
    postId = undefined,
    isNew = 'true',
    picNumber = 0,
    contentArray = [],
    isUploading = false;

Page({
  data: {
    editorInfo: {},
    post: {},
    questionList: [],
    surveyData: {}
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#42BD56'
    });
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
      url += `?postId=${postId}&albumId=${albumId}`;
    }
    request({
      url: url,
    }).then(res => {
      const albumAttributes = res.data.attributes || {},
            post = res.data.relationships.post.data || {};
      albumId = res.data.id;
      postId = post.id;
      this.setData({
        editorInfo: albumAttributes.editorInfo,
        post
      });

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
      let questionList = res.included.filter(res => res.type === 'SurveyQuestions');
      let answerList = res.included.filter(res => res.type === 'userSurveyAnswers');
      questionList = questionList.map(res => {
         res.attributes.picurlList = [];
         res.attributes.inputCount = 0;
         return res;
      });
      this.setData({
        questionList: questionList,
        surveyData: res.data
      });
    });
  },

  addPic: function(event) {
    const that = this,
          qindex = event.currentTarget.dataset.qindex;
    wx.chooseImage({
      success: function(res) {

        let newPicList = [];
        for (let i = 0; i < res.tempFilePaths.length; i++) {
          picNumber ++;
          wx.uploadFile({
            url: `${app.globalData.apiBase}/surveys/${that.data.surveyData.id}/photo`,
            filePath: res.tempFilePaths[i],
            name: 'photo',
            formData:{
              isNew: isNew, // 整个survey 答案重置
              userId: Auth.getLocalUserId(),
              surveyQuestionId: that.data.questionList[qindex].id,
              picId: `pic_${picNumber}`
            },
            success: function(res){
              var data = res.data;
              console.log(`upload pic_${picNumber}:  ` + data);
            }
          })

          isNew = 'false';
          that.data.questionList[qindex].attributes.picurlList.push({id: `pic_${picNumber}`, url: res.tempFilePaths[i]});
        }

        that.setData({
          questionList: that.data.questionList
        });
      }
    })
  },

  delete: function(event) {
    const idx = event.currentTarget.dataset.idx,
          qindex = event.currentTarget.dataset.qindex,
          picid = event.currentTarget.dataset.picid;
    this.data.questionList[qindex].attributes.picurlList.splice(idx,1);

    this.setData({
      questionList: this.data.questionList
    });

    request({
      url: `${app.globalData.apiBase}/surveys/${this.data.surveyData.id}/photo?userId=${Auth.getLocalUserId()}&surveyQuestionId=${this.data.questionList[qindex].id}&picId=${picid}`,
      method: 'delete',
    }).then(res => {
      console.log( `delete ${picid} over`);
    });
  },

  onInput: function(event) {
    const qindex = event.currentTarget.dataset.qindex;

    this.data.questionList[qindex].attributes.inputCount = event.detail.value.length;

    this.setData({
      questionList: this.data.questionList
    });
    const list = contentArray.filter(res => res.key === qindex);
    if (list.length === 0) {
      contentArray.push({key: qindex, value: event.detail.value});
    } else {
      contentArray[contentArray.indexOf(list[0])] = {key: qindex, value: event.detail.value};
    }
  },

  commit: function() {
    if (isUploading) {
      return;
    }
    if (contentArray.length === this.data.questionList.length) {
      isUploading = true;

      let data = {
        data: [],
        meta: {
          userId: Auth.getLocalUserId(),
          isNew: isNew, // 整个survey 答案重置
        }
      };
      for (let i = 0; i < contentArray.length; i++) {
        data.data.push({
          attributes: {
            surveyQuestionId: this.data.questionList[contentArray[i].key].id,
            content: contentArray[i].value,
          }
        });
      }
      request({
        url: `${app.globalData.apiBase}/surveys/${this.data.surveyData.id}/user-survey-answers`,
        method: 'post',
        data
      }).then(res => {
        console.log( `upload form over`);
        isUploading = false;
        wx.showToast({
          title: '提交成功',
          duration: 1000,
          complete: function() {
            wx.redirectTo({
              url: `../album/daily?postId=${postId}&albumId=${albumId}`
            });
          }
        });
      });

      isNew = 'false';
    } else {
      wx.showToast({
        title: '请答完所有题',
        duration: 1000,
        image: '../../images/survey/delete.jpg'
      });
    }
  }
})
