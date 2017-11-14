const {request} = require('./request'),
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
    _surveysMap = {};

function getPurchasedAlbumIdsMap(force) {
  const app = getApp() || this,
        userId = Auth.getLocalUserId();
  if (_albumIdsMap && !force) {
    return new Promise(resolve => resolve(_albumIdsMap));
  } else {
    return request({
      url: `${app.globalData.apiBase}/user-albums?userId=${userId}&fields[userAlbums]=albumId&filter[role]=2`
    })
      .then(res => {
        _albumIdsMap = (res.data || [])
          .map(d => d.attributes.albumId)
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
    return request({
      url,
      data: {albumId}
    })
    .then(res => {
      const data = res.data;
      // Add question attributes from included data
      data.relationships.surveyQuestions.data.forEach(q => {
        const question = res.included.filter(d => d.type === 'SurveyQuestions' && d.id === q.id)[0];
        q.attributes = question.attributes;
      });
      const userSurveyAnswer = res.included.filter(d => d.type === 'userSurveyAnswers')[0];
      if (userSurveyAnswer) {
        data.relationships.userSurveyAnswer = {data: userSurveyAnswer};
      }
      // add to _surveysMap
      _surveysMap[key] = data;
      return data;
    });
  }
}

function getPeerAnswers(postId, albumId, page) {
  const defaultPage = {
    number: 1, size: 5
  },
       url = `${getApp().globalData.apiBase}/user-survey-answers/peers`;
  Object.assign(defaultPage, page || {});
  return request({
    url,
    data: {
      postId,
      albumId,
      include: 'users',
      'page[size]': defaultPage.size,
      'page[number]': defaultPage.number
    }
  })
  .then(res => {
    // add user attributes
    res.data.forEach(d => {
      const user = d.relationships.user.data,
            includedUser = res.included.filter(obj => obj.type === 'Users' && obj.id === user.id)[0];
      user.attributes = includedUser ? includedUser.attributes : {};
    });
    return res;
  });
}

module.exports = {
  getPurchasedAlbums,
  getPurchasedAlbumIdsMap,
  addAlbumId,
  getSurveyAndAnswers,
  getPeerAnswers
}
