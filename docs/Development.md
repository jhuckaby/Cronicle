&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*

<hr/>

<!-- toc -->
- [Development](#development)
	* [Installing Dev Tools](#installing-dev-tools)
	* [Manual Installation](#manual-installation)
	* [Starting in Debug Mode](#starting-in-debug-mode)
	* [Running Unit Tests](#running-unit-tests)

# Development

Cronicle runs as a component in the [pixl-server](https://www.npmjs.com/package/pixl-server) framework.  It is highly recommended to read and understand that module and its component system before attempting to develop Cronicle.  The following server components are also used:

| Module Name | Description | License |
|-------------|-------------|---------|
| [pixl-server-api](https://www.npmjs.com/package/pixl-server-api) | A JSON API component for the pixl-server framework. | MIT |
| [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) | A key/value/list storage component for the pixl-server framework. | MIT |
| [pixl-server-user](https://www.npmjs.com/package/pixl-server-user) | A basic user login system for the pixl-server framework. | MIT |
| [pixl-server-web](https://www.npmjs.com/package/pixl-server-web) | A web server component for the pixl-server framework. | MIT |

In addition, Cronicle uses the following server-side PixlCore utility modules:

| Module Name | Description | License |
|-------------|-------------|---------|
| [pixl-args](https://www.npmjs.com/package/pixl-args) | A simple module for parsing command line arguments. | MIT |
| [pixl-class](https://www.npmjs.com/package/pixl-class) | A simple module for creating classes, with inheritance and mixins. | MIT |
| [pixl-config](https://www.npmjs.com/package/pixl-config) | A simple JSON configuration loader. | MIT |
| [pixl-json-stream](https://www.npmjs.com/package/pixl-json-stream) | Provides an easy API for sending and receiving JSON records over standard streams (pipes or sockets). | MIT |
| [pixl-logger](https://www.npmjs.com/package/pixl-logger) | A simple logging class which generates bracket delimited log columns. | MIT |
| [pixl-mail](https://www.npmjs.com/package/pixl-mail) | A very simple class for sending e-mail via SMTP. | MIT |
| [pixl-perf](https://www.npmjs.com/package/pixl-perf) | A simple, high precision performance tracking system. | MIT |
| [pixl-request](https://www.npmjs.com/package/pixl-request) | A very simple module for making HTTP requests. | MIT |
| [pixl-tools](https://www.npmjs.com/package/pixl-tools) | A set of miscellaneous utility functions for Node.js. | MIT |
| [pixl-unit](https://www.npmjs.com/package/pixl-unit) | A very simple unit test runner for Node.js. | MIT |

For the client-side, the Cronicle web application is built on the [pixl-webapp](https://www.npmjs.com/package/pixl-webapp) HTML5/CSS/JavaScript framework:

| Module Name | Description | License |
|-------------|-------------|---------|
| [pixl-webapp](https://www.npmjs.com/package/pixl-webapp) | A client-side JavaScript framework, designed to be a base for web applications. | MIT |

## Installing Dev Tools

For Debian (Ubuntu) OSes:

```
apt-get install build-essential
```

For RedHat (Fedora / CentOS):

```
yum install gcc-c++ make
```

For Mac OS X, download [Apple's Xcode](https://developer.apple.com/xcode/download/), and then install the [command-line tools](https://developer.apple.com/downloads/).

## Manual Installation

Here is how you can download the very latest Cronicle dev build and install it manually (may contain bugs!):

```
git clone https://github.com/jhuckaby/Cronicle.git
cd Cronicle
npm install
node bin/build.js dev
```

This will keep all JavaScript and CSS unobfuscated (original source served as separate files).

I highly recommend placing the following `.gitignore` file at the base of the project, if you plan on committing changes and sending pull requests:

```
.gitignore
/node_modules
/work
/logs
/queue
/data
/conf
htdocs/index.html
htdocs/js/common
htdocs/js/external/*
htdocs/fonts/*
htdocs/css/base.css
htdocs/css/c3*
htdocs/css/font*
htdocs/css/mat*
```

## Starting in Debug Mode

To start Cronicle in debug mode, issue the following command:

```
./bin/debug.sh
```

This will launch the service without forking a daemon process, and echo the entire debug log contents to the console.  This is great for debugging server-side issues.  Beware of file permissions if you run as a non-root user.  Hit Ctrl-C to shut down the service when in this mode.

Also, you can force it to become the primary server right away, so there is no delay before you can use the web app:

```
./bin/debug.sh --master
```

Do not use the `--master` switch on multiple servers in a cluster.  For multi-server setups, it is much better to wait for Cronicle to decide who should become primary (~60 seconds after startup).

Please note that when starting Cronicle in debug mode, all existing events with [Run All Mode](WebUI.md#run-all-mode) set will instantly be "caught up" to the current time, and not run any previous jobs.  Also, some features are not available in debug mode, namely the "Restart" and "Shut Down" links in the UI.

## Running Unit Tests

Cronicle comes with a full unit test suite, which runs via the [pixl-unit](https://www.npmjs.com/package/pixl-unit) module (which should be installed automatically).  To run the unit tests, make sure Cronicle isn't already running, and type this:

```
npm test
```

If any tests fail, please open a [GitHub issue](https://github.com/jhuckaby/Cronicle/issues) and include the full unit test log, which can be found here:

```
/opt/cronicle/logs/unit.log
```

<hr/>

&larr; *[Return to the main document](https://github.com/jhuckaby/Cronicle/blob/master/README.md)*
