# Overview

The **pixl-webapp** package is a client-side JavaScript framework, designed to be a starting point for a simple web application.  It consists of a number of JavaScript classes, utility functions, and basic CSS elements (header, tabs, dialogs, progress bars, form elements, etc.).  [jQuery](http://jquery.com/) is required for all features to work properly.

It ships with a demo application, which you can see here: [Demo App](http://pixlcore.com/demos/pixl-webapp/demo/index.html)

# Table of Contents

| Document | Description |
|---------------|-------------|
| Main Docs | (You're reading them)
| [OOP Docs](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/oop.md) | Documentation on the object-oriented class generation system.
| [XML Docs](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/xml.md) | Documentation on the XML parser and serializer class.
| [Tools Docs](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/tools.md) | Documentation on the tools library (misc utility functions).
| [Date/Time Docs](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/datetime.md) | Documentation on the date/time utility library.

# Usage

You can use [npm](https://www.npmjs.com/) to install the module:

```
	npm install pixl-webapp
```

Or just download the files from the [GitHub repo](https://github.com/jhuckaby/pixl-webapp).  There is no installation script.  This is basically just a collection of JavaScript files (and a CSS file) that you must include manually.

It is important that you include the JavaScript files in the proper order.  You can of course use tools such as [UglifyJS](https://www.npmjs.com/package/uglify-js) to compact them all together into a single blob for distribution.  But for development, it is best to include them separately, in this order:

```html
	<script src="js/md5.js"></script>
	<script src="js/oop.js"></script>
	<script src="js/xml.js"></script>
	<script src="js/tools.js"></script>
	<script src="js/datetime.js"></script>
	<script src="js/page.js"></script>
	<script src="js/dialog.js"></script>
	<script src="js/base.js"></script>
```

## File Overview

Here is a quick overview of each file in the package:

### base.css

This file contains all the CSS used by the framework.  It contains some content from [HTML5 Boilerplate](http://html5boilerplate.com/), as well as CSS classes for the pages, tabs, dialogs and buttons.  The base font family is Helvetica, falling back to generic `sans-serif`.

The color scheme is mainly shades of light gray, with a light blue highlight.  Here are all the blue theme colors used in the CSS, from darkest to lightest:

```
	#3f7ed5, #5890db, #7cafda, #9ccffa
```

### md5.js

This is a 3rd party library ([BSD](https://en.wikipedia.org/wiki/BSD_licenses) licensed) that implements the [MD5](https://en.wikipedia.org/wiki/MD5) algorithm in JavaScript.  This is used only for generating unique IDs, and constructing [Gravatar](https://en.gravatar.com/) image URLs.  If you don't require either in your app, you can omit this file.  Note that MD5 should not be used for any secure cryptography, as it now generally considered to be a weak algorithm.

Here is the copyright snippet from the source file:

```
	Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
	Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	Distributed under the BSD License
	See http://pajhome.org.uk/crypt/md5 for more info.
```

### oop.js

This is a simple object-oriented programming framework, offering "classes" in JavaScript.  See the [Pages](#pages) section below for details on this.  The file also comes with its own standalone docs: [OOP Documentation](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/oop.md).

### xml.js

The `xml.js` file provides a simple XML parser in pure JavaScript.  This can be used to convert XML to a simple JavaScript object hash/array tree, for example if you are sending AJAX requests to a server API that returns XML.  It also contains a number of static utility functions.  The file comes with its own standalone docs: [XML Documentation](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/xml.md).

### tools.js

The `tools.js` file contains a number of misc. utility functions, from generating unique IDs, to manipulating strings, to measuring the browser window.  The file comes with its own standalone docs: [Tools Documentation](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/tools.md).

### datetime.js

The `datetime.js` file contains a number of functions for dealing with dates and times.  Specifically, parsing dates and constructing various localized date/time strings for display purposes.  The file comes with its own standalone docs: [Date/Time Documentation](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/datetime.md).

### page.js

This is the virtual page navigation and management system in the web app framework.  It manages a collection of virtual pages, provides a base class for them, and handles listening for URL hash changes and page state changes.  See [Pages](#pages) below for details.

### dialog.js

This file handles basic dialog display and rendering. See the [Dialogs](#dialogs) section below for details.

### base.js

This file contains the base application object for your web app.  It's a single, global `app` object that you can extend with your own variables and functions if you like.  See [Main Application](#main-application) below for details.

## HTML Markup

To get started, include the webapp CSS and JS from your HTML page:

```html
	<link rel="stylesheet" href="css/base.css">
	<link rel="stylesheet" href="style.css">
	
	<script src="js/md5.js"></script>
	<script src="js/oop.js"></script>
	<script src="js/xml.js"></script>
	<script src="js/tools.js"></script>
	<script src="js/datetime.js"></script>
	<script src="js/page.js"></script>
	<script src="js/dialog.js"></script>
	<script src="js/base.js"></script>
```

### Header

The page header section contains a custom logo, title, and widgets on the right side.  It should live in your HTML `<BODY>` element, and not inside any other containers:

```html
	<div id="d_header">
		<div class="container">
			<div id="d_header_logo" class="left"></div>
			<div id="d_header_title" class="left"><strong>My Application</strong></div>
			<div id="d_header_user_container" style="right">
				<!-- User login info here -->
			</div>
			<div class="clear"></div>
		</div>
	</div>
```

Please style the `#d_header_logo` element to contain your own app's logo image, using `background-image`.  It should be 32x32 pixels (or 64x64 for retina).  Enter your app's title in the `#d_header_title` element, optionally wrapped in a `<strong>` tag.

The `#d_header_user_container` can contain a number of widgets (`#header_option`), such as login/logout buttons, user avatar, etc.  These should be floated right, and separated by `#d_header_divider` elements.  Example:

```html
	<div id="d_header_divider" class="right" style="margin-right:0;"></div>
	<div class="header_option logout right" onMouseUp="app.doUserLogout()"><i class="fa fa-power-off fa-lg">&nbsp;&nbsp;</i>Logout</div>
	<div id="d_header_divider" class="right"></div>
```

### Main Content

For the main content of the page, see the [Pages](#pages) and [Tabs](#tabs) sections below.

### Footer

The page footer contains left and right aligned sections for you to add a copyright, version, or anything else you want.  Example:

```html
	<div id="d_footer">
		<div class="left">
			MyApp &copy; 2015 Me. Released under the MIT License.
		</div>
		<div id="d_footer_version" class="right">
			Version 1.0.0
		</div>
		<div class="clear"></div>
	</div>
```

## Configuration

The app framework requires a configuration object to be loaded into `window.config` and copied in `app.config`.  This can be loaded however you like (inline script tag, etc.).  An simple example is shown here (taken from the demo app):

```javascript
	window.config = app.config = {
		// Define all app's pages in 'Page' array
		Page: [
			{ ID: 'Home' },
			{ ID: 'MoreDemos' }
		],
		
		// Which page to load by default (if not in URL hash)
		DefaultPage: 'Home'
	};
```

The only required properties in the configuration object are the `Page` array, which contains objects for each of your pages (more on this below in [Pages](#pages)), and the `DefaultPage` string, which declares which page loads by default.  Everything else is optional, and this structure can be extended for your own uses.

## Main Application

Your main application object is located in the global scope under the name `app`.  It is a plain object with variables and classes you can override, and of course add your own.  You can use the built-in `extend()` method to add your own properties and methods, if you like.  Example:

```javascript
	app.extend({
		
		// This name will appear in the window title
		name: 'My App',
		
		// init() is called on page load
		init: function() {
			// initialize application
			
			// Setup page manager for tabs
			this.page_manager = new PageManager( config.Page );
			
			// start monitoring URL hash changes for page transitions
			Nav.init();
		}
		
	});
```

The first thing you need to do is add a `name` property, set to the name of your application.  This is used in a number of places (such as window titles).  Also, an `init()` method, which is called when the DOM is ready.

The only other requirement is the `init()` method, in which you need to construct a `PageManager()` instance, passing it your `Page` array from the configuration object, and assigning it to `this.page_manager` (must be exact).  Then call `Nav.init()` to start the page navigation system.  You can also add your own application startup tasks here.

Feel free to extend this object with whatever properties or methods your app requires.

## Pages

Each "page" in your web application is virtual.  It's basically a DIV that is shown when the page is activated, hidden when deactivated, and a JavaScript class upon which methods are called when the page state changes (activated, deactivated, etc.).  Each page has a unique ID, which must first be defined in your configuration:

```javascript
	{
		Page: [
			{ ID: 'Home' },
			{ ID: 'MoreDemos' }
		],
		DefaultPage: 'Home'
	}
```

In this example your HTML should be setup like this:

```html
	<div id="main" class="main">
		<div id="page_Home" style="display:none"></div>
		<div id="page_MoreDemos" style="display:none"></div>
	</div>
```

Finally, each virtual page in your app should inherit from the `Page` base class.  It contains placeholders for all the methods you can override (described below), as well as a few utility methods for rendering tables and tabs.  See the [OOP Documentation](https://github.com/jhuckaby/pixl-webapp/blob/master/docs/oop.md) for details on creating a subclass.

Here is an example class, showing the bare minimum you'll need to add:

```javascript
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
			var html = 'Hello there!';
			this.div.html( html );
			
			return true;
		},
		
		onDeactivate: function() {
			// called when page is deactivated
			return true;
		}
		
	} );
```

You have the choice of including your HTML markup in the `index.html` file, or building the HTML as a string in the `onInit()` method (called *only once*), or building the HTML as a string in the `onActivate()` method (called *every time* your page is activated).

### onInit

The `onInit()` method is called on your page only once, at load time.  This allows you to setup things like initial HTML markup (or you can just put this in the `index.html` file), and any other initialization tasks your page might need.  A `div` property points to your page's DIV element (jQuery wrapped).

The function takes no arguments, and there is no return value.

### onActivate

The `onActivate()` method is called *every time* your page is activated.  Your DIV is automatically shown, but you can use this method to update the page contents if you want.

Your function may be passed an `args` object, if the URL hash contains a query string.  For example:

```
	http://myapp.com/#Home?foo=bar&baz=1234
```

This URL would load the `Home` virtual page, and the `onActivate()` method would be passed an `args` object containing:

```javascript
	{
		foo: "bar",
		baz: 1234
	}
```

Another typical thing to do in your `onActivate()` method is to call `app.setWindowTitle()` to set the browser window / tab title, and `app.showTabBar()` to show the tab bar:

```javascript
	app.setWindowTitle('Home');
	app.showTabBar(true);
```

The window title will contain the page name, *and* your application name, taken from `app.name`.  Showing the tab bar is typical for most web apps and pages, but there are exceptions.  For example, a "login" page may not want to show the tab bar.  See [Tabs](#tabs) below for more on this.

Your `onActivate()` method *must* return either `true` or `false`.  Returning `true` means that the page accepted the activation, and the app can proceed.  Returning `false` means that something went wrong (error or other), and the page should *not* be activated.  In this case the page remains hidden and the *previous* page's DIV is still displayed.

### onDeactivate

The `onDeactivate()` method is called when your page is deactivated.  Meaning, the user is navigating to another virtual page in the app.  Your method is passed the ID of the new page being activated:

```javascript
	onDeactivate: function(new_id) {
		// called when page is deactivated
		return true;
	}
```

You can use this method to shut down or cleanup things happening in the page.  For example: timers, IFRAMEs, or anything else that should be stopped.  You may want to clear your entire DIV element (if your `onActivate()` redraws everything, for example).

Your `onDeactivate()` method *must* return either `true` or `false`.  Returning `true` means that the page accepted the deactivation, and the app can proceed.  Returning `false` means that something went wrong (error or other), and the page should *not* be deactivated.  In this case the current page remains displayed.

### Accessing Pages

You can access any page by looking it up by its ID.  This is done by calling the `page_manager` object in the `app` global.  It provides a `find()` method that accepts an ID string.  Example:

```javascript
	var page = app.page_manager.find('Home');
```

There is a global shortcut for this, available by calling `$P()`.  It also accepts a Page ID, but if omitted, it defaults to the current page.  This is very useful for getting back into the context of the page from an inline HTML callback.

```javascript
	var page = $P('Home');
	var cur_page = $P();
```

## Navigation

The built-in navigation system listens for URL hash change events, and switches virtual pages based on the anchor tag present in the URL.  Example:

```
	http://myapp.com/#Home
```

This would activate the virtual page with ID `Home`.  It also supports URL query string params after the page ID, which are passed to the page class `onActivate()` method.  Example:

```
	http://myapp.com/#Home?foo=bar&baz=1234
```

So a typical way of triggering a page change event is to simply redirect the browser to a new hash anchor tag.  However, some convenience methods are also provided:

### Nav.go

This forces a page change event, and accepts a new anchor tag, optionally with a query string at the end.

```javascript
	Nav.go('SomePage');
	Nav.go('SomePage?foo=bar');
```

### Nav.refresh

This refreshes the current page (calls `onDeactivate()`, then `onActivate()`).

```javascript
	Nav.refresh();
```

### Nav.prev

This jumps back to the previous page.

```javascript
	Nav.prev();
```

### Nav.currentAnchor

This returns the name of the current anchor, including query string if present.

```javascript
	var loc = Nav.currentAnchor();
```

## Tabs

Tabs are optional, and if present, work hand-in-hand with the page system.  If you create tab HTML markup as shown below, they will automatically be attached to their respective pages, and handle clicks, and changing state for you.

```html
	<div class="tab_bar" style="display:none">
		<div id="tab_Home" class="tab inactive"><span class="content">Home</span></div>
		<div id="tab_MoreDemos" class="tab inactive"><span class="content">More Demos</span></div>
		<div class="clear"></div>
	</div>
```

The `tab_bar` DIV is initially hidden, as you may have a login page that shouldn't show any tabs.  Each individual page can hide or show the tab bar by calling `app.showTabBar();` and passing `true` or `false`.  If you have no login page, or you are sure the tab bar will *always* be shown, you can omit the `display:none`, and never have to call `app.showTabBar(true);`.

Each tab should have a DIV with an ID following this format: `tab_ID`, and should the CSS classes `tab inactive` applied.  The page navigation system will handle activating tabs when their respective pages are shown.

## Forms

The library comes with a simple HTML form builder system, which is really just a table structure with two columns: Form element labels on the left, and the form elements themselves on the right.  Functions are provided to build up the table HTML row by row, and can generate captions and spacers.

Start with a simple table declaration with your own styles added (margins, etc.), and then call these functions:

| Function Name | Description |
|---------------|-------------|
| `get_form_table_row()` | Returns HTML for one form element row (2 arguments, label and content). |
| `get_form_table_caption()` | Returns HTML for a caption row (one argument, the caption text). |
| `get_form_table_spacer()` | Returns HTML for a spacer row (no arguments). |

Here is an example:

```javascript
	var html = '<table>';
	
	// Name (Text Field)
	html += get_form_table_row( 'Name', '<input type="text" id="fe_title" size="35" value=""/>' );
	html += get_form_table_caption( "Enter a title for the vegetable, which will be displayed on the main salad." );
	html += get_form_table_spacer();
	
	// Quality (Checkbox)
	html += get_form_table_row( 'Quality', '<input type="checkbox" id="fe_ee_enabled" value="1"/><label for="fe_ee_enabled">Farm Fresh</label>' );
	html += get_form_table_caption( "Select whether the vegetable should be farm fresh or not." );
	html += get_form_table_spacer();
	
	html += '</table>';
	$('#my_element').html( html );
```

If you would prefer to simply create the HTML markup yourself, and not use the functions, that is fine.  For form labels, use a `<TD>` element with CSS class `table_label`, and for the form elements, use a `<TD>` with class `table_value`.  For captions, simply use a `<DIV>` set to class `caption`.

## Tables

The library provides CSS styles and JavaScript functions for creating data tables, optionally with pagination.  The HTML markup is simple; just use CSS class `data_table`, then provide your headers in `<TH>` elements, and your data in `<TD>` elements.  HTML example of a simple table:

```html
	<table class="data_table">
		<tr>
			<th>Username</th>
			<th>Full Name</th>
			<th>Status</th>
			<th>Created</th>
			<th>Modified</th>
		</tr>
		<tr>
			<td>jhuckaby</td>
			<td>Joseph Huckaby</td>
			<td>Administrator</td>
			<td>Jan 3, 2014</td>
			<td>Oct 5, 2015</td>
		</tr>
		<tr>
			<td>fsmith</td>
			<td>Fred Smith</td>
			<td>Standard User</td>
			<td>Oct 5, 2015</td>
			<td>Oct 5, 2015</td>
		</tr>
	</table>
```

In addition to the CSS, a pagination system is provided, to assist you with generating tables from a large dataset that have pagination links built-in.  The function to call is `this.getPaginatedTable()` and is available in the `Page` base class.  It returns the final rendered HTML for the page.

To use it, you'll need to provide an object containing the following pieces of information:

| Property Name | Description |
|---------------|-------------|
| `cols` | An array of header column labels, displayed in bold at the top of the table. |
| `rows` | The current page of data (array).  Each element is passed to your callback for each visible row of the table. |
| `data_type` | A string identifying the type of data, e.g. `user`.  Used in strings such as `No users found`. |
| `offset` | The current offset into the full dataset.  This should be `0` for the first page. |
| `limit` | The number of items shown on each page.  This should equal the length of the `rows` array. |
| `total` | The total number of items in the dataset.  This is used to render proper pagination links. |
| `callback` | A user callback which is fired for each row, so you can provide your own `<TD>` elements. |

Here is an example:

```javascript
	var cols = [
		'Name', 'Color', 'Size', 'Quantity', 'Price', 'Created'
	];
	
	var rows = [
		{ name: 'Celery', color: 'Green', size: '1ft', quantity: 450, price: '$2.75', created: 1442984544 },
		{ name: 'Beets', color: 'Purple', size: '4in', quantity: 30, price: '$3.50', created: 1442380043 },
		{ name: 'Lettuce', color: 'Green', size: '1ft', quantity: 1000, price: '$2.50', created: 1442264863 },
		{ name: 'Carrots', color: 'Orange', size: '8in', quantity: 60, price: '$4.00', created: 1442084869 },
		{ name: 'Rhubarb', color: 'Purple', size: '2ft', quantity: 190, price: '$3.99', created: 1441724876 }
	];
	
	var html = this.getPaginatedTable({
		cols: cols,
		rows: rows,
		data_type: 'vegetable',
		offset: 0,
		limit: 5,
		total: 10,
		
		callback: function(row, idx) {
			return [
				row.name,
				row.color,
				row.size,
				commify( row.quantity ),
				row.price,
				get_nice_date_time( row.created )
			];
		}
	});
```

So the idea here is, we have a dataset of 10 items total, but we are only showing 5 items per page.  So we have an array of 5 items in `rows`, but we're specifying the `total` as 10, and `offset` as 0 (first page).  Based on this, the `getPaginatedTable()` will generate the proper pagination links.

Your callback is fired once per row, and is passed the current row (array element from `rows`), and the localized index in `idx` (starts from `0` regardless of `offset`).  Your function should return an array of values which should match up with the `cols`, and each will be stuffed into a `<TD>` element.

The pagination links work by constructing self-referencing URL to the current page, but adding or modifying an `offset` query parameter, set to the appropriate value.  For example, in this case there would be a `Next Page` link, which would be set to:

```
	http://myapp.com/#Home?foo=bar&baz=1234&offset=5
```

Since the `limit` is set to 5 items per page, and `offset` starts at `0`, then the next page (page 2) will be at offset `5`.  This link is simply a hashtag anchor tag, which doesn't reload the browser page, but will instead be caught by the navigation system, and call your page's `onDeactivate()` then its `onActivate()` with the new values.  It is up to your page code to redraw the table with the new data chunk and new `offset` value.

Instead of generating hashtag anchor links, you can optionally provide a custom JavaScript function in a `pagination_link` property, which will be written into the HTML as an `onMouseUp` handler on each link, and called instead of a standard link.  Note that it must be a string and globally accessible, so remember the `$P()` shortcut to get access to the current page.  Example:

```javascript
	pagination_link: '$P().tableNavClick'
```

In this case your custom page `tableNavClick()` method will be called for each table pagination click, and passed the new offset value.

## Dialogs

The library comes with a simple "dialog" system, which is just an auto-centered floating DIV with a drop shadow, and an invisible overlay making it behave like a modal window.  To show a dialog, call `app.showDialog()` and pass in a title, HTML content, and HTML for buttons at the bottom.  The DIV will automatically size and position itself to fit your content.  Example:

```javascript
	var html = 'This is the main dialog content.';
	var buttons = '<div class="button" onMouseUp="app.hideDialog()">Close</div>';
	app.showDialog( "My Dialog", html, buttons );
```

As you can see in the button markup above, you can call `app.hideDialog()` to close the dialog box.  This destroys the content, so make sure you grab any user input before calling it, if applicable.

If you need a quick, simple "confirmation" style dialog, meaning exactly two buttons ("Cancel" and a custom button), there is a convenience method called `app.confirm()` which takes care of some of the dialog logistics for you.  It allows you to provide a callback function, which is called with either `true` or `false` depending on which button was clicked.  Example:

```javascript
	app.confirm( 'Add Vegetable', "Are you sure you want to add the vegetable <b>celery</b>?", "OK", function(result) {
		if (result) {
			// User clicked "OK", close dialog ourselves
			app.hideDialog();
		}
		else {
			// User clicked "Cancel", dialog is closed automatically
		}
	} );
```

As you can see, this method takes 4 arguments: The dialog title, HTML content, button title, and a callback function that accepts a result (Boolean).  The result will be `true` if the user clicked your custom button ("OK" in this case), or `false` if the user clicked "Cancel".

Note that it is up to you to hide the dialog when the user clicks your button (`true` result).  This allows you to "interrupt" the closing of the dialog and show an error notification or something.  There is no way to intercept the cancel button, however.

## Progress

To show a simple "progress" style dialog, which has a title and graphical progress bar, you can call `app.showProgress()` and pass in a counter (floating point decimal between `0.0` and `1.0`), and a title string.  Example:

```javascript
	app.showProgress( 0.5, "Processing files..." );
```

This would show the progress bar at half width (50%).  You can call the same function multiple times to update the bar width.  You can omit the title for subsequent calls (unless you want to change it too).  Example:

```javascript
	app.showProgress( 0.7 );
	app.showProgress( 0.8 );
	app.showProgress( 0.9, "Finishing up..." );
```

If you pass in `1.0` as the counter, the progress bar is displayed at full width but partial transparency, denoting an "indeterminate" length.  So if you don't know the length of a job, and just want to show a generic progress bar, pass in `1.0` as the counter.

Call `app.hideProgress()` to hide the progress bar.

## Notification

Notification messages are shown in a fixed bar at the top of the screen, regardless of the scroll position.  Messages can have one of three styles (highlight color), and custom HTML.  They can remain in place until clicked, or disappear after N seconds.  Only one notification may be shown at a time.

To use the notification system in your app, make sure this markup is in your main HTML page:

```html
	<div id="d_message" class="message" style="display:none" onMouseUp="app.hideMessage(250)">
		<div id="d_message_inner" class="message_inner"></div>
	</div>
```

Then, call `app.showMessage()` and pass in a style name (see below), a text or HTML message string, and optionally a lifetime (number of seconds before it auto-hides).  Here are the three supported message styles:

| Style | Description |
|-------|-------------|
| `success` | Highlighted in green, used for successful completion messages.  By default, these automatically hide after 8 seconds. |
| `warning` | Highlighted in yellow, used for warning messages.  By default these are persistent until user click. |
| `error` | Highlighted in red, used for error messages.  By default these are persistent until user click. |

Example use:

```javascript
	app.showMessage( 'success', "The user was saved successfully.", 8 );
```

To programmatically hide the notification message, call `app.hideMessage()`.  You can optionally pass in a number of milliseconds to animate the hide, if you want (uses jQuery's animation system).

For form field validation errors, you can call `app.badField()` and pass in the DOM ID (or CSS selector) of the form field containing an invalid value, and an error message.  The form field will be focused, highlighted in red (background color, works well for text fields), and an error message notification will be displayed.  To clear an error, call `app.clearError()`.

```javascript
	app.badField( '#my_username', "Usernames must contain alphanumeric characters only." );
```

If you include [Font Awesome Icons](https://fortawesome.github.io/Font-Awesome/icons/) in your HTML page, the notification messages will also contain an appropriate icon matching the style:

```html
	<link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">
```

## API

The library contains a simple JSON REST API wrapper built around jQuery's [$.ajax()](http://api.jquery.com/jquery.ajax/) call, designed to support JSON API backends.  API calls can be sent to the server using HTTP GET or POST, and JSON responses are parsed for you.  Errors are handled automatically, but you can specify custom handlers as well.

By default, API calls are sent to the same hostname as the one hosting the page, using the URI `/api/COMMAND`, where `COMMAND` is a custom command passed in, e.g. `/api/user_login`.  You can change the base API URL by calling `app.setAPIBaseURL()`.  Example:

```javascript
	app.setAPIBaseURL( '/myapp/API.php' );
	app.setAPIBaseURL( 'http://myotherserver.com/myapp/API.php' );
```

To send an API call, use `app.api.get()` or `app.api.post()` depending on whether you want an HTTP GET or HTTP POST.  Pass in a command name (is appended to the base URI), a params object (serialized to JSON or a query string), and a callback.  Example:

```javascript
	app.api.post( 'user_login', { username: 'joe', password: '12345' }, function(resp) {
		// successfully logged user in
		// 'resp' is response JSON from server
	} );
```

So this example would send an HTTP POST to `/api/user_login`, and serialize the params into JSON, sent as the body of the post.  The response is expected to be in JSON, and is parsed and sent to the callback.

Sending an HTTP GET is similar. Just call `app.api.get()` instead, and note that the params object is serialized into a URL query string, not a JSON POST body.  The response and callback are handled the same.  Example:

```javascript
	app.api.get( 'user_get_info', { username: 'joe' }, function(resp) {
		// successfully fetched user info
		// 'resp' is response JSON from server
	} );
```

API errors are handled automatically by default, meaning your callback is *not* fired, and instead an error notification is displayed.  This includes HTTP related errors, as well as errors specified inside the response JSON.  The API system expects the response to include a `code` property, and if this is non-zero, it is considered an error, and it looks for a `description` property for the error message.

To set a custom error handler, specify a second callback after the first one:

```javascript
	app.api.post( 'user_login', { username: 'joe', password: '12345' },
		function(resp) {
			// successfully logged user in
			// 'resp' is response JSON from server
		},
		function(err) {
			// an error occurred
			// see err.code and err.description
		}
	);
```

### User Login

When implementing your own user login system, note that the API calls will automatically include a Session ID if you store it in [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) using key `session_id`.  It will be sent to the server along with all API calls as a custom HTTP request header `X-Session-ID`.  Example:

```javascript
	localStorage['session_id'] = "d2691d948880cea8426078b0879ce733";
```

## Misc

### Page Resize

If your pages need to take special action when the browser is resized, you can define an `onResize()` method in your page classes.  This is fired for every browser resize event, and your method is passed an object containing the new inner window `width` and `height` in pixels.  Example:

```javascript
	onResize: function(size) {
		// window was resized
		// see 'size.width' and 'size.height'
	}
```

### Page Unload

If you need to intercept the user navigating away from the app entirely or closing the browser tab/window, you can define an `onBeforeUnload()` method in your page classes.  This method should return a text message to be displayed, if you want to intercept the event and alert the user, or return `false` to allow the app to shut down without any intervention.  Example:

```javascript
	onBeforeUnload: function() {
		// if dirty, warn user before navigating away from app
		if (this.dirty) return "There are unsaved changes in this document.  If you leave now they will be abandoned.";
		else return false;
	}
```

This example assumes your page class has a `dirty` property, which is `true` when the user has made changes which are unsaved.

Please note that alerting the user in this way is very jarring and disruptive, and should *only* be done when there really is a good reason to keep the user on the page, i.e. unsaved changes that will be lost forever.

## Additional UI Features

### Side Tabs

The webapp framework comes with a system for handling "side tabs", a.k.a. tabs within tabs.  These exist inside the context of a single page, but allow you to further subdivide your page into sub-pages, controlled by a set of tabs displayed on the left side.

This requires you to design your page class in a specific way.  Namely, you must generate your HTML on-the-fly when `onActivate()` is called.  The idea is that the side tabs and sub-page are redrawn every time.  The sub-page is chosen via a hash anchor query string parameter named `sub`.  Example URL:

```
	http://myapp.com/#MyPage?sub=form
```

This will activate the `MyPage` page, and pass in `{sub:"form"}` as the `args` object.  It is up to your `onActivate()` method to react to this, by rendering a different sub-page for the value of `args.sub`.  For example, you can call a method based on the value like this:

```javascript
	onActivate: function(args) {
		// page activation
		this.args = args;
		
		// jump to sub-page based on has query
		this['gosub_'+args.sub](args);
		
		return true;
	}
```

So in this example you'd need to provide a method for each sub-page, i.e. `gosub_form()`.

Then, as you are building the HTML to render the sub-page, call `this.getSidebarTabs()` to render the sidebar tabs.  Pass in the current `args.sub` value, and an array describing the side tabs.  Example:

```javascript
	var html = '';
	
	html += this.getSidebarTabs( args.sub,
		[
			['form', "Form Demo"],
			['table', "Table Demo"]
		]
	);
	
	html += "(Sub-page content here)";
	
	html += '</div>'; // close sidebar tabs
	this.div.html( html );
```

This would render two side tabs, one with ID `form` and another with ID `table`.  The value of the `args.sub` must match one of these for the correct tab to be highlighted.  Clicks are handled automatically -- the user is navigated back to your page, but with a different value for the `sub` parameter.

### Fieldsets

HTML `<fieldset>` tags are styled with a light gray vertical gradient, gray border, and a legend.  Inside the fieldset, feel free to use DIVs with class `info_label` for labels, and `info_value` for values.  Example:

```html
	<fieldset>
		<legend>Some Info</legend>
		<div class="info_label">Section 1</div>
		<div class="info_value">Lorem ipsum dolor sit amet.</div>
	</fieldset>
```

See the demo application HTML source for a better example of this.

### Buttons

Buttons are provided in the webapp library by setting a assigning CSS class `button` to a `<div>` element.  They come with rollover and click effects, and are 111px wide and 24px tall (including padding and border) by default.  Example:

```html
	<div class="button" onMouseUp="$P().doSomething()">Something</div>
```

There are a few variants available:

| CSS Classes | Description |
|---------------|-------------|
| `button mini` | Smaller font, only 101px wide by 21px tall.
| `button ellip` | Add ellipsis text overflow.
| `button left` | Float button to the left.
| `button right` | Float button to the right.
| `button center` | Horizontally center the button.
| `button disabled` | Grayed out, no hover or click effects.

### Subtitles

Subtitles are designed to be displayed at the top of your page content, usually in conjunction with [Side Tabs](#side-tabs), or just above a [Table](#tables).  They are styled in 16px bold text, with a light gray bottom border that extends the full width of the container.  To use, create a `<div>` and apply CSS class `subtitle`.  Example:

```html
	<div class="subtitle">New Vegetable</div>
```

You can also include subtitle "widgets" which float on the right side of the subtitle.  These are styled in smaller text (16px), and go *inside* of the subtitle DIV.  These should be inner `<div>` elements with CSS class `subtitle_widget`.  Also, don't forget to clear the float at the end.  Example:

```html
	<div class="subtitle">New Vegetable
		<div class="subtitle_widget">Widget 1</div>
		<div class="subtitle_widget">Widget 2</div>
		<div class="clear"></div>
	</div>
```

### Color Labels

Color labels are designed to be applied to `<span>` elements, and provide an opaque colored background, with white shadowed bold text.  These are useful for decorating one-word table elements, such as account status (e.g. "Active", "Suspended").  To use, create a `<span>` element apply CSS class `color_label` plus your desired color.  Example:

```html
	<span class="color_label green">Active</span>
```

The colors available are `green`, `yellow`, `red`, `purple` and `gray`.  To add more, just set a custom `background-color` CSS property.

### Avatars

For displaying user avatars, a function is provided in the `app` global to generate a URL to the [Gravatar](https://en.gravatar.com/) service, using an e-mail address.  Basically it just constructs a URL to an avatar image for the user, if one exists, at a specified pixel size, and falls back to a generic user icon.  Example:

```javascript
	var url = app.getUserAvatarURL( 'email@server.com', 64 );
```

This would generate a URL to a 64x64 user icon image.  If the user's e-mail address is registered at [Gravatar.com](https://en.gravatar.com/), it will be their custom avatar icon.  If not, it will be a generic icon.

This function requires the [md5.js](#md5js) library, as the e-mail address is hashed using MD5 on the URL.

# License

The MIT License (MIT)

Copyright (c) 2013 - 2015 Joseph Huckaby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
