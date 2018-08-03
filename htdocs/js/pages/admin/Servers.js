// Cronicle Admin Page -- Servers

Class.add( Page.Admin, {
	
	gosub_servers: function(args) {
		// show server list, server groups
		this.div.removeClass('loading');
		app.setWindowTitle( "Servers" );
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) + 400) / 9 );
		
		var html = '';
		
		html += this.getSidebarTabs( 'servers',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		html += '<div style="padding:20px 20px 30px 20px">';
		
		// Active Server Cluster
		
		var cols = ['Hostname', 'IP Address', 'Groups', 'Status', 'Active Jobs', 'Uptime', 'CPU', 'Mem', 'Actions'];
		
		html += '<div class="subtitle">';
			html += 'Server Cluster';
			// html += '<div class="clear"></div>';
		html += '</div>';
		
		this.servers = [];
		var hostnames = hash_keys_to_array( app.servers ).sort();
		for (var idx = 0, len = hostnames.length; idx < len; idx++) {
			this.servers.push( app.servers[ hostnames[idx] ] );
		}
		
		// include nearby servers under main server list
		if (app.nearby) {
			var hostnames = hash_keys_to_array( app.nearby ).sort();
			for (var idx = 0, len = hostnames.length; idx < len; idx++) {
				var server = app.nearby[ hostnames[idx] ];
				if (!app.servers[server.hostname]) {
					server.nearby = 1;
					this.servers.push( server );
				}
			}
		}
		
		// render table
		var self = this;
		html += this.getBasicTable( this.servers, cols, 'server', function(server, idx) {
			
			// render nearby servers differently
			if (server.nearby) {
				var tds = [
					'<div class="td_big" style="font-weight:normal"><div class="ellip" style="max-width:'+col_width+'px;"><i class="fa fa-eye">&nbsp;</i>' + server.hostname.replace(/\.[\w\-]+\.\w+$/, '') + '</div></div>',
					(server.ip || 'n/a').replace(/^\:\:ffff\:(\d+\.\d+\.\d+\.\d+)$/, '$1'),
					'-', '(Nearby)', '-', '-', '-', '-',
					'<span class="link" onMouseUp="$P().add_server_from_list('+idx+')"><b>Add Server</b></span>'
				];
				tds.className = 'blue';
				return tds;
			} // nearby
			
			var actions = [
				'<span class="link" onMouseUp="$P().restart_server('+idx+')"><b>Restart</b></span>',
				'<span class="link" onMouseUp="$P().shutdown_server('+idx+')"><b>Shutdown</b></span>'
			];
			if (server.disabled) actions = [];
			if (!server.master) {
				actions.push( '<span class="link" onMouseUp="$P().remove_server('+idx+')"><b>Remove</b></span>' );
			}
			
			var group_names = [];
			var eligible = false;
			for (var idx = 0, len = app.server_groups.length; idx < len; idx++) {
				var group = app.server_groups[idx];
				var regexp = new RegExp( group.regexp, "i" );
				if (server.hostname.match(regexp)) {
					group_names.push( group.title );
					if (group.master) eligible = true;
				}
			}
			
			var jobs = find_objects( app.activeJobs, { hostname: server.hostname } );
			var num_jobs = jobs.length;
			
			var cpu = 0;
			var mem = 0;
			if (server.data && server.data.cpu) cpu += server.data.cpu;
			if (server.data && server.data.mem) mem += server.data.mem;
			for (idx = 0, len = jobs.length; idx < len; idx++) {
				var job = jobs[idx];
				if (job.cpu && job.cpu.current) cpu += job.cpu.current;
				if (job.mem && job.mem.current) mem += job.mem.current;
			}
			
			var tds = [
				'<div class="td_big">' + self.getNiceGroup(null, server.hostname, col_width) + '</div>',
				(server.ip || 'n/a').replace(/^\:\:ffff\:(\d+\.\d+\.\d+\.\d+)$/, '$1'),
				group_names.length ? group_names.join(', ') : '(None)',
				server.master ? '<span class="color_label green"><i class="fa fa-check">&nbsp;</i>Master</span>' : (eligible ? '<span class="color_label purple">Backup</span>' : '<span class="color_label blue">Slave</span>'),
				num_jobs ? commify( num_jobs ) : '(None)',
				get_text_from_seconds( server.uptime, true, true ).replace(/\bday\b/, 'days'),
				short_float(cpu) + '%',
				get_text_from_bytes(mem),
				actions.join(' | ')
			];
			
			if (server.disabled) tds.className = 'disabled';
			
			return tds;
		} );
		
		html += '<div style="height:25px;"></div>';
		html += '<center><table><tr>';
			html += '<td><div class="button" style="width:130px;" onMouseUp="$P().add_server()"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Add Server...</div></td>';
		html += '</tr></table></center>';
		
		html += '<div style="height:30px;"></div>';
		
		// Server Groups
		
		var col_width = Math.floor( ((size.width * 0.9) + 300) / 6 );
		
		var cols = ['Title', 'Hostname Match', '# of Servers', '# of Events', 'Class', 'Actions'];
		
		html += '<div class="subtitle">';
			html += 'Server Groups';
			// html += '<div class="clear"></div>';
		html += '</div>';
		
		// sort by title ascending
		this.server_groups = app.server_groups.sort( function(a, b) {
			// return (b.title < a.title) ? 1 : -1;
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		
		// render table
		var self = this;
		html += this.getBasicTable( this.server_groups, cols, 'group', function(group, idx) {
			var actions = [
				'<span class="link" onMouseUp="$P().edit_group('+idx+')"><b>Edit</b></span>',
				'<span class="link" onMouseUp="$P().delete_group('+idx+')"><b>Delete</b></span>'
			];
			
			var regexp = new RegExp( group.regexp, "i" );
			var num_servers = 0;
			for (var hostname in app.servers) {
				if (hostname.match(regexp)) num_servers++;
			}
			
			var group_events = find_objects( app.schedule, { target: group.id } );
			var num_events = group_events.length;
			
			return [
				'<div class="td_big" style="white-space:nowrap;"><span class="link" onMouseUp="$P().edit_group('+idx+')">' + self.getNiceGroup(group, null, col_width) + '</span></div>',
				'<div class="ellip" style="font-family:monospace; max-width:'+col_width+'px;">/' + group.regexp + '/</div>',
				// group.description || '(No description)',
				num_servers ? commify( num_servers) : '(None)',
				num_events ? commify( num_events ) : '(None)',
				group.master ? '<b>Master Eligible</b>' : 'Slave Only',
				actions.join(' | ')
			];
		} );
		
		html += '<div style="height:25px;"></div>';
		html += '<center><table><tr>';
			html += '<td><div class="button" style="width:130px;" onMouseUp="$P().edit_group(-1)"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Add Group...</div></td>';
		html += '</tr></table></center>';
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	add_server_from_list: function(idx) {
		// add a server right away, from the nearby list
		var server = this.servers[idx];
		
		app.showProgress( 1.0, "Adding server..." );
		app.api.post( 'app/add_server', { hostname: server.ip || server.hostname }, function(resp) {
			app.hideProgress();
			app.showMessage('success', "Server was added successfully.");
			// self['gosub_servers'](self.args);
		} ); // api.post
	},
	
	add_server: function() {
		// show dialog allowing user to enter an arbitrary hostname to add
		var html = '';
		
		// html += '<div style="font-size:12px; color:#777; margin-bottom:15px;">Typically, servers should automatically add themselves to the cluster, if they are within UDP broadcast range (i.e. on the same LAN).  You should only need to manually add a server in special circumstances, e.g. if it is remotely hosted in another datacenter or network.</div>';
		
		// html += '<div style="font-size:12px; color:#777; margin-bottom:20px;">Note that the new server cannot already be a master server, nor part of another '+app.name+' server cluster, and the current master server must be able to reach it.</div>';
		
		html += '<center><table>' + 
			// get_form_table_spacer() + 
			get_form_table_row('Hostname or IP:', '<input type="text" id="fe_as_hostname" style="width:280px" value="" spellcheck="false"/>') + 
			get_form_table_caption("Enter the hostname or IP of the server you want to add.") + 
		'</table></center>';
		
		app.confirm( '<i class="mdi mdi-desktop-tower mdi-lg">&nbsp;&nbsp;</i>Add Server', html, "Add Server", function(result) {
			app.clearError();
			
			if (result) {
				var hostname = $('#fe_as_hostname').val().toLowerCase();
				if (!hostname) return app.badField('fe_as_hostname', "Please enter a server hostname or IP address.");
				if (!hostname.match(/^[\w\-\.]+$/)) return app.badField('fe_as_hostname', "Please enter a valid server hostname or IP address.");
				if (app.servers[hostname]) return app.badField('fe_as_hostname', "That server is already in the cluster.");
				Dialog.hide();
				
				app.showProgress( 1.0, "Adding server..." );
				app.api.post( 'app/add_server', { hostname: hostname }, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Server was added successfully.");
					// self['gosub_servers'](self.args);
				} ); // api.post
			} // user clicked add
		} ); // app.confirm
		
		setTimeout( function() { 
			$('#fe_as_hostname').focus();
		}, 1 );
	},
	
	remove_server: function(idx) {
		// remove manual server after user confirmation
		var server = this.servers[idx];
		
		var jobs = find_objects( app.activeJobs, { hostname: server.hostname } );
		if (jobs.length) return app.doError("Sorry, you cannot remove a server that has active jobs running on it.");
		
		// proceed with remove
		var self = this;
		app.confirm( '<span style="color:red">Remove Server</span>', "Are you sure you want to remove the server <b>"+server.hostname+"</b>?", "Remove", function(result) {
			if (result) {
				app.showProgress( 1.0, "Removing server..." );
				app.api.post( 'app/remove_server', server, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Server was removed successfully.");
					// self.gosub_servers(self.args);
				} );
			}
		} );
	},
	
	edit_group: function(idx) {
		// edit group (-1 == new group)
		var self = this;
		var group = (idx > -1) ? this.server_groups[idx] : {
			title: "",
			regexp: "",
			master: 0
		};
		var edit = (idx > -1) ? true : false;
		var html = '';
		
		html += '<table>';
		
		// Internal ID
		if (edit && this.isAdmin()) {
			html += get_form_table_row( 'Group ID', '<div style="font-size:14px;">' + group.id + '</div>' );
			html += get_form_table_caption( "The internal Group ID used for API calls.  This cannot be changed." );
			html += get_form_table_spacer();
		}
		
		html += 
			get_form_table_row('Group Title:', '<input type="text" id="fe_eg_title" size="25" value="'+escape_text_field_value(group.title)+'"/>') + 
			get_form_table_caption("Enter a title for the server group, short and sweet.") + 
			get_form_table_spacer() + 
			get_form_table_row('Hostname Match:', '<input type="text" id="fe_eg_regexp" size="30" style="font-family:monospace; font-size:13px;" value="'+escape_text_field_value(group.regexp)+'" spellcheck="false"/>') + 
			get_form_table_caption("Enter a regular expression to auto-assign servers to this group by their hostnames, e.g. \"^mtx\\d+\\.\".") + 
			get_form_table_spacer() + 
			get_form_table_row('Server Class:', '<select id="fe_eg_master">' + render_menu_options([ [1,'Master Eligible'], [0,'Slave Only'] ], group.master, false) + '</select>') + 
			get_form_table_caption("Select whether servers in the group are eligible to become the master server, or run as slaves only.") + 
		'</table>';
		
		app.confirm( '<i class="mdi mdi-server-network">&nbsp;&nbsp;</i>' + (edit ? "Edit Server Group" : "Add Server Group"), html, edit ? "Save Changes" : "Add Group", function(result) {
			app.clearError();
			
			if (result) {
				group.title = $('#fe_eg_title').val();
				if (!group.title) return app.badField('fe_eg_title', "Please enter a title for the server group.");
				group.regexp = $('#fe_eg_regexp').val().replace(/^\/(.+)\/$/, '$1');
				if (!group.regexp) return app.badField('fe_eg_regexp', "Please enter a regular expression for the server group.");
				
				try { new RegExp(group.regexp); }
				catch(err) {
					return app.badField('fe_eg_regexp', "Invalid regular expression: " + err);
				}
				
				group.master = parseInt( $('#fe_eg_master').val() );
				Dialog.hide();
				
				// pro-tip: embed id in title as bracketed prefix
				if (!edit && group.title.match(/^\[(\w+)\]\s*(.+)$/)) {
					group.id = RegExp.$1;
					group.title = RegExp.$2;
				}
				
				app.showProgress( 1.0, edit ? "Saving group..." : "Adding group..." );
				app.api.post( edit ? 'app/update_server_group' : 'app/create_server_group', group, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Server group was " + (edit ? "saved" : "added") + " successfully.");
					// self['gosub_servers'](self.args);
				} ); // api.post
			} // user clicked add
		} ); // app.confirm
		
		setTimeout( function() { 
			if (!$('#fe_eg_title').val()) $('#fe_eg_title').focus();
		}, 1 );
	},
	
	delete_group: function(idx) {
		// delete selected server group
		var group = this.server_groups[idx];
		
		// make sure user isn't deleting final master group
		if (group.master) {
			var num_masters = 0;
			for (var idx = 0, len = this.server_groups.length; idx < len; idx++) {
				if (this.server_groups[idx].master) num_masters++;
			}
			if (num_masters == 1) {
				return app.doError("Sorry, you cannot delete the last Master Eligible server group.");
			}
		}
		
		// check for events first
		var group_events = find_objects( app.schedule, { target: group.id } );
		var num_events = group_events.length;
		if (num_events) return app.doError("Sorry, you cannot delete a group that has events assigned to it.");
		
		// proceed with delete
		var self = this;
		app.confirm( '<span style="color:red">Delete Server Group</span>', "Are you sure you want to delete the server group <b>"+group.title+"</b>?  There is no way to undo this action.", "Delete", function(result) {
			if (result) {
				app.showProgress( 1.0, "Deleting group..." );
				app.api.post( 'app/delete_server_group', group, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Server group was deleted successfully.");
					// self.gosub_servers(self.args);
				} );
			}
		} );
	},
	
	restart_server: function(idx) {
		// restart server after confirmation
		var self = this;
		var server = this.servers[idx];
		
		app.confirm( '<span style="color:red">Restart Server</span>', "Are you sure you want to restart the server <b>"+server.hostname+"</b>?  All server jobs will be aborted.", "Restart", function(result) {
			if (result) {
				app.showProgress( 1.0, "Restarting server..." );
				app.api.post( 'app/restart_server', server, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Server is being restarted in the background.");
					// self.gosub_servers(self.args);
				} );
			}
		} );
	},
	
	shutdown_server: function(idx) {
		// shutdown server after confirmation
		var self = this;
		var server = this.servers[idx];
		
		app.confirm( '<span style="color:red">Shutdown Server</span>', "Are you sure you want to shutdown the server <b>"+server.hostname+"</b>?  All server jobs will be aborted.", "Shutdown", function(result) {
			if (result) {
				app.showProgress( 1.0, "Shutting down server..." );
				app.api.post( 'app/shutdown_server', server, function(resp) {
					app.hideProgress();
					app.showMessage('success', "Server is being shut down in the background.");
					// self.gosub_servers(self.args);
				} );
			}
		} );
	}
	
});