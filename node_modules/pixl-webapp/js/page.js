/**
 * WebApp 1.0 Page Manager
 * Author: Joseph Huckaby
 * Copyright (c) 2010 Joseph Huckaby
 * Released under the MIT License.
 **/

var Nav = {
	
	/**
	 * Virtual Page Navigation System
	 **/
	
	loc: '',
	old_loc: '',
	inited: false,
	nodes: [],
	
	init: function() {
		// initialize nav system
		assert( window.config, "window.config not present.");
		
		if (!this.inited) {
			this.inited = true;
			this.loc = 'init';
			this.monitor();
			
			if (window.addEventListener) {
				window.addEventListener("hashchange", function(event) {
					Nav.monitor();
				}, false);
			}
			else {
				window.onhashchange = function() { Nav.monitor(); };
			}
		}
	},
	
	monitor: function() {
		// monitor browser location and activate handlers as needed
		var parts = window.location.href.split(/\#/);
		var anchor = parts[1];
		if (!anchor) anchor = config.DefaultPage || 'Main';
		
		var full_anchor = '' + anchor;
		var sub_anchor = '';
		
		anchor = anchor.replace(/\%7C/, '|');
		if (anchor.match(/\|(\w+)$/)) {
			// inline section anchor after article name, pipe delimited
			sub_anchor = RegExp.$1.toLowerCase();
			anchor = anchor.replace(/\|(\w+)$/, '');
		}
		
		if ((anchor != this.loc) && !anchor.match(/^_/)) { // ignore doxter anchors
			Debug.trace('nav', "Caught navigation anchor: " + full_anchor);
			
			var page_name = '';
			var page_args = {};
			if (full_anchor.match(/^\w+\?.+/)) {
				parts = full_anchor.split(/\?/);
				page_name = parts[0];
				page_args = parse_query_string( parts[1] );
			}
			else {
				parts = full_anchor.split(/\//);
				page_name = parts[0];
				page_args = {};
			}
			
			Debug.trace('nav', "Calling page: " + page_name + ": " + JSON.stringify(page_args));
			Dialog.hide();
			// app.hideMessage();
			var result = app.page_manager.click( page_name, page_args );
			if (result) {
				this.old_loc = this.loc;
				if (this.old_loc == 'init') this.old_loc = config.DefaultPage || 'Main';
				this.loc = anchor;
			}
			else {
				// current page aborted navigation -- recover current page without refresh
				this.go( this.loc );
			}
		}
		else if (sub_anchor != this.sub_anchor) {
			Debug.trace('nav', "Caught sub-anchor: " + sub_anchor);
			$P().gosub( sub_anchor );
		} // sub-anchor changed
		
		this.sub_anchor = sub_anchor;	
	},
	
	go: function(anchor, force) {
		// navigate to page
		anchor = anchor.replace(/^\#/, '');
		if (force) {
			if (anchor == this.loc) {
				this.loc = 'init';
				this.monitor();
			}
			else {
				this.loc = 'init';
				window.location.href = '#' + anchor;
			}
		}
		else {
			window.location.href = '#' + anchor;
		}
	},
	
	prev: function() {
		// return to previous page
		this.go( this.old_loc || config.DefaultPage || 'Main' );
	},
	
	refresh: function() {
		// re-nav to current page
		this.loc = 'refresh';
		this.monitor();
	},
	
	currentAnchor: function() {
		// return current page anchor
		var parts = window.location.href.split(/\#/);
		var anchor = parts[1] || '';
		var sub_anchor = '';
		
		anchor = anchor.replace(/\%7C/, '|');
		if (anchor.match(/\|(\w+)$/)) {
			// inline section anchor after article name, pipe delimited
			sub_anchor = RegExp.$1.toLowerCase();
			anchor = anchor.replace(/\|(\w+)$/, '');
		}
		
		return anchor;
	}
	
}; // Nav

//
// Page Base Class
//

Class.create( 'Page', {
	// 'Page' class is the abstract base class for all pages
	// Each web component calls this class daddy
	
	// member variables
	ID: '', // ID of DIV for component
	data: null,   // holds all data for freezing
	active: false, // whether page is active or not
	sidebar: true, // whether to show sidebar or not
	
	// methods
	__construct: function(config, div) {
		if (!config) return;
		
		// class constructor, import config into self
		this.data = {};
		if (!config) config = {};
		for (var key in config) this[key] = config[key];
		
		this.div = div || $('#page_' + this.ID);
		assert(this.div, "Cannot find page div: page_" + this.ID);
		
		this.tab = $('#tab_' + this.ID);
	},
	
	onInit: function() {
		// called with the page is initialized
	},
	
	onActivate: function() {
		// called when page is activated
		return true;
	},
	
	onDeactivate: function() {
		// called when page is deactivated
		return true;
	},
	
	show: function() {
		// show page
		this.div.show();
	},
	
	hide: function() {
		this.div.hide();
	},
	
	gosub: function(anchor) {
		// go to sub-anchor (article section link)
	},
	
	getSidebarTabs: function(current, tabs) {
		// get html for sidebar tabs
		var html = '';
		
		html += '<div style="margin-left:151px; position:relative; min-height:400px;">';
		html += '<div class="side_tab_bar" style="position:absolute; left:-161px;">';
		html += '<div style="height:50px;"></div>';
		
		for (var idx = 0, len = tabs.length; idx < len; idx++) {
			var tab = tabs[idx];
			if (typeof(tab) == 'string') html += tab;
			else {
				var class_name = 'inactive';
				var link = 'Nav.go(\''+this.ID+'?sub='+tab[0]+'\')';
				
				if (tab[0] == current) {
					class_name = 'active';
					link = '';
				}
				html += '<div class="tab side '+class_name+'" onMouseUp="'+link+'"><span class="content">'+tab[1]+'</span></div>';
			}
		}
		
		html += '</div>';
		
		return html;
	},
	
	getPaginatedTable: function(resp, cols, data_type, callback) {
		// get html for paginated table
		// dual-calling convention: (resp, cols, data_type, callback) or (args)
		var args = null;
		if (arguments.length == 1) {
			// custom args calling convention
			args = arguments[0];
			
			// V2 API
			if (!args.resp && args.rows && args.total) {
				args.resp = {
					rows: args.rows,
					list: { length: args.total }
				};
			}
		}
		else {
			// classic calling convention
			args = {
				resp: arguments[0],
				cols: arguments[1],
				data_type: arguments[2],
				callback: arguments[3],
				limit: this.args.limit,
				offset: this.args.offset || 0
			};
		}
		
		var resp = args.resp;
		var cols = args.cols;
		var data_type = args.data_type;
		var callback = args.callback;
		var cpl = args.pagination_link || '';
		var html = '';
		
		// pagination header
		html += '<div class="pagination">';
		html += '<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr>';
		
		var results = {
			limit: args.limit,
			offset: args.offset || 0,
			total: resp.list.length
		};
		
		var num_pages = Math.floor( results.total / results.limit ) + 1;
		if (results.total % results.limit == 0) num_pages--;
		var current_page = Math.floor( results.offset / results.limit ) + 1;
		
		html += '<td align="left" width="33%">';
		html += commify(results.total) + ' ' + pluralize(data_type, results.total) + ' found';
		html += '</td>';
		
		html += '<td align="center" width="34%">';
		if (num_pages > 1) html += 'Page ' + commify(current_page) + ' of ' + commify(num_pages);
		else html += '&nbsp;';
		html += '</td>';
		
		html += '<td align="right" width="33%">';
		
		if (num_pages > 1) {
			// html += 'Page: ';
			if (current_page > 1) {
				if (cpl) {
					html += '<span class="link" onMouseUp="'+cpl+'('+Math.floor((current_page - 2) * results.limit)+')">&laquo; Prev Page</span>';
				}
				else {
					html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
						offset: (current_page - 2) * results.limit
					})) + '">&laquo; Prev Page</a>';
				}
			}
			html += '&nbsp;&nbsp;&nbsp;';

			var start_page = current_page - 4;
			var end_page = current_page + 5;

			if (start_page < 1) {
				end_page += (1 - start_page);
				start_page = 1;
			}

			if (end_page > num_pages) {
				start_page -= (end_page - num_pages);
				if (start_page < 1) start_page = 1;
				end_page = num_pages;
			}

			for (var idx = start_page; idx <= end_page; idx++) {
				if (idx == current_page) {
					html += '<b>' + commify(idx) + '</b>';
				}
				else {
					if (cpl) {
						html += '<span class="link" onMouseUp="'+cpl+'('+Math.floor((idx - 1) * results.limit)+')">' + commify(idx) + '</span>';
					}
					else {
						html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
							offset: (idx - 1) * results.limit
						})) + '">' + commify(idx) + '</a>';
					}
				}
				html += '&nbsp;';
			}

			html += '&nbsp;&nbsp;';
			if (current_page < num_pages) {
				if (cpl) {
					html += '<span class="link" onMouseUp="'+cpl+'('+Math.floor((current_page + 0) * results.limit)+')">Next Page &raquo;</span>';
				}
				else {
					html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
						offset: (current_page + 0) * results.limit
					})) + '">Next Page &raquo;</a>';
				}
			}
		} // more than one page
		else {
			html += 'Page 1 of 1';
		}
		html += '</td>';
		html += '</tr></table>';
		html += '</div>';
		
		html += '<div style="margin-top:5px;">';
		html += '<table class="data_table" width="100%">';
		html += '<tr><th>' + cols.join('</th><th>').replace(/\s+/g, '&nbsp;') + '</th></tr>';
		
		for (var idx = 0, len = resp.rows.length; idx < len; idx++) {
			var row = resp.rows[idx];
			var tds = callback(row, idx);
			if (tds) {
				html += '<tr' + (tds.className ? (' class="'+tds.className+'"') : '') + '>';
				html += '<td>' + tds.join('</td><td>') + '</td>';
				html += '</tr>';
			}
		} // foreach row
		
		if (!resp.rows.length) {
			html += '<tr><td colspan="'+cols.length+'" align="center" style="padding-top:10px; padding-bottom:10px; font-weight:bold;">';
			html += 'No '+pluralize(data_type)+' found.';
			html += '</td></tr>';
		}
		
		html += '</table>';
		html += '</div>';
		
		return html;
	},
	
	getBasicTable: function(rows, cols, data_type, callback) {
		// get html for sorted table (fake pagination, for looks only)
		var html = '';
		
		// pagination
		html += '<div class="pagination">';
		html += '<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr>';
		
		html += '<td align="left" width="33%">';
		if (cols.headerLeft) html += cols.headerLeft;
		else html += commify(rows.length) + ' ' + pluralize(data_type, rows.length) + '';
		html += '</td>';
		
		html += '<td align="center" width="34%">';
			html += cols.headerCenter || '&nbsp;';
		html += '</td>';
		
		html += '<td align="right" width="33%">';
			html += cols.headerRight || 'Page 1 of 1';
		html += '</td>';
		
		html += '</tr></table>';
		html += '</div>';
		
		html += '<div style="margin-top:5px;">';
		html += '<table class="data_table" width="100%">';
		html += '<tr><th style="white-space:nowrap;">' + cols.join('</th><th style="white-space:nowrap;">') + '</th></tr>';
		
		for (var idx = 0, len = rows.length; idx < len; idx++) {
			var row = rows[idx];
			var tds = callback(row, idx);
			if (tds.insertAbove) html += tds.insertAbove;
			html += '<tr' + (tds.className ? (' class="'+tds.className+'"') : '') + '>';
			html += '<td>' + tds.join('</td><td>') + '</td>';
			html += '</tr>';
		} // foreach row
		
		if (!rows.length) {
			html += '<tr><td colspan="'+cols.length+'" align="center" style="padding-top:10px; padding-bottom:10px; font-weight:bold;">';
			html += 'No '+pluralize(data_type)+' found.';
			html += '</td></tr>';
		}
		
		html += '</table>';
		html += '</div>';
		
		return html;
	}
	
} ); // class Page

