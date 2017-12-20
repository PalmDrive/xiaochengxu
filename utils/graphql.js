const {request} = require('./request');

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
    url: `http://172.10.23.38:5000/graphql`,
    data,
    method: 'POST'
  })
}

module.exports = post;
