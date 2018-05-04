const {request} = require('./request'),
      baseUrls = {
        dev: 'http://192.168.1.10:10001/graphql',
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
    url: baseUrls[env],
    data,
    method: 'POST'
  });
};

module.exports = post;
