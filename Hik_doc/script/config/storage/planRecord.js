define(function (require, exports, module) {

	var $, _oTranslator, _oCommon, _oUtils, _oDevice, _oService, _oDialog, _oResponse;

	$ = require("jquery");
	require("ui.timeplan");
	require("config/ui.config");
	_oCommon = require("common");
	_oUtils = require("utils");
	_oDevice = require("isapi/device");
	_oService = require("config/service");
	_oDialog = require("dialog");
	_oResponse = require("isapi/response");

	_oTranslator = require("translator");

	function PlanRecord() {

	}

	PlanRecord.prototype = {
		// 页面初始化
		init: function () {
			this.initController();
		},
		// 初始化控制器
		initController: function () {
			angular.module("planRecordApp", ["ui.config"])
				.service("service", function ($compile) {
					var that = this;

					this.m_oLan = _oTranslator.oLastLanguage;
					this.m_aTimes = [];
					this.m_oScope = null;
					this.m_oANRXml = null;
					this.m_oCapbilities = {
						aRecordType: ["CMR", "MOTION", "ALARM", "EDR", "ALARMANDMOTION"],
						aStreamType: [true, true, false],
						aDuration: [0, 750],
						bSupportAnr: false,
						bSupportRedundant: false,
						bSupportRecordAudio: false,
						bSupportExpiredTime: false,
						bSupportOverWrite: false
					}
					this.m_oParams = {
						bEnablePlan: false,
						szPreRecord: "0",
						szRecordDelay: "5",
						bRedundant: false,
						szStreamType: "1",
						bRecordAudio: false,
						szExpiredTime: "0",
						bEnableAnr: false,
						bEnableOverWrite: false
					};
					this.m_oParamsValid = {
						oRecorderDuration: {
							oMinValue: {
								value: that.m_oCapbilities.aDuration[0],
								error: _oTranslator.getValue("range", that.m_oCapbilities.aDuration)
							},
							oMaxValue: {
								value: that.m_oCapbilities.aDuration[1],
								error: _oTranslator.getValue("range", that.m_oCapbilities.aDuration)
							},
							oEmpty: {value: false, error: that.m_oLan.nullTips}
						}
					};
					var oXmlDoc = null;
					var oDay = {
						"Monday": 0,
						"Tuesday": 1,
						"Wednesday": 2,
						"Thursday": 3,
						"Friday": 4,
						"Saturday": 5,
						"Sunday": 6
					};
					var oDayReverse = {
						"0": "Monday",
						"1": "Tuesday",
						"2": "Wednesday",
						"3": "Thursday",
						"4": "Friday",
						"5": "Saturday",
						"6": "Sunday",
						"7": "Monday"
					};

					this.initParams = function () {
						//初始化数组
						for (var i = 0; i < 8; i++) {
							that.m_aTimes[i] = [];
						}
					};

					this.getRecordPlanCap = function (iId) {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "recordCap", {channel: iId}, {
							async: false,
							success: function (status, xmlDoc) {
								that.m_oCapbilities.aRecordType.length = 0;
								var aRecordingModeOptions = $(xmlDoc).find("DefaultRecordingMode").eq(0).attr("opt").split(",");
								for (var i = 0; i < aRecordingModeOptions.length; i++) {
									that.m_oCapbilities.aRecordType.push(aRecordingModeOptions[i]);
								}
								if ($(xmlDoc).find("Duration").eq(0).attr("min") !== undefined) {
									that.m_oCapbilities.aDuration[0] = parseInt($(xmlDoc).find("Duration").eq(0).attr("min"), 10);
									that.m_oParamsValid.oRecorderDuration.oMinValue.value = that.m_oCapbilities.aDuration[0];
								}
								if ($(xmlDoc).find("Duration").eq(0).attr("max") !== undefined) {
									that.m_oCapbilities.aDuration[1] = parseInt($(xmlDoc).find("Duration").eq(0).attr("max"), 10);
									that.m_oParamsValid.oRecorderDuration.oMaxValue.value = that.m_oCapbilities.aDuration[1];
								}
								that.m_oParamsValid.oRecorderDuration.oMinValue.error = _oTranslator.getValue("range", that.m_oCapbilities.aDuration);
								that.m_oParamsValid.oRecorderDuration.oMaxValue.error = _oTranslator.getValue("range", that.m_oCapbilities.aDuration);
								var iLength = $(xmlDoc).find("SrcUrl").eq(0).attr("opt").split(",").length;
								if(iLength === 2) {
									that.m_oCapbilities.aStreamType[0] = true;
									that.m_oCapbilities.aStreamType[1] = true;
									that.m_oCapbilities.aStreamType[2] = false;
								} else if(iLength === 1) {
									that.m_oCapbilities.aStreamType[0] = true;
									that.m_oCapbilities.aStreamType[1] = false;
									that.m_oCapbilities.aStreamType[2] = false;
								} else if (3 === iLength) {
									that.m_oCapbilities.aStreamType[0] = true;
									that.m_oCapbilities.aStreamType[1] = true;
									that.m_oCapbilities.aStreamType[2] = true;
								}
								if($(xmlDoc).find("RedundancyRecord").length > 0) {
									that.m_oCapbilities.bSupportRedundant = true;
								} else {
									that.m_oCapbilities.bSupportRedundant = false;
								}
								that.m_oCapbilities.bSupportRecordAudio = !!$(xmlDoc).find("SaveAudio").length;
								that.m_oCapbilities.bSupportExpiredTime = !!$(xmlDoc).find("Duration").length;
								that.m_oCapbilities.bSupportOverWrite = !!$(xmlDoc).find("LoopEnable").length;
								that.m_oParamsValid.oRecorderDuration.bSkipValid = !that.m_oCapbilities.bSupportExpiredTime;
							}
						});
					};

					this.getRecordPlanInfo = function () {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "trackInfo", null, {
							async: false,
							success: function (status, xmlDoc) {
								that.initParams();//初始化时间数组
								oXmlDoc = xmlDoc;
								var oXmlTrackRecord = null;
								$(xmlDoc).find("Track").each(function () {
									var szTrackId = $(this).find('id').eq(0).text();
									if (szTrackId.indexOf("03") > 0) {
										$(this).remove();
									} else {
										if($(this).find("PreRecordTimeSeconds").length === 0) {
											$(this).remove();
										}
									}
									if (szTrackId == (that.m_oScope.iChannelId + '01')) {
										oXmlTrackRecord = $(this);
									}
								});
								var iLen = oXmlTrackRecord.find("ScheduleActionStartTime").length;
								var iHolidayTimeLen = oXmlTrackRecord.find("HolidaySchedule").eq(0).find("ScheduleActionStartTime").length;
								for (var i = 0; i < iLen; i++) {
									var oScheduleAction = oXmlTrackRecord.find("ScheduleAction").eq(i);
									var oStartTime = oXmlTrackRecord.find("ScheduleActionStartTime").eq(i);
									var oEndTime = oXmlTrackRecord.find("ScheduleActionEndTime").eq(i);
									var iStartDay = oDay[oStartTime.find("DayOfWeek").eq(0).text()];
									var iEndDay = oDay[oEndTime.find("DayOfWeek").eq(0).text()];
									var szEndTime = "24:00:00";
									if (iStartDay !== iEndDay) {  //后端可能出现start 周一0点 end 周二0点表示0~24时
										szEndTime = "24:00:00";
									} else {
										szEndTime = oEndTime.find("TimeOfDay").eq(0).text();
									}
									if (i >= iLen - iHolidayTimeLen) {
										iStartDay = 7;
									}
									that.m_aTimes[iStartDay].push({
										sTime: oStartTime.find("TimeOfDay").eq(0).text(),
										eTime: szEndTime,
										type: oScheduleAction.find("ActionRecordingMode").eq(0).text()
									});
								}
								that.m_oParams.bEnablePlan = _oUtils.nodeValue(oXmlTrackRecord.find("CustomExtensionList").eq(0), "enableSchedule", "b");
								that.m_oParams.bEnableOverWrite = _oUtils.nodeValue(oXmlTrackRecord, "LoopEnable", "b");
								that.m_oParams.bRecordAudio = _oUtils.nodeValue(oXmlTrackRecord.find("CustomExtensionList").eq(0), "SaveAudio", "b");
								that.m_oParams.bRedundant = _oUtils.nodeValue(oXmlTrackRecord.find("CustomExtensionList").eq(0), "RedundancyRecord", "b");
								that.m_oParams.szPreRecord = _oUtils.nodeValue(oXmlTrackRecord.find("CustomExtensionList").eq(0), "PreRecordTimeSeconds");
								that.m_oParams.szRecordDelay = _oUtils.nodeValue(oXmlTrackRecord.find("CustomExtensionList").eq(0), "PostRecordTimeSeconds");								
								that.m_oParams.szStreamType = _oUtils.nodeValue(oXmlTrackRecord, "SrcUrl").split("/").pop().split("").pop();								
								that.m_oParams.szExpiredTime = _oUtils.nodeValue(oXmlTrackRecord, "Duration").split("DT")[0].substring(1);
							}
						});
					};
					this.save = function () {
						var xmlDoc = oXmlDoc;
						var szHolidayXml = "<?xml version='1.0' encoding='UTF-8'?><HolidaySchedule><ScheduleBlock>" +
							"<ScheduleBlockGUID>{00000000-0000-0000-0000-000000000000}</ScheduleBlockGUID>" +
							"<ScheduleBlockType>www.std-cgi.com/racm/schedule/ver10</ScheduleBlockType>";
						for (var i = 0; i < that.m_aTimes[7].length; i++) {
							szHolidayXml += "<ScheduleAction><id>" + (i + 1) + "</id>";
							szHolidayXml += "<ScheduleActionStartTime><TimeOfDay>" + that.m_aTimes[7][i].sTime + "</TimeOfDay></ScheduleActionStartTime>";
							szHolidayXml += "<ScheduleActionEndTime><TimeOfDay>" + that.m_aTimes[7][i].eTime + "</TimeOfDay></ScheduleActionEndTime>";
							szHolidayXml += "<ScheduleDSTEnable>false</ScheduleDSTEnable><Description>nothing</Description>";
							szHolidayXml += "<Actions><Record>true</Record><Log>false</Log><SaveImg>false</SaveImg>";
							szHolidayXml += "<ActionRecordingMode>" + that.m_aTimes[7][i].type + "</ActionRecordingMode></Actions></ScheduleAction>";
						}
						szHolidayXml += "</ScheduleBlock></HolidaySchedule>";
						var szXmlTrackSchedule = "<TrackSchedule><ScheduleBlockList><ScheduleBlock>" +
							"<ScheduleBlockGUID>{00000000-0000-0000-0000-000000000000}</ScheduleBlockGUID>" +
							"<ScheduleBlockType>www.std-cgi.com/racm/schedule/ver10</ScheduleBlockType>";
						var iTimeId = 1;
						for (var i = 0; i < 7; i++) {
							for (var j = 0; j < that.m_aTimes[i].length; j++) {
								szXmlTrackSchedule += "<ScheduleAction><id>" + (iTimeId++).toString() + "</id>";
								szXmlTrackSchedule += "<ScheduleActionStartTime><DayOfWeek>" + oDayReverse[i] + "</DayOfWeek>";
								szXmlTrackSchedule += "<TimeOfDay>" + that.m_aTimes[i][j].sTime + "</TimeOfDay></ScheduleActionStartTime>";
								szXmlTrackSchedule += "<ScheduleActionEndTime><DayOfWeek>" + oDayReverse[i] + "</DayOfWeek>";
								szXmlTrackSchedule += "<TimeOfDay>" +  that.m_aTimes[i][j].eTime + "</TimeOfDay></ScheduleActionEndTime>";
								szXmlTrackSchedule += "<ScheduleDSTEnable>false</ScheduleDSTEnable><Description>nothing</Description>";
								szXmlTrackSchedule += "<Actions><Record>true</Record><Log>false</Log><SaveImg>false</SaveImg>";
								szXmlTrackSchedule += "<ActionRecordingMode>" + that.m_aTimes[i][j].type + "</ActionRecordingMode></Actions></ScheduleAction>";
							}
						}
						szXmlTrackSchedule += "</ScheduleBlock></ScheduleBlockList></TrackSchedule>";
						$(xmlDoc).find("Track").each(function () {
							var iCopyIndex = -1;
							for(var j = 0; j < that.m_oScope.oCopyTo.length; j++) {
								if($(this).find("id").eq(0).text() === that.m_oScope.oCopyTo[j].id + "01") {
									iCopyIndex = j;
									break;
								}
							}
							if (iCopyIndex !== -1 && that.m_oScope.oCopyTo[iCopyIndex].value) {
								$(this).find("SrcUrl").eq(0).text("rtsp://localhost/PSIA/Streaming/channels/10" + that.m_oParams.szStreamType);
								$(this).find("Duration").eq(0).text("P" + that.m_oParams.szExpiredTime + "DT0H");
								$(this).find("LoopEnable").eq(0).text(that.m_oParams.bEnableOverWrite.toString());								
								var oExtensionList = $(this).find("CustomExtensionList").eq(0);
								oExtensionList.find("enableSchedule").eq(0).text(that.m_oParams.bEnablePlan.toString());
								oExtensionList.find("SaveAudio").eq(0).text(that.m_oParams.bRecordAudio.toString());
								oExtensionList.find("RedundancyRecord").eq(0).text(that.m_oParams.bRedundant.toString());
								oExtensionList.find("PreRecordTimeSeconds").eq(0).text(that.m_oParams.szPreRecord);
								oExtensionList.find("PostRecordTimeSeconds").eq(0).text(that.m_oParams.szRecordDelay);
								if (_oDevice.m_oDeviceCapa.bEnableHoliday) {
									$(this).find("HolidaySchedule").eq(0).remove();
									$(_oUtils.parseXmlFromStr(szHolidayXml)).children().clone().insertAfter($(this).find("CustomExtensionList").eq(0).find("PreRecordTimeSeconds").eq(0));
								}
								if ($(this).find("TrackSchedule").length > 0) {
									$(this).find("TrackSchedule").eq(0).remove();
								}
								$(_oUtils.parseXmlFromStr(szXmlTrackSchedule)).children().clone().insertAfter($(this).find("SrcDescriptor").eq(0));
							} else {
								$(this).remove();
							}
						});
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "trackInfo", null, {
							processData: false,
							data: xmlDoc,
							success: function (status, xmlDoc, xhr) {
								if(that.m_oCapbilities.bSupportAnr) {
									that.setAnrInfo(that.m_oScope.iChannelId);
								} else {
									_oResponse.saveState(xhr);
								}
								that.getRecordPlanInfo();//解决复制通道不生效问题
							},
							error: function (status, xmlDoc, xhr) {
								_oResponse.saveState(xhr);
							}
						});
					};
					this.openAdvancedDlg = function () {
						$.get("config/storage/planRecordDialog.asp", function (szHtml) {
							var oCopy = {};
							$.extend(oCopy, that.m_oParams);
							_oDialog.html(that.m_oLan.advancedParam, szHtml, null, null, function () {
								if (!that.m_oScope.oInputValid.bInputValid) {
									return false;
								}
								that.m_oScope.oInputValidUtils.clearInputValidList();
								_oUtils.removeValidTip();
							}, function () {
								$.extend(that.m_oParams, oCopy);
								that.m_oScope.oInputValidUtils.clearInputValidList();
								_oUtils.removeValidTip();
							});
							$compile(angular.element("#dvRecordConfig"))(that.m_oScope);
							that.m_oScope.$apply();
							$("body").hide().show();
						});
					};
					//获取ANR信息
					this.getAnrInfo = function (iChannelId) {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "ChannelSingleInfo", {channel: iChannelId}, {
							async: false,
							success: function (status, xmlDoc) {
								that.m_oANRXml = xmlDoc;
								that.m_oParams.bEnableAnr = _oUtils.nodeValue(xmlDoc, "enableAnr", "b");
								if($(xmlDoc).find("enableAnr").length > 0) {
									that.m_oCapbilities.bSupportAnr = true;
								} else {
									that.m_oCapbilities.bSupportAnr = false;
								}
							}
						});
					}
					this.setAnrInfo = function (iChannelId) {
						$(that.m_oANRXml).find("enableAnr").eq(0).text(that.m_oParams.bEnableAnr.toString());
						WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "ChannelSingleInfo", {channel: iChannelId}, {
							processData: false,
							data: that.m_oANRXml,
							complete: function (status, xmlDoc, xhr) {
								_oResponse.saveState(xhr);
							}
						});
					}
				})
				.controller("planRecordController", function ($scope, service) {
					_oDevice.isEnableHoliday();

					$scope.oLan = service.m_oLan;
					service.m_oScope = $scope;
					$scope.openAdvancedDlg = service.openAdvancedDlg;
					$scope.save = service.save;

					//通道列表指令相关
					$scope.oAnalog = _oService.m_aOnlineAnalogChannelId;
					$scope.oDigital = _oService.m_aOnlineDigitalChannelId;
					$scope.iChannelId = _oService.m_iChannelId;
					$scope.iAnalogNum = _oService.m_iAnalogChannelNum;

					//计划时间指令相关
					$scope.bHoliday = _oDevice.m_oDeviceCapa.bEnableHoliday;
					$scope.aTimes = service.m_aTimes;

					//通道复制指令相关
					$scope.oAnalogId = _oService.m_aOnlineAnalogChannelId;
					$scope.oDigitalId = _oService.m_aOnlineDigitalChannelId;
					$scope.oDialog = _oDialog;
					$scope.oCopyTo = [];

					//高级参数
					$scope.oParams = service.m_oParams;
					$scope.oCapbilities = service.m_oCapbilities;

					//参数验证
					$scope.oUtils = _oUtils;
					$scope.oParamsValid = service.m_oParamsValid;
					$scope.oInputValid = {};
					$scope.aInputValidList = [];
					$scope.oInputValidUtils = {};

					$scope.$watch("iChannelId", function (to) {
						if (to > 0) {
							service.initParams();
							if(to > _oService.m_iAnalogChannelNum) {
								service.getAnrInfo(to);
							} else {
								service.m_oCapbilities.bSupportAnr = false;
							}
							service.getRecordPlanCap(to);
							service.getRecordPlanInfo();
						}
					});
				});
			angular.bootstrap(angular.element("#planRecord"), ["planRecordApp"]);
		}
	};

	module.exports = new PlanRecord();
});