Use [amqp-heartbeat package](https://www.npmjs.com/package/amqp-heartbeat) 
to send heartbeat messages. 

## Usage
Collect all heartbeat messages and write them into the _dashboard_ DB:

```javascript
var heartbeatCollector = require ( 'amqp-heartbeat-to-mongodb' )
heartbeatCollector.start( 'amqp://user:password@localhost', 'mongodb://localhost:27017/dashboard' )
```

## Prerequisites

### MongoDB

Get and start MongoDB Docker container:

https://hub.docker.com/_/mongo/

    docker pull mongo
    docker run --name my-mongo -p 27017:27017 -d mongo
 
Create a database named *dashboard* and a collection *services*.
 
### RabbitMQ (Docker Container)

    docker run -d --hostname my-rabbit --name some-rabbit -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=user -e RABBITMQ_DEFAULT_PASS=password rabbitmq:3-management
 
## Run as Docker Container 

    docker build -t heartbeat/collector .
    docker run -d --link mongodb:mongo --link some-rabbit:rabbit --name heartbeat-collector heartbeat/collector

## Web GUI

A web UI demo is available, check out the [amq-heartbeat-gui node package](https://www.npmjs.com/package/amq-heartbeat-gui) 
