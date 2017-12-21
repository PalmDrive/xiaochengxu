const {request} = require('./request'),
      baseUrl =  `http://172.10.23.38:5000/graphql`;
      // baseUrl = `https://ainterest-service-production.ailingual.cn/graphql`;

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
