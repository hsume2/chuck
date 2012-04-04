chuck.js:
	@./node_modules/.bin/browserbuild -m chuck -g chuck -d --basepath lib/ lib/chuck.js > chuck.js

clean:
	@rm -f chuck.js

test:
	@./node_modules/.bin/mocha -r spec/javascripts/common.js --ui bdd spec/javascripts/*.spec.js

.PHONY: chuck.js clean test
