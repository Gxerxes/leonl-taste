define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oDialog, _oDevice, _oResponse;
	var _oScope, _oAuth, _oXmlDoc, _oWebSession, _oBase64;

	$ = require("jquery");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");

	_oDialog = require("lib/dialog");
	_oDevice = require("isapi/device");
	_oResponse = require("isapi/response");
	_oWebSession = require("webSession");
	_oBase64 = require("base64");

	function SecurityAuth() {
		_oAuth = {
			szRtsp: "false",		// Rtsp认证
			szWeb: "basic"		// Web认证
		};
		_oXmlDoc = {
			oRtsp: null,			// Rtsp XmlDoc信息
			oWeb: null				// Web XmlDoc信息
		};
	}

	SecurityAuth.prototype = {
		// 页面初始化
		init: function (oParent) {
			var self = this;

			self.initController();
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("securityAuthApp", [])
				.controller("securityAuthController", function ($scope, $timeout) {
					_oScope = $scope;

					// 语言包
					$scope.oLan = _oTranslator.oLastLanguage;
					// 认证支持
					$scope.oSupportAuth = _oDevice.m_oDeviceCapa.oSupportAuth;
					// 认证信息
					$scope.oAuth = _oAuth;

					// 保存信息
					$scope.save = function () {
						self.save();
					};

					// 获取基本信息
					$timeout(function () {
						self.getAuthInfo();
					}, 10);
				});
			angular.bootstrap(angular.element("#securityAuth"), ["securityAuthApp"]);
		},
		// 获取认证信息
		getAuthInfo: function () {
			// Rtsp认证信息
			if (_oScope.oSupportAuth.bRtsp) {
				WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "rtspAuth", null, {
					success: function (status, xmlDoc) {
						_oXmlDoc.oRtsp = xmlDoc;
						var szRTSPAuthType = $(xmlDoc).find("Security").eq(0).find("enabled").eq(0).text();
						_oAuth.szRtsp = (szRTSPAuthType == "" ? "false" : szRTSPAuthType);

						_oScope.$apply();
					}
				});
			}
			// Web认证信息
			if (_oScope.oSupportAuth.bWeb) {
				WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "webAuth", null, {
					success: function (status, xmlDoc) {
						_oXmlDoc.oWeb = xmlDoc;
						var szWebAuthType = $(xmlDoc).find("CertificateType").eq(0).text();
						_oAuth.szWeb = szWebAuthType;

						_oScope.$apply();
					}
				});
			}
		},
		// 保存信息
		save: function () {
			var self = this;

			self.setAuthInfo();
		},
		// 设置认证信息
		setAuthInfo: function () {
			var iReturn = 0;
            var oXmlDoc = _oXmlDoc.oWeb;
            var szOldWebAuth = $(oXmlDoc).find("CertificateType").eq(0).text();
            var szNewWebAuth = _oAuth.szWeb;
            // Web认证信息
            if (_oScope.oSupportAuth.bWeb && szOldWebAuth != szNewWebAuth) {
                $(oXmlDoc).find("CertificateType").eq(0).text(szNewWebAuth);

                WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "webAuth", null, {
                    data: oXmlDoc,
                    success: function (status, xmlDoc, xhr) {
                        var szUserPwdValue = _oWebSession.getItem("userInfo");
                        if (szUserPwdValue == null) {
                            window.location.href = "login.asp?_" + new Date().getTime();
                            return;
                        }
                        var szUsername = _oBase64.decode(szUserPwdValue);
                        var oNamePwd = _oUtils.parseNamePwd(szUsername);

                        if (szNewWebAuth === 'digest'){
                            _oCommon.m_bDigest = true;
                        } else {
                            _oCommon.m_bDigest = false;
                        }
                        _oCommon.changeNamePWD(_oCommon.m_bAnonymous, oNamePwd.szName, oNamePwd.szPass);

                        // 获取设备型号，用于改变认证头信息
                        // todo 摘要认证需要处理
                        WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "deviceInfo", null, {
                            username: oNamePwd.szName,
                            password: oNamePwd.szPass,
                            success: function () {
                                // do nothing
                            }
                        });

                        //if ($.browser.msie && parseInt($.browser.version, 10) <= 8 || $.browser.safari){
                        _oDialog.alert(_oTranslator.getValue("restartBrowser"));  //由于chrome浏览器后面被认为safari所以直接都提示重启浏览器
                        //}
                    },
                    complete: function (status, xmlDoc, xhr) {
                        iReturn++;
                        if (2 == iReturn) {
                            _oResponse.saveState(xhr);
                        }
                    }
                });
            } else {
                iReturn++;
            }

			// Rtsp认证信息
			if (_oScope.oSupportAuth.bRtsp) {
				var oXmlDoc = _oXmlDoc.oRtsp;
				$(oXmlDoc).find("Security").eq(0).find("enabled").eq(0).text(_oAuth.szRtsp);

				WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "rtspAuth", null, {
					data: oXmlDoc,
					complete: function (status, xmlDoc, xhr) {
						iReturn++;
						if (2 == iReturn) {
							_oResponse.saveState(xhr);
						}
					}
				});
			} else {
				iReturn++;
			}
		}
	};

	module.exports = new SecurityAuth();
});