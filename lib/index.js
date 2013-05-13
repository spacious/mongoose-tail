/*
```
var motail = require('mongoose-tail');
var mt = new motail({});
mt.event('error', error)
{
}
mt.event('data', data)
{
}
```


*/
var EventEmitter = require('events').EventEmitter;
var util = require('util');


/* 3.rd modules*/
var _ = require('underscore');
var mongoose = require('mongoose');
var cronJob = require('cron').CronJob;

/* Implementation */

/**
  @param options    json options for mongoose-tail
                    {
                      modelname:  String|Registered model name,
                      cron:       int|String   intervall in seconds/cron pattern for query intervall
                      start:      Boolean, if query started immediately (optional)
                      conditions: model find conditions(optional), 
                      limit:      result limits (optional),
                      sort:       model sort (optional)
                      select:     model selection string (optional)
                    }
                    
*/
var Tail = function(options){
  
  var self = this;
  this.options = {}
  this.model = false;
  this.job = false;
  
  if( options ){
      this.options = options;
      
      if( _.isNumber(options.cron) ) {
        this.options.cron = "*/"+options.cron+" * * * *";
      } else if( !_.isString(options.cron) ){
        this.options.cron = '*/2 * * * * *';
      }
      
      if( !_.isDate(options.timestamp) ){
        this.options.timestamp = new Date();
      }
      if( !_.isArray(options.conditions) ){
        this.options.conditions = {};
      }
      
  } else {
    this.options = {cron: '*/2 * * * * *', start: false, query: "", limit: 10};
  }
  if(mongoose.modelNames().indexOf(this.options.modelname) >= 0)
    this.model = mongoose.model(this.options.modelname);
  else {
    console.log('unregistered/unknown modelname');
    return null;
  }
  this.setConditions = function(conditions)
  {
    this.options.conditions = conditions;
  }
  this.fetchData = function()
  {
    self.model.find(options.conditions).limit(self.options.limit).sort(self.options.sort).select(self.options.select).execFind( function(error, data){
      if(error){
        self.emit('error', error);
      } else {
        if( data.length>0){
          self.emit('data', data);
          options.timestamp = new Date(); //create new timestamp
        }
      }
    });
  }
  var tick = function()
  {
    if( self.options.timefield ) {
      self.options.conditions[ self.options.timefield ] = {'$gt': self.options.timestamp}
    }
    self.emit('tick', self.options.conditions);
    self.fetchData();
  }
  this.start = function()
  {
    self.job.start();
  }
  this.stop = function()
  {
    self.job.stop();
  }
  this.job = new cronJob(this.options.cron, tick, null, options.start );
  
  /*  this might be usefull when optimized library..
  this.on('newListener', function(event, listener) {
      
      if(self.options.start ) 
        self.start();
  });*/
  return this;  
}

util.inherits(Tail, EventEmitter);

exports.Tail = Tail;
