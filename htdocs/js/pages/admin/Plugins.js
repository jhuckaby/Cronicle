// Cronicle Admin Page -- Plugins

Class.add( Page.Admin, {
	
	ctype_labels: {
		text: "Text Field",
		textarea: "Text Box",
		checkbox: "Checkbox",
		hidden: "Hidden",
		select: "Menu"
	},
	
	gosub_plugins: function(args) {
		// show plugin list
		this.div.removeClass('loading');
		app.setWindowTitle( "Plugins" );
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) + 500) / 6 );
		
		var html = '';
		
		this.plugins = app.plugins;
		
		html += this.getSidebarTabs( 'plugins',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		var cols = ['Plugin Name', 'Author', '# of Events', 'Created', 'Modified', 'Actions'];
		
		// html += '<div style="padding:5px 15px 15px 15px;">';
		html += '<div style="padding:20px 20px 30px 20px">';
		
		html += '<div class="subtitle">';
			html += 'Plugins';
			// html += '<div class="clear"></div>';
		html += '</div>';
		
		// sort by title ascending
		this.plugins = app.plugins.sort( function(a, b) {
			// return (b.title < a.title) ? 1 : -1;
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		
		var self = this;
		html += this.getBasicTable( this.plugins, cols, 'plugin', function(plugin, idx) {
			var actions = [
				'<span class="link" onMouseUp="$P().edit_plugin('+idx+')"><b>Edit</b></span>',
				'<span class="link" onMouseUp="$P().delete_plugin('+idx+')"><b>Delete</b></span>'
			];
			
			var plugin_events = find_objects( app.schedule, { plugin: plugin.id } );
			var num_events = plugin_events.length;
			
			var tds = [
				'<div class="td_big"><a href="#Admin?sub=edit_plugin&id='+plugin.id+'">' + self.getNicePlugin(plugin, col_width) + '</a></div>',
				self.getNiceUsername(plugin, true, col_width),
				num_events ? commify( num_events ) : '(None)',
				'<span title="'+get_nice_date_time(plugin.created, true)+'">'+get_nice_date(plugin.created, true)+'</span>',
				'<span title="'+get_nice_date_time(plugin.modified, true)+'">'+get_nice_date(plugin.modified, true)+'</span>',
				actions.join(' | ')
			];
			
			if (!plugin.enabled) {
				if (tds.className) tds.className += ' '; else tds.className = '';
				tds.className += 'disabled';
			}
			
			return tds;
		} );
		
		html += '<div style="height:30px;"></div>';
		html += '<center><table><tr>';
			html += '<td><div class="button" style="width:140px;" onMouseUp="$P().edit_plugin(-1)"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Add New Plugin...</div></td>';
		html += '</tr></table></center>';
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	edit_plugin: function(idx) {
		// jump to edit sub
		if (idx > -1) Nav.go( '#Admin?sub=edit_plugin&id=' + this.plugins[idx].id );
		else Nav.go( '#Admin?sub=new_plugin' );
	},
	
	delete_plugin: function(idx) {
		// delete key from search results
		this.plugin = this.plugins[idx];
		this.show_delete_plugin_dialog();
	},
	
	show_delete_plugin_dialog: function() {
		// delete selected plugin
		var plugin = this.plugin;
		
		// check for events first
		var plugin_events = find_objects( app.schedule, { plugin: plugin.id } );
		var num_events = plugin_events.length;
		if (num_events) return app.doError("Sorry, you cannot delete a plugin that has events assigned to it.");
		
		// proceed with delete
		var self = this;
		app.confirm( '<span style="color:red">Delete Plugin</span>', "Are you sure you want to delete the plugin <b>"+plugin.title+"</b>?  There is no way to undo this action.", "Delete", function(result) {
			if (result) {
				app.showProgress( 1.0, "Deleting Plugin..." );
				app.api.post( 'app/delete_plugin', plugin, function(resp) {
					app.hideProgress();
					app.showMessage('success', "The Plugin '"+self.plugin.title+"' was deleted successfully.");
					// self.gosub_plugins(self.args);
					
					Nav.go('Admin?sub=plugins', 'force');
				} );
			}
		} );
	},
	
	gosub_new_plugin: function(args) {
		// create new plugin
		var html = '';
		app.setWindowTitle( "Add New Plugin" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'new_plugin',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['new_plugin', "Add New Plugin"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">Add New Plugin</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center><table style="margin:0;">';
		
		if (this.plugin_copy) {
			this.plugin = this.plugin_copy;
			delete this.plugin_copy;
		}
		else {
			this.plugin = { params: [], enabled: 1 };
		}
		
		html += this.get_plugin_edit_html();
		
		// buttons at bottom
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancel_plugin_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().do_new_plugin()"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Create Plugin</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		html += '</table></center>';
		
		html += '</div>'; // table wrapper div
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		setTimeout( function() {
			$('#fe_ep_title').focus();
		}, 1 );
	},
	
	cancel_plugin_edit: function() {
		// cancel edit, nav back to plugin list
		Nav.go('Admin?sub=plugins');
	},
	
	do_new_plugin: function(force) {
		// create new plugin
		app.clearError();
		var plugin = this.get_plugin_form_json();
		if (!plugin) return; // error
		
		// pro-tip: embed id in title as bracketed prefix
		if (plugin.title.match(/^\[(\w+)\]\s*(.+)$/)) {
			plugin.id = RegExp.$1;
			plugin.title = RegExp.$2;
		}
		
		this.plugin = plugin;
		
		app.showProgress( 1.0, "Creating plugin..." );
		app.api.post( 'app/create_plugin', plugin, this.new_plugin_finish.bind(this) );
	},
	
	new_plugin_finish: function(resp) {
		// new plugin created successfully
		app.hideProgress();
		
		Nav.go('Admin?sub=plugins');
		
		setTimeout( function() {
			app.showMessage('success', "The new plugin was created successfully.");
		}, 150 );
	},
	
	gosub_edit_plugin: function(args) {
		// edit plugin subpage
		var plugin = find_object( app.plugins, { id: args.id } );
		if (!plugin) return app.doError("Could not locate Plugin with ID: " + args.id);
		
		// make local copy so edits don't affect main app list until save
		this.plugin = deep_copy_object( plugin );
		
		var html = '';
		app.setWindowTitle( "Editing Plugin \"" + plugin.title + "\"" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'edit_plugin',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['edit_plugin', "Edit Plugin"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">Editing Plugin &ldquo;' + plugin.title + '&rdquo;</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center>';
		html += '<table style="margin:0;">';
		
		html += this.get_plugin_edit_html();
		
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancel_plugin_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().show_delete_plugin_dialog()">Delete Plugin...</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().do_copy_plugin()">Copy Plugin...</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:130px;" onMouseUp="$P().do_save_plugin()"><i class="fa fa-floppy-o">&nbsp;&nbsp;</i>Save Changes</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table>';
		html += '</center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	do_copy_plugin: function() {
		// copy plugin to new
		app.clearError();
		var plugin = this.get_plugin_form_json();
		if (!plugin) return; // error
		
		delete plugin.id;
		delete plugin.created;
		delete plugin.modified;
		delete plugin.username;
		
		plugin.title = "Copy of " + plugin.title;
		
		this.plugin_copy = plugin;
		Nav.go('Admin?sub=new_plugin');
	},
	
	do_save_plugin: function() {
		// save changes to existing plugin
		app.clearError();
		var plugin = this.get_plugin_form_json();
		if (!plugin) return; // error
		
		this.plugin = plugin;
		
		app.showProgress( 1.0, "Saving plugin..." );
		app.api.post( 'app/update_plugin', plugin, this.save_plugin_finish.bind(this) );
	},
	
	save_plugin_finish: function(resp, tx) {
		// existing plugin saved successfully
		var self = this;
		var plugin = this.plugin;
		
		app.hideProgress();
		app.showMessage('success', "The plugin was saved successfully.");
		window.scrollTo( 0, 0 );
		
		// copy active jobs to array
		var jobs = [];
		for (var id in app.activeJobs) {
			var job = app.activeJobs[id];
			if ((job.plugin == plugin.id) && !job.detached) jobs.push( job );
		}
		
		// if the plugin was disabled and there are running jobs, ask user to abort them
		if (!plugin.enabled && jobs.length) {
			app.confirm( '<span style="color:red">Abort Jobs</span>', "There " + ((jobs.length != 1) ? 'are' : 'is') + " currently still " + jobs.length + " active " + pluralize('job', jobs.length) + " using the disabled plugin <b>"+plugin.title+"</b>.  Do you want to abort " + ((jobs.length != 1) ? 'these' : 'it') + " now?", "Abort", function(result) {
				if (result) {
					app.showProgress( 1.0, "Aborting " + pluralize('Job', jobs.length) + "..." );
					app.api.post( 'app/abort_jobs', { plugin: plugin.id }, function(resp) {
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
	},
	
	get_plugin_edit_html: function() {
		// get html for editing a plugin (or creating a new one)
		var html = '';
		var plugin = this.plugin;
		
		// Internal ID
		if (plugin.id && this.isAdmin()) {
			html += get_form_table_row( 'Plugin ID', '<div style="font-size:14px;">' + plugin.id + '</div>' );
			html += get_form_table_caption( "The internal Plugin ID used for API calls.  This cannot be changed." );
			html += get_form_table_spacer();
		}
		
		// plugin title
		html += get_form_table_row( 'Plugin Name', '<input type="text" id="fe_ep_title" size="35" value="'+escape_text_field_value(plugin.title)+'" spellcheck="false"/>' );
		html += get_form_table_caption( "Enter a name for the Plugin.  Ideally it should be somewhat short, and Title Case." );
		html += get_form_table_spacer();
		
		// plugin enabled
		html += get_form_table_row( 'Active', '<input type="checkbox" id="fe_ep_enabled" value="1" ' + (plugin.enabled ? 'checked="checked"' : '') + '/><label for="fe_ep_enabled">Plugin Enabled</label>' );
		html += get_form_table_caption( "Select whether events using this Plugin should be enabled or disabled in the schedule." );
		html += get_form_table_spacer();
		
		// command
		html += get_form_table_row('Executable:', '<textarea id="fe_ep_command" style="width:550px; height:50px; resize:vertical;" spellcheck="false" onkeydown="return $P().stopEnter(this,event)">'+escape_text_field_value(plugin.command)+'</textarea>');
		html += get_form_table_caption(
			'Enter the filesystem path to your executable, including any command-line arguments.<br/>' + 
			'Do not include any pipes or redirects -- for those, please use the <b>Shell Plugin</b>.' 
		);
		html += get_form_table_spacer();
		
		// params editor
		html += get_form_table_row( 'Parameters:', '<div id="d_ep_params">' + this.get_plugin_params_html() + '</div>' );
		html += get_form_table_caption( 
			'<div style="margin-top:5px;">Parameters are passed to your Plugin via JSON, and as environment variables.<br/>' + 
			'For example, you can use this to customize the PATH variable, if your Plugin requires it.</div>' 
		);
		html += get_form_table_spacer();
		
		// advanced options
		var adv_expanded = !!(plugin.cwd || plugin.uid);
		html += get_form_table_row( 'Advanced', 
			'<div style="font-size:13px;'+(adv_expanded ? 'display:none;' : '')+'"><span class="link addme" onMouseUp="$P().expand_fieldset($(this))"><i class="fa fa-plus-square-o">&nbsp;</i>Advanced Options</span></div>' + 
			'<fieldset style="padding:10px 10px 0 10px; margin-bottom:5px;'+(adv_expanded ? '' : 'display:none;')+'"><legend class="link addme" onMouseUp="$P().collapse_fieldset($(this))"><i class="fa fa-minus-square-o">&nbsp;</i>Advanced Options</legend>' + 
				'<div class="plugin_params_label">Working Directory (CWD):</div>' + 
				'<div class="plugin_params_content"><input type="text" id="fe_ep_cwd" size="50" value="'+escape_text_field_value(plugin.cwd)+'" placeholder="" spellcheck="false"/></div>' + 
				
				'<div class="plugin_params_label">Run as User (UID):</div>' + 
				'<div class="plugin_params_content"><input type="text" id="fe_ep_uid" size="20" value="'+escape_text_field_value(plugin.uid)+'" placeholder="" spellcheck="false"/></div>' + 
				
			'</fieldset>'
		);
		html += get_form_table_caption(
			"Optionally enter a working directory path, and/or a custom UID for the Plugin.<br>" + 
			"The UID may be either numerical or a string ('root', 'wheel', etc.)." 
		);
		html += get_form_table_spacer();
		
		return html;
	},
	
	stopEnter: function(item, e) {
		// prevent user from hitting enter in textarea
		var c = e.which ? e.which : e.keyCode;
		if (c == 13) {
			if (e.preventDefault) e.preventDefault();
			// setTimeout("document.getElementById('"+item.id+"').focus();",0);	
			return false;
		}
	},
	
	get_plugin_params_html: function() {
		// return HTML for editing plugin params
		var params = this.plugin.params;
		var html = '';
		var ctype_labels = this.ctype_labels;
		
		var cols = ['Param ID', 'Label', 'Control Type', 'Description', 'Actions'];
		
		html += '<table class="data_table" width="100%">';
		html += '<tr><th>' + cols.join('</th><th>').replace(/\s+/g, '&nbsp;') + '</th></tr>';
		for (var idx = 0, len = params.length; idx < len; idx++) {
			var param = params[idx];
			var actions = [
				'<span class="link" onMouseUp="$P().edit_plugin_param('+idx+')"><b>Edit</b></span>',
				'<span class="link" onMouseUp="$P().delete_plugin_param('+idx+')"><b>Delete</b></span>'
			];
			html += '<tr>';
			html += '<td><span class="link" style="font-family:monospace; font-weight:bold; white-space:nowrap;" onMouseUp="$P().edit_plugin_param('+idx+')"><i class="fa fa-cog">&nbsp;&nbsp;</i>' + param.id + '</span></td>';
			// html += '<td><span class="link" style="font-weight:bold" onMouseUp="$P().edit_plugin_param('+idx+')">' + param.title + '</span></td>';
			if (param.title) html += '<td><b>&ldquo;' + param.title + '&rdquo;</b></td>';
			else html += '<td>(n/a)</td>';
			
			html += '<td>' + ctype_labels[param.type] + '</td>';
			
			var pairs = [];
			switch (param.type) {
				case 'text':
					pairs.push([ 'Size', param.size ]);
					if ('value' in param) pairs.push([ 'Default', '&ldquo;' + param.value + '&rdquo;' ]);
				break;
				
				case 'textarea':
					pairs.push([ 'Rows', param.rows ]);
				break;
				
				case 'checkbox':
					pairs.push([ 'Default', param.value ? 'Checked' : 'Unchecked' ]);
				break;
				
				case 'hidden':
					pairs.push([ 'Value', '&ldquo;' + param.value + '&rdquo;' ]);
				break;
				
				case 'select':
					pairs.push([ 'Items', '(' + param.items.join(', ') + ')' ]);
					if ('value' in param) pairs.push([ 'Default', '&ldquo;' + param.value + '&rdquo;' ]);
				break;
			}
			for (var idy = 0, ley = pairs.length; idy < ley; idy++) {
				pairs[idy] = '<b>' + pairs[idy][0] + ':</b> ' + pairs[idy][1];
			}
			html += '<td>' + pairs.join(', ') + '</td>';
			
			html += '<td>' + actions.join(' | ') + '</td>';
			html += '</tr>';
		} // foreach param
		if (!params.length) {
			html += '<tr><td colspan="'+cols.length+'" align="center" style="padding-top:10px; padding-bottom:10px; font-weight:bold;">';
			html += 'No params found.';
			html += '</td></tr>';
		}
		html += '</table>';
		
		html += '<div class="button mini" style="width:110px; margin:10px 0 0 0" onMouseUp="$P().edit_plugin_param(-1)">Add Parameter...</div>';
		
		return html;
	},
	
	edit_plugin_param: function(idx) {
		// show dialog to edit or add plugin param
		var self = this;
		var param = (idx > -1) ? this.plugin.params[idx] : {
			id: "",
			type: "text",
			title: "",
			size: 20,
			value: ""
		};
		this.plugin_param = param;
		
		var edit = (idx > -1) ? true : false;
		var html = '';
		
		var ctype_labels = this.ctype_labels;
		var ctype_options = [
			['text', ctype_labels.text],
			['textarea', ctype_labels.textarea],
			['checkbox', ctype_labels.checkbox],
			['select', ctype_labels.select],
			['hidden', ctype_labels.hidden]
		];
		
		html += '<table>' + 
			get_form_table_row('Parameter ID:', '<input type="text" id="fe_epp_id" size="20" value="'+escape_text_field_value(param.id)+'"/>') + 
			get_form_table_caption("Enter an ID for the parameter, which will be the JSON key.") + 
			get_form_table_spacer() + 
			get_form_table_row('Label:', '<input type="text" id="fe_epp_title" size="35" value="'+escape_text_field_value(param.title)+'"/>') + 
			get_form_table_caption("Enter a label, which will be displayed next to the control.") + 
			// get_form_table_spacer() + 
			// get_form_table_row('Control Type:', '<select id="fe_epp_ctype" onChange="$P().change_plugin_control_type()">' + render_menu_options(ctype_options, param.type, false) + '</select>') + 
			// get_form_table_caption("Select the type of control you want to display.") + 
		'</table>';
		
		html += '<fieldset style="margin-top:20px;">';
			html += '<legend><table cellspacing="0" cellpadding="0"><tr><td>Control&nbsp;Type:&nbsp;</td><td><select id="fe_epp_ctype" onChange="$P().change_plugin_control_type()">' + render_menu_options(ctype_options, param.type, false) + '</select></td></tr></table></legend>';
			html += '<div id="d_epp_editor" style="margin:5px 10px 5px 10px;">' + this.get_plugin_param_editor_html() + '</div>';
		html += '</fieldset>';
		
		app.confirm( '<i class="fa fa-cog">&nbsp;&nbsp;</i>' + (edit ? "Edit Parameter" : "Add Parameter"), html, edit ? "OK" : "Add", function(result) {
			app.clearError();
			
			if (result) {
				param = self.get_plugin_param_values();
				if (!param) return;
				
				if (edit) {
					// edit existing
					self.plugin.params[idx] = param;
				}
				else {
					// add new, check for unique id
					if (find_object(self.plugin.params, { id: param.id })) {
						return add.badField('fe_epp_id', "That parameter ID is already taken.  Please enter a unique value.");
					}
					
					self.plugin.params.push( param );
				}
				
				Dialog.hide();
				
				// refresh param list
				self.refresh_plugin_params();
				
			} // user clicked add
		} ); // app.confirm
		
		if (!edit) setTimeout( function() {
			$('#fe_epp_id').focus();
		}, 1 );
	},
	
	get_plugin_param_editor_html: function() {
		// get html for editing one plugin param, new or edit
		var param = this.plugin_param;
		var html = '<table>';
		
		switch (param.type) {
			case 'text':
				html += get_form_table_row('Size:', '<input type="text" id="fe_epp_text_size" size="5" value="'+escape_text_field_value(param.size)+'"/>');
				html += get_form_table_caption("Enter the size of the text field, in characters.");
				html += get_form_table_spacer('short transparent');
				html += get_form_table_row('Default Value:', '<input type="text" id="fe_epp_text_value" size="35" value="'+escape_text_field_value(param.value)+'" spellcheck="false"/>');
				html += get_form_table_caption("Enter the default value for the text field.");
			break;
			
			case 'textarea':
				html += get_form_table_row('Rows:', '<input type="text" id="fe_epp_textarea_rows" size="5" value="'+escape_text_field_value(param.rows || 5)+'"/>');
				html += get_form_table_caption("Enter the number of visible rows to allocate for the text box.");
				html += get_form_table_spacer('short transparent');
				html += get_form_table_row('Default Text:', '<textarea id="fe_epp_textarea_value" style="width:99%; height:60px; resize:none;" spellcheck="false">'+escape_text_field_value(param.value)+'</textarea>');
				html += get_form_table_caption("Optionally enter default text for the text box.");
			break;
			
			case 'checkbox':
				html += get_form_table_row('Default State:', '<select id="fe_epp_checkbox_value">' + render_menu_options([[0,'Unchecked'], [1,'Checked']], param.value, false) + '</select>');
				html += get_form_table_caption("Select whether the checkbox should be initially checked or unchecked.");
			break;
			
			case 'hidden':
				html += get_form_table_row('Value:', '<input type="text" id="fe_epp_hidden_value" size="35" value="'+escape_text_field_value(param.value)+'" spellcheck="false"/>');
				html += get_form_table_caption("Enter the value for the hidden field.");
			break;
			
			case 'select':
				html += get_form_table_row('Menu Items:', '<input type="text" id="fe_epp_select_items" size="35" value="'+escape_text_field_value(param.items ? param.items.join(', ') : '')+'" spellcheck="false"/>');
				html += get_form_table_caption("Enter a comma-separated list of items for the menu.");
				html += get_form_table_spacer('short transparent');
				html += get_form_table_row('Selected Item:', '<input type="text" id="fe_epp_select_value" size="20" value="'+escape_text_field_value(param.value)+'" spellcheck="false"/>');
				html += get_form_table_caption("Optionally enter an item to be selected by default.");
			break;
		} // switch type
		
		html += '</table>';
		return html;
	},
	
	get_plugin_param_values: function() {
		// build up new 'param' object based on edit form (gen'ed from get_plugin_edit_controls())
		var param = { type: this.plugin_param.type };
		
		param.id = trim( $('#fe_epp_id').val() );
		if (!param.id) return app.badField('fe_epp_id', "Please enter an ID for the plugin parameter.");
		if (!param.id.match(/^\w+$/)) return app.badField('fe_epp_id', "The parameter ID needs to be alphanumeric.");
		
		param.title = trim( $('#fe_epp_title').val() );
		if ((param.type != 'hidden') && !param.title) return app.badField('fe_epp_title', "Please enter a label for the plugin parameter.");
		
		switch (param.type) {
			case 'text':
				param.size = trim( $('#fe_epp_text_size').val() );
				if (!param.size.match(/^\d+$/)) return app.badField('fe_epp_text_size', "Please enter a size for the text field.");
				param.size = parseInt( param.size );
				if (!param.size) return app.badField('fe_epp_text_size', "Please enter a size for the text field.");
				if (param.size > 40) return app.badField('fe_epp_text_size', "The text field size needs to be between 1 and 40 characters.");
				param.value = trim( $('#fe_epp_text_value').val() );
			break;
			
			case 'textarea':
				param.rows = trim( $('#fe_epp_textarea_rows').val() );
				if (!param.rows.match(/^\d+$/)) return app.badField('fe_epp_textarea_rows', "Please enter a number of rows for the text box.");
				param.rows = parseInt( param.rows );
				if (!param.rows) return app.badField('fe_epp_textarea_rows', "Please enter a number of rows for the text box.");
				if (param.rows > 50) return app.badField('fe_epp_textarea_rows', "The text box rows needs to be between 1 and 50.");
				param.value = trim( $('#fe_epp_textarea_value').val() );
			break;
			
			case 'checkbox':
				param.value = parseInt( trim( $('#fe_epp_checkbox_value').val() ) );
			break;
			
			case 'hidden':
				param.value = trim( $('#fe_epp_hidden_value').val() );
			break;
			
			case 'select':
				if (!$('#fe_epp_select_items').val().match(/\S/)) return app.badField('fe_epp_select_items', "Please enter a comma-separated list of items for the menu.");
				param.items = trim( $('#fe_epp_select_items').val() ).split(/\,\s*/);
				param.value = trim( $('#fe_epp_select_value').val() );
				if (param.value && !find_in_array(param.items, param.value)) return app.badField('fe_epp_select_value', "The default value you entered was not found in the list of menu items.");
			break;
		}
		
		return param;
	},
	
	change_plugin_control_type: function() {
		// change dialog to new control type
		// render, resize and reposition dialog
		var new_type = $('#fe_epp_ctype').val();
		this.plugin_param.type = new_type;
		
		$('#d_epp_editor').html( this.get_plugin_param_editor_html() );
		
		// Dialog.autoResize();
	},
	
	delete_plugin_param: function(idx) {
		// delete selected plugin param, but do not save
		// don't prompt either, giving a UX hint that save did not occur
		this.plugin.params.splice( idx, 1 );
		this.refresh_plugin_params();
	},
	
	refresh_plugin_params: function() {
		// redraw plugin param area after change
		$('#d_ep_params').html( this.get_plugin_params_html() );
	},
	
	get_plugin_form_json: function() {
		// get plugin elements from form, used for new or edit
		var plugin = this.plugin;
		
		plugin.title = trim( $('#fe_ep_title').val() );
		if (!plugin.title) return app.badField('fe_ep_title', "Please enter a title for the Plugin.");
		
		plugin.enabled = $('#fe_ep_enabled').is(':checked') ? 1 : 0;
		
		plugin.command = trim( $('#fe_ep_command').val() );
		if (!plugin.command) return app.badField('fe_ep_command', "Please enter a filesystem path to the executable command for the Plugin.");
		if (plugin.command.match(/[\n\r]/)) return app.badField('fe_ep_command', "You must not include any newlines (EOLs) in your command.  Please consider using the built-in Shell Plugin.");
		
		plugin.cwd = trim( $('#fe_ep_cwd').val() );
		plugin.uid = trim( $('#fe_ep_uid').val() );
		
		if (plugin.uid.match(/^\d+$/)) plugin.uid = parseInt( plugin.uid );
		
		return plugin;
	}
	
});
