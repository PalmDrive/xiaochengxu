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
    lcFriend,
    lcUser,
    pageFrom;

const DEBUEG = {
  enabled: true,
  reload: true,
  from: 'mapsession', // mapsession, friend
  mapSessionId: 'GXh7w0OV1brLuFBUagx9tgcnRlzI',
  friendId: '59ce3d20a22b9d0061312243'
};

const MIN_USERS_COLLECTED_COUNT = 20,
      USER_PLACEHOLDER_IMG = '/images/map/user-placeholder.jpg',
      UserMapSession = AV.Object.extend('UserMapSession'),
      MAX_SCALE = 18,
      MIN_SCALE = 5,
      DEFAULT_SCALE = 12;

const logger = new Logger();
if (DEBUEG.enabled) {
  console.log('init logger');
  logger.disabled(); 
}

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
    let reloadPromise = new Promise(resolve => resolve());

    if (DEBUEG.reload && DEBUEG.enabled) {
      reloadPromise = new AV.Query('WechatCampaignUser')
        .equalTo('zdkId', Auth.getLocalUserId())
        .first()
        .then(user => {
          user.unset('currLocation');
          return user.save();
        });
    }

    // for dev
    if (!options.friendId) {
      console.log('friend id not exist. Using friendId from debug');
      options.friendId = DEBUEG.friendId;
    }

    console.log('map onLoad options:', options);

    wx.showLoading({
      title: '加载中',
      mask: true
    });

    if (!Auth.getLocalUserId()) {
      return;
    }

    // if (options.from !== 'mapsession') {
    //   return onError(JSON.stringify(options));
    // }

    if (app.globalData.shareTicket || (DEBUEG.enabled && DEBUEG.from === 'mapsession')) {
      reloadPromise.then(() => {
        this._getMapSessionIdFromShareInfo(app.globalData.shareTicket)
          .then(id => {
            console.log('get map session id from shareTicket:', id);
            this._onLoad({
              mapSessionId: id,
              friendId: options.friendId
            });
          });
      });
      
    } else { // 从单人聊天或者朋友圈进入
      reloadPromise.then(() => {
        this._onLoad({friendId: options.friendId});
      });
    }

    //return this._onLoad({mapSessionId: defaultMapSessionId});
    //return this._onLoad({friendId: defaultFriendId});

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

    this.setData({
      scale: DEFAULT_SCALE,
      //scale: Math.min(res.scale + step, 18),
      center
    });

    this._renderMarkers();
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

          userMapSession.save({
            mapSessionId: sharedMapSessionId,
            user: lcUser,
            role: 1,
            userInfo: {wxUsername: lcUser.get('name')}
          });
          
          mSessIds = uniqPush(mSessIds, sharedMapSessionId);
          lcUser.save({
            mapSessionIds: mSessIds
          });
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
    const userId = Auth.getLocalUserId();
    let currLocation;

    if (!userId) {
      return onError('用户id不存在');
    }

    const food = '烤鸭';

    return this._init()
    .then(res => {
      this.setData({
        state: 1,
        message: `我在吃${food}`
      });
      zdkMarkers = uniqPush(zdkMarkers, this._newMarkerFromUser(lcUser));
      currLocation = lcUser.get('currLocation');
      return this._renderMarkers({
        scale:  DEFAULT_SCALE,
        center: {
          longitude: currLocation.longitude,
          latitude: currLocation.latitude
        }
      });
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
    lcUser.save({notes});

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

    if (item.id) {
      collectedUsers.forEach(u => {
        u.selected = item.id === u.id;
      });

      this.setData({
        collectedUsers,
        center: {
          longitude: item.longitude,
          latitude: item.latitude
        },
        scale: DEFAULT_SCALE
      });

      this._renderMarkers();
    }
  },

  gotoLeaderboard() {
    wx.navigateTo({
      url: `/pages/map/leaderboard?userId=${lcUser.id}`
    });
  },

  onShareBtnClick() {
    wx.navigateTo({
      url: `/pages/map/share?friendId=${lcUser.id}`
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
    if (!friendId) {
      return onError('未获取到分享用户id');
    }

    zdkMarkers = [];

    Marker.getWindowSize();

    // 从LeanCloud上找到当前用户
    Promise.all([
      LeanCloud.findOrCreate('WechatCampaignUser', {
        zdkId: userId
      }, {
        profileImage: userInfo.profilePicUrl,
        name: userInfo.wxUsername
      }),
      new AV.Query('WechatCampaignUser').get(friendId)
        .then(data => data, console.log)
    ])
      .then(res => {
        lcUser = res[0][0];
        lcFriend = res[1];
        const fetchParams = {
                method: '_fetchAllUsers',
                initCollectedUsers: true
              };

        wx.hideLoading();

        if (lcFriend) {
          const fLocation = lcFriend.get('currLocation') || {};
          fetchParams.center = {
            longitude: fLocation.longitude,
            latitude: fLocation.latitude
          };
          fetchParams.scale = DEFAULT_SCALE;
        } else {
          console.log(`warning: user with ${friendId} not found`);
        }

        if (lcUser.get('currLocation')) { // 用户已经参与了游戏
          return this._init()
            .then(res => {
              logger.log('_init finished');

              this.setData({
                state: 2,
              });
              return this._fetchAndShowUsers(fetchParams);
            }, onError);
        } else { // 用户还未参与了游戏
          this.setData({state: 0});
          return this._fetchAndShowUsers(fetchParams);
        }
      })
      .catch(console.log);
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

      friends.forEach(f => {
        let user = friendsMap[f.id];
        if (typeof user === 'object') {
          sortedFriends.push(user);
        }
      });

      sorted = sortedFriends.concat(sorted);
    } else {
      sorted = collectedUsers;
    }

    // Place theUser in the front
    sorted.forEach(user => {
      if (user.id !== lcUser.id) {
        res.push(user);
      } else {
        theUser = user;
      }
    });
    if (this.data.state > 0 && theUser) {
      res.unshift(theUser);
    }
    
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
  
  /**
   * options.scale  <Number>
   * options.center <Dict>
   * options.wait   <Number>
   */
  _renderMarkers(options) {
    options = options || {};
    const wait = options.wait || 800;

    if (options.includePoints) {
      mapCtx.includePoints({
        points: options.includePoints.map(marker => marker.mapAttrs),
        padding: [40, 40, 40, 40]
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

        console.log('current scale:',res.scale);
        const data = {
          markers: clusteredMarkers.map(m => m.mapAttrs),
          //scale: res.scale Do not set scale here
        };

        if (options.scale) {
          data.scale = options.scale;
        }
        if (options.center) {
          data.center = options.center;
        }

        this.setData(data);
      });
  },
  
  /**
   * update lcUser and userMapSession
   */
  _init() {
    logger.log('asking for location...');
    wx.showLoading({
      title: '加载中'
    });
    return toPromise(wx.getLocation)({
      type: 'gcj02'
    })
    .then(res => {
      logger.log('location gotten');
      wx.hideLoading();

      const currLocation = new AV.GeoPoint({
        longitude: res.longitude,
        latitude: res.latitude
      });

      return this._collectUser()
        .then(() => {
          return Promise.all([
            lcUser.save({currLocation}),
            this._updateUserMapSession(),
            this._collectedByFriend()
          ]);
        });
    });
  },
  
  // 把分享者的id或者mapSessionId加入到自己的
  // friends或者mapSessionIds里面
  _collectUser(save) {
    let arr, key, res;
    if (mapSessionId) {
      key = 'mapSessionIds';
      arr = uniqPush(lcUser.get(key) || [], mapSessionId);
    } else if (friendId) {
      key = 'friends';
      arr = uniqPush(lcUser.get(key) || [], {
        id: friendId,
        joinedAt: +new Date()
      });
    }
    if (key) {
      lcUser.set(key, arr);
      if (save) {
        res = lcUser.save();
      } else {
        res = new Promise(resolve => resolve(lcUser));
      }
    } else {
      res = new Promise(resolve => resolve());
    }
    return res;
  },

  /**
   * [_fetchAndShowUsers description]
   * @param  {Dict} options
   * @param {String} options.method
   * @param {String} [options.params]
   * @param {Function} [options.filter]
   * @param {Boolean} [options.needIncludePoints]
   * @param {Boolean} [options.initCollectedUsers]
   * @param {Number} [options.scale]
   * @param {Dict} [options.center]
   */
  _fetchAndShowUsers(options) {
    options = options || {};
    this[options.method](options.params)
      .then(data => {
        // fitler d.location不存在的用户
        // 一般情况下不应该出现
        data = data.filter(d => d.get('currLocation'));

        const defaultCenter = {
          longitude: data[0].get('currLocation').longitude,
          latitude: data[0].get('currLocation').latitude
        },
        center = options.center;

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
          return this._renderMarkers({
            includePoints: filteredMarkers
          });
        } else {
          return this._renderMarkers({
            includePoints: options.needIncludePoints ? zdkMarkers : null,
            scale: options.scale,
            center: (center && center.longitude) ? center : (DEBUEG.enabled && defaultCenter)
          });
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
      title: msg || this.data.message,
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

        lcUser.save({
          'collectedUsersCount': distinctUers.length
        });
        
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
  
  // @WARN: raise condition
  _collectedByFriend() {
    if (mapSessionId || !lcFriend) {
      return new Promise(resolve => resolve());
    }
    const friends = lcFriend.get('friends') || [];
    uniqPush(friends, {
      id: lcUser.id,
      joinedAt: +new Date()
    });
    return lcFriend.save();
  },

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
      return userMapSession.save({
        viewLog,
        userInfo
      });
    });
  },

  _getMapSessionIdFromShareInfo(shareTicket) {
    if (DEBUEG.enabled && DEBUEG.from === 'mapsession') {
      return new Promise(resolve => resolve(DEBUEG.mapSessionId));
    }

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
            return d.save({user: res[0]});
          }, console.log);
        }));
      })
      .catch(onError);
  }
});