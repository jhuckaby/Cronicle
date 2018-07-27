// Cronicle App
// Author: Joseph Huckaby
// Copyright (c) 2015 - 2018 Joseph Huckaby and PixlCore.com
// MIT License

// Worker thread for the Home tab
// Processes schedule to predict upcoming jobs

var window = {};

importScripts(
	'external/moment.min.js',
	'external/moment-timezone-with-data.min.js',
	'common/xml.js', 
	'common/tools.js', 
	'common/datetime.js' 
);

onmessage = function(e) {
	// process schedule and cursors, find out which events run in the next 24 hours
	var data = e.data;
	var default_tz = data.default_tz;
	var schedule = data.schedule;
	var state = data.state;
	var cursors = state.cursors;
	var categories = data.categories;
	var plugins = data.plugins;
	var events = [];
	var max_events = 10000;
	
	var now = normalize_time( time_now(), { sec: 0 } );
	var max_epoch = now + 86400 + 3600;
	var time_start = hires_time_now();
	
	for (var idx = 0, len = schedule.length; idx < len; idx++) {
		var item = schedule[idx];
		
		// if item is disabled, skip entirely
		if (!item.enabled) continue;
		
		// check category for disabled flag as well
		var cat = find_object( categories, { id: item.category } );
		if (cat && !cat.enabled) continue;
		
		// check plugin for disabled flag as well
		var plugin = find_object( plugins, { id: item.plugin } );
		if (plugin && !plugin.enabled) continue;
		
		// start at item cursor
		var min_epoch = (cursors[item.id] || now) + 60;
		
		// if item is not in catch-up mode, force cursor to now + 60
		if (!item.catch_up) min_epoch = now + 60;
		
		// setup moment, and floor to the hour
		var margs = moment.tz(min_epoch * 1000, item.timezone || default_tz);
		margs.minutes(0).seconds(0).milliseconds(0);
		
		for (var epoch = min_epoch; epoch < max_epoch; epoch += 3600) {
			if (item.timing && check_event_hour(item.timing, margs)) {
				// item will run at least one time this hour
				// so we can use the timing.minutes to populate events directly
				var hour_start = margs.unix();
				
				if (item.timing.minutes && item.timing.minutes.length) {
					// item runs on specific minutes
					for (var idy = 0, ley = item.timing.minutes.length; idy < ley; idy++) {
						var min = item.timing.minutes[idy];
						var actual = hour_start + (min * 60);
						if ((actual >= min_epoch) && (actual < max_epoch)) {
							events.push({ epoch: actual, id: item.id });
							if (events.length >= max_events) { idy = ley; epoch = max_epoch; idx = len; }
						}
					} // foreach minute
				} // individual minutes
				else {
					// item runs EVERY minute in the hour (unusual)
					for (var idy = 0; idy < 60; idy++) {
						var actual = hour_start + (idy * 60);
						if ((actual >= min_epoch) && (actual < max_epoch)) {
							events.push({ epoch: actual, id: item.id });
							if (events.length >= max_events) { idy = 60; epoch = max_epoch; idx = len; }
						}
					} // foreach minute
				} // every minute
			} // item runs in the hour
			
			// advance moment.js by one hour
			margs.add( 1, "hours" );
			
			// make sure we don't run amok (3s max run time)
			if (hires_time_now() - time_start >= 3.0) { epoch = max_epoch; idx = len; }
		} // foreach hour
		
	} // foreach schedule item
	
	postMessage( 
		events.sort(
			function(a, b) { return (a.epoch < b.epoch) ? -1 : 1; } 
		) 
	);
};

function check_event_hour(timing, margs) {
	// check if event needs to run, up to the hour (do not check minute)
	if (!timing) return false;
	if (timing.hours && timing.hours.length && (timing.hours.indexOf(margs.hour()) == -1)) return false;
	if (timing.weekdays && timing.weekdays.length && (timing.weekdays.indexOf(margs.day()) == -1)) return false;
	if (timing.days && timing.days.length && (timing.days.indexOf(margs.date()) == -1)) return false;
	if (timing.months && timing.months.length && (timing.months.indexOf(margs.month() + 1) == -1)) return false;
	if (timing.years && timing.years.length && (timing.years.indexOf(margs.year()) == -1)) return false;
	return true;
};
