angular.module('BPM.messageDialog',['frameui'])
.config(['$provide',function($provide){
 $provide.decorator('$modal',['$delegate','$timeout','$window','$q',function($delegate,$timeout,$window,$q){
  //记录日志方法
  var iframeId="#iframe-box-mask";
  
  
  //iframe打开
  function iframeOpen(){
   /*if(angular.element(iframeId)&&angular.element(iframeId).length>0){
    angular.element(iframeId).show();
   }*/
  }
  //iframe关闭
  function iframeClose(){
   /*if(angular.element(iframeId)&&angular.element(iframeId).length>0){
    angular.element(iframeId).hide();
   }*/
  }
  
  //多少个弹出窗
  var dialogLength=0;
  var positionList=[];
  //移动窗口
  function dialogCanMove(length){
   var dialogLength=length;
   var isMove=false,//是否移动的状态
       X=0,Y=0; //移动起始的窗口位置
       //css的偏移量 top left right bottom
       //when many modal windows
       positionList[dialogLength-1]={};
    positionList[dialogLength-1].top=($window.innerHeight-angular.element('.modal-dialog').eq(dialogLength-1).innerHeight())/2,
    positionList[dialogLength-1].left=($window.innerWidth-angular.element('.modal-dialog').eq(dialogLength-1).innerWidth())/2,
    positionList[dialogLength-1].right=positionList[dialogLength-1].left,
    positionList[dialogLength-1].bottom=positionList[dialogLength-1].top;
   
   function setCss(e){
    positionList[dialogLength-1].bottom=positionList[dialogLength-1].bottom-(e.screenY-Y);
    positionList[dialogLength-1].right=positionList[dialogLength-1].right-(e.screenX-X);
    positionList[dialogLength-1].top=positionList[dialogLength-1].top+(e.screenY-Y);
    positionList[dialogLength-1].left=positionList[dialogLength-1].left+(e.screenX-X);    
    angular.element('.modal-dialog').eq(dialogLength-1).css({"height":angular.element('.modal-dialog').eq(dialogLength-1).innerHeight()+'px',
     "left": positionList[dialogLength-1].left+'px',
     "top": positionList[dialogLength-1].top+'px',
     "right":positionList[dialogLength-1].right+'px',
     "bottom":positionList[dialogLength-1].bottom+'px',
        "margin": "auto",
        "position": "absolute"
        });
    X=e.screenX;
    Y=e.screenY;
   }
   
   angular.element('.modal-header').eq(dialogLength-1).bind('mousedown',function(e){
    isMove=true;
    X=e.screenX;
    Y=e.screenY;
    e.preventDefault();
                e.stopPropagation();
   });
   angular.element('.modal').eq(dialogLength-1).bind('mouseup',function(e){
    if(isMove){
     isMove=false;
     setCss(e);
    }
    e.preventDefault();
                e.stopPropagation();
   });
   angular.element('.modal').eq(dialogLength-1).bind('mousemove',function(e){
    if(isMove){
     setCss(e);
    }
    e.preventDefault();
                e.stopPropagation();
   });
  }
  
  //设置居中
  function setCenter(length){
   //如果因为其他情况下，窗口关闭了导致length减少
   //var dialogLength=angular.element('.modal-dialog').length<length?angular.element('.modal-dialog').length:length;
   var dialogLength=length;
   if(angular.element('.modal-dialog').eq(dialogLength-1).length>0){
    angular.element('.modal-dialog').eq(dialogLength-1).css({"height":angular.element('.modal-dialog').eq(dialogLength-1).innerHeight()+'px',
        "bottom":0,
     "left": 0,
        "margin": "auto",
        "position": "absolute",
        "right": 0,
        "top": 0});
    //弹出窗里的IE的placeHolder
    if(!!window.JPlaceHolder){
     window.JPlaceHolder.init();
    }
   }else{
    $timeout(function(){
     setCenter(dialogLength);
    },200);
   }   
  }
  
  //设置可移动
  function setMove(length){
   //如果因为其他情况下，窗口关闭了导致length减少
   //var dialogLength=angular.element('.modal-dialog').length<length?angular.element('.modal-dialog').length:length;
   var dialogLength=length;
   if(angular.element('.modal-dialog').eq(dialogLength-1).length>0){
    dialogCanMove(dialogLength);
   }else{
    $timeout(function(){
     setMove(dialogLength);
    },250);
   }
  }
   
  var open=function(config){ 
   //默认禁止按钮事件
   var modalOptions = angular.extend({}, {keyboard: false}, config);
   iframeOpen();
   var modalInstance=$delegate.open(modalOptions);
   
   dialogLength++;
   setCenter(dialogLength);
   setMove(dialogLength);
   
//   modalInstance.opened.then(function(){
//    $timeout(function(){
//     dialogLength++;
//     setCenter(dialogLength);
//     setMove(dialogLength);
//    });
//   });  
   
   modalInstance.result.then(function(){
    if(dialogLength>0){
     dialogLength=dialogLength-1;
     //为了预防同时弹出很多窗口的时候，有些窗口没有居中显示
     if(angular.element('.modal-dialog').eq(dialogLength-1).css('position')!=="absolute"){
      setCenter(dialogLength)
     }     
    }
    if(dialogLength==0){
     iframeClose();
    }
   },function(){
    if(dialogLength>0){
     dialogLength=dialogLength-1;
     //为了预防同时弹出很多窗口的时候，有些窗口没有居中显示
     if(angular.element('.modal-dialog').eq(dialogLength-1).css('position')!=="absolute"){
      setCenter(dialogLength)
     }
    }
    if(dialogLength==0){
     iframeClose();
    }
   });
   return modalInstance;
  }
  
  
  //常规业务操作确认
  var confirmation = function (config) {
         var tempUrl = window.$getFrameUiTemplateUrl$(config||{}, config||{}, 'modal', 'confirmation');
         var modalInstance = open({
                                                 templateUrl: tempUrl,
                                                 dialogClass:config.dialogClass||"modal-md",
                                                 controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                                     $scope.title = config.title|| "业务确认";
                                                     $scope.message = config.message ;
                                                     $scope.mIsArray=angular.isArray(config.message);
                                                     $scope.moduleName=config.moduleName || "业务确认";
                                                     $scope.okName=config.okName||"确定";
                                                     $scope.cancelName=config.cancelName||"取消";
                                                     $scope.dialogClass="modal-md";
                                                     $scope.close = function () {
                                                         $modalInstance.close();
                                                         if(config.isClosePage){
                                                             window.CloseWebPage();
                                                            }
                                                     };
                                                     $scope.cancel = function () {
                                                         $modalInstance.dismiss();
                                                     };
                                                 }]
                                             });
             modalInstance.result.then(function () {
                 if(config.ok){//确定
                     config.ok();                    
                 }
             }, function () {//取消
                 if(config.cancel){
                     config.cancel();
                 }
             });
             return modalInstance;
  };
  //关键业务操作确认
  var confirWithCheck=function (config) {
         var tempUrl = window.$getFrameUiTemplateUrl$(config||{}, config||{}, 'modal', 'confirWithCheck');
         var modalInstance = open({
                   templateUrl: tempUrl,
                   dialogClass:config.dialogClass||"modal-md",
                   controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                       $scope.title = config.title||"业务确认";
                       $scope.message = config.message ;
                       $scope.mIsArray=angular.isArray(config.message);
                       $scope.check=config.check;
                       $scope.checkIsArray=angular.isArray(config.check);
                       $scope.moduleName=config.moduleName || "业务确认";
                       $scope.okName=config.okName||"确定";
                       $scope.cancelName=config.cancelName||"取消";
                       $scope.dialogClass="modal-md";
                       $scope.close = function () {
                           $modalInstance.close();
                       };
                       $scope.cancel = function () {
                           $modalInstance.dismiss();
                       };
                   }]
               });
      modalInstance.result.then(function () {
       if(config.ok){//确定
        config.ok();
       }
      }, function () {//取消
       if(config.cancel){
        config.cancel();
       }
      });
      return modalInstance;
  };
  //普通提示
  var message=function (config) {
         var tempUrl = window.$getFrameUiTemplateUrl$(config||{}, config||{}, 'modal', 'message');
         var modalInstance = open({
               dialogClass:config.dialogClass||"modal-md",
                                    templateUrl: tempUrl,
                                    controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                     $scope.title = config.title||"业务提示";
                                        $scope.message = config.message;
                                        $scope.mIsArray=angular.isArray(config.message);
                                        $scope.moduleName=config.moduleName || "业务提示" ;
                                        $scope.okName=config.okName||"关闭";
                                        $scope.close = function () {
                                            if(config.close) config.close();
                                            $modalInstance.close();
                                        };
                                    }]
                                });
         return modalInstance;
  };
  //错误提示
  var wrong=function (config) {
         var tempUrl = window.$getFrameUiTemplateUrl$(config||{}, config||{}, 'modal', 'wrong');
         var modalInstance = open({
                                                 templateUrl: tempUrl,
                                                 dialogClass:config.dialogClass||"modal-md",
                                                 controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                                  $scope.title = config.title||"错误提示";
                                                     $scope.message = config.message ;
                                                     $scope.mIsArray=angular.isArray(config.message);
                                                     $scope.moduleName=config.moduleName ||"错误提示" ;
                                                     $scope.okName=config.okName||"关闭";
                                                     $scope.close = function () {
                                                         if(config.close) config.close();
                                                            $modalInstance.close();
                                                     };
                                                 }]
                                             });
         return modalInstance;
  };
  //异常提示
  var exception=function (config) {
         var tempUrl = window.$getFrameUiTemplateUrl$(config||{}, config||{}, 'modal', 'exception');
         var modalInstance = open({
                                                 templateUrl: tempUrl,
                                                 dialogClass:config.dialogClass||"modal-md",
                                                 controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                                  $scope.title = config.title||"异常提示";
                                                     $scope.message = config.message ;
                                                     $scope.mIsArray=angular.isArray(config.message);
                                                     $scope.moduleName=config.moduleName || "异常提示";
                                                     $scope.okName=config.okName||"关闭";
                                                     $scope.close = function () {
                                                         if(config.close) config.close();
                                                            $modalInstance.close();
                                                     };
                                                 }]
                                             });
         return modalInstance;
  };
  //成功提示
  //isClosePage 是否关闭浏览器页面
  var success=function (config) {
         var tempUrl = window.$getFrameUiTemplateUrl$(config||{}, config||{}, 'modal', 'success');
         //倒数的格式
         function countdown(number){
          if(number==undefined || number==0){
           return "";
          }
          return "("+number/1000.0+")";
         }
         
         var modalInstance = open({
                                                 templateUrl: tempUrl,
                                                 dialogClass:config.dialogClass||"modal-md",
                                                 controller: ['$scope', '$modalInstance','$timeout', function ($scope, $modalInstance,$timeout) {
                                                  $scope.title = config.title;
                                                     $scope.message = config.message;
                                                     $scope.mIsArray=angular.isArray(config.message);
                                                     $scope.moduleName=config.moduleName ||"成功提示" ;
                                                     $scope.okName=config.okName||"关闭";
                                                     $scope.isClosePage=config.isClosePage;
                                                     $scope.stayName=config.stayName||"留在本页";
                                                     $scope.close = function () {
                                                         if(config.close) config.close();
                                                            $modalInstance.close();
                                                            if(config.isClosePage){
                                                             window.CloseWebPage();
                                                            }                                                                                                                     
                                                     };
                                                     
                                                     
                                                     var delay=config.delay||3000;
                                                     $scope.countdown=countdown(delay);
                                                     function countDelay(){
                                                      delay=delay-1000;
                                                      if(delay<0){
                                                       return;                                                       
                                                      }
                                                      $scope.countdown=countdown(delay);                     
                                                      $timeout(countDelay,1000)
                                                     }
                                                     $timeout(countDelay,1000);                                                
                                                     
                                                     //3秒后自动关闭
                                            var closeHandle=$timeout(function(){
                                             if(config.close) config.close();
                                                   $modalInstance.close();
                                                   if(config.isClosePage){
                                                          window.CloseWebPage();
                                                         }  
                                            },delay);
                                            
                                            //留在本页面
                                                     $scope.stay=function(){
                                                      $timeout.cancel(closeHandle);
                                                      if(config.stay) config.stay();
                                                            $modalInstance.close();                                                            
                                                     }
                                                     
                                                 }]
                                             });  
         return modalInstance;         
  };
  //成功提示
  var isuccess=function (config) {
         var tempUrl = window.$getFrameUiTemplateUrl$(config||{}, config||{}, 'modal', 'isuccess');
         var modalInstance = open({
                                                 templateUrl: tempUrl,
                                                 dialogClass:config.dialogClass||"modal-xs",
                                                 controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                                     $scope.title = config.title;                                                   
                                                     $scope.close = function () {
                                                         if(config.close) config.close();
                                                            $modalInstance.close();
                                                     };
                                                 }]
                                             });
         //3秒后自动关闭
   $timeout(function(){
    if(config.close) config.close();
          modalInstance.close();
   },config.delay||3000);
   return modalInstance;
  };
  //加载
  var loading=function(config){
   var tempUrl = window.$getFrameUiTemplateUrl$(config||{}, config||{}, 'modal', 'loading');
   var modalInstance=open({
                templateUrl: tempUrl,
                dialogClass:"loading-wrap",
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.message = config.message||'处理中...';
                }]
            });
   return modalInstance;
  };
  return {
   open:open,
   confirmation : confirmation,
   confirWithCheck :confirWithCheck,
   message:message,
   wrong:wrong,
   exception:exception,
   success:success,
   isuccess:isuccess,
   loading:loading
  };
 }]);
}]);