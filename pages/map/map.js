const Auth = require('../../utils/auth'),
      {toPromise} = require('../../utils/util'),
      Marker = require('../../utils/Marker');

let mapCtx,
    zdkMarkers,
    clusteredMarkers;

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
  onReady() {
    mapCtx = wx.createMapContext('theMap');

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
      .catch(console.log);
  },

  onLoad() {
    
  },

  onMarkerTap(e) {
    const marker = clusteredMarkers.filter(m => m.id === e.markerId)[0];

    const center = {
      longitude: marker.longitude,
      latitude: marker.latitude
    };

    this.setData({
      scale: Math.min(this.data.scale + 1, 18),
      center
    });

    this._renderMarkers();
  },

  _renderMarkers() {
    setTimeout(() => {
      Marker.cluster(zdkMarkers, mapCtx)
        .then(res => {
          clusteredMarkers = res;
          this.setData({
            markers: clusteredMarkers.map(m => m.mapAttrs)
          });
        });
    }, 1000);
  },

  onRegionChange(e) {
    console.log('on region change');
    console.log(e);
  },

  onControlTap(e) {
    let scale = this.data.scale;
    if (e.controlId === 'zoomIn') {
      scale = Math.min(scale + 1, 18);
    } else if (e.controlId === 'zoomOut') {
      scale = Math.max(scale - 1, 5);
    }

    this.setData({scale});
    console.log(`set scale ${scale}`);

    this._renderMarkers();
  }
});