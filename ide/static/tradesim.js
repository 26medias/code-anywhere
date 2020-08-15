(async function(window, ss) {
	var trading_agent	= function(dataset, options) {
		this.dataset	= dataset;
		this.options	= options;
		this.positions	= [];
		this.state		= {
			open:	false,
			gain:	0
		};
	}
	trading_agent.prototype.buy = function(datapoint) {
		if (this.state.open) {
			return false;
		}
		this.state.open		= datapoint[this.options.o];
		this.state.openDate	= datapoint.t;
		this.state.gain		= 0;
	}
	trading_agent.prototype.close = function(datapoint) {
		if (!this.state.open) {
			return false;
		}
		this.positions.push({
			open:		this.state.open,
			close:		datapoint[this.options.o],
			openDate:	this.state.openDate,
			closeDate:	datapoint.t,
			duration:	datapoint.t-datapoint[this.options.o],
			gain:		(datapoint[this.options.o]-this.state.open)/datapoint[this.options.o]*100
		});
		this.state.open	= false;
		this.state.gain	= 0;
	}
	trading_agent.prototype.start = async function(onTick, callback) {
		var scope = this;
		async function _start() {
			var n = 0;
			for (datapoint of scope.dataset) {
				var tick = await onTick(n, datapoint, scope.state, {
					buy:	function() {
						return scope.buy(datapoint);
					},
					close:	function() {
						return scope.close(datapoint);
					}
				});
				//console.log("> tick ", n, tick);
				n++;
			}
			return n;
		}
		await _start();
		//console.log("DONE?");
		/*_.each(this.dataset, function(datapoint, n) {
			scope.state.gain	= (datapoint[scope.options.o]-scope.state.open)/datapoint[scope.options.o]*100;
			scope.onTick(n, datapoint, scope.state, {
				buy:	function() {
					return scope.buy(datapoint);
				},
				close:	function() {
					return scope.close(datapoint);
				}
			});
		});*/
		callback(scope.state);
	}
	// Get stats & series ready to chart
	trading_agent.prototype.stats = function() {
		var scope = this;
		if (this.positions.length==0) {
			return "No positions";
		}
		var _series = {};
		var _stats	= {};
		
		// Gain over time
		var sum = 0;
		_.each(_.keys(this.positions[0]), function(k) {
			_series[k]	= _.pluck(scope.positions, k);
			_stats[k]	= {};
			_.each(['min','max','mean','sum','median','variance', 'standardDeviation'], function(fn) {
				_stats[k][fn]	= ss[fn](_series[k])
			});
			_series[k]	= _.map(_series[k], function(item, n) {
				return [n, item];
			});
		});
		_series.gainOverTime	= _.map(_series.gain, function(v, n) {
			sum = sum + v[1];
			return [n, sum*1];
		});
		
		return {
			positions:	this.positions,
			series:		_series,
			stats:		_stats
		}
	}
	
	window.tradesim = {
		trading_agent:	trading_agent
	};
})(window, ss)