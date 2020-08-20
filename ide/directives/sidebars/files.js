(function(window) {
	window.app.directive('appProjectFiles', ['$compile', '$timeout', function ($compile, $timeout) {
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
					$scope.main.refresh();
				},
				refresh:		function() {
					$scope.safeApply(function() {
						$scope.main.loading	= true;
					});
					window.ftl.apicall({
						url:		'/api/projects/files',
						params:		{
							project:	window.ftl.data.settings.settings.project
						},
						callback:	function(response) {
							//console.log("/api/settings/files response",response);
							$scope.safeApply(function() {
								$scope.main.loading	= false;
								$timeout(function() {
									$(element).find('.tree').jstree({
										'core' : {
											'data' : response
										}
									});
									$(element).find('.tree').on('select_node.jstree', function(node, selected, event) {
										if (selected.node.data && selected.node.data.type=='file') {
											window.ftl.editor.open(selected.node.id);
										}
									}).on('after_open.jstree', function(node, selected, event) {
										window.ftl.data.filetree.changeState('open', selected.node.id);
									}).on('after_close.jstree', function(node, selected, event) {
										window.ftl.data.filetree.changeState('close', selected.node.id);
									}).on('select_node.jstree', function(node, selected, event) {
										window.ftl.data.filetree.changeState('select', selected.node.id);
									});
								});
							});
						}
					});
				},
				open:	function(pid) {
					//console.log("open", pid);
					window.ftl.data.settings.settings.project	= pid;
				}
			};
			
			$scope.main.init();
			
			window.Arbiter.subscribe('file.tree.reload', function() {
				$scope.main.refresh();
			});
			
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
			templateUrl:	'directives/sidebars/files.html'
		};
	}])
})(window);