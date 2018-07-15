// Cronicle Admin Page -- API Keys

Class.add( Page.Admin, {
	
	gosub_api_keys: function(args) {
		// show API Key list
		app.setWindowTitle( "API Keys" );
		this.div.addClass('loading');
		app.api.post( 'app/get_api_keys', copy_object(args), this.receive_keys.bind(this) );
	},
	
	receive_keys: function(resp) {
		// receive all API Keys from server, render them sorted
		this.lastAPIKeysResp = resp;
		
		var html = '';
		this.div.removeClass('loading');
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) + 200) / 7 );
		
		if (!resp.rows) resp.rows = [];
		
		// sort by title ascending
		this.api_keys = resp.rows.sort( function(a, b) {
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		
		html += this.getSidebarTabs( 'api_keys',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		var cols = ['App Title', 'API Key', 'Status', 'Author', 'Created', 'Actions'];
		
		html += '<div style="padding:20px 20px 30px 20px">';
		
		html += '<div class="subtitle">';
			html += 'API Keys';
			html += '<div class="clear"></div>';
		html += '</div>';
		
		var self = this;
		html += this.getBasicTable( this.api_keys, cols, 'key', function(item, idx) {
			var actions = [
				'<span class="link" onMouseUp="$P().edit_api_key('+idx+')"><b>Edit</b></span>',
				'<span class="link" onMouseUp="$P().delete_api_key('+idx+')"><b>Delete</b></span>'
			];
			return [
				'<div class="td_big">' + self.getNiceAPIKey(item, true, col_width) + '</div>',
				'<div style="">' + item.key + '</div>',
				item.active ? '<span class="color_label green"><i class="fa fa-check">&nbsp;</i>Active</span>' : '<span class="color_label red"><i class="fa fa-warning">&nbsp;</i>Suspended</span>',
				self.getNiceUsername(item.username, true, col_width),
				'<span title="'+get_nice_date_time(item.created, true)+'">'+get_nice_date(item.created, true)+'</span>',
				actions.join(' | ')
			];
		} );
		
		html += '<div style="height:30px;"></div>';
		html += '<center><table><tr>';
			html += '<td><div class="button" style="width:130px;" onMouseUp="$P().edit_api_key(-1)"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Add API Key...</div></td>';
		html += '</tr></table></center>';
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	edit_api_key: function(idx) {
		// jump to edit sub
		if (idx > -1) Nav.go( '#Admin?sub=edit_api_key&id=' + this.api_keys[idx].id );
		else Nav.go( '#Admin?sub=new_api_key' );
	},
	
	delete_api_key: function(idx) {
		// delete key from search results
		this.api_key = this.api_keys[idx];
		this.show_delete_api_key_dialog();
	},
	
	gosub_new_api_key: function(args) {
		// create new API Key
		var html = '';
		app.setWindowTitle( "New API Key" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'new_api_key',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['new_api_key', "New API Key"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">New API Key</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center><table style="margin:0;">';
		
		this.api_key = { privileges: {}, key: get_unique_id() };
		
		html += this.get_api_key_edit_html();
		
		// buttons at bottom
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancel_api_key_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().do_new_api_key()"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Create Key</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table></center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		setTimeout( function() {
			$('#fe_ak_title').focus();
		}, 1 );
	},
	
	cancel_api_key_edit: function() {
		// cancel editing API Key and return to list
		Nav.go( 'Admin?sub=api_keys' );
	},
	
	do_new_api_key: function(force) {
		// create new API Key
		app.clearError();
		var api_key = this.get_api_key_form_json();
		if (!api_key) return; // error
		
		if (!api_key.title.length) {
			return app.badField('#fe_ak_title', "Please enter an app title for the new API Key.");
		}
		
		this.api_key = api_key;
		
		app.showProgress( 1.0, "Creating API Key..." );
		app.api.post( 'app/create_api_key', api_key, this.new_api_key_finish.bind(this) );
	},
	
	new_api_key_finish: function(resp) {
		// new API Key created successfully
		app.hideProgress();
		
		Nav.go('Admin?sub=edit_api_key&id=' + resp.id);
		
		setTimeout( function() {
			app.showMessage('success', "The new API Key was created successfully.");
		}, 150 );
	},
	
	gosub_edit_api_key: function(args) {
		// edit API Key subpage
		this.div.addClass('loading');
		app.api.post( 'app/get_api_key', { id: args.id }, this.receive_key.bind(this) );
	},
	
	receive_key: function(resp) {
		// edit existing API Key
		var html = '';
		this.api_key = resp.api_key;
		
		app.setWindowTitle( "Editing API Key \"" + (this.api_key.title) + "\"" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'edit_api_key',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['edit_api_key', "Edit API Key"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">Editing API Key &ldquo;' + (this.api_key.title) + '&rdquo;</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center>';
		html += '<table style="margin:0;">';
		
		html += this.get_api_key_edit_html();
		
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:130px; font-weight:normal;" onMouseUp="$P().cancel_api_key_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:130px; font-weight:normal;" onMouseUp="$P().show_delete_api_key_dialog()">Delete Key...</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:130px;" onMouseUp="$P().do_save_api_key()"><i class="fa fa-floppy-o">&nbsp;&nbsp;</i>Save Changes</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table>';
		html += '</center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	do_save_api_key: function() {
		// save changes to api key
		app.clearError();
		var api_key = this.get_api_key_form_json();
		if (!api_key) return; // error
		
		this.api_key = api_key;
		
		app.showProgress( 1.0, "Saving API Key..." );
		app.api.post( 'app/update_api_key', api_key, this.save_api_key_finish.bind(this) );
	},
	
	save_api_key_finish: function(resp, tx) {
		// new API Key saved successfully
		app.hideProgress();
		app.showMessage('success', "The API Key was saved successfully.");
		window.scrollTo( 0, 0 );
	},
	
	show_delete_api_key_dialog: function() {
		// show dialog confirming api key delete action
		var self = this;
		app.confirm( '<span style="color:red">Delete API Key</span>', "Are you sure you want to <b>permanently delete</b> the API Key \""+this.api_key.title+"\"?  There is no way to undo this action.", 'Delete', function(result) {
			if (result) {
				app.showProgress( 1.0, "Deleting API Key..." );
				app.api.post( 'app/delete_api_key', self.api_key, self.delete_api_key_finish.bind(self) );
			}
		} );
	},
	
	delete_api_key_finish: function(resp, tx) {
		// finished deleting API Key
		var self = this;
		app.hideProgress();
		
		Nav.go('Admin?sub=api_keys', 'force');
		
		setTimeout( function() {
			app.showMessage('success', "The API Key '"+self.api_key.title+"' was deleted successfully.");
		}, 150 );
	},
	
	get_api_key_edit_html: function() {
		// get html for editing an API Key (or creating a new one)
		var html = '';
		var api_key = this.api_key;
		
		// API Key
		html += get_form_table_row( 'API Key', '<input type="text" id="fe_ak_key" size="35" value="'+escape_text_field_value(api_key.key)+'" spellcheck="false"/>&nbsp;<span class="link addme" onMouseUp="$P().generate_key()">&laquo; Generate Random</span>' );
		html += get_form_table_caption( "The API Key string is used to authenticate API calls." );
		html += get_form_table_spacer();
		
		// status
		html += get_form_table_row( 'Status', '<select id="fe_ak_status">' + render_menu_options([[1,'Active'], [0,'Disabled']], api_key.active) + '</select>' );
		html += get_form_table_caption( "'Disabled' means that the API Key remains in the system, but it cannot be used for any API calls." );
		html += get_form_table_spacer();
		
		// title
		html += get_form_table_row( 'App Title', '<input type="text" id="fe_ak_title" size="30" value="'+escape_text_field_value(api_key.title)+'" spellcheck="false"/>' );
		html += get_form_table_caption( "Enter the title of the application that will be using the API Key.");
		html += get_form_table_spacer();
		
		// description
		html += get_form_table_row('App Description', '<textarea id="fe_ak_desc" style="width:550px; height:50px; resize:vertical;">'+escape_text_field_value(api_key.description)+'</textarea>');
		html += get_form_table_caption( "Optionally enter a more detailed description of the application." );
		html += get_form_table_spacer();
		
		// privilege list
		var priv_html = '';
		for (var idx = 0, len = config.privilege_list.length; idx < len; idx++) {
			var priv = config.privilege_list[idx];
			if (priv.id != 'admin') {
				var has_priv = !!api_key.privileges[ priv.id ];
				priv_html += '<div style="margin-top:4px; margin-bottom:4px;">';
				priv_html += '<input type="checkbox" id="fe_ak_priv_'+priv.id+'" value="1" '+(has_priv ? 'checked="checked"' : '')+'>';
				priv_html += '<label for="fe_ak_priv_'+priv.id+'">'+priv.title+'</label>';
				priv_html += '</div>';
			}
		}
		html += get_form_table_row( 'Privileges', priv_html );
		html += get_form_table_caption( "Select which privileges the API Key should have." );
		html += get_form_table_spacer();
		
		return html;
	},
	
	get_api_key_form_json: function() {
		// get api key elements from form, used for new or edit
		var api_key = this.api_key;
		
		api_key.key = $('#fe_ak_key').val();
		api_key.active = $('#fe_ak_status').val();
		api_key.title = $('#fe_ak_title').val();
		api_key.description = $('#fe_ak_desc').val();
		
		if (!api_key.key.length) {
			return app.badField('#fe_ak_key', "Please enter an API Key string, or generate a random one.");
		}
		
		for (var idx = 0, len = config.privilege_list.length; idx < len; idx++) {
			var priv = config.privilege_list[idx];
			api_key.privileges[ priv.id ] = $('#fe_ak_priv_'+priv.id).is(':checked') ? 1 : 0;
		}
		
		return api_key;
	},
	
	generate_key: function() {
		// generate random api key
		$('#fe_ak_key').val( get_unique_id() );
	}
	
});
