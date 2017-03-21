define(function (require, exports, module) {

	var $, _oTranslator, _oTab, _oDevice, _oUtils, _oCommon;

	$ = require("jquery");
	_oDevice = require("isapi/device");
	_oTranslator = require("translator");
	_oUtils = require("utils");
	_oCommon = require("common");

	function Advanced() {
	}

	Advanced.prototype = {
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
					eventData.oldPanel.empty();
					_oUtils.removeValidTip();
				}
			});
		},
		// 初始化控制器
		initController: function () {
			angular.module("advancedApp", [])
				.service("service", function () {
					this.m_oLan = _oTranslator.oLastLanguage;
					var bSupportQos = false;
					this.isSupportQosInfo = function () {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "networkQos", null, {
							async: false,
							success: function (status, xmlDoc) {
								bSupportQos = true;
							},
							error: function (status, xmlDoc) {
								bSupportQos = false;
							}
						});
					};
					_oDevice.get28181Support();
					this.isSupportQosInfo();
					this.m_oAdvancedCap = {
						bSupportSnmp: _oDevice.m_oDeviceCapa.bSupportSnmp,
						bSupportFtp: _oDevice.m_oDeviceCapa.bSupportFtp,
						bSupportPlatform: _oDevice.m_oDeviceCapa.bSupportEZVIZ || _oDevice.m_oDeviceCapa.bSupportEhome || _oDevice.m_oDeviceCapa.bSupport28181,
						bSupportHttps: _oDevice.m_oDeviceCapa.bSupportHttps,
						bSupport28181Service: _oDevice.m_oDeviceCapa.bSupport28181Service,
						bSupportNetworkOther: _oDevice.m_oDeviceCapa.bSupportNetworkOther,
						bSupportQos: bSupportQos,
						bSupport8021x: _oDevice.m_oDeviceCapa.bSupport8021x,
						bSupportWifi: _oDevice.m_oDeviceCapa.bSupportWifi,
						bSupportWLANAP: _oDevice.m_oDeviceCapa.bSupportWLANAP
					}
				})
				.controller("advancedController", function ($scope, service) {
					$scope.oLan = service.m_oLan;
					$scope.oAdvancedCap = service.m_oAdvancedCap;
				});
			angular.bootstrap(angular.element("#advanced"), ["advancedApp"]);
		},
		unload: function () {
			_oUtils.removeValidTip();
		}
	};
	module.exports = new Advanced();
});