/**
 * JavaScript Object Oriented Programming Framework
 * Author: Joseph Huckaby
 **/

var Namespace = {
	// simple namespace support for classes
	create: function(path, container) {
		// create namespace for class
		if (!container) container = window;
		while (path.match(/^(\w+)\.?/)) {
			var key = RegExp.$1;
			path = path.replace(/^(\w+)\.?/, "");
			if (!container[key]) container[key] = {};
			container = container[key];
		}
		return container;
	},
	prep: function(name, container) {
		// prep namespace for new class
		if (!container) container = window;
		if (name.match(/^(.+)\.(\w+)$/)) {
			var path = RegExp.$1;
			name = RegExp.$2;
			container = Namespace.create(path, container);
		}
		return { container: container, name: name };
	}
};

var Class = {
	// simple class factory
	create: function(name, members) {
		// generate new class with optional namespace
		assert(name, "Must pass name to Class.create");
		if (!members) members = {};
		members.__name = name;
		members.__parent = null;

		var ns = Namespace.prep(name);
		var container = ns.container;
		name = ns.name;

		if (!members.__construct) members.__construct = function() {};
		container[name] = members.__construct;

		var static_members = members.__static;
		if (static_members) {
			for (var key in static_members) {
				container[name][key] = static_members[key];
			}
		}

		container[name].prototype = members;
	},
	subclass: function(parent, name, members) {
		// subclass an existing class
		assert(parent, "Must pass parent class to Class.subclass");
		assert(name, "Must pass name to Class.subclass");
		if (!members) members = {};
		members.__name = name;
		members.__parent = parent.prototype;

		var ns = Namespace.prep(name);
		var container = ns.container;
		var subname = ns.name;

		if (members.__construct) {
			// explicit subclass constructor
			container[subname] = members.__construct;
		}
		else {
			// inherit parent's constructor
			var code = parent.toString();
			var args = code.substring( code.indexOf("(")+1, code.indexOf(")") );
			var inner_code = code.substring( code.indexOf("{")+1, code.lastIndexOf("}") );
			eval('members.__construct = container[subname] = function ('+args+') {'+inner_code+'};');
		}

		var static_members = members.__static;
		if (static_members) {
			for (var key in static_members) {
				container[subname][key] = static_members[key];
			}
		}

		container[subname].prototype = {};
		for (var key in parent.prototype) container[subname].prototype[key] = parent.prototype[key];
		for (var key in members) container[subname].prototype[key] = members[key];
	},
	add: function(obj, members) {
		// add members to an existing class
		for (var key in members) obj.prototype[key] = members[key];
	},
	require: function() {
		// make sure classes are loaded
		for (var idx = 0, len = arguments.length; idx < len; idx++) {
			assert( !!eval('window.' + arguments[idx]) );
		}
		return true;
	}
};

Class.extend = Class.subclass;
Class.set = Class.add;

if (!window.assert) window.assert = function(fact, msg) {
	// very simple assert
	if (!fact) {
		console.log("ASSERT FAILURE: " + msg);
		return alert("ASSERT FAILED!  " + msg);
	}
	return fact;
}
