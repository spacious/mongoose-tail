mongoose-tail
=============

usage
-----
```
var mongooseTail = require('mongoose-tail');
var tail = new mongooseTail.Tail(
  { timefield: 'timestamp', 
    modelname: 'test', 
    start: true, 
    timeOffset: 10,
    olderThan: true,
    select: 'str',
    limit: 10,
    count: false,
  });

tail.on('tick', function(conditions){
  //console.log('tick');
});
tail.on('count', function(error){
  console.log('error');
});
tail.on('error', function(error){
  console.log('error');
});
tail.on('data', function(data){
  console.log('New data: '+JSON.stringify(data));
});
```
