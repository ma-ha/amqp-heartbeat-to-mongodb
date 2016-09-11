var heartbeatCollector = require ( '.' )
heartbeatCollector.start( 'amqp://user:password@rabbit', 'mongodb://mongo:27017/dashboard' )

var heartbeat = require( 'amqp-heartbeat' )
heartbeat.start( 'amqp://user:password@rabbit', 'Heartbeat Collector'  )