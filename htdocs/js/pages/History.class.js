// Cronicle History Page

Class.subclass( Page.Base, "Page.History", {	
	
	default_sub: 'history',
	
	onInit: function() {
		// called once at page load
		// var html = '';
		// this.div.html( html );
		this.charts = {};
	},
	
	onActivate: function(args) {
		// page activation
		if (!this.requireLogin(args)) return true;
		
		if (!args) args = {};
		if (!args.sub) args.sub = this.default_sub;
		this.args = args;
		
		app.showTabBar(true);
		this.tab[0]._page_id = Nav.currentAnchor();
		
		this.div.addClass('loading');
		this['gosub_'+args.sub](args);
		
		return true;
	},
	
	gosub_history: function(args) {
		// show history
		app.setWindowTitle( "History" );
		
		if (!args.offset) args.offset = 0;
		if (!args.limit) args.limit = 25;
		app.api.post( 'app/get_history', copy_object(args), this.receive_history.bind(this) );
	},
	
	receive_history: function(resp) {
		// receive page of history from server, render it
		this.lastHistoryResp = resp;
		
		var html = '';
		this.div.removeClass('loading');
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) - 50) / 8 );
		
		this.events = [];
		if (resp.rows) this.events = resp.rows;
		
		var cols = ['Job ID', 'Event Name', 'Category', 'Plugin', 'Hostname', 'Result', 'Start Date/Time', 'Elapsed Time'];
		
		// html += '<div style="padding:5px 15px 15px 15px;">';
		html += '<div style="padding:20px 20px 30px 20px">';
		
		html += '<div class="subtitle">';
			html += 'All Completed Jobs';
			// html += '<div class="subtitle_widget"><span class="link" onMouseUp="$P().refresh_user_list()"><b>Refresh</b></span></div>';
			// html += '<div class="subtitle_widget"><i class="fa fa-search">&nbsp;</i><input type="text" id="fe_ul_search" size="15" placeholder="Find username..." style="border:0px;"/></div>';
			var sorted_events = app.schedule.sort( function(a, b) {
				return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
			} );
			html += '<div class="subtitle_widget"><i class="fa fa-chevron-down">&nbsp;</i><select id="fe_hist_event" class="subtitle_menu" onChange="$P().jump_to_event_history()"><option value="">Filter by Event</option>' + render_menu_options( sorted_events, '', false ) + '</select></div>';
			html += '<div class="clear"></div>';
		html += '</div>';
		
		var self = this;
		html += this.getPaginatedTable( resp, cols, 'event', function(job, idx) {
			/*var actions = [
				'<a href="#JobDetails?id='+job.id+'"><b>Job&nbsp;Details</b></a>',
				'<a href="#History?sub=event_history&id='+job.event+'"><b>Event&nbsp;History</b></a>'
			];*/
			
			var event = find_object( app.schedule, { id: job.event } );
			var cat = job.category ? find_object( app.categories, { id: job.category } ) : null;
			var plugin = job.plugin ? find_object( app.plugins, { id: job.plugin } ) : null;
			
			var event_link = '(None)';
			if (event) {
				event_link = '<div class="td_big"><a href="#History?sub=event_history&id='+job.event+'">' + self.getNiceEvent('<b>' + (event.title || job.event) + '</b>', col_width + 40) + '</a></div>';
			}
			else if (job.event_title) {
				event_link = self.getNiceEvent(job.event_title, col_width + 40);
			}
			
			var tds = [
				'<div class="td_big"><a href="#JobDetails?id='+job.id+'">' + self.getNiceJob('<b>' + job.id + '</b>') + '</a></div>',
				event_link,
				self.getNiceCategory( cat, col_width ),
				self.getNicePlugin( plugin, col_width ),
				self.getNiceGroup( null, job.hostname, col_width ),
				(job.code == 0) ? '<span class="color_label green"><i class="fa fa-check">&nbsp;</i>Success</span>' : '<span class="color_label red"><i class="fa fa-warning">&nbsp;</i>Error</span>',
				get_nice_date_time( job.time_start, false, true ),
				get_text_from_seconds( job.elapsed, true, false )
				// actions.join(' | ')
			];
			
			if (cat && cat.color) {
				if (tds.className) tds.className += ' '; else tds.className = '';
				tds.className += cat.color;
			}
			
			return tds;
		} );
		
		html += '</div>'; // padding
		
		this.div.html( html );
	},
	
	jump_to_event_history: function() {
		// make a selection from the event filter menu
		var id = $('#fe_hist_event').val();
		if (id) Nav.go( '#History?sub=event_history&id=' + id );
	},
	
	gosub_event_stats: function(args) {
		// request event stats
		app.api.post( 'app/get_event_history', { id: args.id, offset: 0, limit: 50 }, this.receive_event_stats.bind(this) );
	},
	
	receive_event_stats: function(resp) {
		// render event stats page
		this.lastEventStatsResp = resp;
		
		var html = '';
		var args = this.args;
		var rows = this.rows = resp.rows;
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) - 300) / 4 );
		
		var event = find_object( app.schedule, { id: args.id } ) || null;
		if (!event) return app.doError("Could not locate event in schedule: " + args.id);
		
		var cat = event.category ? find_object( app.categories, { id: event.category } ) : null;
		var group = event.target ? find_object( app.server_groups, { id: event.target } ) : null;
		var plugin = event.plugin ? find_object( app.plugins, { id: event.plugin } ) : null;
		
		if (group && event.multiplex) {
			group = copy_object(group);
			group.multiplex = 1;
		}
		
		app.setWindowTitle( "Event Stats: " + event.title );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'event_stats',
			[
				['history', "All Completed"],
				['event_stats', "Event Stats"],
				['event_history&id=' + args.id, "Event History"]
			]
		);
		html += '<div style="padding:20px 20px 30px 20px">';
		
		html += '<fieldset style="margin-top:0px; margin-right:0px; padding-top:10px;"><legend>Event Stats</legend>';
			
			html += '<div style="float:left; width:25%;">';
				html += '<div class="info_label">EVENT NAME</div>';
				html += '<div class="info_value"><a href="#Schedule?sub=edit_event&id='+event.id+'">' + this.getNiceEvent(event.title, col_width) + '</a></div>';
				
				html += '<div class="info_label">CATEGORY NAME</div>';
				html += '<div class="info_value">' + this.getNiceCategory(cat, col_width) + '</div>';
				
				html += '<div class="info_label">EVENT TIMING</div>';
				html += '<div class="info_value">' + (event.enabled ? summarize_event_timing(event.timing, event.timezone) : '(Disabled)') + '</div>';
			html += '</div>';
			
			html += '<div style="float:left; width:25%;">';
				html += '<div class="info_label">USERNAME</div>';
				html += '<div class="info_value">' + this.getNiceUsername(event, false, col_width) + '</div>';
				
				html += '<div class="info_label">PLUGIN NAME</div>';
				html += '<div class="info_value">' + this.getNicePlugin(plugin, col_width) + '</div>';
				
				html += '<div class="info_label">EVENT TARGET</div>';
				html += '<div class="info_value">' + this.getNiceGroup(group, event.target, col_width) + '</div>';
			html += '</div>';
			
			var total_elapsed = 0;
			var total_cpu = 0;
			var total_mem = 0;
			var total_success = 0;
			var total_log_size = 0;
			var count = 0;
			
			for (var idx = 0, len = rows.length; idx < len; idx++) {
				var job = rows[idx];
				if (job.action != 'job_complete') continue;
				
				count++;
				total_elapsed += (job.elapsed || 0);
				if (job.cpu && job.cpu.total) total_cpu += (job.cpu.total / (job.cpu.count || 1));
				if (job.mem && job.mem.total) total_mem += (job.mem.total / (job.mem.count || 1));
				if (job.code == 0) total_success++;
				total_log_size += (job.log_file_size || 0);
			}
			if (!count) count = 1;
			
			var nice_last_result = 'n/a';
			if (rows.length > 0) {
				var job = find_object( rows, { action: 'job_complete' } );
				if (job) nice_last_result = (job.code == 0) ? '<span class="color_label green"><i class="fa fa-check">&nbsp;</i>Success</span>' : '<span class="color_label red"><i class="fa fa-warning">&nbsp;</i>Error</span>';
			}
			
			html += '<div style="float:left; width:25%;">';
				html += '<div class="info_label">AVG. ELAPSED</div>';
				html += '<div class="info_value">' + get_text_from_seconds(total_elapsed / count, true, false) + '</div>';
				
				html += '<div class="info_label">AVG. CPU</div>';
				html += '<div class="info_value">' + short_float(total_cpu / count) + '%</div>';
				
				html += '<div class="info_label">AVG. MEMORY</div>';
				html += '<div class="info_value">' + get_text_from_bytes( total_mem / count ) + '</div>';
			html += '</div>';
			
			html += '<div style="float:left; width:25%;">';
				html += '<div class="info_label">SUCCESS RATE</div>';
				html += '<div class="info_value">' + pct(total_success, count) + '</div>';
				
				html += '<div class="info_label">LAST RESULT</div>';
				html += '<div class="info_value" style="position:relative; top:1px;">' + nice_last_result + '</div>';
				
				html += '<div class="info_label">AVG. LOG SIZE</div>';
				html += '<div class="info_value">' + get_text_from_bytes( total_log_size / count ) + '</div>';
			html += '</div>';
			
			html += '<div class="clear"></div>';
		html += '</fieldset>';
		
		// graph containers
		html += '<div style="margin-top:15px;">';
			html += '<div class="graph-title">Performance History</div>';
			html += '<div id="d_graph_hist_perf" style="width:100%; height:300px;"></div>';
		html += '</div>';
		
		html += '<div style="margin-top:10px; margin-bottom:20px; height:1px; background:#ddd;"></div>';
		
		// cpu / mem graphs
		html += '<div style="margin-top:0px;">';
			html += '<div style="float:left; width:50%;">';
				html += '<div class="graph-title">CPU Usage History</div>';
				html += '<div id="d_graph_hist_cpu" style="margin-right:5px; height:225px;"></div>';
			html += '</div>';
			html += '<div style="float:left; width:50%;">';
				html += '<div class="graph-title">Memory Usage History</div>';
				html += '<div id="d_graph_hist_mem" style="margin-left:5px; height:225px;"></div>';
			html += '</div>';
			html += '<div class="clear"></div>';
		html += '</div>';
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		// graphs
		this.render_perf_line_chart();
		this.render_cpu_line_chart();
		this.render_mem_line_chart();
	},
	
	render_perf_line_chart: function() {
		// event perf over time
		var rows = this.rows;
		
		var perf_keys = {};
		var perf_data = [];
		var perf_times = [];
		
		// build perf data for chart
		// read backwards as server data is unshifted (descending by date, newest first)
		for (var idx = rows.length - 1; idx >= 0; idx--) {
			var job = rows[idx];
			if (job.action != 'job_complete') continue;
			
			if (!job.perf) job.perf = { total: job.elapsed };
			if (!isa_hash(job.perf)) job.perf = parse_query_string( job.perf.replace(/\;/g, '&') );
			
			var pscale = 1;
			if (job.perf.scale) {
				pscale = job.perf.scale;
			}
			
			var perf = deep_copy_object( job.perf.perf ? job.perf.perf : job.perf );
			delete perf.scale;
			
			// remove counters from pie
			for (var key in perf) {
				if (key.match(/^c_/)) delete perf[key];
			}
			
			if (perf.t) { perf.total = perf.t; delete perf.t; }
			if ((num_keys(perf) > 1) && perf.total) {
				if (!perf.other) {
					var totes = 0;
					for (var key in perf) {
						if (key != 'total') totes += perf[key];
					}
					if (totes < perf.total) {
						perf.other = perf.total - totes;
					}
				}
			}
			
			// divide everything by scale, so we get seconds
			for (var key in perf) {
				perf[key] /= pscale;
			}
			
			perf_data.push( perf );
			for (var key in perf) {
				perf_keys[key] = 1;
			}
			
			// track times as well
			perf_times.push( job.time_end || (job.time_start + job.elapsed) );
		} // foreach row
		
		// build up timestamp data
		var tstamp_col = ['x'];
		for (var idy = 0, ley = perf_times.length; idy < ley; idy++) {
			tstamp_col.push( perf_times[idy] * 1000 );
		} // foreach row
		
		var cols = [ tstamp_col ];
		var sorted_keys = hash_keys_to_array(perf_keys).sort();
		
		for (var idx = 0, len = sorted_keys.length; idx < len; idx++) {
			var perf_key = sorted_keys[idx];
			var col = [perf_key];
			
			for (var idy = 0, ley = perf_data.length; idy < ley; idy++) {
				var perf = perf_data[idy];
				col.push( short_float( perf[perf_key] || 0 ) );
			} // foreach row
			
			cols.push( col );
		} // foreach key
		
		this.charts.perf = c3.generate({
			bindto: '#d_graph_hist_perf',
			data: {
				x: 'x',
				columns: cols,
				type: 'line',
			},
			axis: {
				x: {
					show: false,
					type : 'timeseries',
					tick: {
						format: function (x) {
							var dargs = get_date_args(x);
							return dargs.yyyy_mm_dd + ' ' + dargs.hh_mi_ss;
						}
					}
				},
				y: {
					show: true,
					tick: {
						format: function (y) {
							return '' + short_float(y) + ' sec';
						}
					}
				}
			},
			grid: {
				x: { show: false },
				y: { show: true }
			}
		});
	},
	
	render_cpu_line_chart: function() {
		// event cpu usage over time
		var rows = this.rows;
		
		var col_x = ['x'];
		var col_avg = ['CPU Avg'];
		var col_max = ['CPU Peak'];
		
		// build data for chart
		// read backwards as server data is unshifted (descending by date, newest first)
		for (var idx = rows.length - 1; idx >= 0; idx--) {
			var job = rows[idx];
			if (job.action != 'job_complete') continue;
			
			if (!job.cpu) job.cpu = {};
			
			col_avg.push( short_float( (job.cpu.total || 0) / (job.cpu.count || 1) ) );
			col_max.push( short_float( job.cpu.max || 0 ) );
			
/*col_avg.push( short_float( Math.random() * 25 ) );
col_max.push( short_float( 25 + Math.random() * 25 ) );*/
			
			col_x.push( (job.time_end || (job.time_start + job.elapsed)) * 1000 );
		} // foreach row
		
		this.charts.cpu = c3.generate({
			bindto: '#d_graph_hist_cpu',
			data: {
				x: 'x',
				columns: [ col_x, col_avg, col_max ],
				type: 'area',
				colors: {
					"CPU Avg": '#888888',
					"CPU Peak": '#3f7ed5'
				}
			},
			axis: {
				x: {
					show: false,
					type : 'timeseries',
					tick: {
						format: function (x) {
							var dargs = get_date_args(x);
							return dargs.yyyy_mm_dd + ' ' + dargs.hh_mi_ss;
						}
					}
				},
				y: {
					show: true,
					tick: {
						format: function (y) {
							return '' + short_float(y) + '%';
						}
					}
				}
			},
			grid: {
				x: { show: false },
				y: { show: true }
			},
			tooltip: {
				format: {
					value: function(value, ratio, id, index) { return '' + short_float(value) + '%'; }
				}
			}
		});
	},
	
	render_mem_line_chart: function() {
		// event mem usage over time
		var rows = this.rows;
		
		var col_x = ['x'];
		var col_avg = ['Mem Avg'];
		var col_max = ['Mem Peak'];
		
		// build data for chart
		// read backwards as server data is unshifted (descending by date, newest first)
		for (var idx = rows.length - 1; idx >= 0; idx--) {
			var job = rows[idx];
			if (job.action != 'job_complete') continue;
			
			if (!job.mem) job.mem = {};
			col_avg.push( short_float( (job.mem.total || 0) / (job.mem.count || 1) ) );
			col_max.push( short_float( job.mem.max || 0 ) );
			col_x.push( (job.time_end || (job.time_start + job.elapsed)) * 1000 );
		} // foreach row
		
		this.charts.cpu = c3.generate({
			bindto: '#d_graph_hist_mem',
			data: {
				x: 'x',
				columns: [ col_x, col_avg, col_max ],
				type: 'area',
				/*types: {
					"Mem Avg": 'area-spline',
					"Mem Peak": 'spline'
				},*/
				colors: {
					"Mem Avg": '#888888',
					"Mem Peak": '#279321'
				}
			},
			axis: {
				x: {
					show: false,
					type : 'timeseries',
					tick: {
						format: function (x) {
							var dargs = get_date_args(x);
							return dargs.yyyy_mm_dd + ' ' + dargs.hh_mi_ss;
						}
					}
				},
				y: {
					show: true,
					tick: {
						format: function (y) {
							return '' + get_text_from_bytes(y, 1);
						}
					}
				}
			},
			grid: {
				x: { show: false },
				y: { show: true }
			},
			tooltip: {
				format: {
					value: function(value, ratio, id, index) { return get_text_from_bytes(value); }
				}
			}
		});
	},
	
	gosub_event_history: function(args) {
		// show table of all history for a single event
		if (!args.offset) args.offset = 0;
		if (!args.limit) args.limit = 25;
		app.api.post( 'app/get_event_history', copy_object(args), this.receive_event_history.bind(this) );
	},
	
	receive_event_history: function(resp) {
		// render event history
		this.lastEventHistoryResp = resp;
		
		var html = '';
		var args = this.args;
		var rows = this.rows = resp.rows;
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) - 300) / 7 );
		
		var event = find_object( app.schedule, { id: args.id } ) || null;
		if (!event) return app.doError("Could not locate event in schedule: " + args.id);
		
		app.setWindowTitle( "Event History: " + event.title );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'event_history',
			[
				['history', "All Completed"],
				['event_stats&id=' + args.id, "Event Stats"],
				['event_history', "Event History"]
			]
		);
		html += '<div style="padding:20px 20px 30px 20px">';
		
		var cols = ['Job ID', 'Hostname', 'Result', 'Start Date/Time', 'Elapsed Time', 'Avg CPU', 'Avg Mem'];
		
		html += '<div class="subtitle">';
			html += 'Event History: ' + event.title;
			html += '<div class="clear"></div>';
		html += '</div>';
		
		var self = this;
		html += this.getPaginatedTable( resp, cols, 'event', function(job, idx) {
			if (job.action != 'job_complete') return null;
			
			var cpu_avg = 0;
			var mem_avg = 0;
			if (job.cpu) cpu_avg = short_float( (job.cpu.total || 0) / (job.cpu.count || 1) );
			if (job.mem) mem_avg = short_float( (job.mem.total || 0) / (job.mem.count || 1) );
			
			var tds = [
				'<div class="td_big" style="white-space:nowrap;"><a href="#JobDetails?id='+job.id+'"><i class="fa fa-pie-chart">&nbsp;</i><b>' + job.id.substring(0, 11) + '</b></span></div>',
				self.getNiceGroup( null, job.hostname, col_width ),
				(job.code == 0) ? '<span class="color_label green"><i class="fa fa-check">&nbsp;</i>Success</span>' : '<span class="color_label red"><i class="fa fa-warning">&nbsp;</i>Error</span>',
				get_nice_date_time( job.time_start, false, true ),
				get_text_from_seconds( job.elapsed, true, false ),
				'' + cpu_avg + '%',
				get_text_from_bytes(mem_avg)
				// actions.join(' | ')
			];
			
			return tds;
		} );
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	onStatusUpdate: function(data) {
		// received status update (websocket), update sub-page if needed
		if (data.jobs_changed && (this.args.sub == 'history')) this.gosub_history(this.args);
	},
	
	onResizeDelay: function(size) {
		// called 250ms after latest window resize
		// so we can run more expensive redraw operations
		switch (this.args.sub) {
			case 'history':
				if (this.lastHistoryResp) {
					this.receive_history( this.lastHistoryResp );
				}
			break;
			
			case 'event_stats':
				if (this.lastEventStatsResp) {
					this.receive_event_stats( this.lastEventStatsResp );
				}
			break;
			
			case 'event_history':
				if (this.lastEventHistoryResp) {
					this.receive_event_history( this.lastEventHistoryResp );
				}
			break;
		}
	},
	
	onDeactivate: function() {
		// called when page is deactivated
		for (var key in this.charts) {
			this.charts[key].destroy();
		}
		this.charts = {};
		
		delete this.rows;
		if (this.args && (this.args.sub == 'event_stats')) this.div.html( '' );
		return true;
	}
	
});
