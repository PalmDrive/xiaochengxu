const AV = require('av-weapp-min.js');

function findOrCreate(Cls, where, defaults) {
  const query = new AV.Query(Cls);
  for (let key in where) {
    query.equalTo(key, where[key]);
  }
  return query.first()
    .then(data => {
      if (data) {
        return data;
      } else {
        const Klass = AV.Object.extend(Cls),
              obj = new Klass();
        for (let key in where) {
          obj.set(key, where[key]);
        }
        if (defaults) {
          for (let key in defaults) {
            obj.set(key, where[key]);
          }
        }
        
        return obj.save();
      }
    });
};

module.exports = {
  findOrCreate
};