(function(window) {
	window.app.directive('appLayout', ['$compile', '$timeout', '$mdSidenav', function ($compile, $timeout, $mdSidenav) {
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
			
			$scope.dialog	= window.dialog;
			$scope.core		= window.ftl;
			
			// Auth
			$scope.auth		= window.ftl.auth;
			
			var refreshClock	= setInterval(function() {
				$scope.safeApply(function() {});
			}, 1000);
			
			
			$scope.tabs	= {
				selected:	'',
				select:		function(id) {
					$scope.safeApply(function() {
						window.ftl.data.settings.settings.file	= id;
					});
				},
				is:		function(id) {
					return window.ftl.data.settings.settings.file	== id;
				}
			};
			
			var menu_ids = {};
			$scope.main = {
				branches:	{},
				maximized:	false,
				init:	function() {
					$scope.safeApply(function() {
						$scope.main.loading	= true;
					});
					window.ftl.data.getSettings(function() {
						$scope.safeApply(function() {
							$scope.main.loading	= false;
						});
					});
					
					hotkeys('ctrl+s', function (event, handler){
						console.log("Save!");
						window.ftl.editor.current.save();
						event.stopPropagation();
						event.preventDefault();
					});
				},
				// API call to the local FTL server (use gatekeeper for calls to the outside)
				api:	function(endpoint, params, callback) {
					if (!callback) {
						callback	= function() {};
					}
					window.ftl.apicall({
						url:		endpoint,
						auth:		true,
						encrypt:	true,
						headers:	{},
						params:		JSON.parse(angular.toJson(params)),
						callback:	callback
					});
				}
			};
			
			$scope.resize = function() {
				//window.ftl.contentHeight	= winHeight;
				
				var winHeight			= parseInt($(window).height());
				var appHeaderHeight		= parseInt($('.app-header').outerHeight());
				
				// Height of the sidebar
				window.ftl.contentHeight	= winHeight-appHeaderHeight;
				
				// Project Height (height minus tabs) but not including toolbar
				var projectTabs = $('#projects-tabs');
				if (projectTabs && projectTabs.outerHeight()) {
					window.ftl.projectHeight	= Math.ceil(window.ftl.contentHeight-projectTabs.outerHeight());
				}
				
				// Project InnerHeight
				/*var projectToolbar = $('#project-toolbar');
				if (projectToolbar && projectToolbar.outerHeight()) {
					window.ftl.projectInnerHeight	= Math.ceil(window.ftl.projectHeight-projectToolbar.outerHeight())-3;
				}*/
			}
			$(window).on('resize', function() {
				$scope.resize();
			});
			$(window).on('orientationchange', function() {
				$scope.resize();
			});
			var resizeITV = setInterval(function() {
				$scope.resize();
			}, 250);
			
			$timeout(function() {
				$scope.main.init();
			});
			
			
			var settingsSaveDebounce;
			$scope.$watch('core.data.settings', function() {
				clearInterval(settingsSaveDebounce);
				settingsSaveDebounce = setTimeout(function() {
					window.ftl.data.saveSettings(function() {
						//console.log("Settings saved");
					});
				}, 1000);
			}, true);
			
			
			window.Arbiter.subscribe('file.save.start', function() {
				console.log("file.save.start");
				$scope.safeApply(function() {
					$scope.main.file_loading	= true;
				});
			});
			window.Arbiter.subscribe('file.save.end', function() {
				console.log("file.save.end");
				$scope.safeApply(function() {
					$scope.main.file_loading	= false;
				});
			});
			
			$scope.$on('$destroy', function() {
				clearInterval(refreshClock);
				clearInterval(resizeITV);
			});
		}
		return {
			link: 			component,
			scope:			{},
			templateUrl:	'app/layout.html'
		};
	}]);
})(window);