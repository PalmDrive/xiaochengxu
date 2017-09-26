const Auth = require('../../utils/auth'),
      {toPromise, uniqPush} = require('../../utils/util'),
      Marker = require('../../utils/Marker'),
      AV = require('../../utils/av-weapp-min'),
      LeanCloud = require('../../utils/leancloud');

let mapCtx,
    zdkMarkers,
    clusteredMarkers,
    mapSessionId;

const tmpImagesHash = {};

console.log('init tmpImagesHash');

function onError(err) {
  wx.showModal({
    title: '错误',
    content: err.message || err
  });
  console.log(err);
}

Page({
  data: {
    markers: [],
    size: {},
    center: {
      longitude: 116.5,
      latitude: 39.5
    },
    scale: 16,
    controls: [
      {
        clickable: true,
        id: 'zoomIn',
        position: {
          left: 20,
          top: 20,
          width: 20,
          height: 20,
        },
        iconPath: '/images/like.png'
      },
      {
        clickable: true,
        id: 'zoomOut',
        position: {
          left: 50,
          top: 20,
          width: 20,
          height: 20,
        },
        iconPath: '/images/search.png'
      }
    ]
  },

  _test() {
    const user = Auth.getLocalUserInfo(),
          userInfo = user.attributes || {},
          that = this;

    Marker.getWindowSize();

    let scale, region, centerLocation;

    const users = [
      {
        longitude: 116,
        latitude: 39,
        title: 'a:116,39',
        id: 'a'
      },
      {
        longitude: 116.5,
        latitude: 39.5,
        title: 'a:116.5,39.5',
        id: 'b'
      },
      {
        longitude: 116.55,
        latitude: 39.55,
        title: 'a:116.55,39.55',
        id: 'c'
      },
      {
        longitude: 116.7,
        latitude: 39.7,
        title: 'a:116.7,39.7',
        id: 'd'
      },
      {
        longitude: 117,
        latitude: 40,
        title: 'e:117,40',
        id: 'e'
      },
      {
        longitude: 115,
        latitude: 38,
        title: 'f:115,38',
        id: 'f'
      },
      {
        longitude: 114,
        latitude: 37,
        title: 'g:114,37',
        id: 'g'
      }
    ];

    toPromise(wx.getLocation)({
      type: 'gcj02'
    })
      .then(res => {
        users.push({
          longitude: res.longitude,
          latitude: res.latitude,
          title: `${userInfo.wxUsername}:${res.longitude},${res.latitude}`,
          id: 'h'
        });

        zdkMarkers = users.map(user => new Marker(user));

        console.log('longitude:', res.longitude);
        console.log('latitude:', res.latitude);

        // that.setData({
        //   markers: markers.map(marker => marker.mapAttrs)
        // });
        
        // This scale the map
        mapCtx.includePoints({
          points: zdkMarkers.map(marker => marker.mapAttrs)
        });

        return new Promise(resolve => {
          setTimeout(() => {
            Promise.all([
              Marker.cluster(zdkMarkers, mapCtx),
              toPromise(mapCtx.getScale).call(mapCtx)
            ])
            // Promise.all([
            //   toPromise(mapCtx.getScale).call(mapCtx),
            //   toPromise(mapCtx.getRegion).call(mapCtx),
            //   toPromise(mapCtx.getCenterLocation).call(mapCtx)
            // ])
              .then(resolve);
          }, 1500); // await a while for the resizing done
        });
      })
      .then(res => {
        // [scale, region, centerLocation] = res;
        // console.log('scale:', scale);
        // console.log('region:', region);
        // console.log('region:', centerLocation);
        // const calCenterLocation = {
        //   longitude: (region.northeast.longitude + region.southwest.longitude) / 2,
        //   latitude: (region.northeast.latitude + region.southwest.latitude) / 2,
        // };
        // console.log('calCenterLocation:', calCenterLocation);
        clusteredMarkers = res[0];
        this.setData({
          markers: clusteredMarkers.map(m => m.mapAttrs),
          scale: res[1].scale
        });
      })
      .catch(onError);
  },

  onReady(options) {
    mapCtx = wx.createMapContext('theMap');

    //this._migrate();

    this._onLoad(options || {});
  },

  onLoad(options) {
    //this._onLoad(options);
  },

  _onLoad(options) {
    const id = options.id || '59c7298d7565710044c06a24',
          userId = Auth.getLocalUserId(),
          UserMapSession = AV.Object.extend('UserMapSession');

    mapSessionId = id;

    if (!userId) {
      console.log('not user found');
      return;
    }
    
    let _t = +new Date();

    zdkMarkers = [];

    Marker.getWindowSize();

    new AV.Query('UserMapSession')
      .include(['user'])
      .equalTo('mapSessionId', id) // 所有的
      .find()
    .then(data => {
      const _t2 = +new Date();
      console.log(`${_t2 - _t}ms for UserMapSession query`);
      _t = _t2;

      // let isNew = false;
      // userMapSession = data.filter(d => d.get('userId') === user.id)[0];
      // if (!userMapSession) {
      //   isNew = true;
      //   userMapSession = new UserMapSession();
      //   userMapSession.set('userId', user.id);
      //   userMapSession.set('mapSessionId', id);
      // }
      // const viewLog = userMapSession.get('viewLog') || {};
      // viewLog[(new Date()).toString()] = [currLocation.longitude, currLocation.latitude];
      // userMapSession.set('currLocation', currLocation);
      // //userMapSession.set('viewLog', viewLog);
      // if (isNew) {
      //   userMapSession.set('userInfo', {
      //     wxUsername: userInfo.wxUsername,
      //     profilePicUrl: userInfo.profilePicUrl
      //   });
      // }
      
      // Rendering markers
      zdkMarkers = data.map(d => {
        const user = d.get('user');
        return this._newMarkerFromUser(user);
      });

      return this._renderMarkers(true);
    })
    .catch(onError);
  },

  _setMarkers() {
    this.setData({
      markers: [
        {
          longitude: 116.407526,
          latitude: 39.90403,
          iconPath: '/images/icon.png',
          id: '59c873431b69e6004032bc71',
          width: 50,
          height: 50,
          title: 'Yujun: 0',
          label: {x: 0, y: 0, fontSize: 12, content: 'Yujun: 0'}
        }
      ],
      scale: 18
    }); 
  },

  onMarkerTap(e) {
    const marker = clusteredMarkers.filter(m => m.id === e.markerId)[0];

    const center = {
      longitude: marker.longitude,
      latitude: marker.latitude
    };

    toPromise(mapCtx.getScale).call(mapCtx)
      .then(res => {
        this.setData({
          scale: Math.min(res.scale + 1, 18),
          center
        });

        this._renderMarkers();
      });
  },

  _updateMarkerIconPath() {
    const defaultIconPath = '/images/icon.png';
    const singleMarkers = clusteredMarkers.filter(m => {
      return m.clusteredCount === 0 && (!m.iconPath || m.iconPath === defaultIconPath); //!tmpImagesHash[m.id];
    });

    return Promise.all(singleMarkers.map(m => {
      return toPromise(wx.downloadFile)({url: m.picurl})
        .then(res => {
          //tmpImagesHash[m.id] = res.tempFilePath;
          m.iconPath = res.tempFilePath;
          return;
        }, onError);
    }));
  },

  _renderMarkers(includePoints, wait) {
    wait = wait || 600;

    if (includePoints) {
      mapCtx.includePoints({
        points: zdkMarkers.map(marker => marker.mapAttrs),
        padding: [10, 10, 10, 10]
      });
    }

    return new Promise(resolve => {
      setTimeout(resolve, wait);
    })
      .then(() => Marker.cluster(zdkMarkers, mapCtx))
      .then(res => {
        clusteredMarkers = res;
        return this._updateMarkerIconPath();
      })
      .then(() => {
        this.setData({
          markers: clusteredMarkers.map(m => m.mapAttrs)
        });
      });
  },

  onShareAppMessage() {

  },

  onRegionChange(e) {
    console.log('on region change');
    console.log(e);
  },

  onControlTap(e) {
    let scale; 
    toPromise(mapCtx.getScale).call(mapCtx)
      .then(res => {
        scale = this.data.scale;
        if (e.controlId === 'zoomIn') {
          scale = Math.min(scale + 1, 18);
        } else if (e.controlId === 'zoomOut') {
          scale = Math.max(scale - 1, 5);
        }
        this.setData({scale});
        console.log(`set scale ${scale}`);
        this._renderMarkers();
      });
  },

  start(e) {
    const userId = Auth.getLocalUserId(),
          user = Auth.getLocalUserInfo(),
          userInfo = user.attributes || {};

    if (!userId) {
      return onError('用户id不存在');
    }
    let lcUser;
    LeanCloud.findOrCreate('WechatCampaignUser', {
      zdkId: userId
    }, {
      profileImage: userInfo.profilePicUrl,
      name: userInfo.wxUsername
    })
    .then(res => {
      lcUser = res[0];
      return toPromise(wx.getLocation)({
        type: 'gcj02'
      })
    })
    .then(res => {
      const currLocation = new AV.GeoPoint({
        longitude: res.longitude,
        latitude: res.latitude
      });

      // async
      lcUser.set('currLocation', currLocation);
      
      return LeanCloud.findOrCreate('UserMapSession', {
        user: lcUser,
        mapSessionId
      })
    })
    .then(res => {
      const [userMapSession, created] = res;

      // update viewLog
      const viewLog = userMapSession.viewLog || {};
      viewLog[(new Date().toString())] = [lcUser.get('currLocation').longitude, lcUser.get('currLocation').latitude];
      userMapSession.set('viewLog', viewLog);
      
      zdkMarkers = uniqPush(zdkMarkers, this._newMarkerFromUser(lcUser));

      return this._renderMarkers(true);
    })
    .catch(onError);
  },

  _newMarkerFromUser(user) {
    return new Marker({
      title: user.get('name'),
      longitude: user.get('currLocation').longitude,
      latitude: user.get('currLocation').latitude,
      id: user.id,
      picurl: user.get('profileImage')
    });
  },

  _migrate() {
    new AV.Query('UserMapSession')
      .find()
      .then(data => {
        return Promise.all(data.map(d => {
          return LeanCloud.findOrCreate('WechatCampaignUser', {
            zdkId: d.get('userId')
          }, {
            name: d.get('userInfo').wxUsername,
            profileImage: d.get('userInfo').profilePicUrl,
            currLocation: d.get('currLocation')
          })
          .then(res => {
            d.set('user', res[0]);
            return d.save();
          }, console.log);
        }));
      })
      .catch(onError);
  }
});