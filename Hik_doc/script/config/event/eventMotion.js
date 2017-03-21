define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oPlugin, _oDevice, _oResponse, _oService;
	var _oScope, _oParent, _oSliderCap, _oMotionDetectInfo, _oMotionDetectTimes;

	$ = require("jquery");

	require("ui.slider");
	require("ui.timeplan");
	require("ui.jquery");
	require("config/ui.config");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");

	_oService = require("config/service");
	_oPlugin = require("common/plugin");
	_oDevice = require("isapi/device");
	_oResponse = require("isapi/response");


	function Motion() {
		_oSliderCap = {
			iMin: 0,
			iMax: 100,
			iStep: 1
		};					// 滑动条范围能力
		_oMotionDetectInfo = {
			oXmlDoc: null,					// 移动侦测XmlDoc
			bChannelSupport: true,		// 通道支持该功能
			bEnableMotion: false,		// 是否启用移动侦测
			bShowHighlight: false,		// 是否显示动态分析
			bEnableHighlight: false,		// 是否启用动态分析
			iSensitive: 0,					// 灵敏度大小
			szRegionXml: "",				// 视频区域XML字符串
			szRegionType: "",				// 视频区域类型
			szMotionMode: "",               //移动侦测模式
			szSwitchDayNight: "",          //日夜切换参数
			szStartTime: "07:00:00",      //日夜转换开始时间
			szEndTime: "18:00:00",        //日夜转换结束时间
			szAreaNo: "1",              //移动侦测区域编号
			iExpertSen: 0,              //专家模式灵敏度
			iExpertPercentAge: 0,      //专家模式占比
			iDaySen: 0,                 //专家模式白天灵敏度
			iDayPercentAge: 0,         //专家模式白天占比
			iNightSen: 0,              //专家模式夜晚灵敏度
			iNightPercentAge: 0       //专家模式夜晚占比
		};
		_oMotionDetectTimes = [];			// 时间计划
	}

	Motion.prototype = {
		// 页面初始化
		init: function (oParent) {
			var self = this;

			_oParent = oParent;// Event对象

			self.initPlugin();
			self.initController();
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			_oDevice.isEnableHoliday();
			_oService.getAlarmOutput();
			self.getMotionCap();

			angular.module("eventMotionApp", ["ui.jquery", "ui.config"])
				.controller("eventMotionController", function ($scope, $timeout) {
					_oScope = $scope;

					// 语言包
					$scope.oLan = _oTranslator.oLastLanguage;

					// 向导（区域、计划、联动）
					$scope.aStep = [$scope.oLan.areaSet, $scope.oLan.armSchedule, $scope.oLan.linkMethod];

					// 通道下拉框
					$scope.oAnalog = _oService.m_aOnlineAnalogChannelId;
					$scope.oDigital = _oService.m_aOnlineDigitalChannelId;
					$scope.iAnalogNum = _oService.m_iAnalogChannelNum;

					// 当前选中通道号
					$scope.iChannelId = _oService.m_iChannelId;

					// 滑动条能力
					$scope.oSliderCap = _oSliderCap;

					// 是否支持假日
					$scope.bHoliday = _oDevice.m_oDeviceCapa.bEnableHoliday;

					//是否支持移动侦测专家模式
					$scope.bSupportExpert = false;

					// 移动侦测信息
					$scope.oMotionDetectInfo = _oMotionDetectInfo;

					// 常规联动
					var szDectionCapName = 'MotionDetectionTriggerCap';
					if(_oDevice.getDeviceLinkageCap('', szDectionCapName)) {
						$scope.oNormalLink = {
							bFtp: _oDevice.getDeviceLinkageCap(szDectionCapName + ' isSupportFTP'),
							bTrace: _oDevice.getDeviceLinkageCap(szDectionCapName + ' isSupportTrack'),
							bMonitor: _oDevice.getDeviceLinkageCap(szDectionCapName + ' isSupportMonitorAlarm'),
							oInfo: {
								email: false,
								beep:  false,
								center: false,
								monitor: false,
								ftp: false,
								trace: false
							},
							oShow: {
								email: _oDevice.getDeviceLinkageCap(szDectionCapName + ' isSupportEmail'),
								beep:  _oDevice.getDeviceLinkageCap(szDectionCapName + ' isSupportBeep'),
								center: _oDevice.getDeviceLinkageCap(szDectionCapName + ' isSupportCenter')
							}
						};
						if(_oDevice.getDeviceLinkageCap(szDectionCapName + ' isSupportRecord')) {
							// 录像联动
							$scope.oRecordLink = {
								aAnalogChannelId: _oService.m_aAnalogChannelId,
								aDigitalChannelId: _oService.m_aDigitalChannelId,
								iAnalogChannelNum: _oService.m_iAnalogChannelNum,
								oInfo: {}
							};
						}
						if(_oDevice.getDeviceLinkageCap(szDectionCapName + ' isSupportIO')) {
							$scope.oAlarmLink = {
								aAnalogAlarmId: _oService.m_aAnalogAlarmOutputId,
								aDigitalAlarmId: _oService.m_aDigitalAlarmOutputId,
								iAnalogChannelNum: _oService.m_iAnalogChannelNum,
								oInfo: {}
							};
						}
					} else {
						// 常规联动
						$scope.oNormalLink = {
							bFtp: _oDevice.m_oDeviceCapa.bSupportFtp,
							bTrace: false,
							bMonitor: true,
							oInfo: {
								email: false,
								beep: false,
								center: false,
								monitor: false,
								ftp: false
							}
						};

						// 报警输出联动
						$scope.oAlarmLink = {
							aAnalogAlarmId: _oService.m_aAnalogAlarmOutputId,
							aDigitalAlarmId: _oService.m_aDigitalAlarmOutputId,
							iAnalogChannelNum: _oService.m_iAnalogChannelNum,
							oInfo: {}
						};

						// 录像联动
						$scope.oRecordLink = {
							aAnalogChannelId: _oService.m_aAnalogChannelId,
							aDigitalChannelId: _oService.m_aDigitalChannelId,
							iAnalogChannelNum: _oService.m_iAnalogChannelNum,
							oInfo: {}
						};
					}

					// 计划时间段
					$scope.oTimes = _oMotionDetectTimes;

					// 绘图按钮
					_oService.m_oDrawBtn.bDraw = false;
					$scope.oDrawBtn = _oService.m_oDrawBtn;

					// 绘画区域
					$scope.draw = function () {
						_oService.drawArea();
					};
					// 清除
					$scope.clear = function () {
						_oService.clearDraw();
					};
					// 保存信息
					$scope.save = function () {
						self.save();
					};
					//切换模式
					$scope.changeMode = function () {
						self.getMotionDetectInfo(false);
					};
					//切换区域
					$scope.changeArea = function () {
						self.getOneMoveDetectInfo(parseInt(_oMotionDetectInfo.szAreaNo, 10), _oMotionDetectInfo.oXmlDoc);
					};

					// 切换通道号触发
					$scope.$watch("iChannelId", function (to) {
						if (to > 0) {
							_oService.m_iChannelId = to;
							_oMotionDetectInfo.szMotionMode = ""; //切换通道将移动侦测模式切换为空
							$timeout(function () {
								_oService.startPlay();
								self.getMotionCap();
								self.getMotionDetectInfo();
								self.getMotionDetectLink();
								self.getMotionDetectSchedule();
							}, 10);
						} else {
							_oMotionDetectInfo.bChannelSupport = false;
						}
					});
				});
			angular.bootstrap(angular.element("#eventMotion"), ["eventMotionApp"]);
		},
		// 初始化插件
		initPlugin: function () {
			_oPlugin.initPluginEvent();
			_oPlugin.initPlugin("1", "", 1, "motiondetect");
		},
		// 获取能力
		getMotionCap: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "motionCapa", {channel: _oService.m_iChannelId}, {
				async: false,
				success: function (status, xmlDoc) {
					if ($(xmlDoc).find("sensitivityLevel").length > 0) {
						_oSliderCap.iMin = _oUtils.checkNumber(parseInt($(xmlDoc).find("sensitivityLevel").eq(0).attr("min"), 10), 0);
						_oSliderCap.iMax = _oUtils.checkNumber(parseInt($(xmlDoc).find("sensitivityLevel").eq(0).attr("max"), 10), 6);
						_oSliderCap.iStep = _oUtils.checkNumber(parseInt($(xmlDoc).find("sensitivityLevel").eq(0).attr("step"), 10), 1);
					}
				}
			});
		},
		// 获取移动侦测信息
		getMotionDetectInfo: function (bUpdateMode) {
			if (typeof bUpdateMode === "undefined") {
				bUpdateMode = true;
			}
			var self = this;

			// 重置对象数组
			_oMotionDetectInfo.oXmlDoc = null;
			_oMotionDetectInfo.bEnableMotion = false;
			_oMotionDetectInfo.bShowHighlight = false;
			_oMotionDetectInfo.bEnableHighlight = false;
			_oMotionDetectInfo.iSensitive = 0;
			_oMotionDetectInfo.szRegionXml = "";
			_oMotionDetectInfo.szRegionType = "";
			_oMotionDetectInfo.szSwitchDayNight = "";
			_oMotionDetectInfo.szStartTime =  "07:00:00";
			_oMotionDetectInfo.szEndTime =  "18:00:00";
			_oMotionDetectInfo.szAreaNo = "1";
			_oMotionDetectInfo.iExpertSen = 0;
			_oMotionDetectInfo.iExpertPercentAge = 0;
			_oMotionDetectInfo.iDaySen = 0;
			_oMotionDetectInfo.iDayPercentAge = 0;
			_oMotionDetectInfo.iNightSen = 0;
			_oMotionDetectInfo.iNightPercentAge = 0;

			if (_oMotionDetectInfo.szMotionMode === "normal") {
				self.getNormalMotion();
			} else {
				WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "motionExtInfo", {channel: _oService.m_iChannelId}, {
					async: false,
					success: function (status, xmlDoc) {
						_oScope.bSupportExpert = true;
						if (bUpdateMode) {
							_oMotionDetectInfo.szMotionMode = $(xmlDoc).find("activeMode").eq(0).text();
						}

						if (_oMotionDetectInfo.szMotionMode === "normal") {
							self.getNormalMotion();
						} else {
							_oMotionDetectInfo.oXmlDoc = xmlDoc;
							_oMotionDetectInfo.bEnableMotion = _oUtils.nodeValue(xmlDoc, "enabled", "b");
							if ($(xmlDoc).find("enableHighlight").length > 0) {
								_oMotionDetectInfo.bShowHighlight = true;
								_oMotionDetectInfo.bEnableHighlight = _oUtils.nodeValue(xmlDoc, "enableHighlight", "b");
							}

							var _oMotionSwitch = $(xmlDoc).find("MotionDetectionSwitch").eq(0);
							_oMotionDetectInfo.szSwitchDayNight = _oMotionSwitch.find("type").eq(0).text();
							_oMotionDetectInfo.szStartTime =  _oMotionSwitch.find("beginTime").eq(0).text();
							_oMotionDetectInfo.szEndTime =  _oMotionSwitch.find("endTime").eq(0).text();

							self.getOneMoveDetectInfo(parseInt(_oMotionDetectInfo.szAreaNo, 10), xmlDoc);
						}
					},
					error: function () {
						_oScope.bSupportExpert = false;
						_oMotionDetectInfo.szMotionMode = "normal";
						self.getNormalMotion();
					}
				});
			}
			setTimeout(function () {// guide指令界面有根据能力隐藏/显示项，需要调用guide指令scope的resize方法修正高度
				var oTmp = $("#guide_view").prev().scope();
				if (oTmp) {
					oTmp.resize();
				}			
			}, 10);
		},
		getNormalMotion: function () {
			var self = this;
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "motionInfo", {channel: _oService.m_iChannelId}, {
				async: false,
				success: function (status, xmlDoc) {
					_oMotionDetectInfo.oXmlDoc = xmlDoc;

					_oMotionDetectInfo.bEnableMotion = _oUtils.nodeValue(xmlDoc, "enabled", "b");
					if ($(xmlDoc).find("enableHighlight").length > 0) {
						_oMotionDetectInfo.bShowHighlight = true;
						_oMotionDetectInfo.bEnableHighlight = _oUtils.nodeValue(xmlDoc, "enableHighlight", "b");
					}

					_oMotionDetectInfo.iSensitive = _oUtils.nodeValue(xmlDoc, "sensitivityLevel", "i");
					_oMotionDetectInfo.szRegionXml = self.transRegionToPlugin(xmlDoc);
					_oMotionDetectInfo.szRegionType = _oUtils.nodeValue(xmlDoc, "regionType");

					if (_oMotionDetectInfo.szRegionType != "none") {
						_oPlugin.setRegionInfo(_oMotionDetectInfo.szRegionXml);
					}
				},
				error: function (status, xmlDoc, xhr) {
					_oPlugin.clearRegion();
					_oResponse.getState(xhr);
				}
			});
		},
		/*************************************************
		 Function:      getOneMoveDetectInfo
		 Description:   获取一个移动侦测信息
		 Input:         iNo 区域编号
		 				xmlDoc 区域信息
		 Output:        无
		 return:        无
		 *************************************************/
		getOneMoveDetectInfo: function (iNo, xmlDoc) {
			var oMoveDetectList = $(xmlDoc).find("MotionDetectionRegion");
			//先显示出来，否则滑动条无法设置
			/*$("#dvSwitchDay").show();
			$("#dvSwitchNight").show();
			$("#dvSwitchClose").show();*/
			var oSelMoveDetect = null;
			oMoveDetectList.each(function () {
				if (iNo === parseInt($(this).find("id").eq(0).text(), 10)) {
					oSelMoveDetect = $(this);
					return false;
				}
			});
			if (null !== oSelMoveDetect) {
				_oMotionDetectInfo.iExpertSen = parseInt(oSelMoveDetect.find("sensitivityLevel").eq(0).text(), 10);
				_oMotionDetectInfo.iExpertPercentAge = parseInt(oSelMoveDetect.find("objectSize").eq(0).text(), 10);
				_oMotionDetectInfo.iDaySen = parseInt(oSelMoveDetect.find("daySensitivityLevel").eq(0).text(), 10);
				_oMotionDetectInfo.iDayPercentAge = parseInt(oSelMoveDetect.find("dayObjectSize").eq(0).text(), 10);
				_oMotionDetectInfo.iNightSen = parseInt(oSelMoveDetect.find("nightSensitivityLevel").eq(0).text(), 10);
				_oMotionDetectInfo.iNightPercentAge = parseInt(oSelMoveDetect.find("nightObjectSize").eq(0).text(), 10);
			} else {
				_oMotionDetectInfo.iExpertSen = 0;
				_oMotionDetectInfo.iExpertPercentAge = 0;
				_oMotionDetectInfo.iDaySen = 0;
				_oMotionDetectInfo.iDayPercentAge = 0;
				_oMotionDetectInfo.iNightSen = 0;
				_oMotionDetectInfo.iNightPercentAge = 0;
			}

			var szXml = "<?xml version='1.0' encoding='utf-8' ?><DetectionRegionInfo><videoFormat>PAL</videoFormat><RegionType>roi</RegionType><ROI><HorizontalResolution>1000</HorizontalResolution><VerticalResolution>1000</VerticalResolution></ROI><DisplayMode>transparent</DisplayMode><MaxRegionNum>1</MaxRegionNum><DetectionRegionList>";

			if (null !== oSelMoveDetect) {
				var oRegionCoordinatesList = oSelMoveDetect.find("RegionCoordinates");
				if (oRegionCoordinatesList.length > 0) {
					szXml += "<DetectionRegion><RegionCoordinatesList>";
					for (var i = 0; i < oRegionCoordinatesList.length; i++) {
						szXml += "<RegionCoordinates><positionX>" + oRegionCoordinatesList.eq(i).find("positionX").eq(0).text() + "</positionX><positionY>" + (oRegionCoordinatesList.eq(i).find("positionY").eq(0).text()) + "</positionY></RegionCoordinates>";
					}
					szXml += "</RegionCoordinatesList></DetectionRegion>";
				}
			}
			szXml += "</DetectionRegionList></DetectionRegionInfo>";
			_oMotionDetectInfo.szRegionXml = szXml;

			_oPlugin.setRegionInfo(_oMotionDetectInfo.szRegionXml);
		},
		// 转换区域适应插件格式
		transRegionToPlugin: function (xmlDoc) {
			var szXml = "<?xml version='1.0'?><MoveDetection><videoFormat>PAL</videoFormat>";

			szXml += "<RegionType>grid</RegionType><Grid><rowGranularity>" + _oUtils.nodeValue(xmlDoc, "rowGranularity") + "</rowGranularity>";
			szXml += "<columnGranularity>" + _oUtils.nodeValue(xmlDoc, "columnGranularity") + "</columnGranularity></Grid>";
			szXml += "<DisplayMode>transparent</DisplayMode><gridMap>" + _oUtils.nodeValue(xmlDoc, "gridMap") + "</gridMap></MoveDetection>";

			return szXml;
		},
		// 获取联动方式
		getMotionDetectLink: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "motionLink", {channel: _oService.m_iChannelId}, {
				async: false,
				success: function (status, xmlDoc) {
					// 重置对象数组
					for (var k in _oScope.oNormalLink.oInfo) {
						_oScope.oNormalLink.oInfo[k] = false;
					}
					// 常规联动
					var oNotificationMethodList = $(xmlDoc).find("notificationMethod");
					$.each(oNotificationMethodList, function () {
						if ("email" === $(this).text()) {
							_oScope.oNormalLink.oInfo.email = true;
						} else if ("beep" === $(this).text()) {
							_oScope.oNormalLink.oInfo.beep = true;
						} else if ("center" === $(this).text()) {
							_oScope.oNormalLink.oInfo.center = true;
						} else if ("monitorAlarm" === $(this).text()) {
							_oScope.oNormalLink.oInfo.monitor = true;
						} else if ("FTP" === $(this).text()) {
							_oScope.oNormalLink.oInfo.ftp = true;
						} else {
							// do nothing
						}
					});

					var oOutputIOPortIDList = null,
						iAlarmId = 0;

					if (_oScope.oAlarmLink) {
						// 模拟报警输出
						oOutputIOPortIDList = $(xmlDoc).find("outputIOPortID");
						$.each(_oService.m_aAnalogAlarmOutputId, function () {
							iAlarmId = this;
							_oScope.oAlarmLink.oInfo[iAlarmId] = false;// 重置对象数组的值
							$.each(oOutputIOPortIDList, function () {
								if ($(this).text() == iAlarmId) {
									_oScope.oAlarmLink.oInfo[iAlarmId] = true;
									return false;
								}
							});
						});
						// 数字报警输出
						oOutputIOPortIDList = $(xmlDoc).find("dynOutputIOPortID");
						$.each(_oService.m_aDigitalAlarmOutputId, function () {
							iAlarmId = this;
							_oScope.oAlarmLink.oInfo[iAlarmId] = false;// 重置对象数组的值
							$.each(oOutputIOPortIDList, function () {
								if ($(this).text() == iAlarmId) {
									_oScope.oAlarmLink.oInfo[iAlarmId] = true;
									return false;
								}
							});
						});
					}

					var oVideoInputID = null,
						iChannelId = 0;

					if (_oScope.oRecordLink) {
						// 触发模拟通道录像
						oVideoInputID = $(xmlDoc).find("videoInputID");
						$.each(_oService.m_aAnalogChannelId, function () {
							iChannelId = this;
							_oScope.oRecordLink.oInfo[iChannelId] = false;// 重置对象数组的值
							$.each(oVideoInputID, function () {
								if ($(this).text() == iChannelId) {
									_oScope.oRecordLink.oInfo[iChannelId] = true;
									return false;
								}
							});
						});
						// 触发数字通道录像
						oVideoInputID = $(xmlDoc).find("dynVideoInputID");
						$.each(_oService.m_aDigitalChannelId, function () {
							iChannelId = this;
							_oScope.oRecordLink.oInfo[iChannelId] = false;// 重置对象数组的值
							$.each(oVideoInputID, function () {
								if ($(this).text() == iChannelId) {
									_oScope.oRecordLink.oInfo[iChannelId] = true;
									return false;
								}
							});
						});
					}
				}
			});
		},
		// 获取布防时间
		getMotionDetectSchedule: function () {
			var self = this;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "motionSchedule", {channel: _oService.m_iChannelId}, {
				async: false,
				success: function (status, xmlDoc) {
					var oTimeBlockList = $(xmlDoc).find("TimeBlockList").eq(0).find("TimeBlock"),
						iDay = -1;

					// 重置对象数组
					for (var i = 0; i < 8; i++) {
						_oMotionDetectTimes[i] = [];
					}

					$.each(oTimeBlockList, function () {
						iDay = _oUtils.nodeValue(this, "dayOfWeek", "i") - 1;// 索引要减1

						_oMotionDetectTimes[iDay].push({
							sTime: $(this).find("TimeRange").eq(0).find("beginTime").eq(0).text(),
							eTime: $(this).find("TimeRange").eq(0).find("endTime").eq(0).text(),
							type: "CMR"
						});
					});

					if (_oScope.bHoliday) {
						oTimeBlockList = $(xmlDoc).find("HolidayBlockList").eq(0).find("TimeBlock");
						iDay = 7;// 索引要减1

						$.each(oTimeBlockList, function () {
							_oMotionDetectTimes[iDay].push({
								sTime: $(this).find("TimeRange").eq(0).find("beginTime").eq(0).text(),
								eTime: $(this).find("TimeRange").eq(0).find("endTime").eq(0).text(),
								type: "CMR"
							});
						});
					}
				}
			});
		},
		// 保存信息
		save: function () {
			var self = this;

			_oParent.m_oErrorXhr = null;

			if (_oScope.oDrawBtn.bDraw) {
				_oPlugin.setDrawStatus(false);
				_oService.m_oDrawBtn.bDraw = false;
			}

			self.setMotionDetectInfo();
		},
		// 设置移动侦测
		setMotionDetectInfo: function () {
			var self = this;

			self.setMotionLink();
			if (_oParent.m_oErrorXhr !== null) {
				_oResponse.saveState(_oParent.m_oErrorXhr);
				return;
			}

			self.setMotionSchedule();
			if(_oParent.m_oErrorXhr !== null) {
				_oResponse.saveState(_oParent.m_oErrorXhr);
				return;
			}

			var szAreaXmlInfo = _oPlugin.getRegionInfo();
			var oOcxXmlDoc= _oUtils.parseXmlFromStr(szAreaXmlInfo);

			if (_oMotionDetectInfo.szMotionMode === "expert") {
				var xmlDoc = _oMotionDetectInfo.oXmlDoc;
				$(xmlDoc).find("enabled").eq(0).text(_oMotionDetectInfo.bEnableMotion.toString());
				$(xmlDoc).find("enableHighlight").eq(0).text(_oMotionDetectInfo.bEnableHighlight.toString());

				var oSelMoveDetect = $(xmlDoc).find("MotionDetectionRegion");
				if (oSelMoveDetect.length == 0) {
					var szXml = "<?xml version='1.0' encoding='utf-8' ?><MotionDetectionRegion><id>" + parseInt(_oMotionDetectInfo.szAreaNo, 10) + "</id><enabled>true</enabled><sensitivityLevel>0</sensitivityLevel><daySensitivityLevel>0</daySensitivityLevel><nightSensitivityLevel>0</nightSensitivityLevel><objectSize>0</objectSize><dayObjectSize>0</dayObjectSize><nightObjectSize>0</nightObjectSize><RegionCoordinatesList><RegionCoordinates><positionX>0</positionX><positionY>0</positionY></RegionCoordinates><RegionCoordinates><positionX>0</positionX><positionY>0</positionY></RegionCoordinates><RegionCoordinates><positionX>0</positionX><positionY>0</positionY></RegionCoordinates><RegionCoordinates><positionX>0</positionX><positionY>0</positionY></RegionCoordinates></RegionCoordinatesList></MotionDetectionRegion>";
					oSelMoveDetect = parseXmlFromStr(szXml);
					$(xmlDoc).find("MotionDetectionRegionList").eq(0).append($(oSelMoveDetect.cloneNode(true)).children());
					oSelMoveDetect = $(xmlDoc).find("MotionDetectionRegion").eq(0);
				} else {
					oSelMoveDetect.each(function () {
						if (_oMotionDetectInfo.szAreaNo === $(this).find("id").eq(0).text()) {
							oSelMoveDetect = $(this);
							return false;
						}
					})
				}

				var _oMotionSwitch = $(xmlDoc).find("MotionDetectionSwitch").eq(0);

				_oMotionSwitch.find("type").text(_oMotionDetectInfo.szSwitchDayNight);
				if ("auto" === _oMotionDetectInfo.szSwitchDayNight || "schedule" === _oMotionDetectInfo.szSwitchDayNight) {
					if ("schedule" == _oMotionDetectInfo.szSwitchDayNight) {
						_oMotionSwitch.find("beginTime").text(_oMotionDetectInfo.szStartTime);
						_oMotionSwitch.find("endTime").text(_oMotionDetectInfo.szEndTime);

					}
					oSelMoveDetect.find("daySensitivityLevel").text(_oMotionDetectInfo.iDaySen);
					oSelMoveDetect.find("dayObjectSize").text(_oMotionDetectInfo.iDayPercentAge);
					oSelMoveDetect.find("nightSensitivityLevel").text(_oMotionDetectInfo.iNightSen);
					oSelMoveDetect.find("nightObjectSize").text(_oMotionDetectInfo.iNightPercentAge);
				} else {
					oSelMoveDetect.find("sensitivityLevel").text(_oMotionDetectInfo.iExpertSen);
					oSelMoveDetect.find("objectSize").text(_oMotionDetectInfo.iExpertPercentAge);
				}

				var _oRegionCoordinatesList = oSelMoveDetect.find("RegionCoordinates");
				if ($(oOcxXmlDoc).find("RegionCoordinates").length > 0) {
					for (var i = 0; i < _oRegionCoordinatesList.length; i++) {
						_oRegionCoordinatesList.eq(i).find("positionX").eq(0).text($(oOcxXmlDoc).find("positionX").eq(i).text());
						_oRegionCoordinatesList.eq(i).find("positionY").eq(0).text($(oOcxXmlDoc).find("positionY").eq(i).text());
					}
				} else {
					for (var i = 0; i < _oRegionCoordinatesList.length; i++) {
						_oRegionCoordinatesList.eq(i).find("positionX").eq(0).text(0);
						_oRegionCoordinatesList.eq(i).find("positionY").eq(0).text(0);
					}
				}
				WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "motionExtInfo", {channel: _oService.m_iChannelId}, {
					async: false,
					data: _oMotionDetectInfo.oXmlDoc,
					complete: function (status, xmlDoc, xhr) {
						_oResponse.saveState(xhr);
					}
				});
			} else {
				$(_oMotionDetectInfo.oXmlDoc).find("gridMap").eq(0).text($(oOcxXmlDoc).find("gridMap").eq(0).text());
				$(_oMotionDetectInfo.oXmlDoc).find("enabled").eq(0).text(_oMotionDetectInfo.bEnableMotion.toString());
				$(_oMotionDetectInfo.oXmlDoc).find("enableHighlight").eq(0).text(_oMotionDetectInfo.bEnableHighlight.toString());
				$(_oMotionDetectInfo.oXmlDoc).find("sensitivityLevel").eq(0).text(_oMotionDetectInfo.iSensitive);

				WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "motionInfo", {channel: _oService.m_iChannelId}, {
					async: false,
					data: _oMotionDetectInfo.oXmlDoc,
					complete: function (status, xmlDoc, xhr) {
						_oResponse.saveState(xhr);
					}
				});
			}


		},
		// 设置联动方式
		setMotionLink: function () {
			var self = this;

			var szXml = "<?xml version='1.0' encoding='UTF-8'?>";
			szXml += "<EventTrigger><id>VMD-" + _oService.m_iChannelId + "</id><eventType>VMD</eventType>";
			if (_oService.m_iChannelId <= _oService.m_iAnalogChannelNum) {
				szXml += "<videoInputChannelID>" + _oService.m_iChannelId + "</videoInputChannelID><EventTriggerNotificationList>";
			} else {
				szXml += "<dynVideoInputChannelID>" + _oService.m_iChannelId + "</dynVideoInputChannelID><EventTriggerNotificationList>";
			}
			if (_oScope.oAlarmLink) {
				var oAlarmInfo = _oScope.oAlarmLink.oInfo;
				$.each(_oScope.oAlarmLink.aAnalogAlarmId, function (i) {
					if (oAlarmInfo[this]) {
						szXml += "<EventTriggerNotification><id>IO-" + this + "</id>";
						szXml += "<notificationMethod>IO</notificationMethod>";
						szXml += "<outputIOPortID>" + this + "</outputIOPortID></EventTriggerNotification>";
					}
				});
				$.each(_oScope.oAlarmLink.aDigitalAlarmId, function (i) {
					if (oAlarmInfo[this]) {
						szXml += "<EventTriggerNotification><id>IO-" + this + "</id>";
						szXml += "<notificationMethod>IO</notificationMethod>";
						szXml += "<dynOutputIOPortID>" + this + "</dynOutputIOPortID></EventTriggerNotification>";
					}
				});
			}
			if (_oScope.oRecordLink) {
				var oRecordInfo = _oScope.oRecordLink.oInfo;
				$.each(_oScope.oRecordLink.aAnalogChannelId, function (i) {
					if (oRecordInfo[this]) {
						szXml += "<EventTriggerNotification><id>record-" + this + "</id>";
						szXml += "<notificationMethod>record</notificationMethod>";
						szXml += "<videoInputID>" + this + "</videoInputID></EventTriggerNotification>";
					}
				});
				$.each(_oScope.oRecordLink.aDigitalChannelId, function (i) {
					if (oRecordInfo[this]) {
						szXml += "<EventTriggerNotification><id>record-" + parseInt(this, 10) + "</id>";
						szXml += "<notificationMethod>record</notificationMethod>";
						szXml += "<dynVideoInputID>" + parseInt(this, 10) + "</dynVideoInputID></EventTriggerNotification>";
					}
				});
			}

			var oNormalInfo = _oScope.oNormalLink.oInfo;
			if (oNormalInfo.email)	{
				szXml += "<EventTriggerNotification><id>email</id><notificationMethod>email</notificationMethod></EventTriggerNotification>";
			}
			if (oNormalInfo.monitor)	{
				szXml += "<EventTriggerNotification><id>monitorAlarm</id><notificationMethod>monitorAlarm</notificationMethod></EventTriggerNotification>";
			}
			if (oNormalInfo.beep)	{
				szXml += "<EventTriggerNotification><id>beep</id><notificationMethod>beep</notificationMethod></EventTriggerNotification>";
			}
			if (oNormalInfo.center)	{
				szXml += "<EventTriggerNotification><id>center</id><notificationMethod>center</notificationMethod></EventTriggerNotification>";
			}
			if (_oScope.oNormalLink.bFtp && oNormalInfo.ftp) {
				szXml += "<EventTriggerNotification><id>FTP</id><notificationMethod>FTP</notificationMethod></EventTriggerNotification>";
			}
			szXml += "</EventTriggerNotificationList></EventTrigger>";

			var oXmlDoc = _oUtils.parseXmlFromStr(szXml);
			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "motionLink", {channel: _oService.m_iChannelId}, {
				async: false,
				data: oXmlDoc,
				success: function (status, xmlDoc) {
					// do nothing
				},
				error: function (status, xmlDoc, xhr) {
					_oParent.m_oErrorXhr = xhr;
				}
			});
		},
		// 设置布防时间
		setMotionSchedule: function () {
			var szXml = "<?xml version='1.0' encoding='UTF-8'?><Schedule>";
			szXml += "<id>VMD_video" + _oService.m_iChannelId + "</id><eventType>VMD</eventType>";
			szXml += "<videoInputChannelID>" + _oService.m_iChannelId + "</videoInputChannelID><TimeBlockList>";

			$.each(_oScope.oTimes, function (day, times) {
				if (times.length > 0 && day < 7) {
					$.each(times, function () {
						szXml += "<TimeBlock><dayOfWeek>" + (day + 1) + "</dayOfWeek><TimeRange><beginTime>" + this.sTime + "</beginTime><endTime>" + this.eTime + "</endTime></TimeRange></TimeBlock>";
					});
				}
			});

			szXml += "</TimeBlockList><HolidayBlockList>";

			if (_oScope.bHoliday) {
				$.each(_oScope.oTimes[7], function () {
					szXml += "<TimeBlock><TimeRange><beginTime>" + this.sTime + "</beginTime><endTime>" + this.eTime + "</endTime></TimeRange></TimeBlock>";
				});
			}
			szXml += "</HolidayBlockList></Schedule>";

			var oXmlDoc = _oUtils.parseXmlFromStr(szXml);
			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "motionSchedule", {channel: _oService.m_iChannelId}, {
				async: false,
				data: oXmlDoc,
				success: function (status, xmlDoc) {
					// do nothing
				},
				error: function (status, xmlDoc, xhr) {
					_oParent.m_oErrorXhr = xhr;
				}
			});
		}
	};

	module.exports = new Motion();
});