// Demo Web App
// Author: Joseph Huckaby
// Copyright (c) 2015 Joseph Huckaby and PixlCore.com
// Released under The MIT License

//
// Home Page/Tab
//

Class.subclass( Page, "Page.Home", {	
	
	onInit: function() {
		// called once at page load
		var html = '';
		
		// include initial HTML here, if you want
		
		this.div.html( html );
	},
	
	onActivate: function(args) {
		// page activation
		if (!args) args = {};
		this.args = args;
		
		app.setWindowTitle('Home');
		app.showTabBar(true);
		
		// activate page here (show live / updated content)
		var html = '';
		
		// fieldset
		html += '<fieldset><legend>Some Info</legend>';
		
			html += '<div class="info_label">Section 1</div>';
			html += '<div class="info_value">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</div>';
			
			html += '<div class="info_label">Section 2</div>';
			html += '<div class="info_value">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div>';
		
		html += '</fieldset>';
		
		// body text
		html += '<div style="margin-top:15px;">';
			html += 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
		html += '</div>';
		
		// buttons
		html += '<div style="margin-top:15px;">';
		
			html += '<div class="button left" onMouseUp="$P().demoSuccess()">Demo Success</div>';
			html += '<div class="button left" style="margin-left:15px;" onMouseUp="$P().demoWarning()">Demo Warning</div>';
			html += '<div class="button left" style="margin-left:15px;" onMouseUp="$P().demoError()">Demo Error</div>';
			html += '<div class="button left" style="margin-left:15px;" onMouseUp="$P().demoProgress()">Demo Progress</div>';
			html += '<div class="button left" style="margin-left:15px;" onMouseUp="$P().demoDialog()">Demo Dialog</div>';
		
		html += '</div>';
		
		this.div.html( html );
		return true;
	},
	
	demoSuccess: function() {
		app.showMessage('success', "This is a successful message.");
	},
	
	demoWarning: function() {
		app.showMessage('warning', "This is a warning message.");
	},
	
	demoError: function() {
		app.showMessage('error', "This is an error message.");
	},
	
	demoProgress: function() {
		app.showProgress( 0, "Doing something..." );
		
		var progress = 0;
		var timer = setInterval( function() {
			progress += 0.03;
			app.showProgress( progress );
			if (progress > 1.0) {
				app.hideProgress();
				clearTimeout( timer );
			}
		}, 100 );
	},
	
	demoDialog: function() {
		app.confirm( 'Add Vegetable', "Are you sure you want to add the vegetable <b>celery</b>?", "Add", function(result) {
			if (result) {
				app.hideDialog();
				app.showMessage('success', "Celery added successfully.");
			}
		} );
	},
	
	onDeactivate: function() {
		// called when page is deactivated
		// this.div.html( '' );
		return true;
	}
	
} );

//
// MoreDemos Page/Tab
//

