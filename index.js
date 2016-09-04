var amqp = require( 'amqplib/callback_api' )
var log  = require( 'npmlog' )
var dateFormat = require( 'dateformat' )
var MongoClient = require( 'mongodb' ).MongoClient, assert = require( 'assert' )

var heartbeatCollector = exports = module.exports = {
	rabbitMqURL : 'amqp://localhost',
	mongoDbURL  : 'mongodb://localhost:27017/dashboard',
}

heartbeatCollector.start = function start( amqURL, mongoURL  ) {
	this.rabbitMqURL = amqURL
	this.mongoDbURL = mongoURL
	
	// subscribe and process heartbeats 
	amqp.connect( this.rabbitMqURL,	
		function( err, conn ) {
			if ( err != null ) { log.error( 'RabbitMQ', err ); process.exit(1) }
			conn.createChannel( function( err, ch ) {
				if ( err != null ) { log.error( 'RabbitMQ', err ); process.exit(1) }
				ch.assertExchange( 'heartbeats', 'topic',	{ durable : false }	);
				// temp queue, only up, if this service runs
				ch.assertQueue(  '', { exclusive : false }, 
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
		  } )
	  } 
  )

}


heartbeatCollector.storeHeartbeat = function storeHeartbeat( msg ) {
	try {
		var heartbeat = JSON.parse( msg.content )
		if ( heartbeat.serviceID && heartbeat.serviceName ) {
			//log.info( 'storeHeartbeat', heartbeat.serviceName+': '+heartbeat.serviceID  )
			// Use connect method to connect to the server
			MongoClient.connect( this.mongoDbURL, function( err, db ) {
				if ( ! err ) {
					try {
						db.createCollection( 'services' , function(err, collection) { if (err) log.info('createCollection',err) } ) 						
					} catch (err) { log.error( 'createCollection', err ) }

					var now = Date.now();
					var col = db.collection( 'services' )
					
				  col.updateOne( 
				  		{ serviceID:heartbeat.serviceID }, 
				  		{ $set: { heartbeatTime: heartbeat.heartbeatTime } } 
				  		, function(err, r) { 
				  				if ( err ) log.error( 'storeHeartbeat', err )
								  if ( r.matchedCount == 0 || r.modifiedCount == 0 ) { // service with this id is not in db
								  	heartbeat.serviceStart = heartbeat.heartbeatTime
									  col.insertOne( heartbeat , 
									  		function(err, r) {
									  			if ( err ) log.error( 'storeHeartbeat', err )
									  			db.close() 
									  		} 
									  ) 				
								  	//log.info( 'storeHeartbeat', 'New Service' )
								  } else {
								  	//log.info( 'storeHeartbeat', 'Update' )
								  	db.close()
								  }
				  			} 
				  		);
				  
				} else {
					log.error( 'MongoDB', err )														
				}												
			} )									
			
		}
	} catch ( err ) { log.error( 'storeHeartbeat', err ); }
}