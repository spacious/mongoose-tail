mongoose-tail
=============

Node.js library for mongoose, like tail for mongoose. It allows to poll documents 
(with pre-defined conditions) at regular intervals (uses cron-module) and emit events when conditions are met.

News:
2013-06-14 
* individual/compined change-event
* update documentation

Features:
---------
-User defined find conditions, selections, limit

* Trigging modes:
 * event when there is new document(s)
 * event if timestamp is older than it should be (  ~"heartbeat is too old" )

* Trigging types:
 * count
 * documents (mongoose find results)


Options:
--------

```
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
```

Usage
-----
```
var mongooseTail = require('mongoose-tail');
var tail = new mongooseTail.Tail(  
  { /* options*/
    timefield: 'timestamp', 
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

License
-------
MIT - see LICENSE - file.
