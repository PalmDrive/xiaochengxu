const _ = require('../vendors/underscore');

//let _header = {};

const _getDefaultHeader = () => {
  const {getLocalJWT} = require('auth'),
        jwt = getLocalJWT(),
        header = {};

  if (jwt) {
   header.Authorization = `bearer ${jwt}`;
  }
  return header;
};
/**
 * {
 *   url<string>
 *   data<Object>
 *   header<Object>
 *   method<string> defaut GET
 *   dataType<string>
 * }
 */
const request = opts => {
  const defaultOpts = {
    header: _getDefaultHeader()
  };

  _.extend(defaultOpts.header, opts.header || {});

  return new Promise((resolve, reject) => {
    wx.request({
      url: opts.url,
      data: opts.data,
      header: defaultOpts.header,
      method: opts.method,
      dataType: opts.dataType,
      success(res) {
        resolve(res.data);
      },
      fail(err) {
        reject(err);
      },
      complete() {}
    });
  });
};

// const setRequestDefaultHeader = (header) => {
//   _header = header;
// };

module.exports = {
  request,
  //setRequestDefaultHeader
};