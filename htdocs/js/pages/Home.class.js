Class.subclass( Page.Base, "Page.Home", {	
	
	bar_width: 100,
	
	onInit: function() {
		// called once at page load
		this.worker = new Worker('js/home-worker.js');
		this.worker.onmessage = this.render_upcoming_events.bind(this);
		
		var html = '';
		html += '<div style="padding:10px 20px 20px 20px">';
		
		// header stats
		
		html += '<div id="d_home_header_stats"></div>';
		
		html += '<div style="height:20px;"></div>';
		
		// active jobs
		
		html += '<div class="subtitle">';
			html += 'Active Jobs';
			html += '<div class="clear"></div>';
		html += '</div>';
		
		html += '<div id="d_home_active_jobs"></div>';
		
		html += '<div style="height:20px;"></div>';
		
		// upcoming events
		
		html += '<div class="subtitle">';
			html += 'Upcoming Events';
			html += '<div class="clear"></div>';
		html += '</div>';
		
		html += '<div id="d_home_upcoming_events" class="loading"></div>';
		
		
		
		// completed events
		
		
		
		html += '</div>'; // container
		
		this.div.html( html );
	},
	
	onActivate: function(args) {
		// page activation
		if (!this.requireLogin(args)) return true;
		
		if (!args) args = {};
		this.args = args;
		
		app.setWindowTitle('Home');
		app.showTabBar(true);
		
		this.upcoming_offset = 0;
		
		// refresh datas
		$('#d_home_active_jobs').html( this.get_active_jobs_html() );
		this.refresh_upcoming_events();
		this.refresh_header_stats();
		
		return true;
	},
	
	refresh_header_stats: function() {
		// refresh daemons stats in header fieldset
		var html = '';
		var stats = app.state.stats;
		
		html += '<fieldset style="margin-top:0px; margin-right:0px; padding-top:10px;"><legend>Server Stats</legend>';
			
			html += '<div style="float:left; width:25%;">';
				var active_events = find_objects( app.schedule, { enabled: 1 } );
				
				html += '<div class="info_label">TOTAL EVENTS</div>';
				html += '<div class="info_value">' + commify( active_events.length ) + '</div>';
				
				html += '<div class="info_label">TOTAL CATEGORIES</div>';
				html += '<div class="info_value">' + commify( app.categories.length ) + '</div>';
				
				html += '<div class="info_label">TOTAL PLUGINS</div>';
				html += '<div class="info_value">' + commify( app.plugins.length ) + '</div>';
			html += '</div>';
			
			html += '<div style="float:left; width:25%;">';
				html += '<div class="info_label">JOBS COMPLETED TODAY</div>';
				html += '<div class="info_value">' + commify( stats.jobs_completed || 0 ) + '</div>';
				
				html += '<div class="info_label">JOBS FAILED TODAY</div>';
				html += '<div class="info_value">' + commify( stats.jobs_failed || 0 ) + '</div>';
				
				html += '<div class="info_label">JOB SUCCESS RATE</div>';
				html += '<div class="info_value">' + pct( (stats.jobs_completed || 0) - (stats.jobs_failed || 0), stats.jobs_completed || 1 ) + '</div>';
			html += '</div>';
			
			html += '<div style="float:left; width:25%;">';
				html += '<div class="info_label">TOTAL SERVERS</div>';
				html += '<div class="info_value">' + commify( num_keys(app.servers) ) + '</div>';
				
				var total_cpu = 0;
				var total_mem = 0;
				for (var hostname in app.servers) {
					// daemon process cpu, all servers
					var server = app.servers[hostname];
					if (server.data && !server.disabled) {
						total_cpu += (server.data.cpu || 0);
						total_mem += (server.data.mem || 0);
					}
				}
				for (var id in app.activeJobs) {
					// active job process cpu, all jobs
					var job = app.activeJobs[id];
					if (job.cpu) total_cpu += (job.cpu.current || 0);
					if (job.mem) total_mem += (job.mem.current || 0);
				}
				html += '<div class="info_label">TOTAL CPU IN USE</div>';
				html += '<div class="info_value">' + short_float(total_cpu) + '%</div>';
				
				html += '<div class="info_label">TOTAL RAM IN USE</div>';
				html += '<div class="info_value">' + get_text_from_bytes(total_mem) + '</div>';
			html += '</div>';
			
			html += '<div style="float:left; width:25%;">';
				var mserver = app.servers[ app.masterHostname ] || {};
				html += '<div class="info_label">MASTER SERVER UPTIME</div>';
				html += '<div class="info_value">' + get_text_from_seconds( mserver.uptime || 0, false, true ) + '</div>';
				
				var job_avg = (stats.jobs_elapsed || 0) / (stats.jobs_completed || 1);
				html += '<div class="info_label">AVERAGE JOB DURATION</div>';
				html += '<div class="info_value">' + get_text_from_seconds( job_avg, false, true ) + '</div>';
				
				var log_size_avg = (stats.jobs_log_size || 0) / (stats.jobs_completed || 1);
				html += '<div class="info_label">AVERAGE JOB LOG SIZE</div>';
				html += '<div class="info_value">' + get_text_from_bytes(log_size_avg) + '</div>';
			html += '</div>';
			
			html += '<div class="clear"></div>';
		html += '</fieldset>';
		
		$('#d_home_header_stats').html( html );
	},
	
	refresh_upcoming_events: function() {
		// send message to worker to refresh upcoming
		this.worker_start_time = hires_time_now();
		this.worker.postMessage({
			default_tz: app.tz,
			schedule: app.schedule,
			state: app.state,
			categories: app.categories,
			plugins: app.plugins
		});
	},
	
	nav_upcoming: function(offset) {
		// refresh upcoming events with new offset
		this.upcoming_offset = offset;
		this.render_upcoming_events({
			data: this.upcoming_events
		});
	},
	
	render_upcoming_events: function(e) {
		// receive data from worker, render table now
		var self = this;
		var events = this.upcoming_events = e.data;
		var html = '';
		var now = hires_time_now();
		
		/*var elapsed = now - this.worker_start_time;
		delete this.worker_start_time;
		Debug.trace('Home', "Worker elapsed time: " + elapsed + ' sec for ' + app.schedule.length + ' events.');*/
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) + 50) / 7 );
		
		var cols = ['Event Name', 'Category', 'Plugin', 'Target', 'Scheduled Time', 'Countdown', 'Actions'];
		var limit = 25;
		
		html += this.getPaginatedTable({
			resp: {
				rows: events.slice(this.upcoming_offset, this.upcoming_offset + limit),
				list: {
					length: events.length
				}
			},
			cols: cols,
			data_type: 'pending event',
			limit: limit,
			offset: this.upcoming_offset,
			pagination_link: '$P().nav_upcoming',
			
			callback: function(stub, idx) {
				var item = find_object( app.schedule, { id: stub.id } ) || {};
				// var dargs = get_date_args( stub.epoch );
				var margs = moment.tz(stub.epoch * 1000, item.timezone || app.tz);
				
				var actions = [
					'<a href="#Schedule?sub=edit_event&id='+item.id+'"><b>Edit Event</b></a>'
				];
				
				var cat = item.category ? find_object( app.categories, { id: item.category } ) : null;
				var group = item.target ? find_object( app.server_groups, { id: item.target } ) : null;
				var plugin = item.plugin ? find_object( app.plugins, { id: item.plugin } ) : null;
				
				var nice_countdown = 'Now';
				if (stub.epoch > now) {
					nice_countdown = get_text_from_seconds_round( Math.max(60, stub.epoch - now), false );
				}
				
				if (group && item.multiplex) {
					group = copy_object(group);
					group.multiplex = 1;
				}
				
				var tds = [
					'<div class="td_big" style="white-space:nowrap;"><a href="#Schedule?sub=edit_event&id='+item.id+'">' + self.getNiceEvent('<b>' + item.title + '</b>', col_width) + '</a></div>',
					self.getNiceCategory( cat, col_width ),
					self.getNicePlugin( plugin, col_width ),
					self.getNiceGroup( group, item.target, col_width ),
					// dargs.hour12 + ':' + dargs.mi + ' ' + dargs.ampm.toUpperCase(),
					margs.format("h:mm A z"),
					nice_countdown,
					actions.join(' | ')
				];
				
				return tds;
			} // row callback
		}); // table
		
		$('#d_home_upcoming_events').removeClass('loading').html( html );
	},
	
	get_active_jobs_html: function() {
		// get html for active jobs table
		var html = '';
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) + 50) / 8 );
		
		// copy jobs to array
		var jobs = [];
		for (var id in app.activeJobs) {
			jobs.push( app.activeJobs[id] );
		}
		
		// sort events by time_start descending
		this.jobs = jobs.sort( function(a, b) {
			return (a.time_start < b.time_start) ? 1 : -1;
		} );
		
		var cols = ['Job ID', 'Event Name', 'Category', 'Hostname', 'Elapsed', 'Progress', 'Remaining', 'Actions'];
		
		// render table
		var self = this;
		html += this.getBasicTable( this.jobs, cols, 'active job', function(job, idx) {
			var actions = [
				// '<span class="link" onMouseUp="$P().go_job_details('+idx+')"><b>Details</b></span>',
				'<span class="link" onMouseUp="$P().abort_job('+idx+')"><b>Abort Job</b></span>'
			];
			
			var cat = job.category ? find_object( app.categories, { id: job.category } ) : { title: 'n/a' };
			// var group = item.target ? find_object( app.server_groups, { id: item.target } ) : null;
			var plugin = job.plugin ? find_object( app.plugins, { id: job.plugin } ) : { title: 'n/a' };
			var tds = null;
			
			if (job.pending) {
				tds = [
					'<div class="td_big">' + self.getNiceJob(job.id) + '</div>',
					self.getNiceEvent( job.event_title, col_width ),
					self.getNiceCategory( cat, col_width ),
					// self.getNicePlugin( plugin ),
					self.getNiceGroup( null, job.hostname, col_width ),
					'n/a',
					'<div id="d_home_jt_progress_'+job.id+'">' + self.getNiceJobPendingText(job) + '</div>',
					'n/a',
					actions.join(' | ')
				];
			} // pending job
			else {
				tds = [
					// '<div class="td_big" style="white-space:nowrap;"><span class="link" onMouseUp="$P().go_job_details('+idx+')" title="Job ID: '+job.id+'"><i class="fa fa-clock-o">&nbsp;</i><b>' + job.event_title + '</b></span></div>',
					'<div class="td_big"><span class="link" onMouseUp="$P().go_job_details('+idx+')">' + self.getNiceJob(job.id) + '</span></div>',
					self.getNiceEvent( job.event_title, col_width ),
					self.getNiceCategory( cat, col_width ),
					// self.getNicePlugin( plugin ),
					self.getNiceGroup( null, job.hostname, col_width ),
					'<div id="d_home_jt_elapsed_'+job.id+'">' + self.getNiceJobElapsedTime(job) + '</div>',
					'<div id="d_home_jt_progress_'+job.id+'">' + self.getNiceJobProgressBar(job) + '</div>',
					'<div id="d_home_jt_remaining_'+job.id+'">' + self.getNiceJobRemainingTime(job) + '</div>',
					actions.join(' | ')
				];
			} // active job
			
			return tds;
		} );
		
		return html;
	},
	
	go_job_details: function(idx) {
		// jump to job details page
		var job = this.jobs[idx];
		Nav.go( '#JobDetails?id=' + job.id );
	},
	
	abort_job: function(idx) {
		// abort job, after confirmation
		var job = this.jobs[idx];
		
		app.confirm( '<span style="color:red">Abort Job</span>', "Are you sure you want to abort the job &ldquo;<b>"+job.id+"</b>&rdquo;?</br>(Event: "+job.event_title+")", "Abort", function(result) {
			if (result) {
				app.showProgress( 1.0, "Aborting job..." );
				app.api.post( 'app/abort_job', job, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Job '"+job.event_title+"' was aborted successfully.");
				} );
			}
		} );
	},
	
	getNiceJobElapsedTime: function(job) {
		// render nice elapsed time display
		var elapsed = Math.floor( Math.max( 0, app.epoch - job.time_start ) );
		return get_text_from_seconds( elapsed, true, false );
	},
	
	getNiceJobProgressBar: function(job) {
		// render nice progress bar for job
		var html = '';
		var counter = Math.min(1, Math.max(0, job.progress || 1));
		var cx = Math.floor( counter * this.bar_width );
		var extra_classes = '';
		var extra_attribs = '';
		if (counter == 1.0) extra_classes = 'indeterminate';
		else extra_attribs = 'title="'+Math.floor( (counter / 1.0) * 100 )+'%"';
		
		html += '<div class="progress_bar_container '+extra_classes+'" style="width:'+this.bar_width+'px; margin:0;" '+extra_attribs+'>';
			html += '<div class="progress_bar_inner" style="width:'+cx+'px;"></div>';
		html += '</div>';
		
		return html;
	},
	
	getNiceJobRemainingTime: function(job) {
		// get nice job remaining time, using elapsed and progress
		var elapsed = Math.floor( Math.max( 0, app.epoch - job.time_start ) );
		var progress = job.progress || 0;
		if ((elapsed >= 10) && (progress > 0) && (progress < 1.0)) {
			var sec_remain = Math.floor(((1.0 - progress) * elapsed) / progress);
			return get_text_from_seconds( sec_remain, true, true );
		}
		else return 'n/a';
	},
	
	getNiceJobPendingText: function(job) {
		// get nice display for pending job status
		var html = '';
		
		// if job has a log_file, it's in a retry delay, otherwise it's pending (multiplex stagger)
		html += (job.log_file ? 'Retry' : 'Pending');
		
		// countdown to actual launch
		var nice_countdown = get_text_from_seconds( Math.max(0, job.when - app.epoch), true, true );
		html += ' (' + nice_countdown + ')';
		
		return html;
	},
	
	onStatusUpdate: function(data) {
		// received status update (websocket), update page if needed
		if (data.jobs_changed) {
			// refresh tables
			$('#d_home_active_jobs').html( this.get_active_jobs_html() );
		}
		else {
			// update progress, time remaining, no refresh
			for (var id in app.activeJobs) {
				var job = app.activeJobs[id];
				if (job.pending) {
					// update countdown
					$('#d_home_jt_progress_' + job.id).html( this.getNiceJobPendingText(job) );
				} // pending job
				else {
					$('#d_home_jt_elapsed_' + job.id).html( this.getNiceJobElapsedTime(job) );
					$('#d_home_jt_remaining_' + job.id).html( this.getNiceJobRemainingTime(job) );
					
					// update progress bar without redrawing it (so animation doesn't jitter)
					var counter = job.progress || 1;
					var cx = Math.floor( counter * this.bar_width );
					var prog_cont = $('#d_home_jt_progress_' + job.id + ' > div.progress_bar_container');
					
					if ((counter == 1.0) && !prog_cont.hasClass('indeterminate')) {
						prog_cont.addClass('indeterminate').attr('title', "");
					}
					else if ((counter < 1.0) && prog_cont.hasClass('indeterminate')) {
						prog_cont.removeClass('indeterminate');
					}
					
					if (counter < 1.0) prog_cont.attr('title', '' + Math.floor( (counter / 1.0) * 100 ) + '%');
					
					prog_cont.find('> div.progress_bar_inner').css( 'width', '' + cx + 'px' );
				} // active job
			} // foreach job
		} // quick update
	},
	
	onDataUpdate: function(key, value) {
		// recieved data update (websocket)
		switch (key) {
			case 'state':
			case 'schedule':
				// state update (new cursors)
				// $('#d_home_upcoming_events').html( this.get_upcoming_events_html() );
				this.refresh_upcoming_events();
				this.refresh_header_stats();
			break;
		}
	},
	
	onResizeDelay: function(size) {
		// called 250ms after latest window resize
		// so we can run more expensive redraw operations
		$('#d_home_active_jobs').html( this.get_active_jobs_html() );
		this.refresh_header_stats();
		
		if (this.upcoming_events) {
			this.render_upcoming_events({
				data: this.upcoming_events
			});
		}
	},
	
	onDeactivate: function() {
		// called when page is deactivated
		// this.div.html( '' );
		return true;
	}
	
} );
