&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*

<hr/>

<!-- toc -->
- [Installation](#installation)
- [Setup](#setup)
	* [Single Server](#single-server)
	* [Single Primary with Workers](#single-primary-with-workers)
	* [Multi-Server Cluster](#multi-server-cluster)
		+ [Load Balancers](#load-balancers)
		+ [Ops Notes](#ops-notes)

# Installation

Please note that Cronicle currently only works on POSIX-compliant operating systems, which basically means Unix/Linux and macOS.  You'll also need to have [Node.js](https://nodejs.org/en/download/) pre-installed on your server.  Please note that we **strongly suggest that you install the LTS version of Node.js**.  While Cronicle should work on the "current" release channel, LTS is more stable and more widely tested.  See [Node.js Releases](https://nodejs.org/en/about/releases/) for details.

Cronicle also requires NPM to be preinstalled.  Now, this is typically bundled with and automatically installed with Node.js, but if you install Node.js by hand, you may have to install NPM yourself.

Once you have Node.js and NPM installed, type this as root:

```
curl -s https://raw.githubusercontent.com/jhuckaby/Cronicle/master/bin/install.js | node
```

This will install the latest stable release of Cronicle and all of its dependencies under: `/opt/cronicle/`

If you'd rather install it manually (or something went wrong with the auto-installer), here are the raw commands:

```
mkdir -p /opt/cronicle
cd /opt/cronicle
curl -L https://github.com/jhuckaby/Cronicle/archive/v1.0.0.tar.gz | tar zxvf - --strip-components 1
npm install
node bin/build.js dist
```

Replace `v1.0.0` with the desired Cronicle version from the [release list](https://github.com/jhuckaby/Cronicle/releases), or `master` for the head revision (unstable).

# Setup

If this is your first time installing, please read the [Configuration](Configuration.md) section first.  You'll likely want to customize a few configuration parameters in the `/opt/cronicle/conf/config.json` file before proceeding.  At the very least, you should set these properties:

| Key | Description |
|-----|-------------|
| `base_app_url` | A fully-qualified URL to Cronicle on your server, including the `http_port` if non-standard.  This is used in e-mails to create self-referencing URLs. |
| `email_from` | The e-mail address to use as the "From" address when sending out notifications. |
| `smtp_hostname` | The hostname of your SMTP server, for sending mail.  This can be `127.0.0.1` or `localhost` if you have [sendmail](https://en.wikipedia.org/wiki/Sendmail) running locally. |
| `secret_key` | For multi-server setups (see below) all your servers must share the same secret key.  Any randomly generated string is fine. |
| `job_memory_max` | The default maximum memory limit for each job (can also be customized per event and per category). |
| `http_port` | The web server port number for the user interface.  Defaults to 3012. |

Now then, the only other decision you have to make is what to use as a storage back-end.  Cronicle can use local disk (easiest setup), [Couchbase](http://www.couchbase.com/nosql-databases/couchbase-server) or [Amazon S3](https://aws.amazon.com/s3/).  For single server installations, or even single primary with multiple workers, local disk is probably just fine, and this is the default setting.  But if you want to run a true multi-server cluster with automatic primary failover, please see [Multi-Server Cluster](Setup.md#multi-server-cluster) for details.

With that out of the way, run the following script to initialize the storage system.  You only need to do this once, *and only on the primary server*.  Do not run this on any worker servers:

```
/opt/cronicle/bin/control.sh setup
```

Among other things, this creates an administrator user account you can use to login right away.  The username is `admin` and the password is `admin`.  It is recommended you change the password as soon as possible, for security purposes (or just create your own administrator account and delete `admin`).

At this point you should be able to start the service and access the web UI.  Enter this command:

```
/opt/cronicle/bin/control.sh start
```

Give it a minute to decide to become primary, then send your browser to the server on the correct port:

```
http://YOUR_SERVER_HOSTNAME:3012/
```

You only need to include the port number in the URL if you are using a non-standard HTTP port (see [Web Server Configuration](Configuration.md#web-server-configuration)).

See the [Web UI](WebUI.md) section below for instructions on using the Cronicle web interface.

## Single Server

For a single server installation, there is nothing more you need to do.  After installing the package, running the `bin/control.sh setup` script and starting the service, Cronicle should be 100% ready to go.  You can always add more servers later (see below).

## Single Primary with Workers

The easiest multi-server Cronicle setup is a single "primary" server with one or more workers.  This means that one server is the scheduler, so it keeps track of time, and assigns jobs for execution.  Jobs may be assigned to any number of worker servers, and even the primary itself.  Worker servers simply sit idle and wait for jobs to be assigned by the primary server.  Workers never take over primary scheduling duties, even if the primary server goes down.

This is the simplest multi-server setup because the primary server can use local disk for all its storage.  Workers do not need access to the file storage.  This is the default configuration, so you don't have to change anything at all.  What it means is, all the scheduling data, event categories, user accounts, sessions, plugins, job logs and other data is stored as plain JSON files on local disk.  Cronicle can also be configured to use a NoSQL database such as [Couchbase](http://www.couchbase.com/nosql-databases/couchbase-server) or [Amazon S3](https://aws.amazon.com/s3/), but this is not required.

So by default, when you run the setup script above, the current server is placed into a "Primary Group", meaning it is the only server that is eligible to become primary.  If you then install Cronicle on additional servers, they will become workers only.  You can change all this from the UI, but please read the next section before running multiple primary backup servers.

When installing Cronicle onto worker servers, please do not run the `bin/control.sh setup` script.  Instead, simply copy over your `conf/config.json` file, and then start the service.

## Multi-Server Cluster

Cronicle also has the ability to run with one or more "backup" servers, which can become primary if need be.  Failover is automatic, and the cluster negotiates who should be primary at any given time.  But in order for this to work, all the primary eligible servers need access to the same storage data.  This can be achieved in one of three ways:

* Use a shared filesystem such as [NFS](https://en.wikipedia.org/wiki/Network_File_System).
* Use a [Couchbase](http://www.couchbase.com/nosql-databases/couchbase-server) server.
* Use an [Amazon S3](https://aws.amazon.com/s3/) bucket.

See the [Storage Configuration](Configuration.md#storage-configuration) section below for details on these.

The other thing you'll need to do is make sure all your primary backup servers are in the appropriate server group.  By default, a single "Primary Group" is created which only contains your primary primary server.  Using the UI, you can simply change the hostname regular expression so it encompasses all your eligible servers, or you can just add additional groups that match each backup server.  More details can be found in the [Servers Tab](WebUI.md#servers-tab) section below.

### Load Balancers

You can run Cronicle behind a load balancer, as long as you ensure that only the primary server and eligible backup servers are in the load balancer pool.  Do not include any worker-only servers, as they typically do not have access to the back-end storage system, and cannot serve up the UI.

You can then set the [base_app_url](Configuration.md#base_app_url) configuration parameter to point to the load balancer, instead of an individual server, and also use that hostname when loading the UI in your browser.

Note that Web UI needs to make API calls and open [WebSocket](https://en.wikipedia.org/wiki/WebSocket) connections to the primary server directly, so it needs to also be accessible directly via its hostname.

You must set the [web_direct_connect](Configuration.md#web_direct_connect) configuration property to `true`.  This ensures that the Web UI will make API and WebSocket connections directly to the primary server, rather than via the load balancer hostname.

### Ops Notes

For teams setting up multi-server clusters, here are some operational concerns to keep in mind:

* All servers should have the same exact configuration file (`/opt/cronicle/conf/config.json`).
* All servers need to have correct clocks (timezones do not matter, clock sync does).
* Server auto-discovery happens via UDP broadcast on port 3014 (by default).  This is not required.
* The primary server will also open TCP [WebSocket](https://en.wikipedia.org/wiki/WebSocket) connections to each worker on the web server port.
* Each server in the cluster needs to have a fully-qualified hostname that resolves in DNS.
* The server hostnames determine priority of which server becomes primary (alphabetical sort).
* All servers need to have unique hostnames (very bad things will happen otherwise).
* All servers need to have at least one active IPv4 interface.
* For the "live log" feature in the UI to work, the user needs a network route to the server running the job, via its hostname.
* If you have to change any server IP addresses, they'll have to be removed and re-added to the cluster.
* See the [Cron Noncompliance](InnerWorkings.md#cron-noncompliance) section for differences in how Cronicle schedules events, versus the Unix Cron standard.

<hr/>

&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*
