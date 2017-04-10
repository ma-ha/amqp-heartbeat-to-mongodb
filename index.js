var amqp = require( 'amqplib/callback_api' )
var log  = require( 'npmlog' )
var dateFormat = require( 'dateformat' )
var MongoClient = require( 'mongodb' ).MongoClient, assert = require( 'assert' )

var heartbeatCollector = exports = module.exports = {
	rabbitMqURL : 'amqp://user:password@localhost',
	mongoDbURL  : 'mongodb://localhost:27017/dashboard',
	db: null
}

heartbeatCollector.start = function start( amqURL, mongoDbURL  ) {
	this.rabbitMqURL = amqURL
	
  MongoClient.connect(mongoDbURL).then( (_db) => {
    this.db = _db;
    return this.db.createCollection( 'services');
  }).then( () => {
    // subscribe and process heartbeats 
    amqp.connect( this.rabbitMqURL,	
      function( err, conn ) {
        if ( err != null ) { log.error( 'RabbitMQ', err ); process.exit(1) }
        conn.createChannel( function( err, ch ) {
          if ( err != null ) { log.error( 'RabbitMQ', err ); process.exit(1) }
          ch.assertExchange( 'heartbeats', 'topic',	{ durable : false }	);
          // temp queue, only up, if this service runs
          ch.assertQueue(  '', { exclusive : false, durable : false }, 
            function( err, q ) {
              log.info( 'Heartbeats', 'Waiting ...' )
              ch.bindQueue( q.queue, 'heartbeats', '#' ); // get all messages
              ch.consume( 
                q.queue,  
                function( msg ) {  heartbeatCollector.storeHeartbeat( msg ) }, 
                { noAck : true } 
              )
            } 
          )
        })
      } 
    )
  });
}

heartbeatCollector.storeHeartbeat = function storeHeartbeat( msg ) {
	try {
		var heartbeat = JSON.parse( msg.content )
		if ( heartbeat.serviceID ) {
			//log.info( 'storeHeartbeat', heartbeat )
      var col = this.db.collection( 'services' )
      col.updateOne( 
        { serviceID:heartbeat.serviceID }, 
        { $set: { heartbeatTime: heartbeat.heartbeatTime, status: heartbeat.status } } 
        , function(err, r) { 
          if ( err ) {
            log.error( 'storeHeartbeat', err )
          }
          if ( r.matchedCount == 0 && r.modifiedCount == 0 ) { // service with this id is not in db
            heartbeat.serviceStart = heartbeat.heartbeatTime
            col.insertOne( heartbeat , function(err, r) {
              if ( err ) {
                log.error( 'storeHeartbeat', err )
              } 
            })
          } 
        } 
      );
		}
	} catch ( err ) { log.error( 'storeHeartbeat', err ); }
}