// Base App Framework

var app = {
	
	username: '',
	cacheBust: hires_time_now(),
	proto: location.protocol.match(/^https/i) ? 'https://' : 'http://',
	secure: !!location.protocol.match(/^https/i),
	retina: (window.devicePixelRatio > 1),
	base_api_url: '/api',
	plain_text_post: false,
	prefs: {},
	
	init: function() {
		// override this in your app.js
	},
	
	extend: function(obj) {
		// extend app object with another
		for (var key in obj) this[key] = obj[key];
	},
	
	setAPIBaseURL: function(url) {
		// set the API base URL (commands are appended to this)
		this.base_api_url = url;
	},
	
	setWindowTitle: function(title) {
		// set the current window title, includes app name
		document.title = title + ' | ' + this.name;
	},
	
	showTabBar: function(visible) {
		// show or hide tab bar
		if (visible) $('.tab_bar').show();
		else $('.tab_bar').hide();
	},
	
	updateHeaderInfo: function() {
		// update top-right display
		// override this function in app
	},
	
	getUserAvatarURL: function() {
		// get URL to user's avatar using Gravatar.com service
		var size = 0;
		var email = '';
		if (arguments.length == 2) {
			email = arguments[0];
			size = arguments[1];
		}
		else if (arguments.length == 1) {
			email = this.user.email;
			size = arguments[0];
		}
		
		// user may have custom avatar
		if (this.user && this.user.avatar) {
			// convert to protocol-less URL
			return this.user.avatar.replace(/^\w+\:/, '');
		}
		
		return '//en.gravatar.com/avatar/' + hex_md5( email.toLowerCase() ) + '.jpg?s=' + size + '&d=mm';
	},
	
	doMyAccount: function() {
		// nav to the my account page
		Nav.go('MyAccount');
	},
	
	doUserLogin: function(resp) {
		// user login, called from login page, or session recover
		app.username = resp.username;
		app.user = resp.user;
		
		app.setPref('username', resp.username);
		app.setPref('session_id', resp.session_id);
		
		this.updateHeaderInfo();
		
		if (this.isAdmin()) $('#tab_Admin').show();
		else $('#tab_Admin').hide();
	},
	
	doUserLogout: function(bad_cookie) {
		// log user out and redirect to login screen
		if (!bad_cookie) {
			// user explicitly logging out
			app.showProgress(1.0, "Logging out...");
			app.setPref('username', '');
		}
		
		app.api.post( 'user/logout', {
			session_id: app.getPref('session_id')
		}, 
		function(resp, tx) {
			app.hideProgress();
			
			delete app.user;
			delete app.username;
			delete app.user_info;
			
			app.setPref('session_id', '');
			
			$('#d_header_user_container').html( '' );
			
			Debug.trace("User session cookie was deleted, redirecting to login page");
			Nav.go('Login');
			
			setTimeout( function() {
				if (bad_cookie) app.showMessage('error', "Your session has expired.  Please log in again.");
				else app.showMessage('success', "You were logged out successfully.");
			}, 150 );
			
			$('#tab_Admin').hide();
		} );
	},
	
	isAdmin: function() {
		// return true if user is logged in and admin, false otherwise
		return( app.user && app.user.privileges && app.user.privileges.admin );
	},
	
	handleResize: function() {
		// called when window resizes
		if (this.page_manager && this.page_manager.current_page_id) {
			var id = this.page_manager.current_page_id;
			var page = this.page_manager.find(id);
			if (page && page.onResize) page.onResize( get_inner_window_size() );
		}
		
		// also handle sending resize events at a 250ms delay
		// so some pages can perform a more expensive refresh at a slower interval
		if (!this.resize_timer) {
			this.resize_timer = setTimeout( this.handleResizeDelay.bind(this), 250 );
		}
	},
	
	handleResizeDelay: function() {
		// called 250ms after latest resize event
		this.resize_timer = null;
		
		if (this.page_manager && this.page_manager.current_page_id) {
			var id = this.page_manager.current_page_id;
			var page = this.page_manager.find(id);
			if (page && page.onResizeDelay) page.onResizeDelay( get_inner_window_size() );
		}
	},
	
	handleUnload: function() {
		// called just before user navs off
		if (this.page_manager && this.page_manager.current_page_id && $P && $P() && $P().onBeforeUnload) {
			var result = $P().onBeforeUnload();
			if (result) {
				(e || window.event).returnValue = result; //Gecko + IE
				return result; // Webkit, Safari, Chrome etc.
			}
		}
	},
	
	doError: function(msg, lifetime) {
		// show an error message at the top of the screen
		// and hide the progress dialog if applicable
		Debug.trace("ERROR: " + msg);
		this.showMessage( 'error', msg, lifetime );
		if (this.progress) this.hideProgress();
		return null;
	},
	
	badField: function(id, msg) {
		// mark field as bad
		if (id.match(/^\w+$/)) id = '#' + id;
		$(id).removeClass('invalid').width(); // trigger reflow to reset css animation
		$(id).addClass('invalid');
		try { $(id).focus(); } catch (e) {;}
		if (msg) return this.doError(msg);
		else return false;
	},
	
	clearError: function(animate) {
		// clear last error
		app.hideMessage(animate);
		$('.invalid').removeClass('invalid');
	},
	
	showMessage: function(type, msg, lifetime) {
		// show success, warning or error message
		// Dialog.hide();
		var icon = '';
		switch (type) {
			case 'success': icon = 'check-circle'; break;
			case 'warning': icon = 'exclamation-circle'; break;
			case 'error': icon = 'exclamation-triangle'; break;
		}
		if (icon) {
			msg = '<i class="fa fa-'+icon+' fa-lg" style="transform-origin:50% 50%; transform:scale(1.25); -webkit-transform:scale(1.25);">&nbsp;&nbsp;&nbsp;</i>' + msg;
		}
		
		$('#d_message_inner').html( msg );
		$('#d_message').hide().removeClass().addClass('message').addClass(type).show(250);
		
		if (this.messageTimer) clearTimeout( this.messageTimer );
		if ((type == 'success') || lifetime) {
			if (!lifetime) lifetime = 8;
			this.messageTimer = setTimeout( function() { app.hideMessage(500); }, lifetime * 1000 );
		}
	},
	
	hideMessage: function(animate) {
		if (animate) $('#d_message').hide(animate);
		else $('#d_message').hide();
	},
	
	api: {
		request: function(url, args, callback, errorCallback) {
			// send AJAX request to server using jQuery
			var headers = {};
			
			// inject session id into headers, unless app is using plain_text_post
			if (app.getPref('session_id') && !app.plain_text_post) {
				headers['X-Session-ID'] = app.getPref('session_id');
			}
			
			args.context = this;
			args.url = url;
			args.dataType = 'text'; // so we can parse the response json ourselves
			args.timeout = 1000 * 10; // 10 seconds
			args.headers = headers;
			
			$.ajax(args).success( function(text) {
				// parse JSON and fire callback
				Debug.trace( 'api', "Received response from server: " + text );
				var resp = null;
				try { resp = JSON.parse(text); }
				catch (e) {
					// JSON parse error
					var desc = "JSON Error: " + e.toString();
					if (errorCallback) errorCallback({ code: 500, description: desc });
					else app.doError(desc);
				}
				// success, but check json for server error code
				if (resp) {
					if (('code' in resp) && (resp.code != 0)) {
						// an error occurred within the JSON response
						// session errors are handled specially
						if (resp.code == 'session') app.doUserLogout(true);
						else if (errorCallback) errorCallback(resp);
						else app.doError("Error: " + resp.description);
					}
					else if (callback) callback(resp);
				}
			} )
			.error( function(xhr, status, err) {
				// XHR or HTTP error
				var code = xhr.status || 500;
				var desc = err.toString() || status.toString();
				switch (desc) {
					case 'timeout': desc = "The request timed out.  Please try again."; break;
					case 'error': desc = "An unknown network error occurred.  Please try again."; break;
				}
				Debug.trace( 'api', "Network Error: " + code + ": " + desc );
				if (errorCallback) errorCallback({ code: code, description: desc });
				else app.doError( "Network Error: " + code + ": " + desc );
			} );
		},
		
		post: function(cmd, params, callback, errorCallback) {
			// send AJAX POST request to server using jQuery
			var url = cmd;
			if (!url.match(/^(\w+\:\/\/|\/)/)) url = app.base_api_url + "/" + cmd;
			
			if (!params) params = {};
			
			// inject session in into json if submitting as plain text (cors preflight workaround)
			if (app.getPref('session_id') && app.plain_text_post) {
				params['session_id'] = app.getPref('session_id');
			}
			
			var json_raw = JSON.stringify(params);
			Debug.trace( 'api', "Sending HTTP POST to: " + url + ": " + json_raw );
			
			this.request(url, {
				type: "POST",
				data: json_raw,
				contentType: app.plain_text_post ? 'text/plain' : 'application/json'
			}, callback, errorCallback);
		},
		
		get: function(cmd, query, callback, errorCallback) {
			// send AJAX GET request to server using jQuery
			var url = cmd;
			if (!url.match(/^(\w+\:\/\/|\/)/)) url = app.base_api_url + "/" + cmd;
			
			if (!query) query = {};
			query.cachebust = app.cacheBust;
			url += compose_query_string(query);
			
			Debug.trace( 'api', "Sending HTTP GET to: " + url );
			
			this.request(url, {
				type: "GET"
			}, callback, errorCallback);
		}
	}, // api
	
	getPref: function(key) {
		// get pref using html5 localStorage
		if (window.localStorage) return localStorage[key];
		else return this.prefs[key];
	},
	
	setPref: function(key, value) {
		if (window.localStorage) localStorage[key] = value;
		else prefs[key] = value;
	},
	
	hideProgress: function() {
		// hide progress dialog
		Dialog.hide();
		delete app.progress;
	},
	
	showProgress: function(counter, title) {
		// show or update progress bar
		if (!$('#d_progress_bar').length) {
			// no progress dialog is active, so set it up
			if (!counter) counter = 0;
			if (counter < 0) counter = 0;
			if (counter > 1) counter = 1;
			var cx = Math.floor( counter * 196 );
			
			var html = '';
			html += '<div class="dialog_simple dialog_shadow">';
			// html += '<center>';
			// html += '<div class="loading" style="width:32px; height:32px; margin:0 auto 10px auto;"></div>';
			html += '<div id="d_progress_title" class="dialog_subtitle" style="text-align:center; position:relative; top:-5px;">' + title + '</div>';
			
			var extra_classes = '';
			if (counter == 1.0) extra_classes = 'indeterminate';
			
			html += '<div id="d_progress_bar_cont" class="progress_bar_container '+extra_classes+'" style="width:196px; margin:0 auto 0 auto;">';
				html += '<div id="d_progress_bar" class="progress_bar_inner" style="width:'+cx+'px;"></div>';
			html += '</div>';
			
			// html += '</center>';
			html += '</div>';
			
			app.hideMessage();
			Dialog.show(275, 100, "", html, true);
			
			app.progress = {
				start_counter: counter,
				counter: counter,
				counter_max: 1,
				start_time: hires_time_now(),
				last_update: hires_time_now(),
				title: title
			};
		}
		else if (app.progress) {
			// dialog is active, so update existing elements
			var now = hires_time_now();
			var cx = Math.floor( counter * 196 );
			$('#d_progress_bar').css( 'width', '' + cx + 'px' );
			
			var prog_cont = $('#d_progress_bar_cont');
			if ((counter == 1.0) && !prog_cont.hasClass('indeterminate')) prog_cont.addClass('indeterminate');
			else if ((counter < 1.0) && prog_cont.hasClass('indeterminate')) prog_cont.removeClass('indeterminate');
			
			if (title) app.progress.title = title;
			$('#d_progress_title').html( app.progress.title );
			
			app.progress.last_update = now;
			app.progress.counter = counter;
		}
	},
	
	showDialog: function(title, inner_html, buttons_html) {
		// show dialog using our own look & feel
		var html = '';
		html += '<div class="dialog_title">' + title + '</div>';
		html += '<div class="dialog_content">' + inner_html + '</div>';
		html += '<div class="dialog_buttons">' + buttons_html + '</div>';
		Dialog.showAuto( "", html );
	},
	
	hideDialog: function() {
		Dialog.hide();
	},
	
	confirm: function(title, html, ok_btn_label, callback) {
		// show simple OK / Cancel dialog with custom text
		// fires callback with true (OK) or false (Cancel)
		if (!ok_btn_label) ok_btn_label = "OK";
		this.confirm_callback = callback;
		
		var inner_html = "";
		inner_html += '<div style="width:450px; font-size:13px; color:#444;">'+html+'</div>';
		
		var buttons_html = "";
		buttons_html += '<center><table><tr>';
			buttons_html += '<td><div class="button" style="width:100px; font-weight:normal;" onMouseUp="app.confirm_click(false)">Cancel</div></td>';
			buttons_html += '<td width="60">&nbsp;</td>';
			buttons_html += '<td><div class="button" style="width:100px;" onMouseUp="app.confirm_click(true)">'+ok_btn_label+'</div></td>';
		buttons_html += '</tr></table></center>';
		
		this.showDialog( title, inner_html, buttons_html );
		
		// special mode for key capture
		Dialog.active = 'confirmation';
	},
	
	confirm_click: function(result) {
		// user clicked OK or Cancel in confirmation dialog, fire callback
		// caller MUST deal with Dialog.hide() if result is true
		if (this.confirm_callback) {
			this.confirm_callback(result);
			if (!result) Dialog.hide();
		}
	},
	
	confirm_key: function(event) {
		// handle keydown with active confirmation dialog
		if (Dialog.active !== 'confirmation') return;
		if ((event.keyCode != 13) && (event.keyCode != 27)) return;
		
		// skip enter check if textarea is active
		if (document.activeElement && (event.keyCode == 13)) {
			if ($(document.activeElement).prop('type') == 'textarea') return;
		}
		
		event.stopPropagation();
		event.preventDefault();
		
		if (event.keyCode == 13) this.confirm_click(true);
		else if (event.keyCode == 27) this.confirm_click(false);
	},
	
	get_base_url: function() {
		return app.proto + location.hostname + '/';
	}
	
}; // app object

