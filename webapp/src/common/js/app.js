angular.module('webapp',[
	'ngRoute',
	'frameui',
	'BPM.messageDialog'
	])
.config(['$routeProvider','$httpProvider',function($routeProvider,$httpProvider){
	$routeProvider
		.when('/:website',{
			/*templateUrl:'module/website/views/index.html',
			controller:['$scope','baseController','$route',function($scope,baseController,$route){
							var moduleName=$route.current.params.website+'/list';
							var base=new baseController(moduleName,'website',$scope);
							base.createCRUDPage();
						}]*/
			templateUrl:'module/home/views/index.html'
		})
		.otherwise({
			templateUrl:'module/home/views/index.html'
		});
}]);