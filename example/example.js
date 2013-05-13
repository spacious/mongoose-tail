var mongoose = require('mongoose');
var chai = require('chai');


mongoose.connect('mongodb://localhost/test');
var testSchema = new mongoose.Schema({
  timestamp: {type: Date, default: Date.now},
  str: {type: String}
});
var model = mongoose.model('test', testSchema);

var index=0;
setInterval( function(){
  var doc = new model({str: 'test#'+index});
  doc.save();
  index++;
}, 4000);


var mongooseTail = require('../lib/');
var tail = new mongooseTail.Tail({timefield: 'timestamp', modelname: 'test', start: true, select: 'str'});

tail.on('tick', function(conditions){
  //console.log('tick');
});
tail.on('error', function(error){
  console.log('error');
});
tail.on('data', function(data){
  console.log('New data: '+JSON.stringify(data));
});
