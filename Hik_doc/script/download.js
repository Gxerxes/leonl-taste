/**
 * Created by chenxiangzhen on 2014/7/8.
 */
define(function(require, exports, module) {
	require("uuid");

	var _oCommon = require("common");
	var _oTranslator = require("translator");
	var _oDialog = require("dialog");
	var _oUtils = require("utils");
	var _oPlugin = require("common/plugin");
	var _oHeader = require("common/header");
	var _oService = require("config/service");
	var _oDevice = require("isapi/device");
	var _oScope = null; //下载页面控制器作用域对象
	require("ui.table");
	require("ui.slider");
	require("ui.jquery");
	require("config/ui.config");
	//获取图片类型能力
	function _getImgTypeCap() {
		var arrTypeList = [];  //从设备获取的能力列表
		var arrCheckTypeList = [
            'AllEvent',
            'CMR',
            'MOTION',
            'ALARM',
            'EDR',
            'ALARMANDMOTION',
            'Command',
            'manaul',
            'manualSnapShot',
            'playSnapShot',
            'allPic',
            'pir',
            'wlsensor',
            'callhelp',
            'facedetection',
            'LineDetection',
            'FieldDetection',
            'AudioDetection',
            'scenechangedetection',
            'INTELLIGENT',
            'regionEntrance',
            'regionExiting',
            'loitering',
            'group',
            'rapidMove',
            'parking',
            'unattendedBaggage',
            'attendedBaggage',
            'vehicleDetection',
            'HVTVehicleDetection',
            'crosslane',
            'vehicleexist',
            'lanechange',
            'wrongdirection',
            'congestion',
            'turnround',
            'parkEvent'
        ];
		var arrSearchTypeList = [
            '0',
            'timing',
            'motion',
            'alarm',
            'motionOrAlarm',
            'motionAndAlarm',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0'
        ];  //跟能力名称一样则为0
		var arrTipsList = [
            'event',
            'continuous',
            'motion',
            'alarm',
            'motionOrAlarm',
            'motionAndAlarm',
            'command',
            'manual',
            'capture',
            'playSnapShot',
            'allTypes',
            'pirAlarm',
            'wirelessAlarm',
            'emergencyAlarm',
            'faceDetection',
            'lineDetection',
            'intrusionDetect',
            'audioDetection',
            'sceneChangeDetection',
            'vcaRecording',
            'regionEntranceDetect',
            'regionExitDetect',
            'loiterDetect',
            'peopleGatherDetect',
            'fastMoveDetect',
            'parkDetect',
            'unattendedBaggageDetect',
            'objectRemovalDetect',
            'vehicleDetection',
            'hvtVehicleDetection',
            'crosslaneDetection',
            'vehicleexistDetection',
            'lanechangeDetection',
            'wrongdirectionDetection',
            'congestionDetection',
            'turnroundDetection',
            'parkingType'
        ];

		WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "imgTypeCapa", null, {
			async: false,
			success: function (status, xmlDoc) {
				arrTypeList = $(xmlDoc).find('pictureSearchType').eq(0).attr('opt');
				if (arrTypeList) {
					arrTypeList = arrTypeList.split(',');
					_createTypeList(arrTypeList, arrCheckTypeList, arrSearchTypeList, arrTipsList, _oScope.captureFileTypes);  //图片类型
				} else {
					_oScope.bSupportSearch = false;
					_oScope.$apply();
				}
				_oScope.params.captureFileType = _oScope.captureFileTypes[0].value;
                _oScope.params.trafficCapture = 'anyType';
				if (!_oScope.$$phase) {
					_oScope.$apply();
				}
			}
		});
	}
	//获取录像类型能力
	function _getRecordTypeCap() {
		var arrTypeList = [];  //从设备获取的能力列表
		var arrCheckTypeList = ['AllEvent', 'CMR', 'MOTION', 'ALARM', 'pir', 'wlsensor', 'callhelp', 'facedetection', 'LineDetection', 'FieldDetection', 'AudioDetection', 'scenechangedetection', 'INTELLIGENT', 'regionEntrance', 'regionExiting', 'loitering', 'group', 'rapidMove', 'parking', 'unattendedBaggage', 'attendedBaggage','EDR', 'ALARMANDMOTION'];
		var arrSearchTypeList = ['0', 'timing', 'motion', 'alarm', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'motionOrAlarm', 'motionAndAlarm'];  //跟能力名称一样则为0
		var arrTipsList = ['event', 'continuous', 'motion', 'alarm', 'pirAlarm', 'wirelessAlarm', 'emergencyAlarm', 'faceDetection', 'lineDetection', 'intrusionDetect', 'audioDetection', 'sceneChangeDetection', 'vcaRecording', 'regionEntranceDetect', 'regionExitDetect', 'loiterDetect', 'peopleGatherDetect', 'fastMoveDetect', 'parkDetect', 'unattendedBaggageDetect', 'objectRemovalDetect', 'motionOrAlarm', 'motionAndAlarm'];
		WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "recordTypeCapa", {channel: _oService.m_iChannelId}, {
			async: false,
			success: function (status, xmlDoc) {
				arrTypeList = $(xmlDoc).find('DefaultRecordingMode').eq(0).attr('opt');
				if (arrTypeList) {
					arrTypeList = arrTypeList.split(',');
					_createTypeList(arrTypeList, arrCheckTypeList, arrSearchTypeList, arrTipsList, _oScope.recordFileTypes, true);  //录像类型
				}
				if (!_oScope.$$phase) {
					_oScope.$apply();
				}
			}
		});
	}
	//获取车辆图片搜索能力
	function _getVehicleDetectCap () {
		var aCountryName = {
			"1" : "Czech Republic",
			"2": "France", 
			"3": "Germany",
			"4": "Spain",
			"5": "Italy",
			"6": "Netherlands",
			"7": "Poland",
			"8": "Slovakia",
			"9": "Belorussia",
			"10": "Moldova",
			"11": "Russia",
			"12":"Ukraine",
			"255": "All"
		};
		WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "vehicleDetectCap", null, {
			async: false,
			success: function (status, xmlDoc) {
				var countryOpt = $(xmlDoc).find("supCountry").eq(0).attr("opt");
				if(countryOpt) {
					var aCountry = $(xmlDoc).find("supCountry").eq(0).attr("opt").split(",");
				}
				if(countryOpt) {
					for(var i = 0; i < aCountry.length; i++) {
						if(aCountryName[aCountry[i]]) {
							_oScope.aCountryList.push({
								value: aCountry[i],
								name: aCountryName[aCountry[i]]
							});
						}
					}
				}
				if(_oUtils.nodeValue($(xmlDoc), "supCustomStateOrProvince", "b")) {
					var bCustomExist = false;
					$(_oScope.provinces).each(function () {
						if(this.value === "999") {
							bCustomExist = true;
						}
					});
					if(!bCustomExist) {
						_oScope.provinces.push({
							value: "999",
							name: _oScope.oLan.custom
						});
					}
				}
				if( _oScope.aCountryList.length > 0) {
					_oScope.country = _oScope.aCountryList[0].value;
				}
				if (!_oScope.$$phase) {
					_oScope.$apply();
				}
			}
		});
	};
	//根据能力列表，检查显示等列表生成类型下拉框
	function _createTypeList (arrDeviceTypeList, arrCheckTypeList,arrSearchTypeList, arrTipsList, arrTypeList, bAddAll) {
		arrTypeList.length = 0;

		if (bAddAll) {
			arrTypeList.push({value: "allTypes", name: _oTranslator.getValue("allType")});
		}
		for (var i = 0; i < arrDeviceTypeList.length; i++) {
			var tmCap = arrDeviceTypeList[i];
			var iPos = $.inArray(tmCap, arrCheckTypeList);
			if (iPos >= 0) {
				if (arrSearchTypeList[iPos] === "0") {
					arrTypeList.push({value: arrCheckTypeList[iPos], name: _oTranslator.getValue(arrTipsList[iPos])});
				} else {
					arrTypeList.push({value: arrSearchTypeList[iPos], name: _oTranslator.getValue(arrTipsList[iPos])});
				}
			}
		}
	}
	function Download() {
		this.m_szFiletype = "picture";
		this.m_iPerResult = 50; //每次搜索最大的条目数量
		this.m_oSearchXml = null;
		this.m_iSearchTimes = 0;
		this.m_oPlugin = null;
		this.m_szSearchDate = ""; // 当前搜索的日期
	}

	Download.prototype = {
		// 页面初始化
		init: function () {
			var self = this;
			_oService.init();

			var szUrl = decodeURI(document.URL);
			if (szUrl.indexOf("?") !== -1) {
				var szFileType = _oUtils.getURIParam("fileType", szUrl);
				if (szFileType !== "") {
					self.m_szFiletype = szFileType;
				}
			}
			if (szUrl.indexOf("&date") !== -1) {
				var szCurrentDate = _oUtils.getURIParam("date", szUrl);
				if (szCurrentDate !== "") {
					self.m_szSearchDate = szCurrentDate;
				}
			}
			if (szUrl.indexOf("&chan") !== -1) {
				var szChannel = _oUtils.getURIParam("chan", szUrl);
				if (szChannel !== "") {
					_oService.m_iChannelId = parseInt(szChannel, 10);
				}
			}

			var oLan = _oTranslator.getLanguage("Download");
			_oTranslator.appendLanguage(oLan, _oCommon.m_oLanCommon);

			self.initLayout();
			self.initController();
			_oPlugin.initPlugin("0");

			if (self.m_szFiletype === "picture") {
				document.title = _oTranslator.getValue("picture");
			} else {
				document.title = _oTranslator.getValue("download");
			}
		},
		initLayout: function () {
			var self = this;

			var layoutSettings = {
				defaults: {
					spacing_open: 0,
					spacing_closed: 0
				},
				north: {
					paneSelector: ".layout-north",
					size: 40,
					initHidden: self.m_szFiletype === "record"
				},
				center: {
					paneSelector: ".layout-center",
					childOptions: {
						defaults: {
							spacing_open: 0,
							spacing_closed: 0
						},
						north: {
							paneSelector: ".layout-north-inner",
							size: 45
						},
						west: {
							paneSelector: ".layout-west-inner",
							size: 202
						},
						center: {
							paneSelector: ".layout-center-inner",
							childOptions: {
								defaults: {
									spacing_open: 0,
									spacing_closed: 0
								},
								north: {
									paneSelector: ".layout-north-inner-inner"
								},
								center: {
									paneSelector: ".layout-center-inner-inner"
								}
							}
						}
					}
				},
				south: {
					paneSelector: ".layout-south",
					size: 30
				}
			};

			$("body").show().layout(layoutSettings);
		},
		// 初始化控制器
		initController: function () {
			_oHeader.init("header", 2);
			var self = this;
			var oDownloadApp = angular.module("downloadApp", ["ui.jquery", "ui.config"]);
			oDownloadApp.controller("downloadController", function ($scope) {
				_oScope = $scope;
				$scope.oLan = _oTranslator.oLastLanguage;
				$scope.bSupportSearch = true; //是否支持查询
				$scope.channelInfo = {
					iChannelId: _oService.m_iChannelId
				};
				$scope.$watch("channelInfo.iChannelId", function (newChannel) {
					if (angular.isDefined(newChannel)) {
						_oService.m_iChannelId = newChannel;
						if (self.m_szFiletype === "picture") {
							_getImgTypeCap();
							_getVehicleDetectCap();
							document.title = _oTranslator.getValue("picture");
						} else {
							_getRecordTypeCap();
							document.title = _oTranslator.getValue("download");
						}
					}
				});
				$scope.iChannelNum = _oService.m_iAnalogChannelNum + _oService.m_iDigitalChannelNum;
				$scope.oDigital = _oService.m_aDigitalChannelId;

				$scope.iAnalogChannelNum = _oService.m_iAnalogChannelNum;
				$scope.oAnalogId = _oService.m_aOnlineAnalogChannelId;

				var bPicturePage = ("picture" === self.m_szFiletype);
				var aTableHead = [
					{
						display: $scope.oLan.fileName,
						percentWidth: "25"
					},
					{
						display: $scope.oLan.startTime,
						percentWidth: "20"
					},
					{
						display: $scope.oLan.endTime,
						percentWidth: "20",
						hide: bPicturePage
					},
					{
						display: $scope.oLan.fileSize,
						percentWidth: "10"
					},
					{
						display: $scope.oLan.downloadProgress,
						percentWidth: "15"
					}
				];

				var bHidePreview = !(bPicturePage && 0 === seajs.iDeviceType);
				aTableHead.push({
					display: $scope.oLan.preview,
					percentWidth: "10",
					type: "button",
					hide: bHidePreview,
					callback: _previewPicture
				});


				if (bPicturePage) {				
					//图片只有开始时间，不需要结束时间
					aTableHead[1].display = $scope.oLan.time;
					aTableHead[1].percentWidth = "30";
					aTableHead[3].percentWidth = "20";
					if (bHidePreview) {
						aTableHead[4].percentWidth = "25";
					}
				} else {
					aTableHead[0].percentWidth = "30";
					aTableHead[4].percentWidth = "20";
				}

				//向table里添加数据时，数据都是处理过的，有时需要保留原始数据，
				//暂时将这些原始数据和table用到的数据放在一起，以iExtarDataIndex作为分界索引
				$scope.iExtarDataIndex = 6;
				$scope.oTable = $("#table").table({
					header: aTableHead,
					lan: {index: $scope.oLan.serialNumber, item: $scope.oLan.items, total: $scope.oLan.total},
					showCheckbox: true,
					showIndex: true,
					showPage: true,
					perPage: 100
				});
				$scope.captureFileTypes = [
					{value: "timing", name: _oTranslator.getValue("continuous")},
					{value: "motion", name: _oTranslator.getValue("motion")},
					{value: "alarm", name: _oTranslator.getValue("alarm")},
					{value: "pir", name: _oTranslator.getValue("pirAlarm")},
					{value: "wlsensor", name: _oTranslator.getValue("wirelessAlarm")},
					{value: "callhelp", name: _oTranslator.getValue("emergencyAlarm")},
					{value: "facedetection", name: _oTranslator.getValue("faceDetection")},
					{value: "LineDetection", name: _oTranslator.getValue("lineDetection")},
					{value: "FieldDetection", name: _oTranslator.getValue("intrusionDetect")},
					{value: "AudioDetection", name: _oTranslator.getValue("audioDetection")},
					{value: "scenechangedetection", name: _oTranslator.getValue("sceneChangeDetection")},
					{value: "INTELLIGENT", name: _oTranslator.getValue("vcaRecording")},
					{value: "regionEntrance", name: _oTranslator.getValue("regionEntranceDetect")},
					{value: "regionExiting", name: _oTranslator.getValue("regionExitDetect")},
					{value: "loitering", name: _oTranslator.getValue("loiterDetect")},
					{value: "group", name: _oTranslator.getValue("peopleGatherDetect")},
					{value: "rapidMove", name: _oTranslator.getValue("fastMoveDetect")},
					{value: "parking", name: _oTranslator.getValue("parkDetect")},
					{value: "unattendedBaggage", name: _oTranslator.getValue("unattendedBaggageDetect")},
					{value: "attendedBaggage", name: _oTranslator.getValue("objectRemovalDetect")},
					{value: "vehicleDetection", name: _oTranslator.getValue("vehicleDetection")}
				];

				$scope.recordFileTypes = [
					{value: "allTypes", name: _oTranslator.getValue("allType")},
					{value: "timing", name: _oTranslator.getValue("continuous")},
					{value: "motion", name: _oTranslator.getValue("motion")},
					{value: "alarm", name: _oTranslator.getValue("alarm")},
					{value: "AllEvent", name: _oTranslator.getValue("event")},
					{value: "pir", name: _oTranslator.getValue("pirAlarm")},
					{value: "wlsensor", name: _oTranslator.getValue("wirelessAlarm")},
					{value: "callhelp", name: _oTranslator.getValue("emergencyAlarm")},
					{value: "facedetection", name: _oTranslator.getValue("faceDetection")},
					{value: "LineDetection", name: _oTranslator.getValue("lineDetection")},
					{value: "FieldDetection", name: _oTranslator.getValue("intrusionDetect")},
					{value: "AudioDetection", name: _oTranslator.getValue("audioDetection")},
					{value: "scenechangedetection", name: _oTranslator.getValue("sceneChangeDetection")},
					{value: "INTELLIGENT", name: _oTranslator.getValue("vcaRecording")},
					{value: "regionEntrance", name: _oTranslator.getValue("regionEntranceDetect")},
					{value: "regionExiting", name: _oTranslator.getValue("regionExitDetect")},
					{value: "loitering", name: _oTranslator.getValue("loiterDetect")},
					{value: "group", name: _oTranslator.getValue("peopleGatherDetect")},
					{value: "rapidMove", name: _oTranslator.getValue("fastMoveDetect")},
					{value: "parking", name: _oTranslator.getValue("parkDetect")},
					{value: "unattendedBaggage", name: _oTranslator.getValue("unattendedBaggageDetect")},
					{value: "attendedBaggage", name: _oTranslator.getValue("objectRemovalDetect")}
				];

				$scope.params = {
					recordFileType : $scope.recordFileTypes[0].value,
					captureFileType : $scope.captureFileTypes[0].value,
                    hvtType: "all"
				};

				$scope.provinces = [
					{value: "255", name: _oTranslator.getValue("all")},
                    {value: "1", name: "澳"},
					{value: "2", name: "京"},
					{value: "3", name: "渝"},
					{value: "4", name: "闽"},
					{value: "5", name: "甘"},
					{value: "6", name: "粤"},
					{value: "7", name: "桂"},
					{value: "8", name: "贵"},
					{value: "9", name: "琼"},
					{value: "10", name: "冀"},
					{value: "11", name: "豫"},
					{value: "12", name: "黑"},
					{value: "13", name: "鄂"},
					{value: "14", name: "湘"},
					{value: "15", name: "吉"},
					{value: "16", name: "苏"},
					{value: "17", name: "赣"},
					{value: "18", name: "辽"},
					{value: "19", name: "蒙"},
					{value: "20", name: "宁"},
					{value: "21", name: "青"},
					{value: "22", name: "鲁"},
					{value: "23", name: "晋"},
					{value: "24", name: "陕"},
					{value: "25", name: "沪"},
					{value: "26", name: "川"},
                    {value: "27", name: "台"},
					{value: "28", name: "津"},
					{value: "29", name: "藏"},
                    {value: "30", name: "港"},
					{value: "31", name: "新"},
					{value: "32", name: "云"},
					{value: "33", name: "浙"},
					{value: "34", name: "皖"}
				];
				$scope.aCountryList = [];
				$scope.province = $scope.provinces[0].value; //省份简称
				$scope.plate = ""; //车牌

				var szCurrentDate = _oUtils.dateFormat(new Date(), "yyyy-MM-dd");
				if(self.m_szSearchDate !== "") {
					szCurrentDate = self.m_szSearchDate;
				}
				$scope.oSearchTime = {
					startTime: szCurrentDate + " 00:00:00",
					endTime: szCurrentDate + " 23:59:59"
				};

				$scope.fileType = self.m_szFiletype;
				$scope.cameraID = "";
				$scope.bSupportCloudPic = _oDevice.m_oDeviceCapa.bSupportPicDown;
				var _bSearching = false; //是否正在查找
				var _oWaitDlg = null; //等待提示窗口
				//查找文件
				$scope.searchFile = function () {
					//没有通道
					if (!$scope.bSupportCloudPic && ($scope.channelInfo.iChannelId === 0 || $scope.iChannelNum === 0)) {
						return;
					}
					if (self.m_oSearchXml === null) {
						if (_bSearching) { //正在查找
							return;
						}
						_oWaitDlg = _oDialog.wait(null, _oTranslator.getValue("searching"));
						var szStartTime = $scope.oSearchTime.startTime;
						var szStopTime = $scope.oSearchTime.endTime;

						if (Date.parse(szStopTime.replace(/-/g, "/")) - Date.parse(szStartTime.replace(/-/g, "/")) < 0) {
							_oDialog.tip(_oTranslator.getValue('sTimeLaterETime'));
							_oWaitDlg.close();
							return;
						}
						$scope.oTable.deleteRows();
						//暂时不使用UTC时间
						szStartTime = szStartTime.replace(" ", "T") + "Z";
						szStopTime = szStopTime.replace(" ", "T") + "Z";
						szStartTime = _oUtils.convertToUTCTime(szStartTime);
						szStopTime = _oUtils.convertToUTCTime(szStopTime);

						var szXml = "<?xml version='1.0' encoding='utf-8'?>";
						szXml += "<CMSearchDescription>";
						szXml += "<searchID>" + new UUID() + "</searchID>";
						if ($scope.bSupportCloudPic) {
							szXml += "<sourceIDList><sourceID>" + $scope.cameraID.replace(/</g, "&lt;") + "</sourceID></sourceIDList>";
						} else {
							szXml += "<trackIDList><trackID>" + ($scope.channelInfo.iChannelId * 100 + ($scope.fileType !== "picture" ? 1 : 3)) + "</trackID></trackIDList>";
						}
						szXml += "<timeSpanList><timeSpan><startTime>" + szStartTime + "</startTime><endTime>" + szStopTime + "</endTime></timeSpan></timeSpanList>";
						if ($scope.fileType === "picture") {
							szXml += "<contentTypeList><contentType>metadata</contentType></contentTypeList>";
						}
						szXml += "<maxResults>" + self.m_iPerResult + "</maxResults><searchResultPostion>0</searchResultPostion>";
						if ($scope.fileType !== "picture") {
							if ($scope.params.recordFileType === "allTypes") {
								szXml += "<metadataList><metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor>";
							} else {
								szXml += "<metadataList><metadataDescriptor>//recordType.meta.std-cgi.com/" + $scope.params.recordFileType + "</metadataDescriptor>";
							}
						} else {
							szXml += "<metadataList><metadataDescriptor>//recordType.meta.std-cgi.com/" + $scope.params.captureFileType + "</metadataDescriptor>";
						}

						if($scope.fileType === "picture" && $scope.params.captureFileType === "vehicleDetection") {
							szXml += "<SearchProperity><plateSearchMask>" + $scope.plate + "</plateSearchMask><stateOrProvince>" + $scope.province + "</stateOrProvince></SearchProperity>";
						}
                        if($scope.fileType === "picture" && $scope.params.captureFileType === "HVTVehicleDetection") {
                            szXml += "<SearchProperity><subType>" + $scope.params.hvtType + "</subType>";
                            if($scope.params.hvtType === "motorVehicle") {
                                szXml += "<plateSearchMask>" + $scope.plate + "</plateSearchMask>";
								if($scope.aCountryList.length > 0) {
									szXml += "<country>" + $scope.country + "</country>"
								} else {
									szXml += "<stateOrProvince>" + $scope.province + "</stateOrProvince>";
								}
                            }
                            szXml += "</SearchProperity>";
                        }
                        if($scope.fileType === "picture" && $scope.showTrafficParam($scope.params.captureFileType)) {
                            szXml += "<SearchProperity><capTypeDescriptor>" + $scope.params.trafficCapture + "</capTypeDescriptor>";
                            szXml += "</SearchProperity>";
                        }
						szXml += "</metadataList>";
						szXml += "</CMSearchDescription>";

						self.m_oSearchXml = _oUtils.parseXmlFromStr(szXml);
					} else {
						$(self.m_oSearchXml).find('searchResultPostion').eq(0).text(self.m_iPerResult * self.m_iSearchTimes);
					}

					WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "recordSearch", null, {
						async: true,
						data: self.m_oSearchXml,
                        timeout: 600000,
						success: function (status, xmlDoc) {
							var oSearchItems = null;
							_bSearching = true;
							if ("MORE" === $(xmlDoc).find("responseStatusStrg").eq(0).text()) {
								self.m_iSearchTimes++;
								oSearchItems = $(xmlDoc).find('searchMatchItem');
							} else if("OK" === $(xmlDoc).find("responseStatusStrg").eq(0).text()) {
								self.m_iSearchTimes = 0;
								self.m_oSearchXml = null;
								oSearchItems = $(xmlDoc).find('searchMatchItem');
							} else if ("NO MATCHES" === $(xmlDoc).find("responseStatusStrg").eq(0).text()) {
								self.m_iSearchTimes = 0;
								self.m_oSearchXml = null;
								if ($scope.fileType !== "picture") {
									_oDialog.tip(_oTranslator.getValue("noRecordFiles"));
								} else {
									_oDialog.tip(_oTranslator.getValue("noPictrueFiles"));
								}
							}
							if (oSearchItems !== null) {
								var aItems = [];
								for (var i = 0; i < oSearchItems.length; i++) {
									//暂时不使用UTC时间
									var szFileStartTime = oSearchItems.eq(i).find('startTime').eq(0).text().replace("T", " ").replace("Z", "");
									var szFileEndTime = oSearchItems.eq(i).find('endTime').eq(0).text().replace("T", " ").replace("Z", "");
									var szLocalFileStartTime = _oUtils.convertToLocalTime(szFileStartTime, _oDevice.m_iDeviceMinusLocalTime).replace("T", " ").replace("Z", "");
									var szLocalFileEndTime = _oUtils.convertToLocalTime(szFileEndTime, _oDevice.m_iDeviceMinusLocalTime).replace("T", " ").replace("Z", "");
									var szPlaybackURI = oSearchItems.eq(i).find('playbackURI').eq(0).text();
									if($scope.bSupportCloudPic) {
										var szFileName = $scope.cameraID + "_" + szFileStartTime.replace(/[-:]/g, "") + "_" + i
									} else {
										var szFileName = szPlaybackURI.substring(szPlaybackURI.indexOf("name=") + 5, szPlaybackURI.indexOf("&size="));
									}
                                    if(szFileName && szFileName.indexOf("@") >= 0) {
                                        var szShowFileName = szFileName.split("@")[1];
                                    } else {
                                        var szShowFileName = szFileName;
                                    }
									var szFileSize = szPlaybackURI.substring(szPlaybackURI.indexOf("size=") + 5, szPlaybackURI.length);

									var aItem = null;

									szFileStartTime = szFileStartTime.replace(" ", "T");
									szFileEndTime = szFileEndTime.replace(" ", "T");
									var iFileSize = parseInt(szFileSize, 10);
									if (iFileSize > 1024 * 1024) {
										var oFileSize = new Object();
										oFileSize[szFileSize] = Math.round(iFileSize / (1024 * 1024)) + " MB";
										aItem = [szShowFileName, szLocalFileStartTime, szLocalFileEndTime, oFileSize, ""];
									} else if (iFileSize > 1024) {
										var oFileSize = new Object();
										oFileSize[szFileSize] = Math.round(iFileSize / 1024) + " KB";
										aItem = [szShowFileName, szLocalFileStartTime, szLocalFileEndTime, oFileSize, ""];
									} else {
										aItem = [szShowFileName, szLocalFileStartTime, szLocalFileEndTime, szFileSize, ""];
									}
									aItem[5] = szPlaybackURI;
									aItem[$scope.iExtarDataIndex] = szFileStartTime;
									aItem[$scope.iExtarDataIndex + 1] = szFileEndTime;

									aItems.push(aItem);
								}
								$scope.oTable.addRows(aItems);
							}
							//未搜索完毕，继续搜索
							if (self.m_iSearchTimes !== 0) {
								$scope.searchFile();
							} else {
								_bSearching = false;
								_oWaitDlg.close();
							}
						},
						error: function () {
							self.m_iSearchTimes = 0;
							self.m_oSearchXml = null;
							_bSearching = false;
							_oWaitDlg.close();
							if ($scope.fileType === "picture") {
								_oDialog.tip(_oTranslator.getValue("searchPictureFailed"));
							} else {
								_oDialog.tip(_oTranslator.getValue("searchRecordFailed"));
							}

						}
					});
				};
				$scope.bDownloading = false; //是否正在下载
				var _iDownloadID = -1; //下载ID
				var _iTimer = -1; //定时器ID
				var _aDownloadFiles = []; //需要下载的文件列表
				var _iNowDownloading = 0; //当前下载文件在选中文件中的索引
				//下载文件
				$scope.startDownload = function () {
					_aDownloadFiles = $scope.oTable.getCheckedRows();
					_iNowDownloading = 0;
					if (_aDownloadFiles.length > 0) {
						$scope.bDownloading = true;
						$scope.oTable.disable(true);
						_download();
					} else {
						_oDialog.tip(_oTranslator.getValue("selectDownloadFile"));
					}
				};
				//下载文件
				function _download() {
					var oFileItem = _aDownloadFiles[_iNowDownloading];
					var oFileData = oFileItem.data;
					$.each(oFileData, function(index, item) {
						if ($.isPlainObject(item)) {
							$.each(item, function (prop) {
								oFileData[index] = prop;
								//只访问第一个属性
								return false;
							});
						}
					});
					var oExtarFileData = oFileData.slice($scope.iExtarDataIndex);
					var szRecordFormat = ".mp4"; //录像文件后缀
					var szPictureFormat = ".jpg"; //图片文件后缀
					var szPlaybackURI = oFileData[5];
					var szDownXml = "";
					var szURL = szPlaybackURI;
					// if ($scope.fileType === "record") {
                        if(oFileData[5].match("name=")) {
                            if($scope.bSupportCloudPic) {
                                var szFileName = oFileData[0];
                            } else {
                                var szFileName = szURL.substring(szURL.indexOf("name=") + 5, szURL.indexOf("&size="));
                            }
                        }
						szPlaybackURI = "rtsp://" + _oCommon.m_szHostName + "/Streaming/tracks/" + $scope.channelInfo.iChannelId  + ($scope.fileType === "picture" ? "20" : "01") + "?starttime=" + oExtarFileData[0] + "Z&amp;endtime=" + oExtarFileData[1] + "Z&amp;name=" + szFileName + "&amp;size=" + oFileData[3];
						szDownXml = "<?xml version='1.0'?><downloadRequest>";
						szDownXml += "<playbackURI>" + szPlaybackURI + "</playbackURI>";
						szDownXml += "</downloadRequest>";
						szURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/ContentMgmt/download";
					// }
					var szFileName = oFileData[0] + ($scope.fileType == "record" ? szRecordFormat : szPictureFormat);

					_iDownloadID = _oPlugin.startDownloadEx(szURL, _oCommon.m_szPluginNamePwd, szFileName, szDownXml, "");
					var oProcessSpan = oFileItem.item.find("span").last().prev();
					oProcessSpan.empty();
					if (_iDownloadID >= 0) {
						var oProcessSlider = $("<div style='width:" + oProcessSpan.width() + "px;'></div>").appendTo(oProcessSpan).slider({type: "process", showBox: true});
						var iSliderTop = Math.round((oProcessSpan.height() - oProcessSlider.outerHeight(true)) / 2);
						var iSliderLeft = Math.round((oProcessSpan.width() - oProcessSlider.outerWidth(true)) / 2);
						oProcessSlider.css({
							"margin-left": iSliderLeft + "px",
							"margin-top": iSliderTop + "px"
						});
						if (_iTimer) {
							window.clearInterval(_iTimer);
						}
						_iTimer = window.setInterval(function () {
							var iProcess = _getProcess();
							if (iProcess < 0) { //获取进度异常
								oProcessSpan.html(_oTranslator.getValue("downloadFailed"));
							} else if (iProcess < 100) {
								oProcessSlider.setValue(iProcess);
							} else { //下载完成
								oProcessSlider.remove();
								oProcessSpan.html(_oTranslator.getValue("downloaded"));
							}
							if (iProcess < 0 || iProcess >= 100) {
								if (_iNowDownloading < _aDownloadFiles.length) {
									_stopDownload();
									_download();
								} else {
									var szFilePath = "";
									var szPathInfo = _oPlugin.getLocalConfig();
									var oXmlDoc = _oUtils.parseXmlFromStr(szPathInfo);

									// 抓图文件格式
									if ($(oXmlDoc).find("CaptureFileFormat").length > 0) {
										szFilePath = _oUtils.nodeValue(oXmlDoc, "DownloadPath");
									}
									var oDate = new Date();
									szFilePath += "\\" + _oUtils.dateFormat(oDate, "yyyy-MM-dd");
									_oDialog.tip(_oTranslator.getValue("downloadSucessed") + "<p id='openDirectory' class='dir pointer'>" + szFilePath + "</a></p>");
									$("#openDirectory").click(function () {
										_oPlugin.openDirectory(szFilePath);
									});

									$scope.$apply(function () {
										$scope.stopDownload();
									});
								}
							}
						}, 1000);
						_iNowDownloading++;
					} else {
						oProcessSpan.html(_oTranslator.getValue("downloadFailed"));
						_iNowDownloading++;
						if (_iNowDownloading < _aDownloadFiles.length) {
							_stopDownload();
							_download();
						} else {
							if (!$scope.$$phase) {
								$scope.$apply(function () {
									$scope.stopDownload();
								});
							} else {
								$scope.stopDownload();
							}
						}
					}

				}
				//关闭下载
				function _stopDownload() {
					_oPlugin.stopDownload(_iDownloadID);
					_iDownloadID = -1;
				}
				//获取下载进度
				function _getProcess() {
					var iStatus = _oPlugin.getDownloadStatus(_iDownloadID);
					if (0 === iStatus) {
						var iProcess = _oPlugin.getDownloadProgress(_iDownloadID);
						return iProcess;
					} else {
						return -1;
					}
				}
				//预览图片
				function _previewPicture(param) {
					//如果http端口不是80，img的地址需要手动添加一下端口，否则访问不到
					//正则表达式的?表示非贪婪匹配
					var szPrototype = param.substr(0, (param.indexOf("://") + 3));
					if (szPrototype != _oCommon.m_szHttpProtocol) {
						param = param.replace(szPrototype,  _oCommon.m_szHttpProtocol);
					}
					param = param.replace(/\/\/(.*?)\//, "//$1:" + _oCommon.m_iHttpPort + "/");
					var szFileName = param.substring(param.indexOf("name=") + 5, param.indexOf("&size="));
					_oDialog.html(szFileName, "<div><img style='width: 800px; height: 600px;' src='" + param + "' onload='artDialog.get(\"dialoghtml\").position(artDialog.defaults.left, artDialog.defaults.top)'/></div>");
				}
				$scope.stopDownload = function () {
					_stopDownload();
					$scope.bDownloading = false;
					_aDownloadFiles.length = 0;
					_iNowDownloading = 0;

					if (_iTimer) {
						window.clearInterval(_iTimer);
						_iTimer = -1;
					}
					$scope.oTable.disable(false);
				};
				$scope.$on("$destroy", function () {
					$scope.stopDownload();
				});
				$scope.changeDownType = function (event) {
					var $clickTarget = $(event.currentTarget);
					if (!$clickTarget.hasClass("download-type-select")) {
						$clickTarget.addClass("download-type-select");
						$clickTarget.siblings().removeClass("download-type-select");
					}
				};
                $scope.showTrafficParam = function(szType){
                    var aTypes = ['crosslane', 'vehicleexist','lanechange', 'wrongdirection', 'congestion', 'turnround', 'parkEvent'];
                    return $.inArray(szType, aTypes) > -1;
                };
                $scope.hideTrafficOption = function(szType) {
                    var ahideEvidenceType = ["congestion"];
                    var bHide = !($.inArray(szType, ahideEvidenceType) > -1);
                    if(!bHide && $scope.params.trafficCapture == "evidence") {
                        $scope.params.trafficCapture = 'anyType';
                    }
                    return bHide;
                };
                $scope.$watch("plate", function(to){
                    if(to) {
                        $scope.plate = to.replace(/[^\d]/g, "");
                    }
                })
			});

			angular.bootstrap(angular.element(".download"), ["downloadApp"]);


			//默认进来搜索当天文件，图片、云存储方式和不支持不搜索
			// if (self.m_szFiletype !== "picture" && !_oScope.bSupportCloudPic && _oScope.bSupportSearch) {
			// 	setTimeout(_oScope.searchFile, 1000);
			// }
		},
		unload: function () {
			_oScope.$destroy();
		}
	};

	module.exports = new Download();
});