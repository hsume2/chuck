chuck.js:
	@./node_modules/.bin/browserbuild -m chuck -g chuck -d --basepath lib/ lib/chuck.js > chuck.js

clean:
	@rm -f chuck.js

test:
	@./node_modules/.bin/mocha --ui bdd spec/javascripts/*.spec.js

coverage:
	jscoverage --no-highlight lib lib-cov
	CHUCK_COV=1 ./node_modules/.bin/mocha --ui bdd -R html-cov spec/javascripts/*.spec.js > coverage.html
	rm -rf lib-cov

.PHONY: chuck.js clean test coverage
