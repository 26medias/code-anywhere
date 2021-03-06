+(function(window) {
	function stack(options) {
		this.options = _.extend({
			async:			false,
			batch:			false,
			onProgress:		false,
			reportInterval:	1
		},options);
		this.reset();
	}
	stack.prototype.reset = function() {
		this.stack 		= [];
		this.count 		= 0;
	}
	stack.prototype.add = function(fn, params, timeout) {
		this.stack.push({
			fn:			fn,
			params:		params,
			timeout:	timeout,
			n:			this.stack.length
		});
		this.count++;
	}
	stack.prototype.start = function(callback) {
		this.stackLength		= this.stack.length;
		this.stackDone			= 0;
		this.lastReportedPct	= 0;
		this.pct				= 0;
		this.prevPct			= 0;
		this.c					= 0;
		
		
		if (this.options.batch) {
			var i,j;
			var l	= this.stack.length;
			
			// Split into batches
			this.batches	= [];
			for (i=0;i<l;i+=this.options.batch) {
				this.batches.push(this.stack.slice(i, i+this.options.batch));
			}
		}
		
		this.process(callback);
	}
	stack.prototype.process = function(callback) {
		var scope = this;
		
		if (this.options.batch) {
			// Move the first item of the batch to the stack
			if (this.batches.length==0) {
				callback();
				return true;
			}
			this.stack	= this.batches[0];
			this.count	= this.stack.length;
		}
		
		if (this.stack.length == 0) {
			callback();
			return false;
		}
		
		if (!this.options.async && !this.options.batch) {
			// synchronous execution
			if (this.stack.length == 0) {
				callback();
				return true;
			}
			
			var timeout;	// setTimeout instance
			var executed = false;
			var done = function(status) {
				//console.log("-- done");
				executed = true;
				// Kill the timeout if there's one
				clearInterval(timeout);
				if (status===false) {
					scope.stack	= [];
					callback();
				} else {
					scope.stack.shift();
					scope.stackDone++;
					scope.prevPct	= parseFloat(scope.pct);
					scope.pct		= Math.round((scope.stackDone/scope.stackLength*10000))/100;
					//console.log("scope.pct",scope.pct);
					if (scope.stack.length == 0) {
						callback();
						if (scope.options.onProgress) {
							scope.options.onProgress(100);	// Reached the end, 100%;
						}
					} else {
						scope.process(callback);
						if (scope.options.onProgress && (scope.pct-scope.lastReportedPct)>=scope.options.reportInterval && scope.pct!=scope.prevPct) {
							scope.options.onProgress(scope.pct);
							scope.lastReportedPct	= scope.pct;
						}
					}
				}
			};
			if (this.stack[0].timeout) {
				
				//console.log("["+scope.stack[0].n+"] TIMEOUT: ", this.stack[0].timeout);
				
				
				// Timeout code
				var end = function(status) {
					clearInterval(timeout);
					//console.log("end("+status+")");
					if (executed) {
						//console.log("REPLY IGNORED, already timed out");
						return false;
					}
					executed = true;
					done(status);
				}
				var expires = new Date().getTime()+(this.stack[0].timeout*1000)
				timeout = setInterval(function() {	// Use a setInterval to compensate for JS shitty time keeping
					if (new Date().getTime() > expires) {
						//console.log("TIMEOUT");
						end();
					}
				}, 500);
				// End of timeout code
				
				this.stack[0].fn(function(status) {
					
					if (!executed) {
						end(status);
					} else {
						//console.log("Exec["+scope.stack[0].n+"]: DOUBLE", status);
					}
				}, this.stack[0].params);
			} else {
				this.stack[0].fn(function(status) {
					if (!executed) {
						done(status);
					} else {
						//console.log("Exec["+scope.stack[0].n+"]: DOUBLE", status);
					}
				}, this.stack[0].params);
			}
			
		} else {
			// asynchronous execution
			var i;
			for (i=0;i<this.stack.length;i++) {
				this.stack[i].fn(function() {
					scope.count--;
					if (scope.count == 0) {
						if (scope.options.batch) {
							scope.batches.shift();
							scope.process(callback);
						} else {
							callback();
						}
					}
				}, this.stack[i].params);
			}
		}
	}
	
	window.pstack	= stack;
})(window);