var heartbeatCollector = require ( '.' )
heartbeatCollector.start( 'amqp://user:password@localhost', 'mongodb://localhost:27017/dashboard' )