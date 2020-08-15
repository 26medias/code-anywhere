/**
	touchEvent
	@author:		Julien Loutre <julien.loutre@gmail.com>
*/
function touchEvent(el, callback, noPropagation, cellSize) {
	this.element 	= el;
	var scope 		= this;
	this.mousedown 	= false;
	this.cellSize 	= cellSize;
	this.callback 	= callback;
	if (!this.callback) {
		this.callback = function() {};
	}
	this.stopped	= false;
	this.clickPos = {
		x:	0,
		y:	0
	};
	
	// Allow expection on this element is there was a parent blocking the drag or something
	$(this.element).data('allowclick', true);
	
	
	this.element.get(0).addEventListener("mousedown", function(e) {
		if (scope.stopped) {
			return true;
		}
		// exception on hint and instruction buttons on mobiles
		if (noPropagation) {
			var targ;
			if (e.target) {
				targ = e.target;
			} else if (e.srcElement) {
				targ = e.srcElement;
			}
			if (targ.nodeType == 3) { // defeat Safari bug
				targ = targ.parentNode;
			}
			if (!$(targ).data || !$(targ).data('allowclick')) {
				e.preventDefault();
			}
		}
		scope.mousedown = true;
		// Are we on a grid with cells?
		if (cellSize) {
			scope.clickPos = scope.toGrid(e.pageX,e.pageY);
		} else {
			scope.clickPos = {
				x:	e.pageX,
				y:	e.pageY
			};
		}
		//console.log("scope.callback",scope.callback);
		scope.callback({
			type: 	'mousedown',
			pos:	scope.clickPos,
			event:	e
		});
	});
	document.addEventListener("mouseup", function(e) {
		if (scope.stopped) {
			return true;
		}
		scope.mousedown = false;
		if (cellSize) {
			var fixedPos = scope.toGrid(e.pageX,e.pageY);
			scope.callback({
				type: 	'mouseup',
				pos:	{
					x:	fixedPos.x,
					y:	fixedPos.y
				},
				event:	e
			});
		} else {
			scope.callback({
				type: 	'mouseup',
				pos:	{
					x:	e.pageX,
					y:	e.pageY
				},
				event:	e
			});
		}
	});
	
	document.addEventListener("mousemove", function(e) {
		//console.log("e.pageX,e.pageY",e.pageX,e.pageY);
		if (scope.stopped) {
			return true;
		}
		if (cellSize) {
			var fixedPos = scope.toGrid(e.pageX,e.pageY);
			scope.callback({
				type: 	'mousemove',
				pos:	{
					x:	fixedPos.x,
					y:	fixedPos.y
				},
				event:	e
			});
		} else {
			scope.callback({
				type: 	'mousemove',
				pos:	{
					x:	e.pageX,
					y:	e.pageY
				},
				event:	e
			});
		}
		if (scope.mousedown) {
			if (cellSize) {
				var fixedPos 		= scope.toGrid(e.pageX,e.pageY);
				
				scope.callback({
					type: 	'mousedrag',
					pos:	{
						x:	fixedPos.x,
						y:	fixedPos.y
					},
					distance:	{
						x:	fixedPos.x-scope.clickPos.x,
						y:	fixedPos.y-scope.clickPos.y
					},
					start:	{
						x:	scope.clickPos.x,
						y:	scope.clickPos.y
					},
					event:	e
				});
			} else {
				scope.callback({
					type: 	'mousedrag',
					pos:	{
						x:	e.pageX,
						y:	e.pageY
					},
					distance:	{
						x:	e.pageX-scope.clickPos.x,
						y:	e.pageY-scope.clickPos.y
					},
					start:	{
						x:	scope.clickPos.x,
						y:	scope.clickPos.y
					},
					event:	e
				});
			}
		}
	});
};
touchEvent.prototype.toGrid = function(x,y) {
	// get the [0;0] position of the element
	var origin 	= this.element.offset();
	
	var fixedX	= x-origin.left;
	var fixedY	= y-origin.top;
	
	return {
		x:	Math.floor(fixedX/this.cellSize),
		y:	Math.floor(fixedY/this.cellSize),
	}
};
touchEvent.prototype.unbind = function() {
	this.stopped = true;
};


