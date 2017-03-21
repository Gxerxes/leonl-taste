define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oDialog, _oUtils, _oHeader, _oChannel, _oPlugin, _oTool, _oSearch, _oTimebar, _oService, _oDevice, _oStatusScope;
	var _iCaptureFileFormat, _szCapturePath, _szClipPath;

	$ = require("jquery");
	require("timebar");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oDialog = require("dialog");
	_oUtils = require("utils");

	_oHeader = require("common/header");
	_oTool = require("common/tool");
	_oChannel = require("common/channel");
	_oPlugin = require("common/plugin");
	_oSearch = require("playback/search");
	_oTimebar = require("playback/timebar");

	_oService = require("service");
	_oDevice = require("isapi/device");

	var _szInitSearchTime = "";  //初始搜索的时间

	function Playback() {
		this.m_iTranscodingResolution = 255;
		this.m_iTranscodingBitrate = 23;
		this.m_iTranscodingFrame = 0;
		this.m_bDiskFreeSpaceEnough = true;	// 磁盘空间是否足够
		this.m_iOSDTimer = 0;						// 获取OSD定时器
		this.wDownloadWnd = null; 				// 下载窗口

		_iCaptureFileFormat = 0;					// 默认jpg格式
		_szCapturePath = "";						// 抓图路径
		_szClipPath = "";							// 录像路径
	}
	
	Playback.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

            var oLanPlayback = _oTranslator.getLanguage("Playback");
            _oTranslator.appendLanguage(oLanPlayback, _oCommon.m_oLanCommon);

            document.title = _oTranslator.getValue("playback");

			// 转码-分辨率 根据能力初始化默认值
			if (angular.isDefined(_oDevice.m_oSHttpCapa.aTransCodeResolution)) {
				self.m_iTranscodingResolution = _oDevice.m_oSHttpCapa.aTransCodeResolution[0];
			}

			self.initLayout();
			self.initController();

			// 默认选中第一个通道
			self.checkLoaded();
		},
		// 页面卸载处理
		unload: function () {
			var self = this;

			try {
				_oPlugin.stopRealPlayAll();
			} catch (e) {}

			if (self.wDownloadWnd && self.wDownloadWnd.open && !self.wDownloadWnd.closed) {
				self.wDownloadWnd.close();
			}
		},
		// 检查模块是否都加载完毕
		checkLoaded: function () {
			var self = this;
			setTimeout(function () {
				if (_oService.m_oLoaded.bChannel && _oService.m_oLoaded.bSearch && _oService.m_oLoaded.bTimebar) {
					var szPathInfo = _oPlugin.getLocalConfig(),
						oXmlDoc = _oUtils.parseXmlFromStr(szPathInfo);

					// 抓图文件格式
					if ($(oXmlDoc).find("CaptureFileFormat").length > 0) {
						_iCaptureFileFormat = _oUtils.nodeValue(oXmlDoc, "CaptureFileFormat", "i");
					}
					// 抓图、剪辑路径
					_szCapturePath = _oUtils.nodeValue(oXmlDoc, "PlaybackPicPath");
					_szClipPath = _oUtils.nodeValue(oXmlDoc, "PlaybackFilePath");

					// 默认选中通道
					var szUrl = decodeURI(document.URL);
					if(szUrl.indexOf("?") != -1){
						var szStartTime = _oUtils.getURIParam("start", szUrl);
						var szStopTime = _oUtils.getURIParam("stop", szUrl);
						if (szStartTime !== "" && szStopTime !== "") {
							szStartTime = szStartTime.substring(0, 4) + "-" + szStartTime.substring(4, 6) + "-" + szStartTime.substring(6, 8) + " " + szStartTime.substring(8, 10) + ":" + szStartTime.substring(10, 12) + ":" + szStartTime.substring(12, 14);
							szStopTime = szStopTime.substring(0, 4) + "-" + szStopTime.substring(4, 6) + "-" + szStopTime.substring(6, 8) + " " + szStopTime.substring(8, 10) + ":" + szStopTime.substring(10, 12) + ":" + szStopTime.substring(12, 14);
							_szInitSearchTime = szStartTime + "&" + szStopTime;
						}
						var szOpenChan = _oUtils.getURIParam("chan", szUrl);
						if (szOpenChan !== "") {
							_oChannel.select(parseInt(szOpenChan, 10) - 1);
							return;
						}
					}
					_oChannel.select(0);
				} else {
					self.checkLoaded();
				}
			}, 10);
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
					size: 40
				},
				west: {
					paneSelector: ".layout-west",
					size: _oService.isSingleChannel() ? 15 : 200,
					onresize_end: function () {
						_oChannel.resize();
					}
				},
				center: {
					paneSelector: ".layout-center",
					childOptions: {
						defaults: {
							spacing_open: 0
						},
						north: {
							paneSelector: ".layout-north-inner",
							size: 35
						},
						center: {
							paneSelector: ".layout-center-inner",
							onresize_end: function () {
								_oTool.hideSound();
							}
						},
						south: {
							paneSelector: ".layout-south-inner",
							size: 40
						}
					}
				},
				east: {
					paneSelector: ".layout-east",
					size: 220,
					spacing_open: 10,
					spacing_closed: 10
				},
				south: {
					paneSelector: ".layout-south",
					size: 122,
					onresize_end: function () {
						_oTimebar.resize();
					}
				}
			};

			$("body").layout(layoutSettings);
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("statusApp", []).controller("statusController", function ($scope) {
				var szSpeed = _oTranslator.getValue("speed");

				_oStatusScope = $scope;

				$scope.oLanStatus = _oTranslator.oLastLanguage;

				$scope.oStatus = {
					szChannelNo: "",
					szCurrentStatus: ""
				};

				$scope.updateStatus = function () {
					var iWndIndex = _oService.m_iWndIndex,
						oWnd = _oService.m_aWndList[iWndIndex];

					if (oWnd.iChannelId > 0) {
						this.oStatus.szChannelNo = oWnd.iChannelId;
					} else {
						this.oStatus.szChannelNo = "";
					}
					if (oWnd.bFrame) {
						this.oStatus.szCurrentStatus = _oTranslator.getValue("singleFramePlayback");
					} else {
						if (oWnd.bPlay || oWnd.bReversePlay) {
							if (oWnd.bPause) {
								this.oStatus.szCurrentStatus = _oTranslator.getValue("paused");
							} else {
								if (oWnd.iSpeed < 1) {// 回放倍数小于1，使用分数表示
									this.oStatus.szCurrentStatus = "1/" + (1 / oWnd.iSpeed) + szSpeed;
								} else {
									this.oStatus.szCurrentStatus = oWnd.iSpeed + szSpeed;
								}
							}
						} else {
							this.oStatus.szCurrentStatus = "";
						}
					}

					this.$apply();
				};
			});
			angular.bootstrap(angular.element("#status"), ["statusApp"]);

			_oHeader.init("header", 1);

			_oChannel.init("channel", "playback", {
				onSelected: function (iChannelIndex) {
					self.selectedChannel(iChannelIndex);
				}
			});

			_oTool.init("tool", "playback", {
				onPlay: function () {
					self.startPlayback();
				},
				onReversePlay: function () {
					self.startReversePlayback();
				},
				onStop: function () {
					self.stopPlayback();
				},
				onSlow: function () {
					self.slow();
				},
				onFast: function () {
					self.fast();
				},
				onFrame: function () {
					self.frame();
				},
				onStopAll: function () {
					self.stopAll();
				},
				onCapture: function () {
					self.capture();
				},
				onEnableEzoom: function () {
					self.enableEzoom();
				},
				onRecord: function () {
					self.startClip();
				},
				onOpenTransCode: function () {
					return self.openTransCode();
				},
				onChangeTransCode: function (iTransCodeResolution, iTransCodeBitrate, iTransCodeFrame) {
					self.changeTransCode(iTransCodeResolution, iTransCodeBitrate, iTransCodeFrame);
				},
				onOpenDownload: function () {
					self.openDownload();
				}
			});

			_oSearch.init("search", {
				onGotoTime: function (szHour, szMinute, szSecond) {
					self.gotoTime(szHour, szMinute, szSecond);
				}
			});

			_oPlugin.init("plugin", _oService.m_iWndSplitMode, {
				onGetSelectWndInfo: function (iWndIndex) {
					self.getSelectWndInfo(iWndIndex);
				},
				onPluginEventHandler: function (iEventType, iWndIndex, iParam2) {
					self.pluginEventHandler(iEventType, iWndIndex, iParam2);
				}
			});

			_oTimebar.init("timebar", {
				onTimebarMouseUp: function (szMidTime) {
					self.timebarMouseUp(szMidTime);
				}
			});
		},
		// 选中窗口
		getSelectWndInfo: function (iWndIndex) {
			var self = this,
				oWnd = _oService.m_aWndList[iWndIndex],
				oSearchRecord = _oSearch.getSearchRecord(iWndIndex);

			clearTimeout(self.m_iOSDTimer);
			self.m_iOSDTimer = 0;

			if (oWnd.bPlay) {
				if (!oWnd.bPause && !oWnd.bFrame) {// 当前为回放状态
					self.getOSDTime(iWndIndex);
				} else {
					if(oWnd.bPause && !oWnd.bFrame)  {// 当前为暂停状态

					} else  {// 当前为单帧放状态
						oWnd.iSpeed = 1;
					}
					_oTimebar.setMidLineTime(oSearchRecord.szWndMidTime);
				}
			} else if (oWnd.bReversePlay) {
				if (!oWnd.bPause) {
					self.getOSDTime(iWndIndex);
				} else {
					_oTimebar.setMidLineTime(oSearchRecord.szWndMidTime);
				}
			} else {
				// do nothing
			}

			_oChannel.m_iChannelId = oWnd.iChannelId;
			_oChannel.switchChannel();// 切换通道变色
			if (_oChannel.m_iChannelId > -1) {
				// 搜索该通道月历信息
				_oSearch.searchMonthRecordFile();
			}

			if (_oTimebar !== null) {
				_oTimebar.setSelWndIndex(_oService.m_iWndIndex);
				_oTimebar.repaint();
				if (oSearchRecord && oSearchRecord.szWndMidTime != "" && !oWnd.bPlay) {
					_oTimebar.setSpanType();
					_oTimebar.setMidLineTime(oSearchRecord.szWndMidTime);
				}
			}

			// 更新状态栏
			_oStatusScope.updateStatus();

			_oTool.hideSound();
			_oTool.update();
		},
		// 插件事件异步回调
		pluginEventHandler: function (iEventType, iWndIndex, iParam2) {
			var self = this;

			if (0 === iEventType || 2 === iEventType) {// 0:异常结束 2:正常结束
				if (0 === iEventType) {
					self.getOSDTime(iWndIndex);
				}
				if (iWndIndex === _oService.m_iWndIndex) {
					self.stopPlayback();
				} else {
					_oPlugin.stop(iWndIndex);

					var oWnd = _oService.m_aWndList[iWndIndex];
					oWnd.bPlay = false;
					oWnd.bReversePlay = false;
					oWnd.bRecord = false;
					oWnd.bFrame = false;
					oWnd.bPause = false;
					oWnd.bTranscoding = false;
					oWnd.iSpeed = 1;
					oWnd.bEzoom = false;

					if (_oService.m_oWndParams.iSoundWndIndex == iWndIndex) {
						_oService.m_oWndParams.iSoundWndIndex = -1;
					}
				}
				var szTip = _oTranslator.getValue("camera") + " " + _oService.m_aChannelList[iWndIndex].iId + " ";
				if (0 === iEventType) {
					szTip += _oTranslator.getValue("playbackFinishedAbnormal");
				} else if (2 === iEventType) {
					szTip += _oTranslator.getValue("playbackFinished");
				}
				setTimeout(function () {// 在剪辑成功提示1秒后提示，防止两个提示间隔太少，第一个看不见
					_oDialog.tip(szTip);
				}, 1000);
			} else if (21 === iEventType) {// 空间不足
				if (iWndIndex === _oService.m_iWndIndex) {
					self.stopClip(iWndIndex);
				} else {
					var oWnd = _oService.m_aWndList[iWndIndex];
					oWnd.bRecord = false;
				}
				if (self.m_bDiskFreeSpaceEnough) {
					setTimeout(function () {// 在剪辑成功提示1秒后提示，防止两个提示间隔太少，第一个看不见
						_oDialog.tip(_oTranslator.getValue("noEnoughSpace"));
					}, 1000);					
					self.m_bDiskFreeSpaceEnough = false;
				}
			}

			_oTool.update();
		},
		// 选中通道
		selectedChannel: function (iChannelIndex) {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			/*
			var iTotal = g_oCommon.m_iAnalogChannelNum + g_oCommon.m_iDigitalChannelNum;
			if(iTotal < 1) {
				return;
			}*/

			if (oWnd.bPlay || oWnd.bReversePlay) {
				_oDialog.tip(_oTranslator.getValue("stopCurrentWndPlay"));
				return;
			}
			_oSearch.searchMonthRecordFile();
			if (_szInitSearchTime !== "") {
				_oSearch.searchRecordFile(2, _szInitSearchTime.split("&")[0], _szInitSearchTime.split("&")[1]);
				_szInitSearchTime = "";
			} else {
				_oSearch.searchRecordFile(2);
			}

			// 保存通道索引
			oWnd.iChannelPlayIndex = iChannelIndex;

			// 更新状态栏
			_oStatusScope.updateStatus();

			/*if (that.m_iCurSelChannel === -1) {
				if(iType === 2) {
			 		alert(parent.translator.translateNode(that.m_lxdPlayback, "selectOneChannel"));
			 	}
				return;
			}
			*/
		},
		// 开始回放、暂停回放
		startPlayback: function (szStopTime) {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				oSearchRecord = _oSearch.getSearchRecord(iWndIndex);

			if (null == oSearchRecord || !oSearchRecord.bWndSearched) {
				_oDialog.tip(_oTranslator.getValue("searchFileFirst"));
				return;
			}

			if (!oWnd.bPlay) { // 没有回放
				if (oWnd.bReversePlay) { // 处于倒放中
					self.stopPlayback();
				}

				var date1, date2;
				date1 = new Date(Date.parse(_oTimebar.getPlayBackTime().replace(/\-/g, "/")));

				if (arguments.length > 0) {
					date2 = new Date(Date.parse(szStopTime.replace(/\-/g, "/")));
				} else {
					var szTmp = _oSearch.getStopTime(iWndIndex);  //获取当前回放窗口，最后一个录像文件结束时间。
					if (szTmp) {  //前端采用回放录像最后一个文件结束时间
						date2 = new Date(Date.parse(szTmp.replace(/\-/g, "/")));
					} else {
						date2 =  new Date(Date.parse(_oUtils.dayAdd((_oSearch.m_szSearchDate + " 23:59:59"), 1).replace(/\-/g, "/")));
					}
				}

				if (date1.getTime() >= date2.getTime()) {
					_oDialog.tip(_oTranslator.getValue("searchFileFirst"));
					return;
				}

				var szStartTime = _oUtils.dateFormat(date1, "yyyyMMddThhmmssZ"), // 当前时间轴时间
					szStopTime = _oUtils.dateFormat(date2, "yyyyMMddThhmmssZ"), // 时间轴后一天的23:59:59
					szPathInfo = "",
					oXmlDoc = null,
					iProtocolType = -1;

				szPathInfo = _oPlugin.getLocalConfig();
				oXmlDoc = _oUtils.parseXmlFromStr(szPathInfo);
				iProtocolType = _oUtils.nodeValue(oXmlDoc, "ProtocolType", "i");
                if (0 == seajs.iDeviceType) {  //是否是后端设备                    
                    if (4 == iProtocolType) { // 本地配置去掉HTTP选项
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
				szProtocol = "http://";
				if (_oDevice.m_oSHttpCapa.bSupportShttpPlayback && 0 == iProtocolType || _oService.m_bChromeNotSupportNpapi) {
					if (oWnd.iChannelId <= _oService.m_iAnalogChNum) {
						szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort + "/SDK/playback/" + oWnd.iChannelId;
					} else {
						var iDigitalChanId = _oDevice.m_oSHttpCapa.iIpChanBase + oWnd.iChannelId - _oService.m_iAnalogChNum - 1;
						szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort + "/SDK/playback/" + iDigitalChanId;
					}
				} else {
					if (seajs.iDeviceType) {
						date1.setTime(date1.getTime() - _oDevice.m_iDeviceMinusLocalTime);
						szStartTime = _oUtils.utcDateFormat(date1, "yyyy-MM-dd hh:mm:ss").replace(" ", "T") + "Z"; 		//当前时间轴时间
						szStartTime = szStartTime.replace(/\-/g, '').replace(/:/g, '');
						date2.setTime(date2.getTime() - _oDevice.m_iDeviceMinusLocalTime);
						szStopTime = _oUtils.utcDateFormat(date2, "yyyy-MM-dd hh:mm:ss").replace(" ", "T") + "Z"; 		//时间轴后一天的23:59:59
						szStopTime = szStopTime.replace(/\-/g, '').replace(/:/g, '');
					}

					if (4 === iProtocolType) {
						szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + iPort + "/ISAPI/streaming/tracks/" + (oWnd.iChannelId * 100 + 1);					
					} else {
						szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iRtspPort + "/ISAPI/streaming/tracks/" + (oWnd.iChannelId * 100 + 1);
					}
					szUrl += "?starttime=" + szStartTime + "&endtime=" + szStopTime;
				}
				/*if (_oDevice.m_oDeviceInfo.szDeviceType.toLowerCase() === "ivms-4200 pcnvr") {
					szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iRtspPort + "/vod/0/0/pcnvr/sdk;dvrhp=" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iManagePort + ";chan=" + oWnd.iChannelId + ";range=" + (date1.getTime()/1000) + ":" + (date2.getTime()/1000);
				}*/

				if (oWnd.bTranscoding) {
					if (oWnd.iChannelId <= _oService.m_iAnalogChNum) {
						szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort + "/SDK/playback/" + oWnd.iChannelId + "/transcoding";
					} else {
						var iDigitalChanId = _oDevice.m_oSHttpCapa.iIpChanBase + oWnd.iChannelId - _oService.m_iAnalogChNum - 1;
						szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort + "/SDK/playback/" + iDigitalChanId + "/transcoding";
					}
					var szTranscodingXml = "<?xml version='1.0' encoding='UTF-8'?><CompressionInfo><TransFrameRate>" + self.m_iTranscodingFrame + "</TransFrameRate>";
					szTranscodingXml += "<TransResolution>" + self.m_iTranscodingResolution + "</TransResolution><TransBitrate>" + self.m_iTranscodingBitrate + "</TransBitrate></CompressionInfo>";
					if (_oPlugin.setTrsPlayBackParam(_oService.m_iWndIndex, szTranscodingXml) !== 0) {
						return;
					}
				}
				if (0 === _oPlugin.play(szUrl, _oCommon.m_szPluginNamePwd, iWndIndex, szStartTime, szStopTime)) {
					oWnd.bPlay = true;
					self.updateChannelIcon();

					self.getOSDTime(iWndIndex);
				} else {
					_oDialog.tip(_oTranslator.getValue("startPlaybackFailed"));
				}
			} else {// 回放中
				if (!oWnd.bPause && !oWnd.bFrame) {// 当前为回放状态
					if (0 === _oPlugin.pause(iWndIndex)) {
						clearTimeout(self.m_iOSDTimer);
						self.m_iOSDTimer = 0;

						oWnd.bPause = true;

						// 记住当前窗口的时间轴时间
						oSearchRecord.szWndMidTime = _oTimebar.getPlayBackTime();
					} else {
						_oDialog.tip(_oTranslator.getValue("pauseFailed"));
					}
				} else {
					if (oWnd.bPause && !oWnd.bFrame) {// 当前为暂停状态
						if (0 === _oPlugin.resume(iWndIndex)) {
							self.getOSDTime(iWndIndex);

							oWnd.bPause = false;
							oWnd.bFrame = false;
						} else {
							_oDialog.tip(_oTranslator.getValue("resumeFailed"));
						}
					} else {// 当前为单帧放状态
						if (0 === _oPlugin.resume(iWndIndex)) {
							self.getOSDTime(iWndIndex);

							oWnd.bPause = false;
							oWnd.bFrame = false;

							if (oWnd.iSpeed > 1 && oWnd.bPlay) {
								for (var i = 1; i < oWnd.iSpeed;  i = i * 2) {
									if (0 == _oPlugin.fast(iWndIndex)) {
										oWnd.bFrame = false;
									}
								}
							} else if (oWnd.iSpeed < 1 && oWnd.bPlay) {
								for (var i = 1; i > oWnd.iSpeed; i = i / 2) {
									if (0 == _oPlugin.slow(iWndIndex)) {
										oWnd.bFrame = false;
									}
								}
							}
						} else {
							_oDialog.tip(_oTranslator.getValue("resumeFailed"));
						}
					}
				}
			}

			// 更新状态栏
			_oStatusScope.updateStatus();
		},
		//  开始倒放、暂停倒放
		startReversePlayback: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				oSearchRecord = _oSearch.getSearchRecord(iWndIndex);

			if (null == oSearchRecord || !oSearchRecord.bWndSearched) {
				_oDialog.tip(_oTranslator.getValue("searchFileFirst"));
				return;
			}

			if (!oWnd.bReversePlay) {// 没有倒放
				if (oWnd.bTranscoding) {// 启用转码，不能倒放
					return;
				}
				if (oWnd.bPlay) { // 处于回放中
					self.stopPlayback();
				}

				var date1, date2;
				date1 = new Date(Date.parse(_oTimebar.getPlayBackTime().replace(/\-/g, "/")));
				date2 =  new Date(Date.parse(_oUtils.dayAdd((_oSearch.m_szSearchDate + " 00:00:00"), -1).replace(/\-/g, "/")));  //倒放目前后端支持，不用像前端正放一样给出最后一个录像的截止时间

				var szStopTime = _oUtils.dateFormat(date1, "yyyyMMddThhmmssZ"), // 当前时间轴时间
					szStartTime = _oUtils.dateFormat(date2, "yyyyMMddThhmmssZ"), // 时间轴前一天的00:00:00
					szPathInfo = "",
					oXmlDoc = null,
					iProtocolType = -1;

				szPathInfo = _oPlugin.getLocalConfig();
				oXmlDoc = _oUtils.parseXmlFromStr(szPathInfo);
                iProtocolType = parseInt($(oXmlDoc).find("ProtocolType").eq(0).text(), 10);
                if (0 == seajs.iDeviceType) {  //是否是后端设备
                    if (4 == iProtocolType) { // 本地配置去掉HTTP选项后，要判断非2就置0
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
				szProtocol = "http://";

				if (_oDevice.m_oSHttpCapa.bSupportShttpPlayback && 0 == iProtocolType) {// 私有回放
					if (oWnd.iChannelId <= _oService.m_iAnalogChNum) {
						szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort + "/SDK/playback/" + oWnd.iChannelId + "/reversePlay";
					} else {
						var iDigitalChanId = _oDevice.m_oSHttpCapa.iIpChanBase + oWnd.iChannelId - _oService.m_iAnalogChNum - 1 + "/reversePlay";
						szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort + "/SDK/playback/" + iDigitalChanId;
					}
				} else {
					if (seajs.iDeviceType) {
						date1.setTime(date1.getTime() - _oDevice.m_iDeviceMinusLocalTime);
						szStopTime = _oUtils.utcDateFormat(date1, "yyyy-MM-dd hh:mm:ss").replace(" ", "T") + "Z"; 		//当前时间轴时间
						szStopTime = szStopTime.replace(/\-/g, '').replace(/:/g, '');
						date2.setTime(date2.getTime() - _oDevice.m_iDeviceMinusLocalTime);
						szStartTime = _oUtils.utcDateFormat(date2, "yyyy-MM-dd hh:mm:ss").replace(" ", "T") + "Z"; 		//时间轴后一天的23:59:59
						szStartTime = szStartTime.replace(/\-/g, '').replace(/:/g, '');
					}
					if (4 === iProtocolType) {
						szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + iPort + "/ISAPI/streaming/tracks/" + (oWnd.iChannelId * 100 + 1);					
					} else {
						szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iRtspPort + "/ISAPI/streaming/tracks/" + (oWnd.iChannelId * 100 + 1);
					}
					szUrl += "?starttime=" + szStartTime + "&endtime=" + szStopTime;
				}
				/*if (_oDevice.m_oDeviceInfo.szDeviceType.toLowerCase() === "ivms-4200 pcnvr") {
					szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iRtspPort + "/vod/0/0/pcnvr/sdk;dvrhp=" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iManagePort + ";chan=" + oWnd.iChannelId + ";range=" + (date1.getTime()/1000) + ":" + (date2.getTime()/1000);
				}*/

				if (0 === _oPlugin.reversePlay(szUrl, _oCommon.m_szPluginNamePwd, iWndIndex, szStartTime, szStopTime)) {
					oWnd.bReversePlay = true;
					self.updateChannelIcon();

					self.getOSDTime(iWndIndex);
				} else {
					_oDialog.tip(_oTranslator.getValue("startPlaybackFailed"));
				}
			} else if (!oWnd.bPause) {// 倒放中
				if (0 == _oPlugin.pause(iWndIndex)) {
					clearTimeout(self.m_iOSDTimer);
					self.m_iOSDTimer = 0;

					oWnd.bPause = true;

					//记住当前窗口的时间轴时间
					oSearchRecord.szWndMidTime = _oTimebar.getPlayBackTime();
				} else {
					_oDialog.tip(_oTranslator.getValue("pauseFailed"));
				}
			} else if (oWnd.bPause) {// 当前为暂停状态
				if (0 === _oPlugin.resume(iWndIndex)) {
					self.getOSDTime(iWndIndex);

					oWnd.bPause = false;
				} else {
					_oDialog.tip(_oTranslator.getValue("resumeFailed"));
				}
			}

			// 更新状态栏
			_oStatusScope.updateStatus();
		},
		// 停止回放
		stopPlayback: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				oSearchRecord = null;

			if (oWnd.bPlay || oWnd.bReversePlay) {// 播放、倒放
				if (oWnd.bRecord) {// 如果在剪辑，先停止
					if (0 === _oPlugin.stopSave(iWndIndex)) {
						oWnd.bRecord = false;
						_oDialog.tip(_oTranslator.getValue("clipSucceeded"));
					} else {
						_oDialog.tip(_oTranslator.getValue("stopClipFailed"));
						return;
					}
				}

				if (_oService.m_oWndParams.iSoundWndIndex == iWndIndex) {// 如果窗口打开着声音，则关闭声音
					if (0 == _oPlugin.closeSound()) {
						_oService.m_oWndParams.iSoundWndIndex = -1;
					}
				}

				if (0 == _oPlugin.stop(iWndIndex)) {
					oWnd.bReversePlay = false;
					oWnd.bFrame = false;
					oWnd.bPause = false;
					oWnd.bPlay = false;
					oWnd.bTranscoding = false;
					oWnd.iSpeed = 1;
					oWnd.bEzoom = false;

					self.updateChannelIcon();

					clearTimeout(self.m_iOSDTimer);// 关闭OSD获取的定时器
					self.m_iOSDTimer = 0;

					// 记住当前窗口的时间轴时间
					oSearchRecord = _oSearch.getSearchRecord(iWndIndex);
					oSearchRecord.szWndMidTime = _oTimebar.getPlayBackTime();
				} else {
					_oDialog.tip(_oTranslator.getValue("stopPlaybackFailed"));
				}
			}

			// 更新状态栏
			_oStatusScope.updateStatus();
		},
		// 减速
		slow: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			if (oWnd.bPlay && !oWnd.bPause && !oWnd.bFrame) {
				if (0 == _oPlugin.slow(iWndIndex)) {
					oWnd.bFrame = false;
					if (oWnd.iSpeed > 1/4) {
						oWnd.iSpeed = 1/2 * oWnd.iSpeed;
					}
					// 更新状态栏
					_oStatusScope.updateStatus();
				}
			}

		},
		// 加速
		fast: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			if (oWnd.bPlay && !oWnd.bPause && !oWnd.bFrame) {
				if (0 == _oPlugin.fast(iWndIndex)) {
					oWnd.bFrame = false;
					if (oWnd.iSpeed < 4) {
						oWnd.iSpeed = 2 * oWnd.iSpeed;
					}
					// 更新状态栏
					_oStatusScope.updateStatus();
				}
			}
		},
		// 单帧
		frame: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				oSearchRecord = _oSearch.getSearchRecord(iWndIndex);

			if (oWnd.bPlay && !oWnd.bPause) {
				if (0 === _oPlugin.frame(iWndIndex)) {
					oWnd.bFrame = true;

					// 记住当前窗口的时间轴时间
					oSearchRecord.szWndMidTime = _oTimebar.getPlayBackTime();
				} else {
					_oDialog.tip(_oTranslator.getValue("frameFailed"));
				}

				// 更新状态栏
				_oStatusScope.updateStatus();
			}
		},
		// 停止所有回放
		stopAll: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				oSearchRecord = _oSearch.getSearchRecord(iWndIndex);

			if (oWnd.bRecord) {
				_oDialog.tip(_oTranslator.getValue("clipSucceeded"));
			}
			if (_oService.m_oWndParams.iSoundWndIndex > -1) {
				_oService.m_oWndParams.iSoundWndIndex = -1;
			}
			_oPlugin.stopRealPlayAll();
			$.each(_oService.m_aWndList, function () {
				if (this.bPlay || this.bReversePlay) {// 回放、倒放
					_oService.m_aChannelList[this.iChannelPlayIndex].bPlay = false;
				}

				this.bPlay = false;
				this.bPause = false;
				this.iSpeed = 1;
				this.bReversePlay = false;
				this.bTranscoding = false;
				this.bRecord = false;
				this.bFrame = false;
			});

			clearTimeout(self.m_iOSDTimer);
			self.m_iOSDTimer = 0;

			// 记住当前窗口的时间轴时间
			if (oSearchRecord) {
				oSearchRecord.szWndMidTime = _oTimebar.getPlayBackTime();
			}

			_oStatusScope.updateStatus();
			_oChannel.update();
		},
		// 抓图
		capture: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				oSearchRecord = _oSearch.getSearchRecord(iWndIndex);

			if (oWnd.bPlay || oWnd.bReversePlay) {
				var oDate = new Date(),
					szFilePath = "",
					szFileName = "",
					szHostName = "";

				if (_oCommon.m_szHostName.indexOf("[") < 0) {
					szHostName = _oCommon.m_szHostName;
				} else {
					szHostName = _oCommon.m_szHostName.substring(1, _oCommon.m_szHostName.length - 1).replace(/:/g, ".");
				}
				if (oWnd.iChannelId <= 9) {
					szFileName = szHostName + "_0" + oWnd.iChannelId + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
				} else {
					szFileName = szHostName + "_" + oWnd.iChannelId + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
				}
				szFilePath = _szCapturePath + "\\" + _oUtils.dateFormat(oDate, "yyyy-MM-dd") + "\\" + szFileName + (_iCaptureFileFormat == 1 ? ".bmp" : ".jpg");
				szFileName = szFileName + (_iCaptureFileFormat == 1 ? ".bmp" : "");
				var iRes = _oPlugin.capture(iWndIndex, szFileName);
				if (0 === iRes) {
					if(_oService.m_bChromeNotSupportNpapi) {
						_oDialog.tip();
						var $video = $("video").eq(iWndIndex).get(0);
						var $output = $(".aui_content");
						var scale = 1;
						var canvas = document.createElement("canvas");
						canvas.width = $video.videoWidth * scale;
						canvas.height = $video.videoHeight * scale;
						canvas.getContext('2d').drawImage($video, 0, 0, canvas.width, canvas.height);
						var img = document.createElement("img");
						img.width=190;
						img.height=90;
						var szPicUrl = canvas.toDataURL();
						img.src = szPicUrl;
						$output.prepend(img);

						var link = window.document.createElement('a');
						link.href = szPicUrl;
						link.download = szFileName + ".png";
						var click = document.createEvent("Event");
						click.initEvent("click", true, true);
						link.dispatchEvent(click);
					} else {
						var szDir = _szCapturePath + "\\" + _oUtils.dateFormat(oDate, "yyyy-MM-dd");
						_oDialog.tip(_oTranslator.getValue("captureSucceeded") + "<p id='openDirectory' class='dir pointer'>" + szFilePath + "</a></p>");
						$("#openDirectory").click(function () {
							_oPlugin.openDirectory(szDir);
						});
					}
				} else if (-1 === iRes) {
					var iError = _oPlugin.getLastError();
					if (10 === iError || 9 === iError) {
						_oDialog.tip(_oTranslator.getValue("createFileFailed"));
					} else {
						_oDialog.tip(_oTranslator.getValue("captureFailed"));
					}
				} else if (-2 === iRes) {
					_oDialog.tip(_oTranslator.getValue("noEnoughSpace"));
				} else if (-3 === iRes) {
					_oDialog.tip(_oTranslator.getValue("createFileFailed"));
				}
			}
		},
		//电子放大
		enableEzoom: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			if (oWnd.bEzoom) {
				if (0 === _oPlugin.disableEzoom(iWndIndex)) {
					oWnd.bEzoom = false;
				}
			} else {
				if (0 === _oPlugin.enableEzoom(iWndIndex, 0)) {
					oWnd.bEzoom = true;
				}
			}
		},
		// 开始剪辑
		startClip: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			if (oWnd.bRecord) {// 正在剪辑，停止剪辑
				self.stopClip(iWndIndex);
			} else {// 开始剪辑
				var oDate = new Date(),
					szFileName = "",
					szHostName = "";

				if (_oCommon.m_szHostName.indexOf("[") < 0) {
					szHostName = _oCommon.m_szHostName;
				} else {
					szHostName = _oCommon.m_szHostName.substring(1, _oCommon.m_szHostName.length - 1).replace(/:/g, ".");
				}
				if (oWnd.iChannelId <= 9) {
					szFileName = szHostName + "_0" + oWnd.iChannelId + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
				} else {
					szFileName = szHostName + "_" + oWnd.iChannelId + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
				}
				// 保存剪辑文件路径和剪辑文件目录
				oWnd.szFilePath = _szClipPath + "\\" + _oUtils.dateFormat(oDate, "yyyy-MM-dd") + "\\" + szFileName + ".mp4";
				oWnd.szDir = _szClipPath + "\\" + _oUtils.dateFormat(oDate, "yyyy-MM-dd");
				var iRes = _oPlugin.startSave(iWndIndex, szFileName);
				if (0 === iRes) {
					oWnd.bRecord = true;
					self.m_bDiskFreeSpaceEnough = true;
				} else if (-1 === iRes) {
					var iError = _oPlugin.getLastError();
					if (10 === iError || 9 === iError) {
						_oDialog.tip(_oTranslator.getValue("createFileFailed"));
					} else {
						_oDialog.tip(_oTranslator.getValue("clipFailed"));
					}
				} else if (-2 === iRes) {
					self.m_bDiskFreeSpaceEnough = false;
					_oDialog.tip(_oTranslator.getValue("noEnoughSpace"));
				} else if (-3 === iRes) {
					_oDialog.tip(_oTranslator.getValue("createFileFailed"));
				}
			}
		},
		// 停止剪辑
		stopClip: function (iWndIndex) {
			var oWnd = _oService.m_aWndList[iWndIndex];

			if (0 == _oPlugin.stopSave(iWndIndex)) {
				oWnd.bRecord = false;

				_oDialog.tip(_oTranslator.getValue("clipSucceeded") + "<p id='openDirectory' class='dir pointer'>" + oWnd.szFilePath + "</a></p>");
				$("#openDirectory").click(function () {
					_oPlugin.openDirectory(oWnd.szDir);
				});
			}
		},
		//获取OSD时间
		getOSDTime: function (iWndIndex) {
			var self = this,
				oWnd = _oService.m_aWndList[iWndIndex];

			if (!oWnd.bPlay && !oWnd.bReversePlay) {
				return;
			}

			var iTime = _oPlugin.getOSDTime(iWndIndex);
			if (iTime <= 8 * 3600 * 1000) {
				if (self.m_iOSDTimer !== 0) {
					clearTimeout(self.m_iOSDTimer);
					self.m_iOSDTimer = 0;
				}
				self.m_iOSDTimer = setTimeout(function () {
					self.getOSDTime(iWndIndex);
				}, 1000);
				return;
			}
			if (_oTimebar.getMouseDown()) {
				if (self.m_iOSDTimer !== 0) {
					clearTimeout(self.m_iOSDTimer);
					self.m_iOSDTimer = 0;
				}
				self.m_iOSDTimer = setTimeout(function () {
					self.getOSDTime(iWndIndex);
				}, 1000);
				return;
			}

			var oDate = new Date(iTime * 1000);
			var oSearchRecord = _oSearch.getSearchRecord(iWndIndex);

			oSearchRecord.szWndMidTime = _oUtils.dateFormat(oDate, "yyyy-MM-dd hh:mm:ss");
			if (iWndIndex === _oService.m_iWndIndex) {
				_oTimebar.setMidLineTime(oSearchRecord.szWndMidTime);
			}
			if (self.m_iOSDTimer !== 0) {
				clearTimeout(self.m_iOSDTimer);
				self.m_iOSDTimer = 0;
			}
			self.m_iOSDTimer = setTimeout(function () {
				self.getOSDTime(iWndIndex);
			}, 1000);
		},
		// 定位时间
		gotoTime: function (szHour, szMinute, szSecond) {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				bPlay = oWnd.bPlay,
				bReversePlay = oWnd.bReversePlay,
				iSpeed = oWnd.iSpeed,
				iSoundWndIndex = _oService.m_oWndParams.iSoundWndIndex;

			self.stopPlayback();
			_oSearch.searchRecordFile(2);

			var szTime = _oSearch.m_szCalendarDate + " " + szHour + ":" + szMinute + ":" + szSecond;
			_oTimebar.setMidLineTime(szTime);

			if (bPlay) {
                setTimeout(function () {
                    self.startPlayback();
                }, 200);
				if (oWnd.bPlay) {
					if (iSpeed > 1) {
						for (var i = 1; i < iSpeed;  i = i * 2) {
							if (0 == _oPlugin.fast(iWndIndex)) {
								if (oWnd.iSpeed < 8) {
									oWnd.iSpeed = oWnd.iSpeed * 2;
								}
							}
						}
					} else if (iSpeed < 1) {
						for (var i = 1; i > iSpeed; i = i / 2) {
							if (0 == _oPlugin.slow(iWndIndex)) {
								if (oWnd.iSpeed > 1 / 8) {
									oWnd.iSpeed = oWnd.iSpeed / 2;
								}
							}
						}
					}
					if (iSoundWndIndex == iWndIndex) {// 加速后再开启声音，不然会有短暂的声音
						if (0 == _oPlugin.openSound(iWndIndex)) {
							_oService.m_oWndParams.iSoundWndIndex = iWndIndex;
						} else {
							/*var iError = _oPlugin.getLastError();
							if (25 == iError) {// 声音被占用
								_oDialog.tip(_oTranslator.getValue("openSoundFailed"));
							}*/
							_oDialog.tip(_oTranslator.getValue("openSoundFailed"));
						}
					}
				}
			} else if (bReversePlay) {
				self.startReversePlayback();
			}
			// 更新状态栏
			_oStatusScope.updateStatus();
			_oTool.update();
		},
		// 时间条鼠标弹起
		timebarMouseUp: function (szMidTime) {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				oSearchRecord = _oSearch.getSearchRecord(iWndIndex),
				bPlay = oWnd.bPlay,
				bReversePlay = oWnd.bReversePlay,
				iSpeed = oWnd.iSpeed,
				iSoundWndIndex = _oService.m_oWndParams.iSoundWndIndex,
				bTranscoding = oWnd.bTranscoding;

			self.stopPlayback();

			if (oSearchRecord) {
				oSearchRecord.szWndMidTime = szMidTime;
			}
			var szStartTime = _oSearch.m_szSearchDate + " 00:00:00";
			var szStopTime = _oSearch.m_szSearchDate + " 23:59:59";
			if (szMidTime > szStopTime || szMidTime < szStartTime) {
				_oSearch.m_szSearchDate = szMidTime.split(" ")[0];
				if (oSearchRecord.bWndSearched) {
					_oSearch.searchRecordFile(0);
				}
			}
			if (bReversePlay) {
				self.startReversePlayback();
			}
			if (bPlay) {
				if (bTranscoding) {
					oWnd.bTranscoding = bTranscoding;
				}
                setTimeout(function () {
                    self.startPlayback();
                }, 200);
				if (oWnd.bPlay) {
					if (iSpeed > 1) {
						for (var i = 1; i < iSpeed;  i = i * 2) {
							if (0 == _oPlugin.fast(iWndIndex)) {
								if (oWnd.iSpeed < 8) {
									oWnd.iSpeed = 2 * oWnd.iSpeed;
								}
							}
						}
					} else if (iSpeed < 1) {
						for (var i = 1; i > iSpeed; i = i / 2) {
							if (0 == _oPlugin.slow(iWndIndex)) {
								if (oWnd.iSpeed > 1 / 8) {
									oWnd.iSpeed = oWnd.iSpeed / 2;
								}
							}
						}
					}
					if (iSoundWndIndex == iWndIndex) {// 加速后再开启声音，不然会有短暂的声音
						if (0 == _oPlugin.openSound(iWndIndex)) {
							_oService.m_oWndParams.iSoundWndIndex = iWndIndex;
						} else {
							/*var iError = _oPlugin.getLastError();
							if (25 == iError) {// 声音被占用
								_oDialog.tip(_oTranslator.getValue("openSoundFailed"));
							}*/
							_oDialog.tip(_oTranslator.getValue("openSoundFailed"));
						}
					}
				}
			}

			// 更新状态栏
			_oStatusScope.updateStatus();
			_oTool.update();
		},
		// 开启/关闭转码
		openTransCode: function () {
			var iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			if (oWnd.bPlay || oWnd.bReversePlay) {
				_oDialog.tip(_oTranslator.getValue("stopCurrentWndPlay"));
				return false;
			}

			oWnd.bTranscoding = !oWnd.bTranscoding;
			_oTool.update();

			return true;
		},
		// 转码参数改变
		changeTransCode: function (iTransCodeResolution, iTransCodeBitrate, iTransCodeFrame) {
			var self = this;

			self.m_iTranscodingResolution = iTransCodeResolution;
			self.m_iTranscodingBitrate = iTransCodeBitrate;
			self.m_iTranscodingFrame = iTransCodeFrame;
		},
		// 更新通道小图标
		updateChannelIcon: function () {
			var iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex],
				iChannelPlayIndex = oWnd.iChannelPlayIndex;

			_oService.m_aChannelList[iChannelPlayIndex].bPlay = (oWnd.bPlay || oWnd.bReversePlay);
			_oChannel.update();
		},
		openDownload: function () {
			if (this.wDownloadWnd && this.wDownloadWnd.open && !this.wDownloadWnd.closed) {
				this.wDownloadWnd.focus();
				return;
			}
			this.wDownloadWnd = window.open("download.asp?fileType=record&date=" + _oSearch.m_szCalendarDate + "&chan=" + _oChannel.m_iChannelId, 'Download', 'height=624,width=941,top=250,left=300,directories=no,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no');
		}
	};

	module.exports = new Playback();
});
