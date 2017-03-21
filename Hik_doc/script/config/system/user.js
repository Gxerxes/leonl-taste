define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oService;
	var _oTab;

	$ = require("jquery");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");
	_oService = require("config/service");

	function User() {

	}

	User.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

			self.initController();

			_oTab = $("#tabs").tabs({
				load: function (event, eventData) {
					var szModule = eventData.tab.attr("module");
					require.async("config/system/" + szModule, function (oModule) {
						if (oModule) {
							_oService.init();
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

			angular.module("userApp",[])
				.controller("userController", function ($scope) {
					$scope.oLan = _oTranslator.oLastLanguage;

					// 多标签显示控制
					$scope.oTab = {
					};
				});
			angular.bootstrap(angular.element("#user"), ["userApp"]);
		}
	};

	module.exports = new User();
});