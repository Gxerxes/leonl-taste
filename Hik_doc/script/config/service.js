define(function(require, exports, module) {

	var _oCommon, _oTranslator, _oUtils, _oDialog, _oDevice, _oPlugin, _oService;

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");
	_oDialog = require("dialog");

	_oDevice = require("isapi/device");
	_oPlugin = require("common/plugin");
	_oService = require("service");

	function Service() {
		this.m_oAnalogChannel = null;			// 模拟通道XmlDoc
		this.m_iAnalogChannelNum = 0;			// 模拟通道数
		this.m_aAnalogChannelId = [];			// 模拟通道所有ID
		this.m_aOnlineAnalogChannelId = [];		// 模拟通道所有在线ID
		this.m_oDigitalChannel = null;			// 数字通道XmlDoc
		this.m_oDigitalChannelStatus = null;	// 数字通道状态XmlDoc
		this.m_iDigitalChannelNum = 0;			// 数字通道数
		this.m_aDigitalChannelId = [];			// 数字通道所有ID
		this.m_aOnlineDigitalChannelId = [];	// 数字通道所有在线ID

		this.m_oAnalogAlarmOutput = null;		// 模拟报警输出XmlDoc
		this.m_iAnalogAlarmOutputNum = 0;		// 模拟报警输出数
		this.m_aAnalogAlarmOutputId = [];		// 模拟报警输出所有的ID值：O-1  O-2 ……
		this.m_oDigitalAlarmOutput = null;		// 数字报警输出XmlDoc
		this.m_iDigitalAlarmOutputNum = 0;		// 数字报警输出数
		this.m_aDigitalAlarmOutputId = [];		// 数字报警输出所有的ID值：O-1901 O-2101 ……
		this.m_oDrawBtn = {						// 画图按钮
			bDraw: false
		};

		this.m_iChannelId = 0;					// 下拉框当前选中的通道ID
		this.m_szModule = "";						// 当前模块

		var iStartIndex = navigator.appVersion.indexOf("Chrome/");
		var iChromeVersion = parseInt(navigator.appVersion.substring(iStartIndex+7, iStartIndex+9), 10);
		this.m_bChromeNotSupportNpapi = (iChromeVersion > 41);
	}

	Service.prototype = {
		// 公共数据初始化
		init: function () {
			var self = this;

			self.m_iChannelId = 0;
			self.getChannel();
		},
		// 获取通道
		getChannel: function () {
			var self = this,
				oChannelList = null;

			self.m_oAnalogChannel = _oDevice.getChannel(_oDevice.m_oChannelType.ANALOG);
			oChannelList = $(self.m_oAnalogChannel).find("VideoInputChannel");
			self.m_iAnalogChannelNum = oChannelList.length;

			// 清空数组
			self.m_aAnalogChannelId.length = 0;
			self.m_aOnlineAnalogChannelId.length = 0;
			$.each(oChannelList, function (i) {
				if (0 == self.m_iChannelId && ("" == _oUtils.nodeValue(this, "videoInputEnabled")/*前端设备没有这个节点*/ || "true" == _oUtils.nodeValue(this, "videoInputEnabled"))) {
					self.m_iChannelId = _oUtils.nodeValue(this, "id", "i");
				}
				if ("" == _oUtils.nodeValue(this, "videoInputEnabled")/*前端设备没有这个节点*/ || "true" == _oUtils.nodeValue(this, "videoInputEnabled")) {
					self.m_aOnlineAnalogChannelId.push(_oUtils.nodeValue(this, "id", "i"));
				}
				self.m_aAnalogChannelId.push(_oUtils.nodeValue(this, "id", "i"));
			});

			self.m_oDigitalChannelStatus = _oDevice.getChannelStatus();
			oChannelList = $(self.m_oDigitalChannelStatus).find("InputProxyChannelStatus");
			self.m_iDigitalChannelNum = oChannelList.length;

			// 清空数组
			self.m_aDigitalChannelId.length = 0;
			self.m_aOnlineDigitalChannelId.length = 0;
			$.each(oChannelList, function (i) {
				if (0 == self.m_iChannelId && "true" == _oUtils.nodeValue(this, "online")) {
					self.m_iChannelId = _oUtils.nodeValue(this, "id", "i");
				}
				if ("true" == _oUtils.nodeValue(this, "online")) {
					self.m_aOnlineDigitalChannelId.push(_oUtils.nodeValue(this, "id", "i"));
				}
				self.m_aDigitalChannelId.push(_oUtils.nodeValue(this, "id", "i"));
			});
		},
		// 开启预览
		startPlay: function () {
			var self = this,
				szPathInfo = '',
				oXmlDoc = null,
				iProtocolType = -1,
				iChannelId = self.m_iChannelId;

			if (!_oPlugin.isInstalled()) {
				return -1;
			}

			_oPlugin.stop(0);

			szPathInfo = _oPlugin.getLocalConfig();
			oXmlDoc = _oUtils.parseXmlFromStr(szPathInfo);
			if (_oDevice.m_oDeviceCapa.bSupportStreamEncrypt) {
				_oPlugin.setSecretKey(1, _oUtils.nodeValue(oXmlDoc, "SecretKey"));
			}

            iProtocolType = _oUtils.nodeValue(oXmlDoc, "ProtocolType", "i");
            if (0 == seajs.iDeviceType) {  //是否是后端设备
                if (4 == iProtocolType) {// 目前后端不支持http,前端支持
                    $(oXmlDoc).find("ProtocolType").eq(0).text("0");
                    _oPlugin.setLocalConfig(_oUtils.xmlToStr(oXmlDoc));
                    iProtocolType = 0;
                }
            }

			var iPort, szProtocol, szUrl;
			if (_oCommon.m_szHttpProtocol === "https://") {
				iPort = _oDevice.m_oDevicePort.iSHttpPort;
			} else {
				iPort = _oCommon.m_iHttpPort;
			}
			if (_oDevice.m_oSHttpCapa.bSupportShttpPlayback && 0 == iProtocolType || this.m_bChromeNotSupportNpapi) {// 私有预览
				if (_oDevice.m_oSHttpCapa.bSupportShttpsPlayback) {					
					szProtocol = _oCommon.m_szHttpProtocol;
				} else {
					szProtocol = "http://";
				}
				if (iChannelId <= self.m_iAnalogChannelNum) {
					szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort + "/SDK/play/" + iChannelId * 100 + "/004";
				} else {
					var iDigitalChanId = _oDevice.m_oSHttpCapa.iIpChanBase + iChannelId - self.m_iAnalogChannelNum - 1;
					szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort + "/SDK/play/" + iDigitalChanId * 100 + "/004";
				}
			} else {
				if (iProtocolType != 4) {  //rtsp标准取流
					iPort = _oDevice.m_oDevicePort.iRtspPort;
				}
				szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + iPort + "/PSIA/streaming/channels/" + (iChannelId * 100 + 1);
			}

			if (0 === _oPlugin.play(szUrl, _oCommon.m_szPluginNamePwd, 0, "", "")) {
				_oService.m_aWndList[_oService.m_iWndIndex].bPlay = true;
				_oService.m_aWndList[_oService.m_iWndIndex].iChannelId = iChannelId;
				_oService.m_aWndList[_oService.m_iWndIndex].iChannelPlayIndex = 0;
                return 0;
			} else {
				_oService.m_aWndList[_oService.m_iWndIndex].bPlay = false;
				_oService.m_aWndList[_oService.m_iWndIndex].iChannelId = iChannelId;
				_oService.m_aWndList[_oService.m_iWndIndex].iChannelPlayIndex = -1;
				_oDialog.alert(_oTranslator.getValue("previewFailed"));
                return -1;
			}
		},
		getCurrentChannelXml: function () {
			var self = this;
			var xmlDoc = null;
			if (this.m_iChannelId <= this.m_iAnalogChannelNum) {
				xmlDoc = this.m_oAnalogChannel;
			} else {
				if (this.m_oDigitalChannel === null) {
					WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "DigitalChannelInfo", null, {
						async: false,
						success: function (status, xmlDoc) {
							self.m_oDigitalChannel = xmlDoc;
						}
					});
				}
				xmlDoc = this.m_oDigitalChannel;
			}
			$(xmlDoc).find("id").each(function () {
				if ($(this).text() === ("" + self.m_iChannelId)) {
					xmlDoc = $(this).parent().clone(true).get(0);
					return false;
				}
			});
			var xmlDocTemp = _oUtils.createXml();
			xmlDocTemp.appendChild(xmlDoc);
			xmlDoc = xmlDocTemp;
			return xmlDoc;
		},
		// 获取报警输出
		getAlarmOutput: function () {
			var self = this,
				oAlarmList = null;

			// 模拟报警输出
			self.m_oAnalogAlarmOutput = _oDevice.getAlarmOutput(_oDevice.m_oAlarmOutputType.ANALOG);
			oAlarmList = $(self.m_oAnalogAlarmOutput).find("IOOutputPort");
			self.m_iAnalogAlarmOutputNum = oAlarmList.length;

			self.m_aAnalogAlarmOutputId = [];// 清空数组
			$.each(oAlarmList, function () {
				self.m_aAnalogAlarmOutputId.push(_oUtils.nodeValue(this, "id"));
			});

			// 数字报警输出
			self.m_oDigitalAlarmOutput = _oDevice.getAlarmOutput(_oDevice.m_oAlarmOutputType.DIGITAL);
			oAlarmList = $(self.m_oDigitalAlarmOutput).find("IOProxyOutputPort");
			self.m_iDigitalAlarmOutputNum = oAlarmList.length;

			self.m_aDigitalAlarmOutputId = [];// 清空数组
			$.each(oAlarmList, function () {
				self.m_aDigitalAlarmOutputId.push(_oUtils.nodeValue(this, "id"));
			});
		},
		// 开始/停止画图
		drawArea: function () {
			var self = this;
			self.m_oDrawBtn.bDraw = !self.m_oDrawBtn.bDraw;
			_oPlugin.setDrawStatus(self.m_oDrawBtn.bDraw);
		},
		// 清除所画区域
		clearDraw: function () {
			_oDialog.confirm(_oTranslator.getValue("clearDrawArea"), null, function () {
				_oPlugin.clearRegion();
			});
		},
		// 是否支持PTZ锁定
		isPTZLock: function () {
			var self = this,
				bPTZLock = false;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "lockPTZ", {channel: self.m_iChannelId}, {
				async: false,
				success: function () {
					bPTZLock = true;
				},
				error: function () {
					bPTZLock = false;
					/*WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "lockPTZIntelligent", {channel: self.m_iChannelId}, {
						async: false,
						success: function () {
							bPTZLock = true;
						}
					});*/
				}
			});

			return bPTZLock;
		},
		// 区间范围有效性控制
		rangeValid: function (iValue, iMin, iMax) {
			var iRetValue = iValue;
			if ((typeof iValue=='number') && (typeof iMin=='number') && (typeof iMax=='number')) {  //是否是数值
				if (iValue < iMin) {
					iRetValue = iMin;
				} else if (iValue > iMax) {
					iRetValue = iMax;
				}
			}
			return iRetValue;
		},
		// 多边形线段交叉检测
		checkPolygonValid: function (aPoint) {
			var self = this;

			var iLength = aPoint.length;
			if (iLength < 4) {  //多边形点数不可能小于4
				return true;
			}
			for (var i = 2; i < iLength; i++) {
				for (var j=0; j <= i - 2; j++) {
					if (i == iLength -1 && j == 0) {
						continue;
					}
					if (self.checkLineIntersect(aPoint[i], typeof aPoint[i + 1] == 'object' ? aPoint[i + 1] : aPoint[0], aPoint[j], aPoint[j + 1])) {
						return false;
					}
				}
			}
			return true;
		},
		// 两线段是否交叉
		checkLineIntersect: function (a1, a2, b1, b2) {
			var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
			var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
			var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

			if (u_b != 0) {
				var ua = ua_t / u_b;
				var ub = ub_t / u_b;

				if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
					return true;
				} else {
					return false;
				}
			} else {
				if (ua_t == 0 || ub_t == 0) {
					return true;
				} else {
					return false;
				}
			}
		},
		/*************************************************
		 Function:      createNgOptions
		 Description:   创建ng-options映射数组
		 Input:         aCapas: 能力集合
		 aNames：对应的名称集合
		 aValues：对应的键值集合
		 Output:        aOpts：ng-options
		 return:        无
		 *************************************************/
		createNgOptions: function (aCapas, aNames, aValues, aOpts) {
			aOpts.length = 0;
			for (var i = 0; i < aCapas.length; i++) {
				var szName = aCapas[i];
				var szValue = aCapas[i];
				var iPos = $.inArray(szValue, aValues);
				if (iPos >= 0) {
					if (aNames[iPos].charAt(0) === '#') {
						szName = aNames[iPos].substring(1);
					} else {
						szName = _oTranslator.getValue(aNames[iPos]);
					}
				}
				aOpts.push({name: szName, value: szValue});
			}
		}
	};

	module.exports = new Service();
});