Class.subclass( Page, "Page.MoreDemos", {	
	
	defaultSubPage: 'form',
	
	onInit: function() {
		// called once at page load
	},
	
	onActivate: function(args) {
		// page activation
		if (!args) args = {};
		if (!args.sub) args.sub = this.defaultSubPage;
		this.args = args;
		
		app.showTabBar(true);
		
		// save current nav anchor for returning to sub-tab later
		this.tab[0]._page_id = Nav.currentAnchor();
		
		// jump to sub-page based on has query
		this['gosub_'+args.sub](args);
		
		return true;
	},
	
	gosub_form: function(args) {
		// show form demo sub-page
		app.setWindowTitle( "Form Demo" );
		var html = '';
		
		html += this.getSidebarTabs( args.sub,
			[
				['form', "Form Demo"],
				['table', "Table Demo"]
			]
		);
		
		html += '<div style="padding:20px;"><div class="subtitle">New Vegetable</div></div>';
		
		html += '<div style="padding:0px 20px 50px 20px">';
		html += '<center><table style="margin:0;">';
		
		var veg = {
			name: '',
			fresh: true,
			type: ''
		};
		
		// Vegetable Name
		html += get_form_table_row( 'Name', '<input type="text" id="fe_ee_title" size="35" value="'+escape_text_field_value(veg.name)+'" spellcheck="false"/>' );
		html += get_form_table_caption( "Enter a title for the vegetable, which will be displayed on the main salad." );
		html += get_form_table_spacer();
		
		// Quality
		html += get_form_table_row( 'Quality', '<input type="checkbox" id="fe_ee_enabled" value="1" ' + (veg.fresh ? 'checked="checked"' : '') + '/><label for="fe_ee_enabled">Farm Fresh</label>' );
		html += get_form_table_caption( "Select whether the vegetable should be farm fresh or not." );
		html += get_form_table_spacer();
		
		// Type
		var veg_types = ['Carrot', 'Celery', 'Beet', 'Lettuce'];
		html += get_form_table_row( 'Type', '<select id="fe_ee_cat">' + render_menu_options(veg_types, veg.type, false) + '</select>' );
		html += get_form_table_caption( "Select a category for the vegetable (this may limit the maximum available, etc.)" );
		html += get_form_table_spacer();
		
		// notes
		html += get_form_table_row( 'Notes', '<textarea id="fe_ee_notes" style="width:600px; height:80px;">'+escape_text_field_value(veg.notes)+'</textarea>' );
		html += get_form_table_caption( "Optionally enter notes for the veg, which will be included in all e-mail notifications." );
		html += get_form_table_spacer();
		
		// buttons at bottom
		html += '<tr><td colspan="2" align="center">';
			html += '<div style="height:30px;"></div>';
			
			html += '<table><tr>';
				html += '<td><div class="button" style="width:120px; font-weight:normal;" onMouseUp="$P().cancelEdit()">Cancel</div></td>';
				html += '<td width="50">&nbsp;</td>';
				
				html += '<td><div class="button" style="width:120px;" onMouseUp="$P().saveChanges()">Save Changes</div></td>';
			html += '</tr></table>';
			
		html += '</td></tr>';
		
		html += '</table></center>';
		html += '</div>'; // table wrapper div
		
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	cancelEdit: function() {
		// cancel edit, return home
		Nav.go('Home');
	},
	
	saveChanges: function() {
		// simulate save changes
		app.showMessage('success', "Changes saved successfully.");
	},
	
	gosub_table: function(args) {
		// show table demo sub-page
		app.setWindowTitle( "Table Demo" );
		var html = '';
		
		html += this.getSidebarTabs( args.sub,
			[
				['form', "Form Demo"],
				['table', "Table Demo"]
			]
		);
		
		var cols = ['Vegetable Name', 'Color', 'Size', 'Quantity', 'Price', 'Date Added', 'Date Modified', 'Actions'];
		
		html += '<div style="padding:20px 20px 30px 20px">';
		
		html += '<div class="subtitle">';
			html += 'All Vegetables';
			// html += '<div class="clear"></div>';
		html += '</div>';
		
		// sort by title ascending
		this.vegetables = vegetables.sort( function(a, b) {
			return (b.title < a.title) ? 1 : -1;
		} );
		
		var offset = args.offset || 0;
		var limit = args.limit || 5;
		
		// render table
		html += this.getPaginatedTable({
			cols: cols,
			rows: this.vegetables.slice( offset, offset + limit ),
			data_type: 'vegetable',
			offset: offset,
			limit: limit,
			total: vegetables.length,
			
			callback: function(veg, idx) {
				var actions = [
					'<span class="link" onMouseUp="$P().editVeg('+idx+')"><b>Edit</b></span>',
					'<span class="link" onMouseUp="$P().deleteveg('+idx+')"><b>Delete</b></span>'
				];
				
				var tds = [
					'<div class="td_big"><span class="link" onMouseUp="$P().editVeg('+idx+')">' + veg.name + '</span></div>',
					veg.color,
					veg.size,
					commify( veg.quantity ),
					veg.price,
					get_short_date_time( veg.created ),
					get_short_date_time( veg.created ),
					actions.join(' | ')
				];
				return tds;
			}
		});
		
		html += '<div style="height:30px;"></div>';
		html += '<center><table><tr>';
			html += '<td><div class="button" style="width:130px;" onMouseUp="$P().editVeg(-1)">Add Vegetable...</div></td>';
		html += '</tr></table></center>';
		
		html += '</div>'; // padding
		html += '</div>'; // sidebar tabs
		
		this.div.html( html );
	},
	
	editVeg: function(idx) {
		// add or edit vegetable
		Nav.go( 'MoreDemos?sub=form' );
	},
	
	deleteVeg: function(idx) {
		// delete vegetable
	},
	
	onDeactivate: function() {
		// called when page is deactivated
		// this.div.html( '' );
		return true;
	}
	
} );

//
// Sample data for table
//

window.vegetables = [
	
	{ name: 'Celery', color: 'Green', size: '1ft', quantity: 450, price: '$2.75', created: 1442984544 },
	{ name: 'Beets', color: 'Purple', size: '4in', quantity: 30, price: '$3.50', created: 1442380043 },
	{ name: 'Lettuce', color: 'Green', size: '1ft', quantity: 1000, price: '$2.50', created: 1442264863 },
	{ name: 'Carrots', color: 'Orange', size: '8in', quantity: 60, price: '$4.00', created: 1442084869 },
	{ name: 'Rhubarb', color: 'Purple', size: '2ft', quantity: 190, price: '$3.99', created: 1441724876 },
	{ name: 'Amaranth', color: 'Green', size: '1in', quantity: 270, price: '$0.50', created: 1441184886 },
	{ name: 'Arugula', color: 'Green', size: '1ft', quantity: 0, price: '$4.30', created: 1439384893 },
	{ name: 'Brussels sprout', color: 'Green', size: '2in', quantity: 910, price: '$9.50', created: 1438934904 },
	{ name: 'Cabbage', color: 'Green', size: '1ft', quantity: 620, price: '$4.75', created: 1435784914 },
	{ name: 'Watercress', color: 'White', size: '3in', quantity: 1300, price: '$11.00', created: 1370984920 }
	
];
