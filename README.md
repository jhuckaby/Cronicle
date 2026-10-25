# xyOps™: The Future of Cronicle

**Meet [xyOps](https://xyops.io/), the next generation of Cronicle, built by the same creator.**  It carries Cronicle's scheduling and plugin philosophy forward into a complete, self-hosted platform for job scheduling, visual workflows, server monitoring, alerting, and incident response.

[Explore xyOps](https://xyops.io/) | [Migration Guide](https://docs.xyops.io/cronicle) | [Install](https://docs.xyops.io/hosting) | [GitHub](https://github.com/pixlcore/xyops)

[![xyOps visual workflow editor](https://pixlcore.com/images/blog/xyops/workflow-edit.webp)](https://xyops.io/)

**Fully open source. Self-hosted. No telemetry. No feature gates.**  Every xyOps application feature is free, including SSO.  Paid plans provide optional human support and hands-on assistance.

## Why move to xyOps?

Keep the scheduling concepts you know, and give your automation room to grow:

- **Build visual workflows:** Connect jobs with branching, parallel execution, human approval, and reusable sub-workflows.
- **Watch jobs and servers together:** See live metrics, processes, network connections, and historical performance in one place.
- **Investigate failures with context:** Capture server snapshots when alerts fire, open tickets, and launch automated remediation.
- **Simplify your workers:** Run jobs through lightweight xySat agents without installing Node.js on every worker server.
- **Bring your existing automation:** Import Cronicle schedules and configuration, keep compatible plugins, and automatically convert multiplexed events into workflows.

## Bring your Cronicle schedules forward

You don't have to rebuild your schedule from scratch.  xyOps includes a Cronicle data importer and a plugin compatibility mode to help you get started:

1. **Set up xyOps** using the [Self-Hosting Guide](https://docs.xyops.io/hosting), then add your worker servers before importing so event targets can be matched correctly.
2. **Export your Cronicle data** using the built-in [export command](https://github.com/jhuckaby/Cronicle/blob/master/docs/CommandLine.md#data-import-and-export).  This includes events, categories, plugins, users, API keys, and server groups.  Job history and logs are not included.
3. **Import through the xyOps interface:** Sign in as an administrator, open **System**, click **Import Data...**, and select **Cronicle Data Format** to upload your export.
4. **Review and test your setup:** Check the import report, event settings, and user privileges.  Enable [Cronicle plugin compatibility mode](https://docs.xyops.io/cronicle#plugin-compatibility-mode) for existing plugins that need it.  When you're ready to switch, pause Cronicle's scheduler before enabling scheduling in xyOps to avoid duplicate runs.

Start with a fresh xyOps installation for your migration trial.  Importing replaces conflicting data in xyOps, aborts its running jobs, clears its queues, and pauses its scheduler.  xyOps is a separate application, so plan to test your imported jobs before switching production over.

Prefer a familiar look?  You can even restore the Cronicle name and logo in the xyOps interface.

**[Read the full Cronicle migration guide](https://docs.xyops.io/cronicle)** for compatibility details and step-by-step instructions, or **[try xyOps in one Docker command](https://github.com/pixlcore/xyops#try-xyops-in-one-command)** to explore it first.

## What about Cronicle?

Cronicle will continue to receive maintenance, primarily bug fixes and security patches.  **xyOps is the path forward for new features and capabilities.**  The Cronicle documentation and project details continue below.

# Overview

**Cronicle** is a multi-server task scheduler and runner, with a web based front-end UI.  It handles both scheduled, repeating and on-demand jobs, targeting any number of worker servers, with real-time stats and live log viewer.  It's basically a fancy [Cron](https://en.wikipedia.org/wiki/Cron) replacement written in [Node.js](https://nodejs.org/).  You can give it simple shell commands, or write Plugins in virtually any language.

![Main Screenshot](https://pixlcore.com/software/cronicle/screenshots-new/job-details-complete.png)

## Features at a Glance

* Single or multi-server setup.
* Automated failover to backup servers.
* Auto-discovery of nearby servers.
* Real-time job status with live log viewer.
* Plugins can be written in any language.
* Schedule events in multiple timezones.
* Optionally queue up long-running events.
* Track CPU and memory usage for each job.
* Historical stats with performance graphs.
* Simple JSON messaging system for Plugins.
* Web hooks for external notification systems.
* Simple REST API for scheduling and running events.
* API Keys for authenticating remote apps.

## Documentation

The Cronicle documentation is split up across these files:

- &rarr; **[Installation & Setup](https://github.com/jhuckaby/Cronicle/blob/master/docs/Setup.md)**
- &rarr; **[Configuration](https://github.com/jhuckaby/Cronicle/blob/master/docs/Configuration.md)**
- &rarr; **[Web UI](https://github.com/jhuckaby/Cronicle/blob/master/docs/WebUI.md)**
- &rarr; **[Plugins](https://github.com/jhuckaby/Cronicle/blob/master/docs/Plugins.md)**
- &rarr; **[Command Line](https://github.com/jhuckaby/Cronicle/blob/master/docs/CommandLine.md)**
- &rarr; **[Inner Workings](https://github.com/jhuckaby/Cronicle/blob/master/docs/InnerWorkings.md)**
- &rarr; **[API Reference](https://github.com/jhuckaby/Cronicle/blob/master/docs/APIReference.md)**
- &rarr; **[Development](https://github.com/jhuckaby/Cronicle/blob/master/docs/Development.md)**

## Glossary

A quick introduction to some common terms used in Cronicle:

| Term | Description |
|------|-------------|
| **Primary Server** | The primary server which keeps time and runs the scheduler, assigning jobs to other servers, and/or itself. |
| **Backup Server** | A worker server which will automatically become primary and take over duties if the current primary dies. |
| **Worker Server** | A server which sits idle until it is assigned jobs by the primary server. |
| **Server Group** | A named group of servers which can be targeted by events, and tagged as "primary eligible", or "worker only". |
| **API Key** | A special key that can be used by external apps to send API requests into Cronicle.  Remotely trigger jobs, etc. |
| **User** | A human user account, which has a username and a password.  Passwords are salted and hashed with [bcrypt](https://en.wikipedia.org/wiki/Bcrypt). |
| **Plugin** | Any executable script in any language, which runs a job and reads/writes JSON to communicate with Cronicle. |
| **Schedule** | The list of events, which are scheduled to run at particular times, on particular servers. |
| **Category** | Events can be assigned to categories which define defaults and optionally a color highlight in the UI. |
| **Event** | An entry in the schedule, which may run once or many times at any interval.  Each event points to a Plugin, and a server or group to run it. |
| **Job** | A running instance of an event.  If an event is set to run hourly, then a new job will be created every hour. |

# Colophon

We stand on the shoulders of giants.  Cronicle was built using these awesome Node modules:

| Module Name | Description | License |
|-------------|-------------|---------|
| [async](https://www.npmjs.com/package/async) | Higher-order functions and common patterns for asynchronous code. | MIT |
| [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Optimized bcrypt in JavaScript with zero dependencies. | BSD 3-Clause |
| [chart.js](https://www.npmjs.com/package/chart.js) | Simple HTML5 charts using the canvas element. | MIT |
| [daemon](https://www.npmjs.com/package/daemon) | Add-on for creating \*nix daemons. | MIT |
| [errno](https://www.npmjs.com/package/errno) | Node.js libuv errno details exposed. | MIT |
| [font-awesome](https://www.npmjs.com/package/font-awesome) | The iconic font and CSS framework. | OFL-1.1 and MIT |
| [form-data](https://www.npmjs.com/package/form-data) | A library to create readable "multipart/form-data" streams. Can be used to submit forms and file uploads to other web applications. | MIT |
| [formidable](https://www.npmjs.com/package/formidable) | A Node.js module for parsing form data, especially file uploads. | MIT |
| [jstimezonedetect](https://www.npmjs.com/package/jstimezonedetect) | Automatically detects the client or server timezone. | MIT |
| [jquery](https://www.npmjs.com/package/jquery) | JavaScript library for DOM operations. | MIT |
| [mdi](https://www.npmjs.com/package/mdi) | Material Design Webfont. This includes the Stock and Community icons in a single webfont collection. | OFL-1.1 and MIT |
| [mkdirp](https://www.npmjs.com/package/mkdirp) | Recursively mkdir, like `mkdir -p`. | MIT |
| [moment](https://www.npmjs.com/package/moment) | Parse, validate, manipulate, and display dates. | MIT |
| [moment-timezone](https://www.npmjs.com/package/moment-timezone) | Parse and display moments in any timezone. | MIT |
| [netmask](https://www.npmjs.com/package/netmask) | Parses and understands IPv4 CIDR blocks so they can be explored and compared. | MIT |
| [node-static](https://www.npmjs.com/package/node-static) | A simple, compliant file streaming module for node. | MIT |
| [nodemailer](https://www.npmjs.com/package/nodemailer) | Easy as cake e-mail sending from your Node.js applications. | MIT |
| [shell-quote](https://www.npmjs.com/package/shell-quote) | Quote and parse shell commands. | MIT |
| [socket.io](https://www.npmjs.com/package/socket.io) | Node.js real-time framework server (Websockets). | MIT |
| [socket.io-client](https://www.npmjs.com/package/socket.io-client) | Client library for server-to-server socket.io connections. | MIT |
| [uglify-js](https://www.npmjs.com/package/uglify-js) | JavaScript parser, mangler/compressor and beautifier toolkit. | BSD-2-Clause |
| [zxcvbn](https://www.npmjs.com/package/zxcvbn) | Realistic password strength estimation, from Dropbox. | MIT |

## Companies Using Cronicle

Cronicle is known to be in use by the following companies:

- [Agnes & Dora](https://agnesanddora.com)
- [Sling TV](https://sling.com)

# License

**The MIT License (MIT)**

*Copyright (c) 2015 - 2025 Joseph Huckaby*

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
