angular.module('monthticket',[])
.controller("monthticketCtrl",["$scope","$location",function($scope,$location){
	$scope.title="ebusFree";

	$scope.monthlineData=[{key:1,value:"月票线路1"},{key:2,value:"月票线路2"}];
	$scope.monthticketData=[{key:1,value:"购当月月票(600元)"},{key:2,value:"购次月月票(600元)"}];

	document.title="购月票";
	
}]);