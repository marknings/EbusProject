angular.module("frameui",['frameui.dialog.modal','frameui.bootstrap.pagination']);
angular.module('frameui.dialog.modal',[])
/**
* A helper,elements in the LIFO order
*/
.factory('$$stackedMap',function(){
	return{
		createNew:function(){
			var stack=[];
			return {
				add:function(key,value){
					stack.push({
							key:key,
							value:value
					})
				},
				get:function(key){
					for(var i=0;i<stack.length;i++){
						if(key==stack[i].key){
							return stack[i];
						}
					}
				},
				keys:function(){
					var keys=[];
					for(var i=0;i<stack.length;i++){
						keys.push(stack[i].key);
					}
					return keys;
				},
				top:function(){
					return stack[stack.length-1];
				},
				remove:function(key){
					var idx=-1;
					for(var i=0;i<stack.length;i++){
						if(key==stack[i].key){
							idx=i;
							break;
						}
					}
					return stack.splice(idx,1)[0];
				},
				removeTop:function(){
					return stack.splice(stack.length-1,1)[0];
				},
				length:function(){
					return stack.length;
				}
			};
		}
	}
})

.factory('$modalStack',['$document','$compile','$rootScope','$$stackedMap',
	function($document,$compile,$rootScope,$$stackedMap){
		var backdropjqLiteEl,backdropDomEl;
		var backdropScope=$rootScope.$new(true);
		var body=$document.find('body').eq(0);
		var openedWindows=$$stackedMap.createNew();
		var $modalStack={};

		function backdropIndex(){
			var topBackdropIndex=-1;
			var opened=openedWindows.keys();
			for(var i=0;i<opened.length;i++){
				if(openedWindows.get(opened[i]).value.backdrop){
					topBackdropIndex=i;
				}
			}
			return topBackdropIndex;
		}

		$rootScope.$watch(backdropIndex,function(newBackdropIndex){
			backdropScope.index=newBackdropIndex;
		});

		function removeModalWindow(modalInstance){
			var modalWindow=openedWindows.get(modalInstance).value;

			//clean up the stack
			openedWindows.remove(modalInstance);

			//remove window Dom element
			modalWindow.modalDomEl.remove();

			//remove backdrop if no longer needed
			if(backdropDomEl&& backdropIndex()==-1){
				backdropDomEl.remove();
				backdropDomEl=undefined;
			}

			//destroy scope
			modalWindow.modalScope.$destroy();
		}

		$document.bind('keydown',function(evt){
			var modal;

			if(evt.which==27){
				modal=openedWindows.top();
				if(modal && modal.value.keyboard){
					$rootScope.$apply(function(){
						$modalStack.dismiss(modal.key);
					});
				}
			}
		});

		$modalStack.open=function(modalInstance,modal){
			openedWindows.add(modalInstance,{
				deferred:modal.deferred,
				modalScope:modal.scope,
				backdrop:modal.backdrop,
				keyboard:modal.keyboard
			});

			var angularDomEl=angular.element('<div modal-window></div>');
			angularDomEl.attr('window-class',modal.windowClass);
			angularDomEl.attr('dialog-class',modal.dialogClass);

			angularDomEl.attr('index',openedWindows.length()-1);
			angularDomEl.html(modal.content);

			var modalDomEl=$compile(angularDomEl)(modal.scope);
			openedWindows.top().value.modalDomEl=modalDomEl;
			body.append(modalDomEl);

			if(backdropIndex()>=0 && !backdropDomEl){
				backdropjqLiteEl=angular.element('<div modal-backdrop></div>');
				backdropDomEl=$compile(backdropjqLiteEl)(backdropScope);
				body.append(backdropDomEl);
			}
		};

		$modalStack.close=function(modalInstance,result){
			var modal=openedWindows.get(modalInstance);
			if(modal){
				modal.value.deferred.resolve(result);
				removeModalWindow(modalInstance);
			}
		};

		$modalStack.dismiss=function(modalInstance,reason){
			var modalWindow=openedWindows.get(modalInstance).value;
			if(modalWindow){
				modalWindow.deferred.reject(reason);
				removeModalWindow(modalInstance);
			}
		};

		$modalStack.getTop=function(){
			return openedWindows.top();
		};

		return $modalStack;
	}])

