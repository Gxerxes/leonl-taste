define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oDialog, _oUtils, _oService, _oPlugin, _oDevice;
	var _oTab;

	$ = require("jquery");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oDialog = require("dialog");
	_oUtils = require("utils");

	_oService = require("config/service");
	_oPlugin = require("common/plugin");
	_oDevice = require("isapi/device");

	function Event() {
		this.m_oErrorXhr = null;					// 错误的XmlDoc
		this.m_oSuccessXhr = null;				// 成功的XmlDoc
		this.m_oRebootXhr = null;				// 重启的XmlDoc
	}
	
	Event.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

			self.initController();

			_oTab = $("#tabs").tabs({
				load: function (event, eventData) {
					var szModule = eventData.tab.attr("module");
					require.async("config/event/" + szModule, function (oModule) {
						if (oModule) {
							_oService.init();
							oModule.init(self);
						}
					});
				},
				beforeActivate: function (event, eventData) {
					var szModule = eventData.oldTab.attr("module");
					// 页面中如果有视频，离开时需要关闭视频
					if ("eventMotion" == szModule || "eventVideoTamper" == szModule) {
						_oPlugin.stop();
						_oPlugin.removePlugin();
					}
					eventData.oldPanel.empty();

					_oUtils.removeValidTip();
				}
			});
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("eventApp",[])
				.controller("eventController", function ($scope) {
					$scope.oLan = _oTranslator.oLastLanguage;

					// 多标签显示控制
					$scope.oTab = {
						bSupportAlarmIn: _oDevice.m_oDeviceCapa.bSupportAlarmIn,
						bSupportAlarmOut: _oDevice.m_oDeviceCapa.bSupportAlarmOut,
						bSupportVideoLoss: _oDevice.m_oDeviceCapa.bSupportVideoLoss,
						bSupportWLS: _oDevice.m_oDeviceCapa.bSupportWLS,
						bSupportPIR: _oDevice.m_oDeviceCapa.bSupportPIR,
						bSupportCH: _oDevice.m_oDeviceCapa.bSupportCH
					};
				});
			angular.bootstrap(angular.element("#event"), ["eventApp"]);
		},
		// 页面卸载
		unload: function () {
			_oUtils.removeValidTip();
		}
	};

	module.exports = new Event();
});