function get_form_table_row() {
	// Get HTML for formatted form table row (label and content).
	var tr_class = '';
	var left = '';
	var right = '';
	if (arguments.length == 3) {
		tr_class = arguments[0]; left = arguments[1]; right = arguments[2];
	}
	else {
		left = arguments[0]; right = arguments[1];
	}
	
	left = left.replace(/\s/g, '&nbsp;').replace(/\:$/, '');
	if (left) left += ':'; else left = '&nbsp;';
	
	var html = '';
	html += '<tr class="'+tr_class+'">';
		html += '<td align="right" class="table_label">'+left+'</td>';
		html += '<td align="left" class="table_value">';
			html += '<div>'+right+'</div>';
		html += '</td>';
	html += '</tr>';
	return html;
};

function get_form_table_caption() {
	// Get HTML for form table caption (takes up a row).
	var tr_class = '';
	var cap = '';
	if (arguments.length == 2) {
		tr_class = arguments[0]; cap = arguments[1];
	}
	else {
		cap = arguments[0];
	}
	
	var html = '';
	html += '<tr class="'+tr_class+'">';
		html += '<td>&nbsp;</td>';
		html += '<td align="left">';
			html += '<div class="caption">'+cap+'</div>';
		html += '</td>';
	html += '</tr>';
	return html;
};

