define(function(require, exports, module) {
	
	function Translator() {
		this.szCurLanguage = "";
		this.oLastLanguage = null;
	}

	Translator.prototype = {
		// 初始化语言选择框
		initLanguageSelect: function (szLanguage, oCommon) {
			var self = this,
				szLanType = "";

			// 获取设备语言
			WebSDK.WSDK_DeviceLan(oCommon.m_szHostName, oCommon.m_iHttpProtocal, oCommon.m_iHttpPort, {
				noLogin: true,
				async: false,
				success: function (status, xmlDoc) {
					if ("chinese" == $(xmlDoc).find("Language").eq(0).find("type").eq(0).text()) {
						szLanType = "zh";
					} else {
						szLanType = "en";
					}
				}
			});

			// 获取程序支持的语言列表
			$.ajax({
				url: "../i18n/Languages.json?version=" + seajs.web_version,
				type: "GET",
				async: false,
				dataType: "json",
				success: function (oLan) {
					var arrLan = oLan.Languages,
						szOptions = "",
						arrNewLan = [];

					// 去除设备不支持的语言
					if (szLanType !== "") {
						$.each(arrLan, function (i) {
							if ("zh" === szLanType) {
								if (this.value !== "zh") {
									return true;
								}
							} else {
								if ("zh" === this.value) {
									return true;
								}
							}
							arrNewLan.push(this);
						});
					} else {
						arrNewLan = arrLan;
					}

					// 生成语言下拉框，默认语言赋值
					$.each(arrNewLan, function () {
						szOptions += "<div class='out' onmouseover='this.className=\"over\"' onmouseout='this.className=\"out\"' id='" + this.value + "' title='" + this.name + "'>" + this.name + "</div>";
						if (this.isDefault === true) {
							self.szCurLanguage = this.value;
						}
					});
					$(szOptions).appendTo("#language_list");
					
					// 判断浏览器语言是否在支持列表中
					if (szLanguage !== undefined && szLanguage !== null && szLanguage !== "") {
						$.each(arrNewLan, function (i) {
							if (this.value === szLanguage) {
								self.szCurLanguage = this.value;
							}
						});
					}
					
					// 语言未被设置过
					if ("" === self.szCurLanguage) {
						self.szCurLanguage = szLanType;
					}

					$.cookie("language", self.szCurLanguage);

					$("#current_language").html($("#" + self.szCurLanguage).html());
					$("#current_language").attr("title", $("#" + self.szCurLanguage).html());
				},
				error: function (json) {
				
				}
			});
		},
		// 获取语言
		getLanguage: function (szName) {
			var oJson = null;

			$.ajax({
				url: "../i18n/" + this.szCurLanguage + "/" + szName + ".json?version=" + seajs.web_version,
				type: "GET",
				async: false,
				cache: true,
				dataType: "json",
				success: function (oLan) {
					oJson = oLan;
				},
				error: function (json) {

				}
			});
			
			return (this.oLastLanguage = oJson);
		},
		// 追加语言
		appendLanguage: function (oLan, oLan2) {
			var oJson = null;

			oJson = $.extend(true, {}, oLan, oLan2);
						
			return (this.oLastLanguage = oJson);
		},
		// 获取值（第一级Key, 日志的下拉第一级Key返回的是对象，自行在逻辑代码中处理）
		getValue: function (szKey, aFormatStr) {
			if (null === this.oLastLanguage) {
				return "";
			} else {
				if (this.oLastLanguage[szKey]) {
					if ("undefined" == typeof aFormatStr) {
						return this.oLastLanguage[szKey];
					} else {
						//格式化语言
						var szLan = this.oLastLanguage[szKey];
						for (var i = 0; i < aFormatStr.length; i++) {
							szLan = szLan.replace("%s", aFormatStr[i]);
						}
						return szLan;
					}
				} else {
					return "";
				}
			}
		}
	};

	module.exports = new Translator();
});