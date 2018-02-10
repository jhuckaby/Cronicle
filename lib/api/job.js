// Cronicle API Layer - Jobs
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var assert = require("assert");
var async = require('async');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	//
	// Jobs
	// 
	
	/*api_upload_job_log: function(args, callback) {
		// server-to-server log upload
		var self = this;
		var params = args.params;
		var files = args.files;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			path: /^[\w\-\.\/]+$/,
			auth: /^\w+$/
		}, callback)) return;
		
		if (params.auth != Tools.digestHex(params.path + this.server.config.get('secret_key'))) {
			return callback( "403 Forbidden", {}, "Authentication failure.\n" );
		}
		
		if (!files.file1 || !files.file1.path) {
			return callback( "400 Bad Request", {}, "No upload data found.\n" );
		}
		
		fs.readFile( files.file1.path, { encoding: null }, function(err, data) {
			if (err) {
				return callback( "400 Bad Request", {}, "Could not read upload data: " + err + "\n" );
			}
			
			self.storage.put( params.path, data, function(err) {
				if (err) {
					self.logError('storage', "Failed to store job log: " + params.path + ": " + err);
					return;
				}
				
				callback( "200 OK", {}, "Success.\n" );
			} ); // storage put
		} );
	},*/
	
	api_get_job_log: function(args, callback) {
		// view job log (plain text or download)
		// client API, no auth
		var self = this;
		
		if (!this.requireParams(args.query, {
			id: /^\w+$/
		}, callback)) return;
			
		var key = 'jobs/' + args.query.id + '/log.txt.gz';
		
		self.storage.getStream( key, function(err, stream) {
			if (err) {
				return callback( "404 Not Found", {}, "(No log file found.)\n" );
			}
			
			var headers = {
				'Content-Type': "text/plain; charset=utf-8",
				'Content-Encoding': "gzip"
			};
			
			// optional download instead of view
			if (args.query.download) {
				headers['Content-disposition'] = "attachment; filename=Cronicle-Job-Log-" + args.query.id + '.txt';
			}
			
			// pass stream to web server
			callback( "200 OK", headers, stream );
		} );
	},
	
	api_get_live_job_log: function(args, callback) {
		// get live job job, as it is being written
		// client API, no auth
		var self = this;
		var query = args.query;
		
		if (!this.requireParams(query, {
			id: /^\w+$/
		}, callback)) return;
		
		// see if log file exists on this server
		var log_file = this.server.config.get('log_dir') + '/jobs/' + query.id + '.log';
		
		fs.stat( log_file, function(err, stats) {
			if (err) {
				return self.doError('job', "Failed to fetch job log: " + err, callback);
			}
			
			var headers = { 'Content-Type': "text/plain" };
			
			// optional download instead of view
			if (query.download) {
				headers['Content-disposition'] = "attachment; filename=Cronicle-Partial-Job-Log-" + query.id + '.txt';
			}
			
			// get readable stream to file
			var stream = fs.createReadStream( log_file );
			
			// stream to client as plain text
			callback( "200 OK", headers, stream );
		} );
	},
	
	api_fetch_delete_job_log: function(args, callback) {
		// fetch and delete job log, part of finish process
		// server-to-server API, deletes log, requires secret key auth
		var self = this;
		var query = args.query;
		
		if (!this.requireParams(query, {
			path: /^[\w\-\.\/]+\.log$/,
			auth: /^\w+$/
		}, callback)) return;
		
		if (query.auth != Tools.digestHex(query.path + this.server.config.get('secret_key'))) {
			return callback( "403 Forbidden", {}, "Authentication failure.\n" );
		}
		
		var log_file = query.path;
		
		fs.stat( log_file, function(err, stats) {
			if (err) {
				return callback( "404 Not Found", {}, "Log file not found: "+log_file+".\n" );
			}
			
			var headers = { 'Content-Type': "text/plain" };
			
			// get readable stream to file
			var stream = fs.createReadStream( log_file );
			
			// stream to client as plain text
			callback( "200 OK", headers, stream );
			
			args.response.on('finish', function() {
				// only delete local log file once log is COMPLETELY sent
				self.logDebug(4, "Deleting log file: " + log_file);
				
				fs.unlink( log_file, function(err) {
					// ignore error
				} );
				
			} ); // response finish
			
		} ); // fs.stat
	},
	
	api_update_job: function(args, callback) {
		// update running job
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "edit_events", callback)) return;
			
			args.user = user;
			args.session = session;
			
			var result = self.updateJob(params);
			if (!result) return self.doError('job', "Failed to update job.", callback);
			
			self.logTransaction('job_update', params.id, self.getClientInfo(args, params));
			
			callback({ code: 0 });
		} );
	},
	
	api_update_jobs: function(args, callback) {
		// update multiple running jobs, search based on criteria (plugin, category, event)
		// stash updates in 'updates' key
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "edit_events", callback)) return;
			
			args.user = user;
			args.session = session;
			
			var updates = params.updates;
			delete params.updates;
			
			var all_jobs = self.getAllActiveJobs(true);
			var jobs_arr = [];
			for (var key in all_jobs) {
				jobs_arr.push( all_jobs[key] );
			}
			var jobs = Tools.findObjects( jobs_arr, params );
			var count = 0;
			
			for (var idx = 0, len = jobs.length; idx < len; idx++) {
				var job = jobs[idx];
				var result = self.updateJob( Tools.mergeHashes( updates, { id: job.id } ) );
				if (result) {
					count++;
					self.logTransaction('job_update', job.id, self.getClientInfo(args, updates));
				}
			} // foreach job
			
			callback({ code: 0, count: count });
		} );
	},
	
	api_abort_job: function(args, callback) {
		// abort running job
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "abort_events", callback)) return;
			
			args.user = user;
			args.session = session;
			
			var reason = '';
			if (user.key) {
				// API Key
				reason = "Manually aborted by API Key: " + user.key + " (" + user.title + ")";
			}
			else {
				reason = "Manually aborted by user: " + user.username;
			}
			
			var result = self.abortJob({
				id: params.id,
				reason: reason,
				no_rewind: 1 // don't rewind cursor for manually aborted jobs
			});
			if (!result) return self.doError('job', "Failed to abort job.", callback);
			
			callback({ code: 0 });
		} );
	},
	
	api_abort_jobs: function(args, callback) {
		// abort multiple running jobs, search based on criteria (plugin, category, event)
		// by default this WILL rewind catch_up events, unless 'no_rewind' is specified
		// this will NOT abort any detached jobs
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "abort_events", callback)) return;
			
			args.user = user;
			args.session = session;
			
			var reason = '';
			if (user.key) {
				// API Key
				reason = "Manually aborted by API Key: " + user.key + " (" + user.title + ")";
			}
			else {
				reason = "Manually aborted by user: " + user.username;
			}
			
			var no_rewind = params.no_rewind || 0;
			delete params.no_rewind;
			
			var all_jobs = self.getAllActiveJobs(true);
			var jobs_arr = [];
			for (var key in all_jobs) {
				jobs_arr.push( all_jobs[key] );
			}
			var jobs = Tools.findObjects( jobs_arr, params );
			var count = 0;
			
			for (var idx = 0, len = jobs.length; idx < len; idx++) {
				var job = jobs[idx];
				if (!job.detached) {
					var result = self.abortJob({
						id: job.id,
						reason: reason,
						no_rewind: no_rewind
					});
					if (result) count++;
				}
			} // foreach job
			
			callback({ code: 0, count: count });
		} );
	},
	
	api_get_job_details: function(args, callback) {
		// get details for completed job
		// need_log: will fail unless job log is also in storage
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			// job log must be available for this to work
			self.storage.head( 'jobs/' + params.id + '/log.txt.gz', function(err, info) {
				if (err && params.need_log) {
					return self.doError('job', "Failed to fetch job details: " + err, callback);
				}
				
				// now fetch job details
				self.storage.get( 'jobs/' + params.id, function(err, job) {
					if (err) {
						return self.doError('job', "Failed to fetch job details: " + err, callback);
					}
					
					callback({ code: 0, job: job });
				} ); // job get
			} ); // log head
		} ); // session
	},
	
	api_get_job_status: function(args, callback) {
		// get details for job in progress, or completed job
		// can be used for polling for completion, look for `complete` flag
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			// check live jobs first
			var all_jobs = self.getAllActiveJobs();
			var job = all_jobs[ params.id ];
			if (job) return callback({
				code: 0, 
				job: Tools.mergeHashes( job, {
					elapsed: Tools.timeNow() - job.time_start
				} )
			});
			
			// TODO: Rare but possible race condition here...
			// Slave server may have removed job from activeJobs, and synced with master, 
			// but before master created the job record
			
			// no good?  see if job completed...
			self.storage.get( 'jobs/' + params.id, function(err, job) {
				if (err) {
					return self.doError('job', "Failed to fetch job details: " + err, callback);
				}
				
				callback({ code: 0, job: job });
			} ); // job get
		} ); // session
	},
	
	api_delete_job: function(args, callback) {
		// delete all files for completed job
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			// fetch job details
			self.storage.get( 'jobs/' + params.id, function(err, job) {
				if (err) {
					return self.doError('job', "Failed to fetch job details: " + err, callback);
				}
				
				var stub = { 
					action: 'job_delete', 
					id: job.id,
					event: job.event
				};
				
				async.series(
					[
						function(callback) {
							// update event history
							// ignore error as this may fail for a variety of reasons
							self.storage.listFindReplace( 'logs/events/' + job.event, { id: job.id }, stub, function(err) { callback(); } );
						},
						function(callback) {
							// update global history
							// ignore error as this may fail for a variety of reasons
							self.storage.listFindReplace( 'logs/completed', { id: job.id }, stub, function(err) { callback(); } );
						},
						function(callback) {
							// delete job log
							// ignore error as this may fail for a variety of reasons
							self.storage.delete( 'jobs/' + job.id + '/log.txt.gz', function(err) { callback(); } );
						},
						function(callback) {
							// delete job details
							// this should never fail
							self.storage.delete( 'jobs/' + job.id, callback );
						}
					],
					function(err) {
						// check for error
						if (err) {
							return self.doError('job', "Failed to delete job: " + err, callback);
						}
						
						// add note to admin log
						self.logActivity('job_delete', stub, args);
						
						// log transaction
						self.logTransaction('job_delete', job.id, self.getClientInfo(args));
						
						// and we're done
						callback({ code: 0 });
					}
				); // async.series
			} ); // job get
		} ); // session
	}
	
} );
