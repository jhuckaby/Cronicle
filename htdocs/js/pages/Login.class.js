Class.subclass( Page.Base, "Page.Login", {	
	
	onInit: function() {
		// called once at page load
		// var html = 'Now is the time (LOGIN)';
		// this.div.html( html );
	},
	
	onActivate: function(args) {
		// page activation
		if (app.user) {
			// user already logged in
			setTimeout( function() { Nav.go(app.navAfterLogin || config.DefaultPage) }, 1 );
			return true;
		}
		else if (args.u && args.h) {
			this.showPasswordResetForm(args);
			return true;
		}
		else if (args.create) {
			this.showCreateAccountForm();
			return true;
		}
		else if (args.recover) {
			this.showRecoverPasswordForm();
			return true;
		}
		
		app.setWindowTitle('Login');
		app.showTabBar(false);
		
		this.div.css({ 'padding-top':'75px', 'padding-bottom':'75px' });
		var html = '';
		// html += '<iframe name="i_login" id="i_login" src="blank.html" width="1" height="1" style="display:none"></iframe>';
		// html += '<form id="f_login" method="post" action="/api/user/login?format=jshtml&callback=window.parent.%24P%28%29.doFrameLogin" target="i_login">';
		
		html += '<div class="inline_dialog_container">';
			html += '<div class="dialog_title shade-light">User Login</div>';
			html += '<div class="dialog_content">';
				html += '<center><table style="margin:0px;">';
					html += '<tr>';
						html += '<td align="right" class="table_label">Username:</td>';
						html += '<td align="left" class="table_value"><div><input type="text" name="username" id="fe_login_username" size="30" spellcheck="false" value="'+(app.getPref('username') || '')+'"/></div></td>';
					html += '</tr>';
					html += '<tr><td colspan="2"><div class="table_spacer"></div></td></tr>';
					html += '<tr>';
						html += '<td align="right" class="table_label">Password:</td>';
						html += '<td align="left" class="table_value"><div><input type="' + app.get_password_type() + '" name="password" id="fe_login_password" size="30" spellcheck="false" value=""/>' + app.get_password_toggle_html() + '</div></td>';
					html += '</tr>';
					html += '<tr><td colspan="2"><div class="table_spacer"></div></td></tr>';
				html += '</table></center>';
			html += '</div>';
			
			html += '<div class="dialog_buttons"><center><table><tr>';
				if (config.free_accounts) {
					html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().navCreateAccount()">Create Account...</div></td>';
					html += '<td width="20">&nbsp;</td>';
				}
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().navPasswordRecovery()">Forgot Password...</div></td>';
				html += '<td width="20">&nbsp;</td>';
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().doLogin()"><i class="fa fa-sign-in">&nbsp;&nbsp;</i>Login</div></td>';
			html += '</tr></table></center></div>';
		html += '</div>';
		
		// html += '<input type="submit" value="Login" style="position:absolute; left:-9999px; top:0px;">';
		html += '</form>';
		this.div.html( html );
		
		setTimeout( function() {
			$( app.getPref('username') ? '#fe_login_password' : '#fe_login_username' ).focus();
			
			 $('#fe_login_username, #fe_login_password').keypress( function(event) {
				if (event.keyCode == '13') { // enter key
					event.preventDefault();
					$P().doLogin();
				}
			} ); 
			
		}, 1 );
		
		return true;
	},
	
	/*doLoginFormSubmit: function() {
		// force login form to submit
		$('#f_login')[0].submit();
	},
	
	doFrameLogin: function(resp) {
		// login from IFRAME redirect
		// alert("GOT HERE FROM IFRAME " + JSON.stringify(resp));
		this.tempFrameResp = JSON.parse( JSON.stringify(resp) );
		setTimeout( '$P().doFrameLogin2()', 1 );
	},
	
	doFrameLogin2: function() {
		// login from IFRAME redirect
		var resp = this.tempFrameResp;
		delete this.tempFrameResp;
		
		Debug.trace("IFRAME Response: " + JSON.stringify(resp));
		
		if (resp.code) {
			return app.doError( resp.description );
		}
		
		Debug.trace("IFRAME User Login: " + resp.username + ": " + resp.session_id);
		
		app.clearError();
		app.hideProgress();
		app.doUserLogin( resp );
		
		Nav.go( app.navAfterLogin || config.DefaultPage );
		// alert("GOT HERE: " + (app.navAfterLogin || config.DefaultPage) );
	},*/
	
	 doLogin: function() {
		// attempt to log user in
		var username = $('#fe_login_username').val().toLowerCase();
		var password = $('#fe_login_password').val();
		
		if (username && password) {
			app.showProgress(1.0, "Logging in...");
			
			app.api.post( 'user/login', {
				username: username,
				password: password
			}, 
			function(resp, tx) {
				Debug.trace("User Login: " + username + ": " + resp.session_id);
				
				app.hideProgress();
				app.doUserLogin( resp );
				
				Nav.go( app.navAfterLogin || config.DefaultPage );
			} ); // post
		}
	}, 
	
	cancel: function() {
		// return to login page
		app.clearError();
		Nav.go('Login', true);
	},
	
	navCreateAccount: function() {
		// nav to create account form
		app.clearError();
		Nav.go('Login?create=1', true);
	},
	
	showCreateAccountForm: function() {
		// allow user to create a new account
		app.setWindowTitle('Create Account');
		app.showTabBar(false);
		
		this.div.css({ 'padding-top':'75px', 'padding-bottom':'75px' });
		var html = '';
		
		html += '<div class="inline_dialog_container">';
			html += '<div class="dialog_title shade-light">Create Account</div>';
			html += '<div class="dialog_content">';
				html += '<center><table style="margin:0px;">';
				
				html += get_form_table_row( 'Username:', 
					'<table cellspacing="0" cellpadding="0"><tr>' + 
						'<td><input type="text" id="fe_ca_username" size="20" style="font-size:14px;" value="" spellcheck="false" onChange="$P().checkUserExists(\'ca\')"/></td>' + 
						'<td><div id="d_ca_valid" style="margin-left:5px; font-weight:bold;"></div></td>' + 
					'</tr></table>'
				);
				
				html += get_form_table_caption('Choose a unique alphanumeric username for your account.') + 
				get_form_table_spacer() + 
				get_form_table_row('Password:', '<input type="' + app.get_password_type() + '" id="fe_ca_password" size="30" value="" spellcheck="false"/>' + app.get_password_toggle_html()) + 
				get_form_table_caption('Enter a secure password that you will not forget.') + 
				get_form_table_spacer() + 
				get_form_table_row('Full Name:', '<input type="text" id="fe_ca_fullname" size="30" value="" spellcheck="false"/>') + 
				get_form_table_caption('This is used for display purposes only.') + 
				get_form_table_spacer() + 
				get_form_table_row('Email Address:', '<input type="text" id="fe_ca_email" size="30" value="" spellcheck="false"/>') + 
				get_form_table_caption('This is used only to recover your password should you lose it.');
					
				html += '</table></center>';
			html += '</div>';
			
			html += '<div class="dialog_buttons"><center><table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancel()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().doCreateAccount()"><i class="fa fa-user-plus">&nbsp;&nbsp;</i>Create</div></td>';
			html += '</tr></table></center></div>';
		html += '</div>';
		
		this.div.html( html );
		
		setTimeout( function() {
			$( '#fe_ca_username' ).focus();
			app.password_strengthify( '#fe_ca_password' );
		}, 1 );
	},
	
	doCreateAccount: function(force) {
		// actually create account
		app.clearError();
		
		var username = trim($('#fe_ca_username').val().toLowerCase());
		var email = trim($('#fe_ca_email').val());
		var full_name = trim($('#fe_ca_fullname').val());
		var password = trim($('#fe_ca_password').val());
		
		if (!username.length) {
			return app.badField('#fe_ca_username', "Please enter a username for your account.");
		}
		if (!username.match(/^[\w\-\.]+$/)) {
			return app.badField('#fe_ca_username', "Please make sure your username contains only alphanumerics, dashes and periods.");
		}
		if (!email.length) {
			return app.badField('#fe_ca_email', "Please enter an e-mail address where you can be reached.");
		}
		if (!email.match(/^\S+\@\S+$/)) {
			return app.badField('#fe_ca_email', "The e-mail address you entered does not appear to be correct.");
		}
		if (!full_name.length) {
			return app.badField('#fe_ca_fullname', "Please enter your first and last names. These are used only for display purposes.");
		}
		if (!password.length) {
			return app.badField('#fe_ca_password', "Please enter a secure password to protect your account.");
		}
		if (!force && (app.last_password_strength.score < 3)) {
			app.confirm( '<span style="color:red">Insecure Password Warning</span>', app.get_password_warning(), "Proceed", function(result) {
				if (result) $P().doCreateAccount('force');
			} );
			return;
		} // insecure password
		
		Dialog.hide();
		app.showProgress( 1.0, "Creating account..." );
		
		app.api.post( 'user/create', {
			username: username,
			email: email,
			password: password,
			full_name: full_name
		}, 
		function(resp, tx) {
			app.hideProgress();
			app.showMessage('success', "Account created successfully.");
			
			app.setPref('username', username);
			Nav.go( 'Login', true );
		} ); // api.post
	},
	
	navPasswordRecovery: function() {
		// nav to recover password form
		app.clearError();
		Nav.go('Login?recover=1', true);
	},
	
	showRecoverPasswordForm: function() {
		// allow user to create a new account
		app.setWindowTitle('Forgot Password');
		app.showTabBar(false);
		
		this.div.css({ 'padding-top':'75px', 'padding-bottom':'75px' });
		var html = '';
		
		html += '<div class="inline_dialog_container">';
			html += '<div class="dialog_title shade-light">Forgot Password</div>';
			html += '<div class="dialog_content">';
				html += '<center><table style="margin:0px;">';
				
				html += get_form_table_row('Username:', '<input type="text" id="fe_pr_username" size="30" value="" spellcheck="false"/>') + 
				get_form_table_spacer() + 
				get_form_table_row('Email Address:', '<input type="text" id="fe_pr_email" size="30" value="" spellcheck="false"/>');
				
				html += '</table></center>';
				
				html += '<div class="caption" style="margin-top:15px;">Please enter the username and e-mail address associated with your account, and we will send you instructions for resetting your password.</div>';
				
			html += '</div>';
			
			html += '<div class="dialog_buttons"><center><table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancel()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().doSendRecoveryEmail()"><i class="fa fa-envelope-o">&nbsp;&nbsp;</i>Send Email</div></td>';
			html += '</tr></table></center></div>';
		html += '</div>';
		
		this.div.html( html );
		
		setTimeout( function() { 
			$('#fe_pr_username, #fe_pr_email').keypress( function(event) {
				if (event.keyCode == '13') { // enter key
					event.preventDefault();
					$P().doSendEmail();
				}
			} );
			$( '#fe_pr_username' ).focus();
		}, 1 );
	},
	
	doSendRecoveryEmail: function() {
		// send password recovery e-mail
		app.clearError();
		
		var username = trim($('#fe_pr_username').val()).toLowerCase();
		var email = trim($('#fe_pr_email').val());
		
		if (username.match(/^\w+$/)) {
			if (email.match(/.+\@.+/)) {
				Dialog.hide();
				app.showProgress( 1.0, "Sending e-mail..." );
				app.api.post( 'user/forgot_password', {
					username: username,
					email: email
				}, 
				function(resp, tx) {
					app.hideProgress();
					app.showMessage('success', "Password reset instructions sent successfully.");
					Nav.go('Login', true);
				} ); // api.post
			} // good address
			else app.badField('#fe_pr_email', "The e-mail address you entered does not appear to be correct.");
		} // good username
		else app.badField('#fe_pr_username', "The username you entered does not appear to be correct.");
	},
	
	showPasswordResetForm: function(args) {
		// show password reset form
		this.recoveryKey = args.h;
		
		app.setWindowTitle('Reset Password');
		app.showTabBar(false);
		
		this.div.css({ 'padding-top':'75px', 'padding-bottom':'75px' });
		var html = '';
		
		html += '<div class="inline_dialog_container">';
			html += '<div class="dialog_title shade-light">Reset Password</div>';
			html += '<div class="dialog_content">';
				html += '<center><table style="margin:0px;">';
					html += '<tr>';
						html += '<td align="right" class="table_label">Username:</td>';
						html += '<td align="left" class="table_value"><div><input type="text" name="username" id="fe_reset_username" size="30" spellcheck="false" value="'+args.u+'" disabled="disabled"/></div></td>';
					html += '</tr>';
					html += '<tr><td colspan="2"><div class="table_spacer"></div></td></tr>';
					html += '<tr>';
						html += '<td align="right" class="table_label">New Password:</td>';
						html += '<td align="left" class="table_value"><div><input type="' + app.get_password_type() + '" name="password" id="fe_reset_password" size="30" spellcheck="false" value=""/>' + app.get_password_toggle_html() + '</div></td>';
					html += '</tr>';
					html += '<tr><td colspan="2"><div class="table_spacer"></div></td></tr>';
				html += '</table></center>';
			html += '</div>';
			
			html += '<div class="dialog_buttons"><center><table><tr>';
				html += '<td><div class="button" style="width:130px;" onMouseUp="$P().doResetPassword()"><i class="fa fa-key">&nbsp;&nbsp;</i>Reset Password</div></td>';
			html += '</tr></table></center></div>';
		html += '</div>';
		
		this.div.html( html );
		
		setTimeout( function() {
			$( '#fe_reset_password' ).focus();
			$('#fe_reset_password').keypress( function(event) {
				if (event.keyCode == '13') { // enter key
					event.preventDefault();
					$P().doResetPassword();
				}
			} );
			app.password_strengthify( '#fe_reset_password' );
		}, 1 );
	},
	
	doResetPassword: function(force) {
		// reset password now
		var username = $('#fe_reset_username').val().toLowerCase();
		var new_password = $('#fe_reset_password').val();
		var recovery_key = this.recoveryKey;
		
		if (username && new_password) {
			if (!force && (app.last_password_strength.score < 3)) {
				app.confirm( '<span style="color:red">Insecure Password Warning</span>', app.get_password_warning(), "Proceed", function(result) {
					if (result) $P().doResetPassword('force');
				} );
				return;
			} // insecure password
			
			app.showProgress(1.0, "Resetting password...");
			
			app.api.post( 'user/reset_password', {
				username: username,
				key: recovery_key,
				new_password: new_password
			}, 
			function(resp, tx) {
				Debug.trace("User password was reset: " + username);
				
				app.hideProgress();
				app.setPref('username', username);
				
				Nav.go( 'Login', true );
				
				setTimeout( function() {
					app.showMessage('success', "Your password was reset successfully.");
				}, 100 );
			} ); // post
		}
	},
	
	onDeactivate: function() {
		// called when page is deactivated
		this.div.html( '' );
		return true;
	}
	
} );
