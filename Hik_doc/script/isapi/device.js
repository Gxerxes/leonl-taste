define(function(require, exports, module) {	
	var _oCommon, _oUtils, _oDialog;

	_oCommon = require("common");
	_oUtils = require("utils");
	_oDialog = require("dialog");

	function Device() {
		this.m_oSHttpCapa = {};// 私有取流能力
		this.m_oDeviceInfo = {};// 设备信息
		this.m_oDeviceCapa = {};// 设备能力
		this.m_oDevicePort = {// 设备端口
			iSHttpPort: 80,	// https登录时获取http端口私有预览
			iRtspPort: 554,
			iManagePort: 8000
		};
		this.m_oWait = null;  //等待弹出框
		// 通道类型
		this.m_oChannelType = {
			ANALOG: "AnalogChannelInfo",
			DIGITAL: "DigitalChannelInfo",
			ZERO: "ZeroChannelInfo"
		};
		// 报警输出类型
		this.m_oAlarmOutputType = {
			ANALOG: "AnalogAlarmOutputInfo",
			DIGITAL: "DigitalAlarmOutputInfo"
		};
		// 报警输入类型
		this.m_oAlarmInputType = {
			ANALOG: "AnalogAlarmInputInfo",
			DIGITAL: "DigitalAlarmInputInfo"
		};
		// 设备与本地时间差
		this.m_iDeviceMinusLocalTime = 0;
		if (!_oCommon.m_bAnonymous) {
			this.getDeviceMinusLocalTime();
			this.getDeviceInfo();
			this.getDeviceCapa();
            this.getVCAResource();
            this.getTrafficCap(1);  //取证暂时写死通道1
	   		this.getDisplayParamSwitchSupport();
            this.getTHScreenSupport();
            this.isSupportPrivacyMask();
            // this.getPanoramicMapCap();
		}
		this.getSHttpCapa();
		this.getRTSPPort();
	}
	
	Device.prototype = {
		// 获取私有取流能力
		getSHttpCapa: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "sHttpCapa", null, {
				async: false,
				success: function (status, xmlDoc) {
					self.m_oSHttpCapa.bSupportShttpPlay = _oUtils.nodeValue(xmlDoc, "isSupportHttpPlay", "b");
					self.m_oSHttpCapa.bSupportShttpPlayback = _oUtils.nodeValue(xmlDoc, "isSupportHttpPlayback", "b");
					self.m_oSHttpCapa.bSupportShttpsPlay = _oUtils.nodeValue(xmlDoc, "isSupportHttpsPlay", "b");
					self.m_oSHttpCapa.bSupportShttpsPlayback = _oUtils.nodeValue(xmlDoc, "isSupportHttpsPlayback", "b");
					self.m_oSHttpCapa.bSupportShttpPlaybackTransCode = _oUtils.nodeValue(xmlDoc, "isSupportHttpTransCodePlayback", "b");
					self.m_oSHttpCapa.bSupportShttpsPlaybackTransCode = _oUtils.nodeValue(xmlDoc, "isSupportHttpsTransCodePlayback", "b");

					if ($(xmlDoc).find("ipChanBase").length > 0) {
						self.m_oSHttpCapa.iIpChanBase = _oUtils.nodeValue(xmlDoc, "ipChanBase", "i");
					}

					if ($(xmlDoc).find("transCodePlaybackCap").length > 0) {
						self.m_oSHttpCapa.aTransCodeResolution = $(xmlDoc).find("transCodePlaybackchannelList").eq(0).find("resolution").eq(0).attr("opt").split(",");
					} else {
						self.m_oSHttpCapa.aTransCodeResolution = ["255"];
					}
				}
			});
		},
		// 获取设备信息
		getDeviceInfo: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "deviceInfo", null, {
				async: false,
				success: function (status, xmlDoc) {
					self.m_oDeviceInfo.szDeviceType = _oUtils.nodeValue(xmlDoc, "deviceType");
					self.m_oDeviceInfo.szModel = _oUtils.nodeValue(xmlDoc, "model");
					self.m_oDeviceInfo.szDeviceName = _oUtils.nodeValue(xmlDoc, "deviceName");
					/*if ("" == self.m_oDeviceInfo.szDeviceName) {
						self.m_oDeviceInfo.szDeviceName = "Embedded Net DVR";
					}*/
				}
			});
		},
		getDeviceMinusLocalTime: function () {
			var self = this;
			self.m_iDeviceMinusLocalTime = 0;
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "timeInfo", null, {
				async: false,
				success: function (status, xmlDoc) {
					//设备时间
					var szDeviceTime = _oUtils.nodeValue(xmlDoc, "localTime").substring(0, 19);
					var arDTms = szDeviceTime.match(/(\d+)-(\d+)-(\d+)(\D+)(\d+):(\d+):(\d+)/);
					if (arDTms.length !== 8) {
						return;
					}
					var dtDeviceDate = new Date(arDTms[1], arDTms[2] - 1, arDTms[3], arDTms[5], arDTms[6], arDTms[7]);
					//设备夏令时
					var szTimeZone = _oUtils.nodeValue(xmlDoc, "timeZone");
					var iDSTTime = 0;
					var iDSTPos = szTimeZone.indexOf("DST");
					if (iDSTPos != -1) {
						var dtDSTStart = new Date(dtDeviceDate.getTime());
						dtDSTStart.setMinutes(0);
						dtDSTStart.setSeconds(0);
						var dtDSTStop = new Date(dtDeviceDate.getTime());
						dtDSTStop.setMinutes(0);
						dtDSTStop.setSeconds(0);
						var szDSTStartTime = szTimeZone.split(",")[1];
						var szDSTStopTime = szTimeZone.split(",")[2];
						//计算夏令时的开始时间
						var iDSTStartMonth = parseInt(szDSTStartTime.split(".")[0].replace("M", ""), 10);
						dtDSTStart.setMonth(iDSTStartMonth - 1);
						var iDSTStartWeek = parseInt(szDSTStartTime.split(".")[1], 10);
						var iDSTStartDay = parseInt(szDSTStartTime.split(".")[2].split("/")[0]);
						var iDSTStartTime = parseInt(szDSTStartTime.split(".")[2].split("/")[1].split(":")[0], 10);
						dtDSTStart.setHours(iDSTStartTime);
						var iTime = 0;
						var iDate = 0;
						for (var i = 1; i <= 31; i++) {
							dtDSTStart.setDate(i);
							//当月没有此天
							if (dtDSTStart.getMonth() !== (iDSTStartMonth - 1)) {
								break;
							}
							if (dtDSTStart.getDay() == iDSTStartDay) {
								iTime++;
								iDate = i;
								if (iTime == iDSTStartWeek) {
									break;
								}
							}
						}
						dtDSTStart.setDate(iDate);
						dtDSTStart.setMonth(iDSTStartMonth - 1);
						//计算夏令时的结束时间
						var iDSTStopMonth = parseInt(szDSTStopTime.split(".")[0].replace("M", ""), 10);
						dtDSTStop.setMonth(iDSTStopMonth - 1);
						dtDSTStop.setYear(dtDSTStop.getFullYear() + (iDSTStopMonth < iDSTStartMonth ? 1 : 0));
						var iDSTStopWeek = parseInt(szDSTStopTime.split(".")[1], 10);
						var iDSTStopDay = parseInt(szDSTStopTime.split(".")[2].split("/")[0]);
						var iDSTStopTime = parseInt(szDSTStopTime.split(".")[2].split("/")[1].split(":")[0], 10);
						dtDSTStop.setHours(iDSTStopTime);
						iTime = 0;
						iDate = 0;
						for (var i = 1; i <= 31; i++) {
							dtDSTStop.setDate(i);
							//当月没有此天
							if (dtDSTStop.getMonth() !== (iDSTStopMonth - 1)) {
								break;
							}
							if (dtDSTStop.getDay() == iDSTStopDay) {
								iTime++;
								iDate = i;
								if (iTime == iDSTStopWeek) {
									break;
								}
							}
						}
						dtDSTStop.setDate(iDate);
						dtDSTStop.setMonth(iDSTStopMonth - 1);

						if (dtDeviceDate.getTime() >= dtDSTStart.getTime() && dtDeviceDate.getTime() <= dtDSTStop.getTime()) {
							var szDSTTime = szTimeZone.substring(iDSTPos + 3, iDSTPos + 11);
							iDSTTime = parseInt(szDSTTime.split(":")[0], 10) * 60 + parseInt(szDSTTime.split(":")[1], 10);
						}
					}
					var arDTZms = szTimeZone.match(/\D+([+-])(\d+):(\d+):(\d+)/);
					if (arDTZms.length == 5) {
						var dtNow = new Date();
						var iLocalOffsetMin = dtNow.getTimezoneOffset();
						var iDeviceOffsetMin = parseInt(arDTZms[2]) * 60 + parseInt(arDTZms[3]); // min
						iDeviceOffsetMin = ((arDTZms[1] === "+") ? iDeviceOffsetMin : -iDeviceOffsetMin);
						self.m_iDeviceMinusLocalTime = (iLocalOffsetMin - iDeviceOffsetMin + iDSTTime) * 60 * 1000;
					}
				}
			});
			return self.m_iDeviceMinusLocalTime;
		},
		// 获取通道列表
		getChannel: function (szChannelType) {
			var self = this,
				oXmlDoc = null;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, szChannelType, null, {
				async: false,
				success: function (status, xmlDoc) {
					oXmlDoc = xmlDoc;
				}
			});

			return oXmlDoc;
		},
		// 获取通道状态
		getChannelStatus: function () {
			var self = this,
				oXmlDoc = null;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "DigitalChannelStatus", null, {
				async: false,
				success: function (status, xmlDoc) {
					oXmlDoc = xmlDoc;
				}
			});

			return oXmlDoc;
		},
		// 获取报警输出
		getAlarmOutput: function (szAlarmOutputType) {
			var self = this,
				oXmlDoc = null;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, szAlarmOutputType, null, {
				async: false,
				success: function (status, xmlDoc) {
					oXmlDoc = xmlDoc;
				}
			});

			return oXmlDoc;
		},
		// 获取报警输入
		getAlarmInput: function (szAlarmInputType) {
			var self = this,
				oXmlDoc = null;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, szAlarmInputType, null, {
				async: false,
				success: function (status, xmlDoc) {
					oXmlDoc = xmlDoc;
				}
			});

			return oXmlDoc;
		},
		// 获取RTSP端口
		getRTSPPort: function () {
			var self = this,
				bPPPoEStatus = false;

			bPPPoEStatus = self.getPPPOEStatus();
			if (bPPPoEStatus) {
				self.getInternalRTSPPort();
			} else {
				self.getUPnPStatus();
			}
		},
		// 获取PPPoE状态
		getPPPOEStatus: function () {
			var bPPPoEStatus = false;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "PPPoEStatus", null, {
				async: false,
				success: function (status, xmlDoc) {
					if ($(xmlDoc).find("ipAddress").length > 0) {
						bPPPoEStatus = _oUtils.isDIPAddress(_oUtils.nodeValue(xmlDoc, "ipAddress"));
					} else if ($(xmlDoc).find("ipv6Address").length > 0) {
						bPPPoEStatus = _oUtils.isIPv6Address(_oUtils.nodeValue(xmlDoc, "ipv6Address"));
					} else {
						bPPPoEStatus = false;
					}
				}
			});

			return bPPPoEStatus;
		},
		// 获取内部RTSP端口
		getInternalRTSPPort: function () {
			var self = this,
				szProtocol = "";

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "portInfo", null, {
				async: false,
				success: function (status, xmlDoc) {
					$(xmlDoc).find("AdminAccessProtocol").each(function (i) {
						szProtocol = _oUtils.nodeValue(this, "protocol").toLowerCase();
						if ("rtsp" === szProtocol) {
							self.m_oDevicePort.iRtspPort = _oUtils.nodeValue(this, "portNo", "i");
						} else if ("http" === szProtocol) {
							self.m_oDevicePort.iSHttpPort = _oUtils.nodeValue(this, "portNo", "i");
						} else if ("dev_manage" === szProtocol) {
							self.m_oDevicePort.iManagePort = _oUtils.nodeValue(this, "portNo", "i");
						}
					});
				}
			});
		},
		// 获取UPnP状态
		getUPnPStatus: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "upnpStatus", null, {
				async: false,
				success: function (status, xmlDoc) {
					var iExternalRtspPort = 554,
						iExternalHttpPort = 80,
						szProtocol = "";

					$(xmlDoc).find("portStatusList").eq(0).find("portStatus").each(function (i) {
						szProtocol = _oUtils.nodeValue(this, "internalPort").toLowerCase();
						if ("rtsp" === szProtocol) {
							iExternalRtspPort = _oUtils.nodeValue(this, "externalPort", "i");
						}
						if ("http" === szProtocol) {
							iExternalHttpPort = _oUtils.nodeValue(this, "externalPort", "i");
						}
					});
					//匿名判断
					if(!_oCommon.m_bAnonymous) {
						self.getNetworkBond(iExternalRtspPort, iExternalHttpPort);
					}
				},
				error: function (status, xmlDoc) {
					self.getInternalRTSPPort();
				}
			});
		},
		// 获取
		getNetworkBond: function (iExternalRtspPort, iExternalHttpPort) {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "networkBond", null, {
				async: false,
				success: function (status, xmlDoc) {
					if (_oUtils.nodeValue(xmlDoc, "enabled", "b")) {
						if (_oUtils.isIPv6Address(_oCommon.m_szHostNameOriginal)) {
							if (_oUtils.nodeValue(xmlDoc, "ipv6Address") !== _oCommon.m_szHostNameOriginal) {
								self.m_oDevicePort.iRtspPort = iExternalRtspPort;
								self.m_oDevicePort.iSHttpPort = iExternalHttpPort;
							} else {
								self.getInternalRTSPPort();
							}
						} else {
							if (_oUtils.nodeValue(xmlDoc, "ipAddress") !== _oCommon.m_szHostName) {
								self.m_oDevicePort.iRtspPort = iExternalRtspPort;
								self.m_oDevicePort.iSHttpPort = iExternalHttpPort;
							} else {
								self.getInternalRTSPPort();
							}
						}
					} else {
						self.getNetworkInterface(iExternalRtspPort, iExternalHttpPort);
					}
				},
				error: function (status, xmlDoc) {
					self.getNetworkInterface(iExternalRtspPort, iExternalHttpPort);
				}
			});
		},
		// 获取网络信息
		getNetworkInterface: function (iExternalRtspPort, iExternalHttpPort) {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "networkInterface", null, {
				async: false,
				success: function (status, xmlDoc) {
					var bSameHostname = false;
					if (_oUtils.isIPv6Address(_oCommon.m_szHostNameOriginal)) {
						$(xmlDoc).find("NetworkInterface").each(function (i) {
							if (_oUtils.nodeValue(this, "ipv6Address") === _oCommon.m_szHostNameOriginal) {
								bSameHostname = true;
							}
						});
						if (!bSameHostname) {
							self.m_oDevicePort.iRtspPort = iExternalRtspPort;
							self.m_oDevicePort.iSHttpPort = iExternalHttpPort;
						} else {
							self.getInternalRTSPPort();
						}
					} else {
						$(xmlDoc).find("NetworkInterface").each(function (i) {
							if (_oUtils.nodeValue(this, "ipAddress") === _oCommon.m_szHostName) {
								bSameHostname = true;
							}
						});
						if(!bSameHostname) {
							self.m_oDevicePort.iRtspPort = iExternalRtspPort;
							self.m_oDevicePort.iSHttpPort = iExternalHttpPort;
						} else {
							self.getInternalRTSPPort();
						}
					}
				}
			});
		},
		// 获取设备能力
		getDeviceCapa: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "deviceCapa", null, {
				async: false,
				success: function (status, xmlDoc) {
					var $xmlDoc = $(xmlDoc);
					self.m_oDeviceCapa.bSupportTransCode = _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "isSupportTransCode", "b");
					if ($xmlDoc.find("PTZCtrlCap").length > 0) {
						self.m_oDeviceCapa.bSupportPatrols = _oUtils.nodeValue($xmlDoc.find("PTZCtrlCap").eq(0), "isSupportPatrols", "b");
					}
					self.m_oDeviceCapa.bSupportStreamEncrypt = _oUtils.nodeValue(xmlDoc, "isSupportStreamingEncrypt", "b");
					self.m_oDeviceCapa.bSupportPicDown = _oUtils.nodeValue(xmlDoc, "isSupportSrcIDSearch", "b");
					self.m_oDeviceCapa.bSupportReversePlayback = $xmlDoc.find("isSupportReversePlayback").eq(0).text() === "true";// 没有节点，默认支持
					self.m_oDeviceCapa.bSupportHoliday = _oUtils.nodeValue(xmlDoc, "isSupportHolidy", "b");// 控制页面是否显示
					self.m_oDeviceCapa.bSupportFtp = _oUtils.nodeValue(xmlDoc, "isSupportFtp", "b");
					self.m_oDeviceCapa.bSupportExtHdCfg = _oUtils.nodeValue(xmlDoc, "isSupportExtHdCfg", "b");
					self.m_oDeviceCapa.bSupportPnp = _oUtils.nodeValue(xmlDoc, "isSupportPNP", "b");
					self.m_oDeviceCapa.bSupportZeroChan = _oUtils.nodeValue(xmlDoc, "RacmCap isSupportZeroChan", "b");
					self.m_oDeviceCapa.bSupportDST = _oUtils.nodeValue(xmlDoc, "isSupportDst", "b");
					self.m_oDeviceCapa.bSupport232Config = _oUtils.nodeValue($xmlDoc.find("SerialCap").eq(0), "supportRS232Config", "b");
					var bSupportIPC485 = _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "isSupportPTZRs485Proxy", "b");// IP通道是否支持云台
					self.m_oDeviceCapa.bSupport485 = _oUtils.nodeValue($xmlDoc.find("SerialCap").eq(0), "rs485PortNums", "i") > 0 || bSupportIPC485;
					self.m_oDeviceCapa.bSupportEZVIZ = _oUtils.nodeValue(xmlDoc, "isSupportEZVIZ", "b");
					self.m_oDeviceCapa.bSupportEhome = _oUtils.nodeValue(xmlDoc, "isSupportEhome", "b");
					self.m_oDeviceCapa.bSupportDdns = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupportDdns", "b");
					self.m_oDeviceCapa.bSupportPPPoE = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupportPPPoE", "b");
					self.m_oDeviceCapa.bSupportUpnp = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupportUpnp", "b");
					self.m_oDeviceCapa.bSupportWirelessDial = _oUtils.nodeValue($xmlDoc, "isSupportWirelessDial", "b");
					self.m_oDeviceCapa.bSupportSnmp = _oUtils.nodeValue($xmlDoc.find("SnmpCap").eq(0), "isSupport", "b");
					self.m_oDeviceCapa.bSupportFtp = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupportFtp", "b");
					self.m_oDeviceCapa.bSupportHttps = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupportHttps", "b");
					self.m_oDeviceCapa.bSupportNetworkOther = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupportExtNetCfg", "b");
					self.m_oDeviceCapa.bSupportIpcStreamType = _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "isSupportIpcStreamType", "b");
					self.m_oDeviceCapa.bSupportNetPreviewStrategy = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupportNetPreviewStrategy", "b");
					self.m_oDeviceCapa.bSupportIpcImport = _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "isSupportIpcImport", "b");
					self.m_oDeviceCapa.bSupportNfs = _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "nasNums", "i") > 0 || _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "ipSanNums", "i") > 0;
					self.m_oDeviceCapa.bSupportAnalogChan = _oUtils.nodeValue($xmlDoc.find("VideoCap").eq(0), "videoInputPortNums", "i") > 0;
					self.m_oDeviceCapa.bSupportDigitalChan = _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "inputProxyNums", "i") > 0;
					self.m_oDeviceCapa.bSupportMenu = _oUtils.nodeValue($xmlDoc.find("VideoCap").eq(0), "menuNums", "i") > 0;
					self.m_oDeviceCapa.bSupportAudio = $xmlDoc.find("AudioCap").length > 0;
					var bSupportIPCAlarmIn = _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "isSupportIOInputProxy", "b"); // IP通道是否支持报警
					self.m_oDeviceCapa.bSupportVideoLoss = _oUtils.nodeValue($xmlDoc.find("EventCap").eq(0), "isSupportVideoLoss", "b");
					self.m_oDeviceCapa.bSupportAlarmIn = _oUtils.nodeValue($xmlDoc.find("IOCap").eq(0), "IOInputPortNums", "i") > 0 || bSupportIPCAlarmIn;
					var bSupportIPCAlarmOut = _oUtils.nodeValue($xmlDoc.find("RacmCap").eq(0), "isSupportIOOutputProxy", "b");
					self.m_oDeviceCapa.bSupportAlarmOut = _oUtils.nodeValue($xmlDoc.find("IOCap").eq(0), "IOOutputPortNums", "i") > 0 || bSupportIPCAlarmOut;
					self.m_oDeviceCapa.iAlarmOutNum = _oUtils.nodeValue($xmlDoc.find("IOCap").eq(0), "IOOutputPortNums", "i"); // 报警输出个数
					self.m_oDeviceCapa.bSupportIPFilter = _oUtils.nodeValue(xmlDoc, "isSupportIPFilter", "b");
					self.m_oDeviceCapa.bSupportHddTest = _oUtils.nodeValue(xmlDoc, "isSupportSMARTTest", "b");
					self.m_oDeviceCapa.bSupportCapture = _oUtils.nodeValue(xmlDoc, "isSupportSnapshot", "b");
					self.m_oDeviceCapa.bSupportPlatformAccess = _oUtils.nodeValue($xmlDoc.find("MegaPlatformCap").eq(0), "isSupportPlatformAccess", "b");
					self.m_oDeviceCapa.bSupportPlatformNMSAccess = _oUtils.nodeValue($xmlDoc.find("MegaPlatformCap").eq(0), "isSupportNetManagerAccess", "b");
					self.m_oDeviceCapa.bSupportPlatformReset = _oUtils.nodeValue($xmlDoc.find("MegaPlatformCap").eq(0), "isSupportVSB", "b");
					self.m_oDeviceCapa.bSupportPlatformVBS = _oUtils.nodeValue($xmlDoc.find("MegaPlatformCap").eq(0), "isSupportPlatReset", "b");
					self.m_oDeviceCapa.bSupport8021x = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupport802_1x", "b");
					self.m_oDeviceCapa.bSupportWifi = _oUtils.nodeValue($xmlDoc.find("NetworkCap").eq(0), "isSupportWireless", "b");
					self.m_oDeviceCapa.bSupport28181Service = _oUtils.nodeValue($(xmlDoc).find("NetworkCap").eq(0), "isSupportGB28181Service", "b");
					self.m_oDeviceCapa.bSupportWPS = _oUtils.nodeValue($(xmlDoc).find("NetworkCap").eq(0), "isSupportWPS", "b");

                    //无线报警
                    var oWLAlarmCap = $xmlDoc.find("WLAlarmCap").eq(0);
                    self.m_oDeviceCapa.bSupportTeleCtrl = _oUtils.nodeValue(oWLAlarmCap, "isSupportTeleControl", "b");  //是否支持遥控器
                    self.m_oDeviceCapa.bSupportWLS = _oUtils.nodeValue(oWLAlarmCap, "isSupportWLSensors", "b");     //是否支持无线门磁
                    self.m_oDeviceCapa.bSupportPIR = _oUtils.nodeValue(oWLAlarmCap, "isSupportPIR", "b");           //是否支持PIR
                    self.m_oDeviceCapa.bSupportCH = _oUtils.nodeValue(oWLAlarmCap, "isSupportCallHelp", "b");       //是否支持呼救报警
					//smart能力
					var oSmartCapa = $xmlDoc.find("SmartCap").eq(0);
					//是否支持ROI
					self.m_oDeviceCapa.bSupportROI = _oUtils.nodeValue(oSmartCapa, "isSupportROI", "b");
					// 是否支持智能跟踪
					self.m_oDeviceCapa.bSupportIntelliTrace = _oUtils.nodeValue(oSmartCapa, "isSupportIntelliTrace", "b");
					// 是否支持音频异常侦测
					self.m_oDeviceCapa.bSupportAudioDection = _oUtils.nodeValue(oSmartCapa, "isSupportAudioDetection", "b");
					// 是否支持虚焦检测
					self.m_oDeviceCapa.bSupportDefousDection = _oUtils.nodeValue(oSmartCapa, "isSupportDefocusDetection", "b");
					// 是否支持场景变更侦测
					self.m_oDeviceCapa.bSupportSceneChangeDetection = _oUtils.nodeValue(oSmartCapa, "isSupportSceneChangeDetection", "b");
					// 是否支持人脸侦测
					self.m_oDeviceCapa.bSupportFaceDect = _oUtils.nodeValue(oSmartCapa, "isSupportFaceDetect", "b");
					// 是否支持越界侦测
					self.m_oDeviceCapa.bSupportLineDection = _oUtils.nodeValue(oSmartCapa, "isSupportLineDetection", "b");
					// 是否支持区域入侵侦测
					self.m_oDeviceCapa.bSupportFieldDection = _oUtils.nodeValue(oSmartCapa, "isSupportFieldDetection", "b");
					// 进入区域
					self.m_oDeviceCapa.bSupportRegionEntrance = _oUtils.nodeValue(oSmartCapa, "isSupportRegionEntrance", "b");
					// 离开区域
					self.m_oDeviceCapa.bSupportRegionExit = _oUtils.nodeValue(oSmartCapa, "isSupportRegionExiting", "b");
					// 徘徊
					self.m_oDeviceCapa.bSupportLoiter = _oUtils.nodeValue(oSmartCapa, "isSupportLoitering", "b");
					// 聚集
					self.m_oDeviceCapa.bSupportGroup = _oUtils.nodeValue(oSmartCapa, "isSupportGroup", "b");
					// 快速运动
					self.m_oDeviceCapa.bSupportRapidMove = _oUtils.nodeValue(oSmartCapa, "isSupportRapidMove", "b");
					// 停车侦测
					self.m_oDeviceCapa.bSupportPark = _oUtils.nodeValue(oSmartCapa, "isSupportParking", "b");
					// 遗留
					self.m_oDeviceCapa.bSupportUnattendedBaggage = _oUtils.nodeValue(oSmartCapa, "isSupportUnattendedBaggage", "b");
					// 拿取
					self.m_oDeviceCapa.bSupportAttendedBaggage = _oUtils.nodeValue(oSmartCapa, "isSupportAttendedBaggage", "b");
                    //客流量
                    self.m_oDeviceCapa.bSupportPeopleCount = {      //客流量配置和统计(区分客流和过线统计)
                        bSptPeople: false,
                        bSptObjCount: false
                    };
                    if (_oUtils.nodeValue($xmlDoc.find("VideoCap").eq(0), "isSupportCounting", "b")) {
                        var bObj = _oUtils.nodeValue($xmlDoc.find("VideoCap").eq(0), "countingType") == "object";
                        self.m_oDeviceCapa.bSupportPeopleCount.bSptObjCount = bObj;
                        self.m_oDeviceCapa.bSupportPeopleCount.bSptPeople = !bObj;
                    } else {
                        self.m_oDeviceCapa.bSupportPeopleCount.bSptObjCount = false;
                        self.m_oDeviceCapa.bSupportPeopleCount.bSptPeople = false;
                    }
                    //热度图
                    self.m_oDeviceCapa.bSupportHeatmap = _oUtils.nodeValue($xmlDoc.find("VideoCap").eq(0), "isSupportHeatmap", "b");

					// 是否支持PTZ
					self.m_oDeviceCapa.bPTZ = self.m_oDeviceInfo.szDeviceType === "IPDome";

					//人脸统计
					self.m_oDeviceCapa.bSupportFaceCaptureCount = _oUtils.nodeValue($xmlDoc, "isSupportFaceCaptureStatistics", "b");
					
					//WLAN热点
					self.m_oDeviceCapa.bSupportWLANAP= _oUtils.nodeValue($xmlDoc, "NetworkCap isSupportWirelessServer", "b");

					//外设
					self.m_oDeviceCapa.bSupportExternalDevice= _oUtils.nodeValue($xmlDoc, "isSupportExternalDevice", "b");

					//图片叠加
					if ($xmlDoc.find("VideoCap isSupportPicture").length) {
						self.m_oDeviceCapa.bSupportPicOver = _oUtils.nodeValue($xmlDoc, "VideoCap isSupportPicture", "b");
					} else {//兼容其他设备
						self.m_oDeviceCapa.bSupportPicOver = true;
					}

					//电子罗盘
					self.m_oDeviceCapa.bSupportCompass = _oUtils.nodeValue($xmlDoc, "isSupportCompass" , "b");

					//道路信息
					self.m_oDeviceCapa.bSupportRoadInfo = _oUtils.nodeValue($xmlDoc, "isSupportRoadInfoOverlays" , "b");					
				}
			});
		},
		//是否支持区域曝光、区域聚焦
		getImageCap: function (iChannelId) {
			var oCap = {
				bSupportRegionalExposure: false,
				bSupportRegionalFocus: false
			};

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "imageCap", {channel: iChannelId}, {
				async: false,
				success: function (status, xmlDoc) {
					//是否支持区域曝光
					oCap.bSupportRegionalExposure = _oUtils.nodeValue(xmlDoc, "isSupportRegionalExposure", "b");
					//是否支持区域聚焦
					oCap.bSupportRegionalFocus = _oUtils.nodeValue(xmlDoc, "isSupportRegionalFocus", "b");
					//前端参数恢复
					oCap.bSupportImgRestore = _oUtils.nodeValue(xmlDoc, "isSupportRestore", "b");
				}
			});

			return oCap;
		},
		//是否支持3D放大、雨刷状态
		getPTZChanelCap: function (iChannelId) {
			var oCap = {
				bSupportPosition3D: false,
				bSupportWiperStatus: false
			};

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "rs485Capa", {channel: iChannelId}, {
				async: false,
				success: function (status, xmlDoc) {
					// 是否支持3D放大
					if ($(xmlDoc).find("PTZChanelCap").length > 0) {
						var oPTZChanelCap = $(xmlDoc).find("PTZChanelCap").eq(0);
						oCap.bSupportPosition3D = _oUtils.nodeValue(oPTZChanelCap, "isSupportPosition3D", "b");// 3D定位
						oCap.bSupportWiperStatus = !($(oPTZChanelCap).find("wiperStatusSupport").eq(0).text() == "false");// 雨刷状态，没有节点，默认支持
					}
				}
			});

			return oCap;
		},
        //是否支持区域裁剪(目前只支持三码流)
        getRegCropCap: function () {
            var self = this;
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "regCropCap", {channel: 1, videoStream: "03"}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.bIsSupportRegCrop = true;
                }
            });
        },
        //是否支持码流信息叠加(目前就单通道能力)
        getDualVCACap: function () {
            var self = this;
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "DualVCACap", {channel: 1}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.bIsSupportDualVCA = true;
                }
            });
        },
		//获取是否支持通道对讲配置
		getTalkInfo: function () {
			var self = this;
			self.m_oDeviceCapa.iTaklNum = 0;
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "talkListInfo", null, {
				async: false,
				success: function (status, xmlDoc) {
					if($(xmlDoc).find("associateVideoInputs").length > 0) {
						self.m_oDeviceCapa.bSupportTalkset = true;
					}
					self.m_oDeviceCapa.iTaklNum = $(xmlDoc).find("TwoWayAudioChannel").length;
					if(self.m_oDeviceCapa.iTaklNum > 0 && $(xmlDoc).find("audioCompressionType").length > 0) {
						self.m_oDeviceCapa.m_szaudioCompressionType = $(xmlDoc).find("audioCompressionType").eq(0).text();
					}

					//音频码率
					if ($(xmlDoc).find("audioBitRate").length > 0) {
						self.m_oDeviceCapa.m_iAudioBitRate = _oUtils.nodeValue(xmlDoc, "audioBitRate", "i") * 1000;
					} else {
		                self.m_oDeviceCapa.m_iAudioBitRate = 0;
					}

					//音频采样率
					if ($(xmlDoc).find("audioSamplingRate").length > 0) {
						self.m_oDeviceCapa.m_iAudioSamplingRate = parseInt(_oUtils.nodeValue(xmlDoc, "audioSamplingRate", "f") * 1000, 10);
					} else {
		                self.m_oDeviceCapa.m_iAudioSamplingRate = 0;
					}					
				}
			});
		},
		// 获取设备是否支持IPV6
		getNetworkVersion: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "networkInterface", null, {
				async: false,
				success: function (status, xmlDoc) {
					self.m_oDeviceCapa.szIPVersion = _oUtils.nodeValue(xmlDoc, "ipVersion");
				}
			});
		},
		//是否支持28181
		get28181Support: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "cfg28181", null, {
				async: false,
				success: function (status, xmlDoc) {
					self.m_oDeviceCapa.bSupport28181 = true;
				},
				error: function (status, xmlDoc) {
					self.m_oDeviceCapa.bSupport28181 = false;
				}
			});
		},
		//是否支持认证方式
		getAuthSupport: function () {
			var self = this;

			self.m_oDeviceCapa.oSupportAuth = {};

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "rtspAuth", null, {
				async: false,
				success: function (status, xmlDoc) {
					var bEnabled = $(xmlDoc).find("Security").eq(0).find("enabled").eq(0).text();
					if ("" == bEnabled) {
						self.m_oDeviceCapa.oSupportAuth.bRtsp = false;
					} else {
						self.m_oDeviceCapa.oSupportAuth.bRtsp = true;
					}
				},
				error: function (status, xmlDoc) {
					self.m_oDeviceCapa.oSupportAuth.bRtsp = false;
				}
			});

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "webAuth", null, {
				async: false,
				success: function (status, xmlDoc) {
					self.m_oDeviceCapa.oSupportAuth.bWeb = true;
				},
				error: function (status, xmlDoc) {
					self.m_oDeviceCapa.oSupportAuth.bWeb = false;
				}
			});
		},
		// 时间计划是否显示假日
		isEnableHoliday: function () {
			var self = this;
			//是否启用holiday
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "holidayInfo", null, {
				async: false,
				success: function (status, xmlDoc) {
					var iLength = $(xmlDoc).find("holiday").length;
					for(var i = 0; i < iLength; i++) {
						if(_oUtils.nodeValue($(xmlDoc).find("holiday").eq(i), "enabled", "b")) {
							self.m_oDeviceCapa.bEnableHoliday = true;
							break;
						}
					}
					if(i === iLength) {
						self.m_oDeviceCapa.bEnableHoliday = false;
					}
				}
			});
		},
        //设备是否支持专业智能
        getIntelliSupport: function () {
            var self = this;
            self.m_oDeviceCapa.bSupportIntelligent = false;
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "VCADeviceCap", null, {
                async: false,
                success: function () {
                    self.m_oDeviceCapa.bSupportIntelligent = true;
                },
                error: function () {
                    WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "VCAIntelliCap", {channel: 1}, {
                        async: false,
                        success: function () {
                            self.m_oDeviceCapa.bSupportIntelligent = true;
                        }
                    });
                }
            });
        },
        //设备是否支持磁盘配额
        getQuotaCap: function () {
            var self = this;
            self.m_oDeviceCapa.bSupporttQuota = false;
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "quotaCap", null, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.bSupporttQuota = true;
                }
            });
        },
		//设备是否支持云存储
		getCloudStorage: function() {
			var self = this;
            self.m_oDeviceCapa.bSupportCloudStorage = false;
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "cloudStorage", {channel: 1, cloud: 1}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.bSupportCloudStorage = true;
                }
            });
		},
		//设备是否支持轻存储
		getLiteStorage: function() {
			var self = this;
            self.m_oDeviceCapa.bSupportLiteStorage = false;
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "liteStorage", {channel: 1}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.bSupportLiteStorage = true;
                }
            });
		},
        getVCAResource: function() {
            var self = this;
            self.m_oDeviceCapa.oVCAResourceType = '';
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "VCAResource", {channel: 1}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.oVCAResourceType = $(xmlDoc).find("type").text();
                }
            });
        },
        getVehicleCap: function() {
            var self = this;
            self.m_oDeviceCapa.oSupportVehicle = {
                vehicle: false,
                HVTVehicle: false
            };
            if(self.m_oDeviceCapa.oVCAResourceType == "smartVehicleDetection") {
                self.m_oDeviceCapa.oSupportVehicle.vehicle = true;
                return;
            } else if(self.m_oDeviceCapa.oVCAResourceType == "smartHVTDetection"){
                self.m_oDeviceCapa.oSupportVehicle.HVTVehicle = true;
                return;
            } else if(self.m_oDeviceCapa.oVCAResourceType && self.m_oDeviceCapa.oVCAResourceType != "") {
                return;
            }
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "roadDetectionCap", {channel: 1}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.oSupportVehicle.vehicle = $(xmlDoc).find("isSupportVehicleDetection").text() == "true";
                    self.m_oDeviceCapa.oSupportVehicle.HVTVehicle = $(xmlDoc).find("isSupportHVTVehicleDetection").text() == "true";
                }
            });
        },
		// 联动能力
		getDeviceLinkageCap: function(szXmlPath, szNodeExist, szNodeValue) {
            var self = this;
            if (!self.m_oLinkageCap) {
                WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "eventTriggerCap", null, {
                    async: false,
                    success: function (status, xmlDoc) {
                        self.m_oLinkageCap = xmlDoc;
                    },
                    error: function() {
                        self.m_oLinkageCap = 'noSupport';
                    }
                });
            }
            if (typeof self.m_oLinkageCap == "string" && self.m_oLinkageCap == 'noSupport') {
                return false;
            } else {
                if (szNodeExist) {
                    return $(self.m_oLinkageCap).find(szNodeExist).length > 0;
                }
				if ("i" == szNodeValue) {
					return parseInt($(self.m_oLinkageCap).find(szXmlPath).eq(0).text(), 10) || 0;
				} else if ("s" == szNodeValue) {
					return $(self.m_oLinkageCap).find(szXmlPath).eq(0).text();
				} else {// szNodeValue 默认 boolean 型
					return $(self.m_oLinkageCap).find(szXmlPath).eq(0).text() == 'true';
				}
            }
        },
        getTrafficCap: function(iChannel) {
            var self = this;
            if(!self.m_oDeviceCapa.oSupportTraffic) {
                self.m_oDeviceCapa.oSupportTraffic = {
                    bSupport: false,
                    aUploadEvidence: [],
                    aUploadEvent: [],
                    aAidType: [],
                    bSupportVCR: false,
                    bSupportManualEvidence: false,
                    bSupportManualTrack: false
                };
            } else {
                return;
            }
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "evidenceCap", {channel: iChannel}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.oSupportTraffic.bSupport = $(xmlDoc).find("isEvidenceGettingSupport").text() == 'true' || $(xmlDoc).find("isIntellMonitorSupport").text() == 'true';
                    var szAidTypes = $(xmlDoc).find("aidTypeSupport").text();
                    if(szAidTypes) {
                        self.m_oDeviceCapa.oSupportTraffic.aAidType = szAidTypes.split(",");
                    }
                    var szUploadTypes = $(xmlDoc).find("uploadDataTypesSupport").text();
                    var aDataTypes = [];
                    if(szUploadTypes) {
                        aDataTypes = szUploadTypes.split(",");
                    }
                    self.m_oDeviceCapa.oSupportTraffic.aUploadEvidence.length = 0;
                    self.m_oDeviceCapa.oSupportTraffic.aUploadEvent.length = 0;
                    self.m_oDeviceCapa.oSupportTraffic.bSupportVCR = $(xmlDoc).find("isVCRSupport").text() == 'true';
                    self.m_oDeviceCapa.oSupportTraffic.bSupportManualEvidence = $(xmlDoc).find("isEdfManualItsCapSupport").text() == 'true';
                    self.m_oDeviceCapa.oSupportTraffic.bSupportManualTrack = $(xmlDoc).find("isEdfManualTrackSupport").text() == 'true';
                    var iLength = aDataTypes.length;
                    for(var i = 0; i < iLength; i++) {
                        if(aDataTypes[i].indexOf("Evidence") > 0) {
                            self.m_oDeviceCapa.oSupportTraffic.aUploadEvidence.push(aDataTypes[i]);
                        } else {
                            self.m_oDeviceCapa.oSupportTraffic.aUploadEvent.push(aDataTypes[i]);
                        }
                    }
                }
            });
        },
		getSecurityService: function () {
			var self = this;
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "telnetService", null, {
				async: false,
				success: function (status, xmlDoc) {
					self.m_oDeviceCapa.bSupportTelnet = true;
				},
				error: function () {
					self.m_oDeviceCapa.bSupportTelnet = false;
				}
			});
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "sshService", null, {
				async: false,
				success: function (status, xmlDoc) {
					self.m_oDeviceCapa.bSupportSSH = true;
				},
				error: function () {
					self.m_oDeviceCapa.bSupportSSH = false;
				}
			});
		},
        getVehicleType: function(iChannel){
            var self = this;
            if(self.m_oDeviceCapa.oVCAResourceType == "smartVehicleDetection") {
                self.m_oDeviceCapa.szVehicle = "vehicleDetection";
                return;
            } else if(self.m_oDeviceCapa.oVCAResourceType == "smartHVTDetection"){
                self.m_oDeviceCapa.szVehicle = "hvtVehicleDetection";
                return;
            } else if(self.m_oDeviceCapa.oVCAResourceType && self.m_oDeviceCapa.oVCAResourceType != "") {
                self.m_oDeviceCapa.szVehicle = "vehicleDetection";
                return;
            }
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "vehicleDetectionType", {channel: iChannel}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.szVehicle = $(xmlDoc).find("CurMode").text();
				}
            });
        },
		//网络测试
		testNet: function (szMothod, oXmlDoc, oLan, oResponse) {
			var self = this;
			self.m_oWait = _oDialog.wait("", oLan.Testing);
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, szMothod, null, {
				data: oXmlDoc,
                success: function (status, xmlDoc) {
					setTimeout(function () {
						if (self.m_oWait) {
							self.m_oWait.close();
						}
						var szTips = oLan.TestFailed;
						var szErrrorDes = _oUtils.nodeValue($(xmlDoc), "errorDescription");
						switch (szErrrorDes) {
							case "ok":
								szTips = oLan.TestSuccess;
								break;
							case "connect server fail":
								szTips = oLan.ConnectServerFail;
								break;
							case "no nas directory":
								szTips = oLan.NoNasDirectory;
								break;
							case "no permission":
								szTips = oLan.NoNasPermission;
								break;
							case "no dns":
								szTips = oLan.NoDns;
								break;
							case "no gateway":
								szTips = oLan.NoGateway;
								break;
							case "password error":
								szTips = oLan.PasswordError;
								break;
							case "exchange server fail":
								szTips = oLan.ExchangeServerFail;
								break;
							case "create directory failed":
								szTips = oLan.CreateDirectoryFail;
								break;
							case "no write permission":
								szTips = oLan.NoWritePermission;
								break;
							case "port error":
								szTips = oLan.portError;
								break;
							case "user or password error":
								szTips = oLan.PasswordError;
								break;
							case "no storage pool":
								szTips = oLan.StoragePoolError;
								break;
							case "storage pool full":
								szTips =  oLan.StoragePoolFull;
								break;
							case "unknown error":
								szTips =  oLan.UnknownError;
								break;
							default :
								break;
						}
						_oDialog.alert(szTips);
					}, 2000);
				},
				error: function (status, xmlDoc, xhr) {					
					setTimeout(function () {
						if (self.m_oWait) {
							self.m_oWait.close();
						}
						_oDialog.alert(oLan.TestFailed);
					}, 2000);
				}
            });
		},
		//码流支持
		getChannelStreamSupport: function (iChannel, iStream) {
			var bSupport = false;
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "StreamChannels", null, {
				async: false,
				success: function (status, xmlDoc) {					
					$(xmlDoc).find('StreamingChannel').each(function () {
						if ($(this).find("id").eq(0).text() === iChannel + "0" + iStream) {
							bSupport = true;
						}
					});
				}
			});
			return bSupport;
		},
		getChannelStreamNum: function (iChannel) {
			var self = this;
			var iNum = 2;

			//三码流
			if (self.getChannelStreamSupport(iChannel, 3)) {
				iNum = 3;
			}

			//虚拟码流
			if (self.m_oDeviceCapa.bSupportTransCode) {
				iNum = 4;
			}

			return iNum;
		},
		//是否支持前端参数切换
        getDisplayParamSwitchSupport: function() {
            var self = this;          
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "displayParamSwitchCap", {channel: 1}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.bSupportDisplayParamSwitch = true;
                }
            });
        },
		//是否支持外接显示屏
        getTHScreenSupport: function() {
            var self = this;          
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "externalDevice", {channel: 1}, {
                async: false,
                success: function (status, xmlDoc) {
                    self.m_oDeviceCapa.bSupportTHScreen = !!$(xmlDoc).find("THScreen").length;
                }
            });
        },
        // 是否支持隐私遮蔽
		isSupportPrivacyMask: function () {
			var self = this;			
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "ptzPrivacyMask", null, {
				async: false,
				success: function (status, xmlDoc) {
					self.m_oDeviceCapa.bSupportPrivacyMask = true;
				}
			});
		},
        getPanoramicMapCap: function() {
            var self = this;
            if(!self.m_oDeviceCapa.oPanorama) {
                self.m_oDeviceCapa.oPanorama = {
                    bSupport: false,
                    bSupportGenerate: false,
                    bSupportPreset: false,
                    bSupportPosition: false
                };
            } else {
                return;
            }
            WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "panoramicMapCap", {}, {
                async: false,
                success: function (status, xmlDoc) {
                    if($(xmlDoc).find("isSupportGeneratePanorama").text() == "true") {
                        self.m_oDeviceCapa.oPanorama.bSupport = true;
                        self.m_oDeviceCapa.oPanorama.bSupportGenerate = true;
                    }
                }
            });
        },
		getImageInfo: function () {
			var self = this,
				oXmlDoc = null;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "imageInfo", null, {
				async: false,
				success: function (status, xmlDoc) {
					oXmlDoc = xmlDoc;
				}
			});

			return oXmlDoc;
		}
	};

	module.exports = new Device();
});