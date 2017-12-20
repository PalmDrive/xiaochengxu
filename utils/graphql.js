const {request} = require('./request'),
      app = getApp(),
      baseUrl = `${app.globalData.apiBase}../../../graphql`;

const post = query => {
  const data = {
    operationName: null,
    query: query,
    variables: null
  };
  return request({
    header: {
      Authorization: null
    },
    url: baseUrl,
    data,
    method: 'POST'
  })
}

module.exports = post;
