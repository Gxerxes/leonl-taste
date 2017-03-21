define(function(require, exports, module) {
	require("layout");
	require("cookie");
	require("json2");
	require("angular");
	require("websdk");

	var _oBase64 = require("base64");
	var _oWebSession = require("webSession");
	var _oTranslator = require("translator");
	var _oUtils = require("utils");

	function Common() {
		this.m_szHostName = location.hostname;
		this.m_szHostNameOriginal = location.hostname;

		//this.m_szHostName = "10.10.39.205";
		//this.m_szHostName = "10.11.37.217";
		//this.m_szHostName = "10.7.36.253";
		//this.m_szHostName = "10.8.2.62";
	    //this.m_szHostName = "10.11.38.148";  //带有区域入侵侦测
		//this.m_szHostName = "10.10.32.43";
		//this.m_szHostName = "10.10.38.205";
		//this.m_szHostName = "10.10.38.205";
		//this.m_szHostName = "10.6.32.6";
		//this.m_szHostName = "10.6.32.64";
		//this.m_szHostName = "10.6.32.65";
		//this.m_szHostName = "10.6.33.36";
		//this.m_szHostName = "10.6.33.90";
		//this.m_szHostName = "10.6.33.137";
		//this.m_szHostName = "10.6.36.42";
		//this.m_szHostName = "10.17.130.244";

		//$.support.cors = true;
		
		this.m_iHttpPort = 80;
		this.m_szHttpProtocol = location.protocol + "//";
		this.m_iHttpProtocal = "http://" == this.m_szHttpProtocol ? 1 : 2;
		
		if (location.port != "") {
			this.m_iHttpPort = location.port;
		} else if (this.m_szHttpProtocol == "https://") {
			this.m_iHttpPort = 443;
		}

		if (this.m_szHostName.indexOf("[") > -1) {
			this.m_szHostNameOriginal = this.m_szHostName.substring(1, this.m_szHostName.length - 1);
		}
		if (_oUtils.isIPv6Address(this.m_szHostNameOriginal)) {
			this.m_szHostName = "[" + this.m_szHostNameOriginal + "]";
		}

		var oSearch = location.pathname.match(/\/doc\/page\/([^.]+).asp/);
		this.m_szPage = "";
		if (oSearch != null) {
			this.m_szPage = oSearch[1];
		}
		if ("" == this.m_szPage) {// 非法URL
			return;
		}

		this.m_oLanCommon = null;// 公共语言包
		this.m_szNamePwd = "";// 用户名密码(for WEB)
        this.m_szPluginNamePwd = "";  //用户名密码（for Plugin）
		this.m_szUsername = "";// 界面显示用户名
		this.m_bAnonymous = false;// 是否为匿名登录
		this.m_bDigest = true;  //是否是摘要认证（默认摘要认证）
	}

	Common.prototype = {
		// 初始化
		init: function () {
			var self = this;
			//设置全局ajax
			$.ajaxSetup({
				timeout: 30000, //默认超时时间为30秒
				beforeSend: function (xhr) {
					xhr.setRequestHeader("If-Modified-Since", "0");
				},
				statusCode: {
					401: function () {
						var nowDate = new Date();
						window.location.href = "login.asp?_" + nowDate.getTime() + "&page=" + self.m_szPage;
					},
					403: function (xml) {
						if (_oUtils.nodeValue(xml, "subStatusCode") == "notActivated") {
							var nowDate = new Date();
							window.location.href = "login.asp?_" + nowDate.getTime() + "&page=" + self.m_szPage;
						}
					}
				}
			});

			if (self.m_szPage != "login") {// 非登录页面处理
				self.m_szNamePwd = _oWebSession.getItem("userInfo");
				if (self.m_szNamePwd === null) {
					window.location.href = "login.asp?_" + (new Date()).getTime();
					return;
				}
				var szNamePwd = _oBase64.decode(self.m_szNamePwd);
				var oNamePwd = _oUtils.parseNamePwd(szNamePwd);
				self.m_szUsername = oNamePwd.szName;
				if ("anonymous" == self.m_szUsername) {// 匿名登录
					self.m_bAnonymous = true;
				}
                self.changeNamePWD(self.m_bAnonymous, oNamePwd.szName, oNamePwd.szPass);
				WebSDK.WSDK_SetLoginInfo(self.m_szHostName, self.m_iHttpProtocal, self.m_iHttpPort, oNamePwd.szName, oNamePwd.szPass);
				self.syncTime();
			}

			self.overrideAngular();
            self.initLan();
			self.initModule();
		},
        //调整用户名或密码
		changeNamePWD: function (bAnonymous, szUName, szPWD) {
			var self = this;
			var szFlag = "";
			if(self.m_bDigest) {  //若摘要认证
				szFlag = ":";
			}
			if (bAnonymous) {// 匿名登录
				self.m_szPluginNamePwd = _oBase64.encode(szFlag);
			} else {  //非匿名
				self.m_szPluginNamePwd = _oBase64.encode(szFlag + szUName + ":" + szPWD);
			}
        },
		// 调整大小
		resize: function (nWidth, nHeight) {
			// do nothing
		},
		// 初始化语言
		initLan: function () {
			var self = this;

			var szLanguage = $.cookie("language");
			if (null === szLanguage) {
				var sysLanguage = (navigator.language || navigator.browserLanguage).toLowerCase();
				szLanguage = sysLanguage.substring(0, 2);// 若后面需要支持繁体中文，此处需要修改
				if ("zh" == szLanguage) {// 中文需要区分简体和繁体   
					var arrSysLan = sysLanguage.split("-");
					if (2 == arrSysLan.length) {
						szLanguage = arrSysLan[0] + "_" + arrSysLan[1].toUpperCase();
						if ("cn" == arrSysLan[1]) {
							szLanguage = "zh";
						}
					}
				}
			}
			if ($("#language_list").length > 0) {
				_oTranslator.initLanguageSelect(szLanguage, self);
			} else {
				_oTranslator.szCurLanguage = szLanguage;
			}
			self.m_oLanCommon = _oTranslator.getLanguage("Common");
			
			// 底部版本信息
			$("#footer").text("©Hikvision Digital Technology Co., Ltd. All Rights Reserved.");
		},
		// 初始化样式
		initCSS: function () {
			// do nothing
		},
		// 初始化模块
		initModule: function () {
			var self = this;

			require.async(self.m_szPage, function (oModule) {
				if (oModule) {
					oModule.init();

					$(window).bind({
						unload: function () {
							try {
								oModule.unload();
							} catch (e) {
								
							}
						}
					});
				}
			});
		},
        //重载angular中指令等，以后需要修改angular可以放在这里
        overrideAngular: function(){
            //指令在module下，要重载指令需要先重载module,这边先克隆老的module用于新module中执行
            angular.oldModule = _oUtils.cloneFunc(angular.module);
            //
            angular.module = function(){
                //首先执行老module
                var oModule = angular.oldModule.apply(angular.oldModule, arguments);
                //移除老的ngBind
                oModule.config(function($provide){
                    $provide.decorator('ngBindDirective', ['$delegate', function($delegate) {
                        $delegate.shift();
                        return $delegate;
                    }]);
                });
                //自定义ngBind
                oModule.directive('ngBind',function (){
                    return {
                        restrict : 'A',
                        replace : false,
                        link : function(scope, element, attr){
                            element.addClass('ng-binding').data('$binding', attr.ngBind);
                            scope.$watch(attr.ngBind, function ngBindWatchAction(value) {
                                element.text(value == undefined ? '' : value);
                                if(!value || value == "") {
                                    return;
                                }
                                if(!element.is(":visible")) {
                                    return;
                                }
                                //获取多语言元素宽高
                                var iTextWidth = element.get(0).scrollWidth;
                                var iTextHeight = element.outerHeight(true);

                                //未显示等情况下scroll宽高为0
                                if (iTextWidth === 0) {
                                    //获取外层元素宽高
                                    iTextWidth = element.parent().width();
                                    iTextHeight = element.parent().outerHeight(true);
                                    //获取元素宽高
                                    var iInnerWidth = 0, iInnerHeight = $(element).outerHeight(true), iSiblings = element.siblings("input,label").length;

                                    //翻译元素可能和其他label,勾选框等在一起，此时计算所有的子元素宽度
                                    if(iSiblings == 1) {
                                        element.parent().children().each(function () {
                                            iInnerWidth += $(this).outerWidth(true);
                                        });
                                    } else {
                                        iInnerWidth += $(element).outerWidth(true);
                                    }

                                    //对宽高都进行比较，防止未设置宽度样式造成换行影响计算
                                    if ((iInnerWidth > iTextWidth || iInnerHeight > iTextHeight) && element.siblings().length <= 1) {
                                        element.parent().addClass("ellipsis").attr("title", $.trim(element.parent().text()));
                                    }
                                } else {
                                    var iSiblings = element.siblings("input,label").length;

                                    //是否和勾选框等在一起
                                    if(iSiblings == 1) {
                                        var iSiblingWidth = element.siblings("input,label").eq(0).outerWidth();
                                        if(iSiblingWidth + iTextWidth >= element.parent().width() || iTextHeight > element.parent().height()) {
                                            element.parent().addClass("ellipsis").attr("title", $.trim(element.parent().text()));
                                        }
                                        //内部字符串是否超长
                                    } else if (iTextWidth > element.width() || iTextHeight > element.height()) {
                                        element.addClass("ellipsis").attr("title", $.trim(element.text()));
                                        //是否超过父元素长度
                                    } else if(iTextWidth > element.parent().width() || iTextHeight > element.parent().height()) {
                                        element.parent().addClass("ellipsis").attr("title", $.trim(element.parent().text()));
                                    }
                                }
                            });
                        }
                    }
                });
                return oModule;
            };
        },
		//校时
		syncTime: function () {
			var self = this;
			if ("true" !== _oWebSession.getItem("timecorrect")) {
				return;
			}

			//只修改时区，保留夏令时的开始结束时间不变
			var szDeviceTimeZone = "";
			WebSDK.WSDK_GetDeviceConfig(self.m_szHostName, "timeInfo", null, {
                async: false,
                success: function (status, xmlDoc) {
                    szDeviceTimeZone = _oUtils.nodeValue(xmlDoc, "timeZone");
				}
            });

			var dtTimeNow = new Date();
			var szTimeZone = _oUtils.getTimeZone(dtTimeNow);
			var szXml = "<?xml version='1.0' encoding='utf-8'?><Time>";
			szXml += "<timeMode>timecorrect</timeMode>";
			szXml += "<localTime>" + _oUtils.dateFormat(dtTimeNow, "yyyy-MM-ddThh:mm:ss") + "Z" + "</localTime>";
			var iDSTPos = szDeviceTimeZone.indexOf("DST");
			if (iDSTPos != -1) {
				szXml += "<timeZone>" + szTimeZone + szDeviceTimeZone.substring(iDSTPos, szDeviceTimeZone.length) + "</timeZone>";
			} else {
				szXml += "<timeZone>" + szTimeZone + "</timeZone>";
			}
			szXml += "</Time>";

			WebSDK.WSDK_SetDeviceConfig(self.m_szHostName, "timeInfo", null, {
                async: false,
                data: szXml,
                success: function (status, xmlDoc) {                   
				}
            });
		}
	};

	module.exports = new Common();
});