function get_form_table_spacer() {
	// Get HTML for form table spacer (takes up a row).
	var tr_class = '';
	var extra_classes = '';
	if (arguments.length == 2) {
		tr_class = arguments[0]; extra_classes = arguments[1];
	}
	else {
		extra_classes = arguments[0];
	}
	
	var html = '';
	html += '<tr class="'+tr_class+'"><td colspan="2"><div class="table_spacer '+extra_classes+'"></div></td></tr>';
	return html;
};

function $P(id) {
	// shortcut for page_manager.find(), also defaults to current page
	if (!id) id = app.page_manager.current_page_id;
	var page = app.page_manager.find(id);
	assert( !!page, "Failed to locate page: " + id );
	return page;
};

var Debug = {
	backlog: [],
	
	dump: function() {
		// dump backlog to console
		for (var idx = 0, len = this.backlog.length; idx < len; idx++) {
			console.log( this.backlog[idx] );
		}
	},
	
	trace: function(cat, msg) {
		// trace one line to console, or store in backlog
		if (arguments.length == 1) { msg = cat; cat = 'debug'; }
		if (window.console && console.log && window.config && config.debug) {
			console.log( cat + ': ' + msg );
		}
		else {
			this.backlog.push( hires_time_now() + ': ' + cat + ': ' + msg );
			if (this.backlog.length > 100) this.backlog.shift();
		}
	}
};

$(document).ready(function() {
	app.init();
});

window.addEventListener( "keydown", function(event) {
	app.confirm_key(event);
}, false );

window.addEventListener( "resize", function() {
	app.handleResize();
}, false );

window.addEventListener("beforeunload", function (e) {
	return app.handleUnload();
}, false );
