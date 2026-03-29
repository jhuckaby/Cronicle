#!/usr/bin/env node

// Build Cronicle CHANGELOG.md file

var fs = require('fs');
var Path = require('path');
var cp = require('child_process');
var Tools = require('pixl-tools');

var debug = (process.argv[2] == 'debug');

// make sure we're in the correct dir
process.chdir( Path.dirname( __dirname ) );

// make sure git sandbox is clean
var porcelain = cp.execSync('git status --porcelain', { encoding: 'utf8' }).trim();
if (!debug && porcelain.length) {
	console.error("\nERROR: Git sandbox has local changes.  Please commit these before updating the changelog.\n");
	process.exit(1);
}

// get list of tags
var tags = cp.execSync('git tag --list --sort=version:refname', { encoding: 'utf8' }).trim().split(/\n/).reverse();

var md = '';
md += "# Cronicle Changelog\n";

var last_tag = tags.pop();
if (!tags.length) {
	console.error("\nERROR: No tags found after popping first one.  Please push another tag before running changelog.\n");
	process.exit(1);
}

tags.forEach( function(tag, idx) {
	var prev_tag = tags[idx + 1] || last_tag;
	md += `\n## Version ${tag}\n\n`;
	
	var cmd = `git log ${prev_tag}..${tag} --no-merges --pretty=format:'%h %H %ad %s%n%n%b%n----PX----' --date=short`;
	var output = cp.execSync(cmd, { encoding: 'utf8' }).trim();
	var commits = output.split('----PX----');
	var first = true;
	
	// 029a96a 029a96aebd721fe565b1b5c8f2b661564c9017f3 2025-12-30 Version 0.9.2
	commits.forEach( function(chunk) {
		var lines = chunk.trim().split(/\n/);
		var line = lines.shift();
		
		var matches = line.trim().match(/^(\w+)\s+(\w+)\s+([\d\-]+)\s+(.+)$/);
		if (!matches) return;
		if (matches[4].match(/\b(CHANGELOG)\b/)) return;
		
		var url = 'https://github.com/jhuckaby/cronicle/commit/' + matches[2];
		
		if (first) {
			md += `> ` + Tools.formatDate( matches[3] + ' 00:00:00', '[mmmm] [mday], [yyyy]' ) + "\n\n";
			first = false;
		}
		
		md += `- [\`${matches[1]}\`](${url}): ` + matches[4] + "\n";
		
		if (matches[4].match(/^Version/)) lines.forEach( function(extra) {
			if (!extra.match(/\S/)) return;
			extra = extra.trim();
			if (!extra.match(/^\-/)) extra = '- ' + extra;
			md += "\t" + extra + "\n";
		} );
	} );
} );

md += `\n## Version ${last_tag}\n\n> January 7, 2016\n\n- Initial beta release!\n`;

if (debug) {
	console.log(md);
	process.exit(0);
}

fs.writeFileSync( 'CHANGELOG.md', md );

// make sure log has actually changed
porcelain = cp.execSync('git status --porcelain', { encoding: 'utf8' }).trim();
if (!porcelain.length) {
	console.error("\nWarning: Changelog has not changed since last run.  Skipping actions.\n");
	process.exit(1);
}

cp.execSync('git add CHANGELOG.md && git commit -m "Update CHANGELOG" && git push', { stdio: 'inherit' } );
