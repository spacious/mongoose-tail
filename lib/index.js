
"use strict";

const EventEmitter = require('events').EventEmitter;
const util = require('util');

const cronJob = require('cron').CronJob;

const decSeconds = (oDate, seconds) => new Date(oDate.getTime() - (seconds * 1000));
const incSeconds = (oDate, seconds) => new Date(oDate.getTime() + (seconds * 1000));

/**
 *
 * @param mongoose              Object          Mongoose instance
 * @param mongoose.modelNames
 * @param mongoose.Model
 * @param mongoose.model
 * @param mongoose.Promise
 * @param options
 * @param options.modelName     String          Registered model name
 * @param options.cron          int|String      interval in seconds/cron pattern for query interval (optional, default: 10s interval)
 * @param options.start:        Boolean         if query should start immediately (optional, default: false)
 * @param options.individual:   Boolean         individual change-events or compined event
 * @param options.count:        Boolean         result emit only count event instead of data (optional, default: false)
 * @param options.timeField:    String          Date-object field in mongoose model   (optional, default: 'timestamp')
 * @param options.timeOffset:   Int             timeOffset in seconds                 (optional, default: 0 )
 * @param options.conditions:   String|Object   model find parameters (optional, default: {}),
 * @param options.limit:        Object          model limit parameters (optional, default: null),
 * @param options.sort:         Object          model sort parameters (optional, default: {timestamp: -1} )
 * @param options.select:       String          model select parameters (optional, default: null)
 * @param options.olderThan:    Boolean         if true, find documents with field $lt -operator otherwise $gt (optional, default: false)
 *
 * @returns {MongooseTail}
 */
function MongooseTail(mongoose, options){

  if(!mongoose){
    throw new Error("mongoose instance should be passed as an option");
  }

  EventEmitter.call( this );

  // use native promises
  mongoose.Promise = global.Promise;

  this.job = false;
  this.triggeredList = [];
  this.options = {
    cron: '* * * * * *',
    start: false,
    timeField: 'timestamp',
    timeOffset: 0,
    individual: false,
    conditions: {},
    limit: 100,
    select: '',
    sort: {timestamp: -1},
    olderThan: false,
    count: false
  };

  this.options = Object.assign(this.options, options || {});

  if( typeof options.cron === "number" ) {

    this.options.cron = "*/"+options.cron+" * * * *";
  }

  if(!(options.timestamp) ){

    this.options.timestamp = new Date();
  }

  if(mongoose.modelNames().indexOf(this.options.modelName) >= 0){

    this.model = mongoose.model(this.options.modelName);

  } else if(this.options.model instanceof mongoose.Model) {

    this.model = this.options.model;

  } else {

    throw new Error('unregistered/unknown model name');
  }

  if(this.options.start){

    this.start();
  }

  return( this );
}

MongooseTail.prototype = Object.create( EventEmitter.prototype );

/**
 *
 */
MongooseTail.prototype.setConditions = function(conditions) { this.options.conditions = conditions; };

MongooseTail.prototype.fetchData = function(conditions) {

  let search = this.model.find(conditions);

  const options = this.options;

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

            if( this.options.individual ) { this.emit('data', docs[i]); }
          }

          if( !this.options.individual ) { this.emit('data', docs); }

          options.timestamp = options.olderThan
            ? incSeconds(new Date(), options.timeOffset)
            : decSeconds(new Date(), options.timeOffset);

        }else{

          // If we are out of results, clear this to re-check
          // update the model timestamp to exclude
          this.triggeredList = [];
        }

      }).catch(err => this.emit('error', err));
  }
};


MongooseTail.prototype.generateConditions = function() {

  let conditions = this.options.conditions;
  let condition = {};

  if( this.options.timeField ) {

    condition[ this.options.timeField ] = {};
    condition[ this.options.timeField ][this.options.olderThan?'$lt':'$gt'] = this.options.timestamp;

    // allow custom conditions to overwrite default
    conditions = Object.assign(condition, conditions);
  }

  if(this.triggeredList.length > 0){

    //if some docs are already triggered, skip those from next tick

    conditions = Object.assign(conditions, {_id: {'$nin': this.triggeredList} } );
  }

  return conditions;
};

MongooseTail.prototype.tick = function() {

  //generate conditions
  const conditions = this.generateConditions();

  //emit tick event to application
  this.emit('tick', conditions);

  //do search
  this.fetchData(conditions);
};

MongooseTail.prototype.start = function() {
  //Create cronJob instance
  this.job = new cronJob(this.options.cron, this.tick.bind(this), null, this.options.start );
  this.job.start();
};

MongooseTail.prototype.isStart = function(){ return this.job != false; };

MongooseTail.prototype.stop = function() {

  this.job.stop(); //stop cron
  delete this.job; //delete instance
  this.job = false; //set default value
};


module.exports = exports = MongooseTail;
