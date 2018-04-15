// Cronicle Admin Page -- Activity Log

Class.add( Page.Admin, {
	
	activity_types: {
		'^cat': '<i class="fa fa-folder-open-o">&nbsp;</i>Category',
		'^group': '<i class="mdi mdi-server-network">&nbsp;</i>Group',
		'^plugin': '<i class="fa fa-plug">&nbsp;</i>Plugin',
		// '^apikey': '<i class="fa fa-key">&nbsp;</i>API Key',	
		'^apikey': '<i class="mdi mdi-key-variant">&nbsp;</i>API Key',	
		'^event': '<i class="fa fa-clock-o">&nbsp;</i>Event',
		'^user': '<i class="fa fa-user">&nbsp;&nbsp;</i>User',
		'server': '<i class="mdi mdi-desktop-tower mdi-lg">&nbsp;</i>Server',
		'^job': '<i class="fa fa-pie-chart">&nbsp;</i>Job',
		'^state': '<i class="mdi mdi-calendar-clock">&nbsp;</i>Scheduler', // mdi-lg
		'^error': '<i class="fa fa-exclamation-triangle">&nbsp;</i>Error',
		'^warning': '<i class="fa fa-exclamation-circle">&nbsp;</i>Warning'
	},
	
	gosub_activity: function(args) {
		// show activity log
		app.setWindowTitle( "Activity Log" );
		
		if (!args.offset) args.offset = 0;
		if (!args.limit) args.limit = 25;
		app.api.post( 'app/get_activity', copy_object(args), this.receive_activity.bind(this) );
	},
	
	receive_activity: function(resp) {
		// receive page of activity from server, render it
		this.lastActivityResp = resp;
		
		var html = '';
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'activity',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		this.events = [];
		if (resp.rows) this.events = resp.rows;
		
		var cols = ['Date/Time', 'Type', 'Description', 'Username', 'IP Address', 'Actions'];
		
		html += '<div style="padding:20px 20px 30px 20px">';
		
		html += '<div class="subtitle">';
			html += 'Activity Log';
			// html += '<div class="clear"></div>';
		html += '</div>';
		
		var self = this;
		html += this.getPaginatedTable( resp, cols, 'item', function(item, idx) {
			// figure out icon first
			if (!item.action) item.action = 'unknown';
			
			var item_type = '';
			for (var key in self.activity_types) {
				var regexp = new RegExp(key);
				if (item.action.match(regexp)) {
					item_type = self.activity_types[key];
					break;
				}
			}
			
			// compose nice description
			var desc = '';
			var actions = [];
			var color = '';
			
			switch (item.action) {
				
				// categories
				case 'cat_create':
					desc = 'New category created: <b>' + item.cat.title + '</b>';
				break;
				case 'cat_update':
					desc = 'Category updated: <b>' + item.cat.title + '</b>';
				break;
				case 'cat_delete':
					desc = 'Category deleted: <b>' + item.cat.title + '</b>';
				break;
				
				// groups
				case 'group_create':
					desc = 'New server group created: <b>' + item.group.title + '</b>';
				break;
				case 'group_update':
					desc = 'Server group updated: <b>' + item.group.title + '</b>';
				break;
				case 'group_delete':
					desc = 'Server group deleted: <b>' + item.group.title + '</b>';
				break;
				
				// plugins
				case 'plugin_create':
					desc = 'New Plugin created: <b>' + item.plugin.title + '</b>';
				break;
				case 'plugin_update':
					desc = 'Plugin updated: <b>' + item.plugin.title + '</b>';
				break;
				case 'plugin_delete':
					desc = 'Plugin deleted: <b>' + item.plugin.title + '</b>';
				break;
				
				// api keys
				case 'apikey_create':
					desc = 'New API Key created: <b>' + item.api_key.title + '</b> (Key: ' + item.api_key.key + ')';
					actions.push( '<a href="#Admin?sub=edit_api_key&id='+item.api_key.id+'">Edit Key</a>' );
				break;
				case 'apikey_update':
					desc = 'API Key updated: <b>' + item.api_key.title + '</b> (Key: ' + item.api_key.key + ')';
					actions.push( '<a href="#Admin?sub=edit_api_key&id='+item.api_key.id+'">Edit Key</a>' );
				break;
				case 'apikey_delete':
					desc = 'API Key deleted: <b>' + item.api_key.title + '</b> (Key: ' + item.api_key.key + ')';
				break;
				
				// events
				case 'event_create':
					desc = 'New event added: <b>' + item.event.title + '</b>';
					desc += " (" + summarize_event_timing(item.event.timing, item.event.timezone) + ")";
					actions.push( '<a href="#Schedule?sub=edit_event&id='+item.event.id+'">Edit Event</a>' );
				break;
				case 'event_update':
					desc = 'Event updated: <b>' + item.event.title + '</b>';
					actions.push( '<a href="#Schedule?sub=edit_event&id='+item.event.id+'">Edit Event</a>' );
				break;
				case 'event_delete':
					desc = 'Event deleted: <b>' + item.event.title + '</b>';
				break;
				
				// users
				case 'user_create':
					desc = 'New user account created: <b>' + item.user.username + "</b> (" + item.user.full_name + ")";
					actions.push( '<a href="#Admin?sub=edit_user&username='+item.user.username+'">Edit User</a>' );
				break;
				case 'user_update':
					desc = 'User account updated: <b>' + item.user.username + "</b> (" + item.user.full_name + ")";
					actions.push( '<a href="#Admin?sub=edit_user&username='+item.user.username+'">Edit User</a>' );
				break;
				case 'user_delete':
					desc = 'User account deleted: <b>' + item.user.username + "</b> (" + item.user.full_name + ")";
				break;
				case 'user_login':
					desc = "User logged in: <b>" + item.user.username + "</b> (" + item.user.full_name + ")";
				break;
				
				// servers
				case 'add_server': // legacy
				case 'server_add': // current
					desc = 'Server '+(item.manual ? 'manually ' : '')+'added to cluster: <b>' + item.hostname + '</b>';
				break;
				case 'remove_server': // legacy
				case 'server_remove': // current
					desc = 'Server '+(item.manual ? 'manually ' : '')+'removed from cluster: <b>' + item.hostname + '</b>';
				break;
				case 'master_server': // legacy
				case 'server_master': // current
					desc = 'Server has become master: <b>' + item.hostname + '</b>';
				break;
				
				case 'server_restart': 
					desc = 'Server restarted: <b>' + item.hostname + '</b>';
				break;
				case 'server_shutdown': 
					desc = 'Server shut down: <b>' + item.hostname + '</b>';
				break;
				
				case 'server_disable': 
					desc = 'Lost connectivity to server: <b>' + item.hostname + '</b>';
					color = 'yellow';
				break;
				case 'server_enable': 
					desc = 'Reconnected to server: <b>' + item.hostname + '</b>';
				break;
				
				// jobs
				case 'job_run':
					var event = find_object( app.schedule, { id: item.event } ) || { title: 'Unknown Event' };
					desc = 'Job <b>#'+item.id+'</b> ('+event.title+') manually started';
					actions.push( '<a href="#JobDetails?id='+item.id+'">Job Details</a>' );
				break;
				case 'job_complete':
					var event = find_object( app.schedule, { id: item.event } ) || { title: 'Unknown Event' };
					if (!item.code) {
						desc = 'Job <b>#'+item.id+'</b> ('+event.title+') on server <b>'+item.hostname.replace(/\.[\w\-]+\.\w+$/, '')+'</b> completed successfully';
					}
					else {
						desc = 'Job <b>#'+item.id+'</b> ('+event.title+') on server <b>'+item.hostname.replace(/\.[\w\-]+\.\w+$/, '')+'</b> failed with error: ' + encode_entities(item.description || 'Unknown Error');
						if (desc.match(/\n/)) desc = desc.split(/\n/).shift() + "...";
						color = 'red';
					}
					actions.push( '<a href="#JobDetails?id='+item.id+'">Job Details</a>' );
				break;
				case 'job_delete':
					var event = find_object( app.schedule, { id: item.event } ) || { title: 'Unknown Event' };
					desc = 'Job <b>#'+item.id+'</b> ('+event.title+') manually deleted';
				break;
				
				// scheduler
				case 'state_update':
					desc = 'Scheduler master switch was <b>' + (item.enabled ? 'enabled' : 'disabled') + '</b>';
				break;
				
				// errors
				case 'error':
					desc = encode_entities( item.description );
					color = 'red';
				break;
				
				// warnings
				case 'warning':
					desc = encode_entities( item.description );
					color = 'yellow';
				break;
				
			} // action
			
			var tds = [
				'<div style="white-space:nowrap;">' + get_nice_date_time( item.epoch || 0, false, true ) + '</div>',
				'<div class="td_big" style="white-space:nowrap; font-size:12px; font-weight:normal;">' + item_type + '</div>',
				'<div class="activity_desc">' + desc + '</div>',
				'<div style="white-space:nowrap;">' + self.getNiceUsername(item, true) + '</div>',
				(item.ip || 'n/a').replace(/^\:\:ffff\:(\d+\.\d+\.\d+\.\d+)$/, '$1'),
				'<div style="white-space:nowrap;">' + actions.join(' | ') + '</div>'
			];
			if (color) tds.className = color;
			
			return tds;
		} );
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	}
	
});