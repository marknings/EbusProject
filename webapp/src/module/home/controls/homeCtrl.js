angular.module('home',[])
.controller("homeCtrl",['$scope','$location',function($scope,$location){

	$scope.monthClick=function(){
		$location.path("applynew");
	};

	document.title="爱心楼巴";
}]);