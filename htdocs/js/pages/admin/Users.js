// Cronicle Admin Page -- Users

Class.add( Page.Admin, {
	
	gosub_users: function(args) {
		// show user list
		app.setWindowTitle( "User List" );
		this.div.addClass('loading');
		if (!args.offset) args.offset = 0;
		if (!args.limit) args.limit = 25;
		app.api.post( 'user/admin_get_users', copy_object(args), this.receive_users.bind(this) );
	},
	
	receive_users: function(resp) {
		// receive page of users from server, render it
		this.lastUsersResp = resp;
		
		var html = '';
		this.div.removeClass('loading');
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) + 200) / 7 );
		
		this.users = [];
		if (resp.rows) this.users = resp.rows;
		
		html += this.getSidebarTabs( 'users',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		var cols = ['Username', 'Full Name', 'Email Address', 'Status', 'Type', 'Created', 'Actions'];
		
		// html += '<div style="padding:5px 15px 15px 15px;">';
		html += '<div style="padding:20px 20px 30px 20px">';
		
		html += '<div class="subtitle">';
			html += 'User Accounts';
			// html += '<div class="subtitle_widget"><span class="link" onMouseUp="$P().refresh_user_list()"><b>Refresh</b></span></div>';
			html += '<div class="subtitle_widget"><i class="fa fa-search">&nbsp;</i><input type="text" id="fe_ul_search" size="15" placeholder="Find username..." style="border:0px;"/></div>';
			html += '<div class="clear"></div>';
		html += '</div>';
		
		var self = this;
		html += this.getPaginatedTable( resp, cols, 'user', function(user, idx) {
			var actions = [
				'<span class="link" onMouseUp="$P().edit_user('+idx+')"><b>Edit</b></span>',
				'<span class="link" onMouseUp="$P().delete_user('+idx+')"><b>Delete</b></span>'
			];
			return [
				'<div class="td_big">' + self.getNiceUsername(user, true, col_width) + '</div>',
				'<div class="ellip" style="max-width:'+col_width+'px;">' + user.full_name + '</div>',
				'<div class="ellip" style="max-width:'+col_width+'px;"><a href="mailto:'+user.email+'">'+user.email+'</a></div>',
				user.active ? '<span class="color_label green"><i class="fa fa-check">&nbsp;</i>Active</span>' : '<span class="color_label red"><i class="fa fa-warning">&nbsp;</i>Suspended</span>',
				user.privileges.admin ? '<span class="color_label purple"><i class="fa fa-lock">&nbsp;</i>Admin</span>' : '<span class="color_label gray">Standard</span>',
				'<span title="'+get_nice_date_time(user.created, true)+'">'+get_nice_date(user.created, true)+'</span>',
				actions.join(' | ')
			];
		} );
		
		html += '<div style="height:30px;"></div>';
		html += '<center><table><tr>';
			html += '<td><div class="button" style="width:130px;" onMouseUp="$P().edit_user(-1)"><i class="fa fa-user-plus">&nbsp;&nbsp;</i>Add User...</div></td>';
		html += '</tr></table></center>';
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		setTimeout( function() {
			$('#fe_ul_search').keypress( function(event) {
				if (event.keyCode == '13') { // enter key
					event.preventDefault();
					$P().do_user_search( $('#fe_ul_search').val() );
				}
			} )
			.blur( function() { app.hideMessage(250); } )
			.keydown( function() { app.hideMessage(); } );
		}, 1 );
	},
	
	do_user_search: function(username) {
		// see if user exists, edit if so
		app.api.post( 'user/admin_get_user', { username: username }, 
			function(resp) {
				Nav.go('Admin?sub=edit_user&username=' + username);
			},
			function(resp) {
				app.doError("User not found: " + username, 10);
			}
		);
	},
	
	edit_user: function(idx) {
		// jump to edit sub
		if (idx > -1) Nav.go( '#Admin?sub=edit_user&username=' + this.users[idx].username );
		else if (app.config.external_users) {
			app.doError("Users are managed by an external system, so you cannot add users from here.");
		}
		else Nav.go( '#Admin?sub=new_user' );
	},
	
	delete_user: function(idx) {
		// delete user from search results
		this.user = this.users[idx];
		this.show_delete_account_dialog();
	},
	
	gosub_new_user: function(args) {
		// create new user
		var html = '';
		app.setWindowTitle( "Add New User" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'new_user',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"],
				['new_user', "Add New User"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">Add New User</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center><table style="margin:0;">';
		
		this.user = { 
			privileges: copy_object( config.default_privileges )
		};
		
		html += this.get_user_edit_html();
		
		// notify user
		html += get_form_table_row( 'Notify', '<input type="checkbox" id="fe_eu_send_email" value="1" checked="checked"/><label for="fe_eu_send_email">Send Welcome Email</label>' );
		html += get_form_table_caption( "Select notification options for the new user." );
		html += get_form_table_spacer();
		
		// buttons at bottom
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancel_user_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				if (config.debug) {
					html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().populate_random_user()">Randomize...</div></td>';
					html += '<td width="50">&nbsp;</td>';
				}
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().do_new_user()"><i class="fa fa-user-plus">&nbsp;&nbsp;</i>Create User</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table></center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		setTimeout( function() {
			$('#fe_eu_username').focus();
		}, 1 );
	},
	
	cancel_user_edit: function() {
		// cancel editing user and return to list
		Nav.go( 'Admin?sub=users' );
	},
	
	populate_random_user: function() {
		// grab random user data (for testing only)
		var self = this;
		
		$.ajax({
			url: 'http://api.randomuser.me/',
			dataType: 'json',
			success: function(data){
				// console.log(data);
				if (data.results && data.results[0] && data.results[0].user) {
					var user = data.results[0].user;
					$('#fe_eu_username').val( user.username );
					$('#fe_eu_email').val( user.email );
					$('#fe_eu_fullname').val( ucfirst(user.name.first) + ' ' + ucfirst(user.name.last) );
					$('#fe_eu_send_email').prop( 'checked', false );
					self.generate_password();
					self.checkUserExists('eu');
				}
			}
		});
	},
	
	do_new_user: function(force) {
		// create new user
		app.clearError();
		var user = this.get_user_form_json();
		if (!user) return; // error
		
		if (!user.username.length) {
			return app.badField('#fe_eu_username', "Please enter a username for the new account.");
		}
		if (!user.username.match(/^[\w\-\.]+$/)) {
			return app.badField('#fe_eu_username', "Please make sure the username contains only alphanumerics, periods and dashes.");
		}
		if (!user.email.length) {
			return app.badField('#fe_eu_email', "Please enter an e-mail address where the user can be reached.");
		}
		if (!user.email.match(/^\S+\@\S+$/)) {
			return app.badField('#fe_eu_email', "The e-mail address you entered does not appear to be correct.");
		}
		if (!user.full_name.length) {
			return app.badField('#fe_eu_fullname', "Please enter the user's first and last names.");
		}
		if (!user.password.length) {
			return app.badField('#fe_eu_password', "Please enter a secure password to protect the account.");
		}
		
		user.send_email = $('#fe_eu_send_email').is(':checked') ? 1 : 0;
		
		this.user = user;
		
		app.showProgress( 1.0, "Creating user..." );
		app.api.post( 'user/admin_create', user, this.new_user_finish.bind(this) );
	},
	
	new_user_finish: function(resp) {
		// new user created successfully
		app.hideProgress();
		
		Nav.go('Admin?sub=edit_user&username=' + this.user.username);
		
		setTimeout( function() {
			app.showMessage('success', "The new user account was created successfully.");
		}, 150 );
	},
	
	gosub_edit_user: function(args) {
		// edit user subpage
		this.div.addClass('loading');
		app.api.post( 'user/admin_get_user', { username: args.username }, this.receive_user.bind(this) );
	},
	
	receive_user: function(resp) {
		// edit existing user
		var html = '';
		app.setWindowTitle( "Editing User \"" + (this.args.username) + "\"" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'edit_user',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"],
				['edit_user', "Edit User"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">Editing User &ldquo;' + (this.args.username) + '&rdquo;</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center>';
		html += '<table style="margin:0;">';
		
		this.user = resp.user;
		
		html += this.get_user_edit_html();
		
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:130px; font-weight:normal;" onMouseUp="$P().cancel_user_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:130px; font-weight:normal;" onMouseUp="$P().show_delete_account_dialog()">Delete Account...</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:130px;" onMouseUp="$P().do_save_user()"><i class="fa fa-floppy-o">&nbsp;&nbsp;</i>Save Changes</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table>';
		html += '</center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		setTimeout( function() {
			$('#fe_eu_username').attr('disabled', true);
			
			if (app.config.external_users) {
				app.showMessage('warning', "Users are managed by an external system, so making changes here may have little effect.");
				// self.div.find('input').prop('disabled', true);
			}
		}, 1 );
	},
	
	do_save_user: function() {
		// create new user
		app.clearError();
		var user = this.get_user_form_json();
		if (!user) return; // error
		
		// if changing password, give server a hint
		if (user.password) {
			user.new_password = user.password;
			delete user.password;
		}
		
		this.user = user;
		
		app.showProgress( 1.0, "Saving user account..." );
		app.api.post( 'user/admin_update', user, this.save_user_finish.bind(this) );
	},
	
	save_user_finish: function(resp, tx) {
		// new user created successfully
		app.hideProgress();
		app.showMessage('success', "The user was saved successfully.");
		window.scrollTo( 0, 0 );
		
		// if we edited ourself, update header
		if (this.args.username == app.username) {
			app.user = resp.user;
			app.updateHeaderInfo();
		}
		
		$('#fe_eu_password').val('');
	},
	
	show_delete_account_dialog: function() {
		// show dialog confirming account delete action
		var self = this;
		
		var msg = "Are you sure you want to <b>permanently delete</b> the user account \""+this.user.username+"\"?  There is no way to undo this action, and no way to recover the data.";
		
		if (app.config.external_users) {
			msg = "Are you sure you want to delete the user account \""+this.user.username+"\"?  Users are managed by an external system, so this will have little effect here.";
			// return app.doError("Users are managed by an external system, so you cannot make changes here.");
		}
		
		app.confirm( '<span style="color:red">Delete Account</span>', msg, 'Delete', function(result) {
			if (result) {
				app.showProgress( 1.0, "Deleting Account..." );
				app.api.post( 'user/admin_delete', {
					username: self.user.username
				}, self.delete_user_finish.bind(self) );
			}
		} );
	},
	
	delete_user_finish: function(resp, tx) {
		// finished deleting, immediately log user out
		var self = this;
		app.hideProgress();
		
		Nav.go('Admin?sub=users', 'force');
		
		setTimeout( function() {
			app.showMessage('success', "The user account '"+self.user.username+"' was deleted successfully.");
		}, 150 );
	},
	
	get_user_edit_html: function() {
		// get html for editing a user (or creating a new one)
		var html = '';
		var user = this.user;
		
		// user id
		html += get_form_table_row( 'Username', 
			'<table cellspacing="0" cellpadding="0"><tr>' + 
				'<td><input type="text" id="fe_eu_username" size="20" style="font-size:14px;" value="'+escape_text_field_value(user.username)+'" spellcheck="false" onChange="$P().checkUserExists(\'eu\')"/></td>' + 
				'<td><div id="d_eu_valid" style="margin-left:5px; font-weight:bold;"></div></td>' + 
			'</tr></table>'
		);
		html += get_form_table_caption( "Enter the username which identifies this account.  Once entered, it cannot be changed. " );
		html += get_form_table_spacer();
		
		// account status
		html += get_form_table_row( 'Account Status', '<select id="fe_eu_status">' + render_menu_options([[1,'Active'], [0,'Suspended']], user.active) + '</select>' );
		html += get_form_table_caption( "'Suspended' means that the account remains in the system, but the user cannot log in." );
		html += get_form_table_spacer();
		
		// full name
		html += get_form_table_row( 'Full Name', '<input type="text" id="fe_eu_fullname" size="30" value="'+escape_text_field_value(user.full_name)+'" spellcheck="false"/>' );
		html += get_form_table_caption( "User's first and last name.  They will not be shared with anyone outside the server.");
		html += get_form_table_spacer();
		
		// email
		html += get_form_table_row( 'Email Address', '<input type="text" id="fe_eu_email" size="30" value="'+escape_text_field_value(user.email)+'" spellcheck="false"/>' );
		html += get_form_table_caption( "This can be used to recover the password if the user forgets.  It will not be shared with anyone outside the server." );
		html += get_form_table_spacer();
		
		// password
		html += get_form_table_row( user.password ? 'Change Password' : 'Password', '<input type="text" id="fe_eu_password" size="20" value=""/>&nbsp;<span class="link addme" onMouseUp="$P().generate_password()">&laquo; Generate Random</span>' );
		html += get_form_table_caption( user.password ? "Optionally enter a new password here to reset it.  Please make it secure." : "Enter a password for the account.  Please make it secure." );
		html += get_form_table_spacer();
		
		// privilege list
		var priv_html = '';
		var user_is_admin = !!user.privileges.admin;
		
		for (var idx = 0, len = config.privilege_list.length; idx < len; idx++) {
			var priv = config.privilege_list[idx];
			var has_priv = !!user.privileges[ priv.id ];
			var priv_visible = (priv.id == 'admin') || !user_is_admin;
			var priv_class = (priv.id == 'admin') ? 'priv_group_admin' : 'priv_group_other';
			
			priv_html += '<div class="'+priv_class+'" style="margin-top:4px; margin-bottom:4px; '+(priv_visible ? '' : 'display:none;')+'">';
			priv_html += '<input type="checkbox" id="fe_eu_priv_'+priv.id+'" value="1" ' + 
				(has_priv ? 'checked="checked" ' : '') + ((priv.id == 'admin') ? 'onChange="$P().change_admin_checkbox()"' : '') + '>';
			priv_html += '<label for="fe_eu_priv_'+priv.id+'">'+priv.title+'</label>';
			priv_html += '</div>';
		}
		
		html += get_form_table_row( 'Privileges', priv_html );
		html += get_form_table_caption( "Select which privileges the user account should have. Administrators have all privileges." );
		html += get_form_table_spacer();
		
		return html;
	},
	
	change_admin_checkbox: function() {
		// toggle admin checkbox
		var is_checked = $('#fe_eu_priv_admin').is(':checked');
		if (is_checked) $('div.priv_group_other').hide(250);
		else $('div.priv_group_other').show(250);
	},
	
	get_user_form_json: function() {
		// get user elements from form, used for new or edit
		var user = {
			username: trim($('#fe_eu_username').val().toLowerCase()),
			active: $('#fe_eu_status').val(),
			full_name: trim($('#fe_eu_fullname').val()),
			email: trim($('#fe_eu_email').val()),
			password: $('#fe_eu_password').val(),
			privileges: {}
		};
		
		for (var idx = 0, len = config.privilege_list.length; idx < len; idx++) {
			var priv = config.privilege_list[idx];
			user.privileges[ priv.id ] = $('#fe_eu_priv_'+priv.id).is(':checked') ? 1 : 0;
		}
		
		return user;
	},
	
	generate_password: function() {
		// generate random password
		$('#fe_eu_password').val( b64_md5(get_unique_id()).substring(0, 8) );
	}
	
});
