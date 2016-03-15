var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');
var testSchema = new mongoose.Schema({
  timestamp: {type: Date, default: Date.now},
  str: {type: String}
});
var model = mongoose.model('test', testSchema);

var index=0;

setInterval( function(){
  for(var i=0;i<3;i++){
    var doc = new model({str: 'test#'+index});
    doc.save();
    index++;
  }
}, 4000);

var MongooseTail = require('../lib/');
var tail = new MongooseTail(mongoose, {
  timeField: 'timestamp',
  modelName: 'test',
  start: true, select: 'str',
  timeOffset: 10,
  olderThan: true,
  limit: 1,
  count: false,
  cron: 1 //interval in seconds
});

tail.on('tick', function(conditions){
  console.log('tick: '+JSON.stringify(conditions));
});
tail.on('count', function(count){
  console.log('New count: '+count);
});
tail.on('error', function(error){
  console.log('error');
});
tail.on('data', function(data){
  console.log('New data: '+data);
});
