define(function (require, exports, module) {
	function Utils() {

	}

	Utils.prototype = {
		// 计算字符串长度，一个双字节字符长度计2，ASCII字符计1
		lengthw: function (str) {
			return  str.replace(/[^\x00-\xff]/g, "rr").length;
		},
		// 是否为空字符串
		isEmpty: function (str) {
			var str = $.trim(str);
			return str.length == 0;
		},
		// 是否为特殊字符
		isSpecChar: function (str) {
			return /[%\u0027:\*\?<>\|\/\\\"]/.test(str);
		},
		// 是否为中文
		isChinese: function (str) {
			return /[^\x00-\xff]/.test(str);
		},
		// 是否为数字(整形、浮点型)
		isNumber: function (str) {
			return this.isInt(str) || this.isFloat(str);
		},
		// 是否为整型
		isInt: function (str) {
			return /^\d+$/.test(str);
		},
		// 是否为浮点型
		isFloat: function (str) {
			return /^\d+\.\d+$/.test(str);
		},
		// 是否为合法电子邮件地址
		isEmail: function (str) {
			return /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(str);
		},
		// 是否合法url地址
		isURL: function (str) {
			var regTextUrl = /^(file|http|https|ftp|mms|telnet|news|wais|mailto):\/\/(.+)$/;
			return regTextUrl.test(str);
		},
		// 是否为域名
		isDomain: function (str) {
			var regTextUrl = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
			return regTextUrl.test(str);
		},
		// 是否为HiDDNS
		isHiDDNS: function (str) {
			var regTextUrl = /^([a-z]|[a-z][-a-z0-9]{0,62}[a-z0-9])$/;
			return regTextUrl.test(str);
		},
		// 是否为合法的IP地址
		isIPAddress: function (str) {
			if (this.isIPv4Address(str) || this.isIPv6Address(str)) {
				return true;
			}
			return false;
		},
		// 是否为合法IPV4地址
		isIPv4Address: function(str) {
			if (str.length == 0) {
				return false;
			}
			var reVal = /^(\d{1}|\d{2}|[0-1]\d{2}|2[0-4]\d|25[0-5])\.(\d{1}|\d{2}|[0-1]\d{2}|2[0-4]\d|25[0-5])\.(\d{1}|\d{2}|[0-1]\d{2}|2[0-4]\d|25[0-5])\.(\d{1}|\d{2}|[0-1]\d{2}|2[0-4]\d|25[0-5])$/;
			return (reVal.test (str));
		},
		// 校验是否为有效的IPV6地址
		isIPv6Address: function (strInfo) {
			return /:/.test(strInfo) && strInfo.match(/:/g).length < 8 && /::/.test(strInfo) ? (strInfo.match(/::/g).length == 1 && /^::$|^(::)?([\da-f]{1,4}(:|::))*[\da-f]{1,4}(:|::)?$/i.test(strInfo)) : /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i.test(strInfo);
		},
		isIpMask: function (szMask) {
			var exp=/^(254|252|248|240|224|192|128|0)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(254|252|248|240|224|192|128|0)$/;
			return exp.test(szMask);
		},
		// 是否为多播地址
		isMulticastAddress: function (str) {
			var re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/; //匹配IP地址的正则表达式
			if (re.test(str)) {
				if (RegExp.$1 == 0 && RegExp.$2 == 0 && RegExp.$3 == 0 && RegExp.$4 == 0) {
					return true;
				}
				if (RegExp.$1 > 223 && RegExp.$1 < 240 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256) {
					return true;
				}
			}
			return false;
		},
		isCountry: function (str) {
			return /[A-Z][A-Z]/.test(str);
		},
		// 是否为D类地址 224.0.0.0 - 239.255.255.255
		isDIPAddress: function (_str) {
			var re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/; //匹配IP地址的正则表达式
			if (re.test(_str)) {
				/*if (RegExp.$1 == 0 && RegExp.$2 == 0 && RegExp.$3 == 0 && RegExp.$4 == 0) {
					return true;
				}*/
				if (RegExp.$1 > 0 && RegExp.$1 < 224 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256) {
					return true;
				}
			}
			return false;
		},
		// 字符转义
		encodeString: function (str) {
			return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		},
		// 字符反转
		decodeString: function (str) {
			return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
		},
		//创建xml DOM对象
		createXml: function () {
			var oXml;
			try {
				if($.browser.msie && parseInt($.browser.version, 10) === 9) {
					oXml = new ActiveXObject("Microsoft.XMLDOM");
				} else {
					oXml = document.implementation.createDocument("", "", null);
				}
			} catch (e) {
				oXml = new ActiveXObject("Microsoft.XMLDOM");
			}
			oXml.async="false";
			return oXml;
		},
		// 字符串转XML
		parseXmlFromStr: function (szXml) {
			if (null === szXml || "" === szXml) {
				return null;
			}
			szXml = szXml.replace(/&(?!lt;|amp;|gt;|apos;|quot;)/g, "&amp;");
			var oXml = null;
			try {
				if($.browser.msie && parseInt($.browser.version, 10) === 9) {
					var oXml = new ActiveXObject("Microsoft.XMLDOM");
					oXml.async = false;
					oXml.loadXML(szXml);
				} else {
					var oParser = new DOMParser();
					oXml = oParser.parseFromString(szXml, "text/xml");
				}
			} catch (e) {
				var oXml = new ActiveXObject("Microsoft.XMLDOM");
				oXml.async = false;
				oXml.loadXML(szXml);
			}
			return oXml;
		},
		// XML转字符串
		xmlToStr: function (oXml) {
			if (null == oXml) {
				return "";
			}

			var szXml = "";
			try {
				var oSerializer = new XMLSerializer();
				szXml = oSerializer.serializeToString(oXml);
			} catch (e) {
				try {
					szXml = oXml.xml;
				} catch (e) {
					return "";
				}
			}
			if (-1 == szXml.indexOf('<?xml')) {
				szXml = "<?xml version='1.0' encoding='utf-8'?>" + szXml;
			}

			return szXml;
		},
		// 获取XML节点值
		nodeValue: function (oNode, szItemName, szType, szValue) {
			var oItem = $(oNode).find(szItemName).eq(0);
			if (undefined === szValue) {
				var szText = oItem.text();
				if ("i" == szType) {
					return parseInt(szText, 10) || 0;
				} else if ("f" == szType) {
					return parseFloat(szText) || 0;
				} else if ("b" == szType) {
					return "true" == szText ? true : false;
				} else {
					return szText;
				}
			} else {			
				oItem.text(szValue);
				return this;
			}
		},
		// 获取XML节点属性值
		nodeAttr: function (oNode, szItemName, szAttrName, szType) {
			var szText = $(oNode).find(szItemName).eq(0).attr(szAttrName);			
			if ("i" == szType) {
				return parseInt(szText, 10) || 0;
			} else if ("f" == szType) {
				return parseFloat(szText) || 0;
			} else if ("b" == szType) {
				return "true" == szText ? true : false;
			} else {
				return szText;
			}			
		},
		// 日期加天数
		dayAdd: function (szDay, iAdd) {
			var oDate = new Date(Date.parse(szDay.replace(/\-/g, '/')));
			var oNewDate = new Date(oDate.getTime() + (iAdd * 24 * 60 * 60 * 1000));

			return this.dateFormat(oNewDate, "yyyy-MM-dd hh:mm:ss");
		},
		// 时间日期格式化
		dateFormat: function (oDate, fmt) {
			var o = {
				"M+": oDate.getMonth() + 1, //月份
				"d+": oDate.getDate(), //日
				"h+": oDate.getHours(), //小时
				"m+": oDate.getMinutes(), //分
				"s+": oDate.getSeconds(), //秒
				"q+": Math.floor((oDate.getMonth() + 3) / 3), //季度
				"S": oDate.getMilliseconds()//毫秒
			};
			if (/(y+)/.test(fmt)) {
				fmt = fmt.replace(RegExp.$1, (oDate.getFullYear() + "").substr(4 - RegExp.$1.length));
			}
			for (var k in o) {
				if (new RegExp("(" + k + ")").test(fmt)) {
					fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
				}
			}
			return fmt;
		},
		//转换成格式化UTC时间
		utcDateFormat: function (oDate, fmt) {
			var o = {
				"M+": oDate.getUTCMonth() + 1, //月份
				"d+": oDate.getUTCDate(), //日
				"h+": oDate.getUTCHours(), //小时
				"m+": oDate.getUTCMinutes(), //分
				"s+": oDate.getUTCSeconds(), //秒
				"q+": Math.floor((oDate.getUTCMonth() + 3) / 3), //季度
				"S": oDate.getUTCMilliseconds()//毫秒
			};
			if (/(y+)/.test(fmt)) {
				fmt = fmt.replace(RegExp.$1, (oDate.getUTCFullYear() + "").substr(4 - RegExp.$1.length));
			}
			for (var k in o) {
				if (new RegExp("(" + k + ")").test(fmt)) {
					fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
				}
			}
			return fmt;
		},
		//根据时间获取市区
		//dtTime：Date对象
		getTimeZone: function (dtTime) {
			var iTZOffset = dtTime.getTimezoneOffset();
			var iHour = Math.abs(parseInt(iTZOffset / 60));
			var dtStart = new Date();
			var dtMiddle = new Date(dtStart.getTime());

			dtStart.setMonth(0);
			dtStart.setDate(1);
			dtStart.setHours(0);
			dtStart.setMinutes(0);
			dtStart.setSeconds(0);
			dtMiddle.setMonth(6);
			dtMiddle.setDate(1);
			dtMiddle.setHours(0);
			dtMiddle.setMinutes(0);
			dtMiddle.setSeconds(0);

			if ((dtMiddle.getTimezoneOffset() - dtStart.getTimezoneOffset()) != 0) {
				if (iTZOffset == dtMiddle.getTimezoneOffset()) {
					if (iTZOffset < 0) {
						--iHour;
					} else {
						++iHour;
					}
				}
			}
			var iSecond = iTZOffset % 60;
			if (iSecond < 0) {
				iSecond = -iSecond;
			}
			var szPCTZ = "";
			if (iSecond === 0) {
				szPCTZ = "CST" + ((iTZOffset >= 0) ? "+" : "-") + iHour + ":00:00";
			} else if(iSecond === 30) {
				szPCTZ = "CST" + ((iTZOffset >= 0) ? "+" : "-") + iHour + ":30:00";
			} else if(iSecond === 45) {
				szPCTZ = "CST" + ((iTZOffset >= 0) ? "+" : "-") + iHour + ":45:00";
			}
			return 	szPCTZ;	
		},
		/*************************************************
		 Function:       convertToLocalTime
		 Description:    将UTC时间转换为设备本地时间
		 Input:          szUTCTime: UTC时间字符串
		 iDiffTime: 	PC本地时间与设备本地时间差
		 Output:         无
		 return:         本地时间字符串
		 *************************************************/
		convertToLocalTime: function (szUTCTime, iDiffTime) {
			if (!seajs.iDeviceType) {
				return szUTCTime;
			}
			szUTCTime = szUTCTime.replace('T', ' ').replace('Z', '');
			if (typeof iDiffTime == "undefined") {
				iDiffTime = 0;
			}
			var szFormat = "yyyy-MM-dd hh:mm:ss";
			var _aDate = szUTCTime.split(" ")[0].split("-");
			var _iFullYear = parseInt(_aDate[0], 10);
			var _iMonth = parseInt(_aDate[1], 10) - 1;
			var _iDay = parseInt(_aDate[2], 10);

			var _aTimes = szUTCTime.split(" ")[1].split(":");
			var _iHour = parseInt(_aTimes[0], 10);
			var _iMinute = parseInt(_aTimes[1], 10);
			var _iSecond = parseInt(_aTimes[2], 10);

			var _dLocalDate = new Date(Date.UTC(_iFullYear, _iMonth, _iDay, _iHour, _iMinute, _iSecond));
			_dLocalDate.setTime(_dLocalDate.getTime() + iDiffTime);
			return this.dateFormat(_dLocalDate, szFormat).replace(' ', 'T') + 'Z';
		},
		/*************************************************
		 Function:       convertToUTCTime
		 Description:    将本地时间转换为UTC时间
		 Input:          UTC时间字符串
		 szFormat: 转换格式，默认yyyy-MM-dd hh:mm:ss
		 Output:         无
		 return:         本地时间字符串
		 *************************************************/
		convertToUTCTime: function (szLocalTime, szFormat) {
			if (!seajs.iDeviceType) {
				return szLocalTime;
			}
			if (typeof szFormat == "undefined") {
				szFormat = "yyyy-MM-dd hh:mm:ss";
			}
			szLocalTime = szLocalTime.replace("T", " ").replace("Z", "");
			var _dLocalDate = new Date(Date.parse(szLocalTime.replace(/-/g, "/")));
			_dLocalDate = this.utcDateFormat(_dLocalDate, szFormat);
			_dLocalDate = _dLocalDate.replace(" ", "T") + "Z";
			return _dLocalDate;
		},
		// 执行正则表达式
		regexTest: function (szString, szPattern, szAttributes) {
			var oRegex = null;
			if (angular.isUndefined(szAttributes)) {
				oRegex = new RegExp(szPattern);
			} else {
				oRegex = new RegExp(szPattern, szAttributes);
			}
			return oRegex.test(szString);
		},
		// 获取IP地址类型
		checkAddressingType: function (szAddress, szIPVersion) {
			var szIpAddressType = "hostName";
			if (szIPVersion == 'v4') {
				if (this.isIPv4Address(szAddress) == true) {
					szIpAddressType = "ipAddress";
				}
			} else if (szIPVersion == 'v6') {
				if (this.isIPv6Address(szAddress) == true) {
					szIpAddressType = "ipv6Address";
				}
			} else {
				if (this.isIPv4Address(szAddress) == true) {
					szIpAddressType = "ipAddress";
				} else if(this.isIPv6Address(szAddress) == true) {
					szIpAddressType = "ipv6Address";
				}
			}
			return szIpAddressType;
		},
		//获取XML中节点对象
		getXmlNodeObject: function (xmlDoc, arrNodeNames) {
            if(!xmlDoc || !arrNodeNames) {
                return {};
            }
            var oCurNode, iLength = arrNodeNames.length, oResult = {};
            for(var i=0; i < iLength; i++) {
                oCurNode = $(xmlDoc).find(arrNodeNames[i]).eq(0);
                if(oCurNode.children().length == 0) {
                    oResult[arrNodeNames[i]] = oCurNode.text();
                    if(/^is|enable/i.test(arrNodeNames[i]) && (oResult[arrNodeNames[i]] == 'true' || oResult[arrNodeNames[i]] == 'false')) {
                        oResult[arrNodeNames[i]] = oResult[arrNodeNames[i]] == "true";
                    }
                } else {
                    oResult[arrNodeNames[i]] = oCurNode.get(0);
                }
            }
            return oResult;
		},
		//根据json对象设置相应的xml
		setXmlNodeObject: function(xmlDoc, oNodeList) {
			if(!xmlDoc || !oNodeList) {
				return {};
			}
			for(var key in oNodeList) {
				if(typeof oNodeList[key] == "string" || typeof oNodeList[key] == "number") {
					$(xmlDoc).find(key).text(oNodeList[key]);
				} else if(typeof oNodeList[key] == "boolean") {
					$(xmlDoc).find(key).text(oNodeList[key].toString());
				}
			}
		},
		validValue: function(Param) {
			if(typeof Param == "undefined") {
				return false;
			} else if(Param == null || Param === '' || isNaN(Param)) {
				return false;
			} else {
				return true;
			}
		},
		//获取url中的参数值
		getURIParam: function(szName, szUrl) {
			if(szUrl.indexOf("?") !== -1) {
				szUrl = szUrl.split("?")[1];
			}
			var reg = new RegExp("(^|&)" + szName + "=([^&]+\\[.*?\\]|[^&]*)(&|$)");

			var res = szUrl.match(reg);
			if (res === null) {
				return "";
			}
			return res[2];
		},
		// 移除页面上的错误提示
		removeValidTip: function () {
			$(".inputValidTip").remove();			
		},
		hideValidTip: function () {
			$(".inputValidTip").hide();			
		},
		showErrorTip: function (oText, szTips, oInputValid) {
			var oTipDiv = $(oText).data("validTipDiv");
			$(oText).css("border", "1px solid red");
			if (angular.isUndefined(oTipDiv)) {
				var oPos = $(oText).offset();
				var iElmWidth = $(oText).outerWidth();
				oTipDiv = $("<div class='inputValidTip border table-error'><i class='error'></i><label class='error-txt'>" + szTips + "</label></div>");
				oTipDiv.css({
					position: "absolute",
					left: oPos.left + iElmWidth - 215 + $("#view").parent().scrollLeft(),
					top: oPos.top - 36 + $("#view").parent().scrollTop()
				});
				$("#view").append(oTipDiv);
				$(oText).data("validTipDiv", oTipDiv);
			} else {
				oTipDiv.find(".error-txt").eq(0).text(szTips);
			}
			if ($(".table-error").length === 0) {
				oInputValid.bInputInValid = false;
			} else {
				oInputValid.bInputInValid = true;
			}
		},
		hideErrorTip: function (oText, oInputValid) {
			var oTipDiv = $(oText).data("validTipDiv");
			if (angular.isDefined(oTipDiv)) {
				oTipDiv.remove();
			}
			if ($(".table-error").length === 0) {
				oInputValid.bInputInValid = false;
			} else {
				oInputValid.bInputInValid = true;
			}
		},
		//数组除重,暂时仅支持字符串和数字数组, 默认不保留数组索引
		uniqueArray: function(arr, bKeepIndex){
			if(Object.prototype.toString.call(arr) !== '[object Array]') {
				return [];
			} else if (arr.length == 0){
				return [];
			}
			bKeepIndex = bKeepIndex ? true : false;
			var temp = {}, arrLength = arr.length, result = [];
			for(var i = 0; i < arrLength; i++) {
				if(typeof temp[arr[i]] != "undefined") {
					delete arr[i];
				} else {
					temp[arr[i]] = null;
				}
			}
			for(i = 0; i < arrLength; i++) {
				if(arr[i] == undefined) {
					if(bKeepIndex) {
						result[i] = undefined;
					}
				} else {
					result.push(arr[i]);
				}
			}
			return result;
		},
        //根据元素值删除数组中的某一项，会改变原始数组长度, arr:原始数组， iValue：要删除的值
        removeArrayItem: function (arr, iValue) {
            var index = -1;
            for(var i = 0, j = arr.length; i < j; i++) {
                if(iValue == arr[i]) {
                    index = i;
                    break;
                }
            }
            if (index != -1) {
                arr.splice(index, 1);
            }
            return arr;
        },
		// 解析用户名、密码
		parseNamePwd: function (szNamePwd) {
			var oRet = {
				szName: "",
				szPass: ""
			};
			if ("" == szNamePwd) {
				return oRet;
			}
			if (":" == szNamePwd.charAt(0)) {
				szNamePwd = szNamePwd.substring(1);
			}
			var nPos = szNamePwd.indexOf(":");
			if (nPos > -1) {
				oRet.szName = szNamePwd.substring(0, nPos);
				oRet.szPass = szNamePwd.substring(nPos + 1);
			}

			return oRet;
		},
		checkNumber: function(num, iDefault) {
			var iGoodValue = iDefault;
			if (this.isNumber(new Object(num).toString())) {
				iGoodValue = Number(num);
			}
			return iGoodValue;
		},
		replaceAll: function (szData, szDir, szTar) {
			var aData;
            if ("object" !== typeof szData) {
                aData = [szData];
            } else {
            	aData = szData;
            }

            var oReg = new RegExp(szDir, "g"),
                aTarData = [];
             $.each(aData, function () {
                aTarData.push(this.replace(oReg, szTar));
            });


            if (szData !== aData) {//传入的数据为字符串
           		return aTarData[0];
           	} else {
           		return aTarData;
           	}
        },
        //获取一个点
        getNewPoint: function (x, y) {
            var oPoint = {
                iX: -1, //x坐标
                iY: -1  //y坐标
            };
            if (2 == arguments.length) {
                oPoint.iX = x;
                oPoint.iY = y;
            }
            return oPoint;
        },
        /*************************************************
         Function:        PointPosTrans
         Description:    协议转化x，只需要归一化，y需要1-归一化
         Input:          iType：0-设备转成插件所需归一化；1-归一化的转成设备所需
         bJian:是否是y轴，需要1-操作
         iPosVal: 坐标参数；iNormalized：归一参考值
         iDefault：默认值
         Output:            无
         return:            oPoint
         *************************************************/
        pointPosTrans: function(iType, bJian, iPosVal, iNormalized) {
            var iRetrunVal = 0;
            if (!isNaN(iPosVal)) {
                iRetrunVal = iPosVal;
            }
            if (0 == iType) {  //设备转成插件所需归一化
                if (bJian) {
                    iRetrunVal = parseFloat(1 - parseFloat(iPosVal / iNormalized)).toFixed(4);
                } else {
                    iRetrunVal = parseFloat(iPosVal / iNormalized).toFixed(4);
                }
            } else {
                if (bJian) {
                    iRetrunVal = parseInt((1 - iPosVal) * iNormalized, 10);
                } else {
                    iRetrunVal = parseInt(iPosVal * iNormalized, 10);
                }
            }
            return iRetrunVal;
        },        
        polygonVaildCheck: function (aPoints) {        	
		    var iLen = aPoints.length;
		    if (iLen < 4) {  //多边形点数不可能小于4
		        return true;
		    }

		    for(var i = 2; i < iLen; ++i) {
		        for(var j = 0; j <= i - 2; ++j) {
		            if(i == iLen -1 && j == 0) {
		                continue;
		            }

		            if(this.checkLineIntersect(aPoints[i], typeof aPoints[i + 1] == "object" ? aPoints[i + 1] : aPoints[0], aPoints[j], aPoints[j + 1])) {
		                return false;
		            }
		        }
		    }
		    return true;
        },
        checkLineIntersect: function (a1, a2, b1, b2) {
		    var ua_t = (b2.iX - b1.iX) * (a1.iY - b1.iY) - (b2.iY - b1.iY) * (a1.iX - b1.iX);
		    var ub_t = (a2.iX - a1.iX) * (a1.iY - b1.iY) - (a2.iY - a1.iY) * (a1.iX - b1.iX);
		    var u_b  = (b2.iY - b1.iY) * (a2.iX - a1.iX) - (b2.iX - b1.iX) * (a2.iY - a1.iY);

		    if (u_b != 0) {
		        var ua = ua_t / u_b;
		        var ub = ub_t / u_b;

		        if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
		            return true;
		        } else {
		            return false;
		        }
		    } else {
		        if ( ua_t == 0 || ub_t == 0 ) {
		            return true;
		        } else {
		            return false;
		        }
		    }
		},
        /******客流量统计和热度图统计绘图用***start***/
        //根据日期返回当前选中月的天数  szSelTime: 日历中选择的时间 2014-01-01T01:00:00Z
        getMaxDaysOnMoth: function (szSelTime) {
            var myDate = new Date(this.getMillisecondsFromString(szSelTime));
            var year = myDate.getFullYear();
            var month = myDate.getMonth()+1;
            var dayNum = new Date(year, month, 0).getDate();
            return dayNum;
        },
        //根据日期字符串获取毫秒  szDate; //yy-mm-ddThh:mm:ssZ  返回的结果是类似'2014-01-01T2014-01-31'
        getMillisecondsFromString: function (szDate) {
            var arrDay = szDate.replace('T', ' ').replace('Z', '');
            var iMilliseconds = 0;
            arrDay = this.replaceAll(arrDay, '-', '/');
            try {
                iMilliseconds = Date.parse(arrDay);
            } catch (e) {}
            return iMilliseconds;
        },
        //根据统计类型获取开始时间和结束时间  CountType; 统计类型:daily weekly monthly yearly
        // 返回的结果是类似'2014-01-01 01:00:00||2014-01-31 23:59:59'
        getDayInfoByType: function (CountType,szSelTime) {
            var szSHour = " 00:00:00";
            var szEHour = " 23:59:59";
            var szStartTime = "";
            var szEndTime = "";
            var oTime = null;
            var oDataString = "";
            if ('daily' == CountType) {
                szStartTime = szSelTime.split('T')[0] + szSHour;  //只获取年月日部分
                szEndTime = szSelTime.split('T')[0] + szEHour;
            } else if ('weekly' == CountType) {  //计算当前选中天的这周的第一天和最后一天
                oDataString = this.getFirstAndLastDayOnWeek(this.getMillisecondsFromString(szSelTime));  //返回的结果是类似'2014-03-24T2014-03-30'
                szStartTime = oDataString.split('T')[0] + szSHour;
                szEndTime = oDataString.split('T')[1] + szEHour;
            } else if ('monthly' == CountType) {  //计算当前选中天的这个月的第一天和最后一天
                oDataString = this.getFirstAndLastDayOnMonth(this.getMillisecondsFromString(szSelTime));  //返回的结果是类似'2014-01-01T2014-01-31'
                szStartTime = oDataString.split('T')[0] + szSHour;
                szEndTime = oDataString.split('T')[1] + szEHour;
            } else if ('yearly' == CountType) {
                szStartTime = szSelTime.split('-')[0] + '-01-01' + szSHour;
                szEndTime = szSelTime.split('-')[0] + '-12-31' + szEHour;
            }
            return szStartTime + "||" + szEndTime;
        },
        //根据选中的日期时间来获取当月的第一天和最后一天  oTime; Time类型 返回的结果是类似'2014-01-01T2014-01-31'
        getFirstAndLastDayOnMonth: function(oTime) {
            //当月第一天和最后一天
            var myDate = new Date(oTime);
            var year = myDate.getFullYear();
            var month = myDate.getMonth()+1;
            if (month < 10){
                month = "0"+month;
            }
            var firstDay = year + "-" + month + "-" + "01";
            //alert("firstDay: " + firstDay);
            myDate = new Date(year,month,0);
            var lastDay = year+"-"+ month +"-" + myDate.getDate();
            //alert("lastDay: " + lastDay);
            return firstDay + "T" + lastDay;
        },
        //根据选中的日期时间来获取当周的第一天和最后一天  oTime; 毫秒及  返回的结果是类似'2014-03-24T2014-03-30'
        getFirstAndLastDayOnWeek: function(oTime) {
            var time = new Date(oTime);
            var firstDay = '';
            var lastDay = '';
            var szYear = '';
            var szMonth = '';
            var szDay = '';
            var iSunDayMMS = 0;  //星期天是毫秒值
            var iCurDayMMS = 0;  //当前日子的好秒值
            var iMonDayMMS = 0;  //周一的毫秒值
            var iCurDay = time.getDay(); //当前选中时星期几
            var iFindSunIndex = 0; //到星期天还差几天

            if (iCurDay == 0) {  //(0~6)周日的话，则算上周时间,即选中天为本周最后一天
                szYear = time.getFullYear();
                szMonth = time.getMonth()+1;
                if (szMonth < 10){
                    szMonth = "0"+szMonth;
                }
                szDay = time.getDate();
                if (szDay < 10) {
                    szDay = "0" + szDay;
                }

                lastDay = szYear + '-' + szMonth + '-' + szDay;
            } else {  //非周日情况 7-星期索引，即可知道需要往前几天得到周日，往后几天得到周日
                iFindSunIndex = 7 - iCurDay;  //0-当前就是星期天 1-周六 ...
                iCurDayMMS = time.getTime();
                iSunDayMMS = iCurDayMMS + 3600*1000*24*iFindSunIndex; //当前毫秒加上差额时间，获取周日时间
                time.setTime(iSunDayMMS);
                szYear = time.getFullYear();
                var szMonth = time.getMonth()+1;
                if (szMonth < 10){
                    szMonth = "0"+szMonth;
                }
                szDay = time.getDate();
                if (szDay < 10) {
                    szDay = "0" + szDay;
                }
                lastDay = szYear + '-' + szMonth + '-' + szDay;
            }
            //找到周日后
            iSunDayMMS = time.getTime();  //当前星期天的毫秒，需要减去6天时间，即可获取周一时间
            iMonDayMMS = iSunDayMMS - 3600*1000*24*6;
            time.setTime(iMonDayMMS);
            szYear = time.getFullYear();
            szMonth = time.getMonth()+1;
            if (szMonth < 10){
                szMonth = "0"+szMonth;
            }
            szDay = time.getDate();
            if (szDay < 10) {
                szDay = "0" + szDay;
            }
            firstDay = szYear + '-' + szMonth + '-' + szDay;
            return firstDay + "T" + lastDay;
        },
        max: function (aData) {
        	var iResult =  -Infinity;
        	for (var i = 0, len = aData.length; i < len; ++i) {
        		if (iResult < aData[i]) {
        			iResult = aData[i];
        		}
        	}
        	return iResult;
        },
        cloneFunc: function(fn) {
            return function tempo(){return fn.apply(this, arguments)};
        },
        //查密码复杂度
        checkPasswordComplexity: function (szPwd, szUser) {
			var iResult = 0;
			szPwd.match(/[a-z]/g) && iResult++;
			szPwd.match(/[A-Z]/g) && (iResult += iResult ? 2 : 1);
			szPwd.match(/[0-9]/g) && iResult++;
			szPwd.match(/[^a-zA-Z0-9]/g) && (iResult += iResult ? 2 : 1);
			if (szPwd.length < 8 || szPwd === szUser || szPwd === szUser.split("").reverse().join("")) {
				iResult = 0;
			}
			iResult && iResult--;
			iResult = iResult > 3 ? 3 : iResult;
			return iResult;
		},
		//字典序比较两个数组，可用于比较时间等大小
		compareDict: function (aData1, aData2) {
			var bRet = 0;
			for (var i = 0, len = aData1.length; i < len; ++i) {
				if (aData1[i] > aData2[i]) {
					bRet = 1;
					break;
				} else if (aData1[i] < aData2[i]) {
					bRet = -1;
					break;
				}
			}
			return bRet;
		},
		//获取时间差
		//szTime1: 12:20:30
		getTimeOffset: function (szTime1, szTime2) {
			var aTimes1 = szTime1.split(":");
			var aTimes2 = szTime2.split(":");
			var iDiff = 0;
			var iSecond1 = aTimes1[0] * 3600 + aTimes1[1] * 60 + aTimes1[2];
			var iSecond2 = aTimes2[0] * 3600 + aTimes2[1] * 60 + aTimes2[2];
			return iSecond1 - iSecond2;
		}
	};

	module.exports = new Utils();
});