//
// Page Manager
//

Class.create( 'PageManager', {
	// 'PageManager' class handles all virtual pages in the application
	
	// member variables
	pages: null, // array of pages
	current_page_id: '', // current page ID
	
	// methods
	__construct: function(page_list) {
		// class constructor, create all pages
		// page_list should be array of components from master config
		// each one should have at least a 'ID' parameter
		// anything else is copied into object verbatim
		this.pages = [];
		this.page_list = page_list;
		
		for (var idx = 0, len = page_list.length; idx < len; idx++) {
			Debug.trace( 'page', "Initializing page: " + page_list[idx].ID );
			assert(Page[ page_list[idx].ID ], "Page class not found: Page." + page_list[idx].ID);
			
			var page = new Page[ page_list[idx].ID ]( page_list[idx] );
			page.args = {};
			page.onInit();
			this.pages.push(page);
			
			$('#tab_'+page.ID).click( function(event) {
				// console.log( this );
				// app.page_manager.click( this._page_id );
				Nav.go( this._page_id );
			} )[0]._page_id = page.ID;
		}
	},
	
	find: function(id) {
		// locate page by ID (i.e. Plugin Name)
		var page = find_object( this.pages, { ID: id } );
		if (!page) Debug.trace('PageManager', "Could not find page: " + id);
		return page;
	},
	
	activate: function(id, old_id, args) {
		// send activate event to page by id (i.e. Plugin Name)
		$('#page_'+id).show();
		$('#tab_'+id).removeClass('inactive').addClass('active');
		var page = this.find(id);
		page.active = true;
		
		if (!args) args = {};
		
		// if we are navigating here from a different page, AND the new sub mismatches the old sub, clear the page html
		var new_sub = args.sub || '';
		if (old_id && (id != old_id) && (typeof(page._old_sub) != 'undefined') && (new_sub != page._old_sub) && page.div) {
			page.div.html('');
		}
						
		var result = page.onActivate.apply(page, [args]);
		if (typeof(result) == 'boolean') return result;
		else throw("Page " + id + " onActivate did not return a boolean!");
	},
	
	deactivate: function(id, new_id) {
		// send deactivate event to page by id (i.e. Plugin Name)
		var page = this.find(id);
		var result = page.onDeactivate(new_id);
		if (result) {
			$('#page_'+id).hide();
			$('#tab_'+id).removeClass('active').addClass('inactive');
			// $('#d_message').hide();
			page.active = false;
			
			// if page has args.sub, save it for clearing html on reactivate, if page AND sub are different
			if (page.args) page._old_sub = page.args.sub || '';
		}
		return result;
	},
	
	click: function(id, args) {
		// exit current page and enter specified page
		Debug.trace('page', "Switching pages to: " + id);
		var old_id = this.current_page_id;
		if (this.current_page_id) {
			var result = this.deactivate( this.current_page_id, id );
			if (!result) return false; // current page said no
		}
		this.current_page_id = id;
		this.old_page_id = old_id;
		
		window.scrollTo( 0, 0 );
		
		var result = this.activate(id, old_id, args);
		if (!result) {
			// new page has rejected activation, probably because a login is required
			// un-hide previous page div, but don't call activate on it
			$('#page_'+id).hide();
			this.current_page_id = '';
			// if (old_id) {
				// $('page_'+old_id).show();
				// this.current_page_id = old_id;
			// }
		}
		
		return true;
	}
	
} ); // class PageManager

