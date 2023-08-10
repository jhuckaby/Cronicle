&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*

<hr/>

<!-- toc -->
- [Command Line](#command-line)
	* [Starting and Stopping](#starting-and-stopping)
	* [Environment Variables](#environment-variables)
	* [Storage Maintenance](#storage-maintenance)
	* [Recover Admin Access](#recover-admin-access)
	* [Server Startup](#server-startup)
	* [Upgrading Cronicle](#upgrading-cronicle)
	* [Data Import and Export](#data-import-and-export)
	* [Storage Migration Tool](#storage-migration-tool)

# Command Line

Here are all the Cronicle services available to you on the command line.  Most of these are accessed via the following shell script:

```
/opt/cronicle/bin/control.sh [COMMAND]
```

Here are all the accepted commands:

| Command | Description |
|---------|-------------|
| `start` | Starts Cronicle in daemon mode. See [Starting and Stopping](CommandLine.md#starting-and-stopping). |
| `stop` | Stops the Cronicle daemon and waits for exit. See [Starting and Stopping](CommandLine.md#starting-and-stopping). |
| `restart` | Calls `stop`, then `start`, in sequence. See [Starting and Stopping](CommandLine.md#starting-and-stopping).  |
| `status` | Checks whether Cronicle is currently running. See [Starting and Stopping](CommandLine.md#starting-and-stopping).  |
| `setup` | Runs initial storage setup (for first time install). See [Setup](Setup.md). |
| `maint` | Runs daily storage maintenance routine. See [Storage Maintenance](CommandLine.md#storage-maintenance). |
| `admin` | Creates new emergency admin account (specify user / pass). See [Recover Admin Access](CommandLine.md#recover-admin-access). |
| `export` | Exports data to specified file. See [Data Import and Export](CommandLine.md#data-import-and-export). |
| `import` | Imports data from specified file. See [Data Import and Export](CommandLine.md#data-import-and-export). |
| `upgrade` | Upgrades Cronicle to the latest stable (or specify version). See [Upgrading Cronicle](CommandLine.md#upgrading-cronicle). |
| `version` | Outputs the current Cronicle package version and exits. |
| `help` | Displays a list of available commands and exits. |

## Starting and Stopping

To start the service, use the `start` command:

```
/opt/cronicle/bin/control.sh start
```

And to stop it, the `stop` command:

```
/opt/cronicle/bin/control.sh stop
```

You can also issue a quick stop + start with the `restart` command:

```
/opt/cronicle/bin/control.sh restart
```

The `status` command will tell you if the service is running or not:

```
/opt/cronicle/bin/control.sh status
```

## Environment Variables

Cronicle supports a special environment variable syntax, which can specify command-line options as well as override any configuration settings.  The variable name syntax is `CRONICLE_key` where `key` is one of several command-line options (see table below) or a JSON configuration property path.  These can come in handy for automating installations, and using container systems.  

For overriding configuration properties by environment variable, you can specify any top-level JSON key from `config.json`, or a *path* to a nested property using double-underscore (`__`) as a path separator.  For boolean properties, you can specify `1` for true and `0` for false.  Here is an example of some of the possibilities available:

| Variable | Sample Value | Description |
|----------|--------------|-------------|
| `CRONICLE_foreground` | `1` | Run Cronicle in the foreground (no background daemon fork). |
| `CRONICLE_echo` | `1` | Echo the event log to the console (STDOUT), use in conjunction with `CRONICLE_foreground`. |
| `CRONICLE_color` | `1` | Echo the event log with color-coded columns, use in conjunction with `CRONICLE_echo`. |
| `CRONICLE_base_app_url` | `http://cronicle.mycompany.com` | Override the [base_app_url](Configuration.md#base_app_url) configuration property. |
| `CRONICLE_email_from` | `cronicle@mycompany.com` | Override the [email_from](Configuration.md#email_from) configuration property. |
| `CRONICLE_smtp_hostname` | `mail.mycompany.com` | Override the [smtp_hostname](Configuration.md#smtp_hostname) configuration property. |
| `CRONICLE_secret_key` | `CorrectHorseBatteryStaple` | Override the [secret_key](Configuration.md#secret_key) configuration property. |
| `CRONICLE_web_socket_use_hostnames` | `1` | Override the [web_socket_use_hostnames](Configuration.md#web_socket_use_hostnames) configuration property. |
| `CRONICLE_server_comm_use_hostnames` | `1` | Override the [server_comm_use_hostnames](Configuration.md#server_comm_use_hostnames) configuration property. |
| `CRONICLE_WebServer__http_port` | `80` | Override the `http_port` property *inside* the [WebServer](Configuration.md#web-server-configuration) object. |
| `CRONICLE_WebServer__https_port` | `443` | Override the `https_port` property *inside* the [WebServer](Configuration.md#web-server-configuration) object. |
| `CRONICLE_Storage__Filesystem__base_dir` | `/data/cronicle` | Override the `base_dir` property *inside* the [Filesystem](Configuration.md#filesystem) object *inside* the [Storage](Configuration.md#storage-configuration) object. |

Almost every [configuration property](Configuration.md) can be overridden using this environment variable syntax.  The only exceptions are things like arrays, e.g. [log_columns](Configuration.md#log_columns) and [socket_io_transports](Configuration.md#socket_io_transports).

## Storage Maintenance

Storage maintenance automatically runs every morning at 4 AM local server time (this is [configurable](Configuration.md#maintenance) if you want to change it).  The operation is mainly for deleting expired records, and pruning lists that have grown too large.  However, if the Cronicle service was stopped and you missed a day or two, you can force it to run at any time.  Just execute this command on your primary server:

```
/opt/cronicle/bin/control.sh maint
```

This will run maintenance for the current day.  However, if the service was down for more than one day, please run the command for each missed day, providing the date in `YYYY-MM-DD` format:

```
/opt/cronicle/bin/control.sh maint 2015-10-29
/opt/cronicle/bin/control.sh maint 2015-10-30
```

## Recover Admin Access

Lost access to your admin account?  You can create a new temporary administrator account on the command-line.  Just execute this command on your primary server:

```
/opt/cronicle/bin/control.sh admin USERNAME PASSWORD
```

Replace `USERNAME` with the desired username, and `PASSWORD` with the desired password for the new account.  Note that the new user will not show up in the main list of users in the UI.  But you will be able to login using the provided credentials.  This is more of an emergency operation, just to allow you to get back into the system.  *This is not a good way to create permanent users*.  Once you are logged back in, you should consider creating another account from the UI, then deleting the emergency admin account.

## Server Startup

Cronicle will automatically register itself as a system service when it is first installed, so it will automatically start itself on server boot.  This is done via the [pixl-boot](https://github.com/jhuckaby/pixl-boot) module, and it supports [Systemd](https://en.wikipedia.org/wiki/Systemd) if available, falling back to [Sysv Init](https://en.wikipedia.org/wiki/Init#SysV-style) or others.

If you do **not** want Cronicle to automatically start itself on boot, you can disable it with this command:

```sh
cd /opt/cronicle
npm run unboot
```

If you change your mind and want to reenable it, use this command:

```sh
cd /opt/cronicle
npm run boot
```

**Important Note:** When Cronicle starts on server boot, it typically does not have a proper user environment, namely a `PATH` environment variable.  So if your scripts rely on binary executables in alternate locations, e.g. `/usr/local/bin`, you may have to restore the `PATH` and other variables inside your scripts by redeclaring them.

## Upgrading Cronicle

To upgrade Cronicle, you can use the built-in `upgrade` command:

```
/opt/cronicle/bin/control.sh upgrade
```

This will upgrade the app and all dependencies to the latest stable release, if a new one is available.  It will not affect your data storage, users, or configuration settings.  All those will be preserved and imported to the new version.  For multi-server clusters, you'll need to repeat this command on each server.

Alternately, you can specify the exact version you want to upgrade (or downgrade) to:

```
/opt/cronicle/bin/control.sh upgrade 1.0.4
```

If you upgrade to the `HEAD` version, this will grab the very latest from GitHub.  Note that this is primarily for developers or beta-testers, and is likely going to contain bugs.  Use at your own risk:

```
/opt/cronicle/bin/control.sh upgrade HEAD
```

## Data Import and Export

Cronicle can import and export data via the command-line, to/from a plain text file.  This data includes all the "vital" storage records such as Users, Plugins, Categories, Servers, Server Groups, API Keys and all Scheduled Events.  It *excludes* things like user sessions, job completions and job logs.

To export your Cronicle data, issue this command on your primary server:

```
/opt/cronicle/bin/control.sh export /path/to/cronicle-data-backup.txt --verbose
```

The `--verbose` flag makes it emit some extra information to the console.  Omit that if you want it to run silently.  Omit the filename if you want it to export the data to STDOUT instead of a file.

To import data back into the system, **first make sure Cronicle is stopped on all servers**, and then run this command:

```
/opt/cronicle/bin/control.sh import /path/to/cronicle-data-backup.txt
```

If you want daily backups of the data which auto-expire after a year, a simple shell script can do it for ya:

```sh
#!/bin/bash
DATE_STAMP=`date "+%Y-%m-%d"`
BACKUP_DIR="/backup/cronicle/data"
BACKUP_FILE="$BACKUP_DIR/backup-$DATE_STAMP.txt"

mkdir -p $BACKUP_DIR
/opt/cronicle/bin/control.sh export $BACKUP_FILE --verbose
find $BACKUP_DIR -mtime +365 -type f -exec rm -v {} \;
```

## Storage Migration Tool

If you need to migrate your Cronicle storage data to a new location or even a new engine, a simple built-in migration tool is provided.  This tool reads *all* Cronicle storage records and writes them back out, using two different storage configurations (old and new).

To use the tool, first edit your Cronicle's `conf/config.json` file on your primary server, and locate the `Storage` object.  This should point to your *current* storage configuration, i.e. where we are migrating *from*.  Then, add a new object right next to it, and name it `NewStorage`.  This should point to your *new* storage location and/or storage engine, i.e. where we are migrating *to*.

The contents of the `NewStorage` object should match whatever you'd typically put into `Storage`, if setting up a new install.  See the [Storage Configuration](Configuration.md#storage-configuration) section for details.  It can point to any of the supported engines.  Here is an example that would migrate from the local filesystem to Amazon S3:

```js
{
	"Storage": {
		"engine": "Filesystem",
		"Filesystem": {
			"base_dir": "data",
			"key_namespaces": 1
		}
	},
	
	"NewStorage": {
		"engine": "S3",
		"AWS": {
			"accessKeyId": "YOUR_AMAZON_ACCESS_KEY", 
			"secretAccessKey": "YOUR_AMAZON_SECRET_KEY", 
			"region": "us-west-1",
			"correctClockSkew": true,
			"maxRetries": 5,
			"httpOptions": {
				"connectTimeout": 5000,
				"timeout": 5000
			}
		},
		"S3": {
			"keyPrefix": "cronicle",
			"fileExtensions": true,
			"params": {
				"Bucket": "YOUR_S3_BUCKET_ID"
			}
		}
	}
}
```

You could also use this to migrate between two AWS regions, S3 buckets or key prefixes on S3.  Just point `Storage` and `NewStorage` to the same engine, e.g. `S3`, and change only the region, bucket or prefix in the `NewStorage` object.

When you are ready to proceed, make sure you **shut down Cronicle** on all your servers.  You should not migrate storage while Cronicle is running, as it can result in corrupted data.

All good?  Okay then, on your Cronicle primary server as root (superuser), issue this command:

```
/opt/cronicle/bin/control.sh migrate
```

The following command-line arguments are supported:

| Argument | Description |
|----------|-------------|
| `--debug` | Echo all debug log messages to the console.  This also disables the progress bar. |
| `--verbose` | Print the key of each record as it is migrated.  This also disables the progress bar. |
| `--dryrun` | Do not write any changes to new storage (except for a single test record, which is then deleted).  Used for debugging and troubleshooting. |

It is recommended that you first run the migrate command with `--dryrun` to make sure that it can read and write to the two storage locations.  The script also logs all debug messages and transactions to `logs/StorageMigration.log`.

Once the migration is complete and you have verified that your data is where you expect, edit the `conf/config.json` file one last time, and remove the old `Storage` object, and then rename `NewStorage` to `Storage`, effectively replacing it.  Cronicle will now access your storage data from the new location.  Make a backup of the file in case you ever need to roll back.

If you have multiple Cronicle servers, make sure you sync your `conf/config.json` between all servers!  They all need to be identical.

Finally, restart Cronicle, and all should be well.

<hr/>

&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*
