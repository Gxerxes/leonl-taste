seajs.config({
	base: "../script/",
	alias: {
		"jquery": "lib/jquery/jquery/jquery-1.7.2.min.js",
		"layout": "lib/jquery/layout/jquery.layout-1.3.0.js",
		"cookie": "lib/jquery/cookie/jquery.cookie.js",
		"resize": "lib/jquery/resize/jquery.ba-resize.js",

		"json2": "lib/json2.js",
		"angular": "lib/angularjs/angularjs/angular-1.2.0.min.js",

		"base64": "lib/base64.js",
		"webSession": "lib/webSession.js",
		"translator": "lib/translator.js",
		"utils": "lib/utils.js",
		"dialog": "lib/dialog.js",
		"timebar": "lib/timebar.js",
		"uuid": "lib/uuid.js",

		"artDialog": "lib/jquery/artDialog/jquery.artDialog.source-4.1.6.js",
		"quickTime": "lib/jquery/quicktime/jquery.quicktime.js",

		"websdk": "isapi/websdk.js",
		
		"AES": "lib/encryption/AES.js",
		"cryptico": "lib/encryption/cryptico.min.js",
		"encryption": "lib/encryption/encryption.js",
		
		"ui.core": "lib/jquery/jquery-ui/jquery.ui.core.js",
		"ui.widget": "lib/jquery/jquery-ui/jquery.ui.widget.js",
		"ui.tabs": "lib/jquery/jquery-ui/jquery.ui.tabs.js",
		"ui.jquery": "lib/jquery/jquery-ui/ui.jquery.js",
		"ui.slider": "lib/jquery/jquery-ui/jquery.ui.slider.js",
		"ui.table": "lib/jquery/jquery-ui/jquery.ui.table.js",
		"ui.menu": "lib/jquery/jquery-ui/jquery.menu.js",
		"ui.timeplan": "lib/jquery/jquery-ui/jquery.timeplan.js",

        "Plot.Chart": "lib/jquery/jquery-ui/jquery.Plot.Chart.js"
	},
	preload: ["lib/seajs/nocache/nocache-1.0.0", "lib/jquery/jquery/jquery-1.7.2.min"]
});

seajs.web_version = "V4.0.1build161220";  //网页版本
seajs.plugin_version = "V3.0.5.42";  //插件版本
seajs.iDeviceType = 1;  //0-后端， 1-前端[目前没有能力区分，本地配置播放参数协议是否支持http]
seajs.iSupportHelp = 1;  //0-不支持 1-支持

seajs.use(["common"], function (oCommon) {
	$(function () {
		oCommon.init();
	});
});