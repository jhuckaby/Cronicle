# daemon

[![Build Status](https://secure.travis-ci.org/indexzero/daemon.node.png)](http://travis-ci.org/indexzero/daemon.node)

Turn a node script into a daemon.

## install via npm

```
npm install daemon
```

Requires node >= 0.8

## examples

```javascript
// this code is run twice
// see implementation notes below
console.log(process.pid);

// after this point, we are a daemon
require('daemon')();

// different pid because we are now forked
// original parent has exited
console.log(process.pid);
```

## api

### daemon()

Respawn the process (self) as a daemon. The parent process will exit at the point of this call.

### daemon.daemon(script, args, opt)

Spawn the `script` with given `args` array as a daemonized process. Return the `child` process object.

opt can optionally contain the following arguments:
* stdout (file descriptor for stdout of the daemon)
* stderr (file descriptor for stderr of the daemon)
* env (environment for the daemon) (default: process.env)
* cwd (current working directory for daemonized script) (default: process.cwd)

## implementation notes

Daemon actually re-spawns the current application and runs it again. The only difference between the original and the fork is that the original will not execute past the `daemon()` call whereas the fork will.

## node versions prior to 0.8

Using this module on older versions of node (or older versions of this module) are not recommended due to how node works internally and the issues it can cause for daemons.

## Contributors
[Charlie Robbins](http://nodejitsu.com)  
[Pedro Teixeira](https://github.com/pgte)  
[James Halliday](https://github.com/substack)  
[Zak Taylor](https://github.com/dobl)  
[Daniel Bartlett](https://github.com/danbuk)  
[Charlie McConnell](https://github.com/AvianFlu)  
[Slashed](http://github.com/slashed)  
[Roman Shtylman](http://github.com/shtylman)  