/*
*A helper directive for the $modal service,It creates a backdrop element.
*/
.directive('modalBackdrop',['$modalStack','$timeout',function($modalStack,$timeout){
	return{
		restrict:'EA',
		replace:true,
		//templateUrl:
		templateUrl:function(tElement,tAttrs){
			return window.$getFrameUiTemplateUrl$(tElement,tAttrs,'modal','backdrop');
		},
		link:function(scope,element,attrs){

			//trigger CSS transitions
			$timeout(function(){
				scope.animate=true;
			});

			scope.close=function(evt){
				var modal=$modalStack.getTop();
				if(modal && modal.value.backdrop && modal.value.backdrop != 'static'){
					evt.preventDefault();
					evt.stopPropagation();
					$modalStack.dismiss(modal.key,'backdrop click');
				}
			}
		}
	}
}])
.directive('modalWindow',['$timeout',function($timeout){
	return{
		restrict:'EA',
		scope:{
			index:'@'
		},
		replace:true,
		transclude:true,
		//templateUrl:'template/modal/window.html',
		templateUrl:function(tElement,tAttrs){
			return window.$getFrameUiTemplateUrl$(tElement,tAttrs,'modal','window');
		},
		link:function(scope,element,attrs){
			scope.windowClass=attrs.windowClass||'';
			scope.dialogClass=attrs.dialogClass||'';

			//trigger CSS transitions
			$timeout(function(){
				scope.animate=true;
			});

			if(window.top!=window.self){
				var scrollTopMessage=function(e){
					if(!/^scrollTop/.test(e.data)){
						return;
					}
					var match=e.data.match(/^scrollTop\s+(.+)$/);
					if(!match||match.length!==2){return;}
					var scrollTop=angular.formJson(match[1]);
					element.css(scrollTop);
				};
				window.addEventListener('message',scrollTopMessage,false);
				window.top.postMessage('resendScrollTop','*');
				scope.$on('$destroy',function(){
					window.removeEventListener('message',scrollTopMessage);
				});
			}
		}
	};
}])
.provider('$modal',function(){
	var $modalProvider={
		options:{
			backdrop:true,
			keyboard:true
		},
		$get:['$injector','$rootScope','$q','$http','$templateCache','$controller','$modalStack',
			function($injector,$rootScope,$q,$http,$templateCache,$controller,$modalStack){
				var $modal={};

				function getTemplatePromise(options){
					return options.template? $q.when(options.template):
					$http.get(options.templateUrl,{cache:$templateCache}).then(function(result){
						return result.data;
					});
				}

				function getResolvePromises(resolve){
					var promisesArr=[];
					angular.forEach(resolve,function(value,key){
						if(angular.isFunction(value)||angular.isArray(value)){
							promisesArr.push($q.when($injector.invoke(value)));
						}
					});
					return promisesArr;
				}

				$modal.open=function(modalOptions){
					var modalResultDefferred=$q.defer();
					var modalOpenedDefferred=$q.defer();

					var modalInstance={
						result:modalResultDefferred.promise,
						opened:modalOpenedDefferred.promise,
						close:function(result){
							$modalStack.close(modalInstance,result);
						},
						dismiss:function(reason){
							$modalStack.dismiss(modalInstance,reason);
						}
					};

					modalOptions=angular.extend({},$modalProvider.options,modalOptions);
					modalOptions.resolve=modalOptions.resolve||{};

					if(!modalOptions.template && !modalOptions.templateUrl){
						throw new Error('One of template or templateUrl options is required.');
					}

					var templateAndResolvePromise=
						$q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));

					templateAndResolvePromise.then(function resolveSuccess(tplAndVars){
						var modalScope=(modalOptions.scope||$rootScope).$new();
						modalScope.$close=modalInstance.close;
						modalScope.$dismiss=modalInstance.dismiss;

						var ctrlInstance,ctrlLocals={};
						var resolveIter=1;

						//controllers
						if(modalOptions.controller){
							ctrlLocals.$scope=modalScope;
							ctrlLocals.$modalInstance=modalInstance;
							angular.forEach(modalOptions.resolve,function(value,key){
								ctrlLocals[key]=tplAndVars[resolveIter++];
							});
							ctrlInstance=$controller(modalOptions.controller,ctrlLocals);
						}
						$modalStack.open(modalInstance,{
							scope:modalScope,
							deferred:modalResultDefferred,
							content:tplAndVars[0],
							backdrop:modalOptions.backdrop,
							keyboard:modalOptions.keyboard,
							windowClass:modalOptions.windowClass,
							dialogClass:modalOptions.dialogClass
						});
					},function resolveError(reason){
						modalResultDefferred.reject(reason);
					});
					
					templateAndResolvePromise.then(function(){
						modalOpenedDefferred.resolve(true);
					},function(){
						modalOpenedDefferred.reject(false);
					});

					return modalInstance;
				};

				$modal.message=function(config){
						console.logl('message');
						$modal.open({
						templateUrl:function(){
							return window.$getFrameUiTemplateUrl$("","",'modal','message');
						},
						controller:['$scope',function($scope){
							$scope.message=config.message;
						}]});
				}
				return $modal;
			}]
	};
	return $modalProvider;
});

