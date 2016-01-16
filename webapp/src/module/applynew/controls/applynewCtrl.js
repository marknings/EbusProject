angular.module('applynew',[])
.controller("applynewCtrl",['$scope','$location',function($scope,$location){

	$scope.monthClick=function(){
		$location.path("monthticket");
	};

	document.title="申请新线路";
}]);