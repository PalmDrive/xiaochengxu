const Auth = require('../../utils/auth'),
      {toPromise, uniqPush} = require('../../utils/util'),
      Marker = require('../../utils/Marker'),
      AV = require('../../utils/av-weapp-min'),
      Logger = require('../../utils/Logger'),
      LeanCloud = require('../../utils/leancloud');

let mapCtx,
    zdkMarkers,
    clusteredMarkers,
    mapSessionId,
    lcUser,
    lcUsers;

const logger = new Logger();
console.log('init logger');
//logger.disabled(); 

function onError(err) {
  wx.showModal({
    title: '错误',
    content: err.message || err
  });
  console.log(err);
}

Page({
  data: {
    barrages: [],
    usersCount: null,
    markers: [],
    size: {},
    center: {
      longitude: 116.5,
      latitude: 39.5
    },
    scale: 16,
    state: 0, // 0, 1, 2
    mode: 'group', // group, all
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
          user = Auth.getLocalUserInfo(),
          userInfo = user.attributes || {};

    mapSessionId = id;

    if (!userId) {
      console.log('not user found');
      return;
    }
    
    let _t = +new Date();

    zdkMarkers = [];

    Marker.getWindowSize();

    // 从LeanCloud上找到当前用户
    LeanCloud.findOrCreate('WechatCampaignUser', {
      zdkId: userId
    }, {
      profileImage: userInfo.profilePicUrl,
      name: userInfo.wxUsername
    })
      .then(res => {
        lcUser = res[0];

        return this._didUserMapSessionExist(mapSessionId, lcUser.id);
      })
      .then(didExist => {
        if (didExist) {
          return this._init()
            .then(usersCount => {
              this.setData({
                state: 2,
                usersCount
              });
            }, onError);
        } else {
          return true;
        }
      });

    return this._fetchAndShowUsers(this._fetchUsersFromMap, id);
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

        logger.log('start downloading user profile images');

        return this._updateMarkerIconPath();
      })
      .then(() => {
        logger.log('Downloaded all user profile images');

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
  
  _init() {
    return toPromise(wx.getLocation)({
      type: 'gcj02'
    })
    .then(res => {
      const currLocation = new AV.GeoPoint({
        longitude: res.longitude,
        latitude: res.latitude
      }),
           mapSessionIds = uniqPush(lcUser.get('mapSessionIds') || [], mapSessionId);

      // async
      lcUser.set('currLocation', currLocation);
      lcUser.set('mapSessionIds', mapSessionIds);

      lcUser.save();
      this._updateUserMapSession();
      
      return this._countUsers();
    });
  },

  start(e) {
    this.setData({state: 1});
    const userId = Auth.getLocalUserId();

    if (!userId) {
      return onError('用户id不存在');
    }

    return this._init()
    .then(usersCount => {
      const currLocation = lcUser.get('currLocation');
      zdkMarkers = uniqPush(zdkMarkers, this._newMarkerFromUser(lcUser));
      this.setData({
        usersCount,
        center: {
          longitude: currLocation.longitude,
          latitude: currLocation.latitude
        }
      });

      return this._renderMarkers();
    })
    .catch(onError);
  },
  
  // TODO: validation
  sendNotes(e) {
    const msg = e.detail.value;
    if (!msg) {
      onError('输入不能为空');
    }
    const notes = lcUser.get('notes') || {};
    notes[(new Date()).toString()] = msg;
    lcUser.set('notes', notes);
    lcUser.save();

    lcUsers = uniqPush(lcUsers, lcUser);

    this.setData({
      state: 2,
      barrages: this._getBarrageMessages(lcUsers)
    });
  },

  toggleShowAllUsers() {
    const toggleMap = {
      group: {
        mode: 'all',
        method: '_fetchAllUsers'
      },
      all: {
        mode: 'group',
        method: '_fetchUsersFromMap',
        args: mapSessionId
      }
    },
        toggled = toggleMap[this.data.mode];
    this.setData({mode: toggled.mode});
    return this._fetchAndShowUsers(this[toggled.method], toggled.args);    
  },

  _fetchAndShowUsers(fn) {
    let args = [null];
    if (arguments.length > 1) {
      args = [].slice.call(arguments);
      args.shift();
    }
    fn.apply(this, args)
      .then(data => {
        lcUsers = data;
        this.setData({
          barrages: this._getBarrageMessages(lcUsers)
        });
        // Rendering markers
        zdkMarkers = data.map(d => this._newMarkerFromUser(d));
        return this._renderMarkers(true);
      })
      .catch(onError);
  },

  _getBarrageMessages(users) {
    const usersWithNotes = users.filter(u => {
      const notes = u.get('notes');
      return notes && Object.keys(notes).length;
    });
    const arr = usersWithNotes.map(this._getBarrageMessage);

    arr.sort((a, b) => b[1] - a[1]);

    // if arr[0].length === 0, barrage is empty

    return arr.map(el => el[0]);
  },
  
  // @return {array} [message<string>, <timestamp>]
  _getBarrageMessage(user) {
    const notes = user.get('notes') || {},
          notesArr = [];
    for (let key in notes) {
      notesArr.push([+new Date(key), notes[key]]);
    }

    notesArr.sort((a, b) => b[0] - a[0]);

    if (notesArr.length) {
      return [`${user.get('name')}: ${notesArr[0][1]}`, notesArr[0][0]];
    } else {
      return [];
    }
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

  _fetchUsersFromMap(id) {
    return new AV.Query('UserMapSession')
      .include(['user'])
      .equalTo('mapSessionId', id)
      .limit(500)
      .find()
      .then(data => data.map(d => d.get('user')));
  },

  _fetchAllUsers() {
    const ids = lcUser.get('mapSessionIds'),
          cql = `
            select include user, * from UserMapSession where
            mapSessionId in ?
            limit 1000
          `;
    return AV.Query.doCloudQuery(cql, [ids])
      .then(res => {
        const users = res.results.map(d => d.get('user')),
              map = {},
              distinctUers = []
        // distict users
        users.forEach(u => {
          if (!map[u.id]) {
            map[u.id] = true;
            distinctUers.push(u);
          }
        });
        
        return distinctUers;
      });
  },

  _countUsers() {
    const cql = `
    select count(*) from UserMapSession where
    user != pointer('WechatCampaignUser', ?) and
    mapSessionId in ?
    `;
    return AV.Query.doCloudQuery(cql, [lcUser.id, lcUser.get('mapSessionIds')])
      .then(data => data.count, onError);
  },

  _updateUserMapSession() {
    const currLocation = lcUser.get('currLocation');
    return LeanCloud.findOrCreate('UserMapSession', {
      user: lcUser,
      mapSessionId
    })
    .then(res => {
      const [userMapSession, created] = res;
            
      // Async update viewLog
      const viewLog = userMapSession.get('viewLog') || {},
            userInfo = userMapSession.get('userInfo') || {};
      viewLog[(new Date().toString())] = [currLocation.longitude, currLocation.latitude];
      userInfo.wxUsername = lcUser.get('name');
      userMapSession.set('viewLog', viewLog);
      userMapSession.set('userInfo', userInfo);
      
      return userMapSession.save();
    });
  },

  _didUserMapSessionExist(mapSessionId, userId) {
    const cql = `
      select count(*) from UserMapSession where 
      mapSessionId = ? and 
      user = pointer('WechatCampaignUser', ?)
    `
    return AV.Query.doCloudQuery(cql, [mapSessionId, userId])
      .then(res => res.count > 0);
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