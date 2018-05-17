var child_process = require('child_process');

// daemonize ourselves
module.exports = function(opt) {
    // we are a daemon, don't daemonize again
    if (process.env.__daemon) {
        return process.pid;
    }

    var args = [].concat(process.argv);

    // shift off node
    args.shift();

    // our script name
    var script = args.shift();

    opt = opt || {};
    var env = opt.env || process.env;

    // the child process will have this set so we can identify it as being daemonized
    env.__daemon = true;

    // start ourselves as a daemon
    module.exports.daemon(script, args, opt);

    // parent is done
    return process.exit();
};

// daemonizes the script and returns the child process object
module.exports.daemon = function(script, args, opt) {

    opt = opt || {};

    var stdout = opt.stdout || 'ignore';
    var stderr = opt.stderr || 'ignore';

    var env = opt.env || process.env;
    var cwd = opt.cwd || process.cwd;

    var cp_opt = {
        stdio: ['ignore', stdout, stderr],
        env: env,
        cwd: cwd,
        detached: true
    };

    // spawn the child using the same node process as ours
    var child = child_process.spawn(process.execPath, [script].concat(args), cp_opt);

    // required so the parent can exit
    child.unref();

    return child;
};

