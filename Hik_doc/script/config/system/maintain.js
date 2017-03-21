define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oDevice;
	var _oTab, _bSupportService;

	$ = require("jquery");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");

	_oDevice = require("isapi/device");

	function Maintain() {
		this.m_oLiveViewConnection = {};	// 预览连接数能力

		_bSupportService = false;				// 是否显示服务标签
	}

	Maintain.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

			//_oDevice.getDeviceCapa();
			//_oDevice.getNetworkVersion();
			self.isSupportService();

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
					var szModule = eventData.oldTab.attr("module");
					if ("maintainUpgrade" == szModule || "maintainLog" == szModule) {
						eventData.oldPanel.empty();
					}
					_oUtils.removeValidTip();
				}
			});
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("maintainApp",[])
				.controller("maintainController", function ($scope) {
					$scope.oLan = _oTranslator.oLastLanguage;

					// 多标签显示控制
					$scope.oTab = {
						bSupportService: _bSupportService
					};
				});
			angular.bootstrap(angular.element("#maintain"), ["maintainApp"]);
		},
		// 是否支持服务配置
		isSupportService: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "service", null, {
				async: false,
				success: function (status, xmlDoc) {
					if ($(xmlDoc).find("HardwareService").eq(0).children().length == 0) {
						_bSupportService = false;
						self.isSupportSoftwareService();
					} else {
						self.isSupportSoftwareService();
						_bSupportService = true;
					}
				},
				error: function () {
					_bSupportService = false;
					self.isSupportSoftwareService();
				}
			});
		},
		// 是否支持软件服务配置
		isSupportSoftwareService: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "softwareServiceCapa", null, {
				async: false,
				success: function (status, xmlDoc) {
					_bSupportService = true;
					self.m_oLiveViewConnection.minConnect = parseInt($(xmlDoc).find("maxLinkNum").attr("min"), 10);
					self.m_oLiveViewConnection.maxConnect = parseInt($(xmlDoc).find("maxLinkNum").attr("max"), 10);
				},
				error: function () {
					_bSupportService = false;
				}
			});
		}
	};

	module.exports = new Maintain();
});