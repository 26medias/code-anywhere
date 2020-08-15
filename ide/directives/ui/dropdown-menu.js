(function(window) {
	window.app.directive('uiDropdownMenu', ['$compile', '$timeout', function ($compile, $timeout) {
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
					$scope.label	= attrs.label;
					$scope.icon		= attrs.icon;
					$scope.align	= attrs.align||'left';
				},
				onSelect:	function(item) {
					if (item.value) {
						$scope.selected	= item.value;
					}
					if (item.action) {
						item.action();
					}
				},
				getLabel:	function(value) {
					
				}
			};
			
			
			$timeout(function() {
				$scope.main.init();
			});
			
			$scope.$watch('uiDropdownMenu', function() {
				if ($scope.uiDropdownMenu) {
					$scope.main.init();
				}
			}, true);
			
			$scope.$watch('selected', function() {
				if ($scope.selected && $scope.uiDropdownMenu) {
					$scope.main.selectedLabel	= _.find($scope.uiDropdownMenu, function(item) {
						return item.value == $scope.selected;
					});
					if ($scope.main.selectedLabel) {
						$scope.main.selectedLabel = $scope.main.selectedLabel.label;
					}
				} else {
					$scope.main.selectedLabel	= 'none';
				}
			});
			
			$scope.$on('$destroy', function() {
				
			});
		}
		return {
			replace:		true,
			link: 			component,
			scope:			{
				uiDropdownMenu:	'=',
				selected:		'='
			},
			templateUrl:	'app/directives/ui/dropdown-menu.html'
		};
	}]);
})(window);