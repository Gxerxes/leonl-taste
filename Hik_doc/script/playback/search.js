define(function (require, exports, module) {
	var _oCommon, _oTranslator, _oChannel, _oPlugin, _oTimebar, _oUtils, _oDialog, _oService, _oOption;

	require("uuid");

	_oCommon = require("common");
	_oTranslator = require("translator");

	_oChannel = require("common/channel");
	_oPlugin = require("common/plugin");
	_oTimebar = require("playback/timebar");
	_oUtils = require("utils");
	_oDialog = require("dialog");

	_oDevice = require("isapi/device");
	_oService = require("service");

	function Search() {
		this.m_arrSearchMonthArray = [];		// 搜索有录像的天
		this.m_arrSearchMonthEventArray = [];	// 有事件录像的天
		this.m_iSearchYear = 0;				    // 搜索整月录像年份
		this.m_iSearchMonth = 0;				// 搜索整月录像月份
		this.m_szSearchDate = "";				// 当前搜索的日期
		this.m_szCalendarDate = "";				// 当前日历的日期
		this.m_oSearchXml = null;				// 搜索Xml对象
		this.m_iSearchTimes = 0;				// 搜索次数
		this.m_arrSearchRecord = [];           	// 录像结果集数组
		this.m_oSearchRecord = null;           	// 当前操作结果集
		this.m_bSupportDown = false;           	// 是否支持下载

		_oOption = {
			onGotoTime: null
		};
	}

	Search.prototype = {
		init: function (szID, oOption) {
			var oSearchApp = angular.module("searchApp", []),
				self = this;

			// 可选参数合并
			$.extend(_oOption, oOption);

			// 初始化搜索日期及日历日期
			var t = new Time();
			self.m_szCalendarDate = t.getStringTime().split(" ")[0];
			self.m_szSearchDate = self.m_szCalendarDate;
			self.m_iSearchYear = self.m_szCalendarDate.split("-")[0];
			self.m_iSearchMonth = self.m_szCalendarDate.split("-")[1];

			oSearchApp.controller("searchController", function ($scope) {
				$scope.oLanSearch = _oTranslator.oLastLanguage;
				$scope.oTime = {
					szHour: "00",
					szMinute: "00",
					szSecond: "00"
				};

				// 加载完毕后触发
				$scope.searchLoaded = function () {
					_oService.m_oLoaded.bSearch = true;
					self.createDatePicker();
				};
				// 搜索
				$scope.search = function () {
					if (_oChannel.m_iChannelId > -1) {
						self.searchRecordFile(2);
					} else {
						_oDialog.tip(_oTranslator.getValue("selectOneChannel"));
					}
				};
				// 检查时间
				$scope.checkTime = function (target, iMax) {
					var obj = $(target);
					if (!(Number(obj.val()) <= iMax)) {
						obj.val("00");
					}
				};
				// 定位时间
				$scope.gotoTime = function () {
					if (_oOption.onGotoTime) {
						_oOption.onGotoTime($scope.oTime.szHour, $scope.oTime.szMinute, $scope.oTime.szSecond);
					}
				};
			});

			angular.bootstrap(angular.element("#" + szID), ["searchApp"]);
		},
		// 搜索月历信息
		searchMonthRecordFile: function () {
			var self = this,
				iRecordDateNum = 0,
				iRecordEventDateNum = 0,
				iChannelId = _oChannel.m_iChannelId,
				iDayOfMonth = -1;

			// 清空记录
			self.m_arrSearchMonthArray.splice(0, self.m_arrSearchMonthArray.length);
			self.m_arrSearchMonthEventArray.splice(0, self.m_arrSearchMonthEventArray.length);

			var szXml = "<?xml version='1.0' encoding='utf-8'?><trackDailyParam><year>" + self.m_iSearchYear + "</year>";
			szXml += "<monthOfYear>" + self.m_iSearchMonth + "</monthOfYear></trackDailyParam>";

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "monthRecordSearch", {channel: iChannelId * 100 + 1}, {
				async: false,
				data: szXml,
				success: function (status, xmlDoc) {
					$.each($(xmlDoc).find("day"), function () {
						if (_oUtils.nodeValue(this, "record", "b")) {
							iDayOfMonth = _oUtils.nodeValue(this, "dayOfMonth", "i");
							if ($(this).find("recordType").length > 0) {
								if ("time" == _oUtils.nodeValue(this, "recordType")) {
									self.m_arrSearchMonthArray[iRecordDateNum++] = self.m_iSearchYear + "-" + self.m_iSearchMonth + "-" + (iDayOfMonth < 10 ? "0" : "") + iDayOfMonth;
								} else if ("event" == _oUtils.nodeValue(this, "recordType")) {
									self.m_arrSearchMonthEventArray[iRecordEventDateNum++] = self.m_iSearchYear + "-" + self.m_iSearchMonth + "-" + (iDayOfMonth < 10 ? "0" : "") + iDayOfMonth;
								}
							} else {
								self.m_arrSearchMonthArray[iRecordDateNum++] = self.m_iSearchYear + "-" + self.m_iSearchMonth + "-" + (iDayOfMonth < 10 ? "0" : "") + iDayOfMonth;
							}
						}
					});
				}
			});

			self.createDatePicker();
		},
		// 日历上打标签
		createDatePicker: function () {
			var self = this,
				szLanguage = _oTranslator.szCurLanguage;

			if ("zh" === szLanguage) {
				szLanguage = "zh-cn";
			} else if ("zh_TW" === szLanguage) {
				szLanguage = "zh-tw";
			}

			WdatePicker({
				minDate: "1970-01-01 00:00:00",
				maxDate: "2037-12-31 23:59:59",
				eCont: "date_div",
				onpicked: function (dp) {
					self.getCalendarDate(dp);
				},
				lang: szLanguage,
				startDate: self.m_szCalendarDate
			});
		},
		// 日期改变时日历控件回调处理
		getCalendarDate: function (dp) {
			var self = this,
				iLastYear = self.m_iSearchYear,
				iLastMonth = self.m_iSearchMonth,
				iChannelId = _oChannel.m_iChannelId;

			self.m_szCalendarDate = dp.cal.getDateStr();
			self.m_iSearchYear = dp.cal.getP('y');
			self.m_iSearchMonth = dp.cal.getP('M');

			// 未选中通道时判断未定义
			if (angular.isUndefined(iChannelId)) {
				return;
			}

			if (iLastMonth != self.m_iSearchMonth || iLastYear != self.m_iSearchYear) {
				self.searchMonthRecordFile(iChannelId);
			}
			if (self.m_arrSearchMonthArray.length != 0) {
				dp["specialDates"] = self.m_arrSearchMonthArray;
				dp.cal.sdateRe = dp.cal._initRe("specialDates");
			} else {
				dp["specialDates"] = " ";
				dp.cal.sdateRe = dp.cal._initRe("specialDates");
			}
			if (self.m_arrSearchMonthEventArray.length != 0) {
				dp["sspecialDates"] = self.m_arrSearchMonthEventArray;
				dp.cal.ssdateRe = dp.cal._initRe("sspecialDates");
			} else {
				dp["sspecialDates"] = " ";
				dp.cal.ssdateRe = dp.cal._initRe("sspecialDates");
			}
		},
		// 搜索录像文件
		searchRecordFile: function (iType, szStartTime, szStopTime) {
			var self = this,
				dtStartTime = "",
				dtStopTime = "",
				iChannelId = _oChannel.m_iChannelId,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				oRecord = null;

			if (iType !== 1) {// 0：移动时间条触发搜索   2：点击通道名/查找按钮   1：协议返回MORE，继续搜索
			    if(iType === 2) {
					if (oWnd.bPlay || oWnd.bReversePlay) {
						_oDialog.tip(_oTranslator.getValue("stopCurrentWndPlay"));
						return;
					}
				}
				self.m_oSearchRecord = self.clearWndRecord(iWndIndex);
				self.m_oSearchRecord.iSearchType = iType;// 保存搜索方式
				oWnd.iChannelId = iChannelId;

				if (2 === iType) {
					if (arguments.length > 1) {
						self.m_szSearchDate = szStartTime.split(" ")[0];
						self.m_oSearchRecord.szWndMidTime = szStartTime;
					} else {
						self.m_szSearchDate = self.m_szCalendarDate;
						self.m_oSearchRecord.szWndMidTime = self.m_szSearchDate + " 00:00:00";
					}

					_oTimebar.setMidLineTime(self.m_oSearchRecord.szWndMidTime);
				}

				_oTimebar.setSelWndIndex(iWndIndex);
				_oTimebar.clearWndFileList(iWndIndex);
				_oTimebar.repaint();

				if (arguments.length > 1) {
					dtStartTime = szStartTime.replace(' ', 'T') + 'Z';
					dtStopTime = szStopTime.replace(' ', 'T') + 'Z';
				} else {
					dtStartTime = _oUtils.dayAdd((self.m_szSearchDate + " 00:00:00"), -1).replace(" ", "T") + "Z";
					dtStopTime = _oUtils.dayAdd((self.m_szSearchDate + " 23:59:59"), 1).replace(" ", "T") + "Z";
				}
				//时间转换
				dtStartTime = _oUtils.convertToUTCTime(dtStartTime);
				dtStopTime = _oUtils.convertToUTCTime(dtStopTime);
				var szXml = "<?xml version='1.0' encoding='utf-8'?>";
				szXml += "<CMSearchDescription>";
				szXml += "<searchID>" + new UUID() + "</searchID>";
				szXml += "<trackIDList><trackID>" + (iChannelId * 100 + 1) + "</trackID></trackIDList>";
				szXml += "<timeSpanList><timeSpan><startTime>" + dtStartTime + "</startTime><endTime>" + dtStopTime + "</endTime></timeSpan></timeSpanList>";
				szXml += "<maxResults>40</maxResults><searchResultPostion>0</searchResultPostion>";
				szXml += "<metadataList><metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor></metadataList>";
				szXml += "</CMSearchDescription>";

				self.m_oSearchXml = _oUtils.parseXmlFromStr(szXml);
			} else {
				if (null === self.m_oSearchXml) {
					return;
				}
				$(self.m_oSearchXml).find("searchResultPostion").eq(0).text(40 * self.m_iSearchTimes);
			}

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "recordSearch", null, {
				async: false,
				data: self.m_oSearchXml,
				success: function (status, xmlDoc) {
					if ("MORE" === $(xmlDoc).find("responseStatusStrg").eq(0).text()) {
						for (var i = 0, iLen = $(xmlDoc).find("searchMatchItem").length; i < iLen; i++) {
							var szPlaybackURI = $(xmlDoc).find("playbackURI").eq(i).text();
							if (szPlaybackURI.indexOf("name=") < 0) {
								self.m_bSupportDown = false;
								break;
							}
							var szStartTime = $(xmlDoc).find("startTime").eq(i).text();
							var szEndTime = $(xmlDoc).find("endTime").eq(i).text();
							szStartTime = _oUtils.convertToLocalTime(szStartTime, _oDevice.m_iDeviceMinusLocalTime);
							szEndTime = _oUtils.convertToLocalTime(szEndTime, _oDevice.m_iDeviceMinusLocalTime);
							$(xmlDoc).find("startTime").eq(i).text(szStartTime);
							$(xmlDoc).find("endTime").eq(i).text(szEndTime);

							oRecord = {};						
							oRecord.szStartTime = (szStartTime.replace("T", " ")).replace("Z", "");
							oRecord.szStopTime = (szEndTime.replace("T", " ")).replace("Z", "");
							oRecord.szPlaybackURI = szPlaybackURI;
							oRecord.szFileName = szPlaybackURI.substring(szPlaybackURI.indexOf("name=") + 5, szPlaybackURI.indexOf("&size="));
							oRecord.szFileSize = szPlaybackURI.substring(szPlaybackURI.indexOf("size=") + 5, szPlaybackURI.length);

							self.m_oSearchRecord.arrRecord.push(oRecord);
						}
						self.m_iSearchTimes++;
						_oTimebar.addFileToTimeBar(xmlDoc, iWndIndex);
						self.searchRecordFile(1);
					} else if ("OK" === $(xmlDoc).find("responseStatusStrg").eq(0).text()) {
						self.m_iSearchTimes = 0;
						self.m_oSearchXml = null;					

						for (var i = 0, iLen = $(xmlDoc).find("searchMatchItem").length; i < iLen; i++) {
							var szPlaybackURI = $(xmlDoc).find("playbackURI").eq(i).text();
							if (szPlaybackURI.indexOf("name=") < 0) {
								self.m_bSupportDown = false;
								break;
							}
							var szStartTime = $(xmlDoc).find("startTime").eq(i).text();
							var szEndTime = $(xmlDoc).find("endTime").eq(i).text();
							szStartTime = _oUtils.convertToLocalTime(szStartTime, _oDevice.m_iDeviceMinusLocalTime);
							szEndTime = _oUtils.convertToLocalTime(szEndTime, _oDevice.m_iDeviceMinusLocalTime);
							$(xmlDoc).find("startTime").eq(i).text(szStartTime);
							$(xmlDoc).find("endTime").eq(i).text(szEndTime);

							oRecord = {};			
							oRecord.szStartTime = (szStartTime.replace("T", " ")).replace("Z", "");
							oRecord.szStopTime = (szEndTime.replace("T", " ")).replace("Z", "");
							oRecord.szPlaybackURI = szPlaybackURI;
							oRecord.szFileName = szPlaybackURI.substring(szPlaybackURI.indexOf("name=") + 5, szPlaybackURI.indexOf("&size="));
							oRecord.szFileSize = szPlaybackURI.substring(szPlaybackURI.indexOf("size=") + 5, szPlaybackURI.length);

							self.m_oSearchRecord.arrRecord.push(oRecord);
						}

						self.m_oSearchRecord.bWndSearched = true;

						if (2 == self.m_oSearchRecord.iSearchType && self.m_oSearchRecord.arrRecord.length > 0) {
							$.each(self.m_oSearchRecord.arrRecord, function () {
								var szStartDate = this.szStartTime.split(" ")[0];
								var szStopDate = this.szStopTime.split(" ")[0];
								if (szStartDate === self.m_szSearchDate) {
									self.m_oSearchRecord.szWndMidTime = this.szStartTime;
									_oTimebar.setMidLineTime(self.m_oSearchRecord.szWndMidTime);
									return false;
								} else if (szStopDate === self.m_szSearchDate) {
									return false;
								}
							});
							
						}
						_oTimebar.addFileToTimeBar(xmlDoc, iWndIndex);
					} else if ("NO MATCHES" === $(xmlDoc).find("responseStatusStrg").eq(0).text()) {
						self.m_iSearchTimes = 0;
						self.m_oSearchXml = null;

						self.m_oSearchRecord.bWndSearched = true;  // 无录像文件也认为是搜索过

						setTimeout(function () {
							_oDialog.tip(_oTranslator.getValue("noRecordFiles"));
						}, 10);
					}
				},
				error: function (status, xmlDoc) {
					self.m_iSearchTimes = 0;
					self.m_oSearchXml = null;

					if (403 === status) {
						_oDialog.tip(_oTranslator.getValue("noPermission"));
					} else {
						/*that.m_bWndSearched[that.m_iCurWnd] = false;
						 if(that.m_DownWindow[that.m_iCurWnd] && that.m_DownWindow[that.m_iCurWnd].open && !that.m_DownWindow[that.m_iCurWnd].closed) {
						 that.m_DownWindow[that.m_iCurWnd].g_oDownloadInstance.fileLoad();
						 }*/
						_oDialog.tip(_oTranslator.getValue("searchRecordFailed"));
					}
				}
			});
		},
		// 根据窗口索引获取录像集合
		getWndRecord: function (iWndIndex) {
			var self = this,
				arrRecord = null;

			$.each(self.m_arrSearchRecord, function () {
				if (this.iWndIndex == iWndIndex) {
					arrRecord = this.arrRecord;
					return false;
				}
			});

			return arrRecord;
		},
		// 根据窗口索引清空录像集合，返回搜索录像对象
		clearWndRecord: function (iWndIndex) {
			var self = this,
				oSearchRecord = null;

			oSearchRecord = self.getSearchRecord(iWndIndex);
			if (oSearchRecord != null) {
				oSearchRecord.arrRecord.splice(0, oSearchRecord.arrRecord.length);
			} else {
				oSearchRecord = {
					iWndIndex: iWndIndex,
					bWndSearched: false,
					szWndMidTime: "",
					arrRecord: [],
					iSearchType: 2
				};
				self.m_arrSearchRecord.push(oSearchRecord);
			}

			return oSearchRecord;
		},
		// 根据窗口索引获取搜索录像对象
		getSearchRecord: function (iWndIndex) {
			var self = this,
				oSearchRecord = null;

			$.each(self.m_arrSearchRecord, function () {
				if (this.iWndIndex == iWndIndex) {
					oSearchRecord = this;
					return false;
				}
			});

			return oSearchRecord;
		},
		// 根据窗口索引获取录像集合中最后一个录像的结束时间(前端播放最后一段录像时，必须结束时间为该录像的结束时间，否则跳转时间会不对)
		getStopTime: function (iWndIndex) {
			var self = this,
				szStopTime = '',
				oSearchRecord = null;

			oSearchRecord = self.getSearchRecord(iWndIndex);
			if (oSearchRecord != null) {
				var iLen = oSearchRecord.arrRecord.length;
				if (iLen > 0) {
					var oRecord = oSearchRecord.arrRecord[iLen-1];
					szStopTime = oRecord.szStopTime;
				}
			}

			return szStopTime;
		}
	};

	module.exports = new Search();
});
