const {toPromise, genRandomStr} = require('util');

const China = {
  northeast: {
    longitude: 135.03,
    latitude: 53.55
  },
  southwest: {
    longitude: 73.667,
    latitude: 3.867
  }
};

class Marker {
  constructor(options) {
    this.id = options.id || genRandomStr();
    this.longitude = options.longitude;
    this.latitude = options.latitude;

    this.title = options.title;
    this.iconPath = options.iconPath || Marker.defaultIconPath;
    this.picurl = options.picurl;
    
    this.clusteredMarkers = options.clusteredMarkers || [];

    //this.title = this.clusteredCount.toString();
    this.markerSize = {
      width: 27,
      height: 27
    };

    return this;
  }

  // get markerSize() {
  //   let size;
  //   if (this.iconPath === Marker.defaultIconPath) {
  //     size = {
  //       width: 14,
  //       height: 19
  //     };
  //   } else {
  //     size = {
  //       width: 27,
  //       height: 27
  //     }
  //   }
  //   return size;
  // }

  get clusteredCount() {
    return this.clusteredMarkers.length;
  }

  get mapAttrs() {
    let title;

    const attrs = {
      id: this.id,
      longitude: this.longitude, 
      latitude: this.latitude,
      //title: title, //this.title,
      iconPath: this.iconPath,
      width: this.markerSize.width,
      height: this.markerSize.height,
      //iconPath: userInfo.profilePicUrl,
      // label: {
      //   x: 0,
      //   y: 0,
      //   fontSize: 12,
      //   content: title
      // },
      callout: {
        content: this.title, 
        color: '#FFFFFF', 
        fontSize: 12, 
        borderRadius: 5, 
        bgColor: '#157EFB', 
        padding: 10,
        //boxShadow: , 
        display: 'ALWAYS',
      },
      //anchor: {x: 0.5, y: 0.5}
    };

    if (this.clusteredCount) {
      attrs.callout.content = `${this.clusteredCount}个吃货`;
      attrs.callout.display = 'ALWAYS';
    }
    
    return attrs;
  }

  add(marker) {
    if (marker.clusteredCount) {
      this.clusteredMarkers = this.clusteredMarkers.concat(marker.clusteredMarkers);
    } else {
      this.clusteredMarkers.push(marker);
    }
  }

  static select(markers) {
    return markers.filter(m => {
      return m.longitude <= China.northeast.longitude &&
             m.longitude >= China.southwest.longitude &&
             m.latitude <= China.northeast.latitude &&
             m.latitude >= China.southwest.latitude;
    });
  }

  static merge(marker1, marker2) {
    const newMarker = new Marker({
      longitude: (marker1.longitude + marker2.longitude) / 2,
      latitude: (marker1.latitude + marker2.latitude) / 2,
    });
    newMarker.add(marker1);
    newMarker.add(marker2);
    return newMarker;
  }

  static calOverlappingArea(marker1, marker2) {
    if (!this.ratioH) throw 'ratioH is not defined';
    if (!this.ratioW) throw 'ratioW is not defined';

    const overLappingX = - Math.abs(marker1.longitude - marker2.longitude) + marker1.markerSize.width / this.ratioW,
        overLappingY = - Math.abs(marker1.latitude - marker2.latitude) + marker1.markerSize.height / this.ratioH;

    return Math.max(overLappingX, 0) * Math.max(overLappingY, 0);
  }

  static getRatio(mapCtx) {
    if (!Marker.windowWidth) throw 'windowWidth is not defined';
    if (!Marker.windowHeight) throw 'windowHeight is not defined';

    const windowWidth = Marker.windowWidth,
          windowHeight = Marker.windowHeight;
    let ratioW, ratioH;
    return toPromise(mapCtx.getRegion).call(mapCtx)
      .then(res => {
        ratioW = windowWidth / (res.northeast.longitude - res.southwest.longitude); 
        ratioH = windowHeight / (res.northeast.latitude - res.southwest.latitude);
        console.log('ratioW:', ratioW);
        console.log('ratioH:', ratioH);

        Marker.ratioW = ratioW;
        Marker.ratioH = ratioH;
        return {ratioW, ratioH, northeast: res.northeast, southwest: res.southwest};
      });
  }

  static getWindowSize() {
    const sysInfo = wx.getSystemInfoSync();
    Marker.windowWidth = sysInfo.windowWidth;
    Marker.windowHeight = sysInfo.windowHeight;

    return sysInfo;
  }

  static cluster(markers, mapCtx) {
    function _cluster(markers) {
      const threshold = 0.25, 
            thresholdArea = threshold * markers[0].markerSize.width * markers[0].markerSize.height / (Marker.ratioH * Marker.ratioW);

      let olIndex1 = null, 
          olIndex2 = null,
          newMarkers;
      for (let i=0; markers[i]; i++) {
        let marker1 = markers[i],
            marker2;
        for (let j=i+1; markers[j]; j++) {
          marker2 = markers[j]
          const overlappingArea = Marker.calOverlappingArea(marker1, marker2);
          if (overlappingArea > thresholdArea) {
            olIndex1 = i;
            olIndex2 = j;
            break;
          }
        }
        if (olIndex1 !== null ) {
          newMarkers = markers.filter((m, index) => index !== olIndex1 && index !== olIndex2);
          const newMarker = Marker.merge(marker1, marker2);
          newMarkers.push(newMarker);
          break;
        }
      }
      
      if (newMarkers) {
        return _cluster(newMarkers);
      } else {
        return markers;
      }
    }

    if (!markers.length) {
      return new Promise(resolve => resolve(markers));
    }

    return this.getRatio(mapCtx)
      .then(() => _cluster(markers));
  }
}

Marker.defaultIconPath = '/images/map/marker.png';

module.exports = Marker;