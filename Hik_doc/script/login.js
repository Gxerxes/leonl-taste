define(function (require, exports, module) {

	var _oCommon, _oBase64, _oWebSession, _oTranslator, _oDialog, _oUtils, _oResponse, _oScope;

	_oCommon = require("common");
	_oBase64 = require("base64");
	_oWebSession = require("webSession");

	_oTranslator = require("translator");
	_oDialog = require("dialog");
	_oUtils = require("utils");
	_oEncryption = require("encryption");
	_oResponse = require("isapi/response");
	_oScope = null;

	function Login() {
		this.resize();

		this.bError = false;// 出错了
		this.oLanLogin = null;
		this.szDefaultUser = "admin";
	}

	Login.prototype = {
		// 调整大小
		resize: function () {

		},
		// 页面初始化
		init: function () {
			//登陆页不需要处理401
			$.ajaxSetup({
				statusCode: {
					401: function () {}
				}
			});
			var self = this;

			var oLanLogin = _oTranslator.getLanguage("Login");
			self.oLanLogin = _oTranslator.appendLanguage(oLanLogin, _oCommon.m_oLanCommon);

			document.title = _oTranslator.getValue("login");
			if (!(document.cookie || navigator.cookieEnabled)) {
				self.bError = true;
				_oDialog.alert(_oTranslator.getValue("cookieError"), null, function () {
					self.bError = false;
				});
				return;
			}

			self.initController();

			$("#username").focus();
			//获取激活状态
			self.getDeviceActiveStat();
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			var oInput = document.createElement("input");
			oInput.type = "text";
			var _bSupportPlaceholder = (typeof oInput.placeholder !== "undefined");

			var oLoginApp = angular.module("loginApp", [])
				.controller("loginController", function ($scope, $document, $compile) {
					_oScope = $scope;
					var szUrl = decodeURI(document.URL);
					if (szUrl.indexOf("anonymous=true") > -1) {
						$scope.anonymous = true;
					} else {
						$scope.anonymous = false;
					}

					$scope.oLan = self.oLanLogin;
					$scope.szErrorTip = "";
					$scope.username = "";
					$scope.password = "";
					$scope.activeUsername = self.szDefaultUser;
					$scope.activePassword = "";
					$scope.activePasswordConfirm = "";
					$scope.activePasswordStatus = false;

					// 显示预览下拉框
					$scope.showLanguageList = function (e) {
						e.stopPropagation();
						$("#language_list").toggle();
					};

					// 切换语言
					$scope.changeLanguage = function (e) {
						self.changeLanguage(e.target.id);
					};

					// 点击登录按钮登录
					$scope.login = function (szType) {
						if ("anonymous" == szType) {
							this.username = "anonymous";
							this.password = "******";
						}
						$scope.szErrorTip = "";
						self.doLogin(this, $compile);
					};

					// 按下回车键登录
					$scope.docPress = function (e) {
						if (13 == e.which && !self.bError) {
							self.doLogin(this, $compile);
						}
					};

					// 点击文档，语言下拉隐藏
					$document.on("click", function () {
						$("#language_list").hide();
					});
				})
				.directive("placeholder", function () {
					return {
						restrict: "A",
						scope: false,
						require: "ngModel",
						link: function (scope, element, attrs, ctrl) {
							if (_bSupportPlaceholder) {
								return;
							}
							var iPaddingLeft = parseInt(element.css("padding-left").replace("px", ""), 10);
							var iPaddingTop = parseInt(element.css("padding-top").replace("px", ""), 10);
							var iBorderTop = parseInt(element.css("border-top-width").replace("px", ""), 10);
							scope.$watch(attrs.ngModel.toString(), function (newVal) {
								if (angular.isUndefined(newVal)) {
									return;
								}
								var oPlaceHolder = element.data("placeholder");
								if (!oPlaceHolder) {
									oPlaceHolder = $("<label class='placeholder'>" + attrs.placeholder + "</label>");
									oPlaceHolder.click(function () {
										element.focus();
									});
									element.data("placeholder", oPlaceHolder);
								}
								if (newVal === "") {
									$(element).parent().append(oPlaceHolder);
									var iTop = Math.round((element.height() - oPlaceHolder.height()) / 2) + iBorderTop + iPaddingTop;
									oPlaceHolder.css({"left": (element.position().left + iPaddingLeft) + "px", "top": (element.position().top + iTop) + "px"});
								} else {
									oPlaceHolder.remove();
									element.removeData("placeholder");
								}
							});
						}
					}
				})
				.directive("strength", function () {
					return {
						restrict: "A",
						scope: {
							lan: "=",
							oPassword: "=",
							oUsername: "="
						},
						controller: function ($scope) {						
							$scope.$watch("oPassword", function (to) {								
								_oScope.activePasswordStatus = true;
								var oPswStrength = $($scope.element).find(".userstrength");								
								switch (_oUtils.checkPasswordComplexity(to, $scope.oUsername)) {
									case 1: {
										oPswStrength.eq(0).css("backgroundColor", "#FC657E");
										oPswStrength.eq(1).css("backgroundColor", "");
										oPswStrength.eq(2).css("backgroundColor", "");
										$scope.lan.pswstrength = $scope.lan.weakPwd;
										break;
									}
									case 2: {
										oPswStrength.eq(0).css("backgroundColor", "#FFC85D");
										oPswStrength.eq(1).css("backgroundColor", "#FFC85D");
										oPswStrength.eq(2).css("backgroundColor", "");
										$scope.lan.pswstrength = $scope.lan.normalPwd;
										break;
									}
									case 3: {
										oPswStrength.eq(0).css("backgroundColor", "#65D25D");
										oPswStrength.eq(1).css("backgroundColor", "#65D25D");
										oPswStrength.eq(2).css("backgroundColor", "#65D25D");
										$scope.lan.pswstrength = $scope.lan.goodPwd;
										break;
									}
									default: {
										oPswStrength.css("backgroundColor", "");
										$scope.lan.pswstrength = "";
										_oScope.activePasswordStatus = false;
									}
								}		
							});
						},
						template: "<div class='validate'>" +
						"<span><span class='userstrength'></span>" +
						"<span class='userstrength'></span>" +
						"<span class='userstrength'></span>" +
						"<span ng-bind='lan.pswstrength'></span>" +
						"</span></div>" +
						"<div class='clear'></div>" +
            			"<div><label ng-bind='lan.passwordValidTips'></label></div>",						
						link: function (scope, element, attrs) {
							scope.element = element;
						}
					}
				});
			angular.bootstrap(document.body, ["loginApp"]);
		},
		// 点击登录
		doLogin: function ($scope, $compile) {
			var self = this;

			if (self.checkLogin($scope)) {
				var szTimeStamp = new Date().getTime();  //为了解决各个浏览器不带认证请求
				var szPwd = $("#password").val();
				if ("anonymous" === $scope.username) {
					szPwd = "******";
				}
				WebSDK.WSDK_Login(_oCommon.m_szHostName, _oCommon.m_iHttpProtocal, _oCommon.m_iHttpPort, $scope.username, szPwd, szTimeStamp, {
					success: function (status, xmlDoc) {
						var $xmlDoc = $(xmlDoc);
						//校时
						var bSupportSyncTime = _oUtils.nodeValue(xmlDoc, "isSupportLoginTiming", "b");
						_oWebSession.setItem("timecorrect", bSupportSyncTime);
						//跳转到预览页
						var _toPreviewPage = function () {
							//暂时密码取文本框的值，否则绑定的值会去掉后面的空格
							var szNamePwd = _oBase64.encode($scope.username + ":" + $("#password").val());
							//var szNamePwd = _oBase64.encode($scope.username + ":" + $scope.password);
							_oWebSession.setItem("userInfo", szNamePwd);

							var szUrl = decodeURI(document.URL);
							var szPage = _oUtils.getURIParam("page", szUrl);
							if (szPage !== "") {
								//页面跳转
								var szTargetPage = szPage; //要跳转的页面
								var aPattern = szPage.match(/\[&?(.*?)\]/);
								var szPageParams = "";
								if(aPattern !== null) {
									szPageParams = aPattern[1];
									szTargetPage = szPage.replace(aPattern[0], "");
								}
								if (szTargetPage.indexOf(".asp") === -1) {
									szTargetPage = szTargetPage.concat(".asp");
								}
								if (szTargetPage === "paramconfig.asp") {
									szTargetPage = "config.asp";
								}
								if (szPageParams === "") {
									window.location.href = szTargetPage;
								} else {
									window.location.href = szTargetPage + "?" + szPageParams;
								}
							} else {
								window.location.href = "preview.asp";
							}
						};

						if("false" == $(xmlDoc).find('isActivated').eq(0).text()) {//未激活
							self.showChangePswd();
						} else if ("true" === $xmlDoc.find("isRiskPassword").eq(0).text()) { //密码有风险							
							var iLineHeight = 20; //文字行高
							var szTips = "<div><p style='line-height:" + iLineHeight + "px;'>" + _oTranslator.getValue("riskPwdTips") + "</p></div>";
							_oDialog.confirm(szTips, 300, function () { //点击确定
								$scope.activeUsername = $scope.username;
								$scope.szPwdErrorTip = "";						
								_oDialog.html("", $("#active").get(0), 300, null, function () { //点击确定
									$scope.activePassword = $scope.activePassword.replace(/\s/g, "");
									$scope.activePasswordConfirm = $scope.activePasswordConfirm.replace(/\s/g, "");
									if ($scope.activePassword === $scope.activePasswordConfirm && $scope.activePassword !== "") {
										if(_oUtils.checkPasswordComplexity(_oScope.activePassword, _oScope.activeUsername)) {
											WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "user", null, {
												success: function (status, xmlDoc, xhr) {
													//修改密码
													$(xmlDoc).find("User").each(function () {
														if ($(this).find("userName").eq(0).text() === $scope.username) {
															var oXmlDoc = _oUtils.createXml();
															oXmlDoc.appendChild(oXmlDoc.createProcessingInstruction("xml", "version='1.0' encoding='utf-8'"));
															var oPassword = oXmlDoc.createElement("password");
															oPassword.appendChild(oXmlDoc.createTextNode($scope.activePassword));
															$(this).get(0).appendChild(oPassword);
															oXmlDoc.appendChild(this);
															WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "userModify", {user: $(this).find("id").eq(0).text()}, {
																data: oXmlDoc,
																success: function (status, xmlDoc) {
																	$scope.password = $scope.activePassword;
																	_toPreviewPage();
																},
																error: function (status, xmlDoc, xhr) {
																	_toPreviewPage();
																}
															});
															return false;
														}
													});
												},
												error: function (status, xmlDoc, xhr) {
													_toPreviewPage();
												}
											});
										} else {
											return false;
										}										
									} else {
										if ($scope.activePassword === "") {
											$scope.szPwdErrorTip = _oTranslator.getValue("password") + _oTranslator.getValue("nullTips");
										} else if ($scope.activePassword !== $scope.confirmPassword) {
											$scope.szPwdErrorTip = _oTranslator.getValue("passNotMatch");
										}
										_oDialog.alert($scope.szPwdErrorTip);
										// if (!$scope.$$phase) {
										// 	$scope.$apply();
										// }
										return false;
									}
									/*$scope.activePassword = " ";
									 $scope.confirmPassword = " ";
									 if (!$scope.$$phase) {
									 $scope.$apply();
									 }*/
								}, function () { //点击取消
									_toPreviewPage();
								});
								$("#activePassword").focus();
								$compile(angular.element("#active"))($scope);
								if (!$scope.$$phase) {
									$scope.$apply();
								}
								$("#active").hide().show();
								return false;
							}, function () { //点击取消
								_toPreviewPage();
							});
							return;
						} else {
							_toPreviewPage();
						}
					},
					error: function (status, xmlDoc) {
						self.bError = true;
						if (504 == status) {
							_oDialog.alert(_oTranslator.getValue("connectTimeout"), null, function () {
								self.bError = false;
							});
						} else if (401 === status) {
							var $xmlDoc = $(xmlDoc);
							if ($xmlDoc.find("lockStatus").eq(0).text() === "lock") { //用户被锁定
								var iLockTime = parseInt($xmlDoc.find("unlockTime").eq(0).text(), 10);
								var szLockTime = "";
								if (iLockTime < 60) {
									szLockTime = _oTranslator.getValue("seconds");
								} else {
									iLockTime = Math.ceil(iLockTime / 60);
									szLockTime = _oTranslator.getValue("minute");
								}
								var szAlertHtml = "<div style='padding: 10px;'>" + _oTranslator.getValue("userLock", [iLockTime, szLockTime]) + "</div>";
								_oDialog.alert(szAlertHtml, null, function () {
									self.bError = false;
									$("#username").focus();
									$("#password").blur();

									$scope.username = "";
									$scope.password = "";
									$scope.szErrorTip = "";
									$scope.$apply();
								});
								return;
							}
							var szRetryLoginTime = $xmlDoc.find("retryLoginTime").eq(0).text();
							$("#username").focus();
							$("#password").blur();

							if (szRetryLoginTime === "") {
								$scope.szErrorTip = _oTranslator.getValue("loginError");
							} else {
								$scope.szErrorTip = _oTranslator.getValue("loginLockError", [szRetryLoginTime]);
							}

							self.bError = false;
							$scope.username = "";
							$scope.password = "";
							$scope.$apply();
						} else {
							_oDialog.alert(_oTranslator.getValue("networkError"), null, function () {
								self.bError = false;
							});
						}
					}
				});
			}
		},
		// 检查登录有效性
		checkLogin: function ($scope) {
			if (0 == _oUtils.lengthw($scope.username)) {
				$scope.szErrorTip = _oTranslator.getValue("inputUsername");
				$("#username").focus();

				return false;
			}
			//密码不能为空
			if (0 == _oUtils.lengthw($scope.password)) {
				$scope.szErrorTip = _oTranslator.getValue("inputPassword");
				$("#password").focus();

				return false;
			}

			/*if (_oUtils.lengthw($scope.username) > 32) {
			 self.bError = true;
			 setTimeout(function () {
			 _oDialog.alert(_oTranslator.getValue("usernameToLong"), null, function () {
			 self.bError = false;
			 $("#username").focus();
			 $scope.username = "";
			 $scope.$apply();
			 });
			 }, 10);
			 return false;
			 }*/

			if (_oUtils.isChinese($scope.username)) {
				$("#username").focus();
				$("#username").focus();
				$scope.szErrorTip = _oTranslator.getValue("notSupportZhUser");
				$scope.username = "";
				$scope.$apply();

				return false;
			}

			// 密码不能包含中文
			if (_oUtils.isChinese($scope.password)) {
				$("#password").focus();
				$scope.szErrorTip = _oTranslator.getValue("notSupportZhPass");
				$scope.password = "";
				$scope.$apply();

				return false;
			}

			/*if (_oUtils.lengthw($scope.password) > 16) {
			 self.bError = true;
			 setTimeout(function () {
			 _oDialog.alert(_oTranslator.getValue("passwordToLong"), null, function () {
			 self.bError = false;
			 $("#password").focus();
			 $scope.password = "";
			 $scope.$apply();
			 });
			 }, 10);
			 return false;
			 }*/

			return true;
		},
		// 语言切换函数
		changeLanguage: function (lan) {
			$.cookie("language", lan);
			location.href = location.href;
		},
		//获取激活状态
		getDeviceActiveStat: function () {
			var self = this;
			WebSDK.WSDK_Activate(_oCommon.m_szHostName, _oCommon.m_iHttpProtocal, _oCommon.m_iHttpPort, {
				cmd: "activateStatus",
				success: function (status, xmlDoc) {
					if (_oUtils.nodeValue(xmlDoc, "Activated") != "true") {
						self.showChangePswd();
					}
				}
			});
		},
		//修改密码
		showChangePswd: function () {
			var self = this;
			 //取消这个绑定，以免回车点击再次发送登录命令
		    $("body").unbind("keydown keypress").bind("keydown", function(e){
				if(e.keyCode === 13) {
					self.doActive();
					_oScope.$apply();
				}
			});

			_oDialog.html({
				szTitle: _oTranslator.getValue("activeDevice"),
				szContent: $("#active").get(0),
				nWidth: 300,
				cbOk: function () {					
					self.doActive();
					_oScope.$apply();
					return false;
				},
				oButtons: {
					bOK: true
				}
			});

			$("#activePassword").focus();		
		},
		//激活
		doActive: function () {
			var self = this;
			var iLength = 1024;
			if(_oScope.activePassword !== _oScope.activePasswordConfirm) {
				_oDialog.alert(_oTranslator.getValue("passNotMatch"));
				return;
			}
			if(_oUtils.checkPasswordComplexity(_oScope.activePassword, _oScope.activeUsername)) {
				if($.browser.msie && parseInt($.browser.version, 10) < 9) {
					iLength = 256;
				}
				_oEncryption.encryptPassword(_oScope.activePassword, iLength, self.activeDevice);
			}
		},
		activeDevice: function (szPwd) {
			var oData = _oUtils.parseXmlFromStr("<?xml version='1.0' encoding='UTF-8'?><ActivateInfo><password>" + szPwd + "</password></ActivateInfo>");
			WebSDK.WSDK_Activate(_oCommon.m_szHostName, _oCommon.m_iHttpProtocal, _oCommon.m_iHttpPort, {
				cmd: "activate",
				type: "PUT",
				processData: false,
				data: oData,
				success: function (status, xmlDoc) {
					_oScope.username = _oScope.activeUsername;
					_oScope.password = _oScope.activePassword;
					$("#password").val(_oScope.password);
					_oScope.login();
				},
				error: function (status, xmlDoc, xhr) {
					_oResponse.saveState(xhr);
				}
			});
		}
	};

	module.exports = new Login();
});