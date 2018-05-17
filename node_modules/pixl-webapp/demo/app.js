// Demo Web App
// Author: Joseph Huckaby
// Copyright (c) 2015 Joseph Huckaby and PixlCore.com
// Released under The MIT License

// base.js must be loaded first
if (!window.app) throw new Error("App Framework is not present.");

// You app's configuration can be loaded from the server via a script tag
// Shown inline here just as an example / for simplicity.
window.config = app.config = {
	Version: "1.0.0",
	
	// Define all app's pages in 'Page' array
	Page: [
		{ ID: 'Home' },
		{ ID: 'MoreDemos' }
	],
	
	// Which page to load by default (if not in URL hash)
	DefaultPage: 'Home'
};

// Extend the global 'app' object with our custom functions
app.extend({
	
	// This name will appear in the window title
	name: 'My App',
	
	// init() is called on page load
	init: function() {
		// initialize application
		
		// pop version into footer
		$('#d_footer_version').html( "Version " + config.Version || 0 );
		
		// Setup page manager for tabs
		this.page_manager = new PageManager( config.Page );
		
		// start monitoring URL hash changes for page transitions
		Nav.init();
	}
	
});
