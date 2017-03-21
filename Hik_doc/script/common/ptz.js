define(function(require, exports, module){
	var $, _oCommon, _oTranslator, _oService, _oDevice, _oUtils, _oResponse, _$scope, _oPlugin, _oTool, _oDialog;

	$ = require("jquery");
	require("ui.core");
	require("ui.widget");
	require("ui.tabs");
	require("ui.slider");
	require("ui.jquery");
	_oCommon = require("common");
	_oTranslator = require("translator");
	_oService = require("service");
	_oDevice = require("isapi/device");
	_oUtils = require("utils");
	_oResponse = require("isapi/response");
	_oPlugin = require("common/plugin");
	_oTool = require("common/tool");
	_oDialog = require("dialog");
	_$scope = null;

	module.exports = {
		m_oService: null,
		init: function (szID, szType) {
			var self = this;
			angular.module("ptzApp", ["ui.jquery"])
				.service("ptzservice", function () {
					var that = this;
					this.m_oLan = _oTranslator.oLastLanguage;
					this.m_oScope = null;
					this.m_oParams = {
						iSpeed: 4,
						iPresetIndex: 0,
						iPatrolIndex: 0,
						iPatrolPresetIndex: -1,
						iPatternIndex: 0,
						bAuto: false,
						bLight: false,// 是否开启灯光
						bWiper: false,// 是否开启雨刷
						bManualTrack: false,// 是否开启手动跟踪
						b3DZoom: false,// 是否开启3D放大
						bPatrolEdit: false,
						aPatrolPreset: [],
						bPTZCtrl: false, //视频云台控制
						szPresetNameEdit: "",
                        bManualTrackEvidence: false //是否开启手动跟踪取证
					};
					this.m_oPtzCap = {
                        bUseMS: false,  //兼容by tangzz，前端预置点巡航时间s为单位，后端ms为单位
						iPresetNum: 256,
						bSupportSetPresetName: true,
						iPatrolNum: 0,
						iPatternNum: 0,
						bSupportPatrols: _oDevice.m_oDeviceCapa.bSupportPatrols,// 这个可以留着，兼容旧的设备
						//bSupportPattern: false,
						bSupportWiperStatus: true,
						aPresetList: [],
						aSpecialPresets: [],
						aPatrolList: [],
						aPatternList: [],
						aSupportPtzOperation: [
							true,// 灯光
							true,// 雨刷
							true,// 辅助聚焦
							true,// 镜头初始化
                            !seajs.iDeviceType,// 菜单输出,先根据设备类型判断
							_oDevice.m_oDeviceCapa.bPTZ || _oDevice.m_oDeviceCapa.bSupportIntelliTrace || _oDevice.m_oDeviceCapa.oVCAResourceType == 'TFS' || _oDevice.m_oDeviceCapa.oSupportTraffic.bSupportManualEvidence,// 手动跟踪
							false,// 3D放大
							false,
							true,
                            _oDevice.m_oDeviceCapa.oSupportTraffic.bSupportManualTrack
						],
						oPatrolDelay: {
							iMin: 0,
							iMax: 30,
							iDef: 3
						},
						oPatrolSpeed: {
							iMin: 1,
							iMax: 40,
							iDef: 30
						}
					};

					this.isCondition = function () {
						var bCondition = _oService.m_aWndList[_oService.m_iWndIndex].bPlay;
						return bCondition;
					};

					this.getPtzCap = function () {
						if(_oService.m_aChannelList[0] === undefined) {
							return;
						}
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "ptzCap", {channel: 1}, {
							async: false,
							success: function (status, xmlDoc) {
								if ($(xmlDoc).find("maxPresetNum").length > 0) {
									that.m_oPtzCap.iPresetNum = _oUtils.nodeValue($(xmlDoc), "maxPresetNum", "i");
								}
								if ($(xmlDoc).find("maxPatrolNum").length > 0) {// 如果为0，不支持，标签隐藏
									that.m_oPtzCap.iPatrolNum = _oUtils.nodeValue($(xmlDoc), "maxPatrolNum", "i");
								}
								if ($(xmlDoc).find("maxPatternNum").length > 0) {// 如果为0，不支持，标签隐藏
									that.m_oPtzCap.iPatternNum = _oUtils.nodeValue($(xmlDoc), "maxPatternNum", "i");
								}
								that.m_oPtzCap.bSupportSetPresetName = _oUtils.nodeValue($(xmlDoc), "presetNameSupport", "b");
								if ($(xmlDoc).find("specialNo").eq(0).attr("opt")) {
									that.m_oPtzCap.aSpecialPresets = $(xmlDoc).find("specialNo").eq(0).attr("opt").split(",");
								}
							}
						});

						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "patrolCap", {channel: 1}, {
							async: false,
							success: function (status, xmlDoc) {							
								var oPatrolDelay = that.m_oPtzCap.oPatrolDelay;
								oPatrolDelay.iMin = _oUtils.nodeAttr(xmlDoc, "delay", "min", "i");
								oPatrolDelay.iMax = _oUtils.nodeAttr(xmlDoc, "delay", "max", "i");
								oPatrolDelay.iDef = _oUtils.nodeAttr(xmlDoc, "delay", "default", "i");								
							}
						});

						// 这个请求，前端也是通的，但是列表是空的，不能作为是否支持花样扫描的依据
						/*WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "patternInfo", {channel: 1}, {
							async: false,
							success: function (status, xmlDoc) {
								that.m_oPtzCap.bSupportPattern = true;
							}
						});*/
					};

					this.stopAuto = function () {
						if(_oService.m_aWndList[_oService.m_iWndIndex].bAutoPan) {
							WebSDK.WSDK_PTZControl(_oCommon.m_szHostName, _oService.m_aWndList[_oService.m_iWndIndex].iChannelId, 15, 0, false, {
								async:false,
								success: function (status, xmlDoc, xhr) {
									_oService.m_aWndList[_oService.m_iWndIndex].bAutoPan = false;
									that.m_oParams.bAuto = false;
								},
								error: function (status, xmlDoc, xhr) {
									//_oResponse.saveState(xhr);
								}
							});
						}
					};
					this.ptzControl = function (iCommand, iPtzSpeed) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						if(_oService.m_aWndList[_oService.m_iWndIndex].bPlay) {
							if(iCommand === 15) {
								if(_oService.m_aWndList[_oService.m_iWndIndex].bAutoPan) {
									iPtzSpeed = 0;
								}
							} else {
								that.stopAuto();
							}
							WebSDK.WSDK_PTZControl(_oCommon.m_szHostName, _oService.m_aWndList[_oService.m_iWndIndex].iChannelId, iCommand, iPtzSpeed, false, {
								async:false,
								success: function (status, xmlDoc, xhr) {
									if(iCommand === 15) {
										_oService.m_aWndList[_oService.m_iWndIndex].bAutoPan = !_oService.m_aWndList[_oService.m_iWndIndex].bAutoPan;
										that.m_oParams.bAuto = _oService.m_aWndList[_oService.m_iWndIndex].bAutoPan;
									}
								},
								error: function (status, xmlDoc, xhr) {
									//_oResponse.saveState(xhr);
                                    that.setPtzCallback(status, xmlDoc, xhr);
                                    //这里需要提示的：  1.当前有高优先级云台控制权限用户操作，请稍后！
                                                      //2.透明通道已打开，当前操作无法完成
                                                      //3.该通道不支持此项功能  4.无权限
								}
							});
						}
					};

					this.setPtzCallback = function (status, xmlDoc, xhr) {
                        var xmlDoc = xhr.responseXML;
                        var state = _oUtils.nodeValue(xmlDoc, "statusCode");
                        var subState = _oUtils.nodeValue(xmlDoc, "subStatusCode");
                        var szRetInfo = '';
                        if ("4" == state) {// Invalid Operation
                            if (subState === "notSupport") {
                                szRetInfo = _oTranslator.getValue("notSupport");
                            } else if (subState === "lowPrivilege") {
                                szRetInfo = _oTranslator.getValue("noPermission");
                            } else if (subState === "ptzOccupiedPriority") {
                                szRetInfo = _oTranslator.getValue("ptzOccupiedPriority");
                            } else if (subState === "TransparentMutexPTZ485") {
                                szRetInfo = _oTranslator.getValue("transparentMutexPTZ485");
                            }
                        }
                        if (szRetInfo != '') {
                            _oDialog.tip(szRetInfo);
                        }
                    };
                    
					this.gotoPreset = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						that.stopAuto();
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "goPreset", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, preset: iId}, {
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.setPreset = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						var szXml = "<?xml version='1.0' encoding='UTF-8'?><PTZPreset version='2.0' xmlns='http://www.isapi.org/ver20/XMLSchema'>" +
							"<id>" + iId + "</id><presetName>" + _oUtils.encodeString(that.m_oPtzCap.aPresetList[parseInt(iId, 10)-1].name) + "</presetName>" +
							"</PTZPreset>";
						var xmlDoc = _oUtils.parseXmlFromStr(szXml);
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "setPreset", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, preset: iId}, {
							data: xmlDoc,
							success: function (status, xmlDoc, xhr) {
								that.m_oPtzCap.aPresetList[parseInt(iId, 10)-1].bSet = true;
								that.m_oScope.$digest();
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.deletePreset = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "deletePreset", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, preset: iId}, {
							data: null,
							success: function (status, xmlDoc, xhr) {
								that.m_oPtzCap.aPresetList[parseInt(iId, 10)-1].bSet = false;
								that.m_oPtzCap.aPresetList[parseInt(iId, 10)-1].name = that.m_oLan.preset + ' ' + iId.toString();
								that.m_oScope.$digest();
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.startPatrol = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "patrolStart", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, patrol: iId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.stopPatrol = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "patrolStop", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, patrol: iId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.deletePatrol = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "deletePatrol", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, patrol: iId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
								// _oResponse.saveState(xhr, "", 1);
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.getPatrolInfo = function (iChannelId, iPatrolId) {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "patrolInfo", {channel: iChannelId, patrol: iPatrolId}, {
							success: function (status, xmlDoc) {
								that.m_oParams.aPatrolPreset.length = 0;
								$(xmlDoc).find("PatrolSequence").each(function () {
									if(_oUtils.nodeValue($(this), "presetID") !== "0") {
                                        if (parseInt(_oUtils.nodeValue($(this), "delay"), 10) >= 1000) {  //兼容by tangzz
                                            that.m_oPtzCap.bUseMS = true;
                                        }
										that.m_oParams.aPatrolPreset.push({
											szPresetId: _oUtils.nodeValue($(this), "presetID"),
											szTime: that.m_oPtzCap.bUseMS ? parseInt(_oUtils.nodeValue($(this), "delay"), 10)/1000 : parseInt(_oUtils.nodeValue($(this), "delay"), 10),
											szSpeed: _oUtils.nodeValue($(this), "seqSpeed")
										});
									}
								});
								that.m_oParams.bPatrolEdit = !that.m_oParams.bPatrolEdit;
								that.m_oScope.$apply();
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					//获取预置点列表
					this.getPresetList = function (szId) {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "presetInfo", {channel: szId}, {
							async: false,
							success: function (status, xmlDoc) {
								$(xmlDoc).find("PTZPreset").each(function () {
									var iIndex = parseInt(_oUtils.nodeValue($(this), "id"), 10) - 1;
									that.m_oPtzCap.aPresetList[iIndex].name = _oUtils.nodeValue($(this), "presetName");
									that.m_oPtzCap.aPresetList[iIndex].bSet = true;
								});
								for(var i = 0; i < that.m_oPtzCap.aSpecialPresets.length; i++) {
									var iIndex = parseInt(that.m_oPtzCap.aSpecialPresets[i], 10) - 1;
									that.m_oPtzCap.aPresetList[iIndex].bSpecial = true;
								}
							}
						});
					};

					this.editPatrol = function (iPatrolId) {
						var iChannelId = _oService.m_aWndList[_oService.m_iWndIndex].iChannelId;
						if(iChannelId < 0 || iChannelId === undefined) {
							return;
						}
						that.getPatrolInfo(iChannelId, iPatrolId);
					};

					this.confirmPatrol = function () {
						var iPatrolId = that.m_oParams.iPatrolIndex+1;
						if(iPatrolId < 1) {
							return;
						}
						var szXml = "<?xml version='1.0' encoding='UTF-8'?><PTZPatrol><id>" + iPatrolId + "</id>" +
							"<patrolName>patrol " + iPatrolId + "</patrolName><PatrolSequenceList>";
						for(var i = 0; i < that.m_oParams.aPatrolPreset.length; i++) {
							szXml += "<PatrolSequence><presetID>" + that.m_oParams.aPatrolPreset[i].szPresetId + "</presetID>" +
								"<seqSpeed>" + that.m_oParams.aPatrolPreset[i].szSpeed + "</seqSpeed>";
                                if (that.m_oPtzCap.bUseMS) { //兼容by tangzz
                                    szXml +="<delay>" + parseInt(that.m_oParams.aPatrolPreset[i].szTime, 10)*1000 + "</delay></PatrolSequence>";
                                } else {
                                    szXml +="<delay>" + parseInt(that.m_oParams.aPatrolPreset[i].szTime, 10) + "</delay></PatrolSequence>";
                                }
						}
						szXml += "</PatrolSequenceList></PTZPatrol>";
						var xmlDoc = _oUtils.parseXmlFromStr(szXml);
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "patrolInfo", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, patrol: iPatrolId}, {
							data: xmlDoc,
							success: function (status, xmlDoc, xhr) {
								that.m_oParams.bPatrolEdit = false;
								that.m_oScope.$apply();
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.cancelPatrol = function () {
						that.m_oParams.bPatrolEdit = false;
					};
					this.selectPatrolPreset = function (iIndex) {
						that.m_oParams.iPatrolPresetIndex = iIndex;
					};
					this.addPatrolPreset = function () {
						var oPatrolDelay = that.m_oPtzCap.oPatrolDelay;
						var oPatrolSpeed = that.m_oPtzCap.oPatrolSpeed;
						var iPatrolPresetLength = that.m_oParams.aPatrolPreset.length;
						if(iPatrolPresetLength < 32) {
							that.m_oParams.aPatrolPreset.splice(iPatrolPresetLength, 0, {
								szPresetId: "1",
								szTime: oPatrolDelay.iDef,
								szSpeed: oPatrolSpeed.iDef
							});
						}
					};
					this.deletePatrolPreset = function () {
						var iPatrolPresetLength = that.m_oParams.aPatrolPreset.length;
						if(iPatrolPresetLength > 0) {
							that.m_oParams.aPatrolPreset.splice(that.m_oParams.iPatrolPresetIndex, 1);
						}
					};
					this.upPatrolPreset = function () {
						var iPatrolPresetLength = that.m_oParams.aPatrolPreset.length;
						if(iPatrolPresetLength > 1 && that.m_oParams.iPatrolPresetIndex > 0) {
							var oTemp = that.m_oParams.aPatrolPreset[that.m_oParams.iPatrolPresetIndex];
							that.m_oParams.aPatrolPreset[that.m_oParams.iPatrolPresetIndex] = that.m_oParams.aPatrolPreset[that.m_oParams.iPatrolPresetIndex-1];
							that.m_oParams.aPatrolPreset[that.m_oParams.iPatrolPresetIndex-1] = oTemp;
							that.m_oParams.iPatrolPresetIndex -= 1;
						}
					};
					this.downPatrolPreset = function () {
						var iPatrolPresetLength = that.m_oParams.aPatrolPreset.length;
						if(iPatrolPresetLength > 1 && that.m_oParams.iPatrolPresetIndex < (iPatrolPresetLength - 1) && that.m_oParams.iPatrolPresetIndex !== -1) {
							var oTemp = that.m_oParams.aPatrolPreset[that.m_oParams.iPatrolPresetIndex];
							that.m_oParams.aPatrolPreset[that.m_oParams.iPatrolPresetIndex] = that.m_oParams.aPatrolPreset[that.m_oParams.iPatrolPresetIndex+1];
							that.m_oParams.aPatrolPreset[that.m_oParams.iPatrolPresetIndex+1] = oTemp;
							that.m_oParams.iPatrolPresetIndex += 1;
						}
					};
					this.startPattern = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "patternStart", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, pattern: iId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.stopPattern = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "patternStop", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, pattern: iId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.startRecord = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "patternRecordStart", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, pattern: iId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.stopRecord = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "patternRecordStop", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, pattern: iId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.deletePattern = function (iId) {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "deletePattern", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId, pattern: iId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					this.setMenu = function () {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}

						if (!that.m_oPtzCap.aSupportPtzOperation[4]) {
							return;
						}

						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "setMenu", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};

					this.setKeyFocus = function () {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "oneKeyFocus", {channel:_oService.m_aWndList[_oService.m_iWndIndex].iChannelId}, {
							async: false,
							data: null,
							success: function (status, xmlDoc, xhr) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					// 镜头初始化
					this.setInitCamera = function () {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						if (!that.m_oPtzCap.aSupportPtzOperation[3]) {// 没有能力
							return;
						}

						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "initCamera", {channel: _oService.m_aWndList[_oService.m_iWndIndex].iChannelId}, {
							// async: false,
							data: null,
							success: function (status, xmlDoc) {
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					// 设置灯光
					this.setLight = function () {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						if (!that.m_oPtzCap.aSupportPtzOperation[0]) {// 没有能力
							return;
						}

						var szXml, oXmlDoc;
						if (!_oService.m_aWndList[_oService.m_iWndIndex].bLight) {
							szXml = "<?xml version='1.0' encoding='UTF-8'?><PTZAux><id>1</id><type>LIGHT</type><status>on</status></PTZAux>";
						} else {
							szXml = "<?xml version='1.0' encoding='UTF-8'?><PTZAux><id>1</id><type>LIGHT</type><status>off</status></PTZAux>";
						}
						oXmlDoc = _oUtils.parseXmlFromStr(szXml);

						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "setAuxControl", {channel: _oService.m_aWndList[_oService.m_iWndIndex].iChannelId}, {
							async: false,
							data: oXmlDoc,
							success: function (status, xmlDoc) {
								_oService.m_aWndList[_oService.m_iWndIndex].bLight = !_oService.m_aWndList[_oService.m_iWndIndex].bLight;
								that.m_oParams.bLight = _oService.m_aWndList[_oService.m_iWndIndex].bLight;
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					// 设置雨刷
					this.setWiper = function () {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						if (!that.m_oPtzCap.aSupportPtzOperation[1]) {// 没有能力
							return;
						}

						var szXml, oXmlDoc;
						if (!_oService.m_aWndList[_oService.m_iWndIndex].bWiper) {
							szXml = "<?xml version='1.0' encoding='UTF-8'?><PTZAux><id>1</id><type>WIPER</type><status>on</status></PTZAux>";
						} else {
							szXml = "<?xml version='1.0' encoding='UTF-8'?><PTZAux><id>1</id><type>WIPER</type><status>off</status></PTZAux>";
						}
						oXmlDoc = _oUtils.parseXmlFromStr(szXml);

						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "setAuxControl", {channel: _oService.m_aWndList[_oService.m_iWndIndex].iChannelId}, {
							async: false,
							data: oXmlDoc,
							success: function (status, xmlDoc) {
								_oService.m_aWndList[_oService.m_iWndIndex].bWiper = !_oService.m_aWndList[_oService.m_iWndIndex].bWiper;
								that.m_oParams.bWiper = _oService.m_aWndList[_oService.m_iWndIndex].bWiper;
							},
							error: function (status, xmlDoc, xhr) {
								//_oResponse.saveState(xhr);
							}
						});
					};
					// 手动跟踪
					this.setManualTrack = function () {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						if (!that.m_oPtzCap.aSupportPtzOperation[5]) {// 没有能力
							return;
						}

						var iWndIndex = _oService.m_iWndIndex,
							oWnd = _oService.m_aWndList[iWndIndex];

						if (oWnd.bManualTrack) {
							if (0 === _oPlugin.disableEzoom(iWndIndex)) {
								oWnd.bManualTrack = false;
								that.m_oParams.bManualTrack = false;
							}
						} else {
							_oService.disableEzoom(_oPlugin, that.m_oParams);// 功能互斥处理
							if (0 === _oPlugin.enableEzoom(iWndIndex, 1)) {
								oWnd.bManualTrack = true;
								that.m_oParams.bManualTrack = true;
							}
						}

						// 模块不同，需要手动更新
						_oTool.update();
					};
					// 3D放大
					this.set3DZoom = function () {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						if (!that.m_oPtzCap.aSupportPtzOperation[6]) {// 没有能力
							return;
						}

						var iWndIndex = _oService.m_iWndIndex,
							oWnd = _oService.m_aWndList[iWndIndex];

						if (oWnd.b3DZoom) {
							if (0 === _oPlugin.disableEzoom(iWndIndex)) {
								oWnd.b3DZoom = false;
								that.m_oParams.b3DZoom = false;
							}
						} else {
							_oService.disableEzoom(_oPlugin, that.m_oParams);// 功能互斥处理
							if (0 === _oPlugin.enableEzoom(iWndIndex, 1)) {
								oWnd.b3DZoom = true;
								that.m_oParams.b3DZoom = true;
							}
						}

						// 模块不同，需要手动更新
						_oTool.update();
					};
					// 视频云台控制
					this.setWndPTZCtrl = function () {
						var bCondition = that.isCondition();
						if (!bCondition) {
							return;
						}
						if (!that.m_oPtzCap.aSupportPtzOperation[8]) {// 没有能力
							return;
						}

						var iWndIndex = _oService.m_iWndIndex,
							oWnd = _oService.m_aWndList[iWndIndex];

						if (oWnd.bPTZCtrl) {
							if (_oPlugin.setPTZCtrlEnable(iWndIndex, false)) {
								oWnd.bPTZCtrl = false;
								that.m_oParams.bPTZCtrl = false;
							}
						} else {
							if (_oPlugin.setPTZCtrlEnable(iWndIndex, true)) {
								oWnd.bPTZCtrl = true;
								that.m_oParams.bPTZCtrl = true;
							}
						}
					};
					
					this.initParams = function () {
						//匿名不需要云台相关
						if(!_oCommon.m_bAnonymous) {
							that.getPtzCap();
						}
						var szPreset = _oTranslator.getValue("preset") + ' ';
						for(var i = 0; i < that.m_oPtzCap.iPresetNum; i++) {
							that.m_oPtzCap.aPresetList.push({
								szId: (i+1).toString(),
								name: szPreset + (i+1).toString(),
								bSet: false,
								bEditting: false,
								bSpecial: false
							});
						}
						var szPatrol = _oTranslator.getValue("patrolPath");
						for(var i = 0; i < that.m_oPtzCap.iPatrolNum; i++) {
							that.m_oPtzCap.aPatrolList.push({szId: (i+1).toString(), name: szPatrol + (i+1).toString()});
						}
						var szPattern = _oTranslator.getValue("pattern");
						for(var i = 0; i < that.m_oPtzCap.iPatternNum; i++) {
							that.m_oPtzCap.aPatternList.push({szId: (i+1).toString(), name: szPattern + (i+1).toString()});
						}
						if(_oService.m_aChannelList[0] && !_oCommon.m_bAnonymous) {
							that.getPresetList(_oService.m_aChannelList[0].iId);
						}
					};

                    //获取手动跟踪取证状态
                    this.getManualTrackStat = function(szId) {
                        WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "trafficManualTrackMode", {channel: szId}, {
                            async: false,
                            success: function (status, xmlDoc) {
                                var bStat = $(xmlDoc).find("EvidenceMode").text() === "true";
                                var iWndIndex = _oService.m_iWndIndex;
                                var oWnd = _oService.m_aWndList[iWndIndex];
                                if(bStat) {
                                    _oPlugin.enableEzoom(iWndIndex, 1);
                                    oWnd.bManualTrackEvidence = bStat;
                                    that.m_oParams.bManualTrackEvidence = bStat;
                                }

                            }
                        });
                    };

                    //设置手动跟踪取证状态
                    this.setManualTrackStat = function(szId, bStat) {
                        var oXmlDoc = _oUtils.parseXmlFromStr(
                            '<ManualTraceEvidenceMode>'
                            +     '<EvidenceMode>' + bStat.toString() + '</EvidenceMode>'
                            +'</ManualTraceEvidenceMode>');
                        WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "trafficManualTrackMode", {channel: szId}, {
                            data: oXmlDoc,
                            error: function (status, xmlDoc, xhr) {
                                _oResponse.saveState(xhr);
                            }
                        });
                    };
                    // 手动跟踪取证
                    this.setManualTrackEvidence = function () {
                        var bCondition = that.isCondition();
                        if (!bCondition) {
                            return;
                        }
                        if (!that.m_oPtzCap.aSupportPtzOperation[9]) {// 没有能力
                            return;
                        }

                        var iWndIndex = _oService.m_iWndIndex,
                            oWnd = _oService.m_aWndList[iWndIndex];

                        if (oWnd.bManualTrackEvidence) {
                            if (0 === _oPlugin.disableEzoom(iWndIndex)) {
                                oWnd.bManualTrackEvidence = false;
                                that.m_oParams.bManualTrackEvidence = false;
                            }
                        } else {
                            _oService.disableEzoom(_oPlugin, that.m_oParams);// 功能互斥处理
                            if (0 === _oPlugin.enableEzoom(iWndIndex, 1)) {
                                oWnd.bManualTrackEvidence = true;
                                that.m_oParams.bManualTrackEvidence = true;
                            }
                        }

                        // 模块不同，需要手动更新
                        _oTool.update();
                    };
				})
				.controller("ptzController", ["$scope", "ptzservice", function ($scope, service) {
					self.m_oService = service;
					_$scope = $scope;
					$scope.oLan = service.m_oLan;
					service.m_oScope = $scope;
					$scope.oParams = service.m_oParams;
					$scope.oPtzCap = service.m_oPtzCap;
					$scope.ptzControl = service.ptzControl;
					$scope.gotoPreset = service.gotoPreset;
					$scope.setPreset = service.setPreset;
					$scope.startPatrol = service.startPatrol;
					$scope.stopPatrol = service.stopPatrol;
					$scope.editPatrol = service.editPatrol;
					$scope.deletePatrol = service.deletePatrol;
					$scope.startPattern = service.startPattern;
					$scope.stopPattern = service.stopPattern;
					$scope.startRecord = service.startRecord;
					$scope.stopRecord = service.stopRecord;
					$scope.deletePattern = service.deletePattern;
					$scope.cancelPatrol = service.cancelPatrol;
					$scope.confirmPatrol = service.confirmPatrol;
					$scope.selectPatrolPreset = service.selectPatrolPreset;
					$scope.addPatrolPreset = service.addPatrolPreset;
					$scope.deletePatrolPreset = service.deletePatrolPreset;
					$scope.upPatrolPreset = service.upPatrolPreset;
					$scope.downPatrolPreset = service.downPatrolPreset;
					$scope.setMenu = service.setMenu;
					$scope.setKeyFocus = service.setKeyFocus;
					$scope.setInitCamera = service.setInitCamera;
					$scope.setLight = service.setLight;
					$scope.setWiper = service.setWiper;
					$scope.setManualTrack = service.setManualTrack;
					$scope.set3DZoom = service.set3DZoom;
					$scope.setWndPTZCtrl = service.setWndPTZCtrl;
                    $scope.setManualTrackEvidence = service.setManualTrackEvidence;

                    //取证
                    $scope.bSupportEvidence = _oDevice.m_oDeviceCapa.oVCAResourceType == "TFS" || _oDevice.m_oDeviceCapa.oSupportTraffic.bSupportManualEvidence;
					$scope.deletePreset = function (iId) {
						service.deletePreset(iId);
					};
					$scope.verifySpeedAndTime = function (iType, iIndex) {
						if(iType === 0) {
							var oPatrolSpeed = $scope.oPtzCap.oPatrolSpeed;
							if (isNaN(Number($scope.oParams.aPatrolPreset[iIndex].szSpeed))) {
								$scope.oParams.aPatrolPreset[iIndex].szSpeed = oPatrolSpeed.iMin;
							}
						} else {
							var oPatrolDelay = $scope.oPtzCap.oPatrolDelay;
							if (isNaN(Number($scope.oParams.aPatrolPreset[iIndex].szTime))) {
								$scope.oParams.aPatrolPreset[iIndex].szTime = oPatrolDelay.iMin;
							}
						}
					};
					$scope.blurSpeedAndTime = function (iType, iIndex) {
						if(iType === 0) {
							var oPatrolSpeed = $scope.oPtzCap.oPatrolSpeed;
							if ("" !== $scope.oParams.aPatrolPreset[iIndex].szSpeed) {
								if (parseInt($scope.oParams.aPatrolPreset[iIndex].szSpeed, 10) < oPatrolSpeed.iMin) {
									$scope.oParams.aPatrolPreset[iIndex].szSpeed = oPatrolSpeed.iMin;
								}

								if (parseInt($scope.oParams.aPatrolPreset[iIndex].szSpeed, 10) > oPatrolSpeed.iMax) {
									$scope.oParams.aPatrolPreset[iIndex].szSpeed = oPatrolSpeed.iMax;
								}
							} else {
								$scope.oParams.aPatrolPreset[iIndex].szSpeed = oPatrolSpeed.iMin;
							}
						} else {
							var oPatrolDelay = $scope.oPtzCap.oPatrolDelay;
							if ("" !== $scope.oParams.aPatrolPreset[iIndex].szTime) {
								if (parseInt($scope.oParams.aPatrolPreset[iIndex].szTime, 10) < oPatrolDelay.iMin) {
									$scope.oParams.aPatrolPreset[iIndex].szTime = oPatrolDelay.iMin;
								}
								
								if (parseInt($scope.oParams.aPatrolPreset[iIndex].szTime, 10) > oPatrolDelay.iMax) {
									$scope.oParams.aPatrolPreset[iIndex].szTime = oPatrolDelay.iMax;
								}
							} else {
								$scope.oParams.aPatrolPreset[iIndex].szTime = oPatrolDelay.iMin;
							}
						}
					};

					$scope.selectPreset = function (index) {
						if($scope.oParams.iPresetIndex !== index) {
							$scope.oPtzCap.aPresetList[$scope.oParams.iPresetIndex].bEditting = false;
						}
						$scope.oParams.iPresetIndex = index;
					};
					$scope.selectPatrol = function (index) {
						$scope.oParams.iPatrolIndex = index;
					};
					$scope.selectPattern = function (index) {
						$scope.oParams.iPatternIndex = index;
					};
					$scope.editPreset = function (index) {
						if($scope.oPtzCap.aPresetList[index].bSpecial) {
							$scope.oPtzCap.aPresetList[index].bEditting = false;
						} else {
							//为空是恢复原有的预置点名称
							if(!$scope.oPtzCap.aPresetList[index].bEditting) {
								$scope.oParams.szPresetNameEdit = $scope.oPtzCap.aPresetList[index].name;
							} else {
								if($scope.oPtzCap.aPresetList[index].name === "") {
									$scope.oPtzCap.aPresetList[index].name = $scope.oParams.szPresetNameEdit;
								}
							}
							$scope.oPtzCap.aPresetList[index].bEditting = !$scope.oPtzCap.aPresetList[index].bEditting;
						}
					};
					$scope.ptzLoaded = function () {
						service.initParams();
						$("#" + szID + " #tabs").tabs({
							remember: false
						});
						if (szType != "ptzLock") {
							$scope.iPatrolPresetHeight = document.documentElement.clientHeight - 465;
							$("#tabs-1, #tabs-2, #tabs-3").height(document.documentElement.clientHeight - 365);
						} else {
							$("#" + szID + " .ptz-name").hide();
							$("#" + szID + " .ptz-ctrl-bottom").hide();
							$("#" + szID + " li").hide();
						}

						// 定时循环显示预置点列表
						$scope.iDisplayNum = 20;
						var iTimer = 0;
						if (iTimer > 0) {
							clearInterval(iTimer);
						}
						iTimer = setInterval(function () {
							var iPresetNum = $scope.oPtzCap.iPresetNum,
								iDisplayNum = $scope.iDisplayNum + 20;

							if (iDisplayNum > iPresetNum) {
								$scope.iDisplayNum += (iPresetNum - $scope.iDisplayNum);
								clearInterval(iTimer);
								iTimer = 0;
							} else {
								$scope.iDisplayNum += 20;
							}
							$scope.$apply();
						}, 1000);
					};

                    if($scope.oPtzCap && $scope.oPtzCap.aSupportPtzOperation[9]) {
                        service.getManualTrackStat(1);
                        $scope.$watch("oParams.bManualTrackEvidence", function(to, from){
                            if(to != from) {
                                service.setManualTrackStat(1, to);
                            }
                        })
                    }
				}]);
			angular.bootstrap(angular.element("#" + szID), ["ptzApp"]);

			self.update();
		},
		resize: function () {
			if (_$scope) {
				_$scope.iPatrolPresetHeight = document.documentElement.clientHeight - 465;
				$("#tabs-1, #tabs-2, #tabs-3").height(document.documentElement.clientHeight - 365);
				_$scope.$digest();
			}
		},
		// 更新通道能力
		updateChannelCap: function (oCap) {
			if (_$scope === null) {
				return;
			}
			_$scope.oPtzCap.aSupportPtzOperation[6] = oCap.bSupportPosition3D;// 3D放大能力
			_$scope.oPtzCap.bSupportWiperStatus = oCap.bSupportWiperStatus;// 雨刷状态能力
		},
		update: function () {
			if (_$scope === null) {
				return;
			}
			_$scope.oParams.bAuto =  _oService.m_aWndList[_oService.m_iWndIndex].bAutoPan;
			_$scope.oParams.bLight =  _oService.m_aWndList[_oService.m_iWndIndex].bLight;
			_$scope.oParams.bWiper =  _oService.m_aWndList[_oService.m_iWndIndex].bWiper;
			_$scope.oParams.bManualTrack =  _oService.m_aWndList[_oService.m_iWndIndex].bManualTrack;
			_$scope.oParams.b3DZoom =  _oService.m_aWndList[_oService.m_iWndIndex].b3DZoom;
			_$scope.oParams.bPTZCtrl = _oService.m_aWndList[_oService.m_iWndIndex].bPTZCtrl;
			_$scope.iChannelId = _oService.m_aWndList[_oService.m_iWndIndex].iChannelId;
            _$scope.oParams.bManualTrackEvidence =  _oService.m_aWndList[_oService.m_iWndIndex].bManualTrackEvidence;
			_$scope.$digest();
		}
	};
});