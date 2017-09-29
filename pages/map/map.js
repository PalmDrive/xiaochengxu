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
    friendId,
    lcUser,
    pageFrom;

const MIN_USERS_COLLECTED_COUNT = 20,
      USER_PLACEHOLDER_IMG = '/images/map/user-placeholder.jpg',
      UserMapSession = AV.Object.extend('UserMapSession');

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
    MIN_USERS_COLLECTED_COUNT,
    barrages: [],
    collectedUsers: [],
    message: '',
    lcUsers: [],
    collectedUsersContainerWidth: 0,
    markers: [],
    size: {},
    center: {
      longitude: 116.5,
      latitude: 39.5
    },
    scale: 16,
    state: -1, // -1, 0, 1, 2
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

  onReady() {
    mapCtx = wx.createMapContext('theMap');

    //this._migrate();

    //this._onLoad({});
  },

  onLoad(options) {
    const app = getApp();

    const defaultMapSessionId = '59c7298d7565710044c06a24',
          defaultFriendId = '59ca154a7565710044d8de00';

    console.log('map onLoad options:', options);

    wx.showLoading({
      title: '加载中',
      mask: true
    });

    //return this._onLoad({mapSessionId: defaultMapSessionId});
    //return this._onLoad({friendId: defaultFriendId});

    if (options.from === 'mapsession') {
      if (app.globalData.shareTicket) {
        this._getMapSessionIdFromShareInfo(app.globalData.shareTicket)
          .then(id => this._onLoad({mapSessionId: id}));
      } else {
        this._onLoad({friendId: options.friendId});
      }
    } else {
      this._onLoad({friendId: options.friendId});
    }

    wx.showShareMenu({
      withShareTicket: true
    });
  },

  onMarkerTap(e) {
    const step = 1;
    const marker = clusteredMarkers.filter(m => m.id === e.markerId)[0];

    if (!marker.clusteredCount) return;

    const center = {
      longitude: marker.longitude,
      latitude: marker.latitude
    };

    toPromise(mapCtx.getScale).call(mapCtx)
      .then(res => {
        this.setData({
          scale: Math.min(res.scale + step, 18),
          center
        });

        this._renderMarkers();
      });
  },

  onShareAppMessage(options) {
    const that = this;
    return {
      title: '吃货都去哪儿了？',
      path: `/pages/map/map?from=mapsession&friendId=${lcUser.id}`,
      success(res) {
        if (!res.shareTickets) {
          return console.log('no shareTicket generated');
        }

        const shareTicket = res.shareTickets[0];

        that._getMapSessionIdFromShareInfo(shareTicket)
        .then(sharedMapSessionId => {
          console.log('get shared map session id:', sharedMapSessionId);

          // create userMapSession and add mapSessionId to users.mapSessionIds
          const userMapSession = new UserMapSession();
          let mSessIds = lcUser.get('mapSessionIds') || [];
          userMapSession.set('mapSessionId', sharedMapSessionId);
          userMapSession.set('user', lcUser);
          userMapSession.set('role', 1);
          userMapSession.set('userInfo', {wxUsername: lcUser.get('name')});
          userMapSession.save();
          
          mSessIds = uniqPush(mSessIds, sharedMapSessionId);
          lcUser.set('mapSessionIds', mSessIds);
          lcUser.save();
        })
        .catch(err => {
          logger.sendException(err, {
            userId: lcUser ? lcUser.id : 'n/a',
            wxUsername: lcUser ? lcUser.get('name') : 'n/a',
            context: 'creating mapSessionId onShareAppMessage'
          });
          onError(err);
        });
      }
    }
  },

  onRegionChange(e) {
    if (!mapCtx) return;
    const that = this;
    if (e.type === 'end') {
      toPromise(mapCtx.getScale).call(mapCtx)
        .then(res => {
          console.log('current scale:', res.scale);
          if (res.scale !== that.data.scale) {
            this.data.scale = res.scale;

            this._renderMarkers();
          }
        });
    }
  },

  onControlTap(e) {
    let scale; 
    const step = 1;
    toPromise(mapCtx.getScale).call(mapCtx)
      .then(res => {
        scale = this.data.scale;
        if (e.controlId === 'zoomIn') {
          scale = Math.min(scale + step, 18);
        } else if (e.controlId === 'zoomOut') {
          scale = Math.max(scale - step, 5);
        }
        this.setData({scale});
        console.log(`set scale ${scale}`);
        this._renderMarkers();
      });
  },

  start(e) {
    this.setData({state: 1});
    const userId = Auth.getLocalUserId();
    let currLocation;

    if (!userId) {
      return onError('用户id不存在');
    }

    const food = '烤鸭';

    return this._init()
    .then(res => {
      zdkMarkers = uniqPush(zdkMarkers, this._newMarkerFromUser(lcUser));
      currLocation = lcUser.get('currLocation');

      this.setData({
        center: {
          longitude: currLocation.longitude,
          latitude: currLocation.latitude
        },
        message: `我在吃${food}`
      });
      return this._renderMarkers();
    })
    .catch(onError);
  },
  
  // TODO: validation
  sendNotes(e) {
    let lcUsers = this.data.lcUsers;
    const msg = e.detail.value;
    if (!msg) {
      onError('输入不能为空');
    }
    const notes = lcUser.get('notes') || {},
          marker = zdkMarkers.filter(m => m.id === lcUser.id)[0];
    marker.title = msg;
    notes[(new Date()).toString()] = msg;
    lcUser.set('notes', notes);
    lcUser.save();

    lcUsers = uniqPush(lcUsers, lcUser);

    const {width, collectedUsers} = this._initCollectedUsers(lcUsers);
    this.setData({
      collectedUsers,
      collectedUsersContainerWidth: width,
      state: 2,
      barrages: this._getBarrageMessages(lcUsers),
      lcUsers,
    });
    this._renderMarkers();
  },

  toggleShowAllUsers() {
    // const toggleMap = {
    //   group: {
    //     mode: 'all',
    //     method: '_fetchAllUsers'
    //   },
    //   all: {
    //     mode: 'group',
    //     method: '_fetchUsersFromMap',
    //     args: mapSessionId
    //   }
    // },
    //     toggled = toggleMap[this.data.mode];
    // this.setData({mode: toggled.mode});
    // return this._fetchAndShowUsers(this[toggled.method], toggled.args);    
  },

  onTapCollectedUser(e) {
    const item = e.target.dataset.item,
          collectedUsers = this.data.collectedUsers;

    collectedUsers.forEach(u => {
      u.selected = item.id === u.id;
    });

    this.setData({
      collectedUsers,
      center: {
        longitude: item.longitude,
        latitude: item.latitude
      }
    });
  },

  gotoLeaderboard() {
    wx.navigateTo({
      url: `/pages/map/leaderboard?userId=${lcUser.id}`
    });
  },
  
  /**
   * options.mapSessionId
   * options.friendId
   */
  _onLoad(options) {
    logger.log('_onload started');

    const userId = Auth.getLocalUserId(),
          user = Auth.getLocalUserInfo(),
          userInfo = user.attributes || {};

    mapSessionId = options.mapSessionId;
    friendId = options.friendId;

    if (!userId) {
      console.log('not user found');
      return;
    }

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

        wx.hideLoading();

        if (lcUser.get('currLocation')) {
          return this._init()
            .then(res => {
              logger.log('_init finished');

              this.setData({
                state: 2,
              });
              return this._fetchAndShowUsers({
                method: '_fetchAllUsers',
                filter: Marker.select,
                initCollectedUsers: true
              })
            }, onError);
        } else {
          this.set({state: 0});
          return this._fetchAndShowUsers({
                    method: '_fetchAllUsers',
                    filter: Marker.select,
                    initCollectedUsers: true
                  });
        }
      });
  },

  _initCollectedUsers(lcUsers) {
    const imageSize = 35,
          margin = 7, // 和.collected-users-container image的一致
          containerPadding = 7; // 和.collected-users-container一致

    function newCollectedUser(user) {
      return {
        profileImage: user.get('profileImage'),
        id: user.id,
        longitude: user.get('currLocation').longitude,
        latitude: user.get('currLocation').latitude,
        selected: user.id === lcUser.id
      };
    }
    let collectedUsers = [];
    if (this.data.state !== 0) {
      //lcUsers = lcUsers.filter(u => u.id !== lcUser.id);
      if (lcUsers.length < MIN_USERS_COLLECTED_COUNT) {
        for (let i = 0; i < MIN_USERS_COLLECTED_COUNT; i++) {
          let el = lcUsers[i];
          el = el ? newCollectedUser(el) : {profileImage: USER_PLACEHOLDER_IMG};
          collectedUsers.push(el);
        }
      } else {
        collectedUsers = lcUsers.map(newCollectedUser);
      }
    } else {
      for (let i = 0; i < MIN_USERS_COLLECTED_COUNT; i++) {
        collectedUsers.push({profileImage: USER_PLACEHOLDER_IMG});
      }
    }

    // 若是奇数，加一个placeholder
    if (collectedUsers.length % 2) {
      collectedUsers.push({profileImage: USER_PLACEHOLDER_IMG});
    }
   
    return {
      collectedUsers: this._sortCollectedUsers(collectedUsers),
      width: (collectedUsers.length / 2) * (margin * 2 + imageSize) + 2 * containerPadding
    };
  },
  
  /**
   * 自己排在第一个；
   * 先把friends按照joinedAt desc排序
   * 再把users from userMapSession按照createdAt desc排序
   */
  _sortCollectedUsers(collectedUsers) {
    const friends = lcUser.get('friends'),
          sortedFriends = [],
          res = [];
    let sorted = [], theUser;
          
    if (friends && friends.length) {
      const friendsMap = {};
      friends.forEach(user => {
        friendsMap[user.id] = true;
      });
      collectedUsers.forEach(user => {
        if (friendsMap[user.id]) {
          friendsMap[user.id] = user;
        } else {
          sorted.push(user);
        }
      });
      friends.sort((a, b) => b.joinedAt - a.joinedAt);
      friends.forEach(user => {
        sortedFriends.push(friendsMap[user.id]);
      });
      sorted = sortedFriends.concat(sorted);
    } else {
      sorted = collectedUsers;
    }
    sorted.forEach(user => {
      if (user.id !== lcUser.id) {
        res.push(user);
      } else {
        theUser = user;
      }
    });
    res.unshift(theUser);

    return res;
  },

  _updateMarkerIconPath() {
    const singleMarkers = clusteredMarkers.filter(m => {
      return m.clusteredCount === 0 && (!m.iconPath || m.iconPath === Marker.defaultIconPath); //!tmpImagesHash[m.id];
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
    wait = wait || 800;

    if (includePoints) {
      mapCtx.includePoints({
        points: includePoints.map(marker => marker.mapAttrs),
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
        return toPromise(mapCtx.getScale).call(mapCtx);
      })
      .then(res => {
        logger.log('Downloaded all user profile images');
        this.data.scale = res.scale;

        this.setData({
          markers: clusteredMarkers.map(m => m.mapAttrs),
          //scale: res.scale Do not set scale here
        });
      });
  },
  
  /**
   * update lcUser and userMapSession
   */
  _init() {
    return toPromise(wx.getLocation)({
      type: 'gcj02'
    })
    .then(res => {
      const currLocation = new AV.GeoPoint({
        longitude: res.longitude,
        latitude: res.latitude
      });
      let arr, key;

      if (friendId) {
        key = 'friends';
        arr = uniqPush(lcUser.get(key) || [], {
          id: friendId,
          joinedAt: +new Date()
        });
      } else if (mapSessionId) {
        key = 'mapSessionIds';
        arr = uniqPush(lcUser.get(key) || [], mapSessionId);
      }

      // async
      lcUser.set('currLocation', currLocation);
      if (key) {
        lcUser.set(key, arr);
      }

      return Promise.all([
        lcUser.save(),
        this._updateUserMapSession()
      ]);
    });
  },

  /**
   * [_fetchAndShowUsers description]
   * @param  {Dict} options
   * @param {String} options.method
   * @param {String} [options.params]
   * @param {Function} [options.filter]
   * @param {Boolean} [options.needIncludePoints]
   * @param {Boolean} [options.initCollectedUsers]
   */
  _fetchAndShowUsers(options) {
    this[options.method](options.params)
      .then(data => {
        const dataUpdates = {
          barrages: this._getBarrageMessages(data),
          lcUsers: data
        }
        if (options.initCollectedUsers) {
          const {collectedUsers, width} = this._initCollectedUsers(data);
          dataUpdates.collectedUsers = collectedUsers;
          dataUpdates.collectedUsersContainerWidth = width;
        }

        this.setData(dataUpdates);

        // Rendering markers
        zdkMarkers = data.map(d => this._newMarkerFromUser(d));

        if (options.filter) {
          const filteredMarkers = options.filter(zdkMarkers);
          return this._renderMarkers(filteredMarkers);
        } else {
          return this._renderMarkers(options.needIncludePoints ? zdkMarkers : null);
        }
      });
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
      //return [`${user.get('name')}: ${notesArr[0][1]}`, notesArr[0][0]];
      return [`${notesArr[0][1]}`, notesArr[0][0]];
    } else {
      return [];
    }
  },

  _newMarkerFromUser(user) {
    const [msg, timestamp] = this._getBarrageMessage(user);
    return new Marker({
      title: msg,
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
      .then(data => {
        const users = data.map(d => d.get('user'));

        // return users.filter(u => {
        //   return u.get('currLocation').longitude > 0;
        // });

        return users;
      });
  },

  _fetchAllUsers() {
    const ids = lcUser.get('mapSessionIds') || [],
          friends = lcUser.get('friends') || [],
          cql = `
            select include user, * from UserMapSession where
            mapSessionId in ?
            order by -createdAt
            limit 1000
          `,
          cql2 = `
            select * from WechatCampaignUser where objectId in ?
            limit 1000
          `;

    if (!this.data.state) {
      if (friendId) {
        friends.push({
          id: friendId,
          joinedAt: +new Date()
        });
      } else if (mapSessionId) {
        ids.push(mapSessionId);
      }
    }

    return Promise.all([
      AV.Query.doCloudQuery(cql, [ids]),
      AV.Query.doCloudQuery(cql2, [friends.map(o => o.id)]),
    ])
      .then(res => {
        let users = res[0].results.map(d => d.get('user'));
        const users2 = res[1].results,
              map = {},
              distinctUers = []
        users = users.concat(users2);
        // distict users
        users.forEach(u => {
          if (u && !map[u.id]) {
            map[u.id] = true;
            distinctUers.push(u);
          }
        });

        lcUser.set('collectedUsersCount', distinctUers.length);
        lcUser.save();
        
        return distinctUers;
      });
  },

  // _countUsers() {
  //   const cql = `
  //   select count(*) from UserMapSession where
  //   user != pointer('WechatCampaignUser', ?) and
  //   mapSessionId in ?
  //   `;
  //   return AV.Query.doCloudQuery(cql, [lcUser.id, lcUser.get('mapSessionIds')])
  //     .then(data => data.count, onError);
  // },

  _updateUserMapSession() {
    if (!mapSessionId) {
      return new Promise(resolve => resolve());
    }
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

  _getMapSessionIdFromShareInfo(shareTicket) {
    return toPromise(wx.getShareInfo)({
      shareTicket
    })
    .then(res => Auth.decryptData(res.encryptedData, res.iv, Auth.getLocalSessionKey()))
    .then(res => res.data.openGId);
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