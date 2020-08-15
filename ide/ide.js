(function () {
	'use strict';
	
	window.app = angular.module('app', ['ngAnimate','ngMaterial','ui.ace']);
	
	window.app.config(['$mdThemingProvider', function ($mdThemingProvider) {
		
		$mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('blue-grey').warnPalette('amber').backgroundPalette('blue-grey',{'default': '900'}).dark();
		//console.log("THEME",$mdThemingProvider.theme('default'));
		//$mdIconProvider.defaultFontSet('FontAwesome').fontSet('fa', 'FontAwesome');
		
		window.ftl.page	= 'projects';
		
	}]);
	
})();