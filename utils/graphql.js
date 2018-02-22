const {request} = require('./request'),
      baseUrls = {
        dev: 'http://localhost:5000/graphql',
        production: 'https://ainterest-service-production.ailingual.cn/graphql'
      };

const post = (query, variables) => {
  const data = {
          operationName: null,
          query: query,
          variables: variables || null
        },
        app = getApp(),
        env = app.globalData.env;
  return request({
    header: {
      Authorization: null
    },
    url: baseUrls[env],
    data,
    method: 'POST'
  });
};

module.exports = post;
