define(function (require, exports, module) {

	var $, _oTranslator, _oTab, _oUtils, _oDevice, _oService;

	$ = require("jquery");
	_oTranslator = require("translator");
	_oUtils = require("utils");
	_oDevice = require("isapi/device");
	_oService = require("config/service");


	function Plan() {

	}

	Plan.prototype = {
		// 页面初始化
		init: function () {
			this.initController();
			_oTab = $("#tabs").tabs({
				load: function (event, eventData) {
					var szModule = eventData.tab.attr("module");
					require.async("config/storage/" + szModule, function (oModule) {
						if (oModule) {
							_oService.init();
							oModule.init(szModule);
						}
					});
				},
				beforeActivate: function (event, eventData) {
					//eventData.oldPanel.empty();
					_oUtils.removeValidTip();
				}
			});
		},
		// 初始化控制器
		initController: function () {
			angular.module("planApp", [])
				.service("service", function () {
					this.m_oCapbilities = {
						bSupportCapture: _oDevice.m_oDeviceCapa.bSupportCapture
					}
				})
				.controller("planController", function ($scope, service) {
					$scope.oLan = _oTranslator.oLastLanguage;
					$scope.oCapbilities = service.m_oCapbilities;
				});
			angular.bootstrap(angular.element("#plan"), ["planApp"]);
		},
		unload: function () {
			_oUtils.removeValidTip();
		}
	};

	module.exports = new Plan();
});