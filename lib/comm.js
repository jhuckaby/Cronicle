// Cronicle Server Communication Layer
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var cp = require('child_process');
var dns = require("dns");
var SocketIO = require('socket.io');
var SocketIOClient = require('socket.io-client');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({

	slaves: null,
	sockets: null,
	
	setupCluster: function() {
		// establish communication channel with all slaves
		var self = this;
		
		// slaves are servers the master can send jobs to
		this.slaves = {};
		
		// we're a slave too (but no socket needed)
		this.slaves[ this.server.hostname ] = {
			master: 1,
			hostname: this.server.hostname
		};
		
		// add any registered slaves
		this.storage.listGet( 'global/servers', 0, 0, function(err, servers) {
			if (err) servers = [];
			for (var idx = 0, len = servers.length; idx < len; idx++) {
				var server = servers[idx];
				self.addServer( server );
			}
		} );
	},
	
	addServer: function(server, args) {
		// add new server to cluster
		var self = this;
		if (this.slaves[ server.hostname ]) return;
		
		this.logDebug(5, "Adding slave to cluster: " + server.hostname + " (" + (server.ip || 'n/a') + ")");
		
		var slave = {
			hostname: server.hostname,
			ip: server.ip || ''
		};
		
		// connect via socket.io
		this.connectToSlave(slave);
		
		// add slave to cluster
		this.slaves[ slave.hostname ] = slave;
		
		// notify clients of the server change
		this.authSocketEmit( 'update', { servers: this.getAllServers() } );
		
		// log activity for new server
		this.logActivity( 'server_add', { hostname: slave.hostname, ip: slave.ip || '' }, args );
	},
	
	connectToSlave: function(slave) {
		// establish communication with slave via socket.io
		var self = this;
		var port = this.web.config.get('http_port');
		
		var url = '';
		if (this.server.config.get('server_comm_use_hostnames')) {
			url = 'http://' + slave.hostname + ':' + port;
		}
		else {
			url = 'http://' + (slave.ip || slave.hostname) + ':' + port;
		}
		
		this.logDebug(8, "Connecting to slave via socket.io: " + url);
		
		var socket = new SocketIOClient( url, {
			multiplex: false,
			forceNew: true,
			reconnection: false,
			// reconnectionDelay: 1000,
			// reconnectionDelayMax: 1000,
			// reconnectionDelayMax: this.server.config.get('master_ping_freq') * 1000,
			// reconnectionAttempts: Infinity,
			// randomizationFactor: 0,
			timeout: 5000
		} );
		
		socket.on('connect', function() {
			self.logDebug(6, "Successfully connected to slave: " + slave.hostname);
			
			var now = Tools.timeNow(true);
			var token = Tools.digestHex( self.server.hostname + now + self.server.config.get('secret_key') );
			
			// authenticate server-to-server with time-based token
			socket.emit( 'authenticate', {
				token: token,
				now: now,
				master_hostname: self.server.hostname
			} );
			
			// remove disabled flag, in case this is a reconnect
			if (slave.disabled) {
				delete slave.disabled;
				self.logDebug(5, "Marking slave as enabled: " + slave.hostname);
				
				// log activity for this
				self.logActivity( 'server_enable', { hostname: slave.hostname, ip: slave.ip || '' } );
				
				// notify clients of the server change
				self.authSocketEmit( 'update', { servers: self.getAllServers() } );
			} // disabled
			
			// reset reconnect delay
			delete slave.socketReconnectDelay;
		} );
		
		/*socket.on('reconnectingDISABLED', function(err) {
			self.logDebug(6, "Reconnecting to slave: " + slave.hostname);
			
			// mark slave as disabled to avoid sending it new jobs
			if (!slave.disabled) {
				slave.disabled = true;
				self.logDebug(5, "Marking slave as disabled: " + slave.hostname);
				
				// notify clients of the server change
				self.authSocketEmit( 'update', { servers: self.getAllServers() } );
				
				// if slave had active jobs, move them to limbo
				if (slave.active_jobs) {
					for (var id in slave.active_jobs) {
						self.logDebug(5, "Moving job to limbo: " + id);
						self.deadJobs[id] = slave.active_jobs[id];
						self.deadJobs[id].time_dead = Tools.timeNow(true);
					}
					delete slave.active_jobs;
				}
			} // not disabled yet
		} );*/
		
		socket.on('disconnect', function() {
			if (!socket._pixl_disconnected) {
				self.logError('server', "Slave disconnected unexpectedly: " + slave.hostname);
				self.reconnectToSlave(slave);
			}
			else {
				self.logDebug(5, "Slave disconnected: " + slave.hostname, socket.id);
			}
		} );
		socket.on('error', function(err) {
			self.logError('server', "Slave socket error: " + slave.hostname + ": " + err);
		} );
		socket.on('connect_error', function(err) {
			self.logError('server', "Slave connection failed: " + slave.hostname + ": " + err);
			if (!socket._pixl_disconnected) self.reconnectToSlave(slave);
		} );
		socket.on('connect_timeout', function() {
			self.logError('server', "Slave connection timeout: " + slave.hostname);
		} );
		/*socket.on('reconnect_error', function(err) {
			self.logError('server', "Slave reconnection failed: " + slave.hostname + ": " + err);
		} );
		socket.on('reconnect_failed', function() {
			self.logError('server', "Slave retries exhausted: " + slave.hostname);
		} );*/
		
		// Custom commands:
		
		socket.on('status', function(status) {
			self.logDebug(10, "Got status from slave: " + slave.hostname, status);
			Tools.mergeHashInto( slave, status );
			self.checkServerClock(slave);
			self.checkServerJobs(slave);
			
			// sanity check (should never happen)
			if (slave.master) self.masterConflict(slave);
		} );
		
		socket.on('finish_job', function(job) {
			self.finishJob( job );
		} );
		
		socket.on('fetch_job_log', function(job) {
			self.fetchStoreJobLog( job );
		} );
		
		socket.on('auth_failure', function(data) {
			var err_msg = "Authentication failure, cannot add slave: " + slave.hostname + " ("+data.description+")";
			self.logError('server', err_msg);
			self.logActivity('error', { description: err_msg } );
			self.removeServer( slave );
		} );
		
		slave.socket = socket;
	},
	
	reconnectToSlave: function(slave) {
		// reconnect to slave after socket error
		var self = this;
		
		// mark slave as disabled to avoid sending it new jobs
		if (!slave.disabled) {
			slave.disabled = true;
			self.logDebug(5, "Marking slave as disabled: " + slave.hostname);
			
			// log activity for this
			self.logActivity( 'server_disable', { hostname: slave.hostname, ip: slave.ip || '' } );
			
			// notify clients of the server change
			self.authSocketEmit( 'update', { servers: self.getAllServers() } );
			
			// if slave had active jobs, move them to limbo
			if (slave.active_jobs) {
				for (var id in slave.active_jobs) {
					self.logDebug(5, "Moving job to limbo: " + id);
					self.deadJobs[id] = slave.active_jobs[id];
					self.deadJobs[id].time_dead = Tools.timeNow(true);
				}
				delete slave.active_jobs;
			}
		} // not disabled yet
		
		// slowly back off retries to N sec to avoid spamming the logs too much
		if (!slave.socketReconnectDelay) slave.socketReconnectDelay = 0;
		if (slave.socketReconnectDelay < this.server.config.get('master_ping_freq')) slave.socketReconnectDelay++;
		
		slave.socketReconnectTimer = setTimeout( function() {
			delete slave.socketReconnectTimer;
			if (!self.server.shut) {
				self.logDebug(6, "Reconnecting to slave: " + slave.hostname);
				self.connectToSlave(slave);
			}
		}, slave.socketReconnectDelay * 1000 );
	},
	
	checkServerClock: function(slave) {
		// make sure slave clock is close to ours
		if (!slave.clock_drift) slave.clock_drift = 0;
		var now = Tools.timeNow();
		var drift = Math.abs( now - slave.epoch );
		
		if ((drift >= 10) && (slave.clock_drift < 10)) {
			var err_msg = "Server clock is " + Tools.shortFloat(drift) + " seconds out of sync: " + slave.hostname;
			this.logError('server', err_msg);
			this.logActivity('error', { description: err_msg } );
		}
		
		slave.clock_drift = drift;
	},
	
	checkServerJobs: function(slave) {
		// remove any slave jobs from limbo, if applicable
		if (slave.active_jobs) {
			for (var id in slave.active_jobs) {
				if (this.deadJobs[id]) {
					this.logDebug(5, "Taking job out of limbo: " + id);
					delete this.deadJobs[id];
				}
			}
		}
	},
	
	removeServer: function(server, args) {
		// remove server from cluster
		var slave = this.slaves[ server.hostname ];
		if (!slave) return;
		
		this.logDebug(5, "Removing slave from cluster: " + slave.hostname + " (" + (slave.ip || 'n/a') + ")");
		
		// Deal with active jobs that were on the lost server
		// Stick them in limbo with a short timeout
		if (slave.active_jobs) {
			for (var id in slave.active_jobs) {
				this.logDebug(5, "Moving job to limbo: " + id);
				this.deadJobs[id] = slave.active_jobs[id];
				this.deadJobs[id].time_dead = Tools.timeNow(true);
			}
			delete slave.active_jobs;
		}
		
		if (slave.socket) {
			slave.socket._pixl_disconnected = true;
			slave.socket.off('disconnect');
			slave.socket.disconnect();
			delete slave.socket;
		}
		if (slave.socketReconnectTimer) {
			clearTimeout( slave.socketReconnectTimer );
			delete slave.socketReconnectTimer;
		}
		
		delete this.slaves[ slave.hostname ];
		
		// notify clients of the server change
		this.authSocketEmit( 'update', { servers: this.getAllServers() } );
		
		// log activity for lost server
		this.logActivity( 'server_remove', { hostname: slave.hostname }, args );
	},
	
	startSocketListener: function() {
		// start listening for websocket connections
		this.numSocketClients = 0;
		this.sockets = {};
		this.io = SocketIO();
		
		this.io.attach( this.web.http );
		if (this.web.https) this.io.attach( this.web.https );
		
		this.io.on('connection', this.handleNewSocket.bind(this) );
	},
	
	handleNewSocket: function(socket) {
		// handle new socket connection from socket.io
		// this could be from a web browser, or a server-to-server conn
		var self = this;
		var ip = socket.request.connection.remoteAddress || socket.client.conn.remoteAddress || 'Unknown';
		
		socket._pixl_auth = false;
		
		this.numSocketClients++;
		this.sockets[ socket.id ] = socket;
		this.logDebug(5, "New socket.io client connected: " + socket.id + " (IP: " + ip + ")");
		
		socket.on('authenticate', function(params) {
			// client is trying to authenticate
			if (params.master_hostname && params.now && params.token) {
				// master-to-slave connection (we are the slave)
				var correct_token = Tools.digestHex( params.master_hostname + params.now + self.server.config.get('secret_key') );
				if (params.token != correct_token) {
					socket.emit( 'auth_failure', { description: "Secret Keys do not match." } );
					return;
				}
				/*if (Math.abs(Tools.timeNow() - params.now) > 60) {
					socket.emit( 'auth_failure', { description: "Server clocks are too far out of sync." } );
					return;
				}*/
				
				self.logDebug(4, "Socket client " + socket.id + " has authenticated via secret key (IP: "+ip+")");
				socket._pixl_auth = true;
				socket._pixl_master = true;
				
				// force multi-server init (quick startup: to skip waiting for the tock)
				self.logDebug(3, "Master server is: " + params.master_hostname);
				
				// set some flags
				self.multi.cluster = true;
				self.multi.masterHostname = params.master_hostname;
				self.multi.master = false;
				self.multi.lastPingReceived = Tools.timeNow(true);
				
				if (!self.multi.slave) self.goSlave();
				
				// need to recheck this
				self.checkMasterEligibility();
			} // secret_key
			else {
				// web client to server connection
				self.storage.get( 'sessions/' + params.token, function(err, data) {
					if (err) {
						self.logError('socket', "Socket client " + socket.id + " failed to authenticate (IP: "+ip+")");
						socket.emit( 'auth_failure', { description: "Session not found." } );
					}
					else {
						self.logDebug(4, "Socket client " + socket.id + " has authenticated via user session (IP: "+ip+")");
						socket._pixl_auth = true;
					}
				} );
			}
		} );
		
		socket.on('launch_job', function(job) {
			// launch job (server-to-server comm)
			if (socket._pixl_auth) self.launchLocalJob( job );
		} );
		
		socket.on('abort_job', function(stub) {
			// abort job (server-to-server comm)
			if (socket._pixl_auth) self.abortLocalJob( stub );
		} );
		
		socket.on('update_job', function(stub) {
			// update job (server-to-server comm)
			if (socket._pixl_auth) self.updateLocalJob( stub );
		} );
		
		socket.on('restart_server', function(args) {
			// restart server (server-to-server comm)
			if (socket._pixl_auth) self.restartLocalServer(args);
		} );
		
		socket.on('shutdown_server', function(args) {
			// shut down server (server-to-server comm)
			if (socket._pixl_auth) self.shutdownLocalServer(args);
		} );
		
		socket.on('watch_job_log', function(args) {
			// tail -f job log
			self.watchJobLog(args, socket);
		} );
		
		socket.on('groups_changed', function(args) {
			// recheck master server eligibility
			self.logDebug(4, "Server groups have changed, rechecking master eligibility");
			self.checkMasterEligibility();
		} );
		
		socket.on('logout', function(args) {
			// user wants out?  okay then
			socket._pixl_auth = false;
			socket._pixl_master = false;
		} );
		
		socket.on('master_ping', function(args) {
			// master has given dobby a ping!
			self.logDebug(10, "Received ping from master server");
			self.multi.lastPingReceived = Tools.timeNow(true);
		} );
		
		socket.on('error', function(err) {
			self.logError('socket', "Client socket error: " + socket.id + ": " + err);
		} );
		
		socket.on('disconnect', function() {
			// client disconnected
			socket._pixl_disconnected = true;
			self.numSocketClients--;
			delete self.sockets[ socket.id ];
			self.logDebug(5, "Socket.io client disconnected: " + socket.id + " (IP: " + ip + ")");
		} );
	},
	
	sendMasterPings: function() {
		// send a ping to all slaves
		this.slaveBroadcastAll('master_ping');
	},
	
	slaveNotifyGroupChange: function() {
		// notify all slaves that server groups have changed
		this.slaveBroadcastAll('groups_changed');
	},
	
	slaveBroadcastAll: function(key, data) {
		// broadcast message to all slaves
		if (!this.multi.master) return;
		
		for (var hostname in this.slaves) {
			var slave = this.slaves[hostname];
			if (slave.socket) {
				slave.socket.emit(key, data || {});
			}
		}
	},
	
	getAllServers: function() {
		// get combo hash of all UDP-managed servers, and any manually added slaves
		if (!this.multi.master) return null;
		var servers = {};
		var now = Tools.timeNow(true);
		
		// add us first (the master)
		servers[ this.server.hostname ] = {
			hostname: this.server.hostname,
			ip: this.server.ip,
			master: 1,
			uptime: now - (this.server.started || now),
			data: this.multi.data || {},
			disabled: 0
		};
		
		// then add all slaves
		for (var hostname in this.slaves) {
			var slave = this.slaves[hostname];
			if (!servers[hostname]) {
				servers[hostname] = {
					hostname: hostname,
					ip: slave.ip || '',
					master: 0,
					uptime: slave.uptime || 0,
					data: slave.data || {},
					disabled: slave.disabled || 0
				};
			} // unique hostname
		} // foreach slave
		
		return servers;
	},
	
	shutdownLocalServer: function(args) {
		// shut down local server
		if (this.server.debug) {
			this.logDebug(5, "Skipping shutdown command, as we're in debug mode.");
			return;
		}
		
		this.logDebug(1, "Shutting down server: " + (args.reason || 'Unknown reason'));
		
		// issue shutdown command
		this.server.shutdown();
	},
	
	restartLocalServer: function(args) {
		// restart server, but only if in daemon mode
		if (this.server.debug) {
			this.logDebug(5, "Skipping restart command, as we're in debug mode.");
			return;
		}
		
		this.logDebug(1, "Restarting server: " + (args.reason || 'Unknown reason'));
		
		// issue a restart command by shelling out to our control script in a detached child
		child = cp.spawn( "bin/control.sh", ["restart"], { 
			detached: true,
			stdio: ['ignore', 'ignore', 'ignore'] 
		} );
		child.unref();
	},
	
	shutdownCluster: function() {
		// shut down all server connections
		if (this.sockets) {
			for (var id in this.sockets) {
				var socket = this.sockets[id];
				this.logDebug(9, "Closing client socket: " + socket.id);
				socket.disconnect();
			}
		}
		
		if (this.multi.master) {
			for (var hostname in this.slaves) {
				var slave = this.slaves[hostname];
				if (slave.socket) {
					this.logDebug(9, "Closing slave connection: " + slave.hostname, slave.socket.id);
					slave.socket._pixl_disconnected = true;
					slave.socket.off('disconnect');
					slave.socket.disconnect();
					delete slave.socket;
				}
				if (slave.socketReconnectTimer) {
					clearTimeout( slave.socketReconnectTimer );
					delete slave.socketReconnectTimer;
				}
			}
			this.slaves = {};
		} // master
	}
	
});
