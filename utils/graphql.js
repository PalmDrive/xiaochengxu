const {request} = require('./request');

const post = (url, data) => {
  return request({
    header: {
      Authorization: null
    },
    url: url, //`http://localhost:5000/graphql?`
    data,
    method: 'POST'
  })
}

module.exports = post;
