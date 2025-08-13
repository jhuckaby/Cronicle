&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*

<hr/>

<!-- toc -->
- [Configuration](#configuration)
	* [Basics](#basics)
		+ [base_app_url](#base_app_url)
		+ [email_from](#email_from)
		+ [smtp_hostname](#smtp_hostname)
		+ [smtp_port](#smtp_port)
		+ [mail_options](#mail_options)
		+ [secret_key](#secret_key)
		+ [log_dir](#log_dir)
		+ [log_filename](#log_filename)
		+ [log_columns](#log_columns)
		+ [log_archive_path](#log_archive_path)
		+ [copy_job_logs_to](#copy_job_logs_to)
		+ [queue_dir](#queue_dir)
		+ [pid_file](#pid_file)
		+ [debug_level](#debug_level)
		+ [maintenance](#maintenance)
		+ [list_row_max](#list_row_max)
		+ [job_data_expire_days](#job_data_expire_days)
		+ [child_kill_timeout](#child_kill_timeout)
		+ [dead_job_timeout](#dead_job_timeout)
		+ [master_ping_freq](#master_ping_freq)
		+ [master_ping_timeout](#master_ping_timeout)
		+ [udp_broadcast_port](#udp_broadcast_port)
		+ [scheduler_startup_grace](#scheduler_startup_grace)
		+ [universal_web_hook](#universal_web_hook)
		+ [web_hook_custom_data](#web_hook_custom_data)
		+ [web_hook_custom_opts](#web_hook_custom_opts)
		+ [web_hook_text_templates](#web_hook_text_templates)
		+ [job_memory_max](#job_memory_max)
		+ [job_memory_sustain](#job_memory_sustain)
		+ [job_cpu_max](#job_cpu_max)
		+ [job_cpu_sustain](#job_cpu_sustain)
		+ [job_log_max_size](#job_log_max_size)
		+ [job_env](#job_env)
		+ [server_comm_use_hostnames](#server_comm_use_hostnames)
		+ [web_direct_connect](#web_direct_connect)
		+ [web_socket_use_hostnames](#web_socket_use_hostnames)
		+ [socket_io_transports](#socket_io_transports)
		+ [remote_server_port](#remote_server_port)
		+ [max_jobs](#max_jobs)
		+ [max_emails_per_day](#max_emails_per_day)
	* [Storage Configuration](#storage-configuration)
		+ [Filesystem](#filesystem)
		+ [Couchbase](#couchbase)
		+ [Amazon S3](#amazon-s3)
		+ [S3 Compatible Services](#s3-compatible-services)
	* [Web Server Configuration](#web-server-configuration)
	* [User Configuration](#user-configuration)
	* [Email Configuration](#email-configuration)

# Configuration

The main Cronicle configuration file is in JSON format, and can be found here:

```
/opt/cronicle/conf/config.json
```

Please edit this file directly.  It will not be touched by any upgrades.  A pristine copy of the default configuration can always be found here: `/opt/cronicle/sample_conf/config.json`.

## Basics

Here are descriptions of the top-level configuration parameters:

### base_app_url

This should be set to a fully-qualified URL, pointing to your Cronicle server, including the HTTP port number if non-standard.  Do not include a trailing slash.  This is used in e-mails to create self-referencing URLs.  Example:

```
http://local.cronicle.com:3012
```

If you are running Cronicle behind a load balancer, this should be set to the load balanced virtual hostname.

### email_from

The e-mail address to use as the "From" address when sending out notifications.  Most SMTP servers require this to be a valid address to accept mail.

### smtp_hostname

The hostname of your SMTP server, for sending mail.  This can be set to `127.0.0.1` or `localhost` if you have [sendmail](https://en.wikipedia.org/wiki/Sendmail) running locally.

### smtp_port

The port number to use when communicating with the SMTP server.  The default is `25`.

### mail_options

Set specific mailer options, such as SMTP SSL and authentication, passed directly to [pixl-mail](https://github.com/jhuckaby/pixl-mail#options) (and then to [nodemailer](https://nodemailer.com/)).  Example:

```js
"mail_options": {
	"secure": true,
	"auth": { "user": "fsmith", "pass": "12345" },
	"connectionTimeout": 10000,
	"greetingTimeout": 10000,
	"socketTimeout": 10000
}
```

The `connectionTimeout`, `greetingTimeout` and `socketTimeout` properties are all expressed in milliseconds.

You can also use `mail_options` to use local [sendmail](https://nodemailer.com/transports/sendmail/), if you have that configured on your server.  To do this, set the following properties, and tune as needed:

```js
"mail_options": {
	"sendmail": true,
	"newline": "unix",
	"path": "/usr/sbin/sendmail"
}
```

You can omit `smtp_hostname` and `smtp_port` if you are using sendmail.

### secret_key

For multi-server setups, all your Cronicle servers need to share the same secret key.  Any randomly generated string is fine.

The install script will automatically set to this to a random string for you, but you are free to change it to anything you want.  Just make sure all your servers have the same shared secret key.  This is used to authenticate internal server-to-server API requests.

### log_dir

The directory where logs will be written, before they are archived.  This can be a partial path, relative to the Cronicle base directory (`/opt/cronicle`) or a full path to a custom location.  It defaults to `logs` (i.e. `/opt/cronicle/logs`).

### log_filename

The filename to use when writing logs.  You have three options here: a single combined log file for all logs, multiple log files for each component, or multiple log files for each category (debug, transaction, error).  See the [Logs](InnerWorkings.md#logs) section below for details.

### log_columns

This is an array of column IDs to log.  You are free to reorder or remove some of these, but do not change the names.  They are specific IDs that match up to log function calls in the code.  See the [Logs](InnerWorkings.md#logs) section below for details.

### log_archive_path

Every night at midnight (local server time), the logs can be archived (gzipped) to a separate location.  This parameter specifies the path, and the directory naming / filenaming convention of the archive files.  It can utilize date placeholders including `[yyyy]`, `[mm]` and `[dd]`.

This can be a partial path, relative to the Cronicle base directory (`/opt/cronicle`) or a full path to a custom location.  It defaults to `logs/archives/[yyyy]/[mm]/[dd]/[filename]-[yyyy]-[mm]-[dd].log.gz`.

### copy_job_logs_to

Your job logs (i.e. the output from Plugins) are stored separately from the main Cronicle log files.  They are actually written to the Cronicle storage system, and made available in the UI.  This parameter allows you to copy them to a separate directory on disk, presumably for some kind of log processing system (such as [Splunk](http://www.splunk.com/)) to then pick them up, index them, etc.  It is optional, and defaults to disabled.

This can be a partial path, relative to the Cronicle base directory (`/opt/cronicle`) or a full path to a custom location.

### queue_dir

The queue directory is used internally for misc. background tasks, such as handling detached jobs sending messages back to the daemon.  You shouldn't ever have to deal with this directly, and the directory is auto-created on install.  

This can be a partial path, relative to the Cronicle base directory (`/opt/cronicle`) or a full path to a custom location.

### pid_file

The PID file is simply a text file containing the Process ID of the main Cronicle daemon.  It is used by the `control.sh` script to stop the daemon, and detect if it is running.  You should never have to deal with this file directly, and it defaults to living in the `logs` directory which is auto-created.  

This can be a partial path, relative to the Cronicle base directory (`/opt/cronicle`) or a full path to a custom location.  However, it should probably not be changed, as the `control.sh` script expects it to live in `logs/cronicled.pid`.

### debug_level

The level of verbosity in the debug logs.  It ranges from `1` (very quiet) to `10` (extremely loud).  The default value is `9`.

### maintenance

Cronicle needs to run storage maintenance once per day, which generally involves deleting expired records and trimming lists which have grown too large.  This only runs on the primary server, and typically only takes a few seconds, depending on the number of events you have.  The application is still usable during this time, but UI performance may be slightly impacted.

By default the maintenance is set to run at 4:00 AM (local server time).  Feel free to change this to a more convenient time for your server environment.  The format of the parameter is `HH:MM`.

### list_row_max

This parameter controls how many items are kept in historical lists such as the [Activity Log](WebUI.md#activity-log-tab), [Completed Jobs](WebUI.md#completed-jobs-tab), and [Event History](WebUI.md#event-history-tab).  When this limit is exceeded, the oldest entries are removed during the nightly maintenance run.  The default limit is `10000` items.

This has no real effect on performance -- only space on disk (or Couchbase / S3).

### job_data_expire_days

Completed job data is only kept around for this number of days.  This includes job logs and the metadata for each completed job (stats, etc.).  The default value is `180` days, but feel free to tune this for your own environment.

This has no real effect on performance -- only space on disk (or Couchbase / S3).

### child_kill_timeout

This is the number of seconds to allow child processes to exit after sending a TERM signal (for aborted jobs, server shutdown, etc.).  If they do not exit within the specified timeout, a KILL signal is sent.  The default value is `10` seconds.

### dead_job_timeout

When the primary server loses connectivity with a worker that had running jobs on it, they go into a "limbo" state for a period of time, before they are finally considered lost.  The `dead_job_timeout` parameter specifies the amount of time before these wayward jobs are aborted (and possibly retried, depending on the event settings).  The default value is `120` seconds.

This parameter exists because certain networks may have unreliable connections between servers, and it is possible a server may drop for a few seconds, then come right back.  If a short hiccup like that occurs, you probably don't want to abort all the running jobs right away.  Also, when you are upgrading Cronicle itself, you don't want detached jobs to be interrupted.

The worst case scenario is that a remote server with running jobs goes MIA for longer than the `dead_job_timeout`, the primary server aborts all the jobs, then the server reappears and finishes the jobs.  This creates a bit of a mess, because the jobs are reported as both errors and successes.  The latter success prevails in the end, but the errors stay in the logs and event history.

### master_ping_freq

For multi-server clusters, this specifies how often the primary server should send out pings to worker servers, to let them know who is the boss.  The default is `20` seconds.

### master_ping_timeout

For multi-server clusters, this specifies how long to wait after receiving a ping, before a backup server considers the primary server to be dead.  At this point a new primary server will be chosen.  The default value is `60` seconds.

### udp_broadcast_port

For auto-discovery of nearby servers, this specifies the UDP port to use for broadcasting.  Do not worry if your network doesn't support UDP broadcast, as this is just an optional feature where nearby servers will show up in the UI.  The default port is `3014`.

### scheduler_startup_grace

When the scheduler first starts up on the primary server, it waits for a few seconds before actually assigning jobs.  This is to allow all the servers in the cluster to check in and register themselves with the primary server.  The default value is `10` seconds, which should be plenty of time.

Once a server becomes primary, it should immediately attempt to connect to all remote servers right away.  So in theory this grace period could be as short as 1 second or less, but a longer delay allows for any random network connectivity errors to work themselves out.

### universal_web_hook

While you can specify a web hook in the UI per each category and/or per each event, this parameter allows you to define a universal one, which is *always* fired for *every* job regardless of UI settings.  It should be a fully-qualified URL to an API endpoint that accepts an HTTP POST containing JSON data.

Web hooks are fired at the start and the end of each job (success or fail).  A JSON record is sent in the HTTP POST body, which contains all the relevant information about the job, including an `action` property, which will be set to `job_start` at the start and `job_complete` at the end of the job.  See the [Web Hooks](WebUI.md#event-web-hook) section below for more on the data format.

To include custom HTTP request headers with your web hook, append them onto the end of the URL using this format: `[header: My-Header: My-Value]`.  Make sure to include a space before the opening bracket.  Example URL:

```
https://myserver.com/api/chat.postMessage [header: My-Header: My-Value]
```

### web_hook_custom_data

If you need to include custom JSON data with the web hook HTTP POST, you can do so by specifying a `web_hook_custom_data` property, and any keys/values will be merged in with the event data as it is sent to the web hook URL.  Example:

```js
"web_hook_custom_data": {
	"my_custom_key1": "My custom value 1",
	"my_custom_key2": "My custom value 2"
}
```

In this example `my_custom_key1` and `my_custom_key2` will be merged in with the event data that usually accompanies the web hook post data.  See the [Web Hooks](WebUI.md#event-web-hook) section below for more on the data format.

### web_hook_custom_opts

If you need to customize the low-level properties sent to the Node.js [http.request](https://nodejs.org/api/http.html#http_http_request_options_callback) method for making outbound web hook requests, use the `web_hook_custom_opts` property.  Using this you can enable [retries](https://github.com/jhuckaby/pixl-request#automatic-retries) and [redirect following](https://github.com/jhuckaby/pixl-request#automatic-redirects).  Example of enabling both:

 ```js
"web_hook_custom_opts": {
	"retries": 3,
	"follow": 2
}
```

If you are having trouble getting HTTPS (SSL) web hooks to work, you might need to set `rejectUnauthorized` to `false` here.  This causes Node.js to blindly accept the web hook SSL connection, even when it cannot validate the SSL certificate.  Example:

```js
"web_hook_custom_opts": {
	"rejectUnauthorized": false
}
```

Please only do this if you understand the security ramifications, and *completely trust* the host(s) you are connecting to, and the network you are on.  Skipping the certificate validation step should really only be done in special circumstances, such as trying to hit one of your own internal servers, or a proxy with a self-signed cert.

See the [http.request](https://nodejs.org/api/http.html#http_http_request_options_callback) docs for all the possible properties you can set here.

### web_hook_text_templates

The web hook JSON POST data includes a `text` property which is a simple summary of the action taking place, which is compatible with [Slack Webhook Integrations](https://api.slack.com/incoming-webhooks).  These text strings are generated based on the action, and use the following templates:

```js
"web_hook_text_templates": {
	"job_start": "Job started on [hostname]: [event_title] [job_details_url]",
	"job_complete": "Job completed successfully on [hostname]: [event_title] [job_details_url]",
	"job_failure": "Job failed on [hostname]: [event_title]: Error [code]: [description] [job_details_url]",
	"job_launch_failure": "Failed to launch scheduled event: [event_title]: [description] [edit_event_url]"
}
```

You can customize these text strings by including a `web_hook_text_templates` object in your configuration, and setting each of the action properties within.  Also, you can use this to *disable* any of the web hook actions, by simply removing certain action keys.  For example, if you don't want to fire a web hook for starting a job, remove the `job_start` key.  If you only want web hooks to fire for errors, remove both the `job_start` and `job_complete` keys.

The text string templates can use any data values from the web hook JSON data by inserting `[square_bracket]` placeholders.  See the [Web Hooks](WebUI.md#event-web-hook) section below for more on the data format, and which values are available.

### job_memory_max

This parameter allows you to set a default memory usage limit for jobs, specified in bytes.  This is measured as the total usage of the job process *and any sub-processes spawned or forked by the main process*.  If the memory limit is exceeded, the job is aborted.  The default value is `1073741824` (1 GB).  To disable set it to `0`.

Memory limits can also be customized in the UI per each category and/or per each event (see [Event Resource Limits](WebUI.md#event-resource-limits) below).  Doing either overrides the primary default.

### job_memory_sustain

When using the [job_memory_max](Configuration.md#job_memory_max) feature, you can optionally specify how long a job is allowed exceed the maximum memory limit until it is aborted.  For example, you may want to allow jobs to spike over 1 GB of RAM, but not use it sustained for more a certain amount of time.  That is what the `job_memory_sustain` property allows, and it accepts a value in seconds.  It defaults to `0` (abort instantly when exceeded).

Memory limits can also be customized in the UI per each category and/or per each event (see [Event Resource Limits](WebUI.md#event-resource-limits) below).  Doing either overrides the default.

### job_cpu_max

This parameter allows you to set a default CPU usage limit for jobs, specified in percentage of one CPU core.  This is measured as the total CPU usage of the job process *and any sub-processes spawned or forked by the main process*.  If the CPU limit is exceeded, the job is aborted.  The default value is `0` (disabled).  For example, to allow jobs to use up to 2 CPU cores, specify `200` as the limit.

CPU limits can also be customized in the UI per each category and/or per each event (see [Event Resource Limits](WebUI.md#event-resource-limits) below).  Doing either overrides the default.

### job_cpu_sustain

When using the [job_cpu_max](Configuration.md#job_cpu_max) feature, you can optionally specify how long a job is allowed exceed the maximum CPU limit until it is aborted.  For example, you may want to allow jobs to use up to 2 CPU cores, but not use them sustained for more a certain amount of time.  That is what the `job_cpu_sustain` property allows, and it accepts a value in seconds.  It defaults to `0` (abort instantly when exceeded).

CPU limits can also be customized in the UI per each category and/or per each event (see [Event Resource Limits](WebUI.md#event-resource-limits) below).  Doing either overrides the default.

### job_log_max_size

This parameter allows you to set a default log file size limit for jobs, specified in bytes.  If the file size limit is exceeded, the job is aborted.  The default value is `0` (disabled).

Job log file size limits can also be customized in the UI per each category and/or per each event (see [Event Resource Limits](WebUI.md#event-resource-limits) below).  Doing either overrides the default.

### job_env

Place any key/value pairs you want into the `job_env` object, and they will become environment variables passed to all job processes, as they are spawned.  Note that these can be overridden by event parameters with the same names.  The `job_env` can be thought of as a way to specify universal default environment variables for all your jobs.  Example:

```js
"job_env": {
	"TZ": "America/Los_Angeles",
	"LANG": "en_US.UTF-8"
},
```

### server_comm_use_hostnames

Setting this parameter to `true` will force the Cronicle servers to connect to each other using hostnames rather than LAN IP addresses.  This is mainly for special situations where your local server IP addresses may change, and you would prefer to rely on DNS instead.  The default is `false` (disabled), meaning connect using IP addresses.

### web_direct_connect

When this property is set to `false` (which is the default), the Cronicle Web UI will connect to whatever hostname/port is on the URL.  It is expected that this hostname/port will always resolve to your primary server.  This is useful for single server setups, situations when your users do not have direct access to your Cronicle servers via their IPs or hostnames, or if you are running behind some kind of reverse proxy.

If you set this parameter to `true`, then the Cronicle web application will connect *directly* to your individual Cronicle servers.  This is more for multi-server configurations, especially when running behind a [load balancer](Setup.md#load-balancers) with multiple backup servers.  The Web UI must always connect to the primary server, so if you have multiple backup servers, it needs a direct connection.

Note that the ability to watch live logs for active jobs requires a direct web socket connection to the server running the job.  For that feature, this setting has no effect (it always attempts to connect directly).

### web_socket_use_hostnames

Setting this parameter to `true` will force Cronicle's Web UI to connect to the back-end servers using their hostnames rather than IP addresses.  This includes both AJAX API calls and Websocket streams.  You should only need to enable this in special situations where your users cannot access your servers via their LAN IPs, and you need to proxy them through a hostname (DNS) instead.  The default is `false` (disabled), meaning connect using IP addresses.

This property only takes effect if [web_direct_connect](Configuration.md#web_direct_connect) is also set to `true`.

### socket_io_transports

This is an advanced configuration property that you will probably never need to worry about.  This allows you to customize the [socket.io transports](https://socket.io/docs/client-api/) used to connect to the server for real-time updates.  By default, this property is set internally to an array containing the `websocket` transport only, e.g.

```js
"socket_io_transports": ["websocket"]
```

However, if you are trying to run Cronicle in an environment where WebSockets are not allowed (perhaps an ancient firewall or proxy), you can change this array to contain the `polling` transport first, e.g.

```js
"socket_io_transports": ["polling", "websocket"]
```

However, please only do this if you know exactly what you are doing, and why.

### remote_server_port

Normally, Cronicle will attempt to connect to its worker servers on the same HTTP port that the master server is listening on.  However, in some custom / advanced setups, this may be different.  For those cases, you can define a `remote_server_port` property on the master server.  If defined, Cronicle master servers will use this custom port number to connect to its worker servers, rather than the default.  For example, some people may want their master servers to listen on port 80, but their worker servers to listen on another port, such as 3012.

**Important Note:** This feature only works for *single-master* setups!  If you have multiple master servers, they all must listen on the same web server port, and you cannot use `remote_server_port`.  This is a hack at best, and is designed only for single-master multi-worker setups, where the workers have to listen on a different port.

### max_jobs

You can optionally set a global maximum number of concurrent jobs to allow.  This is across all servers and categories, and is designed as an "emergency brake" for runaway events.  The property is called `max_jobs`.  The default is `0` (no limit).  Example:

```js
"max_jobs": 256
```

### max_emails_per_day

You can optionally set a limit on the number of emails Cronicle will send per day.  This is a simple "anti-flood" system, to prevent a repeating failing job from flooding your InBox, if you are not around to address it.  Example:

```js
"max_emails_per_day": 100
```

If the limit is exceeded, Cronicle will log an error for each subsequent send attempt.  The counter resets at midnight server time.

## Storage Configuration

The `Storage` object contains settings for the Cronicle storage system.  This is built on the [pixl-server-storage](https://github.com/jhuckaby/pixl-server-storage) module, which can write everything to local disk (the default), [Couchbase](http://www.couchbase.com/nosql-databases/couchbase-server) or [Amazon S3](https://aws.amazon.com/s3/).

It is highly recommended that you enable transactions in the storage system.  This will protect against database corruption in the event of a crash or sudden power loss:

```js
{
	"Storage": {
		"transactions": true,
		"trans_auto_recover": true,
		
		...
	}
}
```

To select a storage engine, place one of the following values into the `engine` property:

### Filesystem

The default storage method is to use local disk (can also be an NFS mount, for multi-server setups with failover support).  For this, set the `engine` property to `Filesystem`, and declare a sub-object with the same name, with a couple more properties:

```js
{
	"Storage": {
		"transactions": true,
		"trans_auto_recover": true,
		
		"engine": "Filesystem",
		"Filesystem": {
			"base_dir": "data",
			"key_namespaces": 1
		}
	}
}
```

The `base_dir` is the base directory to store everything under.  It can be a fully-qualified filesystem path, or a relative path to the Cronicle base directory (e.g. `/opt/cronicle`).  In this case it will be `/opt/cronicle/data`.

For more details on using the Filesystem as a backing store, please read the [Local Filesystem section in the pixl-server-storage docs](https://github.com/jhuckaby/pixl-server-storage#local-filesystem).

### Couchbase

Please note that as of this writing, Cronicle only supports Couchbase Client v2, so you need to force install version `2.6.12` (see instructions below).  Work is underway to support the v3 API, which has many breaking changes.

To use Couchbase as a backing store for Cronicle, please read the [Couchbase section in the pixl-server-storage docs](https://github.com/jhuckaby/pixl-server-storage#couchbase).  It has complete details for how to setup the storage object.  Example configuration:

```js
{
	"Storage": {
		"transactions": true,
		"trans_auto_recover": true,
		
		"engine": "Couchbase",
		"Couchbase": {
			"connectString": "couchbase://127.0.0.1",
			"bucket": "default",
			"username": "",
			"password": "",
			"serialize": false,
			"keyPrefix": "cronicle"
		}
	}
}
```

If you are sharing a bucket with other applications, use the `keyPrefix` property to keep the Cronicle data separate, in its own "directory".  For example, set `keyPrefix` to `"cronicle"` to keep all the Cronicle-related records in a top-level "cronicle" directory in the bucket.

Note that for Couchbase Server v5.0+ (Couchbase Node SDK 2.5+), you will have to supply both a `username` and `password` for a valid user created in the Couchbase UI.  Prior to v5+ you could omit the `username` and only specify a `password`, or no password at all if your bucket has no authentication.

You'll also need to install the npm [couchbase](https://www.npmjs.com/package/couchbase) module, but it **must be version 2**:

```
cd /opt/cronicle
npm install couchbase@2.6.12
```

After configuring Couchbase, you'll need to run the Cronicle setup script manually, to recreate all the base storage records needed to bootstrap the system:

```
/opt/cronicle/bin/control.sh setup
```

### Amazon S3

To use Amazon S3 as a backing store for Cronicle, please read the [Amazon S3 section in the pixl-server-storage docs](https://github.com/jhuckaby/pixl-server-storage#amazon-s3).  It has complete details for how to setup the storage object.  Example configuration:

```js
{
	"Storage": {
		"transactions": true,
		"trans_auto_recover": true,
		
		"engine": "S3",
		"AWS": {
			"region": "us-west-1",
			"credentials": {
				"accessKeyId": "YOUR_AMAZON_ACCESS_KEY", 
				"secretAccessKey": "YOUR_AMAZON_SECRET_KEY"
			}
		},
		"S3": {
			"connectTimeout": 5000,
			"socketTimeout": 5000,
			"maxAttempts": 50,
			"keyPrefix": "",
			"fileExtensions": true,
			"params": {
				"Bucket": "YOUR_S3_BUCKET_ID"
			},
			"cache": {
				"enabled": true,
				"maxItems": 1000,
				"maxBytes": 10485760
			}
		}
	}
}
```

If you are sharing a bucket with other applications, use the `keyPrefix` property to keep the Cronicle data separate, in its own "directory".  For example, set `keyPrefix` to `"cronicle"` to keep all the Cronicle-related records in a top-level "cronicle" directory in the bucket.  A trailing slash will be automatically added to the prefix if missing.

It is recommended that you always set the S3 `fileExtensions` property to `true` for new installs.  This makes the Cronicle S3 records play nice with sync / copy tools such as [Rclone](https://rclone.org/).  See [Issue #60](https://github.com/jhuckaby/Cronicle/issues/60) for more details.  Do not change this property on existing installs -- use the [Storage Migration Tool](CommandLine.md#storage-migration-tool).

After configuring S3, you'll need to run the Cronicle setup script manually, to recreate all the base storage records needed to bootstrap the system:

```
/opt/cronicle/bin/control.sh setup
```

Regarding S3 costs, with a typical setup running ~30 events per hour (about ~25,000 events per month), this translates to approximately 350,000 S3 PUTs plus 250,000 S3 GETs, or about $2 USD per month.  Add in 100GB of data storage and it's another $3.

### S3 Compatible Services

To use an S3 compatible service such as [MinIO](https://github.com/minio/minio), you'll need to add a few extra parameters to the `AWS` section:

```js
{
	"endpoint": "http://minio:9000",
	"endpointPrefix": false,
	"forcePathStyle": true,
	"hostPrefixEnabled": false
}
```

Replace `minio:9000` with your MinIO hostname or IP address, and port number (9000 is the default).

Here is a complete example with the new parameters added:

```js
{
	"Storage": {
		"transactions": true,
		"trans_auto_recover": true,
		
		"engine": "S3",
		"AWS": {
			"endpoint": "http://minio:9000",
			"endpointPrefix": false,
			"forcePathStyle": true,
			"hostPrefixEnabled": false,
			"region": "us-west-1",
			"credentials": {
				"accessKeyId": "YOUR_MINIO_ACCESS_KEY", 
				"secretAccessKey": "YOUR_MINIO_SECRET_KEY"
			}
		},
		"S3": {
			"connectTimeout": 5000,
			"socketTimeout": 5000,
			"maxAttempts": 50,
			"keyPrefix": "",
			"fileExtensions": true,
			"params": {
				"Bucket": "YOUR_MINIO_BUCKET_ID"
			},
			"cache": {
				"enabled": true,
				"maxItems": 1000,
				"maxBytes": 10485760
			}
		}
	}
}
```

## Web Server Configuration

Cronicle has an embedded web server which handles serving up the user interface, as well as some server-to-server communication that takes place between the primary and workers.  This is configured in the `WebServer` object, and there are only a handful of parameters you should ever need to configure:

```js
{
	"WebServer": {
		"http_port": 3012,
		
		"https": 0,
		"https_port": 3013,
		"https_cert_file": "conf/ssl.crt",
		"https_key_file": "conf/ssl.key"
	}
}
```

Changing the `http_port` is probably the most common thing you will want to customize.  For example, if you don't have anything else running on port 80, you will probably want to change it to that, so you can access the UI without entering a port number.

This is also where you can enable HTTPS, if you want the UI to be SSL encrypted.  Set the `https` property to `1` to enable, and configure the `https_port` as you see fit (the standard HTTPS port is `443`).  You will have to supply your own SSL certificate files (sample self-signed certs are provided for testing, but they will generate browser warnings).

For running Cronicle on a live production environment, it is highly recommended that you include a [http_allow_hosts](https://github.com/jhuckaby/pixl-server-web#http_allow_hosts) property, and set it to the domain you are using for Cronicle.  This will reject all incoming HTTP requests unless the `Host` header matches an entry in the list.  Example use:

```js
{
	"WebServer": {
		"http_allow_hosts": ["my-cronicle-domain.com"]
	}
}
```

For more details on the web server component, please see the [pixl-server-web](https://github.com/jhuckaby/pixl-server-web#configuration) module documentation.

## User Configuration

Cronicle has a simple user login and management system, which is built on the [pixl-server-user](https://github.com/jhuckaby/pixl-server-user) module.  It handles creating new users, assigning permissions, and login / session management.  It is configured in the `User` object, and there are only a couple of parameters you should ever need to configure:

```js
{
	"User": {
		"free_accounts": 0,
		
		"default_privileges": {
			"admin": 0,
			"create_events": 1,
			"edit_events": 1,
			"delete_events": 1,
			"run_events": 0,
			"abort_events": 0,
			"state_update": 0
		}
	}
}
```

The `free_accounts` property specifies whether guests visiting the UI can create their own accounts, or not.  This defaults to `0` (disabled), but you can set it to `1` to enable.  This feature should only be used when your install of Cronicle is running on a private network, and you trust all your employees.

The `default_privileges` object specifies which privileges new accounts will receive by default.  Here is a list of all the possible privileges and what they mean:

| Privilege ID | Description |
|--------------|-------------|
| `admin` | User is a full administrator.  **This automatically grants ALL privileges, current and future.** |
| `create_events` | User is allowed to create new events and add them to the schedule. |
| `edit_events` | User is allowed to edit and save events -- even those created by others. |
| `delete_events` | User is allowed to delete events -- event those created by others. |
| `run_events` | User is allowed to run events on-demand by clicking the "Run" button in the UI. |
| `abort_events` | User is allowed to abort jobs in progress, even those for events created by others. |
| `state_update` | User is allowed to enable or disable the primary scheduler. |

By default new users have the `create_events`, `edit_events` and `delete_events` privileges, and nothing else.  Note that when an administrator creates new accounts via the UI, (s)he can customize the privileges at that point.  The configuration only sets the defaults.

For more details on the user manager component, please see the [pixl-server-user](https://github.com/jhuckaby/pixl-server-user#configuration) module documentation.

## Email Configuration

Cronicle will send a number of different types of e-mails in response to certain events.  These are mostly confirmations of actions, or just simple notifications.  Most of these can be disabled in the UI if desired.  The e-mail content is also configurable, including the `From` and `Subject` headers, and is based on plain text e-mail template files located on disk:

| Action | Email Template | Description |
|--------|----------------|-------------|
| **New User Account** | `conf/emails/welcome_new_user.txt` | Sent when a new user account is created. |
| **Changed Password** | `conf/emails/changed_password.txt` | Sent when a user changes their password. |
| **Recover Password** | `conf/emails/recover_password.txt` | Sent when a user requests password recovery. |
| **Job Succeeded** | `conf/emails/job_success.txt` | Conditionally sent when a job completes successfully (depends on event configuration). |
| **Job Failed** | `conf/emails/job_fail.txt` | Conditionally sent when a job fails (depends on event configuration). |
| **Event Error** | `conf/emails/event_error.txt` | Sent when a job fails to launch (depends on event configuration). |

Feel free to edit these files to your liking.  Note that any text in `[/square_brackets]` is a placeholder which gets swapped out with live data relevant to the event which fired off the e-mail.

Here is an example e-mail template file:

```
To: [/notify_success]
From: [/config/email_from]
Subject: Cronicle Job Completed Successfully: [/event_title]

Date/Time: [/nice_date_time]
Event Title: [/event_title]
Category: [/category_title]
Server Target: [/nice_target]
Plugin: [/plugin_title]

Job ID: [/id]
Hostname: [/hostname]
PID: [/pid]
Elapsed Time: [/nice_elapsed]
Performance Metrics: [/perf]
Avg. Memory Usage: [/nice_mem]
Avg. CPU Usage: [/nice_cpu]

Job Details:
[/job_details_url]

Job Debug Log ([/nice_log_size]):
[/job_log_url]

Edit Event:
[/edit_event_url]

Description:
[/description]

Event Notes:
[/notes]

Regards,
The Cronicle Team
```

The stock e-mail templates shipped with Cronicle are plain text, but you can provide your own rich HTML e-mail templates if you want.  Simply start the e-mail body content (what comes after the Subject line) with an HTML open tag, e.g. `<div>`, and the e-mails will be sent as HTML instead of text.

You can include any property from the main `conf/config.json` file by using the syntax `[/config/KEY]`.  Also, to include environment variables, use the syntax `[/env/ENV_KEY]`, for example `[/env/NODE_ENV]`.

<hr/>

&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*
