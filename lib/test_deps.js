
var Class = require("pixl-class");
var JobMixin = require("./job.js");

var Dummy = Class.create({
    __mixins: [ JobMixin ],
    state: { jobCodes: {} },
    logDebug: function(level, msg) { /* console.log("DEBUG " + level + ": " + msg); */ }
});

var dummy = new Dummy();

function assert(condition, message) {
    if (!condition) {
        console.error("FAILED: " + message);
        process.exit(1);
    } else {
        console.log("PASSED: " + message);
    }
}

// Test cases
dummy.state.jobCodes = { 'ev1': 0, 'ev2': 1, 'ev3': 0 };

assert(dummy.checkJobDependencies({ dependencies: "success(ev1)" }) === true, "success(ev1) should be true");
assert(dummy.checkJobDependencies({ dependencies: "success(ev2)" }) === false, "success(ev2) should be false");
assert(dummy.checkJobDependencies({ dependencies: "failure(ev2)" }) === true, "failure(ev2) should be true");
assert(dummy.checkJobDependencies({ dependencies: "done(ev1)" }) === true, "done(ev1) should be true");
assert(dummy.checkJobDependencies({ dependencies: "done(ev4)" }) === false, "done(ev4) should be false");

assert(dummy.checkJobDependencies({ dependencies: "success(ev1) & failure(ev2)" }) === true, "success(ev1) & failure(ev2) should be true");
assert(dummy.checkJobDependencies({ dependencies: "success(ev1) & success(ev2)" }) === false, "success(ev1) & success(ev2) should be false");
assert(dummy.checkJobDependencies({ dependencies: "success(ev1) | success(ev2)" }) === true, "success(ev1) | success(ev2) should be true");

assert(dummy.checkJobDependencies({ dependencies: "success(ev1) & (success(ev2) | success(ev3))" }) === true, "Complex expression 1 should be true");
assert(dummy.checkJobDependencies({ dependencies: "!success(ev2)" }) === true, "!success(ev2) should be true");

assert(dummy.checkJobDependencies({ dependencies: "success(ev1) ; drop table users" }) === false, "Injection attempt should be blocked");

console.log("All dependency tests passed!");
