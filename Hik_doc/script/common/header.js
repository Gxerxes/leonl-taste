define(function(require, exports, module) {
	var _oCommon, _oDialog, _oTranslator, _oWebSession, _oDevice;

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oWebSession = require("webSession");
	_oDialog = require("dialog");
    _oDevice = require("isapi/device");

	function Header() {

	}

	Header.prototype = {
		init: function (szID, iIndex) {
			var oHeaderApp = angular.module("headerApp", []);

			oHeaderApp.controller("headerController", function ($scope) {
				$scope.bSupportHelp = (seajs.iSupportHelp == 1 ? true:false);
				$scope.username = _oCommon.m_szUsername;
				$scope.oLan = _oCommon.m_oLanCommon;
                $scope.bSupportApplication = (_oDevice.m_oDeviceCapa.bSupportPeopleCount && _oDevice.m_oDeviceCapa.bSupportPeopleCount.bSptPeople)
					|| (_oDevice.m_oDeviceCapa.bSupportPeopleCount && _oDevice.m_oDeviceCapa.bSupportPeopleCount.bSptObjCount)
					|| _oDevice.m_oDeviceCapa.bSupportHeatmap || _oDevice.m_oDeviceCapa.bSupportFaceCaptureCount;

				// 加载完后触发
				$scope.headerLoaded = function () {
					$("#nav li").eq(iIndex).addClass("active");
				};

				// 页面跳转
				$scope.jumpTo = function (szPage) {
					if (_oCommon.m_bAnonymous) {// 匿名登录不能切换标签
						return;
					}
					location.href = szPage + ".asp";
				};

				// 帮助
				$scope.help = function () {
					var szLanguage = $.cookie("language");
					if (szLanguage !== "zh") {
						szLanguage = "en";
					}
					var szUrl = "../../help/" + szLanguage + "/help.html" + "?version=" + seajs.plugin_version;
					var szPage = _oCommon.m_szPage;
					if (szPage !== "config") {
						if (szPage === "download") {
							szPage = "picture";
						}
						szUrl = szUrl + "&page=" + szPage;
					} else {
						var sdMarkMenu = $.cookie("sdMarkMenu");
						if (sdMarkMenu) {
							// 加载Tab时记住当前模块的索引
							var szMarkTab = $.cookie("sdMarkTab_" + sdMarkMenu.split(":")[0]);
							if (szMarkTab) {
								szUrl = szUrl + "&page=" + sdMarkMenu.split(":")[1] + "&subpage=" + szMarkTab.split(":")[1];
							} else {
								var aMenuId = sdMarkMenu.split(":")[0].split("_");
								if (aMenuId.length > 1) {
									szUrl = szUrl + "&page=" + sdMarkMenu.split(":")[1] + "&subpage=" + aMenuId[1];
								} else {
									szUrl = szUrl + "&page=" + sdMarkMenu.split(":")[1];
								}
							}
						}
					}
					window.open(szUrl);
				};

				// 退出
				$scope.exit = function () {
					_oDialog.confirm(_oTranslator.getValue("confirmLogout"), null, function () {
						_oWebSession.removeItem("userInfo");
						window.location.href = "login.asp";
					});
				};
			});

			angular.bootstrap(angular.element("#" + szID), ["headerApp"]);
		}
	};

	module.exports = new Header();
});