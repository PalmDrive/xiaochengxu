const AV = require('av-weapp-min.js');

function findOrCreate(Cls, where, defaults) {
  const query = new AV.Query(Cls);
  for (let key in where) {
    query.equalTo(key, where[key]);
  }
  return query.first()
    .then(data => {
      if (data) {
        return [data, false];
      } else {
        const Klass = AV.Object.extend(Cls),
              obj = new Klass();
        for (let key1 in where) {
          obj.set(key1, where[key1]);
        }
        if (defaults) {
          for (let key2 in defaults) {
            obj.set(key2, defaults[key2]);
          }
        }
        
        return obj.save()
          .then(data => [data, true]);
      }
    });
};

module.exports = {
  findOrCreate
};