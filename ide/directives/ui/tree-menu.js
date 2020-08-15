(function(window) {
	window.app.directive('uiTreeMenu', ['$compile', '$timeout', function ($compile, $timeout) {
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
			
			$scope.core		= window.ftl;
			
			$scope.main = {
				init:	function() {
					if (!$scope.settings) {
						$scope.settings = {
							value:	'filename'
						}
					}
					$scope.label	= attrs.label;
					$scope.icon		= attrs.icon;
					var output		= $scope.main.parse($scope.uiTreeMenu);
					output			= '<ul class="menu-container">'+output+'</ul>';
					output 			= $compile(output)($scope);
					$(element).find('.menu-container').replaceWith(output);
				},
				parse:	function(obj) {
					if (!$scope.settings.value) {
						return false;
					}
					var html = '';
					for (var i in obj) {
						if (typeof obj[i].name && obj[i][$scope.settings.value]) {
							if ($scope.settings.droppable) {
								html = html+'<li class="item" '+$scope.settings.value+'="'+obj[i][$scope.settings.value]+'"  ng-drop-create="{type:\''+$scope.settings.dropName+'\', '+$scope.settings.value+':\''+obj[i][$scope.settings.value].replace(/\\/gmi,'\\\\')+'\'}" ng-drop-class="component-drop">\n<a>'+obj[i].name+'</a>\n</li>\n';
							} else {
								html = html+'<li class="item" '+$scope.settings.value+'="'+obj[i][$scope.settings.value]+'" ng-click="onSelect('+obj[i][$scope.settings.value]+')">\n<a>'+obj[i].name+'</a>\n</li>\n';
							}
						} else {
							html = html+'<li class="submenu">\n<a>'+i+'</a>\n<ul class="sublevel">\n<li class="sub-level-container">\n'+$scope.main.parse(obj[i])+'\n</li>\n</ul>\n</li>\n';
						}
					}
					return html;
				}
			};
			
			
			$timeout(function() {
				$scope.main.init();
			});
			
			/*$scope.$watch('uiTreeMenu', function() {
				if ($scope.settings && $scope.uiTreeMenu) {
					console.log("$scope.uiTreeMenu",$scope.uiTreeMenu);
					$scope.main.init();
				}
			}, true);*/
			$scope.$watch('settings', function() {
				//console.log("$scope.settings",$scope.settings);
				/*if ($scope.settings && $scope.uiTreeMenu) {
					console.log("$scope.settings",$scope.settings);
					$scope.main.init();
				}*/
			}, true);
			$scope.$on('$destroy', function() {
				
			});
		}
		return {
			replace:		true,
			link: 			component,
			scope:			{
				uiTreeMenu:	'=',
				onSelect:	'=',
				settings:	'='
			},
			templateUrl:	'app/directives/ui/tree-menu.html'
		};
	}]);
})(window);