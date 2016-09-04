Use [amqp-heartbeat package](https://www.npmjs.com/package/amqp-heartbeat) 
to send heartbeat messages.

## Usage
Collect all heartbeat messages and write them into the _dashboard_ DB:

```javascript
var heartbeatCollector = require ( '.' )
heartbeatCollector.start( 'amqp://user:password@localhost', 'mongodb://localhost:27017/dashboard' )
```

## Prerequisite: MongoDB

Get and start MongoDB Docker container:

https://hub.docker.com/_/mongo/

 docker pull mongo
 docker run --name thub-mongo -p 27017:27017 -d mongo
 
Create a database named *dashboard* and a collection *services*
 
