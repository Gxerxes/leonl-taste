define(function (require, exports, module) {

	var $, _oTranslator, _oCommon, _oUtils, _oDialog, _oResponse;

	$ = require("jquery");
	require("ui.table");
	require("config/ui.config");
	_oCommon = require("common");
	_oUtils = require("utils");
	_oDialog = require("dialog");
	_oTranslator = require("translator");
	_oResponse = require("isapi/response");

	function BasicTcpIp() {
	}

	BasicTcpIp.prototype = {
		// 页面初始化
		init: function () {
			this.initController();
		},
		// 初始化控制器
		initController: function () {
			angular.module("basicTcpIpApp", ["ui.config"])
				.service("service", function () {
					var that = this;
					this.m_oScope = null;
					this.m_oLan = _oTranslator.oLastLanguage;
					this.m_oCapbilities = {
						bSupportWorkMode: false,
						aEthernetTypeSupport: [true, true, true, true, true, true],  //网卡类型能力
						aNetworkMode: [false, false],  //网卡模式能力
						aMtuRange: [500, 9676],  //mtu范围
                        bSptIPCMulticast: false,  //兼容by tangzz前端多播地址
                        bSptUsePhoneSadp: false,  //是否支持多播搜索
                        bSptActiveMulticast: false	//是否支持主动多播
					};
					this.m_oParams = {
						szNetworkMode: "",
						aEthernetNames: ["Lan1", "Lan2"],						
						szMainEthernet: "1",
						bEnablePPPoE: false,
                        bUsePhoneSadp: false,
                        szMulticast: "",
                        szMulticastXml: "",
                        bEnableActiveMulticast: false,
                        szActiveMulticastStream: "main",
                        szActiveMulticastAddr: "",
                        szActiveMulticastPort: "0"
					};
					this.m_oParamsValid = {
						oIpValid: {
							oType: {value: "ip", error: that.m_oLan.wrong + that.m_oLan.ipAddr},
							oEmpty: {value: false, error: that.m_oLan.nullTips},
							oUnicast: {value: false, error: that.m_oLan.firstIPSegment}
						},
						oIpMask: {
							oType: {value: "mask", error: that.m_oLan.wrong + that.m_oLan.subNetMask},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oIpGetway: {
							oType: {value: "ip", error: that.m_oLan.wrong + that.m_oLan.ipAddr},
							oUnicast: {value: false, error: that.m_oLan.firstIPSegment}
						},
						oMtu: {
							oMinValue: {
								value: that.m_oCapbilities.aMtuRange[0],
								error: _oTranslator.getValue("range", that.m_oCapbilities.aMtuRange)
							},
							oMaxValue: {
								value: that.m_oCapbilities.aMtuRange[1],
								error: _oTranslator.getValue("range", that.m_oCapbilities.aMtuRange)
							},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oMainDns: {
							oType: {value: "ip", error: that.m_oLan.wrong + that.m_oLan.ipAddr},
							oUnicast: {value: false, error: that.m_oLan.firstIPSegment}
						},
						oSubDns: {
							oType: {value: "ip", error: that.m_oLan.wrong + that.m_oLan.ipAddr},
							oUnicast: {value: false, error: that.m_oLan.firstIPSegment}
						},
						oIpv6Addr: {
							oType: {value: "ipv6", error: that.m_oLan.wrong + that.m_oLan.ipAddr},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oIpv6Bitmask: {
							oMinValue: {
								value: 3,
								error: _oTranslator.getValue("range", [3, 127])
							},
							oMaxValue: {
								value: 127,
								error: _oTranslator.getValue("range", [3, 127])
							},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oIpv6GateWay: {
							oType: {value: "ipv6", error: that.m_oLan.wrong + that.m_oLan.ipAddr}
						},
                        oMulticast: {
                            oType: {value: "ipcmulticast", error: that.m_oLan.wrong + that.m_oLan.multicast}
                        },
                        oActiveMulticastAddr: {
                            oType: {value: "ipcmulticast", error: that.m_oLan.wrong + that.m_oLan.multicast}
                        },
						oActiveMulticastPort: {
							oMinValue: {
								value: 1,
								error: _oTranslator.getValue("range", [1, 1])
							},
							oMaxValue: {
								value: 1,
								error: _oTranslator.getValue("range", [1, 1])
							},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						}
					};
					this.m_aEthernetParams = [];
					this.initParams = function () {
						for (var i = 0; i < 6; i++) {
							that.m_aEthernetParams.push({
								iID: 0,
								szEthernetType: "",
								bDhcp: false,
								szIpv4: "",
								szIpv4Mask: "",
								szIpv4Gateway: "",
								szIpv6: "",
								szIpv6Gateway: "",
								szIpv6Bitmask: "",
								szMacAddress: "",
								szMtu: "",
								bSupportMtu: false,
								bSupportIpv6: true,
								bSupportIpv6Mode: false,
								szIpv6Mode: "",
								bSupportNicType: false,
								szPrimaryDns: "",
								szAlternateDns: ""
							});
						}
					};
					var oXmlBond = null;
					var oXmlNetwork = null;
					var oRouteAdList = [];

					//网络初始化
					this.initNetwork = function () {
						that.initParams();
						that.getPPPoEInfo();
                        //兼容by tangzz 前端才有手机多播搜索及多播地址设置
                        if (1 == seajs.iDeviceType) {  //兼容by tangzz 前端才有手机多播搜索及多播地址设置
                            that.getMulticast();
                            that.getPhoneSadpInfo();
                        }
						that.getNetworkCabs();
						that.getNetworkInfo();
					};

                    //获取多播搜索信息
                    this.getPhoneSadpInfo = function () {
                        WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "phoneSadpInfo", null, {
                            async: false,
                            success: function (status, xmlDoc) {
                                if ($(xmlDoc).find('ONVIFDiscoveryMode').length > 0 || $(xmlDoc).find('ISDiscoveryMode').length > 0) {
                                    that.m_oCapbilities.bSptUsePhoneSadp = true;
                                    if ($(xmlDoc).find('ONVIFDiscoveryMode').eq(0).text() == 'discoverable'
                                        || $(xmlDoc).find('ISDiscoveryMode').eq(0).text() == 'discoverable') {
                                        that.m_oParams.bUsePhoneSadp = true;
                                    } else {
                                        that.m_oParams.bUsePhoneSadp = false;
                                    }
                                } else {
                                    that.m_oCapbilities.bSptUsePhoneSadp = false;
                                }
                            }
                        });
                    };

					this.getPPPoEInfo = function () {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "PPPoEInfo", null, {
							async: false,
							success: function (status, xmlDoc) {
								that.m_oParams.bEnablePPPoE = _oUtils.nodeValue($(xmlDoc), "enabled", "b");
							}
						});
					};

					//获取能力
					this.getNetworkCabs = function () {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "networkInterfaceCapa", null, {
							async: false,
							success: function (status, xmlDoc) {
								that.m_oCapbilities.aEthernetTypeSupport = [false, false, false, false, false, false];
								if ($(xmlDoc).find("Link").eq(0).find("autoNegotiation").eq(0).attr("opt") !== undefined) {
									if ($(xmlDoc).find("Link").eq(0).find("autoNegotiation").eq(0).attr("opt").split(",").length === 2) {
										that.m_oCapbilities.aEthernetTypeSupport[4] = true;
									}
								} else if ($(xmlDoc).find("Link").eq(0).find("autoNegotiation").eq(0).text() === "true") {
									that.m_oCapbilities.aEthernetTypeSupport[4] = true;
								}
								var aSpeedOptions = [];
								if ($(xmlDoc).find("Link").eq(0).find("speed").eq(0).attr("opt") !== undefined) {
									aSpeedOptions = $(xmlDoc).find("Link").eq(0).find("speed").eq(0).attr("opt").split(",");
								}
								var aDuplexOptions = [];
								if ($(xmlDoc).find("Link").eq(0).find("duplex").eq(0).attr("opt") !== undefined) {
									aDuplexOptions = $(xmlDoc).find("Link").eq(0).find("duplex").eq(0).attr("opt").split(",");
								}
								for (var i = 0; i < aSpeedOptions.length; i++) {
									if (aDuplexOptions.length === 2) {
										if (aSpeedOptions[i] === "10") {
											that.m_oCapbilities.aEthernetTypeSupport[0] = true;
											that.m_oCapbilities.aEthernetTypeSupport[1] = true;
										} else if (aSpeedOptions[i] === "100") {
											that.m_oCapbilities.aEthernetTypeSupport[2] = true;
											that.m_oCapbilities.aEthernetTypeSupport[3] = true;
										} else if (aSpeedOptions[i] === "1000") {
											that.m_oCapbilities.aEthernetTypeSupport[5] = true;
										}
									} else {
										if (aDuplexOptions[0] === "half") {
											if (aSpeedOptions[i] === "10") {
												that.m_oCapbilities.aEthernetTypeSupport[0] = true;
											} else if (aSpeedOptions[i] === "100") {
												that.m_oCapbilities.aEthernetTypeSupport[2] = true;
											}
										} else {
											if (aSpeedOptions[i] === "10") {
												that.m_oCapbilities.aEthernetTypeSupport[1] = true;
											} else if (aSpeedOptions[i] === "100") {
												that.m_oCapbilities.aEthernetTypeSupport[3] = true;
											} else if (aSpeedOptions[i] === "1000") {
												that.m_oCapbilities.aEthernetTypeSupport[5] = true;
											}
										}
									}
								}
								if ($(xmlDoc).find("MTU").eq(0).attr("min") !== null) {
									that.m_oCapbilities.aMtuRange[0] = parseInt($(xmlDoc).find("MTU").eq(0).attr("min"), 10);
									that.m_oCapbilities.aMtuRange[1] = parseInt($(xmlDoc).find("MTU").eq(0).attr("max"), 10);
									that.m_oParamsValid.oMtu.oMinValue.value = that.m_oCapbilities.aMtuRange[0];
									that.m_oParamsValid.oMtu.oMaxValue.value = that.m_oCapbilities.aMtuRange[1];
									that.m_oParamsValid.oMtu.oMinValue.error = _oTranslator.getValue("range", that.m_oCapbilities.aMtuRange);
									that.m_oParamsValid.oMtu.oMaxValue.error = _oTranslator.getValue("range", that.m_oCapbilities.aMtuRange);
								}

								if ($(xmlDoc).find("ActiveMulticast").length) {
									that.m_oCapbilities.bSptActiveMulticast = true;
									that.m_oParamsValid.oActiveMulticastAddr.bSkipValid = false;
									that.m_oParamsValid.oActiveMulticastPort.bSkipValid = false;
									$(xmlDoc).find("ActiveMulticast").each(function () {
										var iPortMin = _oUtils.nodeAttr(this, "port", "min", "i");
										var iPortMax = _oUtils.nodeAttr(this, "port", "max", "i");
										that.m_oParamsValid.oActiveMulticastPort.oMinValue = {
											value: iPortMin,
											error: _oTranslator.getValue("range", [iPortMin, iPortMax])
										};

										that.m_oParamsValid.oActiveMulticastPort.oMaxValue = {
											value: iPortMax,
											error: _oTranslator.getValue("range", [iPortMin, iPortMax])
										}
									});
								} else {
									that.m_oCapbilities.bSptActiveMulticast = false;
									that.m_oParamsValid.oActiveMulticastAddr.bSkipValid = true;
									that.m_oParamsValid.oActiveMulticastPort.bSkipValid = true;
								}
							}
						});
						//获取bond能力
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "networkBondCapa", null, {
							async: false,
							success: function (status, xmlDoc) {
								that.m_oCapbilities.bSupportWorkMode = true;
								var aNetworkModeOptions = $(xmlDoc).find("workMode").eq(0).attr("opt").split(",");
								if (aNetworkModeOptions.length == 1) {
									if (aNetworkModeOptions[0] == "active-backup") {
										that.m_oCapbilities.aNetworkMode[0] = true;
									} else {
										that.m_oCapbilities.aNetworkMode[1] = true;
									}
								} else {
									that.m_oCapbilities.aNetworkMode[0] = true;
									that.m_oCapbilities.aNetworkMode[1] = true;
								}
							},
							error: function (status, xmlDoc) {
								that.m_oCapbilities.bSupportWorkMode = false;
							}
						});
					};
					//获取网络信息
					this.getNetworkInfo = function () {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "networkBond", null, {
							async: false,
							success: function (status, xmlDoc) {
								oXmlBond = xmlDoc;
								if(_oUtils.nodeValue($(xmlDoc), "enabled") === "false") {
									that.m_oParams.szNetworkMode = "1";
								} else {
									that.m_oParams.szNetworkMode = _oUtils.nodeValue($(xmlDoc), "workMode");
								}
								var szSpeed = _oUtils.nodeValue($(xmlDoc), "speed");
								var szDuplex = _oUtils.nodeValue($(xmlDoc), "duplex");
								var szAutoNegotiation = _oUtils.nodeValue($(xmlDoc), "autoNegotiation");
								if("" !== szAutoNegotiation) {										
									that.m_aEthernetParams[0].bSupportNicType = true;
								} else {
									that.m_aEthernetParams[0].bSupportNicType = false;
								}
								if (szAutoNegotiation === "true") {
									that.m_aEthernetParams[0].szEthernetType = "5";
								} else if (szSpeed === "10") {
									if (szDuplex === "half") {
										that.m_aEthernetParams[0].szEthernetType = "1";
									} else if (szDuplex === "full") {
										that.m_aEthernetParams[0].szEthernetType = "2";
									}
								} else if (szSpeed === "100") {
									if (szDuplex === "half") {
										that.m_aEthernetParams[0].szEthernetType = "3";
									} else if (szDuplex === "full") {
										that.m_aEthernetParams[0].szEthernetType = "4";
									}
								} else if (szSpeed === "1000") {
									that.m_aEthernetParams[0].szEthernetType = "6";
								} else {
									that.m_aEthernetParams[0].szEthernetType = "1";
								}
								that.m_aEthernetParams[0].bDhcp = (_oUtils.nodeValue($(xmlDoc), "addressingType") === "dynamic");
								that.m_aEthernetParams[0].szIpv4 = _oUtils.nodeValue($(xmlDoc), "ipAddress");
								that.m_aEthernetParams[0].szIpv4Mask = _oUtils.nodeValue($(xmlDoc), "subnetMask");
								if (_oUtils.nodeValue($(xmlDoc).find("DefaultGateway").eq(0), "ipAddress") === "0.0.0.0") {
									that.m_aEthernetParams[0].szIpv4Gateway = "";
								} else {
									that.m_aEthernetParams[0].szIpv4Gateway = _oUtils.nodeValue($(xmlDoc).find("DefaultGateway").eq(0), "ipAddress");
								}
								that.m_aEthernetParams[0].szIpv6 = _oUtils.nodeValue($(xmlDoc), "ipv6Address");
								that.m_aEthernetParams[0].szIpv6Bitmask = _oUtils.nodeValue($(xmlDoc), "bitMask");
								that.m_aEthernetParams[0].szIpv6Gateway = _oUtils.nodeValue($(xmlDoc).find("DefaultGateway").eq(0), "ipv6Address");
								that.m_aEthernetParams[0].szMacAddress = _oUtils.nodeValue($(xmlDoc), "MACAddress");
								that.m_aEthernetParams[0].szMtu = _oUtils.nodeValue($(xmlDoc), "MTU");
								if($(xmlDoc).find("MTU").length > 0) {
									that.m_aEthernetParams[0].bSupportMtu = true;
								}
								if (_oUtils.nodeValue($(xmlDoc).find("PrimaryDNS").eq(0), "ipAddress") === "0.0.0.0") {
									that.m_aEthernetParams[0].szPrimaryDns = "";
								} else {
									that.m_aEthernetParams[0].szPrimaryDns = _oUtils.nodeValue($(xmlDoc).find("PrimaryDNS").eq(0), "ipAddress");
								}
								if (_oUtils.nodeValue($(xmlDoc).find("SecondaryDNS").eq(0), "ipAddress") === "0.0.0.0") {
									that.m_aEthernetParams[0].szAlternateDns = "";
								} else {
									that.m_aEthernetParams[0].szAlternateDns = _oUtils.nodeValue($(xmlDoc).find("SecondaryDNS").eq(0), "ipAddress");
								}
								if($(xmlDoc).find("primaryIf").length > 0) {
									that.m_oParams.szMainEthernet = _oUtils.nodeValue($(xmlDoc), "primaryIf");
								}
								if($(xmlDoc).find("ipv6Address").length === 0) {
									that.m_aEthernetParams[0].bSupportIpv6 = false;
								}
								if($(xmlDoc).find("ipV6AddressingType").length === 0) {
									that.m_aEthernetParams[0].bSupportIpv6Mode = false;
								}
							},
							error: function (status, xmlDoc) {
								that.m_oParams.szNetworkMode = "1";
							}
						});
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "networkInterface", null, {
							async: false,
							success: function (status, xmlDoc) {
								oXmlNetwork = xmlDoc;
								var oEthernetType = {
									LAN: 1,
									WLAN: 2
								};

								var iLan = 0;
								var iWlan = 0;
								var aEthernetNames = that.m_oParams.aEthernetNames;	
								aEthernetNames.length = 0;
								$(xmlDoc).find("NetworkInterface").each(function (j) {
									var i = j+1;
									if ($(this).find("Wireless").length) {
										aEthernetNames.push("Wlan" + (++iWlan));
									} else {
										aEthernetNames.push("Lan" + (++iLan));
									}
									// that.m_oParams.aEthernetNames.push("Lan" + i);
									var szSpeed = _oUtils.nodeValue($(this), "speed");
									var szDuplex = _oUtils.nodeValue($(this), "duplex");
									var szAutoNegotiation = _oUtils.nodeValue($(this), "autoNegotiation");
									that.m_aEthernetParams[i].iID = _oUtils.nodeValue(this, "id", "i");
									if("" !== szAutoNegotiation) {										
										that.m_aEthernetParams[i].bSupportNicType = true;
									} else {
										that.m_aEthernetParams[i].bSupportNicType = false;
									}
									if (szAutoNegotiation === "true") {
										that.m_aEthernetParams[i].szEthernetType = "5";
									} else if (szSpeed === "10") {
										if (szDuplex === "half") {
											that.m_aEthernetParams[i].szEthernetType = "1";
										} else if (szDuplex === "full") {
											that.m_aEthernetParams[i].szEthernetType = "2";
										}
									} else if (szSpeed === "100") {
										if (szDuplex === "half") {
											that.m_aEthernetParams[i].szEthernetType = "3";
										} else if (szDuplex === "full") {
											that.m_aEthernetParams[i].szEthernetType = "4";
										}
									} else if (szSpeed === "1000") {
										that.m_aEthernetParams[i].szEthernetType = "6";
									} else {
										that.m_aEthernetParams[i].szEthernetType = "1";
									}
									that.m_aEthernetParams[i].bDhcp = (_oUtils.nodeValue($(this), "addressingType") === "dynamic");
									that.m_aEthernetParams[i].szIpv4 = _oUtils.nodeValue($(this), "ipAddress");
									that.m_aEthernetParams[i].szIpv4Mask = _oUtils.nodeValue($(this), "subnetMask");
									if (_oUtils.nodeValue($(this).find("DefaultGateway").eq(0), "ipAddress") === "0.0.0.0") {
										that.m_aEthernetParams[i].szIpv4Gateway = "";
									} else {
										that.m_aEthernetParams[i].szIpv4Gateway = _oUtils.nodeValue($(this).find("DefaultGateway").eq(0), "ipAddress");
									}
									that.m_aEthernetParams[i].szIpv6 = _oUtils.nodeValue($(this), "ipv6Address");
									that.m_aEthernetParams[i].szIpv6Bitmask = _oUtils.nodeValue($(this), "bitMask");
									that.m_aEthernetParams[i].szIpv6Gateway = _oUtils.nodeValue($(this).find("DefaultGateway").eq(0), "ipv6Address");
									that.m_aEthernetParams[i].szMacAddress = _oUtils.nodeValue($(this), "MACAddress");
									that.m_aEthernetParams[i].szMtu = _oUtils.nodeValue($(this), "MTU");
									if($(this).find("MTU").length > 0) {
										that.m_aEthernetParams[i].bSupportMtu = true;
									}
									if (_oUtils.nodeValue($(this).find("PrimaryDNS").eq(0), "ipAddress") === "0.0.0.0") {
										that.m_aEthernetParams[i].szPrimaryDns = "";
									} else {
										that.m_aEthernetParams[i].szPrimaryDns = _oUtils.nodeValue($(this).find("PrimaryDNS").eq(0), "ipAddress");
									}
									if (_oUtils.nodeValue($(this).find("SecondaryDNS").eq(0), "ipAddress") === "0.0.0.0") {
										that.m_aEthernetParams[i].szAlternateDns = "";
									} else {
										that.m_aEthernetParams[i].szAlternateDns = _oUtils.nodeValue($(this).find("SecondaryDNS").eq(0), "ipAddress");
									}
									if($(xmlDoc).find("primaryIf").length > 0) {
										that.m_oParams.szMainEthernet = _oUtils.nodeValue($(this), "primaryIf");
									}
									if($(this).find("ipv6Address").length === 0) {
										that.m_aEthernetParams[i].bSupportIpv6 = false;
									}
									if($(this).find("ipV6AddressingType").length > 0) {
										that.m_aEthernetParams[i].szIpv6Mode = _oUtils.nodeValue($(this), "ipV6AddressingType");
										that.m_aEthernetParams[i].bSupportIpv6Mode = true;
									} else {
										that.m_aEthernetParams[i].bSupportIpv6Mode = false;
									}

									var oActiveMulticast = $(xmlDoc).find("ActiveMulticast").eq(0);
									if (oActiveMulticast.length) {
										var oParams = that.m_oParams;
										oParams.bEnableActiveMulticast = _oUtils.nodeValue(oActiveMulticast, "enabled", "b");
										oParams.szActiveMulticastAddr = _oUtils.nodeValue(oActiveMulticast, "ipV4Address") || _oUtils.nodeValue(oActiveMulticast, "ipV6Address");
										oParams.szActiveMulticastPort = _oUtils.nodeValue(oActiveMulticast, "port");
										oParams.szActiveMulticastStream = _oUtils.nodeValue(oActiveMulticast, "streamID");
									}									
								});
	
								//路由公告
								oRouteAdList.length = 0;
								$(xmlDoc).find("IPAddress").eq(0).find("ipv6AddressList").eq(0).find("v6Address").each(function (i) {
									if($(this).find("type").eq(0).text() === "ra") {
										var aData = [];
										aData[0] = i+1;
										aData[1] = $(this).find("address").eq(0).text();
										oRouteAdList.push(aData);
									}
								});


								$.each(aEthernetNames, function (i) {
									if (1 === iLan && "Lan1" === aEthernetNames[i]) {
										aEthernetNames[i] = "Lan";
									}

									if (1 === iWlan && "Wlan1" === aEthernetNames[i]) {
										aEthernetNames[i] = "Wlan";
									}
								});
							}
						});
					};
                    //获取多播地址信息
                    this.getMulticast = function () {
                        WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "MulticastInfo", null, {
                            async: false,
                            success: function (status, xmlDoc, xhr) {
                                that.m_oParams.szMulticastXml = xhr.responseText;
                                if ($(xmlDoc).find('Transport').eq(0).find('Multicast').length > 0) {
                                    var szMulticast = "";
                                    that.m_oCapbilities.bSptIPCMulticast = true;
                                    if ($(xmlDoc).find('Transport').eq(0).find('Multicast').eq(0).find('destIPAddress').length > 0) {
                                        szMulticast = $(xmlDoc).find('Transport').eq(0).find('Multicast').eq(0).find('destIPAddress').eq(0).text();
                                    } else if ($(xmlDoc).find('Transport').eq(0).find('Multicast').eq(0).find('destIPv6Address').length > 0) {
                                        szMulticast = $(xmlDoc).find('Transport').eq(0).find('Multicast').eq(0).find('destIPv6Address').eq(0).text();
                                    }
                                    if ("::" == szMulticast || "0.0.0.0" == szMulticast) {
                                        that.m_oParams.szMulticast = '';
                                    } else {
                                        that.m_oParams.szMulticast = szMulticast;
                                    }
                                } else {
                                    that.m_oCapbilities.bSptIPCMulticast = false;
                                }
                            }
                        });
                    };

					this.save = function () {
						that.m_oScope.oInputValidUtils.manualInputValid();
						if (!that.m_oScope.oInputValid.bInputValid) {
							return;
						}
                        //先手机sadp设置下
                        that.setPhoneSadpInfo();
                        that.setMulticast();
						if (that.m_oCapbilities.bSupportWorkMode) {
							if (that.m_oParams.szNetworkMode !== "1") {
								var xmlDoc = that.setXml(oXmlBond, 0);
								WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "networkBond", null, {
									processData: false,
									data: xmlDoc,
									complete: function (status, xmlDoc, xhr) {
										_oResponse.saveState(xhr);
									}
								});
							} else {
								$(oXmlBond).find("enabled").eq(0).text("false");
								$(oXmlBond).find("workMode").eq(0).text("1");
								WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "networkBond", null, {
									processData: false,
									data: oXmlBond,
									complete: function (status, xmlDoc, xhr) {
										that.setNetworkInterfaceInfo(xhr);
									}
								});
							}
						} else {
							that.setNetworkInterfaceInfo();
						}
					};

					this.setXml = function (oXmlDoc, iIndex) {
						var szXml = "<?xml version='1.0' encoding='UTF-8'?>";
						var szSpeed = "";
						var szDuplex = "";
						var szAutoNegotiation = "";
						if (that.m_aEthernetParams[iIndex].szEthernetType === "1") {
							szSpeed = "10";
							szDuplex = "half";
							szAutoNegotiation = "false";
						} else if (that.m_aEthernetParams[iIndex].szEthernetType === "2") {
							szSpeed = "10";
							szDuplex = "full";
							szAutoNegotiation = "false";
						} else if (that.m_aEthernetParams[iIndex].szEthernetType === "3") {
							szSpeed = "100";
							szDuplex = "half";
							szAutoNegotiation = "false";
						} else if (that.m_aEthernetParams[iIndex].szEthernetType === "4") {
							szSpeed = "100";
							szDuplex = "full";
							szAutoNegotiation = "false";
						} else if (that.m_aEthernetParams[iIndex].szEthernetType === "6") {
							szSpeed = "1000";
							szDuplex = "full";
							szAutoNegotiation = "false";
						} else if (that.m_aEthernetParams[iIndex].szEthernetType === "5") {
							szSpeed = "0";
							szDuplex = "full";
							szAutoNegotiation = "true";
						}
						if (iIndex === 0) {
							szXml += "<Bond><id>1</id>";
							szXml += "<enabled>true</enabled><workMode>" + that.m_oParams.szNetworkMode + "</workMode>" +
								"<primaryIf>" + that.m_oParams.szMainEthernet + "</primaryIf>" +
								"<slaveIfList><ethernetIfId>1</ethernetIfId><ethernetIfId>2</ethernetIfId></slaveIfList>";
						} else {
							szXml += "<NetworkInterface><id>" + that.m_aEthernetParams[iIndex].iID + "</id>";
						}
						szXml += "<IPAddress><ipVersion>" + _oUtils.nodeValue(oXmlDoc, "ipVersion") + "</ipVersion>" +
							"<addressingType>" + (that.m_aEthernetParams[iIndex].bDhcp ? "dynamic" : "static") + "</addressingType>" +
							"<ipAddress>" + that.m_aEthernetParams[iIndex].szIpv4 + "</ipAddress>" +
							"<subnetMask>" + that.m_aEthernetParams[iIndex].szIpv4Mask + "</subnetMask>";
						if(that.m_aEthernetParams[iIndex].bSupportIpv6Mode) {
							if(that.m_aEthernetParams[iIndex].szIpv6Mode === "manual") {
								szXml += "<ipv6Address>" + that.m_aEthernetParams[iIndex].szIpv6 + "</ipv6Address>";
								szXml += "<bitMask>" + that.m_aEthernetParams[iIndex].szIpv6Bitmask + "</bitMask>";
								if(that.m_aEthernetParams[iIndex].szIpv6Bitmask) {

								}
							}
							szXml += "<ipV6AddressingType>" + that.m_aEthernetParams[iIndex].szIpv6Mode + "</ipV6AddressingType>";
						}
						szXml += "<DefaultGateway>";
						if (that.m_aEthernetParams[iIndex].szIpv4Gateway === "") {
							szXml += "<ipAddress>0.0.0.0</ipAddress>";
						} else {
							szXml += "<ipAddress>" + that.m_aEthernetParams[iIndex].szIpv4Gateway + "</ipAddress>";
						}
						if(that.m_aEthernetParams[iIndex].szIpv6Mode === "manual") {
							if(that.m_aEthernetParams[iIndex].szIpv6Gateway === "") {
								szXml += "<ipv6Address>::</ipv6Address>";
							} else {
								szXml += "<ipv6Address>" + that.m_aEthernetParams[iIndex].szIpv6Gateway + "</ipv6Address>";
							}
						}
						szXml += "</DefaultGateway>";
						if (that.m_aEthernetParams[iIndex].szPrimaryDns === "") {
							szXml += "<PrimaryDNS><ipAddress>0.0.0.0</ipAddress></PrimaryDNS>";
						} else {
							szXml += "<PrimaryDNS><ipAddress>" + that.m_aEthernetParams[iIndex].szPrimaryDns + "</ipAddress></PrimaryDNS>";
						}
						if (that.m_aEthernetParams[iIndex].szAlternateDns === "") {
							szXml += "<SecondaryDNS><ipAddress>0.0.0.0</ipAddress></SecondaryDNS>";
						} else {
							szXml += "<SecondaryDNS><ipAddress>" + that.m_aEthernetParams[iIndex].szAlternateDns + "</ipAddress></SecondaryDNS>";
						}
						szXml += "</IPAddress>";
						szXml += "<Link><MACAddress>" + _oUtils.nodeValue(oXmlDoc, "MACAddress") + "</MACAddress>" +
							"<autoNegotiation>" + szAutoNegotiation + "</autoNegotiation>" +
							"<speed>" + szSpeed + "</speed><duplex>" + szDuplex + "</duplex>";
						if(that.m_aEthernetParams[iIndex].szMtu !== "") {
							szXml += "<MTU>" + that.m_aEthernetParams[iIndex].szMtu + "</MTU>";
						}
						szXml += "</Link>";
						if (iIndex === 0) {
							szXml += "</Bond>";
						} else {
							if (that.m_oCapbilities.bSptActiveMulticast) {
								var oParams = that.m_oParams;
								szXml += "<ActiveMulticast>";
								szXml += "<enabled>" + oParams.bEnableActiveMulticast.toString() + "</enabled>";
								szXml += "<streamID>" + oParams.szActiveMulticastStream + "</streamID>";
								szXml += "<port>" + oParams.szActiveMulticastPort + "</port>";
								if ("" === oParams.szActiveMulticastAddr) {
									szXml += "<ipV4Address>0.0.0.0</ipV4Address>";
								} else {
									var szIpAddressType = _oUtils.checkAddressingType(oParams.szActiveMulticastAddr);
									if (szIpAddressType === "ipAddress") {
										szXml += "<ipV4Address>" + oParams.szActiveMulticastAddr + "</ipV4Address>";
									} else if (szIpAddressType === "ipV6Address") {
										szXml += "<ipV6Address>" + oParams.szActiveMulticastAddr + "</ipV6Address>";
									}
								}								
								szXml += "</ActiveMulticast>";
							}
							szXml += "</NetworkInterface>";
						}
						var xmlDoc = _oUtils.parseXmlFromStr(szXml);
						return xmlDoc;
					};
					//设置网络信息
					this.setNetworkInterfaceInfo = function (oXhr) {
						var xmlDoc = null;
						var oErrorXhr = null;
						var oSuccessXhr = null;
						var oRebootXhr = null;
						$(oXmlNetwork).find("NetworkInterface").each(function (i) {
							xmlDoc = that.setXml(this, i+1);
							WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "networkInterfacePut", {interface: that.m_aEthernetParams[i+1].iID}, {
								processData: false,
								async: false,
								data: xmlDoc,
								success: function (status, xmlDoc, xhr) {
									if($(xmlDoc).find("statusCode").eq(0).text() === "7") {
										oRebootXhr = xhr;  //修改mtu值可能返回重启
									} else {
										oSuccessXhr = xhr;
									}
								},
								error: function (status, xmlDoc, xhr) {
									oErrorXhr = xhr;
								}
							});
						});
						if (oXhr === undefined || oXhr.status === 200) {
							if (oErrorXhr !== null) {
								_oResponse.saveState(oErrorXhr);
							} else {
								if(oXhr !== undefined && $(oXhr.responseXML).find("statusCode").eq(0).text() === "7") {  //更改网络模式需要重启
									_oResponse.saveState(oXhr);
								} else {
									if (oRebootXhr !== null) {
										_oResponse.saveState(oRebootXhr);
									} else {
										_oResponse.saveState(oSuccessXhr);
									}
								}
							}
						} else {
							_oResponse.saveState(oXhr);
						}
					};
                    //设置启用多播搜索
                    this.setPhoneSadpInfo = function () {
                        var szMode = 'nonDiscoverable';
                        var szXml = "";
                        if (!that.m_oCapbilities.bSptUsePhoneSadp) {
                            return;
                        }
                        if (that.m_oParams.bUsePhoneSadp) {
                            szMode = 'discoverable';
                        }
                        szXml = "<?xml version='1.0' encoding='UTF-8'?><DiscoveryMode><ONVIFDiscoveryMode>"+szMode+"</ONVIFDiscoveryMode>";
                        szXml += "<ISDiscoveryMode>"+szMode+"</ISDiscoveryMode></DiscoveryMode>";
                        var xmlDoc = _oUtils.parseXmlFromStr(szXml);
                        WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "phoneSadpInfo", null, {
                            data: xmlDoc,
                            success: function (status, xmlDoc) {
                            }
                        });
                    };
                    //设置多播地址
                    this.setMulticast = function () {
                        if (!that.m_oCapbilities.bSptIPCMulticast) {
                            return;
                        }
                        var szMulticast = that.m_oParams.szMulticast;
                        var xmlDoc = _oUtils.parseXmlFromStr(that.m_oParams.szMulticastXml);
                        var oMulticastTemp = $(xmlDoc).find("Transport").eq(0).children("Multicast").eq(0)
                        if (_oUtils.checkAddressingType(szMulticast) != "ipv6Address") {
                            if (oMulticastTemp.find("destIPAddress").length > 0) {
                                oMulticastTemp.find("destIPAddress").eq(0).text(szMulticast == "" ? "0.0.0.0" : szMulticast);
                            } else {
                                oMulticastTemp.append($(_oUtils.parseXmlFromStr('<?xml version="1.0" encoding="UTF-8"?><Multicast><destIPAddress>' + (szMulticast == "" ? "0.0.0.0" : szMulticast) + '</destIPAddress></Multicast>')).find("Multicast").eq(0).clone().children());
                            }
                            if (oMulticastTemp.find("destIPv6Address").length > 0) {
                                oMulticastTemp.find("destIPv6Address").eq(0).remove();
                            }
                        } else {
                            if (oMulticastTemp.find("destIPAddress").length > 0) {
                                oMulticastTemp.find("destIPAddress").eq(0).remove();
                            }
                            if (oMulticastTemp.find("destIPv6Address").length > 0) {
                                oMulticastTemp.find("destIPv6Address").eq(0).text(szMulticast == "" ? "::" : szMulticast);
                            } else {
                                oMulticastTemp.append($(_oUtils.parseXmlFromStr('<?xml version="1.0" encoding="UTF-8"?><Multicast><destIPv6Address>' + (szMulticast == "" ? "::" : szMulticast) + '</destIPv6Address></Multicast>')).find("Multicast").eq(0).clone().children());
                            }
                        }
                        var oMulticast = _oUtils.parseXmlFromStr('<?xml version="1.0" encoding="UTF-8"?><StreamingChannel><Transport></Transport></StreamingChannel>');
                        var oTransport = $(oMulticast).find("Transport").eq(0);
                        oTransport.append($(xmlDoc).find("Transport").eq(0).clone().children("ControlProtocolList"));
                        oTransport.append($(xmlDoc).find("Transport").eq(0).clone().children("Multicast"));
                        WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "MulticastInfo", null, {
                            data: xmlDoc,
                            success: function (status, xmlDoc) {

                            }
                        });
                    };
					//测试ip
					this.testIP = function () {
						var szXml = "<?xml version='1.0' encoding='UTF-8'?><pingTestDescription>";
						szXml += "<ipAddress>" + that.m_oScope.oEthernetParams.szIpv4 + "</ipAddress>";
						szXml += "</pingTestDescription>";
						var xmlDoc = _oUtils.parseXmlFromStr(szXml);
						var oWait = _oDialog.wait("", that.m_oLan.Testing);
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "ipTest", null, {
							data: xmlDoc,
							success: function (status, xmlDoc) {
								setTimeout(function () {
									oWait.close();
									var szTips = that.m_oLan.TestFailed;
									var szErrrorDes = _oUtils.nodeValue($(xmlDoc), "status");
									switch (szErrrorDes) {
										case "used":
											szTips = that.m_oLan.ipUsed;
											break;
										case "not used":
											szTips = that.m_oLan.ipNotUsed;
											break;
										default :
											break;
									}
									_oDialog.alert(szTips);
								}, 2000);
							},
							error: function (status, xmlDoc) {
								setTimeout(function () {
									oWait.close();
								}, 2000);
							}
						});
					};
					this.viewRouterAd = function () {
						_oDialog.html(that.m_oLan.viewRouterAd, "<div><div id='tableRouterAd' class='width400 height150'></div></div>");
						var oTable = $("#tableRouterAd").table({
							header: [
								{
									display: that.m_oLan.serialNumber,
									width: "100"
								},
								{
									display: "IPv6",
									width: "280"
								}
							]
						});
						oTable.addRows(oRouteAdList);
					};
				})
				.controller("basicTcpIpController", function ($scope, service) {
					service.m_oScope = $scope;
					$scope.oLan = service.m_oLan;
					$scope.oCapbilities = service.m_oCapbilities;
					$scope.oParams = service.m_oParams;
					$scope.save = service.save;
					$scope.testIP = service.testIP;
					$scope.viewRouterAd = service.viewRouterAd;
					//参数验证
					$scope.oUtils = _oUtils;
					$scope.oParamsValid = service.m_oParamsValid;
					$scope.oInputValid = {};
					$scope.aInputValidList = [];
					$scope.oInputValidUtils = {};
					//切换网卡
					$scope.changeEthernet = function (i) {
						$scope.oInputValidUtils.manualInputValid();
						if (!$scope.oInputValid.bInputValid) {
							return;
						} else {
							_oUtils.hideValidTip();
						}
						if ($scope.oParams.szNetworkMode === "1") {
							$scope.oEthernetParams = service.m_aEthernetParams[i+1];
						}
						if(!$scope.oEthernetParams.bSupportMtu) {
							$scope.oParamsValid.oMtu.bSkipValid = true;
						}
						if(!$scope.oEthernetParams.bSupportIpv6) {
							$scope.oParamsValid.oIpv6Addr.bSkipValid = true;
							$scope.oParamsValid.oIpv6Bitmask.bSkipValid = true;
						}
					};
					$scope.$watch("oEthernetParams.szIpv6Mode", function (to, from) {
						if (to === "manual") {
							$scope.oParamsValid.oIpv6Addr.bSkipValid = false;
							$scope.oParamsValid.oIpv6Bitmask.bSkipValid = false;
							$scope.oParamsValid.oIpv6GateWay.bSkipValid = false;
						} else {
							$scope.oParamsValid.oIpv6Addr.bSkipValid = true;
							$scope.oParamsValid.oIpv6Bitmask.bSkipValid = true;
							$scope.oParamsValid.oIpv6GateWay.bSkipValid = true;
						}
					});
					$scope.$watch("oParams.szNetworkMode", function (to, from) {
						if (to !== "1") {
							if ($scope.oCapbilities.bSupportWorkMode) {
								$scope.oEthernetParams = service.m_aEthernetParams[0];
							} else {
								$scope.oEthernetParams = service.m_aEthernetParams[1];
							}
						} else {
							$scope.oEthernetParams = service.m_aEthernetParams[1];
						}
						if(to) {
							_oUtils.hideValidTip();
						}
					});

					$scope.$watch("oEthernetParams.bSupportMtu", function (to, from) {
						$scope.oParamsValid.oMtu.bSkipValid = !$scope.oEthernetParams.bSupportMtu;
					});

					service.initNetwork();
				});
			angular.bootstrap(angular.element("#basicTcpIp"), ["basicTcpIpApp"]);
		}
	};
	module.exports = new BasicTcpIp();
});