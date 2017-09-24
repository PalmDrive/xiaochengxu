const {toPromise, genRandomStr} = require('util');

class Marker {
  constructor(options) {
    this.id = genRandomStr(); //options.id;
    this.longitude = options.longitude;
    this.latitude = options.latitude;
    //this.title = options.title;
    
    this.clusteredMarkers = options.clusteredMarkers || [];

    //this.title = this.clusteredCount.toString();

    this.markerSize = {
      width: 50,
      height: 50
    };

    return this;
  }

  get clusteredCount() {
    return this.clusteredMarkers.length;
  }

  get mapAttrs() {
    const title = this.clusteredCount.toString();
    return {
      id: this.id,
      longitude: this.longitude, 
      latitude: this.latitude,
      title: title, //this.title,
      iconPath: '/images/icon.png',
      width: this.markerSize.width,
      height: this.markerSize.height,
      //iconPath: userInfo.profilePicUrl,
      label: {
        x: 0,
        y: 0,
        fontSize: 12,
        content: title
      },
      callout: {
        content: title, 
        color: '#FC635D', 
        fontSize: 12, 
        borderRadius: 5, 
        bgColor: '#449DF9', 
        padding: 10, 
        //boxShadow: , 
        display: 'BYCLICK', //'ALWAYS'
      },
      //anchor: {x: 0.5, y: 0.5}
    };
  }

  add(marker) {
    if (marker.clusteredCount) {
      this.clusteredMarkers = this.clusteredMarkers.concat(marker.clusteredMarkers);
    } else {
      this.clusteredMarkers.push(marker);
    }
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
    if (!this.windowWidth) throw 'windowWidth is not defined';
    if (!this.windowHeight) throw 'windowHeight is not defined';

    const windowWidth = this.windowWidth,
          windowHeight = this.windowHeight;
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
    return this.getRatio(mapCtx)
      .then(() => _cluster(markers));
  }
}

module.exports = Marker;