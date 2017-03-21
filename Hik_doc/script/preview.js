define(function (require, exports, module) {

	var $, _oCommon, _oService, _oTranslator, _oDevice, _oUtils, _oDialog, _oHeader, _oChannel, _oPlugin, _oTool, _oPTZ, _oResponse, _oBase64;
	var _iCaptureFileFormat, _szCapturePath, _szRecordPath;

	$ = require("jquery");
	require("quickTime");

	_oCommon = require("common");
	_oService = require("service");
	_oTranslator = require("translator");
	_oDevice = require("isapi/device");
	_oUtils = require("utils");
	_oDialog = require("dialog");

	_oHeader = require("common/header");
	_oTool = require("common/tool");
	_oChannel = require("common/channel");
	_oPlugin = require("common/plugin");
	_oPTZ = require("common/ptz");

	_oResponse = require("isapi/response");
	_oBase64 = require("base64");

	function Preview() {
		this.m_iCurPage = 0;
		this.m_aPlugins = [];

		_iCaptureFileFormat = 0;					// 默认jpg格式
		_szCapturePath = "";
		_szRecordPath = "";
	}

	Preview.prototype = {
		// 页面初始化
		init: function () {
			var self = this;

			var oLan = _oTranslator.getLanguage("Preview");
			_oTranslator.appendLanguage(oLan, _oCommon.m_oLanCommon);

			document.title = _oTranslator.getValue("preview");

			self.initLayout();  //界面布局
			self.initController();  //控制器初始化

			self.checkLoaded();  //模块是否加载检测
		},

		// 检查模块是否都加载完毕
		checkLoaded: function () {
			var self = this;
			setTimeout(function () {
				if (_oService.m_oLoaded.bPlugin) {
					var szPathInfo = _oPlugin.getLocalConfig();
					var oXmlDoc = _oUtils.parseXmlFromStr(szPathInfo);
					
					// 抓图文件格式
					if ($(oXmlDoc).find("CaptureFileFormat").length > 0) {
						_iCaptureFileFormat = _oUtils.nodeValue(oXmlDoc, "CaptureFileFormat", "i");
					}

					// 抓图、剪辑路径
					_szCapturePath = _oUtils.nodeValue(oXmlDoc, "CapturePath");
					_szRecordPath= _oUtils.nodeValue(oXmlDoc, "RecordPath");
					
					if(!_oDevice.m_oDeviceCapa.bSupportTransCode && _oUtils.nodeValue($(oXmlDoc), "StreamType", "i") > 1) {
						_oService.m_iStreamType = 0;
					} else {
						_oService.m_iStreamType = _oUtils.nodeValue($(oXmlDoc), "StreamType", "i");
					}
					//更新所有通道绑定的码流类型
					for (var i = 0; i < _oService.m_aChannelList.length; i++) {
						_oService.m_aChannelList[i].iStreamType = _oService.m_iStreamType;
					}
					if(_oService.isSingleChannel()) {  //前端支持多插件切换
						var aPlugins = self.checkPlugins();  //检测当前存在的视频插件
						if (aPlugins.length == 0) {
							_oService.m_iPluginType = 4;
							return;
						} else {
							if ($.inArray("webcomponents", aPlugins) != -1) {
								_oService.m_iPluginType = 4;
							} else if ($.inArray("quicktime", aPlugins) != -1) {
								_oService.m_iPluginType = 1;
							} else if ($.inArray("vlc", aPlugins) != -1) {
								_oService.m_iPluginType = 2;
							} else if ($.inArray("mjpeg", aPlugins) != -1) {
								_oService.m_iPluginType = 3;
							} else {
								_oService.m_iPluginType = 4;
							}
						}
					}
					var iAutoPlay = _oUtils.nodeValue($(oXmlDoc), "RealPlayAll", "i");
					if (iAutoPlay === 1 || _oService.isSingleChannel()) {
						self.startPlayAll();
						if (_oService.m_iPluginType !== 4) {  //_oService.m_iPluginType初始值为4, 后端设备不会修改初始值
							self.pluginChange(_oService.m_iPluginType);
						}
					}
					//各个模块按钮状态更新
					_oChannel.update();
					_oTool.update();
					_oPTZ.update();
					//URL参数获取
					var szUrl = decodeURI(document.URL);
					if (szUrl.indexOf("?") > -1) {
						var szOpen = _oUtils.getURIParam("open", szUrl);
						if (szOpen !== "") {
							szOpen = szOpen.match(/\{(.+)\}/);
							if (szOpen !== null) {
								setTimeout(function () {
									var aOpenChan = szOpen[1].split(",");
									for (var i = 0; i < aOpenChan.length; i++) {
										self.startPlay((parseInt(aOpenChan[i], 10) - 1), i, true);
									}
									_oChannel.update();
									_oTool.update();
									_oPTZ.update();
								}, 100);
							}
						}
					}
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
				north: {  //头部
					paneSelector: ".layout-north",
					size: 40
				},
				west: {  //通道列表
					paneSelector: ".layout-west",
					size: _oService.isSingleChannel() ? 15 : 200,// 判断是否为单通道
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
						center: {  //视频区
							paneSelector: ".layout-center-inner",
							onresize_end: function (pane) {
								_oTool.hideSound();
							}
						},
						south: {  //工具栏
							paneSelector: ".layout-south-inner",
							size: 40
						}
					}
				},
				east: {  //云台
					paneSelector: ".layout-east",
					initClosed: _oService.isSingleChannel(),
					size: 209,
					spacing_open: _oCommon.m_bAnonymous ? 0 : 10,
					spacing_closed: _oCommon.m_bAnonymous ? 0 : 10,
					onresize_end: function (pane) {
						_oPTZ.resize();
					}
				},
				south: {  //底部版权信息
					paneSelector: ".layout-south",
					size: 30
				}
			};

			$("body").layout(layoutSettings);
		},
		// 初始化控制器
		initController: function () {
			var self = this;
            if(!_oCommon.m_bAnonymous) {
                _oDevice.getPanoramicMapCap();
            }
			_oHeader.init("header", 0);  //初始化head选中第一个
			_oChannel.init("channel", "preview", {
				onPlay: function (iChannelIndex, iWndIndex) {
					self.startPlay(iChannelIndex, iWndIndex);
					_oTool.update();  //原本在startPlay调用update,由于channel和tool需要相互更新状态会有冲突，统一移到各自模块定义时调用
					_oPTZ.update();
				},
				onRecord: function (iChannelIndex) {
					self.startRecord(iChannelIndex);
					_oTool.update();
				},
				onSelected: null,
				onChangeStream: function (iChannelIndex, iStreamType) {
					self.channelStreamChange(iChannelIndex, iStreamType);
					_oTool.update();
					_oPTZ.update();
				}
			});
			_oTool.init("tool", "preview", {
				onPlayAll: function () {
					self.startPlayAll();
					_oChannel.update();
					_oPTZ.update();
				},
				onRecordAll: function () {
					self.startRecordAll();
					_oChannel.update();
				},
				onCapture: function () {
					self.capture();
				},
				onEnableEzoom: function () {
					self.enableEzoom();
				},
				onEnableRegionExposure: function () {
					self.enableRegionExposure();
					_oPTZ.update();
				},
				onEnableRegionFocus: function () {
					self.enableRegionFocus();
					_oPTZ.update();
				},
				onPrevPage: function () {
					self.prevPage();
					_oChannel.update();
				},
				onNextPage: function () {
					self.nextPage();
					_oChannel.update();
				},
				onArrangeWindow: function (iWndSplitMode) {
					self.m_iCurPage = 0;
					_oTool.update(true);
				},
				onStreamChange: function (iStreamType) {
					self.streamChange(iStreamType);
					_oChannel.update();
				},
				onSizeChange: function (iSizeMode) {
					self.sizeChange(iSizeMode);
				},
				onPluginChange: function (iPluginType) {
					self.pluginChange(iPluginType);
				},
				onTalkChange: function (iTalkNum, szCompressionType, iAudioBitRate, iAudioSamplingRate) {
					self.enableTalk(iTalkNum, szCompressionType, iAudioBitRate, iAudioSamplingRate);
				}
			});
			//URL参数获取，插件初始化前获取分割模式
			var szUrl = decodeURI(document.URL);
			if(szUrl.indexOf("?") > -1) {
				var szSlice = _oUtils.getURIParam("slice", szUrl);
				if (szSlice !== "") {
					_oService.m_iWndSplitMode = Math.ceil(Math.sqrt(parseInt(szSlice, 10)));
				}
			}
			_oPlugin.init("plugin", _oService.m_iWndSplitMode, {
				onGetSelectWndInfo: function (iWndIndex) {
					self.getSelectWndInfo(iWndIndex);
					_oTool.update();
					_oPTZ.update();
				},
				onPluginEventHandler: function (iEventType, iWndIndex, iParam2) {
					self.pluginEventHandler(iEventType, iWndIndex, iParam2);
				},
				onZoomInfoCallback: function (szZoomInfo) {
					self.zoomInfoCallback(szZoomInfo);
				},
				onPTZCtrlCallback: function(iWndIndex, iMouseActionType, iPTZActionType) {
					self.ptzCtrlCallback(iWndIndex, iMouseActionType, iPTZActionType);
				}
			});
			_oPTZ.init("ptz");
			//云台初始化延后执行
			/*setTimeout(function () {
				_oPTZ.init("ptz");
			}, _oService.isSingleChannel() ? 200 : 50);*/
		},

		// 页面卸载处理
		unload: function () {
			try {
				_oPlugin.stopRealPlayAll();
				_oPlugin.stopTalk();
			} catch (e) {}
		},

		// 插件事件异步回调
		pluginEventHandler: function (iEventType, iWndIndex, iParam2) {
			var self = this;
			if(21 == iEventType) {
				_oDialog.tip(_oTranslator.getValue("noEnoughSpace"));
				if(_oService.m_aWndList[iWndIndex].iChannelPlayIndex !== -1 && _oService.m_aWndList[iWndIndex].bRecord) {
					setTimeout(function () {
						self.startRecord(_oService.m_aWndList[iWndIndex].iChannelPlayIndex);
						_oChannel.update();
						_oTool.update();
					}, 500);
				}
			} else if(3 == iEventType) {
				self.enableTalk(0);
				_oDialog.tip(_oTranslator.getValue("voiceTalkFailed"));
			} else if(7 == iEventType) {
				_oDialog.tip(_oTranslator.getValue("noStreamSecret"));
			}
		},
		// 画区域回调
		zoomInfoCallback: function (szZoomInfo) {
			var self = this,
				oWnd = _oService.m_aWndList[_oService.m_iWndIndex],
				iChannelId = _oService.m_aChannelList[oWnd.iChannelPlayIndex].iId,
				xmlDoc = _oUtils.parseXmlFromStr(szZoomInfo);

			var szXml, szURL;
			//手动跟踪取证
            if(oWnd.bManualTrackEvidence) {
                szXml = "<?xml version='1.0' encoding='UTF-8'?><ManualTraceEvidenceArea>"
                    + "<StartPoint>"
                    + "<positionX>" + $(xmlDoc).find("StartPoint").eq(0).find("positionX").eq(0).text() + "</positionX>"
                    + "<positionY>" + (255 - parseInt($(xmlDoc).find("StartPoint").eq(0).find("positionY").eq(0).text(), 10)) + "</positionY>"
                    + "</StartPoint>"
                    + "<EndPoint>"
                    + "<positionX>" + $(xmlDoc).find("EndPoint").eq(0).find("positionX").eq(0).text() + "</positionX>"
                    + "<positionY>" + (255 - parseInt($(xmlDoc).find("EndPoint").eq(0).find("positionY").eq(0).text(), 10)) + "</positionY>"
                    + "</EndPoint>"
                    + "</ManualTraceEvidenceArea>";
                szURL = "trafficManualTrackCapture";
            } else if (oWnd.bManualTrack) {// 手动跟踪
                if(_oDevice.m_oDeviceCapa.oVCAResourceType == 'TFS' || _oDevice.m_oDeviceCapa.oSupportTraffic.bSupportManualEvidence) {
                    szXml = "<?xml version='1.0' encoding='UTF-8'?><ManualItsCap>"
                        + "<StartPoint>"
                        + "<positionX>" + $(xmlDoc).find("StartPoint").eq(0).find("positionX").eq(0).text() + "</positionX>"
                        + "<positionY>" + (255 - parseInt($(xmlDoc).find("StartPoint").eq(0).find("positionY").eq(0).text(), 10)) + "</positionY>"
                        + "</StartPoint>"
                        + "<EndPoint>"
                        + "<positionX>" + $(xmlDoc).find("EndPoint").eq(0).find("positionX").eq(0).text() + "</positionX>"
                        + "<positionY>" + (255 - parseInt($(xmlDoc).find("EndPoint").eq(0).find("positionY").eq(0).text(), 10)) + "</positionY>"
                        + "</EndPoint>"
                        + "</ManualItsCap>";
                    szURL = "manualEvidence";
                } else {
                    szXml = "<?xml version='1.0' encoding='UTF-8'?><ManualTrace><positionX>" + $(xmlDoc).find("StartPoint").eq(0).find("positionX").eq(0).text() + "</positionX>" +
                        "<positionY>" + (255 - parseInt($(xmlDoc).find("StartPoint").eq(0).find("positionY").eq(0).text(), 10)) + "</positionY></ManualTrace>";
                    szURL = "manualTrace";
                }
			} else if (oWnd.bRegionFocus) {// 区域聚焦
				var iSPx = parseInt((parseInt($(xmlDoc).find("StartPoint").eq(0).find("positionX").eq(0).text(),10) / 255) * 1000, 10);
				var iSPy = 1000 - parseInt((parseInt($(xmlDoc).find("StartPoint").eq(0).find("positionY").eq(0).text(), 10) / 255) * 1000, 10);
				var iEPx = parseInt((parseInt($(xmlDoc).find("EndPoint").eq(0).find("positionX").eq(0).text(), 10) / 255) * 1000, 10);
				var iEPy = 1000 - parseInt((parseInt($(xmlDoc).find("EndPoint").eq(0).find("positionY").eq(0).text(), 10) / 255) * 1000, 10);
				szXml = "<?xml version='1.0' encoding='UTF-8'?><RegionalFocus><StartPoint><positionX>" + iSPx + "</positionX>" +
					"<positionY>" + iSPy + "</positionY></StartPoint><EndPoint><positionX>" + iEPx + "</positionX>" +
					"<positionY>" + iEPy + "</positionY></EndPoint></RegionalFocus>";
				szURL = "regionalFocus";
			} else if (oWnd.bRegionExposure) {// 区域曝光
				var iSPx = parseInt((parseInt($(xmlDoc).find("StartPoint").eq(0).find("positionX").eq(0).text(),10) / 255) * 1000, 10);
				var iSPy = 1000 - parseInt((parseInt($(xmlDoc).find("StartPoint").eq(0).find("positionY").eq(0).text(), 10) / 255) * 1000, 10);
				var iEPx = parseInt((parseInt($(xmlDoc).find("EndPoint").eq(0).find("positionX").eq(0).text(), 10) / 255) * 1000, 10);
				var iEPy = 1000 - parseInt((parseInt($(xmlDoc).find("EndPoint").eq(0).find("positionY").eq(0).text(), 10) / 255) * 1000, 10);
				szXml = "<?xml version='1.0' encoding='UTF-8'?><RegionalExposure><StartPoint><positionX>" + iSPx + "</positionX>" +
					"<positionY>" + iSPy + "</positionY></StartPoint><EndPoint><positionX>" + iEPx + "</positionX>" +
					"<positionY>" + iEPy + "</positionY></EndPoint></RegionalExposure>";
				szURL = "regionalExposure";
			} else {// 3D定位
				szXml = "<?xml version='1.0' encoding='UTF-8'?><position3D><StartPoint>" +
					"<positionX>" + $(xmlDoc).find("StartPoint").eq(0).find("positionX").eq(0).text() + "</positionX>" +
					"<positionY>" + (255 - parseInt($(xmlDoc).find("StartPoint").eq(0).find("positionY").eq(0).text(), 10)) + "</positionY>" +
					"</StartPoint><EndPoint><positionX>" + $(xmlDoc).find("EndPoint").eq(0).find("positionX").eq(0).text() + "</positionX>" +
					"<positionY>" + (255 - parseInt($(xmlDoc).find("EndPoint").eq(0).find("positionY").eq(0).text(), 10)) + "</positionY></EndPoint></position3D>";
				szURL = "position3D";
			}

			var oXmlDoc = _oUtils.parseXmlFromStr(szXml);
			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, szURL, {channel: iChannelId}, {
				data: oXmlDoc,
				success: function (status, xmlDoc) {
                    if(oWnd.bManualTrack && (_oDevice.m_oDeviceCapa.oVCAResourceType == 'TFS' || _oDevice.m_oDeviceCapa.oSupportTraffic.bSupportManualEvidence)) {
                        _oDialog.tip(_oTranslator.getValue("manualCaptureStarting"));
                    }
                    if(oWnd.bManualTrackEvidence) {
                        _oDialog.tip(_oTranslator.getValue("startManualTrace"));
                    }
				},
				error: function (status, xmlDoc, xhr) {
					_oResponse.saveState(xhr);
				}
			});
		},
		//视频PTZ控制回调
		ptzCtrlCallback: function (iWndIndex, iMouseActionType, iPTZActionType) {
			if (iMouseActionType === 0) {
				switch (iPTZActionType) {
					case 1:
						_oPTZ.m_oService.ptzControl(5, _oPTZ.m_oService.m_oParams.iSpeed);
						break;
					case 2:
						_oPTZ.m_oService.ptzControl(1, _oPTZ.m_oService.m_oParams.iSpeed);
						break;
					case 3:
						_oPTZ.m_oService.ptzControl(7, _oPTZ.m_oService.m_oParams.iSpeed);
						break;
					case 4:
						_oPTZ.m_oService.ptzControl(3, _oPTZ.m_oService.m_oParams.iSpeed);
						break;
					case 5:
						_oPTZ.m_oService.ptzControl(15, _oPTZ.m_oService.m_oParams.iSpeed);
						_oPTZ.update();
						break;
					case 6:
						_oPTZ.m_oService.ptzControl(4, _oPTZ.m_oService.m_oParams.iSpeed);
						break;
					case 7:
						_oPTZ.m_oService.ptzControl(6, _oPTZ.m_oService.m_oParams.iSpeed);
						break;
					case 8:
						_oPTZ.m_oService.ptzControl(2, _oPTZ.m_oService.m_oParams.iSpeed);
						break;
					case 9:
						_oPTZ.m_oService.ptzControl(8, _oPTZ.m_oService.m_oParams.iSpeed);
						break;
					default :
						break;
				}
			} else {
				switch (iPTZActionType) {
					case 1:
						_oPTZ.m_oService.ptzControl(5, 0);
						break;
					case 2:
						_oPTZ.m_oService.ptzControl(1, 0);
						break;
					case 3:
						_oPTZ.m_oService.ptzControl(7, 0);
						break;
					case 4:
						_oPTZ.m_oService.ptzControl(3, 0);
						break;
					case 6:
						_oPTZ.m_oService.ptzControl(4, 0);
						break;
					case 7:
						_oPTZ.m_oService.ptzControl(6, 0);
						break;
					case 8:
						_oPTZ.m_oService.ptzControl(2, 0);
						break;
					case 9:
						_oPTZ.m_oService.ptzControl(8, 0);
						break;
					default :
						break;
				}
			}
		},
		/*
		 iTaklNum: 0-stop
		 */
		enableTalk: function (iTalkNum, szCompressionType, iAudioBitRate, iAudioSamplingRate) {
			if (iTalkNum === 0) {  //表示停止对讲
				var iRet = _oPlugin.stopTalk();
				if (iRet === 0) {
					$("#btn_talk_change i").eq(0).removeClass().addClass("icon-talk");
					$("#btn_talk_change .icon-sel").show();
					_oService.m_oWndParams.bTalking = false;
					_oTool.update(); 
				}
				return;
			}
			var szOpenURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/System/TwoWayAudio/channels/" + iTalkNum + "/open";
			var szCloseURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/System/TwoWayAudio/channels/" + iTalkNum + "/close";
			var szDataUrl = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/System/TwoWayAudio/channels/" + iTalkNum + "/audioData";

			if (szCompressionType == 'G.711ulaw') {
				iAudioType = 1;
			} else if (szCompressionType == "G.711alaw") {
				iAudioType = 2;
			} else if (szCompressionType == "G.726") {
				iAudioType = 3;
			} else if (szCompressionType == "MP2L2" || szCompressionType == "MPEL2") {
				iAudioType = 4;
			} else if (szCompressionType == "G.722.1") {
				iAudioType = 0;
			} else if ('AAC' == szCompressionType) {
                iAudioType = 5;
			} else if ("PCM" == szCompressionType) {
                iAudioType = 6;
            }

			var iTalk = _oPlugin.talk(szOpenURL, szCloseURL, szDataUrl, _oCommon.m_szPluginNamePwd, iAudioType, iAudioBitRate, iAudioSamplingRate);
			if (iTalk == 0) {
				$("#btn_talk_change i").eq(0).removeClass().addClass("icon-talk-" + iTalkNum).addClass("on");
				$("#btn_talk_change .icon-sel").hide();
				_oService.m_oWndParams.bTalking = true;
			} else {
				var iError = _oPlugin.getLastError();
				if (iError === 403) {
					_oDialog.tip(_oTranslator.getValue("noPermission"));
				} else {
					_oDialog.tip(_oTranslator.getValue("voiceTalkFailed"));
				}
				_oService.m_oWndParams.bTalking = false;
				return;
			}
		},
		//开启/停止预览
		startPlay: function (iChannelIndex, iWndIndex, bNoTips) {
			if (!_oPlugin.isInstalled()) {//插件未安装
				return;
			}
			var self = this;
			var iPort = 80,
				szProtocol = "",
				szUrl = "",
				szPathInfo = "",
				oXmlDoc = null,
				iProtocolType = -1;

			szPathInfo = _oPlugin.getLocalConfig();
			oXmlDoc = _oUtils.parseXmlFromStr(szPathInfo);
			if (_oDevice.m_oDeviceCapa.bSupportStreamEncrypt) {
				_oPlugin.setSecretKey(1, _oUtils.nodeValue(oXmlDoc, "SecretKey"));
			}
			if (iWndIndex === undefined) {
				var iWndIndex = _oService.m_iWndIndex;
			} else {
				var iWndIndex = iWndIndex;
			}
			var oChannel = _oService.m_aChannelList[iChannelIndex];  //通道对象
			var oWnd = _oService.m_aWndList[iWndIndex];  //窗口对象
			iProtocolType = parseInt($(oXmlDoc).find("ProtocolType").eq(0).text(), 10);
            if (0 == seajs.iDeviceType) {  //是否是后端设备
                if (4 == iProtocolType) { // 本地配置去掉HTTP选项后，
                    $(oXmlDoc).find("ProtocolType").eq(0).text("0");
                    _oPlugin.setLocalConfig(_oUtils.xmlToStr(oXmlDoc));
					iProtocolType = 0;
                }
            }
			if (_oCommon.m_szHttpProtocol === "https://") {
				iPort = _oDevice.m_oDevicePort.iSHttpPort;
			} else {
				iPort = _oCommon.m_iHttpPort;
			}
			szProtocol = "http://";

			if (oChannel.szType != "zero") {
				var iStreamType = oChannel.iStreamType;
				if (_oDevice.m_oSHttpCapa.bSupportShttpPlay && 0 == iProtocolType || _oService.m_bChromeNotSupportNpapi) {  //TCP私有取流
					szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort.toString() + "/SDK/play/";
					if ("analog" == oChannel.szType) {
						if (0 === iStreamType) {  //主码流
							szUrl += (oChannel.iId * 100) + "/004";  //[能力可以得到支持那种封装]这里最后以为暂时使用RTP包
						} else if (1 === iStreamType) {  //子码流
							szUrl += (oChannel.iId * 100 + 1) + "/004";
						} else if (2 === iStreamType) {
							if(_oDevice.m_oDeviceCapa.bSupportTransCode) {
								szUrl += (oChannel.iId * 100 + 3) + "/004";  //转码码流
							} else {
								szUrl += (oChannel.iId * 100 + 2) + "/004";  //三码流
							}
						} else {
							szUrl += (oChannel.iId * 100) + "/004";
						}
					} else {
						var iDigitalChanId = _oDevice.m_oSHttpCapa.iIpChanBase + oChannel.iId - _oService.m_iAnalogChNum - 1;
						if (0 === iStreamType) {  //主码流
							szUrl += (iDigitalChanId * 100) + "/004";  //[能力可以得到支持那种封装]这里最后以为暂时使用RTP包
						} else if (1 === iStreamType) {  //子码流
							szUrl += (iDigitalChanId * 100 + 1) + "/004";
						} else if (2 === iStreamType) {
							if(_oDevice.m_oDeviceCapa.bSupportTransCode) {
								szUrl += (iDigitalChanId * 100 + 3) + "/004";  //转码码流
							} else {
								szUrl += (iDigitalChanId * 100 + 2) + "/004";  //三码流
							}							
						} else {
							szUrl += (iDigitalChanId * 100) + "/004";
						}
					}
				} else {  //RTSP取流
					if (iProtocolType != 4) {  //rtsp标准取流
						iPort = _oDevice.m_oDevicePort.iRtspPort;
					}
					szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + iPort.toString() + "/ISAPI/streaming/channels/";
					if (0 === iStreamType) {
						szUrl += (oChannel.iId * 100 + 1);
					} else if (1 === iStreamType) {
						szUrl += (oChannel.iId * 100 + 2);
					} else if(2 === iStreamType) {
						if(_oDevice.m_oDeviceCapa.bSupportTransCode) {
							szUrl += (oChannel.iId * 100 + 4);
						} else {
							szUrl += (oChannel.iId * 100 + 3);
						}
					} else {
						szUrl += (oChannel.iId * 100 + 1);
					}
				}
			} else {
				if (_oDevice.m_oSHttpCapa.bSupportShttpPlay && 0 === iProtocolType) {
					szUrl = szProtocol + _oCommon.m_szHostName + ":" + iPort.toString() + "/SDK/play/100/004/ZeroStreaming";
				} else {
					szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iRtspPort + "/ISAPI/Custom/SelfExt/ContentMgmt/ZeroStreaming/channels/" + (oChannel.iId * 100 + 1);
				}
			}
			if (!oChannel.bPlay) {
				if (oWnd.bPlay) {
					if (oWnd.bRecord) {
						if (0 === _oPlugin.stopSave(iWndIndex)) {
							_oService.m_aChannelList[oWnd.iChannelPlayIndex].bRecord = false;
							oWnd.bRecord = false;
							//同一窗口，不同通道
							var iPlayChannelIndex = oWnd.iChannelPlayIndex;
							_oDialog.tip(_oTranslator.getValue("recordSucceed") + "<p id='openDirectory' class='dir pointer'>" + _oService.m_aChannelList[iPlayChannelIndex].szFilePath + "</a></p>");
							$("#openDirectory").click(function () {
								_oPlugin.openDirectory(_oService.m_aChannelList[iPlayChannelIndex].szDir);
							});
						}
					}
					//停止原先窗口的预览
					if (0 === _oPlugin.stop(iWndIndex)) {
						_oService.m_aChannelList[oWnd.iChannelPlayIndex].bPlay = false;
						oWnd.bPlay = false;
						oWnd.bEzoom = false;
						oWnd.bRegionExposure = false;
						oWnd.bRegionFocus = false;
						oWnd.bAutoPan = false;
						oWnd.bLight = false;
						oWnd.bWiper = false;
						oWnd.bManualTrack = false;
                        oWnd.bManualTrackEvidence = false;
						oWnd.b3DZoom = false;
						oWnd.bPTZCtrl = false;
						if (_oService.m_oWndParams.iSoundWndIndex === oService.m_aChannelList[iChannelIndex].iWndPlayIndex) {// 如果有窗口打开着声音，则关闭声音
							_oService.m_oWndParams.iSoundWndIndex = -1;
						}
					}
				}
				//开启当前通道预览
				if (0 === _oPlugin.play(szUrl, _oCommon.m_szPluginNamePwd, iWndIndex, "", "")) {
					oChannel.bPlay = true;
					oChannel.iWndPlayIndex = iWndIndex;
					oWnd.iChannelId = oChannel.iId;
					oWnd.bPlay = true;
					oWnd.iChannelPlayIndex = iChannelIndex;

					// 更新窗口对应通道的能力
					self.updateChannelCap(iWndIndex);
				} else {
					if (!bNoTips) {
						_oDialog.tip(_oTranslator.getValue("previewFailed"));
					}
				}
			} else {
				if (oChannel.bRecord) {
					if (0 === _oPlugin.stopSave(oChannel.iWndPlayIndex)) {
						_oService.m_aChannelList[iChannelIndex].bRecord = false;
						_oService.m_aWndList[oChannel.iWndPlayIndex].bRecord = false;
						_oDialog.tip(_oTranslator.getValue("recordSucceed") + "<p id='openDirectory' class='dir pointer'>" + oChannel.szFilePath + "</a></p>");
						$("#openDirectory").click(function () {
							_oPlugin.openDirectory(oChannel.szDir);
						});
					}
				}
				if (0 === _oPlugin.stop(oChannel.iWndPlayIndex)) {
					_oService.m_aWndList[oChannel.iWndPlayIndex].bPlay = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].bEzoom = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].bRegionExposure = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].bRegionFocus = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].iChannelId = -1;
					_oService.m_aWndList[oChannel.iWndPlayIndex].iChannelPlayIndex = -1;
					_oService.m_aWndList[oChannel.iWndPlayIndex].bAutoPan = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].bLight = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].bWiper = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].bManualTrack = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].b3DZoom = false;
					_oService.m_aWndList[oChannel.iWndPlayIndex].bPTZCtrl = false;
                    _oService.m_aWndList[oChannel.iWndPlayIndex].bManualTrackEvidence = false;
					oChannel.bPlay = false;
					if (_oService.m_oWndParams.iSoundWndIndex === _oService.m_aChannelList[iChannelIndex].iWndPlayIndex) {// 如果有窗口打开着声音，则关闭声音
						_oService.m_oWndParams.iSoundWndIndex = -1;
					}
					oChannel.iWndPlayIndex = -1;

					// 更新窗口对应通道的能力
					self.updateChannelCap(iWndIndex);
				}
			}
			if (_oService.m_iWndSizeMode === 3) {
				self.sizeChange(3);
			}
			self.isPlayOrRecord();
		},
		//开启/关闭所有预览
		startPlayAll: function () {
			if (!_oPlugin.isInstalled()) {//插件未安装
				return;
			}
			var self = this;
			var iWndNum = _oService.m_iWndSplitMode * _oService.m_iWndSplitMode;
			var iTotalNum = _oService.m_aChannelList.length;
			if (_oService.m_oWndParams.bHasWndPlay) {
				self.stopPlayAll();
			} else {
				//只开启一个通道时，有预览失败提示，否则没有
				var bNoTips = !(iTotalNum <= 1 || iWndNum <= 1);
				for (var i = 0; i < iTotalNum; i++) {
					if (i < iWndNum) {
						self.startPlay(i, i, bNoTips);
					}
				}
			}
			self.isPlayOrRecord();
		},
		stopPlayAll: function () {
			var self = this;
			var iTotalNum = _oService.m_aChannelList.length;
			if (0 === _oPlugin.stopRealPlayAll()) {
				for (var i = 0; i < iTotalNum; i++) {
					_oService.m_aChannelList[i].bPlay = false;
					_oService.m_aChannelList[i].bRecord = false;
					_oService.m_aChannelList[i].iWndPlayIndex = -1;
				}
				for (var i = 0; i < _oService.m_iMaxWndNum; i++) {
					_oService.m_aWndList[i].bPlay = false;
					_oService.m_aWndList[i].bRecord = false;
					_oService.m_aWndList[i].bEzoom = false;
					_oService.m_aWndList[i].bRegionExposure = false;
					_oService.m_aWndList[i].bRegionFocus = false;
					_oService.m_aWndList[i].iChannelId = -1;
					_oService.m_aWndList[i].iChannelPlayIndex = -1;
					_oService.m_aWndList[i].bAutoPan = false;
					_oService.m_aWndList[i].bLight = false;
					_oService.m_aWndList[i].bWiper = false;
					_oService.m_aWndList[i].bManualTrack = false;
					_oService.m_aWndList[i].b3DZoom = false;
					_oService.m_aWndList[i].bPTZCtrl = false;
                    _oService.m_aWndList[i].bManualTrackEvidence = false;
				}
				_oService.m_oWndParams.iSoundWndIndex = -1;

				// 更新窗口对应通道的能力
				self.updateChannelCap(_oService.m_iWndIndex);
			}
			if (_oService.m_oWndParams.bHasWndRecord) {
				_oDialog.tip(_oTranslator.getValue("recordSucceed"));
			}			
		},
		startRecord: function (iChannelIndex) {
			var self = this;
			var szHostName = "";
			var szFileName = "";
			var oDate = new Date();
			var oChannel = _oService.m_aChannelList[iChannelIndex];
			if (_oCommon.m_szHostName.indexOf("[") < 0) {
				szHostName = _oCommon.m_szHostName;
			} else {
				szHostName = _oCommon.m_szHostName.substring(1, _oCommon.m_szHostName.length - 1).replace(/:/g, ".");
			}
			if (oChannel.szType === "zero") {
				szFileName = szHostName + "_" + oChannel.szName.replace(/\s/g, "") + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
			} else {
				if (oChannel.iId <= 9) {
					szFileName = szHostName + "_0" + oChannel.iId + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
				} else {
					szFileName = szHostName + "_" + oChannel.iId + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
				}
			}
			if (oChannel.bPlay) {
				if (oChannel.bRecord) {
					if (0 === _oPlugin.stopSave(oChannel.iWndPlayIndex)) {
						oChannel.bRecord = false;
						_oService.m_aWndList[oChannel.iWndPlayIndex].bRecord = false;
						_oDialog.tip(_oTranslator.getValue("recordSucceed") + "<p id='openDirectory' class='dir pointer'>" + oChannel.szFilePath + "</a></p>");
						$("#openDirectory").click(function () {
							_oPlugin.openDirectory(_oService.m_aChannelList[iChannelIndex].szDir);
						});
					}
				} else {
					var iRes = _oPlugin.startSave(oChannel.iWndPlayIndex, szFileName);
					if (iRes == 0) {
						oChannel.bRecord = true;
						_oService.m_aWndList[oChannel.iWndPlayIndex].bRecord = true;
						if (!_oCommon.m_bAnonymous) {// 强制I帧，如果录像的时候不是I帧，会录不下来
							WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "requestKeyFrame", {channel: oChannel.iId, videoStream: (oChannel.iStreamType + 1)}, {
								async: false
							});
						}
						// 保存剪辑文件路径和剪辑文件目录
						var oDate = new Date();
						oChannel.szFilePath = _szRecordPath + "\\" + _oUtils.dateFormat(oDate, "yyyy-MM-dd") + "\\" + szFileName + ".mp4";
						oChannel.szDir = _szRecordPath + "\\" + _oUtils.dateFormat(oDate, "yyyy-MM-dd");
					} else if(iRes === -1) {
						var iError = _oPlugin.getLastError();
						if(10 === iError || 9 === iError) {
							_oDialog.tip(_oTranslator.getValue("createFileFailed"));
						} else {
							_oDialog.tip(_oTranslator.getValue("recordfailed"));
						}
					} else if(-2 === iRes) {
						_oDialog.tip(_oTranslator.getValue("noEnoughSpace"));
					} else if(-3 === iRes) {
						_oDialog.tip(_oTranslator.getValue("createFileFailed"));
					}
				}
			}
			self.isPlayOrRecord();
		},
		startRecordAll: function () {
			var self = this;
			var iWndNum = _oService.m_iWndSplitMode * _oService.m_iWndSplitMode;
			if (_oService.m_oWndParams.bHasWndRecord) {
				for (var i = 0; i < iWndNum; i++) {
					if (_oService.m_aWndList[i].bRecord) {
						self.startRecord(_oService.m_aWndList[i].iChannelPlayIndex);
					}
				}
			} else {
				var iTotalNum = _oService.m_aChannelList.length;
				for (var i = 0; i < iTotalNum; i++) {
					self.startRecord(i);
				}
			}
			self.isPlayOrRecord();
		},
		// 抓图
		capture: function () {
			var self = this;
			var iWndIndex = _oService.m_iWndIndex;
			var oWnd = _oService.m_aWndList[iWndIndex];
			var iChannelIndex = oWnd.iChannelPlayIndex;
			var oChannel = _oService.m_aChannelList[iChannelIndex];

			if (oWnd.bPlay) {
				var oDate = new Date(),
					szFilePath = "",
					szFileName = "",
					szHostName = "";

				if (_oCommon.m_szHostName.indexOf("[") < 0) {
					szHostName = _oCommon.m_szHostName;
				} else {
					szHostName = _oCommon.m_szHostName.substring(1, _oCommon.m_szHostName.length - 1).replace(/:/g, ".");
				}
				if (oChannel.szType === "zero") {
					szFileName = szHostName + "_" + oChannel.szName.replace(/\s/g, "") + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
				} else {
					if (oWnd.iChannelId <= 9) {
						szFileName = szHostName + "_0" + oWnd.iChannelId + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
					} else {
						szFileName = szHostName + "_" + oWnd.iChannelId + "_" + _oUtils.dateFormat(oDate, "yyyyMMddhhmmssS");
					}
				}

				szFilePath = _szCapturePath + "\\" + _oUtils.dateFormat(oDate, "yyyy-MM-dd") + "\\" + szFileName + (_iCaptureFileFormat == 1 ? ".bmp" : ".jpg");
				szFileName = szFileName + (_iCaptureFileFormat == 1 ? ".bmp" : "");
				var iRes = _oPlugin.capture(iWndIndex, szFileName);
				if (0 === iRes) {
					if(_oService.m_bChromeNotSupportNpapi) {
                        var myCanvasObject = document.getElementById("videoCanvas");
                        var image = new Image();
                        image.src = myCanvasObject.toDataURL("image/png");
                        document.getElementById("img1111").appendChild(image);
                        /*_oDialog.tip();
                        var $output = $(".aui_content")[0];
                        var canvas = document.getElementById("videoCanvas")
					    var image = new Image();
				        image.src = canvas.toDataURL("image/jpeg");
                        image.width = 190;
                        image.height = 90;
						$output.appendChild(image);
                        //_oDialog.tip();
						var link = window.document.createElement('a');
						link.href = szPicUrl;
						console.log(szFileName);
						link.download = szFileName + ".png";
						var click = document.createEvent("Event");
						click.initEvent("click", true, true);
						link.dispatchEvent(click);*/
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
				oWnd = _oService.m_aWndList[_oService.m_iWndIndex];
			if (oWnd.bEzoom) {
				if (0 === _oPlugin.disableEzoom(_oService.m_iWndIndex)) {
					oWnd.bEzoom = false;
				}
			} else {
				_oService.disableEzoom(_oPlugin);// 功能互斥处理
				if (0 === _oPlugin.enableEzoom(_oService.m_iWndIndex, 0)) {
					oWnd.bEzoom = true;
				}
			}
		},
		// 区域曝光
		enableRegionExposure: function () {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			if (oWnd.bRegionExposure) {
				if (0 === _oPlugin.disableEzoom(iWndIndex)) {
					oWnd.bRegionExposure = false;
				}
			} else {
				_oService.disableEzoom(_oPlugin);// 功能互斥处理
				if (0 === _oPlugin.enableEzoom(iWndIndex, 1)) {
					oWnd.bRegionExposure = true;
				}
			}
		},
		// 区域聚焦
		enableRegionFocus: function () {
			var self = this,
				oWnd = _oService.m_aWndList[_oService.m_iWndIndex];

			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			if (oWnd.bRegionFocus) {
				if (0 === _oPlugin.disableEzoom(iWndIndex)) {
					oWnd.bRegionFocus = false;
				}
			} else {
				_oService.disableEzoom(_oPlugin);// 功能互斥处理
				if (0 === _oPlugin.enableEzoom(iWndIndex, 1)) {
					oWnd.bRegionFocus = true;
				}
			}
		},
		//上一页
		prevPage: function () {
			var self = this;
			var iWndNum = _oService.m_iWndSplitMode * _oService.m_iWndSplitMode;
			var iTotalNum = _oService.m_aChannelList.length;
			var iTotalPageNum = Math.ceil(iTotalNum / iWndNum);
			var iExtraNum = iTotalNum % iWndNum;
			if (self.m_iCurPage === 0) {
				var iCurPage = 0;
			} else {
				var iCurPage = iTotalPageNum - self.m_iCurPage + 1;
			}
			if (iCurPage === iTotalPageNum) {
				iCurPage = 0;
			}
			if (_oService.m_oWndParams.bHasWndPlay) {
				self.startPlayAll();
			}
			if (iExtraNum > 0) {
				if (iCurPage === 0) {
					for (var i = 0; i < iExtraNum; i++) {
						self.startPlay(iTotalNum - i - 1, iExtraNum - i - 1);
					}
				} else {
					for (var i = iExtraNum + (iCurPage - 1) * iWndNum; i < iTotalNum; i++) {
						if (i < iExtraNum + (iCurPage - 1) * iWndNum + iWndNum) {
							self.startPlay(iTotalNum - i - 1, iWndNum - (i - (iExtraNum + (iCurPage - 1) * iWndNum)) - 1);
						}
					}
				}
			} else {
				for (var i = iCurPage * iWndNum; i < iTotalNum; i++) {
					if (i < iCurPage * iWndNum + iWndNum) {
						self.startPlay(iTotalNum - i - 1, iWndNum - (i - iCurPage * iWndNum) - 1);
					}
				}
			}
			if (iCurPage * iWndNum < iTotalNum) {
				self.m_iCurPage = iTotalPageNum - iCurPage;
			}
		},
		//下一页
		nextPage: function () {
			var self = this;
			var iWndNum = _oService.m_iWndSplitMode * _oService.m_iWndSplitMode;
			var iTotalNum = _oService.m_aChannelList.length;
			var iTotalPageNum = Math.ceil(iTotalNum / iWndNum);
			if (self.m_iCurPage === iTotalPageNum) {
				self.m_iCurPage = 0;
			}
			if (_oService.m_oWndParams.bHasWndPlay) {
				self.startPlayAll();
			}
			for (var i = self.m_iCurPage * iWndNum; i < iTotalNum; i++) {
				if (i < (self.m_iCurPage * iWndNum + iWndNum)) {
					self.startPlay(i, i - self.m_iCurPage * iWndNum);
				}
			}
			if ((self.m_iCurPage) * iWndNum < iTotalNum) {
				self.m_iCurPage++;
			}
		},
		sizeChange: function (iSizeMode) {
			var bCorridor = false;
			var iWndIndex = _oService.m_iWndIndex;
			var oWnd = _oService.m_aWndList[iWndIndex];
			var iChannelIndex = oWnd.iChannelPlayIndex;
			if (iChannelIndex >= 0) {
				var oChannel = _oService.m_aChannelList[iChannelIndex];
				bCorridor = oChannel.bCorridor;
			}

			_oService.m_iWndSizeMode = iSizeMode;
			$(".plugin").css({"background": "#ffffff"});
			var iWidth = $("#plugin").width();
			var iHeight = $("#plugin").height();
			if (iSizeMode === 1) {
				if (bCorridor) {
					if (4 * iWidth / iHeight > 3) {
						$("#main_plugin").width(iHeight * 3 / 4).height(iHeight);
					} else {
						$("#main_plugin").width(iWidth).height(iWidth * 4 / 3);
					}
				} else {
					if (3 * iWidth / iHeight > 4) {
						$("#main_plugin").width(iHeight * 4 / 3).height(iHeight);
					} else {
						$("#main_plugin").width(iWidth).height(iWidth * 3 / 4);
					}
				}
			} else if (iSizeMode === 2) {
				if (bCorridor) {
					if (16 * iWidth / iHeight > 9) {
						$("#main_plugin").width(iHeight * 9 / 16).height(iHeight);
					} else {
						$("#main_plugin").width(iWidth).height(iWidth * 16 / 9);
					}
				} else {
					if (9 * iWidth / iHeight > 16) {
						$("#main_plugin").width(iHeight * 16 / 9).height(iHeight);
					} else {
						$("#main_plugin").width(iWidth).height(iWidth * 9 / 16);
					}
				}
			} else if (iSizeMode === 3) {
				WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "StreamChannels", null, {
					async: false,
					success: function (status, xmlDoc) {
						var xmlStreamingChannel = $(xmlDoc).find("StreamingChannel").eq(_oService.m_iStreamType);
						iWidth = parseInt($(xmlStreamingChannel).find("videoResolutionWidth").eq(0).text(), 10);
						iHeight = parseInt($(xmlStreamingChannel).find("videoResolutionHeight").eq(0).text(), 10);
					}
				});

				if (bCorridor) {
					var iTmp = iWidth;
					iWidth = iHeight;
					iHeight = iTmp;
				}
				$("#main_plugin").width(iWidth).height(iHeight);
			} else if (iSizeMode === 4) {
				$("#main_plugin").width(iWidth).height(iHeight);
			}
		},
		streamChange: function (iStreamType) {
			var self = this;
			$("#btn_stream_type i").eq(0).removeClass().addClass("icon-stream-" + iStreamType);
			_oService.m_iStreamType = iStreamType - 1;
			//更新所有通道绑定的码流类型
			for (var i = 0; i < _oService.m_aChannelList.length; i++) {
				_oService.m_aChannelList[i].iStreamType = iStreamType - 1;
			}
			if(_oService.m_aWndList[_oService.m_iWndIndex].bPlay) {
				if (_oService.m_iPluginType !== 4) {
					self.pluginChange(_oService.m_iPluginType);
				}
			}
		},
		channelStreamChange: function (iChannelIndex, iStreamType) {
			var self = this;
			var oChannel = _oService.m_aChannelList[iChannelIndex];
			oChannel.iStreamType = iStreamType;
			var iWndIndex = oChannel.iWndPlayIndex;
			if (iWndIndex > -1) {
				if (_oService.m_aWndList[iWndIndex].bPlay) {
					self.startPlay(iChannelIndex, iWndIndex);
                    setTimeout(function () {
                        self.startPlay(iChannelIndex, iWndIndex);
                        _oChannel.update();
                        _oTool.update();
                        _oPTZ.update();
                    }, 500);
				}
			}
		},
		isPlayOrRecord: function () {
			for (var i = 0; i < 16; i++) {
				if (_oService.m_aWndList[i].bPlay) {
					_oService.m_oWndParams.bHasWndPlay = true;
					break;
				}
				if (i === 15) {
					_oService.m_oWndParams.bHasWndPlay = false;
				}
			}
			for (var i = 0; i < 16; i++) {
				if (_oService.m_aWndList[i].bRecord) {
					_oService.m_oWndParams.bHasWndRecord = true;
					break;
				}
				if (i === 15) {
					_oService.m_oWndParams.bHasWndRecord = false;
				}
			}
		},
		pluginChange: function (iPluginType) {
			var self = this;
			var szUrl = "";
			if (_oService.m_iStreamType === 0) {
				szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iRtspPort + "/ISAPI/streaming/channels/101";
			} else if (_oService.m_iStreamType === 1) {
				szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iRtspPort + "/ISAPI/streaming/channels/102";
			} else {
				szUrl = "rtsp://" + _oCommon.m_szHostName + ":" + _oDevice.m_oDevicePort.iRtspPort + "/ISAPI/streaming/channels/103";
			}
			if (iPluginType !== 3 && !_oCommon.m_bAnonymous) {
                szUrl += "?auth=" +  _oCommon.m_szNamePwd;
			}
			//VLC在匿名登录时需要特殊处理
			if (iPluginType === 2 && _oCommon.m_bAnonymous) {
				szUrl += "?auth=" + _oBase64.encode("anonymous:******");
			}

			//关闭webcomponents开启的预览，否则再切换回来时会有问题
			//如：webcomponents开启声音，切换到quicktime，再切换回来，就打不开声音了
			if (_oService.m_oWndParams.bHasWndPlay) {
				self.stopPlayAll();
			}
			
			//关闭对讲
			if (_oService.m_oWndParams.bTalking) {
				self.enableTalk(0);
			}

			if(iPluginType === 1) {
				$("#main_plugin").html("");
				$("#main_plugin").html("<embed id='PreviewActiveX' src='preview.asp' type='video/quicktime' width='100%' height='100%' autoplay='true' qtsrc='" + szUrl + "' target='myself' scale='tofit' controller='false' pluginspage='http://www.apple.com/quicktime/download/' loop='false'>");
			} else if(iPluginType === 4) {
				_oService.m_aWndList[_oService.m_iWndIndex].bPlay = false;
				_oService.m_aWndList[_oService.m_iWndIndex].iChannelId = -1;
				_oService.m_aWndList[_oService.m_iWndIndex].iChannelPlayIndex = -1;
				_oService.m_aChannelList[0].bPlay = false;
				$(".plugin #main_plugin").css("background", "#343434");
				$("#main_plugin").html("");
				_oPlugin.initPlugin(2, "", _oService.m_iWndSplitMode);
				setTimeout(function () {
					self.startPlay(0, _oService.m_iWndIndex, true);
					_oTool.update();
					_oPTZ.update();
				}, 100);
			} else if(iPluginType === 2) {
				$("#main_plugin").html("");
				$("#main_plugin").html("<embed id='PreviewActiveX' type='application/x-vlc-plugin' width='100%' height='100%' target='" + szUrl + "' autoplay='yes' controller='false' loop='no' volume='50' toolbar='false'>");
			} else if(iPluginType === 3) {
				$("#main_plugin").html("");
				$("#main_plugin").html("<img id='PreviewActiveX' src='/Streaming/channels/1/preview' width='100%' height='100%'>");
			}
			if(iPluginType !== 4) {
				_oService.m_aWndList[_oService.m_iWndIndex].bPlay = true;
				_oService.m_aWndList[_oService.m_iWndIndex].iChannelId = 1;
				_oService.m_aWndList[_oService.m_iWndIndex].iChannelPlayIndex = 0;
				_oService.m_aChannelList[0].bPlay = true;
				$(".tool-r").hide();
				$("#btn_talk_change").hide();
			} else {
				$(".tool-r").show();
				$("#btn_talk_change").show();
			}
			if(iPluginType !== 4) {
				$(".plugin #main_plugin").css("background", "#ffffff");
				$("#PreviewActiveX").css("height", "99.5%");
			}
			_oService.m_iPluginType = iPluginType;
		},
		checkPlugins: function () {
			var aPlugins = new Array();
			if ($.browser.msie) {
				var obj = null;
				try {
					obj = new ActiveXObject("WebVideoActiveX.WebVideoActiveXCtrl.1");
					aPlugins.push("webcomponents");
				} catch (e) {
				}
				try {
					obj = new ActiveXObject("QuickTimeCheckObject.QuickTimeCheck.1");
					aPlugins.push("quicktime");
				} catch (e) {
				}
				//IE 下VLC会崩溃
				/*try {
				 var obj = new ActiveXObject("VideoLAN.VLCPlugin.2");
				 aPlugins.push("vlc");
				 } catch(e) {
				 }*/
			} else {
				for (var i = 0, len = navigator.mimeTypes.length; i < len; i++) {
					if (navigator.mimeTypes[i].type.toLowerCase() == "application/hwp-webvideo-plugin") {
						aPlugins.push("webcomponents");
					}
					if (navigator.mimeTypes[i].type.toLowerCase() == "application/x-vlc-plugin") {
						aPlugins.push("vlc");
					}
					if (navigator.mimeTypes[i].type.toLowerCase() == "video/quicktime") {
						aPlugins.push("quicktime");
					}
				}
				aPlugins.push("mjpeg");
				if(_oService.m_bChromeNotSupportNpapi) {
					aPlugins.push("webcomponents");
				}
			}
			return aPlugins;
		},
		// 选中窗口
		getSelectWndInfo: function (iWndIndex) {
			var self = this,
				oWnd = _oService.m_aWndList[iWndIndex];

			_oChannel.m_iChannelId = oWnd.iChannelId;
			_oChannel.switchChannel();// 切换通道变色

			_oTool.hideSound();

			// 更新窗口对应通道的能力
			self.updateChannelCap(iWndIndex);
		},
		// 更新通道能力
		updateChannelCap: function (iWndIndex) {
			var oImageCap, oPTZChanelCap;

			if (iWndIndex != _oService.m_iWndIndex) {
				return;
			}

			var iChannelId = _oService.m_aWndList[iWndIndex].iChannelId;
			if (iChannelId > -1 && !_oCommon.m_bAnonymous) {
				oImageCap = _oDevice.getImageCap(iChannelId);
				oPTZChanelCap = _oDevice.getPTZChanelCap(iChannelId);
			} else {
				oImageCap = {
					bSupportRegionalExposure: false,
					bSupportRegionalFocus: false
				};
				oPTZChanelCap = {
					bSupportPosition3D: false,
					bSupportWiperStatus: false
				};
			}

			_oTool.updateChannelCap(oImageCap);
			_oPTZ.updateChannelCap(oPTZChanelCap);
		}
	};
	module.exports = new Preview();
});