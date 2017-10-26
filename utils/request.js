const _ = require('../vendors/underscore'),
      clientVersion = '1.9.4';

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

const _isErrResp = (resp) => {
  return ['4', '5'].indexOf(resp.statusCode.toString()[0]) !== -1;
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

  let url = opts.url;
  if (url.indexOf('?') === -1) {
    url += `?client_version=${clientVersion}`;
  } else {
    url += `&client_version=${clientVersion}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      data: opts.data,
      header: defaultOpts.header,
      method: opts.method,
      dataType: opts.dataType,
      success(res) {
        if (_isErrResp(res)) {
          reject(res.data);
        }

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