define(function (require, exports, module) {

	var $, _oTranslator, _oTab, _oDevice, _oUtils;

	$ = require("jquery");
	_oDevice = require("isapi/device");
	_oTranslator = require("translator");
	_oUtils = require("utils");

	function Basic() {
	}

	Basic.prototype = {
		// 页面初始化
		init: function () {
			this.initController();

			_oTab = $("#tabs").tabs({
				load: function (event, eventData) {
					var szModule = eventData.tab.attr("module");
					require.async("config/network/" + szModule, function (oModule) {
						if (oModule) {
							oModule.init(szModule);
						}
					});
				},
				beforeActivate: function (event, eventData) {
					_oUtils.removeValidTip();
				}
			});
		},
		// 初始化控制器
		initController: function () {
			angular.module("basicApp", [])
				.service("service", function () {
					this.m_oLan = _oTranslator.oLastLanguage;
					this.m_oBasicCap = {
						bSupportDdns: _oDevice.m_oDeviceCapa.bSupportDdns,
						bSupportPPPoE: _oDevice.m_oDeviceCapa.bSupportPPPoE,
						bSupportUpnp: _oDevice.m_oDeviceCapa.bSupportUpnp,
						bSupportWirelessDial: _oDevice.m_oDeviceCapa.bSupportWirelessDial
					}
				})
				.controller("basicController", function ($scope, service) {
					$scope.oLan = service.m_oLan;
					$scope.oBasicCap = service.m_oBasicCap;
				});
			angular.bootstrap(angular.element("#basic"), ["basicApp"]);
		},
		unload: function () {
			_oUtils.removeValidTip();
		}
	};
	module.exports = new Basic();
});