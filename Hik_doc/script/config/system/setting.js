define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oDevice;
	var _oTab;

	$ = require("jquery");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");

	_oDevice = require("isapi/device");

	function Setting() {

	}

	Setting.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

			//_oDevice.getDeviceCapa();
			//_oDevice.getNetworkVersion();

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

					_oUtils.removeValidTip();
				}
			});
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("settingApp",[])
				.service("service", function () {
					var that = this;
					this.m_bSupportWorkMode = false;
					this.isSupportWorkMode = function () {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "workMode", null, {
							async: false,
							success: function (status, xmlDoc) {
								that.m_bSupportWorkMode = true;
							},
							error: function (status, xmlDoc) {
								that.m_bSupportWorkMode = false;
							}
						});
					};

				})
				.controller("settingController", function ($scope, service) {
					service.isSupportWorkMode();
                    _oDevice.getVCAResource();
					$scope.oLan = _oTranslator.oLastLanguage;
					// 多标签显示控制
					$scope.oTab = {
						bSupport232Config: _oDevice.m_oDeviceCapa.bSupport232Config,
						bSupport485: _oDevice.m_oDeviceCapa.bSupport485,
						bSupportMenu: _oDevice.m_oDeviceCapa.bSupportMenu,
						bSupportWorkMode: service.m_bSupportWorkMode,
                        bSupportTeleCtrl: _oDevice.m_oDeviceCapa.bSupportTeleCtrl,
                        bSupportVCAResource: _oDevice.m_oDeviceCapa.oVCAResourceType !== "",
                        bSupportDST: _oDevice.m_oDeviceCapa.bSupportDST,
                        bSupportExternalDevice: _oDevice.m_oDeviceCapa.bSupportExternalDevice,
                        bSupportTraffic: _oDevice.m_oDeviceCapa.oVCAResourceType == "TFS" ||(_oDevice.m_oDeviceCapa.oSupportTraffic.bSupport && _oDevice.m_oDeviceCapa.oVCAResourceType == '')
					};
				});
			angular.bootstrap(angular.element("#setting"), ["settingApp"]);
		},
		// 页面卸载
		unload: function () {
			_oUtils.removeValidTip();
		}
	};

	module.exports = new Setting();
});