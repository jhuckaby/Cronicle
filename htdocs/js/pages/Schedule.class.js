Class.subclass( Page.Base, "Page.Schedule", {	
	
	default_sub: 'events',
	
	onInit: function() {
		// called once at page load
		var html = '';
		this.div.html( html );
	},
	
	onActivate: function(args) {
		// page activation
		if (!this.requireLogin(args)) return true;
		
		if (!args) args = {};
		if (!args.sub) args.sub = this.default_sub;
		this.args = args;
		
		app.showTabBar(true);
		// this.tab[0]._page_id = Nav.currentAnchor();
		
		this.div.addClass('loading');
		this['gosub_'+args.sub](args);
		
		return true;
	},
	
	gosub_events: function(args) {
		// render table of events with filters and search
		this.div.removeClass('loading');
		app.setWindowTitle( "Scheduled Events" );
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) + 200) / 8 );
		var group_by = app.getPref('schedule_group_by');
		var html = '';
		
		/* html += this.getSidebarTabs( 'categories',
			[
				['categories', "Categories"],
				['servers', "Servers"],
				['plugins', "Plugins"],
				['users', "Users"]
			]
		); */
		
		// presort some stuff for the filter menus
		app.categories.sort( function(a, b) {
			// return (b.title < a.title) ? 1 : -1;
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		app.plugins.sort( function(a, b) {
			// return (b.title < a.title) ? 1 : -1;
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		
		// render table
		var cols = [
			'<i class="fa fa-check-square-o"></i>', 
			'Event Name', 
			'Category', 
			'Plugin', 
			'Target', 
			'Timing', 
			'Status', 
			'Actions'
		];
		
		html += '<div style="padding:20px 20px 20px 20px">';
		
		html += '<div class="subtitle">';
			html += 'Scheduled Events';
			
			html += '<div class="subtitle_widget"><i class="fa fa-search">&nbsp;</i><input type="text" id="fe_sch_keywords" size="10" placeholder="Find events..." style="border:0px;" value="' + escape_text_field_value( args.keywords ) + '"/></div>';
			
			html += '<div class="subtitle_widget"><i class="fa fa-chevron-down">&nbsp;</i><select id="fe_sch_target" class="subtitle_menu" style="width:75px;" onChange="$P().set_search_filters()"><option value="">All Servers</option>' + this.render_target_menu_options( args.target ) + '</select></div>';
			html += '<div class="subtitle_widget"><i class="fa fa-chevron-down">&nbsp;</i><select id="fe_sch_plugin" class="subtitle_menu" style="width:75px;" onChange="$P().set_search_filters()"><option value="">All Plugins</option>' + render_menu_options( app.plugins, args.plugin, false ) + '</select></div>';
			html += '<div class="subtitle_widget"><i class="fa fa-chevron-down">&nbsp;</i><select id="fe_sch_cat" class="subtitle_menu" style="width:95px;" onChange="$P().set_search_filters()"><option value="">All Categories</option>' + render_menu_options( app.categories, args.category, false ) + '</select></div>';
			
			html += '<div class="subtitle_widget"><i class="fa fa-chevron-down">&nbsp;</i><select id="fe_sch_enabled" class="subtitle_menu" style="width:75px;" onChange="$P().set_search_filters()"><option value="">All Events</option>' + render_menu_options( [[1, 'Enabled'], [-1, 'Disabled']], args.enabled, false ) + '</select></div>';
			
			html += '<div class="clear"></div>';
		html += '</div>';
		
		// apply filters
		this.events = [];
		for (var idx = 0, len = app.schedule.length; idx < len; idx++) {
			var item = app.schedule[idx];
			
			// category filter
			if (args.category && (item.category != args.category)) continue;
			
			// plugin filter
			if (args.plugin && (item.plugin != args.plugin)) continue;
			
			// server group filter
			if (args.target && (item.target != args.target)) continue;
			
			// keyword filter
			var words = [item.title, item.username, item.notes, item.target].join(' ').toLowerCase();
			if (args.keywords && words.indexOf(args.keywords.toLowerCase()) == -1) continue;
			
			// enabled filter
			if ((args.enabled == 1) && !item.enabled) continue;
			if ((args.enabled == -1) && item.enabled) continue;
			
			this.events.push( copy_object(item) );
		} // foreach item in schedule
		
		// prep events for sort
		this.events.forEach( function(item) {
			var cat = item.category ? find_object( app.categories, { id: item.category } ) : null;
			var group = item.target ? find_object( app.server_groups, { id: item.target } ) : null;
			var plugin = item.plugin ? find_object( app.plugins, { id: item.plugin } ) : null;
			
			item.category_title = cat ? cat.title : 'Uncategorized';
			item.group_title = group ? group.title : item.target;
			item.plugin_title = plugin ? plugin.title : 'No Plugin';
		} );
		
		// sort events by title ascending
		this.events = this.events.sort( function(a, b) {
			var key = group_by ? (group_by + '_title') : 'title';
			if (group_by && (a[key].toLowerCase() == b[key].toLowerCase())) key = 'title';
			return a[key].toLowerCase().localeCompare( b[key].toLowerCase() );
			// return (b.title < a.title) ? 1 : -1;
		} );
		
		// header center (group by buttons)
		var chtml = '';
		chtml += '<div class="schedule_group_button_container">';
		chtml += '<i class="fa fa-clock-o '+(group_by ? '' : 'selected')+'" title="Sort by Title" onMouseUp="$P().change_group_by(\'\')"></i>';
		chtml += '<i class="fa fa-folder-open-o '+((group_by == 'category') ? 'selected' : '')+'" title="Group by Category" onMouseUp="$P().change_group_by(\'category\')"></i>';
		chtml += '<i class="fa fa-plug '+((group_by == 'plugin') ? 'selected' : '')+'" title="Group by Plugin" onMouseUp="$P().change_group_by(\'plugin\')"></i>';
		chtml += '<i class="mdi mdi-server-network '+((group_by == 'group') ? 'selected' : '')+'" title="Group by Target" onMouseUp="$P().change_group_by(\'group\')"></i>';
		chtml += '</div>';
		cols.headerRight = chtml;
		
		// render table
		var self = this;
		var last_group = '';
		
		html += this.getBasicTable( this.events, cols, 'event', function(item, idx) {
			var actions = [
				'<span class="link" onMouseUp="$P().run_event('+idx+',event)"><b>Run</b></span>',
				'<span class="link" onMouseUp="$P().edit_event('+idx+')"><b>Edit</b></span>',
				'<a href="#History?sub=event_stats&id='+item.id+'"><b>Stats</b></a>',
				'<a href="#History?sub=event_history&id='+item.id+'"><b>History</b></a>',
				// '<span class="link" onMouseUp="$P().delete_event('+idx+')"><b>Delete</b></span>'
			];
			
			var cat = item.category ? find_object( app.categories, { id: item.category } ) : null;
			var group = item.target ? find_object( app.server_groups, { id: item.target } ) : null;
			var plugin = item.plugin ? find_object( app.plugins, { id: item.plugin } ) : null;
			
			var jobs = find_objects( app.activeJobs, { event: item.id } );
			var status_html = jobs.length ? ('<b>Running (' + jobs.length + ')</b>') : 'Idle';
			
			if (group && item.multiplex) {
				group = copy_object(group);
				group.multiplex = 1;
			}
			
			var tds = [
				'<input type="checkbox" style="cursor:pointer" onChange="$P().change_event_enabled('+idx+')" '+(item.enabled ? 'checked="checked"' : '')+'/>', 
				'<div class="td_big"><span class="link" onMouseUp="$P().edit_event('+idx+')">' + self.getNiceEvent(item, col_width) + '</span></div>',
				self.getNiceCategory( cat, col_width ),
				self.getNicePlugin( plugin, col_width ),
				self.getNiceGroup( group, item.target, col_width ),
				summarize_event_timing( item.timing, item.timezone ),
				status_html,
				actions.join('&nbsp;|&nbsp;')
			];
			
			if (!item.enabled) tds.className = 'disabled';
			if (cat && !cat.enabled) tds.className = 'disabled';
			if (plugin && !plugin.enabled) tds.className = 'disabled';
			
			if (cat && cat.color) {
				if (tds.className) tds.className += ' '; else tds.className = '';
				tds.className += cat.color;
			}
			
			// group by
			if (group_by) {
				var cur_group = item[ group_by + '_title' ];
				if (cur_group != last_group) {
					last_group = cur_group;
					var insert_html = '<tr><td colspan="'+cols.length+'"><div class="schedule_group_header">';
					switch (group_by) {
						case 'category': insert_html += self.getNiceCategory(cat); break;
						case 'plugin': insert_html += self.getNicePlugin(plugin); break;
						case 'group': insert_html += self.getNiceGroup(group, item.target); break;
					}
					insert_html += '</div></td></tr>';
					tds.insertAbove = insert_html;
				} // group changed
			} // group_by
			
			return tds;
		} );
		
		html += '<div style="height:30px;"></div>';
		html += '<center><table><tr>';
			html += '<td><div class="button" style="width:130px;" onMouseUp="$P().edit_event(-1)"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Add Event...</div></td>';
		html += '</tr></table></center>';
		
		html += '</div>'; // padding
		// html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		setTimeout( function() {
			$('#fe_sch_keywords').keypress( function(event) {
				if (event.keyCode == '13') { // enter key
					event.preventDefault();
					$P().set_search_filters();
				}
			} ); 
		}, 1 );
	},
	
	change_group_by: function(group_by) {
		// change grop by setting and refresh schedule display
		app.setPref('schedule_group_by', group_by);
		this.gosub_events( this.args );
	},
	
	change_event_enabled: function(idx) {
		// toggle event on / off
		var event = this.events[idx];
		event.enabled = event.enabled ? 0 : 1;
		
		var stub = {
			id: event.id,
			title: event.title,
			enabled: event.enabled,
			catch_up: event.catch_up || false
		};
		
		app.api.post( 'app/update_event', stub, function(resp) {
			app.showMessage('success', "Event '"+event.title+"' has been " + (event.enabled ? 'enabled' : 'disabled') + ".");
		} );
	},
	
	run_event: function(event_idx, e) {
		// run event ad-hoc style
		var self = this;
		var event = (event_idx == 'edit') ? this.event : this.events[event_idx];
		
		if (e.shiftKey || e.ctrlKey || e.altKey) {
			// allow use to select the "now" time
			this.choose_date_time({
				when: time_now(),
				title: "Set Current Event Date/Time",
				description: "Configure the internal date/time for the event to run immediately.  This is the timestamp which the Plugin will see as the current time.",
				button: "Run Now",
				timezone: event.timezone || app.tz,
				
				callback: function(new_epoch) {
					self.run_event_now( event_idx, new_epoch );
				}
			});
		}
		else this.run_event_now(event_idx);
	},
	
	run_event_now: function(idx, now) {
		// run event ad-hoc style
		var event = (idx == 'edit') ? this.event : this.events[idx];
		if (!now) now = time_now();
		
		app.api.post( 'app/run_event', merge_objects( event, { now: now } ), function(resp) {
			var msg = '';
			if (resp.ids.length > 1) {
				// multiple jobs (multiplex)
				var num = resp.ids.length;
				msg = 'Event "'+event.title+'" has been started ('+num+' jobs).  View their progress on the <a href="#Home">Home Tab</a>.';
			}
			else if (resp.ids.length == 1) {
				// single job
				var id = resp.ids[0];
				msg = 'Event "'+event.title+'" has been started.  <a href="#JobDetails?id='+id+'">Click here</a> to view its progress.';
			}
			else {
				// queued
				msg = 'Event "'+event.title+'" could not run right away, but was queued up.  View the queue progress on the <a href="#Home">Home Tab</a>.';
			}
			app.showMessage('success', msg);
		} );
	},
	
	edit_event: function(idx) {
		// edit or create new event
		if (idx == -1) {
			Nav.go('Schedule?sub=new_event');
			return;
		}
		
		// edit existing
		var event = this.events[idx];
		Nav.go('Schedule?sub=edit_event&id=' + event.id);
	},
	
	delete_event: function(idx) {
		// delete selected event
		var self = this;
		var event = (idx == 'edit') ? this.event : this.events[idx];
		
		// check for active jobs first
		var jobs = find_objects( app.activeJobs, { event: event.id } );
		if (jobs.length) return app.doError("Sorry, you cannot delete an event that has active jobs running.");
		
		var msg = "Are you sure you want to delete the event <b>"+event.title+"</b>?";
		
		if (event.queue && app.eventQueue[event.id]) {
			msg += "  The event's job queue will also be flushed.";
		}
		else {
			msg += "  There is no way to undo this action.";
		}
		
		// proceed with delete
		app.confirm( '<span style="color:red">Delete Event</span>', msg, "Delete", function(result) {
			if (result) {
				app.showProgress( 1.0, "Deleting Event..." );
				app.api.post( 'app/delete_event', event, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Event '"+event.title+"' was deleted successfully.");
					
					if (idx == 'edit') Nav.go('Schedule?sub=events');
				} );
			}
		} );
	},
	
	set_search_filters: function() {
		// grab values from search filters, and refresh
		var args = this.args;
		
		args.plugin = $('#fe_sch_plugin').val();
		if (!args.plugin) delete args.plugin;
		
		args.target = $('#fe_sch_target').val();
		if (!args.target) delete args.target;
		
		args.category = $('#fe_sch_cat').val();
		if (!args.category) delete args.category;
		
		args.keywords = $('#fe_sch_keywords').val();
		if (!args.keywords) delete args.keywords;
		
		args.enabled = $('#fe_sch_enabled').val();
		if (!args.enabled) delete args.enabled;
		
		Nav.go( 'Schedule' + compose_query_string(args) );
	},
	
	gosub_new_event: function(args) {
		// create new event
		var html = '';
		app.setWindowTitle( "Add New Event" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'new_event',
			[
				['events', "Schedule"],
				['new_event', "Add New Event"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">Add New Event</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center><table style="margin:0;">';
		
		if (this.event_copy) {
			// copied from existing event
			this.event = this.event_copy;
			delete this.event_copy;
		}
		else if (config.new_event_template) {
			// app has a custom event template
			this.event = deep_copy_object( config.new_event_template );
			if (!this.event.timezone) this.event.timezone = app.tz;
		}
		else {
			// default blank event
			this.event = { 
				enabled: 1, 
				params: {}, 
				timing: { minutes: [0] },
				max_children: 1,
				timeout: 3600,
				catch_up: 0,
				timezone: app.tz
			};
		}
		
		html += this.get_event_edit_html();
		
		// buttons at bottom
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancel_event_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().do_new_event()"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Create Event</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		html += '</table></center>';
		
		html += '</div>'; // table wrapper div
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		setTimeout( function() {
			$('#fe_ee_title').focus();
		}, 1 );
	},
	
	cancel_event_edit: function() {
		// cancel edit, nav back to schedule
		Nav.go('Schedule');
	},
	
	do_new_event: function(force) {
		// create new event
		app.clearError();
		var event = this.get_event_form_json();
		if (!event) return; // error
		
		// pro-tip: embed id in title as bracketed prefix
		if (event.title.match(/^\[(\w+)\]\s*(.+)$/)) {
			event.id = RegExp.$1;
			event.title = RegExp.$2;
		}
		
		this.event = event;
		
		app.showProgress( 1.0, "Creating event..." );
		app.api.post( 'app/create_event', event, this.new_event_finish.bind(this) );
	},
	
	new_event_finish: function(resp) {
		// new event created successfully
		var self = this;
		app.hideProgress();
		
		Nav.go('Schedule');
		
		setTimeout( function() {
			app.showMessage('success', "Event '"+self.event.title+"' was created successfully.");
		}, 150 );
	},
	
	gosub_edit_event: function(args) {
		// edit event subpage
		var event = find_object( app.schedule, { id: args.id } );
		if (!event) return app.doError("Could not locate Event with ID: " + args.id);
		
		// check for autosave recovery
		if (app.autosave_event) {
			if (args.id == app.autosave_event.id) {
				Debug.trace("Recovering autosave data for: " + args.id);
				event = app.autosave_event;
			}
			delete app.autosave_event;
		}
		
		// make local copy so edits don't affect main app list until save
		this.event = deep_copy_object( event );
		
		var html = '';
		app.setWindowTitle( "Editing Event \"" + event.title + "\"" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'edit_event',
			[
				['events', "Schedule"],
				['new_event', "Add New Event"],
				['edit_event', "Edit Event"]
			]
		);
		
		// html += '<div style="padding:20px;"><div class="subtitle">Editing Event &ldquo;' + event.title + '&rdquo;</div></div>';
		
		html += '<div style="padding:20px;">';
			html += '<div class="subtitle">';
				html += 'Editing Event &ldquo;' + event.title + '&rdquo;';
				html += '<div class="subtitle_widget" style="margin-left:5px;"><a href="#History?sub=event_history&id='+event.id+'"><i class="fa fa-arrow-circle-right">&nbsp;</i><b>Jump to History</b></a></div>';
				html += '<div class="subtitle_widget"><a href="#History?sub=event_stats&id='+event.id+'"><i class="fa fa-arrow-circle-right">&nbsp;</i><b>Jump to Stats</b></a></div>';
				html += '<div class="clear"></div>';
			html += '</div>';
		html += '</div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center>';
		html += '<table style="margin:0;">';
		
		// Internal ID
		if (this.isAdmin()) {
			html += get_form_table_row( 'Event ID', '<div style="font-size:14px;">' + event.id + '</div>' );
			html += get_form_table_caption( "The internal event ID used for API calls.  This cannot be changed." );
			html += get_form_table_spacer();
		}
		
		html += this.get_event_edit_html();
		
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				// cancel
				html += '<td><div class="button" style="width:110px; font-weight:normal;" onMouseUp="$P().cancel_event_edit()">Cancel</div></td>';
				// delete
				html += '<td width="30">&nbsp;</td>';
				html += '<td><div class="button" style="width:110px; font-weight:normal;" onMouseUp="$P().delete_event(\'edit\')">Delete Event...</div></td>';
				
				// copy
				html += '<td width="30">&nbsp;</td>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().do_copy_event()">Copy Event...</div></td>';
				
				// run
				html += '<td width="30">&nbsp;</td>';
				html += '<td><div class="button" style="width:110px; font-weight:normal;" onMouseUp="$P().run_event_from_edit(event)">Run Now</div></td>';
				
				// save
				html += '<td width="30">&nbsp;</td>';
				html += '<td><div class="button" style="width:130px;" onMouseUp="$P().do_save_event()"><i class="fa fa-floppy-o">&nbsp;&nbsp;</i>Save Changes</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table>';
		html += '</center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	do_copy_event: function() {
		// make copy of event and jump into new workflow
		app.clearError();
		
		var event = this.get_event_form_json();
		if (!event) return; // error
		
		delete event.id;
		delete event.created;
		delete event.modified;
		delete event.username;
		
		event.title = "Copy of " + event.title;
		
		this.event_copy = event;
		Nav.go('Schedule?sub=new_event');
	},
	
	run_event_from_edit: function(e) {
		// run event in its current (possibly edited, unsaved) state
		app.clearError();
		
		var event = this.get_event_form_json();
		if (!event) return; // error
		
		this.event = event;
		
		this.run_event('edit', e);
	},
	
	do_save_event: function() {
		// save changes to existing event
		app.clearError();
		
		this.old_event = JSON.parse( JSON.stringify(this.event) );
		
		var event = this.get_event_form_json();
		if (!event) return; // error
		
		this.event = event;
		
		app.showProgress( 1.0, "Saving event..." );
		app.api.post( 'app/update_event', event, this.save_event_finish.bind(this) );
	},
	
	save_event_finish: function(resp, tx) {
		// existing event saved successfully
		var self = this;
		var event = this.event;
		
		app.hideProgress();
		app.showMessage('success', "The event was saved successfully.");
		window.scrollTo( 0, 0 );
		
		// copy active jobs to array
		var jobs = [];
		for (var id in app.activeJobs) {
			var job = app.activeJobs[id];
			if ((job.event == event.id) && !job.detached) jobs.push( job );
		}
		
		// if the event was disabled and there are running jobs, ask user to abort them
		if (this.old_event.enabled && !event.enabled && jobs.length) {
			app.confirm( '<span style="color:red">Abort Jobs</span>', "There " + ((jobs.length != 1) ? 'are' : 'is') + " currently still " + jobs.length + " active " + pluralize('job', jobs.length) + " using the disabled event <b>"+event.title+"</b>.  Do you want to abort " + ((jobs.length != 1) ? 'these' : 'it') + " now?", "Abort", function(result) {
				if (result) {
					app.showProgress( 1.0, "Aborting " + pluralize('Job', jobs.length) + "..." );
					app.api.post( 'app/abort_jobs', { event: event.id }, function(resp) {
						app.hideProgress();
						if (resp.count > 0) {
							app.showMessage('success', "The " + pluralize('job', resp.count) + " " + ((resp.count != 1) ? 'were' : 'was') + " aborted successfully.");
						}
						else {
							app.showMessage('warning', "No jobs were aborted.  It is likely they completed while the dialog was up.");
						}
					} );
				} // clicked Abort
			} ); // app.confirm
		} // disabled + jobs
		else {
			// if certain key properties were changed and event has active jobs, ask user to update them
			var need_update = false;
			var updates = {};
			var keys = ['title', 'timeout', 'retries', 'retry_delay', 'chain', 'chain_error', 'notify_success', 'notify_fail', 'web_hook', 'cpu_limit', 'cpu_sustain', 'memory_limit', 'memory_sustain', 'log_max_size'];
			
			for (var idx = 0, len = keys.length; idx < len; idx++) {
				var key = keys[idx];
				if (event[key] != this.old_event[key]) {
					updates[key] = event[key];
					need_update = true;
				}
			} // foreach key
			
			// recount active jobs, including detached this time
			jobs = [];
			for (var id in app.activeJobs) {
				var job = app.activeJobs[id];
				if (job.event == event.id) jobs.push( job );
			}
			
			if (need_update && jobs.length) {
				app.confirm( 'Update Jobs', "This event currently has " + jobs.length + " active " + pluralize('job', jobs.length) + ".  Do you want to update " + ((jobs.length != 1) ? 'these' : 'it') + " as well?", "Update", function(result) {
					if (result) {
						app.showProgress( 1.0, "Updating " + pluralize('Job', jobs.length) + "..." );
						app.api.post( 'app/update_jobs', { event: event.id, updates: updates }, function(resp) {
							app.hideProgress();
							if (resp.count > 0) {
								app.showMessage('success', "The " + pluralize('job', resp.count) + " " + ((resp.count != 1) ? 'were' : 'was') + " updated successfully.");
							}
							else {
								app.showMessage('warning', "No jobs were updated.  It is likely they completed while the dialog was up.");
							}
						} );
					} // clicked Update
				} ); // app.confirm
			} // jobs need update
		} // check for update
		
		delete this.old_event;
	},
	
	get_event_edit_html: function() {
		// get html for editing a event (or creating a new one)
		var html = '';
		var event = this.event;
		
		// event title
		html += get_form_table_row( 'Event Name', '<input type="text" id="fe_ee_title" size="35" value="'+escape_text_field_value(event.title)+'" spellcheck="false"/>' );
		html += get_form_table_caption( "Enter a title for the event, which will be displayed on the main schedule." );
		html += get_form_table_spacer();
		
		// event enabled
		html += get_form_table_row( 'Schedule', '<input type="checkbox" id="fe_ee_enabled" value="1" ' + (event.enabled ? 'checked="checked"' : '') + '/><label for="fe_ee_enabled">Event Enabled</label>' );
		html += get_form_table_caption( "Select whether the event should be enabled or disabled in the schedule." );
		html += get_form_table_spacer();
		
		// category
		app.categories.sort( function(a, b) {
			// return (b.title < a.title) ? 1 : -1;
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		
		html += get_form_table_row( 'Category', 
			'<table cellspacing="0" cellpadding="0"><tr>' + 
				'<td><select id="fe_ee_cat" onMouseDown="this.options[0].disabled=true"><option value="">Select Category</option>' + render_menu_options(app.categories, event.category, false) + '</select></td>' + 
				(app.isAdmin() ? '<td><span class="link addme" style="padding-left:5px; font-size:13px;" title="Add New Category" onMouseUp="$P().show_quick_add_cat_dialog()">&laquo; Add New...</span></td>' : '') + 
			'</tr></table>' 
		);
		html += get_form_table_caption( "Select a category for the event (this may limit the max concurrent jobs, etc.)" );
		html += get_form_table_spacer();
		
		// target (server group or individual server)
		html += get_form_table_row( 'Target', 
			'<select id="fe_ee_target" onChange="$P().set_event_target(this.options[this.selectedIndex].value)">' + this.render_target_menu_options( event.target ) + '</select>'
		);
		
		/*html += get_form_table_row( 'Target', 
			'<table cellspacing="0" cellpadding="0"><tr>' + 
				'<td><select id="fe_ee_target">' + this.render_target_menu_options( event.target ) + '</select></td>' + 
				'<td style="padding-left:15px;"><input type="checkbox" id="fe_ee_multiplex" value="1" ' + (event.multiplex ? 'checked="checked"' : '') + ' onChange="$P().setGroupVisible(\'mp\',this.checked).setGroupVisible(\'algo\',!this.checked)"/><label for="fe_ee_multiplex">Multiplex</label></td>' + 
			'</tr></table>' 
		);*/
		html += get_form_table_caption( 
			"Select a target server group or individual server to run the event on."
			// "Multiplex means that the event will run on <b>all</b> matched servers simultaneously." 
		);
		html += get_form_table_spacer();
		
		// algo selection
		var algo_classes = 'algogroup';
		var target_group = !event.target || find_object( app.server_groups, { id: event.target } );
		if (!target_group) algo_classes += ' collapse';
		
		var algo_items = [['random',"Random"],['round_robin',"Round Robin"],['least_cpu',"Least CPU Usage"],['least_mem',"Least Memory Usage"],['prefer_first',"Prefer First (Alphabetically)"],['prefer_last',"Prefer Last (Alphabetically)"],['multiplex',"Multiplex"]];
		
		html += get_form_table_row( algo_classes, 'Algorithm', '<select id="fe_ee_algo" onChange="$P().set_algo(this.options[this.selectedIndex].value)">' + render_menu_options(algo_items, event.algo, false) + '</select>' );
		
		html += get_form_table_caption( algo_classes, 
			"Select the desired algorithm for choosing a server from the target group.<br/>" + 
			"'Multiplex' means that the event will run on <b>all</b> group servers simultaneously." 
		);
		html += get_form_table_spacer( algo_classes, '' );
		
		// multiplex stagger
		var mp_classes = 'mpgroup';
		if (!event.multiplex || !target_group) mp_classes += ' collapse';
		
		var stagger_units = 60;
		var stagger = parseInt( event.stagger || 0 );
		if ((stagger >= 3600) && (stagger % 3600 == 0)) {
			// hours
			stagger_units = 3600;
			stagger = stagger / 3600;
		}
		else if ((stagger >= 60) && (stagger % 60 == 0)) {
			// minutes
			stagger_units = 60;
			stagger = Math.floor( stagger / 60 );
		}
		else {
			// seconds
			stagger_units = 1;
		}
		
		// stagger
		html += get_form_table_row( mp_classes, 'Stagger', 
			'<table cellspacing="0" cellpadding="0"><tr>' + 
				'<td><input type="text" id="fe_ee_stagger" style="font-size:14px; width:40px;" value="'+stagger+'"/></td>' + 
				'<td><select id="fe_ee_stagger_units" style="font-size:12px">' + render_menu_options([[1,'Seconds'], [60,'Minutes'], [3600,'Hours']], stagger_units) + '</select></td>' + 
			'</tr></table>' 
		);
		html += get_form_table_caption( mp_classes, 
			"For multiplexed events, optionally stagger the jobs across the servers.<br/>" + 
			"Each server will delay its launch by a multiple of the specified time." 
		);
		html += get_form_table_spacer( mp_classes, '' );
		
		// plugin
		app.plugins.sort( function(a, b) {
			// return (b.title < a.title) ? 1 : -1;
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		
		html += get_form_table_row( 'Plugin', '<select id="fe_ee_plugin" onMouseDown="this.options[0].disabled=true" onChange="$P().change_edit_plugin()"><option value="">Select Plugin</option>' + render_menu_options(app.plugins, event.plugin, false) + '</select>' );
		
		// plugin params
		html += get_form_table_row( '', '<div id="d_ee_plugin_params">' + this.get_plugin_params_html() + '</div>' );
		html += get_form_table_spacer();
		
		// timing
		var timing = event.timing;
		var tmode = '';
		if (!timing) tmode = 'demand';
		else if (timing.years && timing.years.length) tmode = 'custom';
		else if (timing.months && timing.months.length && timing.weekdays && timing.weekdays.length) tmode = 'custom';
		else if (timing.days && timing.days.length && timing.weekdays && timing.weekdays.length) tmode = 'custom';
		else if (timing.months && timing.months.length) tmode = 'yearly';
		else if (timing.weekdays && timing.weekdays.length) tmode = 'weekly';
		else if (timing.days && timing.days.length) tmode = 'monthly';
		else if (timing.hours && timing.hours.length) tmode = 'daily';
		else if (timing.minutes && timing.minutes.length) tmode = 'hourly';
		else if (!num_keys(timing)) tmode = 'hourly';
		
		var timing_items = [
			['demand', 'On Demand'],
			['custom', 'Custom'],
			['yearly', 'Yearly'],
			['monthly', 'Monthly'],
			['weekly', 'Weekly'],
			['daily', 'Daily'],
			['hourly', 'Hourly']
		];
		
		html += get_form_table_row( 'Timing', 
			'<div class="right">' + 
				'<table cellspacing="0" cellpadding="0"><tr>' + 
					'<td><span class="label" style="font-size:12px;">Timezone:&nbsp;</span></td>' + 
					'<td><select id="fe_ee_timezone" style="max-width:150px; font-size:12px;" onChange="$P().change_timezone()">' + render_menu_options(app.zones, event.timezone || app.tz, false) + '</select></td>' + 
				'</tr></table>' + 
			'</div>' + 
			
			'<table cellspacing="0" cellpadding="0"><tr>' + 
				'<td><select id="fe_ee_timing" onChange="$P().change_edit_timing()">' + render_menu_options(timing_items, tmode, false) + '</select></td>' + 
				'<td><span class="link addme" style="padding-left:5px; font-size:13px;" title="Import from Crontab" onMouseUp="$P().show_crontab_import_dialog()">&laquo; Import...</span></td>' + 
			'</tr></table>' + 
			
			'<div class="clear"></div>'
		);
		
		// timing params
		this.show_all_minutes = false;
		
		html += get_form_table_row( '', '<div id="d_ee_timing_params">' + this.get_timing_params_html(tmode) + '</div>' );
		html += get_form_table_spacer();
		
		// max children
		html += get_form_table_row( 'Concurrency', '<select id="fe_ee_max_children">' + render_menu_options([[1,"1 (Singleton)"], 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], event.max_children, false) + '</select>' );
		html += get_form_table_caption( "Select the maximum number of jobs that can run simultaneously." );
		html += get_form_table_spacer();
		
		// timeout
		html += get_form_table_row( 'Timeout', this.get_relative_time_combo_box('fe_ee_timeout', event.timeout) );
		html += get_form_table_caption( "Enter the maximum time allowed for jobs to complete, 0 to disable." );
		html += get_form_table_spacer();
		
		// retries
		html += get_form_table_row( 'Retries', 
			'<table cellspacing="0" cellpadding="0"><tr>' + 
				'<td><select id="fe_ee_retries" onChange="$P().change_retry_amount()">' + render_menu_options([[0,'None'], 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], event.retries, false) + '</select></td>' + 
				'<td id="td_ee_retry1" '+(event.retries ? '' : 'style="display:none"')+'><span style="padding-left:15px; font-size:13px; color:#777;"><b>Delay:</b>&nbsp;</span></td>' + 
				'<td id="td_ee_retry2" '+(event.retries ? '' : 'style="display:none"')+'>' + this.get_relative_time_combo_box('fe_ee_retry_delay', event.retry_delay, '', true) + '</td>' + 
			'</tr></table>'
		);
		html += get_form_table_caption( "Select the number of retries to be attempted before an error is reported." );
		html += get_form_table_spacer();
		
		// catch-up mode (run all)
		// method (interruptable, non-interruptable)
		html += get_form_table_row( 'Misc. Options', 
			'<div><input type="checkbox" id="fe_ee_catch_up" value="1" '+(event.catch_up ? 'checked="checked"' : '') + ' ' + (event.id ? 'onChange="$P().setGroupVisible(\'rc\',this.checked)"' : '') + ' /><label for="fe_ee_catch_up">Catch-Up (Run All)</label></div>' + 
			'<div class="caption">Automatically run all missed events after server downtime or scheduler/event disabled.</div>' + 
			
			'<div style="margin-top:10px"><input type="checkbox" id="fe_ee_detached" value="1" '+(event.detached ? 'checked="checked"' : '')+'/><label for="fe_ee_detached">Detached (Uninterruptible)</label></div>' + 
			'<div class="caption">Run event as a detached background process that is never interrupted.</div>' + 
			
			'<div style="margin-top:10px"><input type="checkbox" id="fe_ee_queue" value="1" '+(event.queue ? 'checked="checked"' : '')+' onChange="$P().setGroupVisible(\'eq\',this.checked)"/><label for="fe_ee_queue">Allow Queued Jobs</label></div>' + 
			'<div class="caption">Jobs will be queued that cannot run immediately.</div>'
		);
		html += get_form_table_spacer();
		
		// reset cursor (only for catch_up and edit mode)
		var rc_epoch = normalize_time( time_now(), { sec: 0 } );
		if (event.id && app.state && app.state.cursors && app.state.cursors[event.id]) {
			rc_epoch = app.state.cursors[event.id];
		}
		
		var rc_classes = 'rcgroup';
		if (!event.catch_up || !event.id) rc_classes += ' collapse';
		
		html += get_form_table_row( rc_classes, 'Time Machine', 
			'<table cellspacing="0" cellpadding="0"><tr>' + 
				'<td><input type="checkbox" id="fe_ee_rc_enabled" value="1" onChange="$P().toggle_rc_textfield(this.checked)"/></td><td><label for="fe_ee_rc_enabled">Set Event Clock:</label>&nbsp;</td>' + 
				'<td><input type="text" id="fe_ee_rc_time" style="font-size:13px; width:180px;" disabled="disabled" value="'+$P().rc_get_short_date_time( rc_epoch )+'" onFocus="this.blur()" onMouseUp="$P().rc_click()"/></td>' + 
				'<td><span id="s_ee_rc_reset" class="link addme" style="opacity:0" onMouseUp="$P().reset_rc_time_now()">&laquo; Reset</span></td>' + 
			'</tr></table>' 
		);
		html += get_form_table_caption( rc_classes, 
			"Optionally reset the internal clock for this event, to repeat past jobs, or jump over a queue."
		);
		html += get_form_table_spacer( rc_classes, '' );
		
		// event queue max
		var eq_classes = 'eqgroup';
		if (!event.queue) eq_classes += ' collapse';
		
		html += get_form_table_row( eq_classes, 'Queue Limit', 
			'<input type="text" id="fe_ee_queue_max" size="8" value="'+escape_text_field_value(event.queue_max || 0)+'" spellcheck="false"/>'
		);
		html += get_form_table_caption( eq_classes, 
			"Set the maximum number of jobs that can be queued up for this event (or '0' for no limit)."
		);
		html += get_form_table_spacer( eq_classes, '' );
		
		// chain reaction
		var sorted_events = app.schedule.sort( function(a, b) {
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		
		var chain_expanded = !!(event.chain || event.chain_error);
		html += get_form_table_row( 'Chain Reaction', 
			'<div style="font-size:13px;'+(chain_expanded ? 'display:none;' : '')+'"><span class="link addme" onMouseUp="$P().expand_fieldset($(this))"><i class="fa fa-plus-square-o">&nbsp;</i>Chain Options</span></div>' + 
			'<fieldset style="padding:10px 10px 0 10px; margin-bottom:5px;'+(chain_expanded ? '' : 'display:none;')+'"><legend class="link addme" onMouseUp="$P().collapse_fieldset($(this))"><i class="fa fa-minus-square-o">&nbsp;</i>Chain Options</legend>' + 
				'<div class="plugin_params_label">Run Event on Success:</div>' + 
				'<div class="plugin_params_content"><select id="fe_ee_chain" style="margin-left:10px; font-size:12px;"><option value="">(None)</option>' + render_menu_options( sorted_events, event.chain, false ) + '</select></div>' + 
				
				'<div class="plugin_params_label">Run Event on Failure:</div>' + 
				'<div class="plugin_params_content"><select id="fe_ee_chain_error" style="margin-left:10px; font-size:12px;"><option value="">(None)</option>' + render_menu_options( sorted_events, event.chain_error, false ) + '</select></div>' + 
				
			'</fieldset>'
		);
		html += get_form_table_caption( "Select events to run automatically after this event completes." );
		html += get_form_table_spacer();
		
		// notification
		var notif_expanded = !!(event.notify_success || event.notify_fail || event.web_hook);
		html += get_form_table_row( 'Notification', 
			'<div style="font-size:13px;'+(notif_expanded ? 'display:none;' : '')+'"><span class="link addme" onMouseUp="$P().expand_fieldset($(this))"><i class="fa fa-plus-square-o">&nbsp;</i>Notification Options</span></div>' + 
			'<fieldset style="padding:10px 10px 0 10px; margin-bottom:5px;'+(notif_expanded ? '' : 'display:none;')+'"><legend class="link addme" onMouseUp="$P().collapse_fieldset($(this))"><i class="fa fa-minus-square-o">&nbsp;</i>Notification Options</legend>' + 
				'<div class="plugin_params_label">Email on Success:</div>' + 
				'<div class="plugin_params_content"><input type="text" id="fe_ee_notify_success" size="50" value="'+escape_text_field_value(event.notify_success)+'" placeholder="email@sample.com" spellcheck="false" onChange="$P().update_add_remove_me($(this))"/><span class="link addme" onMouseUp="$P().add_remove_me($(this).prev())"></span></div>' + 
				
				'<div class="plugin_params_label">Email on Failure:</div>' + 
				'<div class="plugin_params_content"><input type="text" id="fe_ee_notify_fail" size="50" value="'+escape_text_field_value(event.notify_fail)+'" placeholder="email@sample.com" spellcheck="false" onChange="$P().update_add_remove_me($(this))"/><span class="link addme" onMouseUp="$P().add_remove_me($(this).prev())"></span></div>' + 
				
				'<div class="plugin_params_label">Web Hook URL:</div>' + 
				'<div class="plugin_params_content"><input type="text" id="fe_ee_web_hook" size="60" value="'+escape_text_field_value(event.web_hook)+'" placeholder="http://" spellcheck="false"/></div>' + 
			'</fieldset>'
		);
		html += get_form_table_caption( "Enter one or more e-mail addresses for notification (comma-separated), and optionally a web hook URL." );
		html += get_form_table_spacer();
		
		// resource limits
		var res_expanded = !!(event.memory_limit || event.memory_sustain || event.cpu_limit || event.cpu_sustain || event.log_max_size);
		html += get_form_table_row( 'Limits', 
			'<div style="font-size:13px;'+(res_expanded ? 'display:none;' : '')+'"><span class="link addme" onMouseUp="$P().expand_fieldset($(this))"><i class="fa fa-plus-square-o">&nbsp;</i>Resource Limits</span></div>' + 
			'<fieldset style="padding:10px 10px 0 10px; margin-bottom:5px;'+(res_expanded ? '' : 'display:none;')+'"><legend class="link addme" onMouseUp="$P().collapse_fieldset($(this))"><i class="fa fa-minus-square-o">&nbsp;</i>Resource Limits</legend>' + 
				
				'<div class="plugin_params_label">CPU Limit:</div>' + 
				'<div class="plugin_params_content"><table cellspacing="0" cellpadding="0" class="fieldset_params_table"><tr>' + 
					'<td style="padding-right:2px"><input type="checkbox" id="fe_ee_cpu_enabled" value="1" '+(event.cpu_limit ? 'checked="checked"' : '')+' /></td>' + 
					'<td><label for="fe_ee_cpu_enabled">Abort job if CPU exceeds</label></td>' + 
					'<td><input type="text" id="fe_ee_cpu_limit" style="width:30px;" value="'+(event.cpu_limit || 0)+'"/>%</td>' + 
					'<td>for</td>' + 
					'<td>' + this.get_relative_time_combo_box( 'fe_ee_cpu_sustain', event.cpu_sustain, 'fieldset_params_table' ) + '</td>' + 
				'</tr></table></div>' + 
				
				'<div class="plugin_params_label">Memory Limit:</div>' + 
				'<div class="plugin_params_content"><table cellspacing="0" cellpadding="0" class="fieldset_params_table"><tr>' + 
					'<td style="padding-right:2px"><input type="checkbox" id="fe_ee_memory_enabled" value="1" '+(event.memory_limit ? 'checked="checked"' : '')+' /></td>' + 
					'<td><label for="fe_ee_memory_enabled">Abort job if memory exceeds</label></td>' + 
					'<td>' + this.get_relative_size_combo_box( 'fe_ee_memory_limit', event.memory_limit, 'fieldset_params_table' ) + '</td>' + 
					'<td>for</td>' + 
					'<td>' + this.get_relative_time_combo_box( 'fe_ee_memory_sustain', event.memory_sustain, 'fieldset_params_table' ) + '</td>' + 
				'</tr></table></div>' + 
				
				'<div class="plugin_params_label">Log Size Limit:</div>' + 
				'<div class="plugin_params_content"><table cellspacing="0" cellpadding="0" class="fieldset_params_table"><tr>' + 
					'<td style="padding-right:2px"><input type="checkbox" id="fe_ee_log_enabled" value="1" '+(event.log_max_size ? 'checked="checked"' : '')+' /></td>' + 
					'<td><label for="fe_ee_log_enabled">Abort job if log file exceeds</label></td>' + 
					'<td>' + this.get_relative_size_combo_box( 'fe_ee_log_limit', event.log_max_size, 'fieldset_params_table' ) + '</td>' + 
				'</tr></table></div>' + 
				
			'</fieldset>'
		);
		html += get_form_table_caption( 
			"Optionally set CPU load, memory usage and log size limits for the event."
		);
		html += get_form_table_spacer();
		
		// notes
		html += get_form_table_row( 'Notes', '<textarea id="fe_ee_notes" style="width:600px; height:80px; resize:vertical;">'+escape_text_field_value(event.notes)+'</textarea>' );
		html += get_form_table_caption( "Optionally enter notes for the event, which will be included in all e-mail notifications." );
		html += get_form_table_spacer();
		
		setTimeout( function() {
			$P().update_add_remove_me( $('#fe_ee_notify_success, #fe_ee_notify_fail') );
		}, 1 );
		
		return html;
	},
	
	set_event_target: function(target) {
		// event target has changed (from menu selection)
		// hide / show sections as necessary
		var target_group = find_object( app.server_groups, { id: target } );
		var algo = $('#fe_ee_algo').val();
		
		this.setGroupVisible('algo', !!target_group);
		this.setGroupVisible('mp', !!target_group && (algo == 'multiplex'));
	},
	
	set_algo: function(algo) {
		// target server algo has changed
		// hide / show multiplex stagger as necessary
		this.setGroupVisible('mp', (algo == 'multiplex'));
	},
	
	change_retry_amount: function() {
		// user has selected a retry amount from the menu
		// adjust the visibility of the retry delay controls accordingly
		var retries = parseInt( $('#fe_ee_retries').val() );
		if (retries) {
			if (!$('#td_ee_retry1').hasClass('yup')) {
				$('#td_ee_retry1, #td_ee_retry2').css({ display:'table-cell', opacity:0 }).fadeTo( 250, 1.0, function() {
					$(this).addClass('yup');
				} );
			}
		}
		else {
			$('#td_ee_retry1, #td_ee_retry2').fadeTo( 250, 0.0, function() {
				$(this).css({ display:'none', opacity:0 }).removeClass('yup');
			} );
		}
	},
	
	show_crontab_import_dialog: function() {
		// allow user to paste in crontab syntax to set timing
		var self = this;
		var html = '';
		
		html += '<div style="font-size:12px; color:#777; margin-bottom:20px;">Use this to import event timing settings from a <a href="https://en.wikipedia.org/wiki/Cron#CRON_expression" target="_blank">Crontab expression</a>.  This is a string comprising five (or six) fields separated by white space that represents a set of dates/times.  Example: <b>30 4 1 * *</b> (First day of every month at 4:30 AM)</div>';
		
		html += '<center><table>' + 
			// get_form_table_spacer() + 
			get_form_table_row('Crontab:', '<input type="text" id="fe_ee_crontab" style="width:330px;" value="" spellcheck="false"/>') + 
			get_form_table_caption("Enter your crontab date/time expression here.") + 
		'</table></center>';
		
		app.confirm( '<i class="fa fa-clock-o">&nbsp;</i>Import from Crontab', html, "Import", function(result) {
			app.clearError();
			
			if (result) {
				var cron_exp = $('#fe_ee_crontab').val().toLowerCase();
				if (!cron_exp) return app.badField('fe_ee_crontab', "Please enter a crontab date/time expression.");
				
				// validate, convert to timing object
				var timing = null;
				try {
					timing = parse_crontab( cron_exp, $('#fe_ee_title').val() );
				}
				catch (e) {
					return app.badField('fe_ee_crontab', e.toString());
				}
				
				// hide dialog
				Dialog.hide();
				
				// replace event timing object
				self.event.timing = timing;
				
				// redraw display
				var tmode = '';
				if (timing.years && timing.years.length) tmode = 'custom';
				else if (timing.months && timing.months.length && timing.weekdays && timing.weekdays.length) tmode = 'custom';
				else if (timing.days && timing.days.length && timing.weekdays && timing.weekdays.length) tmode = 'custom';
				else if (timing.months && timing.months.length) tmode = 'yearly';
				else if (timing.weekdays && timing.weekdays.length) tmode = 'weekly';
				else if (timing.days && timing.days.length) tmode = 'monthly';
				else if (timing.hours && timing.hours.length) tmode = 'daily';
				else if (timing.minutes && timing.minutes.length) tmode = 'hourly';
				else if (!num_keys(timing)) tmode = 'hourly';
				
				$('#fe_ee_timing').val( tmode );
				$('#d_ee_timing_params').html( self.get_timing_params_html(tmode) );
				
				// and we're done
				app.showMessage('success', "Crontab date/time expression was imported successfully.");
				
			} // user clicked add
		} ); // app.confirm
		
		setTimeout( function() { 
			$('#fe_ee_crontab').focus();
		}, 1 );
	},
	
	show_quick_add_cat_dialog: function() {
		// allow user to quickly add a category
		var self = this;
		var html = '';
		
		html += '<div style="font-size:12px; color:#777; margin-bottom:20px;">Use this to quickly add a new category.  Note that you should visit the Admin Categories page later so you can set additional options, add a descripton, etc.</div>';
		
		html += '<center><table>' + 
			// get_form_table_spacer() + 
			get_form_table_row('Category Title:', '<input type="text" id="fe_ee_cat_title" style="width:315px" value=""/>') + 
			get_form_table_caption("Enter a title for your category here.") + 
		'</table></center>';
		
		app.confirm( '<i class="fa fa-folder-open-o">&nbsp;</i>Quick Add Category', html, "Add", function(result) {
			app.clearError();
			
			if (result) {
				var cat_title = $('#fe_ee_cat_title').val();
				if (!cat_title) return app.badField('fe_ee_cat_title', "Please enter a title for the category.");
				Dialog.hide();
				
				var category = {};
				category.title = cat_title;
				category.description = '';
				category.max_children = 0;
				category.notify_success = '';
				category.notify_fail = '';
				category.web_hook = '';
				category.enabled = 1;
				
				app.showProgress( 1.0, "Adding category..." );
				app.api.post( 'app/create_category', category, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Category was added successfully.");
					
					// set event to new category
					category.id = resp.id;
					self.event.category = category.id;
					
					// due to race conditions with websocket, app.categories may or may not have our new cat at this point
					// so add it manually if needed
					if (!find_object(app.categories, { id: category.id })) {
						app.categories.push( category );
					}
					
					// resort cats for menu rebuild
					app.categories.sort( function(a, b) {
						// return (b.title < a.title) ? 1 : -1;
						return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
					} );
					
					// rebuild menu and select new cat
					$('#fe_ee_cat').html( 
						'<option value="" disabled="disabled">Select Category</option>' + 
						render_menu_options(app.categories, self.event.category, false) 
					);
				} ); // api.post
				
			} // user clicked add
		} ); // app.confirm
		
		setTimeout( function() { 
			$('#fe_ee_cat_title').focus();
		}, 1 );
	},
	
	rc_parse_date: function(str) {
		// parse date using moment.tz and event tz, return epoch
		var tz = this.event.timezone || app.tz;
		return moment.tz( new Date(str), tz).unix();
	},
	
	rc_get_short_date_time: function(epoch) {
		// get short date/time with tz abbrev using moment
		var tz = this.event.timezone || app.tz;
		// return moment.tz( epoch * 1000, tz).format("MMM D, YYYY h:mm A z");
		return moment.tz( epoch * 1000, tz).format("lll z");
	},
	
	rc_click: function() {
		// click in 'reset cursor' text field, popup edit dialog
		var self = this;
		$('#fe_ee_rc_time').blur();
		
		if ($('#fe_ee_rc_enabled').is(':checked')) {
			var epoch = (new Date( $('#fe_ee_rc_time').val() ).getTime()) / 1000;
			
			this.choose_date_time({
				when: epoch,
				title: "Set Event Clock",
				timezone: this.event.timezone || app.tz,
				
				callback: function(rc_epoch) {
					$('#fe_ee_rc_time').val( self.rc_get_short_date_time( rc_epoch ) );
					$('#fe_ee_rc_time').blur();
				}
			});
		}
	},
	
	reset_rc_time_now: function() {
		// reset cursor value to now, from click
		var rc_epoch = normalize_time( time_now(), { sec: 0 } );
		$('#fe_ee_rc_time').val( this.rc_get_short_date_time( rc_epoch ) );
	},
	
	update_rc_value: function() {
		// received state update from server, event cursor may have changed
		// only update field if in edit mode, catch_up, and field is disabled
		var event = this.event;
		
		if (event.id && $('#fe_ee_catch_up').is(':checked') && !$('#fe_ee_rc_enabled').is(':checked') && app.state && app.state.cursors && app.state.cursors[event.id]) {
			$('#fe_ee_rc_time').val( this.rc_get_short_date_time( app.state.cursors[event.id] ) );
		}
	},
	
	toggle_rc_textfield: function(state) {
		// set 'disabled' attribute of 'reset cursor' text field, based on checkbox
		var event = this.event;
		
		if (state) {
			$('#fe_ee_rc_time').removeAttr('disabled').css('cursor', 'pointer');
			$('#s_ee_rc_reset').fadeTo( 250, 1.0 );
		}
		else {
			$('#fe_ee_rc_time').attr('disabled', 'disabled').css('cursor', 'default');
			$('#s_ee_rc_reset').fadeTo( 250, 0.0 );
			
			// reset value just in case it changed while field was enabled
			if (event.id && app.state && app.state.cursors && app.state.cursors[event.id]) {
				$('#fe_ee_rc_time').val( this.rc_get_short_date_time( app.state.cursors[event.id] ) );
			}
		}
	},
	
	change_timezone: function() {
		// change timezone setting
		var event = this.event;
		
		// update 'reset cursor' text field to reflect new timezone
		var new_cursor = this.rc_parse_date( $('#fe_ee_rc_time').val() );
		if (!new_cursor || isNaN(new_cursor)) {
			new_cursor = app.state.cursors[event.id] || normalize_time( time_now(), { sec: 0 } );
		}
		new_cursor = normalize_time( new_cursor, { sec: 0 } );
		
		// update timezone
		event.timezone = $('#fe_ee_timezone').val();
		this.change_edit_timing_param();
		
		// render out new RC date/time
		$('#fe_ee_rc_time').val( this.rc_get_short_date_time( new_cursor ) );
	},
	
	change_edit_timing: function() {
		// change edit timing mode
		var event = this.event;
		var timing = event.timing;
		var tmode = $('#fe_ee_timing').val();
		var dargs = get_date_args( time_now() );
		
		// clean up timing object, add sane defaults for the new tmode
		switch (tmode) {
			case 'demand':
				timing = false;
				event.timing = false;
			break;
			
			case 'custom':
				if (!timing) timing = event.timing = {};
			break;
			
			case 'yearly':
				if (!timing) timing = event.timing = {};
				delete timing.years;
				if (!timing.months) timing.months = [];
				if (!timing.months.length) timing.months.push( dargs.mon );
				
				if (!timing.days) timing.days = [];
				if (!timing.days.length) timing.days.push( dargs.mday );
				
				if (!timing.hours) timing.hours = [];
				if (!timing.hours.length) timing.hours.push( dargs.hour );
			break;
			
			case 'weekly':
				if (!timing) timing = event.timing = {};
				delete timing.years;
				delete timing.months;
				delete timing.days;
				if (!timing.weekdays) timing.weekdays = [];
				if (!timing.weekdays.length) timing.weekdays.push( dargs.wday );
				
				if (!timing.hours) timing.hours = [];
				if (!timing.hours.length) timing.hours.push( dargs.hour );
			break;
			
			case 'monthly':
				if (!timing) timing = event.timing = {};
				delete timing.years;
				delete timing.months;
				delete timing.weekdays;
				if (!timing.days) timing.days = [];
				if (!timing.days.length) timing.days.push( dargs.mday );
				
				if (!timing.hours) timing.hours = [];
				if (!timing.hours.length) timing.hours.push( dargs.hour );
			break;
			
			case 'daily':
				if (!timing) timing = event.timing = {};
				delete timing.years;
				delete timing.months;
				delete timing.weekdays;
				delete timing.days;
				if (!timing.hours) timing.hours = [];
				if (!timing.hours.length) timing.hours.push( dargs.hour );
			break;
			
			case 'hourly':
				if (!timing) timing = event.timing = {};
				delete timing.years;
				delete timing.months;
				delete timing.weekdays;
				delete timing.days;
				delete timing.hours;
			break;
		}
		
		if (timing) {
			if (!timing.minutes) timing.minutes = [];
			if (!timing.minutes.length) timing.minutes.push( 0 );
		}
		
		$('#d_ee_timing_params').html( this.get_timing_params_html(tmode) );
	},
	
	get_timing_params_html: function(tmode) {
		// get timing param editor html
		var html = '';
		var event = this.event;
		var timing = event.timing;
		
		html += '<div style="font-size:13px; margin-top:7px; display:none;"><span class="link addme" onMouseUp="$P().expand_fieldset($(this))"><i class="fa fa-plus-square-o">&nbsp;</i>Timing Details</span></div>';
		html += '<fieldset style="margin-top:7px; padding:10px 10px 0 10px; max-width:600px;"><legend class="link addme" onMouseUp="$P().collapse_fieldset($(this))"><i class="fa fa-minus-square-o">&nbsp;</i>Timing Details</legend>';
		
		// html += '<fieldset style="margin-top:7px; padding:10px 10px 0 10px; max-width:600px;"><legend>Timing Details</legend>';
		
		// only show years in custom mode
		if (tmode == 'custom') {
			html += '<div class="timing_details_label">Years</div>';
			var year = (new Date()).getFullYear();
			html += '<div class="timing_details_content">' + this.get_timing_checkbox_set( 'year', [year, year+1, year+2, year+3, year+4, year+5, year+6, year+7, year+8, year+9, year+10], timing.years || [], true ) + '</div>';
		} // years
		
		if (tmode.match(/(custom|yearly)/)) {
			// show months
			html += '<div class="timing_details_label">Months</div>';
			html += '<div class="timing_details_content">' + this.get_timing_checkbox_set( 'month', _months, timing.months || [] ) + '</div>';
		} // months
		
		if (tmode.match(/(custom|weekly)/)) {
			// show weekdays
			var wday_items = [ [0,'Sunday'], [1,'Monday'], [2,'Tuesday'], [3,'Wednesday'], 
				[4,'Thursday'], [5,'Friday'], [6,'Saturday'] ];
			
			html += '<div class="timing_details_label">Weekdays</div>';
			html += '<div class="timing_details_content">' + this.get_timing_checkbox_set( 'weekday', wday_items, timing.weekdays || [] ) + '</div>';
		} // weekdays
		
		if (tmode.match(/(custom|yearly|monthly)/)) {
			// show days of month
			var mday_items = [];
			for (var idx = 1; idx < 32; idx++) {
				var num_str = '' + idx;
				var num_label = num_str + _number_suffixes[ parseInt( num_str.substring(num_str.length - 1) ) ];
				mday_items.push([ idx, num_label ]);
			}
			
			html += '<div class="timing_details_label">Days of the Month</div>';
			html += '<div class="timing_details_content">' + this.get_timing_checkbox_set( 'day', mday_items, timing.days || [] ) + '</div>';
		} // days
		
		if (tmode.match(/(custom|yearly|monthly|weekly|daily)/)) {
			// show hours
			var hour_items = [];
			for (var idx = 0; idx < 24; idx++) {
				hour_items.push([ idx, _hour_names[idx].toUpperCase() ]);
			}
			
			html += '<div class="timing_details_label">Hours</div>';
			html += '<div class="timing_details_content">' + this.get_timing_checkbox_set( 'hour', hour_items, timing.hours || [] ) + '</div>';
		} // hours
		
		// always show minutes (if timing is enabled)
		if (timing) {
			var min_items = [];
			for (var idx = 0; idx < 60; idx += this.show_all_minutes ? 1 : 5) {
				var num_str = ':' + ((idx < 10) ? '0' : '') + idx;
				min_items.push([ idx, num_str, (idx % 5 == 0) ? '' : 'plain' ]);
			} // minutes
			
			html += '<div class="timing_details_label">Minutes';
			html += ' <span class="link" style="font-weight:normal; font-size:11px" onMouseUp="$P().toggle_show_all_minutes()">(' + (this.show_all_minutes ? 'Show Less' : 'Show All') + ')</span>';
			html += '</div>';
			
			html += '<div class="timing_details_content">';
				html += this.get_timing_checkbox_set( 'minute', min_items, timing.minutes || [], function(idx) {
					var num_str = ':' + ((idx < 10) ? '0' : '') + idx;
					return([ idx, num_str, (idx % 5 == 0) ? '' : 'plain' ]);
				} );
			html += '</div>';
		}
		
		// summary
		html += '<div class="info_label">The event will run:</div>';
		html += '<div class="info_value" id="d_ee_timing_summary">' + summarize_event_timing(timing, event.timezone).replace(/(every\s+minute)/i, '<span style="color:red">$1</span>') + '</div>';
		
		html += '</fieldset>';
		html += '<div class="caption" style="margin-top:6px;">Choose when and how often the event should run.</div>';
		
		setTimeout( function() {
			$('.ccbox_timing').mouseup( function() {
				// need another delay for event listener race condition
				// we want this to happen LAST, after the CSS classes are updated
				setTimeout( function() {
					$P().change_edit_timing_param();
				}, 1 );
			} );
		}, 1 );
		
		return html;
	},
	
	toggle_show_all_minutes: function() {
		// toggle showing every minutes from 0 - 59, to just the 5s
		this.show_all_minutes = !this.show_all_minutes;
		var tmode = $('#fe_ee_timing').val();
		$('#d_ee_timing_params').html( this.get_timing_params_html(tmode) );
	},
	
	change_edit_timing_param: function() {
		// edit timing param has changed, refresh entire timing block
		// rebuild entire event.timing object from scratch
		var event = this.event;
		event.timing = {};
		var timing = event.timing;
		
		// if tmode is demand, wipe timing object
		if ($('#fe_ee_timing').val() == 'demand') {
			event.timing = false;
			timing = false;
		}
		
		$('.ccbox_timing_year.checked').each( function() {
			if (this.id.match(/_(\d+)$/)) {
				var year = parseInt( RegExp.$1 );
				if (!timing.years) timing.years = [];
				timing.years.push( year );
			}
		} );
		
		$('.ccbox_timing_month.checked').each( function() {
			if (this.id.match(/_(\d+)$/)) {
				var month = parseInt( RegExp.$1 );
				if (!timing.months) timing.months = [];
				timing.months.push( month );
			}
		} );
		
		$('.ccbox_timing_weekday.checked').each( function() {
			if (this.id.match(/_(\d+)$/)) {
				var weekday = parseInt( RegExp.$1 );
				if (!timing.weekdays) timing.weekdays = [];
				timing.weekdays.push( weekday );
			}
		} );
		
		$('.ccbox_timing_day.checked').each( function() {
			if (this.id.match(/_(\d+)$/)) {
				var day = parseInt( RegExp.$1 );
				if (!timing.days) timing.days = [];
				timing.days.push( day );
			}
		} );
		
		$('.ccbox_timing_hour.checked').each( function() {
			if (this.id.match(/_(\d+)$/)) {
				var hour = parseInt( RegExp.$1 );
				if (!timing.hours) timing.hours = [];
				timing.hours.push( hour );
			}
		} );
		
		$('.ccbox_timing_minute.checked').each( function() {
			if (this.id.match(/_(\d+)$/)) {
				var minute = parseInt( RegExp.$1 );
				if (!timing.minutes) timing.minutes = [];
				timing.minutes.push( minute );
			}
		} );
		
		// update summary
		$('#d_ee_timing_summary').html( summarize_event_timing(timing, event.timezone).replace(/(every\s+minute)/i, '<span style="color:red">$1</span>') );
	},
	
	get_timing_checkbox_set: function(name, items, values, auto_add) {
		// render html for set of color label checkboxes for timing category
		var html = '';
		
		// make sure all items are arrays
		for (var idx = 0, len = items.length; idx < len; idx++) {
			var item = items[idx];
			if (!isa_array(item)) items[idx] = [item, item];
		}
		
		// add unknown values to items array
		if (auto_add) {
			var is_callback = !!(typeof(auto_add) == 'function');
			var added = 0;
			for (var idx = 0, len = values.length; idx < len; idx++) {
				var value = values[idx];
				var found = false;
				for (var idy = 0, ley = items.length; idy < ley; idy++) {
					if (items[idy][0] == value) { found = true; idy = ley; }
				} // foreach item
				if (!found) {
					items.push( is_callback ? auto_add(value) : [value, value] ); 
					added++; 
				}
			} // foreach value
			
			// resort items
			if (added) {
				items = items.sort( function(a, b) {
					return a[0] - b[0];
				} );
			}
		} // auto_add
		
		for (var idx = 0, len = items.length; idx < len; idx++) {
			var item = items[idx];
			var checked = !!(values.indexOf(item[0]) > -1);
			var classes = [];
			if (checked) classes.push("checked");
			classes.push( "ccbox_timing" );
			classes.push( "ccbox_timing_" + name );
			if (item[2]) classes.push( item[2] );
			
			if (html) html += ' ';
			html += app.get_color_checkbox_html("ccbox_timing_" + name + '_' + item[0], item[1], classes.join(' '));
			// NOTE: the checkbox id isn't currently even used
			
			// if (break_every && (((idx + 1) % break_every) == 0)) html += '<br/>';
		} // foreach item
		
		return html;
	},
	
	change_edit_plugin: function() {
		// switch plugins, set default params, refresh param editor
		var event = this.event;
		var plugin_id = $('#fe_ee_plugin').val();
		event.plugin = plugin_id;
		event.params = {};
		
		if (plugin_id) {
			var plugin = find_object( app.plugins, { id: plugin_id } );
			if (plugin && plugin.params && plugin.params.length) {
				for (var idx = 0, len = plugin.params.length; idx < len; idx++) {
					var param = plugin.params[idx];
					event.params[ param.id ] = param.value;
				}
			}
		}
		
		this.refresh_plugin_params();
	},
	
	get_plugin_params_html: function() {
		// get plugin param editor html
		var html = '';
		var event = this.event;
		var params = event.params;
		
		if (event.plugin) {
			var plugin = find_object( app.plugins, { id: event.plugin } );
			if (plugin && plugin.params && plugin.params.length) {
				
				html += '<div style="font-size:13px; margin-top:7px; display:none;"><span class="link addme" onMouseUp="$P().expand_fieldset($(this))"><i class="fa fa-plus-square-o">&nbsp;</i>Plugin Parameters</span></div>';
				html += '<fieldset style="margin-top:7px; padding:10px 10px 0 10px;"><legend class="link addme" onMouseUp="$P().collapse_fieldset($(this))"><i class="fa fa-minus-square-o">&nbsp;</i>Plugin Parameters</legend>';
				
				// html += '<fieldset style="margin-top:7px; padding:10px 10px 0 10px;"><legend>Plugin Parameters</legend>';
				
				for (var idx = 0, len = plugin.params.length; idx < len; idx++) {
					var param = plugin.params[idx];
					var value = (param.id in params) ? params[ param.id ] : param.value;
					switch (param.type) {
						
						case 'text':
							html += '<div class="plugin_params_label">' + param.title + '</div>';
							html += '<div class="plugin_params_content"><input type="text" id="fe_ee_pp_'+param.id+'" size="'+param.size+'" value="'+escape_text_field_value(value)+'" spellcheck="false"/></div>';
						break;
						
						case 'textarea':
							var ta_height = parseInt(param.rows) * 15;
							html += '<div class="plugin_params_label">' + param.title + '</div>';
							html += '<div class="plugin_params_content"><textarea id="fe_ee_pp_'+param.id+'" style="width:99%; height:'+ta_height+'px; resize:vertical;" spellcheck="false" onkeydown="return catchTab(this,event)">'+escape_text_field_value(value)+'</textarea></div>';
						break;
						
						case 'checkbox':
							html += '<div class="plugin_params_content"><input type="checkbox" id="fe_ee_pp_'+param.id+'" value="1" ' + (value ? 'checked="checked"' : '') + '/><label for="fe_ee_pp_'+param.id+'">' + param.title + '</label></div>';
						break;
						
						case 'select':
							html += '<div class="plugin_params_label">' + param.title + '</div>';
							html += '<div class="plugin_params_content"><select id="fe_ee_pp_'+param.id+'">' + render_menu_options(param.items, value, true) + '</select></div>';
						break;
						
						case 'hidden':
							// no visible UI
						break;
						
					} // switch type
				} // foreach param
				
				html += '</fieldset>';
				html += '<div class="caption" style="margin-top:6px;">Select the plugin parameters for the event.</div>';
			} // plugin params
			else {
				html += '<div class="caption">The selected plugin has no editable parameters.</div>';
			}
		}
		else {
			html += '<div class="caption">Select a plugin to edit its parameters.</div>';
		}
		
		return html;
	},
	
	refresh_plugin_params: function() {
		// redraw plugin param area after change
		$('#d_ee_plugin_params').html( this.get_plugin_params_html() );
	},
	
	get_event_form_json: function(quiet) {
		// get event elements from form, used for new or edit
		var event = this.event;
		
		// event title
		event.title = trim( $('#fe_ee_title').val() );
		if (!event.title) return quiet ? false : app.badField('fe_ee_title', "Please enter a title for the event.");
		
		// event enabled
		event.enabled = $('#fe_ee_enabled').is(':checked') ? 1 : 0;
		
		// category
		event.category = $('#fe_ee_cat').val();
		if (!event.category) return quiet ? false : app.badField('fe_ee_cat', "Please select a Category for the event."); 
		
		// target (server group or individual server)
		event.target = $('#fe_ee_target').val();
		
		// algo / multiplex / stagger
		event.algo = $('#fe_ee_algo').val();
		event.multiplex = (event.algo == 'multiplex') ? 1 : 0;
		if (event.multiplex) {
			event.stagger = parseInt( $('#fe_ee_stagger').val() ) * parseInt( $('#fe_ee_stagger_units').val() );
			if (isNaN(event.stagger)) return quiet ? false : app.badField('fe_ee_stagger', "Please enter a number of seconds to stagger by.");
		}
		else {
			event.stagger = 0;
		}
		
		// plugin
		event.plugin = $('#fe_ee_plugin').val();
		if (!event.plugin) return quiet ? false : app.badField('fe_ee_plugin', "Please select a Plugin for the event."); 
		
		// plugin params
		event.params = {};
		var plugin = find_object( app.plugins, { id: event.plugin } );
		if (plugin && plugin.params && plugin.params.length) {
			for (var idx = 0, len = plugin.params.length; idx < len; idx++) {
				var param = plugin.params[idx];
				switch (param.type) {
					case 'text':
					case 'textarea':
					case 'select':
						event.params[ param.id ] = $('#fe_ee_pp_' + param.id).val();
					break;
					
					case 'hidden':
						// Special case: Always set this to the plugin default value
						event.params[ param.id ] = param.value;
					break;
					
					case 'checkbox':
						event.params[ param.id ] = $('#fe_ee_pp_' + param.id).is(':checked') ? 1 : 0;
					break;
				} // switch type
			} // foreach param
		} // plugin params
		
		// timezone
		event.timezone = $('#fe_ee_timezone').val();
		
		// max children
		event.max_children = parseInt( $('#fe_ee_max_children').val() );
		
		// timeout
		event.timeout = parseInt( $('#fe_ee_timeout').val() ) * parseInt( $('#fe_ee_timeout_units').val() );
		if (isNaN(event.timeout)) return quiet ? false : app.badField('fe_ee_timeout', "Please enter an integer value for the event timeout.");
		if (event.timeout < 0) return quiet ? false : app.badField('fe_ee_timeout', "Please enter a positive integer for the event timeout.");
		
		// retries
		event.retries = parseInt( $('#fe_ee_retries').val() );
		event.retry_delay = parseInt( $('#fe_ee_retry_delay').val() ) * parseInt( $('#fe_ee_retry_delay_units').val() );
		if (isNaN(event.retry_delay)) return quiet ? false : app.badField('fe_ee_retry_delay', "Please enter an integer value for the event retry delay.");
		if (event.retry_delay < 0) return quiet ? false : app.badField('fe_ee_retry_delay', "Please enter a positive integer for the event retry delay.");
		
		// catch-up mode (run all)
		event.catch_up = $('#fe_ee_catch_up').is(':checked') ? 1 : 0;

		// method (interruptable, non-interruptable)
		event.detached = $('#fe_ee_detached').is(':checked') ? 1 : 0;
		
		// event queue
		event.queue = $('#fe_ee_queue').is(':checked') ? 1 : 0;
		event.queue_max = parseInt( $('#fe_ee_queue_max').val() || "0" );
		if (isNaN(event.queue_max)) return quiet ? false : app.badField('fe_ee_queue_max', "Please enter an integer value for the event queue max.");
		if (event.queue_max < 0) return quiet ? false : app.badField('fe_ee_queue_max', "Please enter a positive integer for the event queue max.");
		
		// chain reaction
		event.chain = $('#fe_ee_chain').val();
		event.chain_error = $('#fe_ee_chain_error').val();
		
		// cursor reset
		if (event.id && event.catch_up && $('#fe_ee_rc_enabled').is(':checked')) {
			var new_cursor = this.rc_parse_date( $('#fe_ee_rc_time').val() );
			if (!new_cursor || isNaN(new_cursor)) return quiet ? false : app.badField('fe_ee_rc_time', "Please enter a valid date/time for the new event time.");
			event['reset_cursor'] = normalize_time( new_cursor, { sec: 0 } );
		}
		else delete event['reset_cursor'];
		
		// notification
		event.notify_success = $('#fe_ee_notify_success').val();
		event.notify_fail = $('#fe_ee_notify_fail').val();
		event.web_hook = $('#fe_ee_web_hook').val();
		
		// cpu limit
		if ($('#fe_ee_cpu_enabled').is(':checked')) {
			event.cpu_limit = parseInt( $('#fe_ee_cpu_limit').val() );
			if (isNaN(event.cpu_limit)) return quiet ? false : app.badField('fe_ee_cpu_limit', "Please enter an integer value for the CPU limit.");
			if (event.cpu_limit < 0) return quiet ? false : app.badField('fe_ee_cpu_limit', "Please enter a positive integer for the CPU limit.");
			
			event.cpu_sustain = parseInt( $('#fe_ee_cpu_sustain').val() ) * parseInt( $('#fe_ee_cpu_sustain_units').val() );
			if (isNaN(event.cpu_sustain)) return quiet ? false : app.badField('fe_ee_cpu_sustain', "Please enter an integer value for the CPU sustain period.");
			if (event.cpu_sustain < 0) return quiet ? false : app.badField('fe_ee_cpu_sustain', "Please enter a positive integer for the CPU sustain period.");
		}
		else {
			event.cpu_limit = 0;
			event.cpu_sustain = 0;
		}
		
		// mem limit
		if ($('#fe_ee_memory_enabled').is(':checked')) {
			event.memory_limit = parseInt( $('#fe_ee_memory_limit').val() ) * parseInt( $('#fe_ee_memory_limit_units').val() );
			if (isNaN(event.memory_limit)) return quiet ? false : app.badField('fe_ee_memory_limit', "Please enter an integer value for the memory limit.");
			if (event.memory_limit < 0) return quiet ? false : app.badField('fe_ee_memory_limit', "Please enter a positive integer for the memory limit.");
			
			event.memory_sustain = parseInt( $('#fe_ee_memory_sustain').val() ) * parseInt( $('#fe_ee_memory_sustain_units').val() );
			if (isNaN(event.memory_sustain)) return quiet ? false : app.badField('fe_ee_memory_sustain', "Please enter an integer value for the memory sustain period.");
			if (event.memory_sustain < 0) return quiet ? false : app.badField('fe_ee_memory_sustain', "Please enter a positive integer for the memory sustain period.");
		}
		else {
			event.memory_limit = 0;
			event.memory_sustain = 0;
		}
		
		// log file size limit
		if ($('#fe_ee_log_enabled').is(':checked')) {
			event.log_max_size = parseInt( $('#fe_ee_log_limit').val() ) * parseInt( $('#fe_ee_log_limit_units').val() );
			if (isNaN(event.log_max_size)) return quiet ? false : app.badField('fe_ee_log_limit', "Please enter an integer value for the log size limit.");
			if (event.log_max_size < 0) return quiet ? false : app.badField('fe_ee_log_limit', "Please enter a positive integer for the log size limit.");
		}
		else {
			event.log_max_size = 0;
		}
		
		// notes
		event.notes = trim( $('#fe_ee_notes').val() );
		
		return event;
	},
	
	onDataUpdate: function(key, value) {
		// recieved data update (websocket), see if sub-page cares about it
		switch (key) {
			case 'schedule':
				if (this.args.sub == 'events') this.gosub_events(this.args);
			break;
			
			case 'state':
				if (this.args.sub == 'edit_event') this.update_rc_value();
			break;
		}
	},
	
	onStatusUpdate: function(data) {
		// received status update (websocket), update sub-page if needed
		if (data.jobs_changed && (this.args.sub == 'events')) this.gosub_events(this.args);
	},
	
	onResizeDelay: function(size) {
		// called 250ms after latest window resize
		// so we can run more expensive redraw operations
		if (this.args.sub == 'events') this.gosub_events(this.args);
	},
	
	leavesub_edit_event: function(args) {
		// special hook fired when leaving edit_event sub-page
		// try to save edited state of event in mem cache
		if (this.event_copy) return; // in middle of edit --> copy operation
		
		var event = this.get_event_form_json(true); // quiet mode
		if (event) {
			app.autosave_event = event;
		}
	},
	
	onDeactivate: function() {
		// called when page is deactivated
		// this.div.html( '' );
		
		// allow sub-page to hook deactivate
		if (this.args && this.args.sub && this['leavesub_'+this.args.sub]) {
			this['leavesub_'+this.args.sub](this.args);
		}
		
		return true;
	}
	
} );
