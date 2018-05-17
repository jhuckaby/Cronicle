# Overview

This module is a component for use in [pixl-server](https://www.npmjs.com/package/pixl-server).  It implements a server-side user login and management API, and is built atop the [pixl-server-api](https://www.npmjs.com/package/pixl-server-api) and [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) components.  You still need to build a client-side UI to send requests to the API, but this is a great starting point for a webapp back-end.

This document assumes you are already familiar with [pixl-server](https://www.npmjs.com/package/pixl-server) and the following three components:

* [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage)
* [pixl-server-web](https://www.npmjs.com/package/pixl-server-web)
* [pixl-server-api](https://www.npmjs.com/package/pixl-server-api)

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-server pixl-server-storage pixl-server-web pixl-server-api pixl-server-user
```

Here is a simple usage example.  Note that the component's official name is `User`, so that is what you should use for the configuration key, and for gaining access to the component via your server object.

```javascript
var PixlServer = require('pixl-server');
var server = new PixlServer({
	
	__name: 'MyServer',
	__version: "1.0",
	
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		
		"Storage": {
			"engine": "File",
			"File": {
				"base_dir": "/var/data/myserver"
			}
		},
		
		"WebServer": {
			"http_port": 80,
			"http_htdocs_dir": "/var/www/html"
		},
		
		"API": {
			"base_uri": "/api"
		},
		
		"User": {
			"free_accounts": 0,
			"sort_global_users": 1
		}
	},
	
	components: [
		require('pixl-server-storage'),
		require('pixl-server-web'),
		require('pixl-server-api'),
		require('pixl-server-user')
	]
	
});

server.startup( function() {
	// server startup complete
} );
```

Notice how we are loading the [pixl-server](https://www.npmjs.com/package/pixl-server) parent module, and then loading our components into the `components` array, with `pixl-server-user` at the very bottom:

```javascript
components: [
	require('pixl-server-storage'),
	require('pixl-server-web'),
	require('pixl-server-api'),
	require('pixl-server-user')
]
```

This example demonstrates a very simple user manager implementation, which will accept JSON formatted HTTP POSTs to URIs such as `/api/user/create` and `/api/user/login`, and will send back serialized JSON responses.

# Configuration

The configuration for this component is set by passing in a `User` key in the `config` element when constructing the `PixlServer` object, or, if a JSON configuration file is used, a `User` object at the outermost level of the file structure.  It can contain the following keys:

## free_accounts

The `free_accounts` property controls whether the [create](#create) API is "free" (allowed by non-users).  Meaning, if this property is set to `true`, anyone can create an account.  If set to `false` (the default), you must create an administrator account first (see [Initial Setup](#initial-setup)).  The administrator must then login, and call [admin_create](#admin_create) to create user accounts.

## session_expire_days

The `session_expire_days` property specifies the number of days that idle sessions should exist before being automatically deleted.  The default value is `30` days.

## max_failed_logins_per_hour

The `max_failed_logins_per_hour` property specifies the maximum number of failed password attempts to allow per account per hour, before the account is locked out.  If an account becomes locked, the only way to unlock it is to reset the password.  The default value is `5`.

## max_forgot_passwords_per_hour

The `max_forgot_passwords_per_hour` property specifies the maximum number of times a user can start the password recovery process.  If this is exceeded, the user must wait until the next hour before he/she can try again.  The default value is `3`.

## sort_global_users

The `sort_global_users` property, when set to `true` (also the default value), will keep the global user list sorted alphabetically by username as new users are added.  This affects the [admin_get_users](#admin_get_users) API call, as it will return sorted users for display to administrators.

Note that keeping the global user list sorted is disk intensive, so this is only suitable for small-to-medium servers, up to 10,000 users or so.  Any larger and this property should be set to `false`, in which case users are sorted by their creation date (newest users at the top).

## use_bcrypt

The `use_bcrypt` property, when set to `true` (also the default value), will use the [bcrypt-node](https://www.npmjs.com/package/bcrypt-node) module to hash passwords.  This is an extremely secure but CPU intensive hashing algorithm, which resists brute force attacks.  It is recommended, but beware of the additional CPU overhead for creating user accounts and logging in.  Password generation and comparison each take about 250ms on my 2012 MacBook Pro.

**Note:** If you enable this feature on an existing user database, all of your users will need to reset their passwords.

## smtp_hostname

The `smtp_hostname` property specifies the SMTP (outgoing mail) server to use when sending e-mails.  This defaults to the outer [pixl-server](https://www.npmjs.com/package/pixl-server) configuration (it looks for the same `smtp_hostname` property), or if that is not set it falls back to `127.0.0.1`, which will use your local sendmail system.  See [Emails](#emails) below for details.

## email_templates

The `email_templates` property should be an object containing filesystem paths to e-mail templates, for each of the following e-mails: `welcome_new_user`, `changed_password` and `recover_password`.  Example:

```javascript
"email_templates": {
	"welcome_new_user": "conf/emails/welcome_new_user.txt",
	"changed_password": "conf/emails/changed_password.txt",
	"recover_password": "conf/emails/recover_password.txt"
}
```

For details, see the [Emails](#emails) section below.

## default_privileges

The `default_privileges` property should be an object containing any privileges you want added to new user accounts by default.  Privileges are freeform key/value pairs, and up to you to define.  Example:

```javascript
"default_privileges": {
	"admin": 0,
	"view_things": 1,
	"edit_things": 0
}
```

The only predefined privilege is `admin`, which signifies the account is a full administrator.  If this property is set to `1` on a user account, then they have access to all the admin-level API calls.

# User Accounts

User accounts are stored using the [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) component.  They are identified using the following path: `users/USERNAME` where `USERNAME` is the lower-case name of the user.  A typical user record looks like this:

```javascript
{
	"username": "tcruise",
	"email": "tcruise@hollywood.com",
	"full_name": "Tom Cruise",
	"active": "1",
	"modified": 1433735738,
	"created": 1433705544,
	"password": "1190a32e21627477f807294edfc7e533bb3ec58afbe5247a58474cc57f484031",
	"salt": "7210b89f03013272dffc3ba0b48b4de6a1b10bdc9ead535744297adb022be09e",
	"privileges": {
		"admin": 0,
		"view_things": 1,
		"edit_things": 0
	}
}
```

The `username`, `email`, and `full_name` values are passed in directly from the APIs ([create](#create), [update](#update), [admin_create](#admin_create) and/or [admin_update](#admin_update)).

The `password` goes through a salted hash function first (SHA-256) and the digest is stored instead.  The `salt` is just a randomly generated string, so each user has a different password salt (prevents rainbow table attacks).

The `created` and `modified` properties are Epoch timestamps.  `created` is automatically set when the user is first created, and `modified` is updated each time the user is updated.

The `privileges` object is automatically copied from the [default_privileges](#default_privileges) when the user is first created.  It can only be updated by an administrator via the [admin_update](#admin_update) API.

In general, as long as these standard properties are preserved, the user records can be extended to store whatever additional data you require for your application.  You can manipulate the user data via the [Hooks](#hooks) system, by adding your own API calls that read/write the user storage records directly, or by including additional keys in the client data passed to the [create](#create), [update](#update), [admin_create](#admin_create) and [admin_update](#admin_update) APIs.

## Global User List

When new users are first created, their usernames are added to a single master list.  This is stored in the [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) component under the path: `global/users`.  It contains only usernames and nothing else:

```javascript
[
	{
		"username": "redbird262"
	},
	{
		"username": "tcruise"
	},
	{
		"username": "whiteduck152"
	},
	{
		"username": "yellowmouse910"
	}
]
```

This data is used by the [admin_get_users](#admin_get_users) API call, to render a page of users to a client UI using pagination.  You can also fetch data from this list for your own app (newsletter?).

If your configuration has the [sort_global_users](#sort_global_users) key set to `true`, this list will remain sorted alphabetically as new users are added.  Otherwise, new users will be unshifted onto the head of the list (so they will be shown first).

## Privileges

Each user record has a `privileges` object, which can contain anything your application requires.  The only property used by the library is `admin`, which specifies if the user is an administrator or not.  Example:

```javascript
"privileges": {
	"admin": 0,
	"view_things": 1,
	"edit_things": 0
}
```

The other properties are yours to define (in the [default_privileges](#default_privileges) configuration object), and then update with the [admin_update](#admin_update) API.

A user cannot set or update his/her own `privileges` object using the [create](#create) or [update](#update) APIs.  Only administrators have that ability, using [admin_create](#admin_create) or [admin_update](#admin_update).

# Sessions

When a user logs in with the [login](#login) API, a new session object is created, and stored via the [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) component.  Session paths follow this pattern: `sessions/SESSION_ID` where `SESSION_ID` is a randomly generated unique ID.  Here is an example record:

```javascript
{
	"id": "099db662412794c89a8480b558cf7655c25863b12b4c23a4d3415905f7c78f5f",
	"username": "jhuckaby",
	"ip": "127.0.0.1",
	"useragent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Gecko) Version/8.0.6 Safari/600.6.3",
	"created": 1433705951,
	"modified": 1433705951,
	"expires": 1436297951
}
```

The `id` is the randomly generated Session ID.  The `username` is the user who opened the session.  The `ip` and `useragent` are collected from the HTTP request that opened the session.  The `created` and `modified` dates are what you would expect.  The `expires` date is when the session expires.  This is controlled by the [session_expire_days](#session_expire_days) configuration parameter.

## Resuming Sessions

A session may be "resumed" by calling the [resume_session](#resume_session) API.  This simply validates and extends an existing session, allowing the user to keep using it without requiring them to login again.  The session's `expires` property is extended out to N days past the current date on each resume (where N is [session_expire_days](#session_expire_days)).

# Emails

The user management system can be configured to send e-mails to users based on various events, such as new account signups, changing and resetting passwords.  Emails are sent using SMTP, via the [pixl-mail](https://www.npmjs.com/package/pixl-mail) package.  First, you need to specify a valid SMTP server in your configuration, using the [smtp_hostname](#smtp_hostname) property.

Then you need to provide up to three e-mail template files.  These are used to generate the headers and body of the e-mails.  They use a [placeholder substitution system](https://www.npmjs.com/package/pixl-tools#substitute) for bits of content such as the user's name.  You specify the paths to the e-mail template files using the [email_templates](#email_templates) configuration object:

```javascript
"email_templates": {
	"welcome_new_user": "conf/emails/welcome_new_user.txt",
	"changed_password": "conf/emails/changed_password.txt",
	"recover_password": "conf/emails/recover_password.txt"
}
```

To disable an e-mail, simply unset the corresponding configuration property (set it to a blank string, or remove it entirely).

Here are some of the various placeholders you can use in your e-mail templates:

| Placeholder | Description |
|-------------|-------------|
| `[/user/username]` | The current username. |
| `[/user/email]` | The current user's e-mail address. |
| `[/user/full_name]` | The current user's full name. |
| `[/date_time]` | The current date/time as a formatted string in the server's timezone. |
| `[/ip]` | The IP address that sent in the current request. |
| `[/request/headers/useragent]` | The current user's user agent (browser). |
| `[/self_url]` | A URL to the current application (root level, with trailing slash). |

Here are details about the various e-mails that can be sent, if template files are provided:

## welcome_new_user

This e-mail is sent when new users create an account (or optionally when an administrator creates a user account).  Here is an example template:

```
To: [/user/email]
From: support@myapp.com
Subject: Welcome to MyApp!

Hey [/user/full_name],

Welcome to MyApp!  Your new account username is "[/user/username]".  You can login to your new account by clicking the following link, or copying & pasting it into your browser:

[/self_url]

Regards,
The MyApp Team
```

## changed_password

This e-mail is sent whenever a user changes his/her password, either using the [update](#update) API, or from a password reset.  It is *not* sent when an administrator changes a password.

```
To: [/user/email]
From: support@myapp.com
Subject: Your MyApp password was changed

Hey [/user/full_name],

Someone recently changed the password on your MyApp account.  If this was you, then all is well, and you can disregard this message.  However, if you suspect your account is being hacked, you might want to consider using the "Forgot Password" feature (located on the login page) to reset your password.

Here is the information we gathered from the request:

Date/Time: [/date_time]
IP Address: [/ip]
User Agent: [/request/headers/user-agent]

Regards,
The MyApp Team
```

## recover_password

This e-mail is sent whenever the user requests a password reset, via the [forgot_password](#forgot_password) API.  It should contain a special link consisting of a recovery key, which will allow the user to set a new password for their account.  The recovery key is available via the `[/recovery_key]` placeholder, and should be passed, along with the username and a new password collected from the user, to the [reset_password](#reset_password) API.

```
To: [/user/email]
From: support@myapp.com
Subject: Forgot your MyApp password?

Hey [/user/full_name],

Someone recently requested to have your password reset on your MyApp account.  To make sure this is really you, this confirmation was sent to the e-mail address we have on file for your account.  If you really want to reset your password, please click the link below.  If you cannot click the link, copy and paste it into your browser.

[/self_url]#Login?u=[/user/username]&h=[/recovery_key]

This password reset page will expire after 24 hours.

If you suspect someone is trying to hack your account, here is the information we gathered from the request:

Date/Time: [/date_time]
IP Address: [/ip]
User Agent: [/request/headers/user-agent]

Regards,
The MyApp Team
```

# Initial Setup

When your application is first installed, you need to execute a few setup tasks.  These are typically implemented in a setup script, which either runs automatically or manually on the command-line.  It should do the following:

## Creating an initial administrator

You'll want to create an initial administrator user, who has full permissions.  This is typically done by the following code inserted into a command-line script which uses the [Standalone Mode](https://www.npmjs.com/package/pixl-server-storage#standalone-mode) of the [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) component.

```javascript
var user = {
	username: username,
	password: password,
	full_name: "Administrator",
	email: "admin@myapp.com"
};

user.active = 1;
user.created = user.modified = Tools.timeNow(true);
user.salt = Tools.generateUniqueID( 64, user.username );
user.password = Tools.digestHex( '' + user.password + user.salt );
user.privileges = { admin: 1 };

storage.put( 'users/' + username, user, function(err) {
	if (err) throw err;
	console.log( "Administrator '"+username+"' created successfully.\n" );
} );
```

You'll need to import the [pixl-tools](https://www.npmjs.com/package/pixl-tools) package for the [timeNow()](https://www.npmjs.com/package/pixl-tools#timenow), [generateUniqueID()](https://www.npmjs.com/package/pixl-tools#generateuniqueid) and [digestHex()](https://www.npmjs.com/package/pixl-tools#digesthex) functions used in the example above.

## Creating the initial user list

The master user list, which is located in the storage component under `global/users` is actually automatically created when the first user is added.  However, it is recommended that you pre-create this list, so you can set the [List Page Size](https://www.npmjs.com/package/pixl-server-storage#list-page-size) to something higher than the default of `50`.

The user list contains only usernames, so the list items are tiny in size.  It is therefore much more efficient if the list page size was something more like `100`.  You cannot change the list page size after the fact, so you must do it at initial server install.  To do this, add something like this to your command-line setup / install script:

```javascript
storage.listCreate( 'global/users', { list_size: 100 }, function(err) {
	if (err) throw err;
	console.log( "Global user list created successfully.\n" );
} );
```

## Storage Maintenance

In order for your sessions (and any other data records that you set expiration dates on) to be properly deleted when they expire, you need to enable maintenance on the storage component.  This is done by setting the [maintenance](https://www.npmjs.com/package/pixl-server-storage#maintenance) storage configuration property to a `HH::MM` formatted string, indicating the time of day at which it will perform its cleanup:

```javascript
{
	"maintenance": "04:30" // run daily at 4:30 AM
}
```

For more information, please see the [Daily Maintenance](https://www.npmjs.com/package/pixl-server-storage#daily-maintenance) section of the [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) component docs.

# API

All the APIs provided by this package are registered under the `user` namespace.  So, coupled with the standard base URI of `/api` (configurable), the endpoint for the user [create](#create) API is `/api/user/create`, user [update](#update) is `/api/user/update`, and so on.

Unless otherwise specified, all APIs return a JSON formatted response, consisting of at least a `code` property.  If `code` is `0`, then the API was a success.  If `code` is non-zero, then an error occurred.  In this case see the `description` property for the error message.

Most APIs require an active session (the only exceptions are [create](#create) and [login](#login)).  The user's Session ID should be stored client-side, and passed in using any of the following methods:

* An HTTP Cookie with the name: `session_id`
* An HTTP request header: `X-Session-ID`
* A top-level JSON property in the POST data: `session_id`
* A URL query string parameter: `session_id`

Here is the full list of APIs:

## create

Create a new user: `POST /api/user/create`

```javascript
{
	"username": "tcruise",
	"email": "tcruise@hollywood.com",
	"full_name": "Tom Cruise",
	"password": "topGun!"
}
```

The `create` API creates a new user account, but is only accessible if the [free_accounts](#free_accounts) configuration property is set to `true`.  No session is required for this.  The required JSON properties in the POST data are `username` (must be alphanumeric), `email`, `full_name` and `password`.  Any unknown properties are also stored in the user record.

Example successful response:

```javascript
{
	"code": 0
}
```

## login

Validate user and create a new session: `POST /api/user/login`

```javascript
{
	"username": "tcruise",
	"password": "topGun!"
}
```

The `login` API validates the user account exists and is active, and makes sure the provided password matches the hash-digested one we have on file.  If everything checks out, a new session is created, and the Session ID is passed back to the client, along with the user record (sans password and salt).

Example successful response:

```javascript
{
	"code": 0,
	"username": "tcruise",
	"user": {
		"username": "tcruise",
		"email": "tcruise@hollywood.com",
		"full_name": "Tom Cruise",
		"password": "topGun!",
		"privileges": {
			"admin": 0,
			"view_things": 1,
			"edit_things": 0
		}
	},
	"session_id": "099db662412794c89a8480b558cf7655c25863b12b4c23a4d3415905f7c78f5f"
}
```

The returned `session_id` can then be used for subsequent API calls.

## logout

Delete user session: `POST /api/user/logout`

The `logout` API deletes an existing user session, effectively logging the user out.  No JSON data is required in the request, as long as the Session ID is specified in some way (see [API](#api)).  After this API returns, the client should destroy the Session ID, and return the user to the home or login screens.

Example successful response:

```javascript
{
	"code": 0
}
```

## resume_session

Recover existing session: `POST /api/user/resume_session`

The `resume_session` API reloads an existing user session, effectively allowing the user to resume a previous session.  No JSON data is required in the request, as long as the Session ID is specified in some way (see [API](#api)).

Example successful response:

```javascript
{
	"code": 0,
	"username": "tcruise",
	"user": {
		"username": "tcruise",
		"email": "tcruise@hollywood.com",
		"full_name": "Tom Cruise",
		"password": "topGun!"
	},
	"session_id": "099db662412794c89a8480b558cf7655c25863b12b4c23a4d3415905f7c78f5f"
}
```

The returned `session_id` can then be used for subsequent API calls.

## update

Update user data: `POST /api/user/update`

```javascript
{
	"username": "tcruise",
	"email": "tcruise@hollywood.com",
	"full_name": "Tom Cruise",
	"old_password": "topGun!",
	"new_password": "daysOfThunder!"
}
```

The `update` API updates an existing user account.  Note that the `username` provided in the JSON POST data must match that of the active session.  A user may only update his/her own profile.  To change the account password, provide a new one in `new_password`.  Any unknown properties will be stored with the user record.

Note that the current account password *must always* be specified in `old_password`, even if a new password is not being provided.

The API response also includes a copy of the updated user record, so you can refresh the client-side UI.

Example successful response:

```javascript
{
	"code": 0,
	"user": {
		"username": "tcruise",
		"email": "tcruise@hollywood.com",
		"full_name": "Tom Cruise",
		"privileges": {
			"admin": 0,
			"view_things": 1,
			"edit_things": 0
		}
	}
}
```

## delete

Delete user account: `POST /api/user/delete`

```javascript
{
	"username": "tcruise",
	"password": "topGun!"
}
```

The `delete` API permanently deletes a user account, and logs the user out (destroys the active session).  Both the `username` and `password` of the account must be provided by the client, and an active session ID must be found (the user must be logged in).  After this API returns, the client should destroy the Session ID, and return the user to the home or login screens.

Example successful response:

```javascript
{
	"code": 0
}
```

## forgot_password

Send e-mail to reset password: `POST /api/user/forgot_password`

```javascript
{
	"username": "tcruise",
	"email": "tcruise@hollywood.com"
}
```

The `forgot_password` API initiates the password recovery process for a user.  This is designed to be sent without an active session (user is logged out), and requires a `username` and `email`.  The username must match an active account, and the e-mail must match the address on file for the account (case-insensitive).

If everything checks out, the user is sent a [recover_password](#recover_password) e-mail with further instructions.  Namely, the e-mail should contain a link that includes a special recovery key.  This is then used in the [reset_password](#reset_password) API to complete the process.  The recovery key is stored under the path `password_recovery/KEY` where `KEY` is the unique recovery key.

Example successful response:

```javascript
{
	"code": 0
}
```

## reset_password

Complete the password reset process: `POST /api/user/reset_password`

```javascript
{
	"username": "tcruise",
	"key": "3a43167a326b1eccd1c752f72064875656d80144b6f9527a185f2f6ac0c04003",
	"new_password": "missionImpossble!"
}
```

The `reset_password` API completes the forgot password / reset password workflow, by actually changing the account password to a new one.  This API requires a special recovery key (`key`) which is obtained from the [recover_password](#recover_password) e-mail sent via the [forgot_password](#forgot_password) API.  The `username` must also match what is in the recovery record.  Specify the desired new account password in `new_password`.

Example successful response:

```javascript
{
	"code": 0
}
```

## admin_create

Create user as an administrator: `POST /api/user/admin_create`

```javascript
{
	"username": "tcruise",
	"email": "tcruise@hollywood.com",
	"full_name": "Tom Cruise",
	"password": "topGun!",
	"privileges": {
		"admin": 0,
		"view_things": 1,
		"edit_things": 0
	},
	"send_email": true
}
```

The `admin_create` API creates a new user account, but it is only accessible to administrators.  Also, this is the only way to create user accounts if the [free_accounts](#free_accounts) configuration parameter is set to `false`.

The main difference between `admin_create` and [create](#create) is that `admin_create` allows you to specify `privileges`.  So you can use this to create users with any privileges you want, including other administrators (just set `admin` to `1`).

The `send_email` property is a boolean flag indicating whether the user should be sent the usual welcome e-mail, or not.

Example successful response:

```javascript
{
	"code": 0
}
```

## admin_update

Update any user as an administrator: `POST /api/user/admin_update`

```javascript
{
	"username": "tcruise",
	"email": "tcruise@hollywood.com",
	"full_name": "Tom Cruise",
	"new_password": "oblivion!",
	"privileges": {
		"admin": 0,
		"view_things": 1,
		"edit_things": 0
	}
}
```

The `admin_update` API updates any user, but it is only accessible to administrators.  Using this you can set *any* user properties on *any* account, including `privileges`, and reset passwords without also providing the current password (as is the case with the standard [update](#update) API).

The API response also includes a copy of the updated user record, so you can refresh the client-side UI.

Example successful response:

```javascript
{
	"code": 0,
	"user": {
		"username": "tcruise",
		"email": "tcruise@hollywood.com",
		"full_name": "Tom Cruise",
		"privileges": {
			"admin": 0,
			"view_things": 1,
			"edit_things": 0
		}
	}
}
```

## admin_delete

Delete any user as an administrator: `POST /api/user/admin_delete`

```javascript
{
	"username": "tcruise"
}
```

The `admin_delete` API permanently deletes a user account, but it is only accessible to administrators.  Only the `username` of the account must be provided by the client.

Example successful response:

```javascript
{
	"code": 0
}
```

## admin_get_user

Fetch a user record as an administrator: `POST /api/user/admin_get_user`

```javascript
{
	"username": "tcruise"
}
```

You can alternatively use HTTP GET for this API: `GET /api/user/admin_get_user?username=USERNAME`

The `admin_get_user` API fetches a single user record, for the purpose of displaying form fields in a UI for editing.  It is only accessible to administrators.  Specify the desired username, and the user record will be returned (sans password and salt).

Example successful response:

```javascript
{
	"code": 0,
	"user": {
		"username": "tcruise",
		"email": "tcruise@hollywood.com",
		"full_name": "Tom Cruise",
		"privileges": {
			"admin": 0,
			"view_things": 1,
			"edit_things": 0
		}
	}
}
```

## admin_get_users

Fetch multiple users as an administrator: `POST /api/user/admin_get_users`

```javascript
{
	"offset": 0,
	"limit": 50
}
```

You can alternatively use HTTP GET for this API: `GET /api/user/admin_get_users?offset=0&limit=50`

The `admin_get_users` API fetches multiple users from the master user list, given an `offset` from the top of the list, and a `limit` specifying the number of users you want.  Using these two parameters you can design a pagination system.  The API response always includes the master list length, so you can calculate how many "pages" there are.

The API response will contain a `rows` array consisting of one element per user, and a `list` object containing metadata about the master user list as a whole (this is where you can get the total list length, for calculating pagination links).

Example successful response:

```javascript
{
	"code": 0,
	"rows": [
		{
			"username": "beautifulkoala110",
			"active": 1,
			"full_name": "Maurizio Ijsselstein",
			"email": "maurizio.ijsselstein32@example.com",
			"privileges": {
				"admin": 0,
				"edit_events": 0,
				"edit_plugins": 0
			},
			"modified": 1433735643,
			"created": 1433735643
		},
		{
			"username": "crazypeacock161",
			"active": 1,
			"full_name": "Franklin Duncan",
			"email": "franklin.duncan29@example.com",
			"privileges": {},
			"modified": 1433733408,
			"created": 1433733408
		},
		{
			"username": "goldenpeacock287",
			"active": 1,
			"full_name": "Danielle George",
			"email": "danielle.george99@example.com",
			"privileges": {
				"admin": 0,
				"edit_events": 0,
				"edit_plugins": 0
			},
			"modified": 1433735637,
			"created": 1433735637
		}
	],
	"list": {
		"first_page": 0,
		"last_page": 0,
		"length": 3,
		"page_size": 50,
		"type": "list"
	}
}
```

# Adding Your Own APIs

To add your own APIs, you should use the [pixl-server-api](https://www.npmjs.com/package/pixl-server-api) component.  You can call either `addHandler()` to register a single API handler method, or `addNamespace()` to declare an entire class as an API namespace (this is what the user component does).  Example:

```javascript
server.API.addHandler( 'my_custom_api', function(args, callback) {
	// custom request handler for our API
	callback({
		code: 0,
		description: "Success!"
	});
} );
```

See the [pixl-server-api](https://www.npmjs.com/package/pixl-server-api) documentation for more details.

## Validating The Session

To validate the current session, you can call the `loadSession()` method on the user component.  It should be accessible from your own component's API methods using this syntax:

```
this.server.User.loadSession(args, function(err, session, user) {
	if (err) {
		// an error occurred
	}
	else {
		// valid session and user
	}
} );
```

# Hooks

Hooks allow you to intercept any API call, potentially make changes to the data, and/or throw an error and stop the API from proceeding.

All the "before" hooks require you to fire a callback.  If you pass an error to the callback, the API is aborted and the error sent back to the client.  In this way you can interrupt and abort any API.  If you pass nothing to the callback, the API call can proceed.  All the "after" hooks are passive (no callback), and happen *after* the response has already been sent back to the client.

To register a hook, call the `registerHook()` method, and provide the hook name (see below) and your own callback function:

```javascript
this.server.User.registerHook( 'before_create', function(args, callback) {
	// do something here
	callback();
} );
```

All hooks are passed an `args` object containing the following:

| Property | Description |
|----------|-------------|
| `args.user` | The current user object, if available (depends on the hook). |
| `args.session` | The current session object, if available (depends on the hook). |
| `args.request` | The core [Node.js server request](https://nodejs.org/api/http.html#http_http_incomingmessage) object. |
| `args.response` | The core [Node.js server response](https://nodejs.org/api/http.html#http_class_http_serverresponse) object. |
| `args.ip` | This will be set to the user's public IP address. |
| `args.ips` | This will be set to an array of *all* the user's IP addresses. |
| `args.query` | An object containing key/value pairs from the URL query string. |
| `args.params` | All the HTTP POST parameters as key/value pairs. |
| `args.files` | All the uploaded files as key/object pairs (see [args.files](https://www.npmjs.com/package/pixl-server-web#argsfiles)). |
| `args.cookies` | All the HTTP Cookies parsed into key/value pairs. |
| `args.server` | The pixl-server object which handled the request. |

This is largely the same as the `args` object passed to HTTP request handlers in the [pixl-server-web](https://www.npmjs.com/package/pixl-server-web) component.  For more details, see the [args](https://www.npmjs.com/package/pixl-server-web#args) section of those docs.

Here is the list of supported hooks:

## before_create

The `before_create` hook is fired just before a new user is created in the [create](#create) API.  The `args` object passed to your callback will contain the new `user` object as it is being constructed, which contains all the parameters sent from the client.  Using this you could implement your own validation on addition parameters passed by the UI.

Your function is also passed a callback as the 2nd argument.  You must invoke this callback to complete the hook, and return control to the API.  Pass an error to the callback to abort the API and pass the error along to the client.

## after_create

The `after_create` hook is fired just after a new user is created, and the response has been sent back to the client.  This is a passive hook, and does not require a callback to be fired.

## before_login

The `before_login` hook is fired just before a user logs in, via the [login](#login) API.  The `args` object passed to your callback will contain the `user` object that represents the user performing the login.

Your function is also passed a callback as the 2nd argument.  You must invoke this callback to complete the hook, and return control to the API.  Pass an error to the callback to abort the API and pass the error along to the client.

## after_login

The `after_login` hook is fired just after a user has successfully logged in, and the response has been sent back to the client.  This is a passive hook, and does not require a callback to be fired.

## before_logout

The `before_logout` hook is fired just before a user logs out, via the [logout](#logout) API.  The `args` object passed to your callback will contain the `user` object that represents the user performing the logout, as well as the `session` that is going to be destroyed.

Your function is also passed a callback as the 2nd argument.  You must invoke this callback to complete the hook, and return control to the API.  Pass an error to the callback to abort the API and pass the error along to the client.

## after_logout

The `after_logout` hook is fired just after a user has successfully logged out, and the response has been sent back to the client.  This is a passive hook, and does not require a callback to be fired.

## before_resume_session

The `before_resume_session` hook is fired just before a user resumes a session, via the [resume_session](#resume_session) API.  The `args` object passed to your callback will contain the relevant `user` object.

Your function is also passed a callback as the 2nd argument.  You must invoke this callback to complete the hook, and return control to the API.  Pass an error to the callback to abort the API and pass the error along to the client.

## after_resume_session

The `after_resume_session` hook is fired just after a user has successfully logged in, and the response has been sent back to the client.  This is a passive hook, and does not require a callback to be fired.

## before_update

The `before_update` hook is fired just before a user record is updated, via the [update](#update) API.  The `args` object passed to your callback will contain the `user` object that represents the user performing the update, as well as the active `session` object.

Your function is also passed a callback as the 2nd argument.  You must invoke this callback to complete the hook, and return control to the API.  Pass an error to the callback to abort the API and pass the error along to the client.

## after_update

The `after_update` hook is fired just after a user has successfully been updated, and the response has been sent back to the client.  This is a passive hook, and does not require a callback to be fired.

## before_delete

The `before_delete` hook is fired just before a user record is deleted, via the [delete](#delete) API.  The `args` object passed to your callback will contain the `user` object that represents the user performing the update, as well as the active `session` object.

Your function is also passed a callback as the 2nd argument.  You must invoke this callback to complete the hook, and return control to the API.  Pass an error to the callback to abort the API and pass the error along to the client.

## after_delete

The `after_delete` hook is fired just after a user has successfully been deleted, and the response has been sent back to the client.  This is a passive hook, and does not require a callback to be fired.

## before_forgot_password

The `before_forgot_password` hook is fired just before a user begins the password reset workflow, via the [forgot_password](#forgot_password) API.  The `args` object passed to your callback will contain the relevant `user` object.

Your function is also passed a callback as the 2nd argument.  You must invoke this callback to complete the hook, and return control to the API.  Pass an error to the callback to abort the API and pass the error along to the client.

## after_forgot_password

The `after_forgot_password` hook is fired just after a user has successfully been e-mailed, and the response has been sent back to the client.  This is a passive hook, and does not require a callback to be fired.

## before_reset_password

The `before_reset_password` hook is fired just before a user resets their password, via the [reset_password](#reset_password) API.  The `args` object passed to your callback will contain the relevant `user` object.

Your function is also passed a callback as the 2nd argument.  You must invoke this callback to complete the hook, and return control to the API.  Pass an error to the callback to abort the API and pass the error along to the client.

## after_reset_password

The `after_reset_password` hook is fired just after a user has successfully reset their password, and the response has been sent back to the client.  This is a passive hook, and does not require a callback to be fired.

# Transaction Log

The user management system makes use of the [pixl-server](https://www.npmjs.com/package/pixl-server) event log, by logging both debug messages and transactions.  See below for examples of all the transaction log entries.

All transactions will have the `code` column set to `transaction`, and the `msg` column usually set to the username.  The `data` column usually contains a JSON object with various information such as the user record and/or HTTP headers.

For more details on the server event log format, see the [Logging](https://www.npmjs.com/package/pixl-server#logging) section of the [pixl-server](https://www.npmjs.com/package/pixl-server) docs.

## user_create

The `user_create` transaction log entry has the new username in the `msg` column, and the user's new record (sans password and salt), as well as the requesting IP and HTTP headers in the `data` column.  Example:

```
[1433735672.387][2015-06-07 20:54:32][joeretina-2.local][User][transaction][user_create][yellowmouse910][{"user":{"username":"yellowmouse910","active":1,"full_name":"Anni Wirtanen","email":"anni.wirtanen78@example.com","privileges":{"admin":0,"edit_events":0,"edit_plugins":0},"modified":1433735672,"created":1433735672},"ip":"127.0.0.1","headers":{"host":"127.0.0.1:3012","accept":"text/plain, */*; q=0.01","x-session-id":"fb531a0886313888c3c08ba8a82031fb7a37b8d9ea979151f65f88b1a4f90b83","x-requested-with":"XMLHttpRequest","accept-encoding":"gzip, deflate","accept-language":"en-us","content-type":"application/json","origin":"http://127.0.0.1:3012","content-length":"188","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Gecko) Version/8.0.6 Safari/600.6.3","referer":"http://127.0.0.1:3012/","connection":"keep-alive","cookie":"__utma=9692031.124279869.137249571.141495047.141407019.4"}}]
```

## user_login

The `user_login` transaction log entry has the username in the `msg` column, and the user's IP and HTTP headers in the `data` column.  Example:

```
[1433828230.675][2015-06-08 22:37:10][joeretina-2.local][User][transaction][user_login][jhuckaby][{"ip":"127.0.0.1","headers":{"host":"127.0.0.1:3012","accept":"text/plain, */*; q=0.01","x-session-id":"fb531a0886313888c3c08ba8a82031fb7a37b8d9ea979151f65f88b1a4f90b83","x-requested-with":"XMLHttpRequest","accept-language":"en-us","accept-encoding":"gzip, deflate","cache-control":"max-age=0","content-type":"application/json","origin":"http://127.0.0.1:3012","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Gecko) Version/8.0.6 Safari/600.6.3","referer":"http://127.0.0.1:3012/","content-length":"81","connection":"keep-alive","cookie":"__utma=9692031.124294869.137439571.141495047.141907019.4"}}]
```

## user_logout

The `user_logout` transaction log entry has the username in the `msg` column, and the user's IP and HTTP headers in the `data` column.  Example:

```
[1433705600.912][2015-06-07 12:33:20][joeretina-2.local][User][transaction][user_logout][jhuckaby][{"ip":"127.0.0.1","headers":{"host":"127.0.0.1:3012","accept":"text/plain, */*; q=0.01","x-session-id":"8ab04848093c063718fe5064e90ffad3dc2cbe48ad2a961f06e3ce4512ee84be","x-requested-with":"XMLHttpRequest","accept-encoding":"gzip, deflate","accept-language":"en-us","content-type":"application/json","origin":"http://127.0.0.1:3012","content-length":"81","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Gecko) Version/8.0.6 Safari/600.6.3","referer":"http://127.0.0.1:3012/","connection":"keep-alive","cookie":"__utma=9699231.124294869.137239571.141895047.141407019.4"}}]
```

## user_update

The `user_update` transaction log entry has the username in the `msg` column, and the user's updated record (sans password and salt), as well as the requesting IP and HTTP headers in the `data` column.  Example:

```
[1433735738.641][2015-06-07 20:55:38][joeretina-2.local][User][transaction][user_update][tcruise][{"user":{"username":"tcruise","email":"tcruise@hollywood.com","full_name":"Tom Cruise","active":"1","modified":1433735738,"created":1433705544,"privileges":{"admin":1,"edit_events":1,"edit_plugins":0},"joetest":12345},"ip":"127.0.0.1","headers":{"host":"127.0.0.1:3012","accept":"text/plain, */*; q=0.01","x-session-id":"fb531a0886313888c3c08ba8a82031fb7a37b8d9ea979151f65f88b1a4f90b83","x-requested-with":"XMLHttpRequest","accept-encoding":"gzip, deflate","accept-language":"en-us","content-type":"application/json","origin":"http://127.0.0.1:3012","content-length":"164","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Gecko) Version/8.0.6 Safari/600.6.3","referer":"http://127.0.0.1:3012/","connection":"keep-alive","cookie":"__utma=9692031.124274869.137239571.141895047.141907019.4"}}]
```

## user_delete

The `user_delete` transaction log entry has the username in the `msg` column, and the user's IP and HTTP headers in the `data` column.  Example:

```
[1433735602.883][2015-06-07 20:53:22][joeretina-2.local][User][transaction][user_delete][zgoldenlion329][{"ip":"127.0.0.1","headers":{"host":"127.0.0.1:3012","accept":"text/plain, */*; q=0.01","x-session-id":"fb531a0886313888c3c08ba8a82031fb7a37b8d9ea979151f65f88b1a4f90b83","x-requested-with":"XMLHttpRequest","accept-encoding":"gzip, deflate","accept-language":"en-us","content-type":"application/json","origin":"http://127.0.0.1:3012","content-length":"29","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Gecko) Version/8.0.6 Safari/600.6.3","referer":"http://127.0.0.1:3012/","connection":"keep-alive","cookie":"__utma=9699231.124274869.137249571.141485047.144907019.4"}}]
```

## user_forgot_password

The `user_forgot_password` transaction log entry has the username in the `msg` column, and the user's recovery key in the `data` column as a property named `key` in the encoded JSON text.  Example:

```
[1433735131.978][2015-06-07 20:45:31][joeretina-2.local][User][transaction][user_forgot_password][redsnake609][{"key":"7210b89f03013272dffc3ba0b48b4de6a1b10bdc9ead535744297adb022be09f","ip":"127.0.0.1","headers":{"host":"127.0.0.1:3012","accept":"text/plain, */*; q=0.01","x-session-id":"fb531a0886313888c3c08ba8a82031fb7a37b8d9ea979151f65f88b1a4f90b83","x-requested-with":"XMLHttpRequest","accept-encoding":"gzip, deflate","accept-language":"en-us","content-type":"application/json","origin":"http://127.0.0.1:3012","content-length":"26","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Gecko) Version/8.0.6 Safari/600.6.3","referer":"http://127.0.0.1:3012/","connection":"keep-alive","cookie":"__utma=9699031.124294869.172439571.141895047.141407019.4"}}]
```

## user_password_reset

The `user_password_reset` transaction log entry has the username in the `msg` column, and the user's recovery key in the `data` column as a property named `key` in the encoded JSON text.  Example:

```
[1433735131.978][2015-06-07 20:45:31][joeretina-2.local][User][transaction][user_password_reset][redsnake609][{"key":"7210b89f03013272dffc3ba0b48b4de6a1b10bdc9ead535744297adb022be09f","ip":"127.0.0.1","headers":{"host":"127.0.0.1:3012","accept":"text/plain, */*; q=0.01","x-session-id":"fb531a0886313888c3c08ba8a82031fb7a37b8d9ea979151f65f88b1a4f90b83","x-requested-with":"XMLHttpRequest","accept-encoding":"gzip, deflate","accept-language":"en-us","content-type":"application/json","origin":"http://127.0.0.1:3012","content-length":"26","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Gecko) Version/8.0.6 Safari/600.6.3","referer":"http://127.0.0.1:3012/","connection":"keep-alive","cookie":"__utma=9692031.124794869.137249571.141495047.141407019.4"}}]
```

# External User Login Systems

If you already have an existing user login system, perhaps a company-wide [SSO](https://en.wikipedia.org/wiki/Single_sign-on) (single sign-on) system, you can provide a simple REST API bridge in order to link to it from this module.  Meaning, you can use your own external system for user login and identification, and pass the user information back to this module securely in the background, effectively synchronizing the two databases.  Then this module transparently logs the user in and creates a session as per usual.

The general workflow is:

1. A user loads your Node.js web application in a browser.
2. Your client-side JavaScript code detects that the user has no active session cookie for your app, or it has expired.
3. Instead of showing a usual login form, your client-side code makes an API call to: `user/external_login`.
4. The `user/external_login` code makes a server-to-server HTTP GET request to a URL that you specify.
	* The code sends along all the cookies sent from the browser to your API.
	* If your API returns user information, it is used to update the local user data and log the user in right away.
	* If your API returns a redirect URL, this is passed back to the browser along with our return URL.

The basic idea is that your external API is queried for user information instead of displaying a login page to the user.  Any cookies from the browser are passed along to your API (it assumes you store a cookie on the top-level domain on which you are also serving your app).  If your API then returns valid user information, it is immediately updated in local storage, and the user is immediately logged in.  However, if your API doesn't recognize the user, then it can provide a redirect URL to navigate the browser to (i.e. your own external login page, separate from your app).

The first step is configuring your client-side JavaScript code.  You should go through the normal process of detecting a session cookie, and if found, use the [user/resume_session](#resume_session) API to resume the session as per usual.  But if no cookie is found or the session is expired, then instead of showing the user a standard login form, send another HTTP POST call to `user/external_login`.  The browser should include any relevant cookies.

The next step is activating the external login feature by specifying a fully-qualified URL to your API endpoint, which will provide the user bridge.  This should go into the `external_user_api` configuration parameter.  Example:

```js
{
	"external_user_api": "http://mycompany.com/usermanager/login-from-app.php"
}
```

When called via HTTP GET, your API is expected to return one of two JSON responses: an actual user record, or a redirect URL.  Here are the two responses explained, with examples:

## Returning User Information

If you detect that user is already logged in via your system (i.e. the cookies passed along to your API correspond to an active session) then you should return a JSON record that describes the user.  It should contain the following:

```js
{
	"code": 0,
	"username": "jsmith",
	"user": {
		"full_name": "John Smith",
		"email": "test@email.com",
		"avatar": "http://mycompany.com/users/jsmith/avatar.png",
		"privileges": {
			"admin": 1
		}
	}
}
```

Here are descriptions of the JSON properties:

| Property Name | Description |
|---------------|-------------|
| `code` | This represents the error code, and should be set to `0` upon success. |
| `username` | The username of the user, which should contain only alphanumeric characters, dashes and periods. |
| `user` | An object containing more information about the user. |
| `full_name` | The user's first and last names as a single combined string. |
| `email` | The user's e-mail address. |
| `avatar` | This is optional, and may contain a fully-qualified URL to an avatar image for the user. |
| `privileges` | An object containing a set of privileges for the user.  See [Privileges](#privileges) above. |

At this point the user information will be saved to local data storage, and the user will be logged in (a new session will be created, and the session ID returned to the client).

The API response back to the browser will be identical to the one sent by the [user/resume_session](#resume_session) call.  Your client-side code should be expecting a user record, and a new user session ID, to store in a cookie or browser localStorage.

## Redirecting to a Login Page

If you detect that the user is *not* logged in (i.e. no cookie), or their session has expired, then you will need to trigger a browser redirect, so the user can enter their username and password into *your* external login page.  To do this, send back a JSON record formatted like this:

```js
{
	"code": 0,
	"location": "http://mycompany.com/usermanager/login.php?return="
}
```

So here you need to specify a fully-qualified URL to your own login form page where the user can enter their username and password.  Please include the URL in the `location` JSON parameter, rather than sending a HTTP 302.  Also, your login page URL needs to accept an encoded "return URL" appended to the end.  This is so your login system knows where to redirect back to upon successful login.  The return URL will be added automatically before the final URL is sent back to the browser for the client-side redirect.

Your client-side app code needs to detect the `location` property when it is returned, and redirect the browser to the URL provided.  Since this API call is typically initiated via AJAX / XHR, a standard HTTP 302 server response will not trigger a browser window redirect, so some JavaScript code is required to interpret the response and redirect the user.

The idea here is that after the user logs in successfully via your login page, they'll have a session cookie created.  So when they arrive back at your Node.js app, we'll start the same user verification process again, and request your `external_user_api` URL via HTTP GET again.  But this time, the user will have a valid cookie, so your API should return actual user information (see [Returning User Information](#returning-user-information) above), and the user will finally be logged in properly.

## Logging Out

When an external user management system is integrated, and the user clicks the "Logout" button in the UI, after the internal session is deleted they will be redirected to your `external_user_api` URL straight from the browser, but with a `logout=1` query string parameter appended.  Example:

```
http://mycompany.com/usermanager/login-from-app.php?logout=1
```

It is expected that your bridge API will then redirect the user to the appropriate logout page so their session can be deleted and cookies cleaned up.

# License

The MIT License (MIT)

Copyright (c) 2015 - 2016 Joseph Huckaby.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
