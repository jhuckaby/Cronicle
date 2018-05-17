MOCHA=node_modules/.bin/mocha
REPORTER=spec
test: 
	$(MOCHA) $(shell find test -name "*test.js") --reporter $(REPORTER)
async:
	$(MOCHA) test/async-test.js --reporter $(REPORTER)
sync:
	$(MOCHA) test/sync-test.js --reporter $(REPORTER)
.PHONY: test