/*
* pagination 分页控件
*/

angular.module('frameui.bootstrap.pagination',[])
.controller('PaginationController',['$scope','$attrs','$parse','$interpolate',function($scope,$attrs,$parse,$interpolate){
	var self=this,
		setNumPages=$attrs.numPages? $parse($attrs.numPages).assign:angular.noop;

		this.init=function(defaultItemsPerPage){
			if($attrs.itemsPerPage){
				$scope.$parent.$watch($parse($attrs.itemsPerPage),function(value){
					self.itemsPerPage=parseInt(value,10);
					$scope.totalPages=self.calculateTotalPages();
				});
			}else{
				this.itemsPerPage=defaultItemsPerPage;
			}
		};

		this.noPrevious=function(){
			return this.page===1;
		};

		this.noNext=function(){
			return this.page===$scope.totalPages;
		};

		this.isActive=function(page){
			return this.page==page;
		}

		this.calculateTotalPages=function(){
			var totalPages=this.itemsPerPage<1?1:Math.ceil($scope.totalItems/this.itemsPerPage);
			return Math.max(totalPages || 0,1);
		};

		this.getAttributeValue=function(attribute,defaultValue,interpolate){
			return angular.isDefined(attribute)?(interpolate? $interpolate(attribute)($scope.$parent): $scope.$parent.$eval(attribute)):defaultValue;
		};

		this.render=function(){
			this.page=parseInt($scope.page,10)||1;
			if(this.page>0 && this.page<= $scope.totalPages){
				$scope.pages=this.getPages(this.page,$scope.totalPages);
			}
		};

		$scope.goPageNumber="";
		$scope.$watch("goPageNumber",function(){
			if($scope.goPageNumber==null || $scope.goPageNumber==""){
				$scope.PageNumberError=false;
				return;
			}

			if(/^\d*$/.test($scope.goPageNumber)){
				if($scope.goPageNumber*1>0 && $scope.goPageNumber*1<=$scope.totalPages*1){
					$scope.PageNumberError=false;
				}else{
					$scope.PageNumberError=true;
				}
			}else{
				$scope.PageNumberError=true;
			}
		});

		$scope.selectPage=function(page){
			// if(!self.isActive(page) && page>0 && page<=$scope.totalPages && /^\d*$/.test(page)){
			if(!self.isActive(page) && page>0 && page<=$scope.totalPages){
				$scope.page=page;
				$scope.onSelectPage({page:page});
			}
		}

		$scope.$watch('page',function(){
			self.render();
		});

		$scope.$watch('totalItems',function(){
			$scope.totalPages=self.calculateTotalPages();
		});

		$scope.$watch('totalPages',function(value){
			setNumPages($scope.$parent,value);

			if(self.page>value){

			}else{
				self.render();
			}
		});
}])

