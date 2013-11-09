'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers', 'ngRoute'])
	.config(['$routeProvider', function($routeProvider) {
				$routeProvider.when('/inspect', {templateUrl: 'partials/inspect.html'});
				$routeProvider.when('/analysis', {templateUrl: 'partials/analysis.html'});
        $routeProvider.when('/diff', {templateUrl: 'partials/diff.html'});
        $routeProvider.when('/regression', {templateUrl: 'partials/regression.html'});
	    	$routeProvider.when('/tltest', {controller: 'SelectListCtrl', templateUrl: 'partials/tltest.html'});
        $routeProvider.otherwise({redirectTo: '/'});
    }]);
