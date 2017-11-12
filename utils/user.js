const {request} = require('./request'),
      Auth = require('auth');

let _albumIdsMap = null,
    _albums = null;

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

module.exports = {
  getPurchasedAlbums,
  getPurchasedAlbumIdsMap,
  addAlbumId
}
