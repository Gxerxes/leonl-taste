define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oDevice;
	var _oTab;

	$ = require("jquery");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");

	_oDevice = require("isapi/device");

	function Security() {

	}

	Security.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

			_oDevice.getAuthSupport();

			self.initController();

			_oTab = $("#tabs").tabs({
				load: function (event, eventData) {
					var szModule = eventData.tab.attr("module");
					require.async("config/system/" + szModule, function (oModule) {
						if (oModule) {
							oModule.init(self);
						}
					});
				},
				beforeActivate: function (event, eventData) {
					/*var szModule = eventData.oldTab.attr("module");
					if ("eventMotion" == szModule || "eventVideoTamper" == szModule) {
						_oPlugin.stop();
					}
					eventData.oldPanel.empty();*/
				}
			});
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("securityApp",[])
				.controller("securityController", function ($scope) {
					$scope.oLan = _oTranslator.oLastLanguage;

					// 多标签显示控制
					$scope.oTab = {
						bSupportIPFilter: _oDevice.m_oDeviceCapa.bSupportIPFilter,
						bSupportAuth: (_oDevice.m_oDeviceCapa.oSupportAuth.bRtsp || _oDevice.m_oDeviceCapa.oSupportAuth.bWeb),
						bSupportService: _oDevice.m_oDeviceCapa.bSupportTelnet || _oDevice.m_oDeviceCapa.bSupportSSH
					};
				});
			angular.bootstrap(angular.element("#security"), ["securityApp"]);
		}
	};

	module.exports = new Security();
});