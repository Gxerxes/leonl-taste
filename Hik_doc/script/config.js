define(function (require, exports, module) {
	var $, _oCommon, _oTranslator, _oHeader, _oMenu, _oPTZLock;

	$ = require("jquery");

	_oCommon = require("common");
	_oTranslator = require("translator");

	_oHeader = require("common/header");
	_oMenu = require("common/menu");
	var _oUtils = require("utils");

	require("ui.core");
	require("ui.widget");
	require("ui.tabs");

	_oPTZLock = require("config/ptzLock");

	var _bHideHead = false;

	function Config() {

	}

	Config.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

			var oLanConfig = _oTranslator.getLanguage("Config");
			_oTranslator.appendLanguage(oLanConfig, _oCommon.m_oLanCommon);

			document.title = _oTranslator.getValue("config");
			//解析URL
			var szUrl = document.URL;
			var szSubUrl = _oUtils.getURIParam("sub", szUrl);
			if (szSubUrl !== "") {
				//do something
			}
			_bHideHead = _oUtils.getURIParam("nohead", szUrl) === "true";

			self.initLayout();
			self.initController();
			//非中文添加语言样式
			/*if (_oTranslator.szCurLanguage !== "zh" && _oTranslator.szCurLanguage !== "zh-tw") {
				$("#view").addClass("lan-not-zh");
			}*/
		},
		initLayout: function () {
			var self = this;

			var layoutSettings = {
				defaults: {
					spacing_open: 0,
					spacing_closed: 0
				},
				north: {
					paneSelector: ".layout-north",
					size: 40,
					initHidden: _bHideHead
				},
				west: {
					paneSelector: ".layout-west",
					size: 214
				},
				center: {
					paneSelector: ".layout-center",
					childOptions: {
						defaults: {
							spacing_open: 0
						},
						center: {
							paneSelector: ".layout-center-inner",
							onresize_end: function (pane) {
							}
						},
						south: {
							paneSelector: ".layout-south-inner",
							size: 30
						}
					}
				}
			};

			$("body").layout(layoutSettings);
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			_oHeader.init("header", 4);

			_oMenu.init("menu");
		},
		// 页面卸载的时候处理
		unload: function () {
			// 云台锁定解锁
			_oPTZLock.unlockPTZ();
		}
	};

	module.exports = new Config();
});