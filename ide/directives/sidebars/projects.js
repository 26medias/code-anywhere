(function(window) {
	window.app.directive('appProjectList', ['$compile', '$timeout', function ($compile, $timeout) {
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
			var tokens = {};
			
			$scope.tabs	= {
				selected:	false,
				select:		function(id) {
					$scope.safeApply(function() {
						$scope.tabs.selected	= id;
						
					});
				},
				is:		function(id) {
					return $scope.tabs.selected	== id;
				}
			};
			$scope.tabs.select('list');
			
			
			
			$scope.main	= {
				loading:	false,
				data:		{},
				init:		function() {
					
				},
				open:	function(pid) {
					console.log("open", pid);
					window.ftl.editor.openProject(pid);
				},
				create:	function() {
					if (!$scope.main.form || !$scope.main.form.name || !$scope.main.form.directory) {
						return false;
					}
					$scope.safeApply(function() {
						$scope.main.loading	= true;
					});
					window.ftl.apicall({
						url:		'/api/projects/create',
						params:		{
							name:		$scope.main.form.name,
							directory:	$scope.main.form.directory
						},
						callback:	function(response) {
							// Reload the settings
							window.ftl.data.getSettings(function() {
								$scope.safeApply(function() {
									$scope.main.loading	= false;
								});
								$scope.tabs.select('list');
							});
						}
					});
				}
			};
			
			$scope.main.init();
			
			$scope.$on('$destroy', function() {
				_.each(tokens, function(v,k) {
					window.Arbiter.unsubscribe(v);
				})
			});
		}
		return {
			link: 			component,
			replace:		false,
			transclude:		false,
			scope:			{
				
			},
			templateUrl:	'directives/sidebars/projects.html'
		};
	}])
})(window);