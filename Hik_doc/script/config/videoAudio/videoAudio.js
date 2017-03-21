define(function(require, exports, module) {

	var $, _oTranslator, _oTab, _oDevice, _oService, _oPlugin;

	$ = require("jquery");

	_oTranslator = require("translator");
	_oDevice = require("isapi/device");
	_oService = require("config/service");
    _oPlugin = require("common/plugin");
	var _oUtils = require("utils");

	function videoAudio() {

	}

	videoAudio.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

			self.initController();

			_oTab = $("#tabs").tabs({
				load: function (event, eventData) {
					var szModule = eventData.tab.attr("module");
					_oService.m_szModule = szModule;
					require.async("config/videoAudio/" + szModule, function (oModule) {
						if (oModule) {
							_oService.init();
							oModule.init();
							$("body").hide().show();
						}
					});
				},
				beforeActivate: function (event, eventData) {
                    var szModule = eventData.oldTab.attr("module");
                    if ("regCrop" == szModule || "roi" == szModule) {
                        // 页面中如果有视频，离开时需要关闭视频
                        _oPlugin.stop();
                        _oPlugin.removePlugin();
                    };
                    eventData.oldPanel.empty();
					_oUtils.removeValidTip();
				}
			});
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("videoAudioApp",[])
				.controller("videoAudioController", function ($scope) {
					$scope.oLanVideoAudio = _oTranslator.oLastLanguage;
					_oDevice.getDualVCACap();  //获取码流信息叠加能力
                    _oDevice.getRegCropCap();  //获取区域裁剪能力
					$scope.oVideoAudioCapa = {
						bSupportAudio: _oDevice.m_oDeviceCapa.bSupportAudio,
						bSupportROI: _oDevice.m_oDeviceCapa.bSupportROI,
						bSupportStreamOver: _oDevice.m_oDeviceCapa.bIsSupportDualVCA,
                        bSupportRegCrop: _oDevice.m_oDeviceCapa.bIsSupportRegCrop,
						bSupportZeroChan: _oDevice.m_oDeviceCapa.bSupportZeroChan
					};
				});
			angular.bootstrap(angular.element("#videoAudio"), ["videoAudioApp"]);
		}
	};

	module.exports = new videoAudio();
});