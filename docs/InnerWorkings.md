&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*

<hr/>

<!-- toc -->
- [Inner Workings](#inner-workings)
	* [Cron Noncompliance](#cron-noncompliance)
	* [Storage](#storage)
	* [Logs](#logs)
	* [Keeping Time](#keeping-time)
	* [Primary Server Failover](#primary-server-failover)
		+ [Unclean Shutdown](#unclean-shutdown)

# Inner Workings

This section contains details on some of the inner workings of Cronicle.

## Cron Noncompliance

Cronicle has a custom-built scheduling system that is *loosely* based on Unix [Cron](https://en.wikipedia.org/wiki/Cron).  It does not, however, conform to the [specification](https://linux.die.net/man/5/crontab) written by [Paul Vixie](https://en.wikipedia.org/wiki/Paul_Vixie).  Namely, it differs in the following ways:

- Month days and weekdays are intersected when both are present
	- If you specify both month days and weekdays, *both must match* for Cronicle to fire an event.  Vixie Cron behaves differently, in that it will fire if *either* matches.  This was a deliberate design decision to enable more flexibility in scheduling.

When importing Crontab syntax:

- Cronicle does not support the concept of running jobs on reboot, so the `@reboot` macro is disallowed.
- If a 6th column is specified, it is assumed to be years.
- Weekdays `0` and `7` are both considered to be Sunday.

For more details on Cronicle's scheduler implementation, see the [Event Timing Object](APIReference.md#event-timing-object).

## Storage

The storage system in Cronicle is built on the [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) module, which is basically a key/value store.  It can write everything to local disk (the default), [Couchbase](http://www.couchbase.com/nosql-databases/couchbase-server) or [Amazon S3](https://aws.amazon.com/s3/).

Writing to local disk should work just fine for most installations, even with multi-server setups, as long as there is only one primary server.  However, if you want redundant backups with auto-failover, and/or redundant data storage, then you either have to use a shared filesystem such as NFS, or switch to Couchbase or S3.

With an NFS shared filesystem, your primary and backup servers can have access to the same Cronicle data storage.  Only the primary server performs data writes, so there should never be any data corruption.  The easiest way to set up a shared filesystem is to configure Cronicle to point at your NFS mount in the `conf/config.json` file, then run the setup script.  The filesystem storage location is in the `base_dir` property, which is found in the `Storage` / `Filesystem` objects:

```js
{
	"Storage": {
		"engine": "Filesystem",
		"list_page_size": 50,
		"concurrency": 4,
		
		"Filesystem": {
			"base_dir": "/PATH/TO/YOUR/NFS/MOUNT",
			"key_namespaces": 1
		}
	}
}
```

Then run the setup script as instructed in the [Setup](Setup.md) section.  Make sure all your backup servers have the NFS filesystem mounted in the same location, and then copy the `conf/config.json` file to all the servers.  **Do not run the setup script more than once.**

Setting up Couchbase or S3 is handled in much the same way.  Edit the `conf/config.json` file to point to the service of your choice, then run the setup script to create the initial storage records.  See the [Couchbase](Configuration.md#couchbase) or [Amazon S3](Configuration.md#amazon-s3) configuration sections for more details.

## Logs

Cronicle writes its logs in a plain text, square-bracket delimited column format, which looks like this:

```
[1450993152.554][2015/12/24 13:39:12][joeretina.local][Cronicle][debug][3][Cronicle starting up][]
[1450993152.565][2015/12/24 13:39:12][joeretina.local][Cronicle][debug][4][Server is eligible to become primary (Main Group)][]
[1450993152.566][2015/12/24 13:39:12][joeretina.local][Cronicle][debug][3][We are becoming the primary server][]
[1450993152.576][2015/12/24 13:39:12][joeretina.local][Cronicle][debug][2][Startup complete, entering main loop][]
```

The log columns are defined as follows, from left to right:

| Log Column | Description |
|------------|-------------|
| `hires_epoch` | A date/time stamp in high-resolution [Epoch time](https://en.wikipedia.org/wiki/Unix_time). |
| `date` | A human-readable date/time stamp in the format: `YYYY/MM/DD HH:MI:SS` (local server time) |
| `hostname` | The hostname of the server that wrote the log entry (useful for multi-server setups if you merge your logs together). |
| `component` | The component name which generated the log entry.  See below for a list of all the components. |
| `category` | The category of the log entry, which will be one of `debug`, `transaction` or `error`. |
| `code` | Debug level (1 to 10), transaction or error code. |
| `msg` | Debug, transaction or error message text. |
| `data` | Additional JSON data, may or may not present. |

The columns are configurable via the [log_columns](Configuration.md#log_columns) property in the `conf/config.json` file:

```js
{
	"log_columns": ["hires_epoch", "date", "hostname", "component", "category", "code", "msg", "data"]
}
```

Feel free to reorder or remove columns, but don't rename any.  The IDs are special, and match up to keywords in the source code.

By default, logging consists of several different files, each for a specific component of the system.  After starting up Cronicle, you will find these log files in the [log_dir](Configuration.md#log_dir) directory:

| Log Filename | Description |
|--------------|-------------|
| `Cronicle.log` | The main component will contain most of the app logic (scheduler, jobs, startup, shutdown, etc.). |
| `Error.log` | The error log will contain all errors, including job failures, server disconnects, etc. |
| `Transaction.log` | The transaction log will contain all transactions, including API actions, job completions, etc. |
| `API.log` | The API component log will contain information about incoming HTTP API calls. |
| `Storage.log` | The storage component log will contain information about data reads and writes. |
| `Filesystem.log` | Only applicable if you use the local filesystem storage back-end. |
| `Couchbase.log` | Only applicable if you use the [Couchbase](Configuration.md#couchbase) storage back-end. |
| `S3.log` | Only applicable if you use the [Amazon S3](Configuration.md#amazon-s3) storage back-end. |
| `User.log` | The user component log will contain user related information such as logins and logouts. |
| `WebServer.log` | The web server component log will contain information about HTTP requests and connections. |
| `crash.log` | If Cronicle crashed for any reason, you should find a date/time and stack trace in this log. |
| `install.log` | Contains detailed installation notes from npm, and the build script. |

The [log_filename](Configuration.md#log_filename) configuration property controls this, and by default it is set to the following:

```js
{
	"log_filename": "[component].log",
}
```

This causes the value of the `component` column to dictate the actual log filename.  If you would prefer that everything be logged to a single combo file instead, just change this to a normal string without brackets, such as:

```js
{
	"log_filename": "event.log",
}
```

## Keeping Time

Cronicle manages job scheduling for its events by using a "cursor" system, as opposed to a classic queue.  Each event has its own internal cursor (pointer) which contains a timestamp.  This data is stored in RAM but is also persisted to disk for failover.  When the clock advances a minute, the scheduler iterates over all the active events, and moves their cursors forward, always trying to keep them current.  It launches any necessary jobs along the way.

For events that have [Run All Mode](WebUI.md#run-all-mode) set, a cursor may pause or even move backwards, depending on circumstances.  If a job fails to launch, the cursor stays back in the previous minute so it can try again.  In this way jobs virtually "queue up" as time advances.  When the blocking issue is resolved (resource constraint or other), the event cursor will be moved forward as quickly as resources and settings allow, so it can "catch up" to current time.

Also, you have the option of manually resetting an event's cursor using the [Time Machine](WebUI.md#event-time-machine) feature.  This way you can manually have it re-run past jobs, or hop over a "queue" that has built up.

## Primary Server Failover

In a [Multi-Server Cluster](Setup.md#multi-server-cluster), you can designate a number of servers as primary backups, using the [Server Groups](WebUI.md#server-groups) feature.  These backup servers will automatically take over as primary if something happens to the current primary server (shutdown or crash).  Your servers will automatically negotiate who should become primary, both at startup and at failover, based on an alphabetical sort of their hostnames.  Servers which sort higher will become primary before servers that sort lower.

Upon startup there is a ~60 second delay before a primary server is chosen.  This allows time for all the servers in the cluster to auto-discover each other.

### Unclean Shutdown

Cronicle is designed to handle server failures.  If a worker server goes down for any reason, the cluster will automatically adjust.  Any active jobs on the dead server will be failed and possibly retried after a short period of time (see [dead_job_timeout](Configuration.md#dead_job_timeout)), and new jobs will be reassigned to other servers as needed.

If a primary server goes down, one of the backups will take over within 60 seconds (see [master_ping_timeout](Configuration.md#master_ping_timeout)).  The same rules apply for any jobs that were running on the primary server.  They'll be failed and retried as needed by the new primary server, with one exception: unclean shutdown.

When a primary server experiences a catastrophic failure such as a daemon crash, kernel panic or power loss, it has no time to do anything, so any active jobs on the server are instantly dead.  The jobs will eventually be logged as failures, and the logs recovered when the server comes back online.  However, if the events had [Run All Mode](WebUI.md#run-all-mode) enabled, they won't be auto-retried when the new primary takes over, because it has no way of knowing a job was even running.  And by the time the old primary server is brought back online, days or weeks may have passed, so it would be wrong to blindly rewind the event clock to before the event ran.

So in summary, the only time human intervention may be required is if a primary server dies unexpectedly due to an unclean shutdown, and it had active jobs running on it, and those jobs had [Run All Mode](WebUI.md#run-all-mode) set.  In that case, you may want to use the [Time Machine](WebUI.md#event-time-machine) feature to reset the event clock, to re-run any missed jobs.

<hr/>

&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*
