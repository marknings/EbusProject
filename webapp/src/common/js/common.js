
window.$ctx='http://localhost:3000/';

window.$frameUiTemplateDir='/lib/frameui/1.0.0/';

//FrameUi中所有指令的templateUrl都是调用该方法获取指令模板的路径
window.$getFrameUiTemplateUrl$=function(tElement,tAttrs,dir,name){
	if(tAttrs.templateUrl){
		return tAttrs.templateUrl;
	}else{
		var path=window.$ctx+window.$frameUiTemplateDir;
		path+=dir+"/template/";
		return path+name+".html";
	}
}