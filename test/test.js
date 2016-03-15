
var mongoose = require('mongoose');

var assert = require('chai').assert;

var MongooseTail = require('../');

var tail;

mongoose.connect('mongodb://localhost/mongoose-tail');

var msgSchema = new mongoose.Schema({

  createdAt: {type: Date, default: Date.now},
  modifiedAt: {type: Date, default: Date.now},
  user: {type: String},
  event: {type: String}

}).post('save', function(){

  this.modifiedAt = Date.now();
});

var model = mongoose.model('events', msgSchema);

var index=0;

var createNew = function(){

  var doc = new model({user: 'me', event: 'test#'+index});
  index++;
  doc.save( function(doc){});
};

describe('init -', function() {

  before(function(){

    model.remove({}, function(){});
  });

  it('default', function(done) {

    tail = new MongooseTail(mongoose, {
                timeField: 'createdAt',
                modelName: 'events',
                start: false,
                timeOffset: 0,
                olderThan: false,
                limit: 1,
                count: false
                });
    assert.typeOf(tail, 'object');
    assert.typeOf(tail.start, 'function');
    assert.typeOf(tail.stop, 'function');
    assert.typeOf(tail.on, 'function');
    assert.typeOf(tail.setConditions , 'function');
    assert.typeOf(tail.fetchData  , 'function');
    assert.equal(tail.isStart(), false);
    done();
  });
  
  it('error', function(done) {
    try{
        tail = new MongooseTail();
    } catch(e){
      //assert.equal(e, false);
      done();
    }
  });
  
  it('default', function(done) {
    tail = new MongooseTail(mongoose, { timeField: 'createdAt', modelName: 'events' });
    assert.typeOf(tail, 'object');
    assert.typeOf(tail.start, 'function');
    assert.typeOf(tail.stop, 'function');
    assert.typeOf(tail.on, 'function');
    assert.typeOf(tail.setConditions , 'function');
    assert.typeOf(tail.fetchData  , 'function');
    assert.equal(tail.isStart(), false);
    done();
  });
  
});
describe('default -', function() {

  before(function(){
    model.remove({}, function(){});

    tail = new MongooseTail(mongoose, {
                timeField: 'createdAt',
                modelName: 'events'
                });
  });  

  it('tick', function(done) {

    this.timeout(2000);

    tail.on('tick', function(conditions){

      assert.typeOf( conditions.createdAt, 'object');
      assert.typeOf( conditions.createdAt['$gt'], 'Date');
      tail.stop();
      assert.equal(tail.isStart(), false);
      tail.removeAllListeners();
      done();
    });
    
    tail.start();
    assert.equal(tail.isStart(), true);
  });
  
  it('data', function(done) {

    this.timeout(3000);

    tail.on('data', function(data){
      assert.equal( data.length, 1);
      assert.equal( data[0].user, 'me');
      assert.equal( data[0].event, 'test#0');
      tail.removeAllListeners();
      tail.stop();
      done();
    });

    assert.equal(tail.isStart(), false);

    tail.start();

    assert.equal(tail.isStart(), true);

    setTimeout( createNew, 1400);
  });
});

describe('count -', function() {

  before(function(){

    model.remove({}, function(){});

    tail = new MongooseTail(mongoose, {
                timeField: 'createdAt',
                modelName: 'events',
                count: true
                //cron: 1
                });
  });

  it('default', function(done) {

    this.timeout(10000);
    
    var timer;

    tail.on('count', function(count){

      //console.log(count + ' /'+index);

      if(index > 4) {

        assert.equal( count, index-1);
      }

      if(index > 14 ) {
        tail.removeAllListeners();

        clearInterval(timer);

        tail.stop();
        done();
      }
    });

    assert.equal(tail.isStart(), false);
    tail.start();
    assert.equal(tail.isStart(), true);

    timer = setInterval( createNew, 500);
  });
});
