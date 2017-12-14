const {request} = require('./request');

const post = data => {
  return request({
    header: {
      Authorization: null
    },
    url: `http://localhost:5000/graphql?`,
    data,
    method: 'POST'
  })
}

module.exports = post;