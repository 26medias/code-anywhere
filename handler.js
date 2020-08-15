var pstack	= require('pstack')
var _ 		= require('underscore')

var lambdaHandler = function(app) {
	this.app		= app;
	this.logging	= false;
}


lambdaHandler.prototype.on = function(route, callback) {
	var scope = this;
	
	this.app.get(route, function(req, res) {
		
		var params	= _.extend({}, req.query, req.body);
		
		scope.parseParameters(params, function(params) {
			callback(params, function(response, headers) {
				scope.processResponse(response, headers, req, res);
			}, req, res);
		});
		
	});
	
	this.app.post(route, function(req, res) {
		
		var params = _.extend({}, req.body, req.params)
		
		scope.parseParameters(params, function(params) {
			callback(params, function(response, headers) {
				scope.processResponse(response, headers, req, res);
			}, req, res);
		});
		
		
	});
}

lambdaHandler.prototype.parseParameters = function(params, callback) {
	callback(params);
}

lambdaHandler.prototype.processResponse = function(response, headers, req, res) {
	res.writeHead(200, headers);
	//console.log("> response",response);
	if (typeof response == "string") {
		res.end(response);
	} else {
		res.end(JSON.stringify(response, null, 4));
	}
}

module.exports = lambdaHandler
