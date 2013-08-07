/* *******************
      mongoose-tail
   *******************
   

```
var motail = require('mongoose-tail');
var mt = new motail({});
mt.event('error', function(error){
})
mt.event('count', function(count){
})
mt.event('data', function(data)
{
});
```


*/
var EventEmitter = require('events').EventEmitter;
var util = require('util');


/* 3.rd modules*/
var _ = require('underscore');
var mongoose = module.parent.mongoose;
var cronJob = require('cron').CronJob;

/* Implementation */

var decSeconds = function(oDate, seconds)
{
  var newDateObj = new Date();
  newDateObj.setTime(oDate.getTime() - (seconds * 1000));
  return newDateObj;
}
var incSeconds = function(oDate, seconds)
{
  var newDateObj = new Date();
  newDateObj.setTime(oDate.getTime() + (seconds * 1000));
  return newDateObj;
}

/**
  @param options    json options for mongoose-tail
                    {
                      mongoose:   Object        Mongoose instance
                      modelname:  String        Registered model name,
                      cron:       int|String    intervall in seconds/cron pattern for query intervall (optional, default: 10s interval)
                      start:      Boolean       if query should start immediately (optional, default: false)
                      
                      individual: Boolean       individual change-events or compined event
                      count:      Boolean       result emit only count event instead of data (optional, default: false)

                      timefield:  String        Date-object field in mongoose model   (optional, default: 'timestamp')
                      timeOffset: Int           timeOffset in seconds                 (optional, default: 0 )
                      
                      conditions: String|Object model find parameters (optional, default: {}), 
                      limit:      Object        model limit parameters (optional, default: null),
                      sort:       Object        model sort parameters (optional, default: {timestamp: -1} )
                      select:     String        model select parameters (optional, default: null)
                      
                      olderThan:  Boolean       if true, find documents with field $lt -operator otherwise $gt (optional, default: false)
                    }
                    
*/
var Tail = function(Options){
  
  var self = this;
  this.model = false;
  this.job = false;
  this.triggeredList = [];
  this.options = {  //default values
      mongoose: false,
      cron: '* * * * * *', 
      start: false, 
      timefield: 'timestamp',
      timeOffset: 0,
      individual: false,
      conditions: {},
      limit: 100,
      select: '',
      sort: {timestamp: -1},
      olderThan: false,
      count: false,
    };
  
  
  if( Options ){
      
      this.options = _.extend(this.options, Options);
      
      if( _.isNumber(Options.cron) ) {
        this.options.cron = "*/"+Options.cron+" * * * *";
      }
      if( !_.isDate(Options.timestamp) ){
        this.options.timestamp = new Date();
      }
      if( !_.isArray(Options.conditions) ){
        this.options.conditions = {};
      }
      if( Options.mongoose ) {
        mongoose = Options.mongoose;
      }
  }
  if(mongoose.modelNames().indexOf(this.options.modelname) >= 0){
    this.model = mongoose.model(this.options.modelname);
  } else if(this.options.model instanceof mongoose.Model) {
    this.model = this.options.model;
  } else {
    //this.emit('error', 'unregistered/unknown modelname');
    throw new Error('unregistered/unknown modelname');
  }
  
  this.setConditions = function(conditions)
  {
    this.options.conditions = conditions;
  }
  this.fetchData = function(conditions)
  {
    var search = self.model.find(conditions);
    if( self.options.count===true ) {
      search = search.count( function(error, count){
        if(error){
          console.log(error);
          self.emit('error', error);
        } else {
          self.emit('count', count);
        }
      });
    } else {
      search = search
        .limit(self.options.limit)
        .sort(self.options.sort)
        .select(self.options.select)
        .execFind( function(error, docs){
        if(error){
          //emit error
          self.emit('error', error);
        } else {
          if( docs.length>0) {
              
              for(var i=0;i<docs.length;i++){
                self.triggeredList.push(docs[i]._id);
              }
              
              //emit event for application
              if( self.options.individual ) {
                _.each(docs, function(doc){
                  self.emit('data', doc);
                });
              } else {
                self.emit('data', docs);
              }
              
              //create new timestamp
              if( self.options.olderThan ){
                self.options.timestamp = incSeconds(new Date(), self.options.timeOffset); 
              } else {
                self.options.timestamp = decSeconds(new Date(), self.options.timeOffset); 
              }
              
            }
        }
      });
    }
  }
  var generateConditions = function()
  {
    conditions = self.options.conditions;
    if( self.options.timefield ) {
      var condition = {}
      condition[ self.options.timefield ] = {}
      condition[ self.options.timefield ][self.options.olderThan?'$lt':'$gt'] = self.options.timestamp;
      conditions = _.extend(conditions, condition);
    }
    if(self.triggeredList.length>0){
      //if some docs are already triggered, skip those from next tick
      var condition = {_id: {'$nin': self.triggeredList} }
      conditions = _.extend(conditions, condition);
    }
    return conditions;
  }
  var tick = function()
  {
    //generate conditions
    conditions = generateConditions();
    
    //emit tick event to application
    self.emit('tick', conditions);
    
    //do search
    self.fetchData(conditions);
  }
  this.start = function()
  {
    self.job = new cronJob(self.options.cron, tick, null, self.options.start );
    self.job.start();
  }
  this.isStart = function(){
    return self.job!=false;
  }
  this.stop = function()
  {
    self.job.stop();
    self.job = false;
  }
  
  
  /*  this might be usefull when optimized library..
  this.on('newListener', function(event, listener) {
      
      if(self.options.start ) 
        self.start();
  });*/
  return this;  
}

util.inherits(Tail, EventEmitter);

module.exports = Tail;
