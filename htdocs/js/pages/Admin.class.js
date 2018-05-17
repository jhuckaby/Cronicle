Class.subclass( Page.Base, "Page.Admin", {	
	
	usernames: null,
	default_sub: 'activity',
	
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
		this.tab[0]._page_id = Nav.currentAnchor();
		
		this.div.addClass('loading');
		this['gosub_'+args.sub](args);
		
		return true;
	},
	
	onDataUpdate: function(key, value) {
		// recieved data update (websocket), see if sub-page cares about it
		switch (key) {
			case 'users':
				if (this.args.sub == 'users') this.gosub_users(this.args);
			break;
			
			case 'categories':
				if (this.args.sub == 'categories') this.gosub_categories(this.args);
			break;
			
			case 'server_groups':
			case 'servers':
			case 'nearby':
				if (this.args.sub == 'servers') this.gosub_servers(this.args);
			break;
			
			case 'plugins':
				if (this.args.sub == 'plugins') this.gosub_plugins(this.args);
			break;
			
			case 'state':
			case 'schedule':
				if (this.args.sub == 'servers') this.gosub_servers(this.args);
			break;
			
			case 'api_keys':
				if (this.args.sub == 'api_keys') this.gosub_api_keys(this.args);
			break;
		}
	},
	
	onStatusUpdate: function(data) {
		// received status update (websocket), update sub-page if needed
		if (data.jobs_changed && (this.args.sub == 'servers')) this.gosub_servers(this.args);
		if (data.servers_changed && (this.args.sub == 'servers')) this.gosub_servers(this.args);
	},
	
	onResizeDelay: function(size) {
		// called 250ms after latest window resize
		// so we can run more expensive redraw operations
		switch (this.args.sub) {
			case 'users': 
				if (this.lastUsersResp) {
					this.receive_users(this.lastUsersResp); 
				}
			break;
			case 'categories': 
				this.gosub_categories(this.args); 
			break;
			case 'servers': 
				this.gosub_servers(this.args); 
			break;
			case 'plugins': 
				this.gosub_plugins(this.args); 
			break;
			case 'api_keys':
				if (this.lastAPIKeysResp) {
					this.receive_keys( this.lastAPIKeysResp );
				}
			break;
			case 'activity':
				if (this.lastActivityResp) {
					this.receive_activity( this.lastActivityResp );
				}
			break;
		}
	},
	
	onDeactivate: function() {
		// called when page is deactivated
		// this.div.html( '' );
		return true;
	}
	
} );
