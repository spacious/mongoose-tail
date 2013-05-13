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
    select: 'str'
  });

tail.on('tick', function(conditions){
  //console.log('tick');
});
tail.on('error', function(error){
  console.log('error');
});
tail.on('data', function(data){
  console.log('New data: '+JSON.stringify(data));
});
```
