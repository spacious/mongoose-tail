
"use strict";

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');
var testSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  expiration: { type: Number, default: 60 * 15, index: true }
});
var model = mongoose.model('test', testSchema);

var index = 0;

function createDoc(){
  
  for(var i=0;i<3;i++){
    var doc = new model();
    if(i === 2){
      doc.expiration = 60;
    }
    doc.save();
    index++;
  }
}

function createOffsetClauses(model, options, conditions){

  return model.distinct(options.timeOffsetField, conditions).exec().then(exp => {
    
    return exp.map(value => {

      const condition = {};

      condition[options.timeOffsetField] = value;

      const ts = options.olderThan
        ? new Date(Date.now() - (value*1000))
        : new Date(Date.now() + (value*1000));

      condition[options.timeField] = {};
      condition[options.timeField][options.olderThan ? '$lt' : '$gt'] = ts;

      return condition;
    });

  })
}

var MongooseTail = require('../lib/');

function MongooseTailOffset(mongoose, options){ return MongooseTail.call(this, mongoose, options); }

MongooseTailOffset.prototype = Object.create(MongooseTail.prototype);

MongooseTailOffset.prototype.fetchData = function(conditions) {

  const options = this.options;
  const model = this.model;
  
  if (options.timeOffsetField && options.timeField) {

    createOffsetClauses(model, options, conditions).then(clauses => {

      return model.find({ $or: clauses } );

    }).then(search => {

      if( options.count ) {

        return search.count( (error, count) => {

          return error
            ? this.emit('error', error)
            : this.emit('count', count);
        });

      } else {

        return search
          .limit(options.limit)
          .sort(options.sort)
          .select(options.select)
          .exec()
          .then(docs => {
            
            const len = docs.length;
            
            if(len) {

              for(var i=0;i < len;i++){

                this.triggeredList.push(docs[i]._id);

                if( options.individual ) { this.emit('data', docs[i]); }
              }

              if( !options.individual ) { this.emit('data', docs); }

            }else{

              // If we are out of results, clear this to re-check
              this.triggeredList = [];

            }

            // always reset
            options.timestamp = new Date();

          }).catch(err => this.emit('error', err));
      }
    });
  }

  // default
  return MongooseTail.prototype.fetchData.call(this, conditions);
};

  setInterval(createDoc, 4000);

  var tail = new MongooseTailOffset(mongoose, {
    timeField: 'timestamp',
    timeOffsetField: 'expiration',
    modelName: 'test',
    start: true,
    olderThan: true,
    sort: { timestamp: 1 },
    limit: 1,
    count: false
  });

  tail.on('tick', function(conditions){
    console.log('tick:', conditions);
  });

  tail.on('count', function(count){
    console.log('New count: '+count);
  });

  tail.on('error', function(error){
    console.log('error',error);
  });

  tail.on('data', function(data){
    console.log("data", data);
  });