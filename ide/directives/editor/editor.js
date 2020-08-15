(function(window) {
	window.app.directive('appEditor', ['$compile', '$timeout', function ($compile, $timeout) {
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
			
			var aceLoaded	= function(_editor) {
				console.log("aceLoaded", _editor);
				_editor.commands.addCommand({
					name: "save",
					bindKey: {win: "Ctrl-S", mac: "Command-S"},
					exec: function(editor) {
						console.log("ACE SAVE");
						window.ftl.editor.current.save();
						/*require("ace/config").loadModule("ace/ext/searchbox", function(e) {
							e.Search(editor, true)
							// take care of keybinding inside searchbox
							// this is too hacky :(
							var kb = editor.searchBox.$searchBarKb
							command = kb.commandKeyBinding["ctrl-h"]
							if (command && command.bindKey.indexOf("Ctrl-R") == -1) {
								command.bindKey += "|Ctrl-R"
								kb.addCommand(command)
							}
						});*/
					}
				});
			}
			
			$scope.main	= {
				loading:	false,
				data:		"",
				settings:	{
					mode:			'javascript',
					theme:			'twilight',
					useWrapMode:	true,
					showGutter:		false,
					highlighting:	true,
					onLoad: 		aceLoaded
				},
				init:		function() {
					
				},
				refresh:		function() {
					
					// Get the ext
					var ext	= window.ftl.data.settings.settings.file.split('.');
					ext	= ext[ext.length-1]
					
					// Is that something supported?
					var lang_settings;
					var lang_name;
					var i;
					for (i in window.ftl.data.settings.lang) {
						if (_.contains(window.ftl.data.settings.lang[i].ext, ext)) {
							lang_settings	= window.ftl.data.settings.lang[i];
							lang_name		= i;
							break;
						}
					};
					
					if (lang_name && lang_settings) {
						$scope.main.settings.mode	= lang_name;
					}
					
					if (window.ftl.data.cache[window.ftl.data.settings.settings.file]) {
						$scope.safeApply(function() {
							$scope.main.data	= window.ftl.data.cache[window.ftl.data.settings.settings.file];
						});
						return true;
					}
					$scope.safeApply(function() {
						$scope.main.loading	= true;
					});
					window.ftl.editor.open(window.ftl.data.settings.settings.file, function() {
						$scope.safeApply(function() {
							$scope.main.data	= window.ftl.data.cache[window.ftl.data.settings.settings.file];
						});
						$scope.safeApply(function() {
							$scope.main.loading	= false;
						});
					});
				}
			};
			
			
			
			$scope.$watch('core.data.settings.settings.file', function() {
				$scope.main.refresh();
			});
			
			var debounceITV;
			$scope.$watch('main.data', function() {
				clearInterval(debounceITV);
				debounceITV = setTimeout(function() {
					if ($scope.main.data) {
						window.ftl.data.cache[window.ftl.data.settings.settings.file] = $scope.main.data;
					}
				}, 500);
				
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
			templateUrl:	'directives/editor/editor.html'
		};
	}])
})(window);