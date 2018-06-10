# Installation for Windows
- Install git and Unix tools. You need sh.exe to start the scripts.
- Edit the config.json and add "ps_monitor_cmd" key to get process status:
```
"ps_monitor_cmd": "cscript.exe bin\\win_ps.wsf //nologo"
```
- Edit setup.json and change the "common" to copy instead of symbolic link.
```
"common": [
			[ "copyCompress", "node_modules/jquery/dist/jquery.min.js", "htdocs/js/external/" ],
			[ "copyCompress", "node_modules/jquery/dist/jquery.min.map", "htdocs/js/external/" ],
			[ "copyCompress", "node_modules/zxcvbn/dist/zxcvbn.js", "htdocs/js/external/" ],
			[ "copyCompress", "node_modules/zxcvbn/dist/zxcvbn.js.map", "htdocs/js/external/" ],
			[ "copyCompress", "node_modules/chart.js/dist/Chart.min.js", "htdocs/js/external/" ],
			
			[ "copyCompress", "node_modules/font-awesome/css/font-awesome.min.css", "htdocs/css/" ],
			[ "copyCompress", "node_modules/font-awesome/css/font-awesome.css.map", "htdocs/css/" ],
			[ "copyFiles", "node_modules/font-awesome/fonts/*", "htdocs/fonts/" ],
			
			[ "copyCompress", "node_modules/mdi/css/materialdesignicons.min.css", "htdocs/css/" ],
			[ "copyCompress", "node_modules/mdi/css/materialdesignicons.min.css.map", "htdocs/css/" ],
			[ "copyFiles", "node_modules/mdi/fonts/*", "htdocs/fonts/" ],
			
			[ "copyCompress", "node_modules/moment/min/moment.min.js", "htdocs/js/external/" ],
			[ "copyCompress", "node_modules/moment-timezone/builds/moment-timezone-with-data.min.js", "htdocs/js/external/" ],
			[ "copyCompress", "node_modules/jstimezonedetect/dist/jstz.min.js", "htdocs/js/external/" ],
			
			[ "copyFiles", "node_modules/pixl-webapp/js/*", "htdocs/js/common" ],
			[ "copyFile", "node_modules/pixl-webapp/css/base.css", "htdocs/css/" ],
			[ "copyFiles", "node_modules/pixl-webapp/fonts/*", "htdocs/fonts/" ],
			
			[ "chmodFiles", "755", "bin/*" ]
		]
```
- Create the npm installation by going to command line of source files:

```
cd /d my_cronicle_dir
npm install
node bin/build.js dist
sh bin/control.sh setup
sh bin/control.sh start
```

## Gotchas
- I've tested windows changes for simple events. If you have user switching or detached tasks, they probably will not work.
- The gid and uid returned from Process is hard-coded as windows doesn't support this.