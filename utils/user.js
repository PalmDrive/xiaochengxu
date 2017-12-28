const {request} = require('./request'),
      graphql = require('./graphql'),
      Auth = require('auth');

let _albumIdsMap = null,
    _albums = null,

    /*
     * index by ${postId}_${albumId},
     * the value is:
     * {
         id, attributes: {}, type: 'surveys',
         relationships: {
           surveyQuestions: {data: [{id, attributes: {}}, ]},
           userSurveyAnswer: {data: {id, attributes: {}}} // optional
         }
       }
     */
    _surveysMap = {},
    _filterQuestionsMap = {};

function getPurchasedAlbumIdsMap(force) {
  const app = getApp() || this,
        userId = Auth.getLocalUserId();
  if (_albumIdsMap && !force) {
    return new Promise(resolve => resolve(_albumIdsMap));
  } else {
    // return request({
    //   url: `${app.globalData.apiBase}/user-albums?userId=${userId}&fields[userAlbums]=albumId,metaData&filter[role]=2`
    // })
    //   .then(res => {
    return graphql(`{
      userAlbums(
        userId: "${userId}",
        role: "2") {
          id,
          albumId
        }
    }`).then(res => {
        _albumIdsMap = (res.data.userAlbums || [])
          .map(d => d.albumId)
          .reduce((memo, id) => {
            memo[id] = 1;
            return memo;
          }, {});
        return _albumIdsMap;
      });
  }
};

function getPurchasedAlbums(userId, options={page: {size:5,number:1}}) {
  const app = getApp();
  userId = userId || Auth.getLocalUserId();
  return request({
    url: `${app.globalData.apiBase}/users/${userId}/relationships/albums?page[size]=${options.page.size}&page[number]=${options.page.number}&fields[albums]=title,picurl&filter=unlocked`
  })
    .then(res => res.data);
}

function addAlbumId(id) {
  // call getPurchasedAlbumIdsMap in case _albumIdsMap is null
  return getPurchasedAlbumIdsMap()
    .then(map => map[id] = 1);
}

function getSurveyAndAnswers(postId, albumId, force) {
  const app = getApp(),
        url = `${app.globalData.apiBase}/morning-posts/${postId}/survey`,
        key = `${postId}_${albumId}`;

  if (_surveysMap[key] && !force) {
    return new Promise(resolve => resolve(_surveysMap[key]));
  } else {
    // return request({
    //   url,
    //   data: {albumId}
    // })
    // .then(res => {

    let param = `{
      survey(albumId: "${albumId}", postId: "${postId}", surveyType: "task") {
        id,
        description,
        surveyQuestions{
          id,
          questionType,
          content,
          description,
          options,
          metaData
        },
        userSurveyAnswersCount,
        metaData
      }
      userSurveyAnswer(userId: "${Auth.getLocalUserId()}",postId:"${postId}") {
        picurl,
        answers,
        updatedAt
      }
    }`;

    return graphql(param).then(res => {
      console.log(res);
      const data = res.data;
            // relationships = data.relationships;
      // Add question attributes from included data
      // if (relationships) {
      //   relationships.surveyQuestions.data.forEach(q => {
      //     const question = res.included.filter(d => d.type === 'SurveyQuestions' && d.id === q.id)[0];
      //     q.attributes = question.attributes;
      //   });
      //   const userSurveyAnswer = res.included.filter(d => d.type === 'userSurveyAnswers')[0];
      //   if (userSurveyAnswer) {
      //     relationships.userSurveyAnswer = {data: userSurveyAnswer};
      //   }
      // }
      // add to _surveysMap
      _surveysMap[key] = data;
      return data;
    });
  }
}

function getFilterQuestions(albumId, force) {
  const app = getApp(),
        url = `${app.globalData.apiBase}/albums/${albumId}/relationships/surveys`,
        key = `${albumId}`;

  if (_filterQuestionsMap[key] && !force) {
    return new Promise(resolve => resolve(_filterQuestionsMap[key]));
  } else {
    // return request({
    //   url,
    //   data: {albumId}
    // })
    // .then(res => {
    let param = `
      {
        userSurveyAnswers (albumId: "${albumId}", userId: "${Auth.getLocalUserId()}") {
          id,
          surveyId,
          userId,
          answers
        },
        surveyQuestions (albumId: "${albumId}",isFeatured: true)
        {
          id,
          surveyId,
          isFeatured,
          metaData,
          content
        }
        albums (id: "${albumId}") {
          id,
          posts{
            metaData
          }
        }
      }`;

    return graphql(param).then(res => {
      console.log(res);
      const questions = res.data.surveyQuestions,
            posts = res.data.albums[0].posts,
            userSurveyAnswers = res.data.userSurveyAnswers;

      let answers = {},
          sumUpList = [];
      userSurveyAnswers.map(obj => {
         for (var i in obj.answers) {
           answers[i] = obj.answers[i];
         }
      });
      posts.map(post => {
        sumUpList = sumUpList.concat(post.metaData.bulletpoints);
      })
      let newData = {
        questions,
        answers,
        sumUpList
      };
      _filterQuestionsMap[key] = newData;
      return newData;
    });
  }
}

function getPeerAnswers(postId, albumId, page) {
  const defaultPage = {
    number: 1, size: 5
  },
       url = `${getApp().globalData.apiBase}/user-survey-answers/peers`;
  Object.assign(defaultPage, page || {});

  let param = `
    {
      userSurveyAnswers (postId:"${postId}",albumId:"${albumId}", pageSize: ${page.size}, pageNumber: ${page.number}) {
        id,
        answers,
        user{
          id,
          wxUsername,
          profilePicUrl
        }
      }
    }`;

  return graphql(param);


  // return request({
  //   url,
  //   data: {
  //     postId,
  //     albumId,
  //     include: 'users',
  //     'page[size]': defaultPage.size,
  //     'page[number]': defaultPage.number
  //   }
  // })
  // .then(res => {
    // add user attributes
    // res.data.forEach(d => {
    //   const user = d.relationships.user.data;
    //   if (user) {
    //     const includedUser = res.included.filter(obj => obj.type === 'Users' && obj.id === user.id)[0];
    //     user.attributes = includedUser ? includedUser.attributes : {};
    //   }
    // });
  //   return res;
  // });
}

module.exports = {
  getPurchasedAlbums,
  getPurchasedAlbumIdsMap,
  addAlbumId,
  getSurveyAndAnswers,
  getPeerAnswers,
  getFilterQuestions
}
