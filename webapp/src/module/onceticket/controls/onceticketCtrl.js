angular.module('onceticket',[])
.controller("onceticketCtrl",["$scope","$location",function($scope,$location){
	$scope.title="ebusFree";

	$scope.oncelineData=[{key:1,value:"单程票线路1"},{key:2,value:"单程票线路2"}];
	$scope.onceCountBusData=[{key:1,value:"单程票10车次"},{key:2,value:"单程票20车次"}];
	$scope.onceCountPerData=[{key:1,value:"1人（20元/人次）"},{key:2,value:"2人（20元/人次）"}];

	document.title="购单程票";
}]);