define(function (require, exports, module) {

	var _oOption, _oService, _oDevice, _oPlugin, _oDialog, _oTranslator, _szType, _$scope, _oCommon;

	require("ui.slider");
	require("ui.jquery");

	_oService = require("service");
	_oDevice = require("isapi/device");
	_oPlugin = require("common/plugin");
	_oDialog = require("dialog");
	_oTranslator = require("translator");
	_oCommon = require("common");

	function Tool() {
		_oOption = {
			onPlay: null,
			onReversePlay: null,
			onStop: null,
			onSlow: null,
			onFast: null,
			onFrame: null,
			onStopAll: null,
			onCapture: null,
			onRecord: null,
			onArrangeWindow: null,
			onPlayAll: null,
			onRecordAll: null,
			onEnableEzoom: null,
			onEnableRegionExposure: null,
			onEnableRegionFocus: null,
			onFullScreen: null,
			onPrevPage: null,
			onNextPage: null,
			onOpenTransCode: null,
			onChangeTransCode: null,
			onSizeChange: null,
			onStreamChange: null,
			onPluginChange: null,
			onTalkChange: null,
			onOpenDownload: null
		};
	}

	Tool.prototype = {
		init: function (szID, szType, oOption) {
			var oToolApp = angular.module("toolApp", ["ui.jquery"]),
				self = this;

			// 可选参数合并
			$.extend(_oOption, oOption);

			oToolApp.controller("toolController", function ($scope) {
				_szType = szType;
				_$scope = $scope;

				$scope.oLanTool = _oTranslator.oLastLanguage;
				$scope.bPreview = "preview" == _szType ? true : false;
				$scope.aWndList = _oService.m_aWndList;
				$scope.oWndGloableParams = _oService.m_oWndParams;
				$scope.iWndSplitMode = _oService.m_iWndSplitMode;
				$scope.iPluginType = _oService.m_iPluginType;
                $scope.bSupportPanomicMap = _oDevice.m_oDeviceCapa.oPanorama && _oDevice.m_oDeviceCapa.oPanorama.bSupport;
                $scope.bExpendPanoramicMap = false;

				// 工具条页面加载完毕触发
				$scope.toolLoaded = function () {
					if (!$scope.bPreview) {// 回放
						//_oDevice.getDeviceCapa();

						var bSupportTransCode = true;
						if (_oCommon.m_szHttpProtocol === "http://") {
							bSupportTransCode = _oDevice.m_oSHttpCapa.bSupportShttpPlaybackTransCode;
						} else {
							bSupportTransCode = _oDevice.m_oSHttpCapa.bSupportShttpsPlaybackTransCode;
						}

						// 按钮显示状态
						$scope.oBtnShow = {
							bTranscoding: bSupportTransCode,
							bReversePlay: _oDevice.m_oDeviceCapa.bSupportReversePlayback,
							//bPicDownload: _oDevice.m_oDeviceCapa.bSupportPicDown,
							bWndSplit: true,
							bChannelList: true,
							bRegionExposure: false,
							bRegionFocus: false,
							bEzoom: !_oDevice.m_oDeviceCapa.bPTZ && !_oService.m_bChromeNotSupportNpapi,
							bSupportRecord: !_oService.m_bChromeNotSupportNpapi,
							bSupportFrame: !_oService.m_bChromeNotSupportNpapi,
                            bSupportCapture: !_oService.m_bChromeNotSupportNpapi
						};
						// 转码-分辨率
						$scope.aTransCodeResolution = _oDevice.m_oSHttpCapa.aTransCodeResolution;
					} else {
						_oDevice.getTalkInfo();
						$scope.iTalkNum = _oDevice.m_oDeviceCapa.iTaklNum;
						$scope.iStreamNum = _oDevice.getChannelStreamNum(1);//目前写死通道1只是临时方案，后端多通道切换时，这里需要刷新，需要重新编译tool
						// 按钮显示状态
						$scope.oBtnShow = {
							bWndSplit: !(self.m_iAnalogChNum + self.m_iDigitalChNum === 1),
							bWndSize: false,  // 前端支持
							bChannelList: true,
							bRegionExposure: false,
							bRegionFocus: false,
							bEzoom: !_oDevice.m_oDeviceCapa.bPTZ && !_oService.m_bChromeNotSupportNpapi,
							bSingleChannel: _oService.isSingleChannel(),
							bSupportRecord: !_oService.m_bChromeNotSupportNpapi,
							bSupportFrame: !_oService.m_bChromeNotSupportNpapi,
                            bNotSupportTalk: _oService.m_bChromeNotSupportNpapi && location.protocol !== 'https:',
                            bSupportCapture: !_oService.m_bChromeNotSupportNpapi
						};
					}

					if (_oService.isSingleChannel()) {// 单通道按钮处理
						$scope.oBtnShow.bWndSplit = false;
						$scope.oBtnShow.bWndSize = true;
						$scope.oBtnShow.bChannelList = false;
					}

					$scope.oBtnShow.bSupportAudio = _oDevice.m_oDeviceCapa.bSupportAudio;//是否支持声音
				};

				// 窗口分割切换
				$scope.onWndSplit = function (iWndSplit) {
					$("#btn_wnd_split i").eq(0).removeClass().addClass("icon-wnd-" + iWndSplit);

					_oService.m_iWndSplitMode = iWndSplit;
					_oPlugin.arrangeWindow(iWndSplit);

					if (_oOption.onArrangeWindow) {
						_oOption.onArrangeWindow(iWndSplit);
					}
				};

				$scope.onSizeChange = function (iSizeMode) {
					$("#btn_size_change i").eq(0).removeClass().addClass("icon-size-" + iSizeMode);
					_oService.m_iWndSizeMode = iSizeMode;
					if (_oOption.onSizeChange) {
						_oOption.onSizeChange(iSizeMode);
					}
				};
				$scope.onStreamChange = function (iStreamType) {
					if (_oOption.onStreamChange) {
						_oOption.onStreamChange(iStreamType);
					}
				};
				$scope.onPluginChange = function (iPluginType) {
					$("#btn_plugin_type i").eq(0).removeClass().addClass("icon-plugin-" + iPluginType);
					if (_oOption.onPluginChange) {
						_oOption.onPluginChange(iPluginType);
					}
				};
				$scope.onTalkChange = function (iTalkNum) {
					if (_oOption.onTalkChange) {
						_oDevice.getTalkInfo();
						_oOption.onTalkChange(iTalkNum, _oDevice.m_oDeviceCapa.m_szaudioCompressionType, _oDevice.m_oDeviceCapa.m_iAudioBitRate, _oDevice.m_oDeviceCapa.m_iAudioSamplingRate);
					}
				};
				// 切换转码开启/关闭
				$scope.onOpenTransCode = function () {
					if (_oOption.onOpenTransCode) {
						return _oOption.onOpenTransCode();
					}
				};
				// 转码参数改变
				$scope.onChangeTransCode = function (iTransCodeResolution, iTransCodeBitrate, iTransCodeFrame) {
					if (_oOption.onChangeTransCode) {
						_oOption.onChangeTransCode(iTransCodeResolution, iTransCodeBitrate, iTransCodeFrame);
					}
				};
				// 声音大小改变
				$scope.onChangeSound = function (iVolume) {
					var iWndIndex = _oService.m_iWndIndex;
					_oPlugin.setVolume(iWndIndex, iVolume);
				};
				// 打开声音
				$scope.onOpenSound = function () {
					var iWndIndex = _oService.m_iWndIndex,
						oWnd = _oService.m_aWndList[iWndIndex],
						iSoundWndIndex = _oService.m_oWndParams.iSoundWndIndex;

					if (!oWnd.bPlay) {
						return;
					}

					if (iSoundWndIndex > -1) {// 如果有窗口打开着声音，则关闭声音
						if (0 == _oPlugin.closeSound()) {
							_oService.m_oWndParams.iSoundWndIndex = -1;
						}
					}

					if (iWndIndex != iSoundWndIndex) {// 窗口索引不是同一个，则打开声音
						if (0 === _oPlugin.openSound(iWndIndex)) {
							_oService.m_oWndParams.iSoundWndIndex = iWndIndex;
							return true;
						} else {
							/*var iError = _oPlugin.getLastError();
							 if (25 === iError) {// 声音设备被占用
							 _oDialog.tip(_oTranslator.getValue("openSoundFailed"));
							 }*/
							_oDialog.tip(_oTranslator.getValue("openSoundFailed"));
							return false;
						}
					}
				};

				// 开启回放
				$scope.play = function () {
					if (_oOption.onPlay) {
						_oOption.onPlay();
					}
				};
				// 开启全部预览
				$scope.playAll = function () {
					if (_oOption.onPlayAll) {
						_oOption.onPlayAll();
					}
				};
				// 开启全部录像
				$scope.recordAll = function () {
					if (_oOption.onRecordAll) {
						_oOption.onRecordAll();
					}
				};
				$scope.prevPage = function () {
					if (_oOption.onPrevPage) {
						_oOption.onPrevPage();
					}
				};
				$scope.nextPage = function () {
					if (_oOption.onNextPage) {
						_oOption.onNextPage();
					}
				};
				//电子放大
				$scope.enableEzoom = function () {
					if (_oOption.onEnableEzoom) {
						_oOption.onEnableEzoom();
					}
				};
				//区域曝光
				$scope.enableRegionExposure = function () {
					if (_oOption.onEnableRegionExposure) {
						_oOption.onEnableRegionExposure();
					}
				};
				//区域聚焦
				$scope.enableRegionFocus = function () {
					if (_oOption.onEnableRegionFocus) {
						_oOption.onEnableRegionFocus();
					}
				};
				//全屏
				$scope.fullScreen = function () {
					_oPlugin.fullScreen();
				};
				// 倒放
				$scope.reversePlay = function () {
					if (_oOption.onReversePlay) {
						_oOption.onReversePlay();
					}
				};
				// 停止回放
				$scope.stop = function () {
					if (_oOption.onStop) {
						_oOption.onStop();
					}
				};
				// 减速
				$scope.slow = function () {
					if (_oOption.onSlow) {
						_oOption.onSlow();
					}
				};
				// 加速
				$scope.fast = function () {
					if (_oOption.onFast) {
						_oOption.onFast();
					}
				};
				// 单帧
				$scope.frame = function () {
					if (_oOption.onFrame) {
						_oOption.onFrame();
					}
				};
				// 停止所有回放
				$scope.stopAll = function (iWndIndex) {
					if (_oOption.onStopAll) {
						_oOption.onStopAll();
					}
				};
				// 抓图
				$scope.capture = function () {
					if (_oOption.onCapture) {
						_oOption.onCapture();
					}
				};
				// 开始录像、剪辑
				$scope.record = function (iWndIndex) {
					if (_oOption.onRecord) {
						_oOption.onRecord();
					}
				};
				//打开下载
				$scope.openDownload = function () {
					if (_oOption.onOpenDownload) {
						_oOption.onOpenDownload();
					}
				};

                $scope.openPanoramicMap = function() {
                    $scope.bExpendPanoramicMap = !$scope.bExpendPanoramicMap;
                    try {
                        angular.element("#panoramicMap").get(0).contentWindow.ParanomicMap.resetParentIframeWH($scope.bExpendPanoramicMap);
                    } catch (e){}
                };

				// 按钮禁用状态
				$scope.oBtnDisabled = {
					bSlow: true,
					bFast: true,
					bFrame: true,
					bCapture: true,
					bRecord: true,
					bSound: true,
					bEzoom: false,
					//bZoom3d: false,
					//bManualtrackin: false,
					//bRegionExposure: false,
					//bRegionFocus: false,
					bPrevPage: false,
					bNextPage: false
				};

				// 按钮样式
				$scope.oBtnClass = {
					bTranscoding: false,
					bPlay: false,
					bReversePlay: false,
					bRecord: false,
					bSound: true,
					bHasPlay: false,
					bHasRecord: false,
					bEzoom: false,
					bRegionExposure: false,
					bRegionFocus: false
				};

				// 按钮Title提示
				$scope.oBtnTitle = {
					szPlay: "",
					szReversePlay: "",
					szClip: "",
					szSound: "",
					szHasPlay: "",
					szHasRecord: "",
					szZoom: "",
					szRegExposure: "",
					szRegFocus: ""
				};

				// 监听窗口列表
				$scope.$watch("aWndList", function (to, from) {
					self.update(true);
				}, true);

				// 监听窗口参数
				$scope.$watch("oWndGloableParams", function (to, from) {
					self.update(true);
				}, true);

                //全景地图
                /*$scope.panoramicMap = $scope.$watch("bSupportPanomicMap", function(to){
                    if(to === true) {
                        $("#panoramicMap").attr("src", "panorama/panorama.asp");
                        //$scope.panoramicMap();
                    }
                })*/
			});

			angular.bootstrap(angular.element("#" + szID), ["toolApp"]);
		},
		// 更新通道能力
		updateChannelCap: function (oCap) {
			_$scope.oBtnShow.bRegionExposure = oCap.bSupportRegionalExposure;
			_$scope.oBtnShow.bRegionFocus = oCap.bSupportRegionalFocus;
		},
		// 更新工具条按钮状态
		update: function (bWatch) {
			var self = this,
				iWndIndex = _oService.m_iWndIndex,
				oWnd = _oService.m_aWndList[iWndIndex];

			if ("preview" == _szType) {// 预览工具条状态
				_$scope.oBtnClass.bHasPlay = _$scope.oWndGloableParams.bHasWndPlay;
				_$scope.oBtnClass.bHasRecord = _$scope.oWndGloableParams.bHasWndRecord;
				_$scope.oBtnTitle.szHasPlay = _$scope.oBtnClass.bHasPlay ? _$scope.oLanTool.stopAllView : _$scope.oLanTool.startAllView;
				if (_$scope.oBtnShow && _$scope.oBtnShow.bChannelList) {
					_$scope.oBtnTitle.szHasPlay = _$scope.oBtnClass.bHasPlay ? _$scope.oLanTool.stopAllView : _$scope.oLanTool.startAllView;
					_$scope.oBtnTitle.szHasRecord = _$scope.oBtnClass.bHasRecord ? _$scope.oLanTool.stopAllRecord : _$scope.oLanTool.startAllRecord;
				} else {
					_$scope.oBtnTitle.szHasPlay = _$scope.oBtnClass.bHasPlay ? _$scope.oLanTool.stopView : _$scope.oLanTool.startView;
					_$scope.oBtnTitle.szHasRecord = _$scope.oBtnClass.bHasRecord ? _$scope.oLanTool.stopRecord : _$scope.oLanTool.startRecord;
				}
				_$scope.oBtnTitle.talkTips = _oService.m_oWndParams.bTalking ? _$scope.oLanTool.stopTalk : _$scope.oLanTool.startTalk;
				_$scope.oBtnTitle.pluginTips = _$scope.oLanTool.pluginChange;
				_$scope.iStreamType = _oService.m_iStreamType;
				if (oWnd.bPlay) {
					_$scope.oBtnDisabled.bCapture = false;
					_$scope.oBtnDisabled.bEzoom = false;
					_$scope.oBtnDisabled.bSound = false;
					//_$scope.oBtnDisabled.bZoom3d = false;
					//_$scope.oBtnDisabled.bManualtrackin = false;
					//_$scope.oBtnDisabled.bRegionExposure = false;
					//_$scope.oBtnDisabled.bRegionFocus = false;

					if (oWnd.bEzoom) {
						_$scope.oBtnClass.bEzoom = true;
						_$scope.oBtnTitle.szZoom = _$scope.oLanTool.disableZoom;
					} else {
						_$scope.oBtnClass.bEzoom = false;
						_$scope.oBtnTitle.szZoom = _$scope.oLanTool.enableZoom;
					}
					if (oWnd.bRegionExposure) {
						_$scope.oBtnClass.bRegionExposure = true;
						_$scope.oBtnTitle.szRegionExposure = _$scope.oLanTool.stopRegionExposure;
					} else {
						_$scope.oBtnClass.bRegionExposure = false;
						_$scope.oBtnTitle.szRegionExposure = _$scope.oLanTool.startRegionExposure;
					}
					if (oWnd.bRegionFocus) {
						_$scope.oBtnClass.bRegionFocus = true;
						_$scope.oBtnTitle.szRegionFocus = _$scope.oLanTool.stopRegionFocus;
					} else {
						_$scope.oBtnClass.bRegionFocus = false;
						_$scope.oBtnTitle.szRegionFocus = _$scope.oLanTool.startRegionFocus;
					}
					_$scope.oBtnClass.bSound = _oService.m_oWndParams.iSoundWndIndex == iWndIndex;
				} else {
					_$scope.oBtnDisabled.bCapture = true;
					_$scope.oBtnDisabled.bEzoom = true;
					_$scope.oBtnDisabled.bSound = true;
					//_$scope.oBtnDisabled.bZoom3d = true;
					//_$scope.oBtnDisabled.bManualtrackin = true;
					//_$scope.oBtnDisabled.bRegionExposure = true;
					//_$scope.oBtnDisabled.bRegionFocus = true;

					_$scope.oBtnClass.bEzoom = false;
					_$scope.oBtnClass.bSound = false;

					_$scope.oBtnTitle.szZoom = _$scope.oLanTool.enableZoom;
				}
				_$scope.oBtnDisabled.bNextPage = _oService.m_iWndSplitMode * _oService.m_iWndSplitMode >= _oService.m_aChannelList.length;
				_$scope.oBtnDisabled.bPrevPage = _$scope.oBtnDisabled.bNextPage;
			} else {// 回放工具条状态
				_$scope.oBtnClass.bTranscoding = oWnd.bTranscoding;

				_$scope.oBtnTitle.szClip = oWnd.bRecord ? _$scope.oLanTool.stopClip : _$scope.oLanTool.startClip;

				if (oWnd.bPlay || oWnd.bReversePlay) {// 播放、倒放
					if (oWnd.bEzoom) {
						_$scope.oBtnClass.bEzoom = true;
						_$scope.oBtnTitle.szZoom = _$scope.oLanTool.disableZoom;
					} else {
						_$scope.oBtnClass.bEzoom = false;
						_$scope.oBtnTitle.szZoom = _$scope.oLanTool.enableZoom;
					}
				} else {
					_$scope.oBtnTitle.szZoom = _$scope.oLanTool.enableZoom;
				}

				if (oWnd.bPlay) {// 播放
					_$scope.oBtnClass.bPlay = true;
					_$scope.oBtnClass.bReversePlay = false;
					_$scope.oBtnClass.bRecord = oWnd.bRecord;
					_$scope.oBtnClass.bSound = _oService.m_oWndParams.iSoundWndIndex == iWndIndex;

					_$scope.oBtnDisabled.bSlow = false;
					_$scope.oBtnDisabled.bFast = false;
					_$scope.oBtnDisabled.bFrame = false;
					_$scope.oBtnDisabled.bCapture = false;
					_$scope.oBtnDisabled.bEzoom = false;
					_$scope.oBtnDisabled.bRecord = false;
					_$scope.oBtnDisabled.bSound = false;

					_$scope.oBtnTitle.szPlay = _$scope.oLanTool.pause;

					if (oWnd.bPause) {// 暂停
						_$scope.oBtnClass.bPlay = false;

						_$scope.oBtnDisabled.bSlow = true;
						_$scope.oBtnDisabled.bFast = true;
						_$scope.oBtnDisabled.bFrame = true;
						_$scope.oBtnDisabled.bRecord = true;

						_$scope.oBtnTitle.szPlay = _$scope.oLanTool.play;
					} else if (oWnd.bFrame) {// 单帧
						_$scope.oBtnClass.bPlay = false;

						_$scope.oBtnDisabled.bSlow = true;
						_$scope.oBtnDisabled.bFast = true;
						_$scope.oBtnDisabled.bRecord = true;

						_$scope.oBtnTitle.szPlay = _$scope.oLanTool.play;
					}
				} else if (oWnd.bReversePlay) {// 倒放
					_$scope.oBtnClass.bPlay = false;
					_$scope.oBtnClass.bReversePlay = true;
					_$scope.oBtnClass.bRecord = oWnd.bRecord;
					_$scope.oBtnClass.bSound = _oService.m_oWndParams.iSoundWndIndex == iWndIndex;

					_$scope.oBtnDisabled.bSlow = true;
					_$scope.oBtnDisabled.bFast = true;
					_$scope.oBtnDisabled.bFrame = true;
					_$scope.oBtnDisabled.bCapture = false;
					_$scope.oBtnDisabled.bEzoom = false;
					_$scope.oBtnDisabled.bRecord = true;
					_$scope.oBtnDisabled.bSound = true;

					_$scope.oBtnTitle.szReversePlay = _$scope.oLanTool.pause;

					if (oWnd.bPause) {// 暂停
						_$scope.oBtnClass.bReversePlay = false;

						_$scope.oBtnTitle.szReversePlay = _$scope.oLanTool.reversePlay;
					}
				} else {// 停止
					_$scope.oBtnClass.bPlay = false;
					_$scope.oBtnClass.bReversePlay = false;
					_$scope.oBtnClass.bRecord = false;
					_$scope.oBtnClass.bSound = false;
					_$scope.oBtnClass.bEzoom = false;

					_$scope.oBtnDisabled.bSlow = true;
					_$scope.oBtnDisabled.bFast = true;
					_$scope.oBtnDisabled.bFrame = true;
					_$scope.oBtnDisabled.bCapture = true;
					_$scope.oBtnDisabled.bEzoom = true;
					_$scope.oBtnDisabled.bRecord = true;
					_$scope.oBtnDisabled.bSound = true;

					_$scope.oBtnTitle.szPlay = _$scope.oLanTool.play;
					_$scope.oBtnTitle.szReversePlay = _$scope.oLanTool.reversePlay;
				}
			}
			_$scope.oBtnTitle.szSound = _oService.m_oWndParams.iSoundWndIndex == iWndIndex ? _$scope.oLanTool.audioOn : _$scope.oLanTool.mute;
			_$scope.iPluginType = _oService.m_iPluginType;

			if (!bWatch) {// 如果不是$watch调用的，需要更新
				if (!_$scope.$$phase) {
					_$scope.$digest();
				}
			}
		},
		// 隐藏声音控制条
		hideSound: function () {
			$("#pop_sound, #iframe_sound").hide();
		}
	};

	module.exports = new Tool();
});