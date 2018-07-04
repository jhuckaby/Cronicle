// Cronicle Admin Page -- Categories

Class.add( Page.Admin, {
	
	gosub_categories: function(args) {
		// show category list
		this.div.removeClass('loading');
		app.setWindowTitle( "Categories" );
		
		var size = get_inner_window_size();
		var col_width = Math.floor( ((size.width * 0.9) + 200) / 5 );
		
		var html = '';
		
		html += this.getSidebarTabs( 'categories',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		var cols = ['Title', 'Description', 'Assigned Events', 'Max Concurrent', 'Actions'];
		
		html += '<div style="padding:20px 20px 30px 20px">';
		
		html += '<div class="subtitle">';
			html += 'Event Categories';
			// html += '<div class="clear"></div>';
		html += '</div>';
		
		// sort by title ascending
		this.categories = app.categories.sort( function(a, b) {
			// return (b.title < a.title) ? 1 : -1;
			return a.title.toLowerCase().localeCompare( b.title.toLowerCase() );
		} );
		
		// render table
		var self = this;
		html += this.getBasicTable( this.categories, cols, 'category', function(cat, idx) {
			var actions = [
				'<span class="link" onMouseUp="$P().edit_category('+idx+')"><b>Edit</b></span>',
				'<span class="link" onMouseUp="$P().delete_category('+idx+')"><b>Delete</b></span>'
			];
			
			var cat_events = find_objects( app.schedule, { category: cat.id } );
			var num_events = cat_events.length;
			
			var tds = [
				'<div class="td_big"><span class="link" onMouseUp="$P().edit_category('+idx+')">' + self.getNiceCategory(cat, col_width) + '</span></div>',
				'<div class="ellip" style="max-width:'+col_width+'px;">' + (cat.description || '(No description)') + '</div>',
				num_events ? commify( num_events ) : '(None)',
				cat.max_children ? commify(cat.max_children) : '(No limit)',
				actions.join(' | ')
			];
			
			if (cat && cat.color) {
				if (tds.className) tds.className += ' '; else tds.className = '';
				tds.className += cat.color;
			}
			
			if (!cat.enabled) {
				if (tds.className) tds.className += ' '; else tds.className = '';
				tds.className += 'disabled';
			}
			
			return tds;
		} );
		
		html += '<div style="height:30px;"></div>';
		html += '<center><table><tr>';
			html += '<td><div class="button" style="width:130px;" onMouseUp="$P().edit_category(-1)"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Add Category...</div></td>';
		html += '</tr></table></center>';
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	edit_category: function(idx) {
		// jump to edit sub
		if (idx > -1) Nav.go( '#Admin?sub=edit_category&id=' + this.categories[idx].id );
		else Nav.go( '#Admin?sub=new_category' );
	},
	
	delete_category: function(idx) {
		// delete key from search results
		this.category = this.categories[idx];
		this.show_delete_category_dialog();
	},
	
	gosub_new_category: function(args) {
		// create new Category
		var html = '';
		app.setWindowTitle( "New Category" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'new_category',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['new_category', "New Category"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">Add New Category</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center><table style="margin:0;">';
		
		this.category = {
			title: "",
			description: "",
			max_children: 0,
			enabled: 1
		};
		
		html += this.get_category_edit_html();
		
		// buttons at bottom
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancel_category_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().do_new_category()"><i class="fa fa-plus-circle">&nbsp;&nbsp;</i>Add Category</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table></center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
		
		setTimeout( function() {
			$('#fe_ec_title').focus();
		}, 1 );
	},
	
	cancel_category_edit: function() {
		// cancel editing category and return to list
		Nav.go( 'Admin?sub=categories' );
	},
	
	do_new_category: function(force) {
		// create new category
		app.clearError();
		var category = this.get_category_form_json();
		if (!category) return; // error
		
		// pro-tip: embed id in title as bracketed prefix
		if (category.title.match(/^\[(\w+)\]\s*(.+)$/)) {
			category.id = RegExp.$1;
			category.title = RegExp.$2;
		}
		
		this.category = category;
		
		app.showProgress( 1.0, "Creating category..." );
		app.api.post( 'app/create_category', category, this.new_category_finish.bind(this) );
	},
	
	new_category_finish: function(resp) {
		// new Category created successfully
		app.hideProgress();
		
		// Can't nav to edit_category yet, websocket may not have received update yet
		// Nav.go('Admin?sub=edit_category&id=' + resp.id);
		Nav.go('Admin?sub=categories');
		
		setTimeout( function() {
			app.showMessage('success', "The new category was created successfully.");
		}, 150 );
	},
	
	gosub_edit_category: function(args) {
		// edit existing Category
		var html = '';
		this.category = find_object( app.categories, { id: args.id } );
		
		app.setWindowTitle( "Editing Category \"" + (this.category.title) + "\"" );
		this.div.removeClass('loading');
		
		html += this.getSidebarTabs( 'edit_category',
			[
				['activity', "Activity Log"],
				['api_keys', "API Keys"],
				['categories', "Categories"],
				['edit_category', "Edit Category"],
				['plugins', "Plugins"],
				['servers', "Servers"],
				['users', "Users"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">Editing Category &ldquo;' + (this.category.title) + '&rdquo;</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center>';
		html += '<table style="margin:0;">';
		
		html += this.get_category_edit_html();
		
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:130px; font-weight:normal;" onMouseUp="$P().cancel_category_edit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:130px; font-weight:normal;" onMouseUp="$P().show_delete_category_dialog()">Delete Category...</div></td>';
				html += '<td width="50">&nbsp;</td>';
				html += '<td><div class="button" style="width:130px;" onMouseUp="$P().do_save_category()"><i class="fa fa-floppy-o">&nbsp;&nbsp;</i>Save Changes</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table>';
		html += '</center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	do_save_category: function() {
		// save changes to category
		app.clearError();
		var category = this.get_category_form_json();
		if (!category) return; // error
		
		this.category = category;
		
		app.showProgress( 1.0, "Saving category..." );
		app.api.post( 'app/update_category', category, this.save_category_finish.bind(this) );
	},
	
	save_category_finish: function(resp, tx) {
		// new category saved successfully
		var self = this;
		var category = this.category;
		
		app.hideProgress();
		app.showMessage('success', "The category was saved successfully.");
		window.scrollTo( 0, 0 );
		
		// copy active jobs to array
		var jobs = [];
		for (var id in app.activeJobs) {
			var job = app.activeJobs[id];
			if ((job.category == category.id) && !job.detached) jobs.push( job );
		}
		
		// if the cat was disabled and there are running jobs, ask user to abort them
		if (!category.enabled && jobs.length) {
			app.confirm( '<span style="color:red">Abort Jobs</span>', "There " + ((jobs.length != 1) ? 'are' : 'is') + " currently still " + jobs.length + " active " + pluralize('job', jobs.length) + " using the disabled category <b>"+category.title+"</b>.  Do you want to abort " + ((jobs.length != 1) ? 'these' : 'it') + " now?", "Abort", function(result) {
				if (result) {
					app.showProgress( 1.0, "Aborting " + pluralize('Job', jobs.length) + "..." );
					app.api.post( 'app/abort_jobs', { category: category.id }, function(resp) {
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
	
	show_delete_category_dialog: function() {
		// show dialog confirming category delete action
		var self = this;
		var category = this.category;
		var cat = this.category;
		
		// check for events first
		var cat_events = find_objects( app.schedule, { category: cat.id } );
		var num_events = cat_events.length;
		if (num_events) return app.doError("Sorry, you cannot delete a category that has events assigned to it.");
		
		// proceed with delete
		var self = this;
		app.confirm( '<span style="color:red">Delete Category</span>', "Are you sure you want to delete the category <b>"+cat.title+"</b>?  There is no way to undo this action.", "Delete", function(result) {
			if (result) {
				app.showProgress( 1.0, "Deleting Category..." );
				app.api.post( 'app/delete_category', cat, self.delete_category_finish.bind(self) );
			}
		} );
	},
	
	delete_category_finish: function(resp, tx) {
		// finished deleting category
		var self = this;
		app.hideProgress();
		
		Nav.go('Admin?sub=categories', 'force');
		
		setTimeout( function() {
			app.showMessage('success', "The category '"+self.category.title+"' was deleted successfully.");
		}, 150 );
	},
	
	get_category_edit_html: function() {
		// get html for editing a category (or creating a new one)
		var html = '';
		var category = this.category;
		var cat = this.category;
		
		// Internal ID
		if (cat.id && this.isAdmin()) {
			html += get_form_table_row( 'Category ID', '<div style="font-size:14px;">' + cat.id + '</div>' );
			html += get_form_table_caption( "The internal Category ID used for API calls.  This cannot be changed." );
			html += get_form_table_spacer();
		}
		
		// title
		html += get_form_table_row('Category Title:', '<input type="text" id="fe_ec_title" size="25" value="'+escape_text_field_value(cat.title)+'"/>') + 
			get_form_table_caption("Enter a title for the category, short and sweet.") + 
			get_form_table_spacer();
		
		// cat enabled
		html += get_form_table_row( 'Active', '<input type="checkbox" id="fe_ec_enabled" value="1" ' + (cat.enabled ? 'checked="checked"' : '') + '/><label for="fe_ec_enabled">Category Enabled</label>' );
		html += get_form_table_caption( "Select whether events in this category should be enabled or disabled in the schedule." );
		html += get_form_table_spacer();
		
		// description
		html += get_form_table_row('Description:', '<textarea id="fe_ec_desc" style="width:500px; height:50px; resize:vertical;">'+escape_text_field_value(cat.description)+'</textarea>') + 
			get_form_table_caption("Optionally enter a description for the category.") + 
			get_form_table_spacer();
		
		// max concurrent
		html += get_form_table_row('Max Concurrent:', '<select id="fe_ec_max_children">' + render_menu_options([ [0,'No Limit'], 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32 ], cat.max_children, true) + '</select>') + 
			get_form_table_caption("Select the maximum number of jobs allowed to run concurrently in this category.");
		html += get_form_table_spacer();
		
		// color
		var current_color = cat.color || 'plain';
		var swatch_html = '';
		var colors = ['plain', 'red', 'green', 'blue', 'skyblue', 'yellow', 'purple', 'orange'];
		for (var idx = 0, len = colors.length; idx < len; idx++) {
			var color = colors[idx];
			swatch_html += '<div class="swatch ' + color + ' ' + ((current_color == color) ? 'active' : '') + '" onMouseUp="$P().select_color(\''+color+'\')"></div>';
		}
		swatch_html += '<div class="clear"></div>';
		
		html += get_form_table_row( 'Highlight Color', swatch_html );
		html += get_form_table_caption( "Optionally select a highlight color for the category, which will show on the schedule." );
		html += get_form_table_spacer();
		
		// default notification options
		var notif_expanded = !!(cat.notify_success || cat.notify_fail || cat.web_hook);
		html += get_form_table_row( 'Notification', 
			'<div style="font-size:13px;'+(notif_expanded ? 'display:none;' : '')+'"><span class="link addme" onMouseUp="$P().expand_fieldset($(this))"><i class="fa fa-plus-square-o">&nbsp;</i>Default Notification Options</span></div>' + 
			'<fieldset style="padding:10px 10px 0 10px; margin-bottom:5px;'+(notif_expanded ? '' : 'display:none;')+'"><legend class="link addme" onMouseUp="$P().collapse_fieldset($(this))"><i class="fa fa-minus-square-o">&nbsp;</i>Default Notification Options</legend>' + 
				'<div class="plugin_params_label">Default Email on Success:</div>' + 
				'<div class="plugin_params_content"><input type="text" id="fe_ec_notify_success" size="50" value="'+escape_text_field_value(cat.notify_success)+'" placeholder="email@sample.com" spellcheck="false" onChange="$P().update_add_remove_me($(this))"/><span class="link addme" onMouseUp="$P().add_remove_me($(this).prev())"></span></div>' + 
				
				'<div class="plugin_params_label">Default Email on Failure:</div>' + 
				'<div class="plugin_params_content"><input type="text" id="fe_ec_notify_fail" size="50" value="'+escape_text_field_value(cat.notify_fail)+'" placeholder="email@sample.com" spellcheck="false" onChange="$P().update_add_remove_me($(this))"/><span class="link addme" onMouseUp="$P().add_remove_me($(this).prev())"></span></div>' + 
				
				'<div class="plugin_params_label">Default Web Hook URL:</div>' + 
				'<div class="plugin_params_content"><input type="text" id="fe_ec_web_hook" size="60" value="'+escape_text_field_value(cat.web_hook)+'" placeholder="http://" spellcheck="false"/></div>' + 
			'</fieldset>'
		);
		html += get_form_table_caption( "Optionally enter default e-mail addresses for notification, and/or a web hook URL.<br/>Note that events can override any of these notification settings." );
		html += get_form_table_spacer();
		
		// default resource limits
		var res_expanded = !!(cat.memory_limit || cat.memory_sustain || cat.cpu_limit || cat.cpu_sustain || cat.log_max_size);
		html += get_form_table_row( 'Limits', 
			'<div style="font-size:13px;'+(res_expanded ? 'display:none;' : '')+'"><span class="link addme" onMouseUp="$P().expand_fieldset($(this))"><i class="fa fa-plus-square-o">&nbsp;</i>Default Resource Limits</span></div>' + 
			'<fieldset style="padding:10px 10px 0 10px; margin-bottom:5px;'+(res_expanded ? '' : 'display:none;')+'"><legend class="link addme" onMouseUp="$P().collapse_fieldset($(this))"><i class="fa fa-minus-square-o">&nbsp;</i>Default Resource Limits</legend>' + 
				
				'<div class="plugin_params_label">Default CPU Limit:</div>' + 
				'<div class="plugin_params_content"><table cellspacing="0" cellpadding="0" class="fieldset_params_table"><tr>' + 
					'<td style="padding-right:2px"><input type="checkbox" id="fe_ec_cpu_enabled" value="1" '+(cat.cpu_limit ? 'checked="checked"' : '')+' /></td>' + 
					'<td><label for="fe_ec_cpu_enabled">Abort job if CPU exceeds</label></td>' + 
					'<td><input type="text" id="fe_ec_cpu_limit" style="width:30px;" value="'+(cat.cpu_limit || 0)+'"/>%</td>' + 
					'<td>for</td>' + 
					'<td>' + this.get_relative_time_combo_box( 'fe_ec_cpu_sustain', cat.cpu_sustain, 'fieldset_params_table' ) + '</td>' + 
				'</tr></table></div>' + 
				
				'<div class="plugin_params_label">Default Memory Limit:</div>' + 
				'<div class="plugin_params_content"><table cellspacing="0" cellpadding="0" class="fieldset_params_table"><tr>' + 
					'<td style="padding-right:2px"><input type="checkbox" id="fe_ec_memory_enabled" value="1" '+(cat.memory_limit ? 'checked="checked"' : '')+' /></td>' + 
					'<td><label for="fe_ec_memory_enabled">Abort job if memory exceeds</label></td>' + 
					'<td>' + this.get_relative_size_combo_box( 'fe_ec_memory_limit', cat.memory_limit, 'fieldset_params_table' ) + '</td>' + 
					'<td>for</td>' + 
					'<td>' + this.get_relative_time_combo_box( 'fe_ec_memory_sustain', cat.memory_sustain, 'fieldset_params_table' ) + '</td>' + 
				'</tr></table></div>' + 
				
				'<div class="plugin_params_label">Default Log Size Limit:</div>' + 
				'<div class="plugin_params_content"><table cellspacing="0" cellpadding="0" class="fieldset_params_table"><tr>' + 
					'<td style="padding-right:2px"><input type="checkbox" id="fe_ec_log_enabled" value="1" '+(cat.log_max_size ? 'checked="checked"' : '')+' /></td>' + 
					'<td><label for="fe_ec_log_enabled">Abort job if log file exceeds</label></td>' + 
					'<td>' + this.get_relative_size_combo_box( 'fe_ec_log_limit', cat.log_max_size, 'fieldset_params_table' ) + '</td>' + 
				'</tr></table></div>' + 
				
			'</fieldset>'
		);
		html += get_form_table_caption( 
			"Optionally set default CPU load, memory usage and log size limits for the category.<br/>Note that events can override any of these limits."
		);
		html += get_form_table_spacer();
		
		setTimeout( function() {
			$P().update_add_remove_me( $('#fe_ec_notify_success, #fe_ec_notify_fail') );
		}, 1 );
		
		return html;
	},
	
	select_color: function(color) {
		// click on a color swatch
		this.category.color = (color == 'plain') ? '' : color;
		$('.swatch').removeClass('active');
		$('.swatch.'+color).addClass('active');
	},
	
	get_category_form_json: function() {
		// get category elements from form, used for new or edit
		var category = this.category;
		
		category.title = $('#fe_ec_title').val();
		if (!category.title.length) {
			return app.badField('#fe_ec_title', "Please enter a title for the category.");
		}
		
		category.enabled = $('#fe_ec_enabled').is(':checked') ? 1 : 0;
		category.description = $('#fe_ec_desc').val();
		category.max_children = parseInt( $('#fe_ec_max_children').val() );
		category.notify_success = $('#fe_ec_notify_success').val();
		category.notify_fail = $('#fe_ec_notify_fail').val();
		category.web_hook = $('#fe_ec_web_hook').val();
		
		// cpu limit
		if ($('#fe_ec_cpu_enabled').is(':checked')) {
			category.cpu_limit = parseInt( $('#fe_ec_cpu_limit').val() );
			if (isNaN(category.cpu_limit)) return app.badField('fe_ec_cpu_limit', "Please enter an integer value for the CPU limit.");
			if (category.cpu_limit < 0) return app.badField('fe_ec_cpu_limit', "Please enter a positive integer for the CPU limit.");
			
			category.cpu_sustain = parseInt( $('#fe_ec_cpu_sustain').val() ) * parseInt( $('#fe_ec_cpu_sustain_units').val() );
			if (isNaN(category.cpu_sustain)) return app.badField('fe_ec_cpu_sustain', "Please enter an integer value for the CPU sustain period.");
			if (category.cpu_sustain < 0) return app.badField('fe_ec_cpu_sustain', "Please enter a positive integer for the CPU sustain period.");
		}
		else {
			category.cpu_limit = 0;
			category.cpu_sustain = 0;
		}
		
		// mem limit
		if ($('#fe_ec_memory_enabled').is(':checked')) {
			category.memory_limit = parseInt( $('#fe_ec_memory_limit').val() ) * parseInt( $('#fe_ec_memory_limit_units').val() );
			if (isNaN(category.memory_limit)) return app.badField('fe_ec_memory_limit', "Please enter an integer value for the memory limit.");
			if (category.memory_limit < 0) return app.badField('fe_ec_memory_limit', "Please enter a positive integer for the memory limit.");
			
			category.memory_sustain = parseInt( $('#fe_ec_memory_sustain').val() ) * parseInt( $('#fe_ec_memory_sustain_units').val() );
			if (isNaN(category.memory_sustain)) return app.badField('fe_ec_memory_sustain', "Please enter an integer value for the memory sustain period.");
			if (category.memory_sustain < 0) return app.badField('fe_ec_memory_sustain', "Please enter a positive integer for the memory sustain period.");
		}
		else {
			category.memory_limit = 0;
			category.memory_sustain = 0;
		}
		
		// job log file size limit
		if ($('#fe_ec_log_enabled').is(':checked')) {
			category.log_max_size = parseInt( $('#fe_ec_log_limit').val() ) * parseInt( $('#fe_ec_log_limit_units').val() );
			if (isNaN(category.log_max_size)) return app.badField('fe_ec_log_limit', "Please enter an integer value for the log size limit.");
			if (category.log_max_size < 0) return app.badField('fe_ec_log_limit', "Please enter a positive integer for the log size limit.");
		}
		else {
			category.log_max_size = 0;
		}
		
		return category;
	}
	
});