.constant('paginationConfig',{
	itemsPerPage:10,
	boundaryLinks:false,
	directionLinks:true,
	firstText:'First',
	previousText:'Previous',
	nextText:'Next',
	lastText:'Last',
	rotate:true,
	goInput:true
})
.directive('pagination',['$parse','paginationConfig',function($parse,config){
	return{
		restrict:'EA',
		scope:{
			page:'=',
			totalItems:'=',
			onSelectPage:'&'
		},
		controller:'PaginationController',
		templateUrl:function(tElement,tAttrs){
			return window.$getFrameUiTemplateUrl$(tElement,tAttrs,'pagination','pagination');
		},
		replace:true,
		link:function(scope,element,attrs,paginationCtrl){
			var maxSize,
				boundaryLinks=paginationCtrl.getAttributeValue(attrs.boundaryLinks,config.boundaryLinks),
				directionLinks=paginationCtrl.getAttributeValue(attrs.directionLinks,config.directionLinks),
				goInput=paginationCtrl.getAttributeValue(attrs.goInput,config.goInput),

				firstText=paginationCtrl.getAttributeValue(attrs.firstText,config.firstText,true),
				previousText=paginationCtrl.getAttributeValue(attrs.previousText,config.previousText,true),
				nextText=paginationCtrl.getAttributeValue(attrs.nextText,config.nextText,true),
				lastText=paginationCtrl.getAttributeValue(attrs.lastText,config.lastText,true),
				rotate=paginationCtrl.getAttributeValue(attrs.rotate,config.rotate,true);

				paginationCtrl.init(config.itemsPerPage);

				scope.goInput=goInput;

				if(attrs.maxSize){
					scope.$parent.$watch($parse(attrs.maxSize),function(value){
						maxSize=parseInt(value,10);
						paginationCtrl.render();
					});
				}

				//Create page object used in template
				function makePage(number,text,isActive,isDisabled){
					return {
						number:number,
						text:text,
						active:isActive,
						disabled:isDisabled
					};
				}

				paginationCtrl.getPages=function(currentPage,totalPages){
					var pages=[];

					//Default page limits
					var startPage=1, endPage=totalPages;
					var isMaxSized=(angular.isDefined(maxSize) && maxSize<totalPages);

					//recompute if maxSize
					if(isMaxSized){
						if(rotate){
							startPage=Math.max(currentPage-Math.floor(maxSize/2),1);
							endPage=startPage+maxSize-1;

							//Adjust if limit is exceeded
							if(endPage>totalPages){
								endPage=totalPages;
								startPage=endPage-maxSize+1;
							}
						}else{
							startPage=((Math.ceil(currentPage/maxSize)-1)*maxSize)+1;

							endPage=Math.min(startPage+maxSize-1,totalPages);
						}
					}

					//add page number links
					for(var number=startPage;number<=endPage;number++ ){
						var page=makePage(number,number,paginationCtrl.isActive(number),false);
						pages.push(page);
					}

					//Add links to move between page sets
					if(isMaxSized && !rotate){
						if(startPage>1){
							var previousPageSet=makePage(startPage-1,'...',false,false);
							pages.unshift(previousPageSet);
						}
						if(endPage<totalPages){
							var nextPageSet=makePage(endPage+1,'...',false,false);
						}
					}

					//Add previous & next links
					if(directionLinks){
						var previousPage=makePage(currentPage-1,previousText,false,paginationCtrl.noPrevious());
						pages.unshift(previousPage);

						var nextPage=makePage(currentPage+1,nextText,false,paginationCtrl.noNext());
						pages.push(nextPage);
					}

					//add first & last links
					if(boundaryLinks){
						var firstPage=makePage(1,firstText,false,paginationCtrl.noPrevious());
						pages.unshift(firstPage);

						var lastPage=makePage(totalPages,lastText,false,paginationCtrl.noNext());
						pages.push(lastPage);
					}

					return pages;
				};
		}
	};
}])