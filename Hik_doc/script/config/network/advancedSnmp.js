define(function (require, exports, module) {

	var $, _oTranslator, _oCommon, _oUtils, _oResponse;

	$ = require("jquery");
	require("config/ui.config");
	_oTranslator = require("translator");
	_oCommon = require("common");
	_oUtils = require("utils");
	_oResponse = require("isapi/response");

	var szDefaultPsd = "\177\177\177\177\177\177";

	function AdvancedSnmp() {
	}

	AdvancedSnmp.prototype = {
		// 页面初始化
		init: function () {
			this.initController();
		},
		// 初始化控制器
		initController: function () {
			angular.module("advancedSnmpApp", ["ui.config"])
				.service("service", function () {
					var that = this;

					this.m_oLan = _oTranslator.oLastLanguage;
					this.m_oScope = null;
					this.m_oCapbilities = {
						bSupportSnmpV1: false,
						bSupportSnmpV3: false,
						bSupportTrapCommunity: false
					};
					this.m_oParams = {
						oSnmpXml: null,
						bEnableSnmpv1: false,
						bEnableSnmpv2: false,
						bEnableSnmpv3: false,
						szRCommunity: "",
						szWCommunity: "",
						szTrapIP: "",
						szTrapPort: "",
						szTrapCommunity: "",
						//Snmp v3
						szReadUserName: "",
						szReadSecurityLevel: "1_1",
						szReadAuthAlg: "MD5",
						szReadAuthPsd: szDefaultPsd,
						szReadPrivacyAlg: "DES",
						szReadPrivacyPsd: szDefaultPsd,
						szWriteUserName: "",
						szWriteSecurityLevel: "1_1",
						szWriteAuthAlg: "MD5",
						szWriteAuthPsd: szDefaultPsd,
						szWritePrivacyAlg: "DES",
						szWritePrivacyPsd: szDefaultPsd,
						//snmp Port
						szSnmpPort: ""
					};
					this.m_oParamsValid = {
						oRCommunity: {
							oMaxLength: {value: 32, error: _oTranslator.getValue("noMoreLength", [32])},
							oSpecChar: {value: false, error: _oTranslator.getValue("notChar") + " / \\ : * ? ' \" < > | % "},
						},
						oWCommunity: {
							oMaxLength: {value: 32, error: _oTranslator.getValue("noMoreLength", [32])},
							oSpecChar: {value: false, error: _oTranslator.getValue("notChar") + " / \\ : * ? ' \" < > | % "},
						},
						oTrapAddr: {
							oType: {value: "ip", error: that.m_oLan.wrong + that.m_oLan.ipAddr},
							oMaxLength: {value: 64, error: _oTranslator.getValue("noMoreLength", [64])},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oTrapPort: {
							oMinValue: {
								value: 1,
								error: _oTranslator.getValue("range", [1, 65535])
							},
							oMaxValue: {
								value: 65535,
								error: _oTranslator.getValue("range", [1, 65535])
							},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oSnmpPort: {
							oMinValue: {
								value: 1,
								error: _oTranslator.getValue("range", [1, 65535])
							},
							oMaxValue: {
								value: 65535,
								error: _oTranslator.getValue("range", [1, 65535])
							},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oTrapCommunity: {
							oMaxLength: {value: 32, error: _oTranslator.getValue("noMoreLength", [32])},
							aRegex: [{
								value: /^\w*$/,
								error: _oTranslator.getValue("onlyNormalChar")
							}],
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oUserName: {
							oMaxLength: {value: 16, error: _oTranslator.getValue("noMoreLength", [16])},
							aRegex: [{
								value: /^\w*$/,
								error: _oTranslator.getValue("onlyNormalChar")
							}],
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oReadAuthPassword: {
							oMaxLength: {value: 16, error: _oTranslator.getValue("noMoreLength", [16])},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oReadAlgPassword: {
							oMaxLength: {value: 16, error: _oTranslator.getValue("noMoreLength", [16])},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oWriteAthPassword: {
							oMaxLength: {value: 16, error: _oTranslator.getValue("noMoreLength", [16])},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						},
						oWriteAlgPassword: {
							oMaxLength: {value: 16, error: _oTranslator.getValue("noMoreLength", [16])},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						}
					};
					this.getSnmpInfo = function () {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "snmp", null, {
							async: false,
							success: function (status, xmlDoc) {
								that.m_oParams.oSnmpXml = xmlDoc;
								that.m_oParams.bEnableSnmpv1 = _oUtils.nodeValue($(xmlDoc).find("SNMPv1c").eq(0), "enabled", "b");
								var oXmlSnmpV2 = $(xmlDoc).find("SNMPv2c").eq(0);
								that.m_oCapbilities.bSupportSnmpV1 = $(xmlDoc).find("SNMPv1c").length > 0;
								that.m_oParams.bEnableSnmpv2 = _oUtils.nodeValue(oXmlSnmpV2, "enabled", "b");
								that.m_oParams.szRCommunity = _oUtils.nodeValue(oXmlSnmpV2, "readCommunity");
								that.m_oParams.szWCommunity = _oUtils.nodeValue(oXmlSnmpV2, "writeCommunity");
								if ("hostname" == _oUtils.nodeValue(oXmlSnmpV2, "addressingFormatType")) {
									that.m_oParams.szTrapIP = _oUtils.nodeValue(oXmlSnmpV2, "hostName");
								} else {
									if (oXmlSnmpV2.find("ipAddress").length > 0) {
										that.m_oParams.szTrapIP = _oUtils.nodeValue(oXmlSnmpV2, "ipAddress");
									} else {
										that.m_oParams.szTrapIP = _oUtils.nodeValue(oXmlSnmpV2, "ipv6Address");
									}
								}
								that.m_oParams.szTrapPort = _oUtils.nodeValue(oXmlSnmpV2, "portNo");
								if (oXmlSnmpV2.find("communityString").length > 0) {
									that.m_oCapbilities.bSupportTrapCommunity = true;
									that.m_oParams.szTrapCommunity = _oUtils.nodeValue(oXmlSnmpV2, "communityString");
								}
								that.m_oCapbilities.bSupportSnmpV3 = $(xmlDoc).find("SNMPAdvanced").length > 0;
								if(that.m_oCapbilities.bSupportSnmpV3) {
									var oXmlSNMPv3c = $(xmlDoc).find("SNMPAdvanced").eq(0);
									that.m_oParams.bEnableSnmpv3 = _oUtils.nodeValue(oXmlSNMPv3c, "enabled", "b");
									var oXmlRead = oXmlSNMPv3c.find("SNMPUser").eq(0);
									that.m_oParams.szReadUserName = _oUtils.nodeValue(oXmlRead, "userName");
									var szReadAuthAlg = _oUtils.nodeValue(oXmlRead, "snmpAuthenticationMethod");
									var szReadPrivacyAlg = _oUtils.nodeValue(oXmlRead, "snmpPrivacyMethod");
									if(szReadAuthAlg !== "none" && szReadPrivacyAlg !== "none") {
										that.m_oParams.szReadSecurityLevel = "1_1";
										that.m_oParams.szReadAuthAlg = szReadAuthAlg;
										that.m_oParams.szReadPrivacyAlg = szReadPrivacyAlg;
									} else if(szReadAuthAlg !== "none") {
										that.m_oParams.szReadSecurityLevel = "1_0";
										that.m_oParams.szReadAuthAlg = szReadAuthAlg;
										that.m_oParams.szReadPrivacyAlg = "DES";
									} else {
										that.m_oParams.szReadSecurityLevel = "0_0";
										that.m_oParams.szReadAuthAlg = "MD5";
										that.m_oParams.szReadPrivacyAlg = "DES";
									}
									var oXmlWrite = oXmlSNMPv3c.find("SNMPUser").eq(1);
									that.m_oParams.szWriteUserName = _oUtils.nodeValue(oXmlWrite, "userName");
									var szWriteAuthAlg = _oUtils.nodeValue(oXmlWrite, "snmpAuthenticationMethod");
									var szWritePrivacyAlg = _oUtils.nodeValue(oXmlWrite, "snmpPrivacyMethod");
									if(szWriteAuthAlg !== "none" && szWritePrivacyAlg !== "none") {
										that.m_oParams.szWriteSecurityLevel = "1_1";
										that.m_oParams.szWriteAuthAlg = szWriteAuthAlg;
										that.m_oParams.szWritePrivacyAlg = szWritePrivacyAlg;
									} else if(szWriteAuthAlg !== "none") {
										that.m_oParams.szWriteSecurityLevel = "1_0";
										that.m_oParams.szWriteAuthAlg = szWriteAuthAlg;
										that.m_oParams.szWritePrivacyAlg = "DES";
									} else {
										that.m_oParams.szWriteSecurityLevel = "0_0";
										that.m_oParams.szWriteAuthAlg = "MD5";
										that.m_oParams.szWritePrivacyAlg = "DES";
									}
								}
								that.m_oParams.szSnmpPort = _oUtils.nodeValue(xmlDoc, "listenPort");

								that.changeInputValid();
							}
						});
					};
					this.createV1AndV2XmlStr = function (iType) {
						var szXml = "<notificationEnabled>true</notificationEnabled>" +
							"<SNMPTrapReceiverList><SNMPTrapReceiver><id>1</id><ReceiverAddress>";
						var szAddressType = _oUtils.checkAddressingType(that.m_oParams.szTrapIP);
						if (szAddressType === "ipAddress") {
							szXml += "<addressingFormatType>ipaddress</addressingFormatType>" +
								"<ipAddress>" + that.m_oParams.szTrapIP + "</ipAddress>";
						} else if (szAddressType === "ipv6Address") {
							szXml += "<addressingFormatType>ipaddress</addressingFormatType>" +
								"<ipv6Address>" + that.m_oParams.szTrapIP + "</ipv6Address>";
						} else {
							szXml += "<addressingFormatType>hostname</addressingFormatType>" +
								"<hostName>" + that.m_oParams.szTrapIP.replace(/</g, "&lt;") + "</hostName>";
						}
						szXml += "<portNo>" + that.m_oParams.szTrapPort + "</portNo>" +
							"</ReceiverAddress><notificationType>trap</notificationType>";
						if (that.m_oCapbilities.bSupportTrapCommunity) {
							szXml += "<communityString>" + that.m_oParams.szTrapCommunity.replace(/</g, "&lt;") + "</communityString>";
						}
						szXml += "</SNMPTrapReceiver></SNMPTrapReceiverList>" +
							"<enabled>" + (iType === 0 ? that.m_oParams.bEnableSnmpv1.toString():that.m_oParams.bEnableSnmpv2.toString()) + "</enabled>";
						szXml += "<writeCommunity>" + that.m_oParams.szWCommunity.replace(/</g, "&lt;") + "</writeCommunity>" +
							"<readCommunity>" + that.m_oParams.szRCommunity.replace(/</g, "&lt;") + "</readCommunity>";
						return szXml;
					};
					this.save = function () {						
						that.m_oScope.oInputValidUtils.manualInputValid();
						if (!that.m_oScope.oInputValid.bInputValid) {
							return;
						}
						var oParams = that.m_oParams;
						var szXml = "<?xml version='1.0' encoding='UTF-8'?><SNMP>";
						if(that.m_oCapbilities.bSupportSnmpV1) {
							szXml += "<SNMPv1c>" + that.createV1AndV2XmlStr(0) +"</SNMPv1c>";
						}
						szXml += "<SNMPv2c>" + that.createV1AndV2XmlStr(1) +"</SNMPv2c>";
						if(that.m_oCapbilities.bSupportSnmpV3) {
							szXml += "<SNMPAdvanced><localEngineID></localEngineID><SNMPUserList>" +
								"<SNMPUser><id>1</id><userName>" + that.m_oParams.szReadUserName.replace(/</g, "&lt;")  + "</userName><remoteEngineID></remoteEngineID>";
							if(that.m_oParams.szReadSecurityLevel === "1_1") {
								szXml += "<snmpAuthenticationMethod>" + that.m_oParams.szReadAuthAlg + "</snmpAuthenticationMethod>";
								if(that.m_oParams.szReadAuthPsd !== szDefaultPsd) {
									szXml += "<snmpAuthenticationPassword>" + that.m_oParams.szReadAuthPsd + "</snmpAuthenticationPassword>"
								}
								szXml += "<snmpPrivacyMethod>" + that.m_oParams.szReadPrivacyAlg + "</snmpPrivacyMethod>";
								if(that.m_oParams.szReadPrivacyPsd !== szDefaultPsd) {
									szXml += "<snmpPrivacyPassword>" + that.m_oParams.szReadPrivacyPsd + "</snmpPrivacyPassword>"
								}
							} else if (that.m_oParams.szReadSecurityLevel === "1_0") {
								szXml += "<snmpAuthenticationMethod>" + that.m_oParams.szReadAuthAlg + "</snmpAuthenticationMethod>";
								if(that.m_oParams.szReadAuthPsd !== szDefaultPsd) {
									szXml += "<snmpAuthenticationPassword>" + that.m_oParams.szReadAuthPsd + "</snmpAuthenticationPassword>"
								}
								szXml += "<snmpPrivacyMethod>none</snmpPrivacyMethod>";
							} else {
								szXml += "<snmpAuthenticationMethod>none</snmpAuthenticationMethod>";
								szXml += "<snmpPrivacyMethod>none</snmpPrivacyMethod>";
							}
							szXml += "</SNMPUser>";
							szXml += "<SNMPUser><id>2</id><userName>" + that.m_oParams.szWriteUserName.replace(/</g, "&lt;")  + "</userName><remoteEngineID></remoteEngineID>";
							if(that.m_oParams.szWriteSecurityLevel === "1_1") {
								szXml += "<snmpAuthenticationMethod>" + that.m_oParams.szWriteAuthAlg + "</snmpAuthenticationMethod>";
								if(that.m_oParams.szWriteAuthPsd !== szDefaultPsd) {
									szXml += "<snmpAuthenticationPassword>" + that.m_oParams.szWriteAuthPsd + "</snmpAuthenticationPassword>"
								}
								szXml += "<snmpPrivacyMethod>" + that.m_oParams.szWritePrivacyAlg + "</snmpPrivacyMethod>";
								if(that.m_oParams.szWritePrivacyPsd !== szDefaultPsd) {
									szXml += "<snmpPrivacyPassword>" + that.m_oParams.szWritePrivacyPsd + "</snmpPrivacyPassword>"
								}
							} else if(that.m_oParams.szWriteSecurityLevel === "1_0") {
								szXml += "<snmpAuthenticationMethod>" + that.m_oParams.szWriteAuthAlg + "</snmpAuthenticationMethod>";
								if(that.m_oParams.szWriteAuthPsd !== szDefaultPsd) {
									szXml += "<snmpAuthenticationPassword>" + that.m_oParams.szWriteAuthPsd + "</snmpAuthenticationPassword>"
								}
								szXml += "<snmpPrivacyMethod>none</snmpPrivacyMethod>";
							} else {
								szXml += "<snmpAuthenticationMethod>none</snmpAuthenticationMethod>";
								szXml += "<snmpPrivacyMethod>none</snmpPrivacyMethod>";
							}
							szXml += "</SNMPUser></SNMPUserList>";
							szXml += "<enabled>" + that.m_oParams.bEnableSnmpv3.toString() + "</enabled></SNMPAdvanced>";
						}
						szXml += "<listenPort>" + that.m_oParams.szSnmpPort + "</listenPort>";
						szXml += "</SNMP>";
						var xmlDoc = _oUtils.parseXmlFromStr(szXml);

						if (!oParams.bEnableSnmpv1 && !oParams.bEnableSnmpv2) {
							var oNewSNMPv1c = xmlDoc.createElement("SNMPv1c");
							var oOldSNMPv1c = $(oParams.oSnmpXml).find("SNMPv1c").get(0);
							$(oNewSNMPv1c).append($(oOldSNMPv1c.cloneNode(true)).children());
							xmlDoc.documentElement.replaceChild(oNewSNMPv1c, $(xmlDoc).find("SNMPv1c").get(0));

							var oNewSNMPv2c = xmlDoc.createElement("SNMPv2c");
							var oOldSNMPv2c = $(oParams.oSnmpXml).find("SNMPv2c").get(0);
							$(oNewSNMPv2c).append($(oOldSNMPv2c.cloneNode(true)).children());
							xmlDoc.documentElement.replaceChild(oNewSNMPv2c, $(xmlDoc).find("SNMPv2c").get(0));

							$(xmlDoc).find("SNMPv1c enabled, SNMPv2c enabled").text("false");
						}

						if (!oParams.bEnableSnmpv3) {
							var oNewSNMPv3c = xmlDoc.createElement("SNMPAdvanced");
							var oOldSNMPv3c = $(oParams.oSnmpXml).find("SNMPAdvanced").get(0);
							$(oNewSNMPv3c).append($(oOldSNMPv3c.cloneNode(true)).children());
							xmlDoc.documentElement.replaceChild(oNewSNMPv3c, $(xmlDoc).find("SNMPAdvanced").get(0));
							$(xmlDoc).find("SNMPAdvanced enabled").text("false");
						}

						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "snmp", null, {
							processData: false,
							data: xmlDoc,
							complete: function (status, xmlDoc, xhr) {
								_oResponse.saveState(xhr);
							}
						});
					};

					this.changeInputValid = function () {						
						var oParams = that.m_oParams;
						var oParamsValid = that.m_oParamsValid;
						var bSkipCheckSnmpv12 = !(oParams.bEnableSnmpv1 || oParams.bEnableSnmpv2);				
						oParamsValid.oRCommunity.bSkipValid = bSkipCheckSnmpv12;
						oParamsValid.oWCommunity.bSkipValid = bSkipCheckSnmpv12;
						oParamsValid.oTrapAddr.bSkipValid = bSkipCheckSnmpv12;
						oParamsValid.oTrapCommunity.bSkipValid = bSkipCheckSnmpv12;
						oParamsValid.oTrapPort.bSkipValid = bSkipCheckSnmpv12;

						var bSkipCheckSnmpv3 = !oParams.bEnableSnmpv3;
						oParamsValid.oUserName.bSkipValid = bSkipCheckSnmpv3;
						oParamsValid.oReadAuthPassword.bSkipValid = true;
						oParamsValid.oReadAlgPassword.bSkipValid = true;
						oParamsValid.oWriteAthPassword.bSkipValid = true;
						oParamsValid.oWriteAlgPassword.bSkipValid = true;
						if (!bSkipCheckSnmpv3) {
							if ("1_0" === oParams.szReadSecurityLevel) {
								oParamsValid.oReadAuthPassword.bSkipValid = false;
							} if ("1_1" === oParams.szReadSecurityLevel) {
								oParamsValid.oReadAuthPassword.bSkipValid = false;
								oParamsValid.oReadAlgPassword.bSkipValid = false;
							}

							if ("1_0" === oParams.szWriteSecurityLevel) {
								oParamsValid.oWriteAthPassword.bSkipValid = false;
							} if ("1_1" === oParams.szWriteSecurityLevel) {
								oParamsValid.oWriteAthPassword.bSkipValid = false;
								oParamsValid.oWriteAlgPassword.bSkipValid = false;
							}
						}
					};
				})
				.controller("advancedSnmpController", function ($scope, service) {
					service.m_oScope = $scope;

					$scope.oLan = service.m_oLan;
					$scope.oCapbilities = service.m_oCapbilities;
					$scope.oParams = service.m_oParams;
					$scope.save = service.save;

					//参数验证
					$scope.oUtils = _oUtils;
					$scope.oParamsValid = service.m_oParamsValid;
					$scope.oInputValid = {};
					$scope.aInputValidList = [];
					$scope.oInputValidUtils = {};

					//元素禁用
					$scope.oDisabled = {
						bRCommunity: false,
						bWCommunity: false,
						bTrapIP: false,
						bTrapPort: false,
						bTrapCommunity: false,
						bReadUserName: false,
						bReadSecurityLevel: false,
						bReadAuthAlg: false,
						bReadAuthPsd: false,
						bReadPrivacyAlg: false,
						bReadPrivacyPsd: false,
						bWriteSecurityLevel: false,
						bWriteAuthAlg: false,
						bWriteAuthPsd: false,
						bWritePrivacyAlg: false,
						bWritePrivacyAlgPsd: false,
					};

					$scope.disabled = function () {
						var oDisabled = $scope.oDisabled;
						var oParams = $scope.oParams;						
						var bEnableSnmpv12 = !(oParams.bEnableSnmpv1 || oParams.bEnableSnmpv2);
						var bEnableSnmpv3 = !oParams.bEnableSnmpv3;

						oDisabled.bRCommunity = bEnableSnmpv12;
						oDisabled.bWCommunity = bEnableSnmpv12;
						oDisabled.bTrapIP = bEnableSnmpv12;
						oDisabled.bTrapPort = bEnableSnmpv12;
						oDisabled.bTrapCommunity = bEnableSnmpv12;

						oDisabled.bReadUserName = bEnableSnmpv3;
						oDisabled.bReadSecurityLevel = bEnableSnmpv3;
						oDisabled.bReadAuthAlg = bEnableSnmpv3 || (oParams.szReadSecurityLevel === '0_0');						
						oDisabled.bReadAuthPsd = bEnableSnmpv3 || (oParams.szReadSecurityLevel === '0_0');
						oDisabled.bReadPrivacyAlg = bEnableSnmpv3 || (oParams.szReadSecurityLevel !== '1_1');
						oDisabled.bReadPrivacyPsd = bEnableSnmpv3 || (oParams.szReadSecurityLevel !== '1_1');
						oDisabled.bWriteUserName = bEnableSnmpv3;
						oDisabled.bWriteSecurityLevel = bEnableSnmpv3;
						oDisabled.bWriteAuthAlg = bEnableSnmpv3 || (oParams.szWriteSecurityLevel === '0_0');
						oDisabled.bWriteAuthPsd = bEnableSnmpv3 || (oParams.szWriteSecurityLevel === '0_0');
						oDisabled.bWritePrivacyAlg= bEnableSnmpv3 || (oParams.szWriteSecurityLevel !== '1_1');						
						oDisabled.bWritePrivacyAlgPsd = bEnableSnmpv3 || (oParams.szWriteSecurityLevel !== '1_1');

					};

					// 密码框键按下，自动清空
					$scope.keydown = function (index) {
						if (index === 0 && $scope.oParams.szReadAuthPsd === szDefaultPsd) {
							$scope.oParams.szReadAuthPsd = "";
						}
						if (index === 1 && $scope.oParams.szReadPrivacyPsd === szDefaultPsd) {
							$scope.oParams.szReadPrivacyPsd = "";
						}
						if (index === 2 && $scope.oParams.szWriteAuthPsd === szDefaultPsd) {
							$scope.oParams.szWriteAuthPsd = "";
						}
						if (index === 3 && $scope.oParams.szWritePrivacyPsd === szDefaultPsd) {
							$scope.oParams.szWritePrivacyPsd = "";
						}
					};

					$scope.$watch("oParams.bEnableSnmpv1", function (to) {
						service.changeInputValid();
						$scope.disabled();
					});

					$scope.$watch("oParams.bEnableSnmpv2", function (to) {
						service.changeInputValid();
						$scope.disabled();
					});

					$scope.$watch("oParams.bEnableSnmpv3", function (to) {
						service.changeInputValid();
						$scope.disabled();
					});

					$scope.$watch("oParams.szReadSecurityLevel", function (to) {
						service.changeInputValid();
						$scope.disabled();
					});

					$scope.$watch("oParams.szWriteSecurityLevel", function (to) {
						service.changeInputValid();
						$scope.disabled();
					});

					service.getSnmpInfo();
				});
			angular.bootstrap(angular.element("#advancedSnmp"), ["advancedSnmpApp"]);
		}
	};
	module.exports = new AdvancedSnmp();
});