var gameTransitions	= {
	merge:	function(from, to, callback, options) {
		options	= _.extend({
			duration:	300
		}, options);
		
		var parent	= $(from).parents('.content');
		
		var tweenable = new Tweenable();
		
		tweenable.tween({
			from:     {
				x:	Math.round($(from).position().left),
				y:	Math.round($(from).position().top+parseInt($(from).css('margin-top'))),
				w:	Math.round($(from).outerWidth()),
				h:	Math.round($(from).outerHeight()),
				a:	1
			},
			to:       {
				x:	Math.round($(to).position().left),
				y:	Math.round($(to).position().top+parseInt($(to).css('margin-top'))),
				w:	Math.round($(to).outerWidth()),
				h:	Math.round($(to).outerHeight()),
				a:	0
			},
			duration: options.duration,
			step: function (state) {
				//console.log("state",state,$(from));
				$(from).css({
					left:		state.x+'px',
					top:		(parent.scrollTop()+state.y)+'px',
					width:		state.w+'px',
					height:		state.h+'px',
					opacity:	state.a
				});
			},
			finish: function (state) {
				$(from).hide();
				if (callback) {
					callback();
				}
			}
		});
	},
	ghost:	function(from, to, callback, options) {
		options	= _.extend({
			duration:	500
		}, options);
		
		var tweenable = new Tweenable();
		tweenable.tween({
			from:     {
				x:	Math.round($(from).position().left),
				y:	Math.round($(from).position().top+parseInt($(from).css('margin-top'))),
				w:	Math.round($(from).outerWidth()),
				h:	Math.round($(from).outerHeight()),
				shx:0,
				shy:0,
				shd:0,
				a:	1
			},
			to:       {
				x:	Math.round($(to).position().left),
				y:	Math.round($(to).position().top+parseInt($(to).css('margin-top'))),
				w:	Math.round($(to).outerWidth()),
				h:	Math.round($(to).outerHeight()),
				shx:15,
				shy:15,
				shd:10,
				a:	0
			},
			easing: {
				x:	'easeOutSine',
				y:	'easeInSine',
				w:	'easeInBack',
				h:	'easeInBack',
				a:	'easeInSine'
			},
			duration: options.duration,
			step: function (state) {
				$(from).css({
					left:		state.x+'px',
					top:		state.y+'px',
					width:		state.w+'px',
					height:		state.h+'px',
					opacity:	state.a,
					//boxShadow:	state.shx+'px '+state.shy+'px '+state.shd+'px rgba(0,0,0,0.6)'
				});
			},
			finish: function (state) {
				$(from).hide();
				if (callback) {
					callback();
				}
			}
		});
	},
	moveTo:	function(from, position, callback, options) {
		
		options	= _.extend({
			duration:	300
		}, options);
		
		var parent	= $(from).parents('.content');
		
		var tweenable = new Tweenable();
		
		tweenable.tween({
			from:     {
				x:	$(from).position().left,
				y:	(parent.scrollTop()+$(from).position().top+parseInt($(from).css('margin-top')))
			},
			to:       {
				x:	position.x,
				y:	position.y
			},
			duration: options.duration,
			step: function (state) {
				$(from).css({
					left:		state.x+'px',
					top:		state.y+'px'
				});
			},
			finish: function (state) {
				if (callback) {
					callback();
				}
			}
		});
	},
	fade:	function(el, callback, options) {
		
		options	= _.extend({
			duration:	300,
			start:		parseInt($(el).css('opacity')) || 1,
			alpha:		0.2
		}, options);
		
		var tweenable = new Tweenable();
		
		tweenable.tween({
			from:     {
				opacity:	options.start
			},
			to:       {
				opacity:	options.alpha
			},
			duration:	options.duration,
			step: function (state) {
				$(el).css({
					opacity:	state.opacity
				});
			},
			finish: function (state) {
				if (callback) {
					callback();
				}
			}
		});
	},
	ghostText:	function(target, options, callback) {
		
		target	= $(target);
		
		options	= _.extend({
			duration:	700,
			text:		'BOOM',
			color:		'#D76F67',
			className:	'animation-score',
		}, options);
		
		var element	= window.gameElements.dom('div', $('body'));
		element.css({
			display:	'inline-block'
		});
		element.html(options.text);
		
		
		
		var css = {
			position:	'absolute',
			top:		target.offset().top+(target.innerHeight()/2)-(element.innerHeight()/2),
			left:		target.offset().left+(target.innerWidth()/2)-(element.innerWidth()/2),
			color:		options.color,
			'z-index':	10000
		};
		
		element.css(css);
		element.addClass(options.className);
		
		
		var tweenable = new Tweenable();
		
		tweenable.tween({
			from:     {
				top:		parseInt(css.top),
				opacity:	1,
				scale:		1
			},
			to:       {
				top:		parseInt(css.top)-200,
				opacity:	0,
				scale:		2
			},
			duration:	options.duration,
			step: function (state) {
				$(element).css({
					opacity:	state.opacity,
					top:		state.top+'px',
					transform:	'scale('+state.scale+','+state.scale+')'
				});
			},
			finish: function (state) {
				if (callback) {
					callback();
				}
				$(element).remove();
			}
		});
		
	}
};

if (module && module.exports) {
	module.exports = touchEvent;
}
