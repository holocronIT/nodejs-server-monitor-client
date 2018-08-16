/**
 *
 * Modules
 *
 */
var config 			= require('./config');
var njds 			= require('nodejs-disks');
var osu 			= require('node-os-utils')
var express 		= require('express');
var app 			= express();
var basicAuth 		= require('basic-auth-connect');
var async 			= require('async');
var njds 			= require('nodejs-disks');


var cpu 	= osu.cpu;
var drive 	= osu.drive;
var mem 	= osu.mem;
var netstat = osu.netstat;
var os 		= osu.os;
var proc 	= osu.proc;




if( config == undefined || config.apiPort == undefined ){
	console.log('No Configuration file is present. Looking for ./config.js');
}else{
	console.log('Service will run on port: ', config.apiPort);
}



/**
 *
 * Enable BasicAuth
 *
 */
if( config.apiUser != undefined && config.apiPassword != undefined ){

	var u = config.apiUser;
	var p = config.apiPassword;
	app.use(basicAuth( u, p ));
	console.log('Service will run with basicAuth protection');

}else{
	console.log('!! WARNING !! - No auth protection for the service');
}





/**
 *
 * Main route
 *
 */
app.get('/', function (req, res) {
	
	if( config.debug ){
		console.log( 'New Request...');
	}

	// Global server info
	var info = {
		uptime :  os.uptime(),
		platform : os.platform(),
		hostname : os.hostname()
	} ;


	async.series({
	    cpu: function(callback) {
			if( config.monitCpu ){

				var countCPU = cpu.count()
				cpu.usage()
				  .then(cpuPercentage => {
				    callback(null, { count : countCPU, usage : cpuPercentage } );
				  })

			}else{
				callback(null, false);
			}
	    },
	    memory: function(callback){
	        if( config.monitMem ){
	        	mem.info()
				  .then(info => {
				    callback(null, info );
				  })
			}else{
				callback(null, false);
			}
	    },
	    net: function(callback) {
	    	if( config.monitNet ){
	    		netstat.stats()
				  .then(info => {
				    callback(null, info );
				  })
			}else{
				callback(null, false);
			}
	    },
	    disk: function(callback){
			njds.drives(
		        function (err, drives) {
		            njds.drivesDetail( drives, function (err, data) {
		               	callback(null, data );
		            });
		        }
		    );
	    },
	    process: function(callback) {
	    	if( config.monitNet ){
	    		proc.totalProcesses()
				  .then(info => {
				    callback(null, info );
				  })
			}else{
				callback(null, false);
			}
	    },
	    os: function(callback) {
    		os.oos()
			  .then(os => {
			    callback(null, os );
			  })
	    },
	}, function(err, results) {
		results.info = info;
	    res.send(JSON.stringify(results));
	});

})





/**
 *
 * Run webserver 
 *
 */
app.listen(config.apiPort, () => console.log('Service is running....'));






