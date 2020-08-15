+(function(window) {
	
	window.app.directive('dateRange', ['$compile', function ($compile) {
		return function($scope, element, attrs, ctlr) {
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			// Hack... otherwise it doesn't work in electron
			$.fn.daterangepicker = window.daterangepicker;
			
			var main = {
				init:	function(range) {
					if (!range.start) {
						range.start = moment().subtract(29, 'days');
					}
					if (!range.end) {
						range.end = moment();
					}
					$(element).daterangepicker({
						startDate:	 moment(range.start),
						endDate:	 moment(range.end),
						ranges: {
							'Today': [moment(), moment()],
							'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
							'Last 7 Days': [moment().subtract(6, 'days'), moment()],
							'Last 30 Days': [moment().subtract(29, 'days'), moment()],
							'This Month': [moment().startOf('month'), moment().endOf('month')],
							'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
							'Last Year': [moment().subtract(1, 'year').startOf('month'), moment().subtract(1, 'month').endOf('month')]
						}
					}, function(start, end) {
						// omg, so hacky
						var stringEval = attrs.dateRange+"={start: "+start.toDate().getTime()+", end: "+end.toDate().getTime()+"};";
						$scope.$eval(stringEval)
					});
				}
			}
			
			$scope.$watch(attrs.dateRange, function(a, b) {
				if (a) {
					main.init(a);
				}
			}, true);
		}
	}]);
	
	window.app.directive('uiDropdown', function() {
		var component = function($scope, element, attrs) {
			
			
			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			
			$scope.showDropdown	= false;
			$scope.toggle	= function() {
				$scope.safeApply(function() {
					$scope.showDropdown = !$scope.showDropdown;
				});
			}
			
			$scope.type	= attrs.type||'uib';
			
			$scope.loading = true;
			
			$scope.placeholder		= attrs.placeholder || '(select one)';
			$scope.labelProperty	= attrs.labelProperty||'label';
			$scope.valueProperty	= attrs.valueProperty||'value';
			
			
			$scope.init = function() {
				
				/*console.log("#[uiDropdown] init()", {
					attrs:	attrs,
					$scope:	$scope
				});*/
				
				$scope.safeApply(function() {
					
					// Eval the list
					var list		= $scope.$parent.$eval(attrs.options);
					if (_.isFunction(list)) {
						list(function(response) {
							$scope.safeApply(function() {
								$scope.list		= response;
								$scope.loading	= false;
							});
						});
					} else {
						$scope.list		= list;
						$scope.loading	= false;
					}
					
					
					
				});
			};
			
			$scope.selected	= function() {
				//console.log("selected()",$scope.data[attrs.uiDropdown]);
				var defValue	= JSON.stringify($scope.data[attrs.uiDropdown]);
				var item	= _.find($scope.list, function(item) {
					return JSON.stringify(item[$scope.valueProperty])===defValue;
				});
				
				//console.log("#[dropdown] selected", item, $scope.data[attrs.uiDropdown]);
				
				if (!item) {
					return {
						label:	$scope.placeholder
					};
				}
				return item;
				//return item[$scope.labelProperty];
				
			}
			$scope.select	= function(item) {
				
				$scope.safeApply(function() {
					$scope.showDropdown = false;
				});
				
				if (item.select!==false) {
					return $scope.data[attrs.uiDropdown] = item[$scope.valueProperty];
				}
				
				if (item.onClick) {
					item.onClick($scope.data, item);
				}
			}
			
			
			$scope.$watch('data', function() {
				if ($scope.data) {
					$scope.init();
				}
			}, true);
			
			$scope.$watch('options', function() {
				if ($scope.options) {
					$scope.init();
				}
			}, true);
		}
		return {
			link: 			component,
			replace:		false,
			scope:			{
				data:		'=', // Data source: object
				options:	'='
			},
			templateUrl:	'app/directives/uic/dropdown.html'
		};
	});
	
	window.app.directive('circleMenu', function() {
		var component = function($scope, element, attrs) {
			
			
			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			
			$scope.ui = {
				visible:false,
				type:	attrs.type||"circle",
				radius:	parseInt(attrs.radius)||30,
				angle:	parseInt(attrs.angle)||60,
				start:	parseInt(attrs.start)||30,
				init:	function() {
					$(element).mouseenter(function() {
						//$(element).find('.child').
						$scope.safeApply(function() {
							$scope.ui.visible	= true;
						});
					}).mouseleave(function() {
						$scope.safeApply(function() {
							$scope.ui.visible	= false;
						});
					});
				},
				getPosition:	function(n) {
					if (!$scope.ui.visible) {
						return {
							x:	0,
							y:	0,
							a:	0
						}
					}
					switch ($scope.ui.type) {
						default:
						case "circle":
							var angle	= ($scope.ui.angle*n)+$scope.ui.start;
							return {
								x:	$scope.ui.radius * Math.cos((Math.PI/180)* angle),
								y:	$scope.ui.radius * Math.sin((Math.PI/180)* angle),
								a:	1
							}
						break;
					}
				}
			}
			
			$scope.$watch('circleMenu', function() {
				if ($scope.circleMenu) {
					$scope.ui.init();
				}
			}, true);
			
			
		}
		return {
			link: 			component,
			replace:		false,
			scope:			{
				circleMenu:		'=',
				data:			'='
			},
			templateUrl:	'app/directives/uic/circle-menu.html'
		};
	});
	
	
	
	window.app.directive('uiColor', function() {
		var component = function($scope, element, attrs) {
			
			
			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			
			$scope.ui = {
				id:			ftl.sid(),
				buffer:		'',
				hoverColor:	null,
				size:		15,
				visible:false,
				init:	function() {
					/*$scope.safeApply(function() {
						if (!$scope.uiColor || $scope.uiColor=='') {
							console.log("verwrite",$scope.uiColor);
							$scope.uiColor = '#0288D1';
						}
					});*/
				},
				getPreviewColor: function() {
					if ($scope.ui.hoverColor && $scope.ui.hoverColor.hex) {
						return $scope.ui.hoverColor.hex;
					}
					return $scope.uiColor;
				},
				toggle:	function() {
					$scope.safeApply(function() {
						$scope.ui.visible	= !$scope.ui.visible;
					});
				}
			}
			/*
			$scope.$watch('uiColor', function() {
				//if ($scope.uiColor) {
				$scope.ui.init();
				//}
			});
			*/
			
			window.Arbiter.subscribe('color.change', function(data) {
				//console.log("color change",data);
				if (data.id!=$scope.ui.id) {
					return false;	// Not for this component
				}
				$scope.safeApply(function() {
					$scope.uiColor		= '#'+data.color;
					$scope.ui.visible	= false;
				});
			});
			
		}
		return {
			link: 			component,
			replace:		false,
			scope:			{
				uiColor:		'='
			},
			templateUrl:	'app/directives/uic/color.html'
		};
	});
	
	
	window.app.directive('uiInput', ['$compile', '$timeout', function ($compile, $timeout) {
		var component = function($scope, element, attrs) {
			
			
			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			
			$scope.core		= window.ftl;
			
			$scope.ui = {};
			$scope.ui = {
				variableRegex:	'([a-zA-Z_]+[a-zA-Z0-9_]*)',
				id:		ftl.sid(),
				value:	'',
				set: function() {
					$scope.safeApply(function() {
						$scope.value	= $scope.ui.value;
					});
				},
				error:	function() {
					if ($scope.uiInput && $scope.uiInput.type=='variable') {
						var regex = /^([a-zA-Z_]+[a-zA-Z0-9_]*)$/
						if (!regex.test($scope.ui.value)) {
							// Invalid!
							return "Invalid variable name. [a-z0-9_] only, 1st char must be a [a-z].";
						}
					}
					return false;
				},
				setupUpload:	function() {
					$timeout(function() {
						$('#image-upload-'+$scope.ui.id).cloudinary_upload_widget({
							cloud_name:				'twenty-six-medias',
							upload_preset:			'basic_upload', 
							cropping:				false,
							folder:					'quant-studio-charts',
							multiple:				false,
							cropping_aspect_ratio:	1.2,
							cropping_default_selection_ratio: 1.2,
							min_image_width:		200,
							thumbnails:				'.thumb'
						}, function(error, result) {
							console.log(error, result)
							console.log("$scope",$scope);
							if (result && result.length>0) {
								$scope.safeApply(function() {
									$scope.ui.value = result[0].secure_url;
								});
							}
						});
					});
				}
			};
			
			
			// Env / Rights
			$scope.env = {
				edit:	false,
				buffer: '',
				list:	[],
				refresh:	function() {
					
					$scope.safeApply(function() {
						$scope.env.loading	= true;
					});
					$scope.core.api("/user/env", {
						
					}, function(response) {
						//console.log("/user/env response",response);
						$scope.safeApply(function() {
							$scope.env.list		= _.indexBy(response, function(item) {
								return item.name;
							});
							
							//console.log("$scope.env.list",$scope.env.list);
							$scope.env.loading	= false;
							
							if (!$scope.env.list[$scope.uiInput.name]) {
								// The env needed wasn't found
								$scope.safeApply(function() {
									$scope.env.edit	= true;
								});
							} else {
								$scope.safeApply(function() {
									$scope.env.edit		= false; // Suggest the value, but hide it
									$scope.ui.value	= $scope.env.list[$scope.uiInput.name].value;
								});
							}
						});
					});
				},
				getObfuscatedValue:	function() {
					if ($scope.env.list[$scope.uiInput.name] && $scope.env.list[$scope.uiInput.name].value) {
						var l = $scope.env.list[$scope.uiInput.name].value.length;
						var i;
						var output = '';
						for (i=0;i<l-4;i++) {
							output += '*';
						}
						output += $scope.env.list[$scope.uiInput.name].value.substr(l-4);
						var max = 14;
						if (output.length > max) {
							output = output.substr(output.length-max)
						}
						return output;
					} else {
						return 'None';
					}
				},
				editEnv:	function() {
					//console.log("editEnv()");
					$scope.safeApply(function() {
						$scope.env.edit	= true;
					});
				},
				saveEdit:	function() {
					$scope.safeApply(function() {
						// Save locally
						$scope.env.list[$scope.uiInput.name] = {
							name:	$scope.uiInput.name,
							value:	$scope.ui.value
						}
						//console.log("$scope.env.list",$scope.env.list);
						$scope.core.api("/user/setEnv", {
							name:	$scope.uiInput.name,
							value:	$scope.ui.value
						}, function(response) {
							// saved!
						});
						$scope.env.edit	= false;
					});
				},
			};
			
			$scope.$watch('value', function(a, b) {
				//console.log("on ValueChange",a,b);
				if ($scope.value || $scope.value===0) {
					//$scope.ui.value	= $scope.value;
					if ($scope.ui.value !== $scope.value) {
						$scope.ui.value = $scope.value;
					}
				}
			});
			
			$scope.$watch('uiInput', function() {
				$scope.safeApply(function() {
					if ($scope.uiInput && $scope.uiInput.type=='image') {
						$scope.ui.setupUpload();
					}
					if ($scope.uiInput && $scope.uiInput.type=='env') {
						$scope.env.refresh();
					}
				});
			});
			
			$scope.$watch('ui.value', function() {
				if ($scope.uiInput && $scope.ui && !_.isNull($scope.ui.value)) {
					$scope.value	= $scope.ui.value;
					if ($scope.uiInput && $scope.uiInput.onChange) {
						$scope.uiInput.onChange($scope.ui.value);
					}
				}
			});
			
		}
		return {
			link: 			component,
			replace:		false,
			scope:			{
				uiInput:		'=',
				value:			'='
			},
			templateUrl:	'app/directives/uic/input.html'
		};
	}]);
	
	
	
	window.app.directive('uiSwitch', function() {
		var component = function($scope, element, attrs) {
			
			
			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			
			$scope.display	= function() {
				if ($scope.uiSwitch[attrs.name]) {
					$(element).addClass('fa fa-toggle-on').removeClass('fa-toggle-off');
				} else {
					$(element).addClass('fa fa-toggle-off').removeClass('fa-toggle-on');
				}
			}
			$(element).css({
				cursor:	'pointer'
			}).on('click', function() {
				$scope.safeApply(function() {
					$scope.uiSwitch[attrs.name]	= !$scope.uiSwitch[attrs.name];
					$scope.display();
				});
			});
			
			$scope.$watch('uiSwitch', function() {
				if ($scope.uiSwitch) {
					$scope.display();
				}
			});
		}
		return {
			link: 			component,
			scope:			{
				uiSwitch:	'='
			}
		};
	});
	
	
	window.app.directive('uiCheckbox', function() {
		var component = function($scope, element, attrs) {
			
			
			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			
			var container	= $('<span></span>');
			var icon 		= $('<span class="fa fa-square"></span>');
			var label 		= $('<span> '+attrs.label+'</span>');
			container.append(icon);
			container.append(label);
			$(element).append(container);
			container.on('click', function() {
				$scope.safeApply(function() {
					$scope.uiCheckbox	= !$scope.uiCheckbox;
				});
			});
			
			$scope.$watch('uiCheckbox', function() {
				if ($scope.uiCheckbox) {
					icon.removeClass('fa-square').addClass('fa-check-square');
				} else {
					icon.removeClass('fa-check-square').addClass('fa-square');
				}
			});
		}
		return {
			link: 			component,
			scope:			{
				uiCheckbox:	'='
			}
		};
	});
	
	window.app.directive('uiTags', ['$compile', '$timeout', function ($compile, $timeout) {
		var component = function($scope, element, attrs, ctlr, transcludeFn) {
			
			
			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			$scope.ui = {};
			
			
			// UI
			var sid	= window.ftl.sid();
			
			$(element).on('click', function() {
				$(element).find('input').focus();
				setTimeout(function() {
					$scope.safeApply(function() {
						$scope.ui.showList = true;
					});
				}, 100);
			});
			/*$(document).on('click', function(e) {
				if (!$.contains($(element).get(0), $(e.target).get(0))) {
					$scope.safeApply(function() {
						$scope.ui.showList = false;
					});
				}
			})*/
			$(element).find('input').on('blur',function() {
				setTimeout(function() {
					$scope.safeApply(function() {
						$scope.ui.showList = false;
					});
				}, 250);
			});
			
			$scope.ui = {
				tags:		[],
				buffer:		'',
				showList:	false,
				init:	function() {
					$scope.safeApply(function() {
						$scope.ui.tags	= $scope.list;
					});
					
				},
				create:	function() {
					if ($scope.options && $scope.options.readonly) {
						return false;	// read-only, can't create
					}
					$scope.safeApply(function() {
						if (!$scope.uiTags) {
							$scope.uiTags = {};
						}
						$scope.uiTags[$scope.ui.buffer.trim().toLowerCase()] = {
							label:	$scope.ui.buffer.trim()
						};
						$scope.ui.buffer = '';
					});
				},
				add:	function(tag) {
					if ($scope.options && $scope.options.readonly) {
						return false;	// read-only, can't create
					}
					$scope.safeApply(function() {
						if (!$scope.uiTags) {
							$scope.uiTags = {};
						}
						$scope.uiTags[tag.label.trim().toLowerCase()] = {
							label:	tag.label.trim()
						};
						$scope.ui.buffer = '';
					});
				},
				select:	function(tag) {
					$scope.safeApply(function() {
						var exists	= _.find($scope.uiTags, function(item) {
							return item.id	== tag.id;
						});
						if (!$scope.uiTags) {
							$scope.uiTags = [];
						}
						if (!exists) {
							$scope.uiTags.push(tag);
						}
						$timeout(function() {
							$('.dropdown-'+sid).removeClass('active');
						});
					});
				},
				selected:	function(tag) {
					return !!_.find($scope.uiTags, function(item) {
						return item.id	== tag.id;
					});
				},
				remove:	function(tag) {
					//console.log("remove",tag);
					$scope.safeApply(function() {
						delete $scope.uiTags[tag.label.toLowerCase()];
					});
				},
				getInputWidth:	function() {
					return Math.min(150, $scope.ui.buffer.length*12);
				}
			};
			
			$scope.$watch('list', function() {
				if ($scope.list) {
					$scope.ui.init();
				}
			});
			
		}
		return {
			link: 			component,
			replace:		false,
			transclude:		false,
			scope:			{
				uiTags:		'=',
				list:		'='
			},
			templateUrl:	'app/directives/uic/tags.html'
		};
	}]);
	
	
	window.app.directive('uiDropdownAction', function() {
		var component = function($scope, element, attrs) {
			
			
			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			
			$scope.type	= 'action';
			
			$scope.$watch('uiDropdownAction', function() {
				if ($scope.uiDropdownAction) {
					
				}
			});
			
		}
		return {
			link: 			component,
			replace:		true,
			scope:			{
				uiDropdownAction:	'='	// Array of options {label,icon,onClick}
			},
			templateUrl:	'app/directives/uic/dropdown.html'
		};
	});
	
})(window);