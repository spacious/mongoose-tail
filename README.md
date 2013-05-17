mongoose-tail
=============

Node.js library for mongoose, like tail for mongoose. It allows to poll documents 
(with pre-defined conditions) at regular intervals (uses cron-module) and emit events when conditions are met.

Features:
---------
-User defined find conditions, selections, limit

Trigging methods:
-emit when there is new document
-emit if timestamp is older than it should be ( "heartbeat is too old" )

Trigging types:
-count
-documents


License
-------
MIT - see LICENSE - file.

Usage
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
