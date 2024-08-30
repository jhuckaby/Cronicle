&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*

<hr/>

<!-- toc -->
- [API Reference](#api-reference)
	* [JSON REST API](#json-rest-api)
		+ [Redirects](#redirects)
	* [API Keys](#api-keys)
	* [Standard Response Format](#standard-response-format)
	* [API Calls](#api-calls)
		+ [get_schedule](#get_schedule)
		+ [get_event](#get_event)
		+ [create_event](#create_event)
		+ [update_event](#update_event)
		+ [delete_event](#delete_event)
		+ [get_event_history](#get_event_history)
		+ [get_history](#get_history)
		+ [run_event](#run_event)
		+ [get_job_status](#get_job_status)
		+ [get_active_jobs](#get_active_jobs)
		+ [update_job](#update_job)
		+ [abort_job](#abort_job)
		+ [get_master_state](#get_master_state)
		+ [update_master_state](#update_master_state)
	* [Event Data Format](#event-data-format)
		+ [Event Timing Object](#event-timing-object)

# API Reference

## JSON REST API

All API calls expect JSON as input (unless they are simple HTTP GETs), and will return JSON as output.  The main API endpoint is:

```
/api/app/NAME/v1
```

Replace `NAME` with the specific API function you are calling (see below for list).  All requests should be HTTP GET or HTTP POST as the API dictates, and should be directed at the Cronicle primary server on the correct TCP port (the default is `3012` but is often reconfigured to be `80`).  Example URL:

```
http://myserver.com:3012/api/app/get_schedule/v1
```

For web browser access, [JSONP](https://en.wikipedia.org/wiki/JSONP) response style is supported for all API calls, by including a `callback` query parameter.  However, all responses include a `Access-Control-Allow-Origin: *` header, so cross-domain [XHR](https://en.wikipedia.org/wiki/XMLHttpRequest) requests will work as well.

### Redirects

If you are running a multi-server Cronicle cluster with multiple primary backup servers behind a load balancer, you may receive a `HTTP 302` response if you hit a non-primary server for an API request.  In this case, the `Location` response header will contain the proper primary server hostname.  Please repeat your request pointed at the correct server.  Most HTTP request libraries have an option to automatically follow redirects, so you can make this process automatic.

It is recommended (although not required) that you cache the primary server hostname if you receive a 302 redirect response, so you can make subsequent calls to the primary server directly, without requiring a round trip.  

## API Keys

API Keys allow you to register external applications or services to use the REST API.  These can be thought of as special user accounts specifically for applications.  API calls include running jobs on-demand, monitoring job status, and managing the schedule (creating, editing and/or deleting events).  Each API key can be granted a specific set of privileges.

To create an API Key, you must first be an administrator level user.  Login to the Cronicle UI, proceed to the [API Keys Tab](WebUI.md#api-keys-tab), and click the "Add API Key..." button.  Fill out the form and click the "Create Key" button at the bottom of the page.

API Keys are randomly generated hexadecimal strings, and are 32 characters in length.  Example:

```
0095f5b664b93304d5f8b1a61df605fb
```

You must include a valid API Key with every API request.  There are three ways to do this: include a `X-API-Key` HTTP request header, an `api_key` query string parameter, or an `api_key` JSON property.

Here is a raw HTTP request showing all three methods of passing the API Key (only one of these is required):

```
GET /api/app/get_schedule/v1?api_key=0095f5b664b93304d5f8b1a61df605fb HTTP/1.1
Host: myserver.com
X-API-Key: 0095f5b664b93304d5f8b1a61df605fb
Content-Type: application/json

{"offset": 0, "limit": 50, "api_key": "0095f5b664b93304d5f8b1a61df605fb"}
```

## Standard Response Format

Regardless of the specific API call you requested, all responses will be in JSON format, and include at the very least a `code` property.  This will be set to `0` upon success, or any other value if an error occurred.  In the event of an error, a `description` property will also be included, containing the error message itself.  Individual API calls may include additional properties, but these two are standard fare in all cases.  Example successful response:

```js
{ "code": 0 }
```

Example error response:

```js
{"code": "session", "description": "No Session ID or API Key could be found"}
```

## API Calls

Here is the list of supported API calls:

### get_schedule

```
/api/app/get_schedule/v1
```

This fetches scheduled events and returns details about them.  It supports pagination to fetch chunks, with the default being the first 50 events.  Both HTTP GET (query string) or HTTP POST (JSON data) are acceptable.  Parameters:

| Parameter Name | Description |
|----------------|-------------|
| `offset` | (Optional) The offset into the data to start returning records, defaults to 0. |
| `limit` | (Optional) The number of records to return, defaults to 50. |

Example request:

```js
{
	"offset": 0,
	"limit": 1000
}
```

Example response:

```js
{
	"code": 0,
	"rows": [
		{
			"enabled": 1,
			"params": {
				"script": "#!/bin/sh\n\n/usr/local/bin/db-reindex.pl\n"
			},
			"timing": {
				"minutes": [ 10 ]
			},
			"max_children": 1,
			"timeout": 3600,
			"catch_up": false,
			"plugin": "shellplug",
			"title": "Rebuild Indexes",
			"category": "general",
			"target": "c33ff006",
			"multiplex": 0,
			"retries": 0,
			"detached": 0,
			"notify_success": "",
			"notify_fail": "",
			"web_hook": "",
			"notes": "",
			"id": "29bf12db",
			"modified": 1445233242,
			"created": 1445233022,
			"username": "admin",
			"timezone": "America/Los_Angeles"
		}
	],
	"list": {
		"page_size": 50,
		"first_page": 0,
		"last_page": 0,
		"length": 12,
		"type": "list"
	}
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), this API will include the following:

The `rows` array will contain an element for every matched event in the requested set.  It will contain up to `limit` elements.  See the [Event Data Format](APIReference.md#event-data-format) section below for details on the event object properties themselves.

The `list` object contains internal metadata about the list structure in storage.  You can probably ignore this, except perhaps the `list.length` property, which will contain the total number of events in the schedule, regardless if your `offset` and `limit` parameters.  This can be useful for building pagination systems.

### get_event

```
/api/app/get_event/v1
```

This fetches details about a single event, given its ID or exact title.  Both HTTP GET (query string) or HTTP POST (JSON data) are acceptable.  Parameters:

| Parameter Name | Description |
|----------------|-------------|
| `id` | The ID of the event you wish to fetch details on. |
| `title` | The exact title of the event you wish to fetch details on (case-sensitive). |

Example request:

```js
{
	"id": "540cf457"
}
```

Example response:

```js
{
	"code": 0,
	"event": {
		"enabled": 0,
		"params": {
			"script": "#!/bin/sh\n\n/usr/local/bin/s3-backup-logs.pl\n"
		},
		"timing": {
			"minutes": [ 5 ]
		},
		"max_children": 1,
		"timeout": 3600,
		"catch_up": false,
		"plugin": "shellplug",
		"title": "Backup Logs to S3",
		"category": "ad8190ff",
		"target": "all",
		"multiplex": 0,
		"retries": 0,
		"detached": 0,
		"notify_success": "",
		"notify_fail": "",
		"web_hook": "",
		"notes": "",
		"id": "540cf457",
		"modified": 1449941100,
		"created": 1445232960,
		"username": "admin",
		"retry_delay": 0,
		"cpu_limit": 0,
		"cpu_sustain": 0,
		"memory_limit": 0,
		"memory_sustain": 0,
		"log_max_size": 0,
		"timezone": "America/Los_Angeles"
	}
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), this API will include the following:

The `event` object will contain the details for the requested event.  See the [Event Data Format](APIReference.md#event-data-format) section below for details on the event object properties themselves.

If [Allow Queued Jobs](WebUI.md#allow-queued-jobs) is enabled on the event, the API response will also include a `queue` property, which will be set to the number of jobs currently queued up.

If there are any active jobs currently running for the event, they will also be included in the response, in a `jobs` array.  Each job object will contain detailed information about the running job.  See [get_job_status](APIReference.md#get_job_status) below for more details.

### create_event

```
/api/app/create_event/v1
```

This creates a new event and adds it to the schedule.  API Keys require the `create_events` privilege to use this API.  Only HTTP POST (JSON data) is acceptable.  The required parameters are as follows:

| Parameter Name | Description |
|----------------|-------------|
| `title` | **(Required)** A display name for the event, shown on the [Schedule Tab](WebUI.md#schedule-tab) as well as in reports and e-mails. |
| `enabled` | **(Required)** Specifies whether the event is enabled (active in the scheduler) or not.  Should be set to 1 or 0. |
| `category` | **(Required)** The Category ID to which the event will be assigned.  See [Categories Tab](WebUI.md#categories-tab). |
| `plugin` | **(Required)** The ID of the Plugin which will run jobs for the event. See [Plugins Tab](WebUI.md#plugins-tab). |
| `target` | **(Required)** Events can target a [Server Group](WebUI.md#server-groups) (Group ID), or an individual server (hostname). |

In addition to the required parameters, almost anything in the [Event Data Object](APIReference.md#event-data-format) can also be included here.  Example request:

```js
{
	"catch_up": 1,
	"category": "43f8c57e",
	"cpu_limit": 100,
	"cpu_sustain": 0,
	"detached": 0,
	"enabled": 1,
	"log_max_size": 0,
	"max_children": 1,
	"memory_limit": 0,
	"memory_sustain": 0,
	"modified": 1451185588,
	"multiplex": 0,
	"notes": "This event handles database maintenance.",
	"notify_fail": "",
	"notify_success": "",
	"params": {
		"db_host": "idb01.mycompany.com",
		"verbose": 1,
		"cust": "Sales"
	},
	"plugin": "test",
	"retries": 0,
	"retry_delay": 30,
	"target": "db1.int.myserver.com",
	"timeout": 3600,
	"timezone": "America/New_York",
	"timing": {
		"hours": [ 21 ],
		"minutes": [ 20, 40 ]
	},
	"title": "DB Reindex",
	"web_hook": "http://myserver.com/notify-chronos.php"
}
```

In the above example we've included a `timing` object, and set it to run daily at 9:20 PM and 9:40 PM in the `America/New_York` timezone.  If you omit the `timing` object entirely, the event becomes "on demand", and can only be run manually via user or API.  If you do include a `timing` object but keep it empty (no properties inside it), the event will run **every** minute of **every** day of **every** month of **every** year.

Example response:

```js
{
	"code": 0,
	"id": "540cf457"
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), the ID of the new event will be returned in the `id` property.

### update_event

```
/api/app/update_event/v1
```

This updates an existing event given its ID, replacing any properties you specify.  API Keys require the `edit_events` privilege to use this API.  Only HTTP POST (JSON data) is acceptable.  The parameters are as follows:

| Parameter Name | Description |
|----------------|-------------|
| `id` | **(Required)** The ID of the event you wish to update. |
| `reset_cursor` | (Optional) Reset the event clock to the given Epoch timestamp (see [Event Time Machine](WebUI.md#event-time-machine)). |
| `abort_jobs` | (Optional) If you are disabling the event by setting `enabled` to 0, you may also abort any running jobs if you want. |

Include anything from the [Event Data Object](APIReference.md#event-data-format) to update (i.e. replace) the values.  Anything omitted is preserved.  Example request:

```js
{
	"id": "3c182051",
	"enabled": 0,
}
```

Example request with everything updated:

```js
{
	"id": "3c182051",
	"reset_cursor": 1451185588,
	"abort_jobs": 0,
	"catch_up": 1,
	"category": "43f8c57e",
	"cpu_limit": 100,
	"cpu_sustain": 0,
	"detached": 0,
	"enabled": 1,
	"log_max_size": 0,
	"max_children": 1,
	"memory_limit": 0,
	"memory_sustain": 0,
	"multiplex": 0,
	"notes": "This event handles database maintenance.",
	"notify_fail": "",
	"notify_success": "",
	"params": {
		"db_host": "idb01.mycompany.com",
		"verbose": 1,
		"cust": "Marketing"
	},
	"plugin": "test",
	"retries": 0,
	"retry_delay": 30,
	"target": "db1.int.myserver.com",
	"timeout": 3600,
	"timezone": "America/New_York",
	"timing": {
		"hours": [ 21 ],
		"minutes": [ 20, 40 ]
	},
	"title": "DB Reindex",
	"username": "admin",
	"web_hook": "http://myserver.com/notify-chronos.php"
}
```

Example response:

```js
{
	"code": 0
}
```

See the [Standard Response Format](APIReference.md#standard-response-format) for details.

### delete_event

```
/api/app/delete_event/v1
```

This deletes an existing event given its ID.  Note that the event must not have any active jobs still running (or else an error will be returned).  API Keys require the `delete_events` privilege to use this API.  Only HTTP POST (JSON data) is acceptable.  The parameters are as follows:

| Parameter Name | Description |
|----------------|-------------|
| `id` | **(Required)** The ID of the event you wish to delete. |

Example request:

```js
{
	"id": "3c182051"
}
```

Example response:

```js
{
	"code": 0
}
```

See the [Standard Response Format](APIReference.md#standard-response-format) for details.

### get_event_history

```
/api/app/get_event_history/v1
```

This fetches the event history (i.e. previously completed jobs) for a specific event.  The response array is sorted by reverse timestamp (descending), so the latest jobs are listed first.  The parameters are as follows:

| Parameter Name | Description |
|----------------|-------------|
| `id` | The **Event ID** of the scheduled event you want to get history for.  You can find this on the Edit Event page at the very top of the form, above the event title.  |
| `offset` | The offset into the data.  Passing `0` means get the latest jobs. |
| `limit` | The number of jobs to fetch. |

Example request:

```js
{
	"id": "3c182051",
	"offset": 0,
	"limit": 100
}
```

Example response:

```js
{
	"code": 0,
	"rows": [ {...}, {...}, ... ],
	"list": { "length": 500 }
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), the `rows` array contains information about the completed jobs, each one following the [Event Data Format](#event-data-format).  The `list.length` property contains the full list of all available items, regardless of your `offset` and `limit` parameters.

This API requires authentication, so please setup an [API Key](#api-keys) and pass it in using any of the methods available.

### get_history

```
/api/app/get_history/v1
```

This fetches previously completed jobs for **all** events.  The response array is sorted by reverse timestamp (descending), so the latest jobs are listed first.  The parameters are as follows:

| Parameter Name | Description |
|----------------|-------------|
| `offset` | The offset into the data.  Passing `0` means get the latest jobs. |
| `limit` | The number of jobs to fetch. |

Example request:

```js
{
	"offset": 0,
	"limit": 100
}
```

Example response:

```js
{
	"code": 0,
	"rows": [ {...}, {...}, ... ],
	"list": { "length": 500 }
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), the `rows` array contains information about the completed jobs, each one following the [Event Data Format](#event-data-format).  The `list.length` property contains the full list of all available items, regardless of your `offset` and `limit` parameters.

This API requires authentication, so please setup an [API Key](#api-keys) and pass it in using any of the methods available.

### run_event

```
/api/app/run_event/v1
```

This immediately starts an on-demand job for an event, regardless of the schedule.  This is effectively the same as a user clicking the "Run Now" button in the UI.  API Keys require the `run_events` privilege to use this API.  Both HTTP GET (query string) or HTTP POST (JSON data) are acceptable.  You can specify the target event by its ID or exact title:

| Parameter Name | Description |
|----------------|-------------|
| `id` | The ID of the event you wish to run a job for. |
| `title` | The exact title of the event you wish to run a job for (case-sensitive). |

You can also include almost anything from the [Event Data Object](APIReference.md#event-data-format) to customize the settings for the job.  Anything omitted is pulled from the event object.  Example request:

```js
{
	"id": "3c182051"
}
```

Example request with everything customized:

```js
{
	"id": "3c182051",
	"category": "43f8c57e",
	"cpu_limit": 100,
	"cpu_sustain": 0,
	"detached": 0,
	"log_max_size": 0,
	"max_children": 1,
	"memory_limit": 0,
	"memory_sustain": 0,
	"multiplex": 0,
	"notify_fail": "",
	"notify_success": "",
	"params": {
		"db_host": "idb01.mycompany.com",
		"verbose": 1,
		"cust": "Marketing"
	},
	"plugin": "test",
	"retries": 0,
	"retry_delay": 30,
	"target": "db1.internal.myserver.com",
	"timeout": 3600,
	"title": "DB Reindex",
	"username": "admin",
	"web_hook": "http://myserver.com/notify-chronos.php"
}
```

Note that the `params` object can be omitted entirely, or sparsely populated, and any missing properties that are defined in the event are automatically merged in.  This allows your API client to only specify the `params` it needs to (including arbitrary new ones).

Example response:

```js
{
	"code": 0,
	"ids": ["23f5c37f", "f8ac3082"]
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), the IDs of all the launched jobs will be returned in the `ids` array.  Typically only a single job is launched, but it may be multiple if the event has [Multiplexing](WebUI.md#multiplexing) enabled and targets a group with multiple servers.

If [Allow Queued Jobs](WebUI.md#allow-queued-jobs) is enabled on the event, the API response will also include a `queue` property, which will be set to the number of jobs currently queued up.

**Advanced Tip:** If you do not wish to merge the POST data into the `params` (for example if you are using a webhook that provides other data as JSON), then you can add `&post_data=1` to the query string. If you do this, then the POST data will be available in the `post_data` key of the `params` object.

### get_job_status

```
/api/app/get_job_status/v1
```

This fetches status for a job currently in progress, or one already completed.  Both HTTP GET (query string) or HTTP POST (JSON data) are acceptable.  Parameters:

| Parameter Name | Description |
|----------------|-------------|
| `id` | **(Required)** The ID of the job you wish to fetch status on. |

Example request:

```js
{
	"id": "jiinxhh5203"
}
```

Example response:

```js
{
	"code": 0,
	"job": {
		"params": {
			"db_host": "idb01.mycompany.com",
			"verbose": 1,
			"cust": "Marketing"
		},
		"timeout": 3600,
		"catch_up": 1,
		"plugin": "test",
		"category": "43f8c57e",
		"retries": 0,
		"detached": 0,
		"notify_success": "jhuckaby@test.com",
		"notify_fail": "jhuckaby@test.com",
		"web_hook": "http://myserver.com/notify-chronos.php",
		"notes": "Joe testing.",
		"multiplex": 0,
		"memory_limit": 0,
		"memory_sustain": 0,
		"cpu_limit": 0,
		"cpu_sustain": 0,
		"log_max_size": 0,
		"retry_delay": 30,
		"timezone": "America/New_York",
		"source": "Manual (admin)",
		"id": "jiiqjexr701",
		"time_start": 1451341765.987,
		"hostname": "joeretina.local",
		"command": "bin/test-plugin.js",
		"event": "3c182051",
		"now": 1451341765,
		"event_title": "Test Event 2",
		"plugin_title": "Test Plugin",
		"category_title": "Test Cat",
		"nice_target": "joeretina.local",
		"log_file": "/opt/cronicle/logs/jobs/jiiqjexr701.log",
		"pid": 11743,
		"progress": 1,
		"cpu": {
			"min": 19,
			"max": 19,
			"total": 19,
			"count": 1,
			"current": 19
		},
		"mem": {
			"min": 214564864,
			"max": 214564864,
			"total": 214564864,
			"count": 1,
			"current": 214564864
		},
		"complete": 1,
		"code": 0,
		"description": "Success!",
		"perf": "scale=1&total=90.319&db_query=3.065&db_connect=5.096&log_read=7.425&gzip_data=11.094&http_post=17.72",
		"log_file_size": 25110,
		"time_end": 1451341856.61,
		"elapsed": 90.62299990653992
	}
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), the job details can be found in the `job` object.

In the `job` object you'll find all the standard [Event Data Object](APIReference.md#event-data-format) properties, as well as the following properties unique to this API:

| Property Name | Description |
|---------------|-------------|
| `hostname` | The hostname of the server currently running, or the server who ran the job. |
| `source` | If the job was started manually via user or API, this will contain a text string identifying who it was. |
| `log_file` | A local filesystem path to the job's log file (only applicable if job is in progress). |
| `pid` | The main PID of the job process that was spawned. |
| `progress` | Current progress of the job, from `0.0` to `1.0`, as reported by the Plugin (optional). |
| `complete` | Will be set to `1` when the job is complete, omitted if still in progress. |
| `code` | A code representing job success (`0`) or failure (any other value).  Only applicable for completed jobs. |
| `description` | If the job failed, this will contain the error message.  Only applicable for completed jobs. |
| `perf` | [Performance metrics](Plugins.md#performance-metrics) for the job, if reported by the Plugin (optional). Only applicable for completed jobs. |
| `time_start` | A Unix Epoch timestamp of when the job started. |
| `time_end` | A Unix Epoch timestamp of when the job completed. Only applicable for completed jobs. |
| `elapsed` | The elapsed time of the job, in seconds. |
| `cpu` | An object representing the CPU use of the job.  See below. |
| `mem` | An object representing the memory use of the job.  See below. |

Throughout the course of a job, its process CPU and memory usage are measured periodically, and tracked in these objects:

```js
{
	"cpu": {
		"min": 19,
		"max": 19,
		"total": 19,
		"count": 1,
		"current": 19
	},
	"mem": {
		"min": 214564864,
		"max": 214564864,
		"total": 214564864,
		"count": 1,
		"current": 214564864
	}
}
```

The CPU is measured as percentage of one CPU core, so 100 means that a full CPU core is in use.  It may also go above 100, if multiple threads or sub-processes are in use.  The current value can be found in `current`, and the minimum (`min`) and maximum (`max`) readings are also tracked.  To compute the average, divide the `total` value by the `count`.

The memory usage is measured in bytes.  The current value can be found in `current`, and the minimum (`min`) and maximum (`max`) readings are also tracked.  To compute the average, divide the `total` value by the `count`.

### get_active_jobs

```
/api/app/get_active_jobs/v1
```

This fetches status for **all active** jobs, and returns them all at once.  It takes no parameters (except an [API Key](APIReference.md#api-keys) of course).  The response format is as follows:

```js
{
	"code": 0,
	"jobs": {
		"jk6lmar4c01": {
			...
		},
		"jk6lmar4d04": {
			...
		}
	}
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), the response object will contain a `jobs` object.  This object will have zero or more nested objects, each representing one active job.  The inner property names are the Job IDs, and the contents are the status, progress, and other information about the active job.  For details on the job objects, see the [get_job_status](APIReference.md#get_job_status) API call above, as the parameters of each job will be the same as that API.

### update_job

```
/api/app/update_job/v1
```

This updates a job that is already in progress.  Only certain job properties may be changed when the job is running, and those are listed below.  This is typically used to adjust timeouts, resource limits, or user notification settings.  API Keys require the `edit_events` privilege to use this API.  Only HTTP POST (JSON data) is acceptable.  The parameters are as follows:

| Parameter Name | Description |
|----------------|-------------|
| `id` | **(Required)** The ID of the job you wish to update. |
| `timeout` | (Optional) The total run time in seconds to allow, before the job is aborted. |
| `retries` | (Optional) The number of retries before the job is reported a failure. |
| `retry_delay` | (Optional) The number of seconds between retries. |
| `chain` | (Optional) Launch another event when the job completes successfully (see [Chain Reaction](WebUI.md#chain-reaction)). |
| `chain_error` | (Optional) Launch another event when the job fails (see [Chain Reaction](WebUI.md#chain-reaction)). |
| `notify_success` | (Optional) A comma-separated list of e-mail addresses to notify on job success. |
| `notify_fail` | (Optional) A comma-separated list of e-mail addresses to notify on job failure. |
| `web_hook` | (Optional) A fully-qualified URL to ping when the job completes. |
| `cpu_limit` | (Optional) The maximum allowed CPU before the job is aborted (100 = 1 CPU core). |
| `cpu_sustain` | (Optional) The number of seconds to allow the max CPU to be exceeded. |
| `memory_limit` | (Optional) The maximum allowed memory usage (in bytes) before the job is aborted. |
| `memory_sustain` | (Optional) The number of seconds to allow the max memory to be exceeded. |
| `log_max_size` | (Optional) The maximum allowed job log file size (in bytes) before the job is aborted. |

As shown above, you can include *some* of the properties from the [Event Data Object](APIReference.md#event-data-format) to customize the job in progress.  Example request:

```js
{
	"id": "j3c182051",
	"timeout": 300,
	"notify_success": "email@server.com"
}
```

Example response:

```js
{
	"code": 0
}
```

See the [Standard Response Format](APIReference.md#standard-response-format) for details.

### abort_job

```
/api/app/abort_job/v1
```

This aborts a running job given its ID.  API Keys require the `abort_events` privilege to use this API.  Only HTTP POST (JSON data) is acceptable.  The parameters are as follows:

| Parameter Name | Description |
|----------------|-------------|
| `id` | **(Required)** The ID of the job you wish to abort. |

Example request:

```js
{
	"id": "jiinxhh5203"
}
```

Example response:

```js
{
	"code": 0
}
```

See the [Standard Response Format](APIReference.md#standard-response-format) for details.

### get_master_state

```
/api/app/get_master_state/v1
```

This fetches the current application "state", which contains information like the status of the scheduler (enabled or disabled).  The API accepts no parameters.  Example response:

```js
{
	"code": 0,
	"state": { "enabled": 1 }
}
```

In addition to the [Standard Response Format](APIReference.md#standard-response-format), the response object will contain a `state` object.  This will contain an `enabled` property, which indicates the current state of the scheduler (enabled or disabled).  It may also contain other properties, but they are for internal use and can be ignored.

### update_master_state

```
/api/app/update_master_state/v1
```

This updates the master application state, i.e. toggling the scheduler on/off.  API Keys require the `state_update` privilege to use this API.  Only HTTP POST (JSON data) is acceptable.  The parameters are as follows:

| Parameter Name | Description |
|----------------|-------------|
| `enabled` | **(Required)** The desired new state of the scheduler (`1` for enabled or `0` for disabled). |

Example request:

```js
{
	"enabled": 1
}
```

Example response:

```js
{
	"code": 0
}
```

See the [Standard Response Format](APIReference.md#standard-response-format) for details.

## Event Data Format

Here are descriptions of all the properties in the event object, which is common in many API calls:

| Event Property | Format | Description |
|----------------|--------|-------------|
| `algo` | String | Specifies the algorithm to use for picking a server from the target group. See [Algorithm](WebUI.md#algorithm). |
| `api_key` | String | The API Key of the application that originally created the event (if created via API). |
| `catch_up` | Boolean | Specifies whether the event has [Run All Mode](WebUI.md#run-all-mode) enabled or not. |
| `category` | String | The Category ID to which the event is assigned.  See [Categories Tab](WebUI.md#categories-tab). |
| `chain` | String | The chain reaction event ID to launch when jobs complete successfully.  See [Chain Reaction](WebUI.md#chain-reaction). |
| `chain_error` | String | The chain reaction event ID to launch when jobs fail.  See [Chain Reaction](WebUI.md#chain-reaction). |
| `cpu_limit` | Number | Limit the CPU to the specified percentage (100 = 1 core), abort if exceeded. See [Event Resource Limits](WebUI.md#event-resource-limits). |
| `cpu_sustain` | Number | Only abort if the CPU limit is exceeded for this many seconds. See [Event Resource Limits](WebUI.md#event-resource-limits). |
| `created` | Number | The date/time of the event's initial creation, in Epoch seconds. |
| `detached` | Boolean | Specifies whether [Detached Mode](WebUI.md#detached-mode) is enabled or not. |
| `enabled` | Boolean | Specifies whether the event is enabled (active in the scheduler) or not. |
| `id` | String | A unique ID assigned to the event when it was first created. |
| `log_max_size` | Number | Limit the job log file size to the specified amount, in bytes.  See [Event Resource Limits](WebUI.md#event-resource-limits). |
| `max_children` | Number | The total amount of concurrent jobs allowed to run. See [Event Concurrency](WebUI.md#event-concurrency). |
| `memory_limit` | Number | Limit the memory usage to the specified amount, in bytes. See [Event Resource Limits](WebUI.md#event-resource-limits). |
| `memory_sustain` | Number | Only abort if the memory limit is exceeded for this many seconds. See [Event Resource Limits](WebUI.md#event-resource-limits). |
| `modified` | Number | The date/time of the event's last modification, in Epoch seconds. |
| `multiplex` | Boolean | Specifies whether the event has [Multiplexing](WebUI.md#multiplexing) mode is enabled or not. |
| `notes` | String | Text notes saved with the event, included in e-mail notifications. See [Event Notes](WebUI.md#event-notes). |
| `notify_fail` | String | List of e-mail recipients to notify upon job failure (CSV). See [Event Notification](WebUI.md#event-notification). |
| `notify_success` | String | List of e-mail recipients to notify upon job success (CSV). See [Event Notification](WebUI.md#event-notification). |
| `params` | Object | An object containing the Plugin's custom parameters, filled out with values from the Event Editor. See [Plugins Tab](WebUI.md#plugins-tab). |
| `plugin` | String | The ID of the Plugin which will run jobs for the event. See [Plugins Tab](WebUI.md#plugins-tab). |
| `queue` | Boolean | Allow jobs to be queued up when they can't run immediately. See [Allow Queued Jobs](WebUI.md#allow-queued-jobs). |
| `queue_max` | Number | Maximum queue length, when `queue` is enabled. See [Allow Queued Jobs](WebUI.md#allow-queued-jobs). |
| `retries` | Number | The number of retries to allow before reporting an error. See [Event Retries](WebUI.md#event-retries). |
| `retry_delay` | Number | Optional delay between retries, in seconds. See [Event Retries](WebUI.md#event-retries). |
| `stagger` | Number | If [Multiplexing](WebUI.md#multiplexing) is enabled, this specifies the number of seconds to wait between job launches. |
| `target` | String | Events can target a [Server Group](WebUI.md#server-groups) (Group ID), or an individual server (hostname). |
| `timeout` | Number | The maximum allowed run time for jobs, specified in seconds. See [Event Timeout](WebUI.md#event-timeout). |
| `timezone` | String | The timezone for interpreting the event timing settings. Needs to be an [IANA timezone string](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).  See [Event Timing](WebUI.md#event-timing). |
| `timing` | Object | An object describing when to run scheduled jobs.  See [Event Timing Object](APIReference.md#event-timing-object) below for details. |
| `title` | String | A display name for the event, shown on the [Schedule Tab](WebUI.md#schedule-tab) as well as in reports and e-mails. |
| `username` | String | The username of the user who originally created the event (if created in the UI). |
| `web_hook` | String | An optional URL to hit for the start and end of each job. See [Event Web Hook](WebUI.md#event-web-hook). |

### Event Timing Object

The `timing` object describes the event's timing settings (when and how frequent it should run jobs).  It works similarly to the [Unix Cron](https://en.wikipedia.org/wiki/Cron) system, with selections of years, months, days, weekdays, hours and/or minutes.  Each property should be an array of numerical values.  If omitted, it means the same as "all" in that category (i.e. asterisk `*` in Cron syntax).

For example, an event with this timing object would run once per hour, on the hour:

```js
{
	"minutes": [0]
}
```

It essentially means every year, every month, every day, every hour, but only on the "0" minute.  The scheduler ticks only once a minute, so this only results in running one job for each matching minute.

For another example, this would run twice daily, at 4:30 AM and 4:30 PM:

```js
{
	"hours": [4, 16],
	"minutes": [30]
}
```

For a more complex example, this would run only in year 2015, from March to May, on the 1st and 15th of the month (but only if also weekdays), at 6AM to 10AM, and on the :15 and :45 of those hours:

```js
{
	"years": [2015],
	"months": [3, 4, 5],
	"days": [1, 15],
	"weekdays": [1, 2, 3, 4, 5],
	"hours": [6, 7, 8, 9, 10],
	"minutes": [15, 45]
}
```

Here is a list of all the timing object properties and their descriptions:

| Timing Property | Range | Description |
|-----------------|-------|-------------|
| `years` | ∞ | One or more years in YYYY format. |
| `months` | 1 - 12 | One or more months, where January is 1 and December is 12. |
| `days` | 1 - 31 | One or more month days, from 1 to 31. |
| `weekdays` | 0 - 6 | One or more weekdays, where Sunday is 0, and Saturday is 6 |
| `hours` | 0 - 23 | One or more hours in 24-hour time, from 0 to 23. |
| `minutes` | 0 - 59 | One or more minutes, from 0 to 59. |

<hr/>

&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*
