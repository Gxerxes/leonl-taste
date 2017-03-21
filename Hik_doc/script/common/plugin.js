define(function (require, exports, module) {
	var _oTranslator, _oUtils, _oPlugin, _oOption, _oService, _oDialog, _iTimer;

	_oTranslator = require("translator");
	_oUtils = require("utils");
	_oService = require("service");
	_oDialog = require("lib/dialog");
	_oCommon = require("common");
	require("lib/jquery/html5/zip.js");
	require("lib/jquery/html5/jquery.PnaclPlugin");

	function Plugin() {
		_oPlugin = null;
		_oOption = {
			onGetSelectWndInfo: null,
			onPluginEventHandler: null,
			onZoomInfoCallback: null
		};
	}

	Plugin.prototype = {
		init: function (szID, iWndType, oOption) {
			var oPluginApp = angular.module("pluginApp", []),
				self = this;

			// 可选参数合并
			$.extend(_oOption, oOption);

			oPluginApp.controller("pluginController", function ($scope) {
				$scope.pluginLoaded = function () {
					_oService.m_oLoaded.bPlugin = true;

					self.initPluginEvent();
					self.initPlugin(2, "", iWndType);
				};
			});

			angular.bootstrap(angular.element("#" + szID), ["pluginApp"]);
		},
        //iType:表示插入插件的位置，0表示本地配置或远程升级等，1表示字符叠加等，2表示预览节界面
		initPlugin: function (iType, szInfo, iWndType, szPlayMode, iNeedBorder) {
			var self = this,
				iDrawBorder = 1; //需要绘制边框

			if (iNeedBorder != "" && typeof iNeedBorder != 'undefined' || iNeedBorder != null) {
				iDrawBorder = iNeedBorder;
			}
			var arrPlayMode = {
				normal: 0,
				motiondetect: 1,
				tamperdetect: 2,
				privacymask: 3,
				textoverlay: 4,
				osdsetting: 5,
				snapdraw: 6,
				fisheye: 7,
				linedetect: 8,
				fielddetect: 9
			};
			if (!$.browser.msie) {
				if ($("#main_plugin").html() !== "" && $("#PreviewActiveX").length !== 0) {
					var iPlayMode = 0;

					if (szPlayMode != "") {
						iPlayMode = arrPlayMode[szPlayMode];
					}

					_oPlugin.HWP_SetPlayModeType(iPlayMode);
					return true;
				}

				var bInstalled = false;
				for (var i = 0, len = navigator.mimeTypes.length; i < len; i++) {
					if (navigator.mimeTypes[i].type.toLowerCase() == "application/hwp-webvideo-plugin") {
						bInstalled = true;
						if (iType == '0') {
							$("#main_plugin").html("<embed type='application/hwp-webvideo-plugin' id='PreviewActiveX' width='1' height='1' name='PreviewActiveX' align='center' wndtype='" + iWndType + "' playmode='" + szPlayMode + "' needborder='" + iDrawBorder + "'>");
							setTimeout(function () {
								$("#PreviewActiveX").css('height', '0px');
							}, 10); // 避免插件初始化不完全
						} else if (iType == '1') {
							$("#main_plugin").html("<embed type='application/hwp-webvideo-plugin' id='PreviewActiveX' width='100%' height='100%' name='PreviewActiveX' align='center' wndtype='" + iWndType + "' playmode='" + szPlayMode + "' needborder='" + iDrawBorder + "'>");
						} else {
							$("#main_plugin").html("<embed type='application/hwp-webvideo-plugin' id='PreviewActiveX' width='100%' height='100%' name='PreviewActiveX' align='center' wndtype='" + iWndType + "' playmode='" + szPlayMode + "' needborder='" + iDrawBorder + "'>");
						}
						$("#PreviewActiveX").css('width', '99.999999%');
						break;
					}
				}
				if (!bInstalled) {
					if(_oService.m_bChromeNotSupportNpapi) {
						_oPlugin = $("#main_plugin").PnaclWebPlugin({iType: iType, szHostname: _oCommon.m_szHostName});
					} else {
						$("#main_plugin").html("<table width='100%' height='100%'><tr><td class='txtTip'><label class='pluginLink'></label></td></tr></table>");
						var $pluginLabel = $("#main_plugin").find("label").eq(0);
						if (navigator.platform == "Win32") {
							szInfo = _oTranslator.getValue('downloadPlugin');
							$pluginLabel.bind({
								click: function () {
									window.open("../../codebase/WebComponents.exe", "_self");
									self.checkPluginExist();
								},
								mouseenter: function () {
									$(this).attr("class", "pluginLinkSel");
								},
								mouseleave: function () {
									$(this).attr("class", "pluginLink");
								}
							});
						} else if (navigator.platform == "Mac68K" || navigator.platform == "MacPPC" || navigator.platform == "Macintosh") {
							szInfo = _oTranslator.getValue('noPlugin');
							$pluginLabel.css({"cursor": "default", "text-decoration": "none"});
						} else {
							szInfo = _oTranslator.getValue('noPlugin');
							$pluginLabel.css({"cursor": "default", "text-decoration": "none"});
						}
						$pluginLabel.html(szInfo);
						return false;
					}
				}
			} else {
				if ($("#main_plugin").html() !== "" && $("#PreviewActiveX").length !== 0 && $("#PreviewActiveX")[0].object !== null) {
					var iPlayMode = 0;

					if (szPlayMode != "") {
						iPlayMode = arrPlayMode[szPlayMode];
					}

					_oPlugin.HWP_SetPlayModeType(iPlayMode);
					return true;
				}
				$("#main_plugin").html("<object classid='clsid:E7EF736D-B4E6-4A5A-BA94-732D71107808' codebase='' standby='Waiting...' id='PreviewActiveX' width='100%' height='100%' name='ocx' align='center' ><param name='wndtype' value='" + iWndType + "'><param name='playmode' value='" + szPlayMode + "'><param name='needborder' value='" + iDrawBorder + "'></object>");
				var previewOCX = document.getElementById("PreviewActiveX");
				if (previewOCX == null || previewOCX.object == null) {
					$("#main_plugin").html("<table width='100%' height='100%'><tr><td class='txtTip'><label class='pluginLink'></label></td></tr></table>");
					var $pluginLabel = $("#main_plugin").find("label").eq(0);
					if ((navigator.platform == "Win32")) {
						szInfo = _oTranslator.getValue('downloadPlugin');
						$pluginLabel.bind({
							click: function () {
								window.open("../../codebase/WebComponents.exe", "_self");
								self.checkPluginExist();
							},
							mouseenter: function () {
								$(this).attr("class", "pluginLinkSel");
							},
							mouseleave: function () {
								$(this).attr("class", "pluginLink");
							}
						});
					} else {
						szInfo = _oTranslator.getValue('noPlugin');
						$pluginLabel.css({"cursor": "default", "text-decoration": "none"});
					}
					$pluginLabel.html(szInfo);
					return false;
				}
			}
			if($("#PreviewActiveX").get(0)) {
			    _oPlugin = $("#PreviewActiveX").get(0);
				self.compareFileVersion();
			}

			return true;
		},
		// 初始化插件事件
		initPluginEvent: function () {
			var self = this;

			window.GetSelectWndInfo = function (szXml) {
				var oXmlDoc = _oUtils.parseXmlFromStr(szXml),
					iCurWnd = _oUtils.nodeValue(oXmlDoc, "SelectWnd", "i");

				if (iCurWnd == _oService.m_iWndIndex) {
					return;
				}

				_oService.m_iWndIndex = iCurWnd;

				if (_oOption.onGetSelectWndInfo) {
					_oOption.onGetSelectWndInfo(_oService.m_iWndIndex);
				}
			};

			window.PluginEventHandler = function (iEventType, iWndIndex, iParam2) {
				if (_oOption.onPluginEventHandler) {
					_oOption.onPluginEventHandler(iEventType, iWndIndex, iParam2);
				}
			};

			window.GetAllWndInfo = function (szXml) {};

			window.ZoomInfoCallback = function (szXml) {
				if (_oOption.onZoomInfoCallback) {
					_oOption.onZoomInfoCallback(szXml);
				}
			};
			window.PTZCtrlCallback = function (iWndIndex, iMouseActionType, iPTZActionType) {
				if (_oOption.onPTZCtrlCallback) {
					_oOption.onPTZCtrlCallback(iWndIndex, iMouseActionType, iPTZActionType);
				}
			};
		},
		//删除插件对象
		removePlugin: function () {
			$("#PreviewActiveX").remove();
		},
		//检测插件是否存在，如果存在则刷新页面
		checkPluginExist: function () {
			if (_iTimer) {
				clearInterval(_iTimer);
				_iTimer = 0;
			}
			var iTimes = 0; //尝试测试插件是否安装的次数
			_iTimer = setInterval(function () {
				iTimes++;
				if ($.browser.msie) {
					var controlTest = null;
					try {
						controlTest = new ActiveXObject('WebVideoActiveX.WebVideoActiveXCtrl.1');
					} catch (e) {
						controlTest = null;
					}
					if (controlTest != null) {
						clearInterval(_iTimer);
						_iTimer = 0;
						window.location.reload();
					}
				} else {
					window.navigator.plugins.refresh(false); // 刷新浏览器插件,true- 刷新应该重新加载包含<EMBED>标记的任何页面,false-不刷新（默认）。
					var len = navigator.mimeTypes.length;
					for (var i = 0; i < len; i++) {
						if (navigator.mimeTypes[i].type.toLowerCase() == "application/hwp-webvideo-plugin") {
							clearInterval(_iTimer);
							_iTimer = 0;
							window.location.reload();
						}
					}
				}
				//24 * 5秒（2分钟）后停止检测
				if (iTimes >= 24) {
					clearInterval(_iTimer);
					_iTimer = 0;
				}
			}, 5000);
		},
		// 文件版本比较
		compareFileVersion: function () {
			if (null == _oPlugin) {
				return;
			}

			var szXml = "", bRes;

			$.ajax({
				url: "../../codebase/version.xml?version=" + seajs.web_version,
				type: "GET",
				async: false,
				dataType: "xml",
				success: function (xmlDoc, textStatus, xhr) {
					szXml = xhr.responseText;
				}
			});

			bRes = _oPlugin.HWP_CheckPluginUpdate(szXml);
			if (bRes) {
				var bUpdateTips = $.cookie("updateTips");
				var szUpdate = "";
				if (bUpdateTips != "false") {
					if ("Win32" === navigator.platform) {
						szUpdate = _oTranslator.getValue("updatePlugin");
						_oDialog.confirm(szUpdate, null, function () {
							window.open("../../codebase/WebComponents.exe", "_self");
						}, function () {
							$.cookie("updateTips", "false");
						});
					} else {
						szUpdate = _oTranslator.getValue("updateNotWin32");
						_oDialog.alert(szUpdate);
						$.cookie("updateTips", "false");
					}
				}
			}
		},
		// 获取本地配置
		getLocalConfig: function () {
			var self = this,
				szConfig = "";

			if (_oPlugin) {
				szConfig = _oPlugin.HWP_GetLocalConfig();
			}

			return szConfig;
		},
		// 设置本地配置
		setLocalConfig: function (szXml) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetLocalConfig(szXml);
			}

			return iRet;
		},
		// 设置转码回放参数
		setTrsPlayBackParam: function (iWndIndex, szXml) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetTrsPlayBackParam(iWndIndex, szXml);
			}

			return iRet;
		},
		// 预览、回放
		play: function (szUrl, szNamePwd, iWndIndex, szStartTime, szStopTime) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_Play(szUrl, szNamePwd, iWndIndex, szStartTime, szStopTime);
			}

			return iRet;
		},
		// 倒放
		reversePlay: function (szUrl, szNamePwd, iWndIndex, szStartTime, szStopTime) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_ReversePlay(szUrl, szNamePwd, iWndIndex, szStartTime, szStopTime);
			}

			return iRet;
		},
		// 停止预览、回放
		stop: function (iWndIndex) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				try {// 防止Mac下切换Tab标签报错，因为beforeActive时会removePlugin
					iRet = _oPlugin.HWP_Stop(iWndIndex || 0);
				} catch (e) {}
			}

			return iRet;
		},
		// 开始录像、剪辑
		startSave: function (iWndIndex, szFileName) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_StartSave(iWndIndex, szFileName);
			}

			return iRet;
		},
		// 停止录像、剪辑
		stopSave: function (iWndIndex) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_StopSave(iWndIndex);
			}

			return iRet;
		},
		// 获取最近一次错误码
		getLastError: function () {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_GetLastError();
			}

			return iRet;
		},
		// 关闭声音
		closeSound: function () {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_CloseSound();
			}

			return iRet;
		},
		// 暂停
		pause: function (iWndIndex) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_Pause(iWndIndex);
			}

			return iRet;
		},
		// 恢复
		resume: function (iWndIndex) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_Resume(iWndIndex);
			}

			return iRet;
		},
		// 减速
		slow: function (iWndIndex) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_Slow(iWndIndex);
			}

			return iRet;
		},
		// 加速
		fast: function (iWndIndex) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_Fast(iWndIndex);
			}

			return iRet;
		},
		// 单帧
		frame: function (iWndIndex) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_FrameForward(iWndIndex);
			}

			return iRet;
		},
		// 获取OSD时间
		getOSDTime: function (iWndIndex) {
			var self = this,
				iTime = -1;

			if (_oPlugin) {
				iTime = _oPlugin.HWP_GetOSDTime(iWndIndex);
			}

			return iTime;
		},
		// 抓图
		capture: function (iWndIndex, szFileName) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_CapturePicture(iWndIndex, szFileName);
			}

			return iRet;
		},
		// 停止所有预览、回放
		stopRealPlayAll: function () {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				try {
					_oPlugin.StopRealPlayAll();
					return 0;
				} catch (e) {}
			}

			return iRet;
		},
		// 切换画面分割
		arrangeWindow: function (iWndSplit) {
			var self = this;

			if (_oPlugin) {
				_oPlugin.HWP_ArrangeWindow(iWndSplit);
			}
		},
		// 打开声音
		openSound: function (iWndIndex) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_OpenSound(iWndIndex);
			}

			return iRet;
		},
		talk: function (szOpenURL, szCloseURL, szDataUrl, szNamePwd, iAudioType, iAudioBitRate, iAudioSamplingRate) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_StartVoiceTalkEx(szOpenURL, szCloseURL, szDataUrl, szNamePwd, iAudioType, iAudioBitRate, iAudioSamplingRate);
			}
			return iRet;
		},
		stopTalk: function () {
			var self = this,
				iRet = 0;

			if (_oPlugin) {
				_oPlugin.HWP_StopVoiceTalk();
			}
			return iRet;
		},
		// 设置音量
		setVolume: function (iWndIndex, iVolume) {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetVolume(iWndIndex, iVolume);
			}

			return iRet;
		},

		// 关闭声音
		closeSound: function () {
			var self = this,
				iRet = -1;

			if (_oPlugin) {
				iRet = _oPlugin.HWP_CloseSound();
			}

			return iRet;
		},
		
		//开启电子放大、3D放大、手动跟踪、区域曝光、区域聚焦
		enableEzoom: function (iWndIndex, iMode) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_EnableZoom(iWndIndex, iMode);
			}
			return iRet;
		},
		//关闭电子放大、3D放大、手动跟踪、区域曝光、区域聚焦
		disableEzoom: function (iWndIndex) {
			var iRet = -1;
			if (_oPlugin) {
				_oPlugin.HWP_DisableZoom(iWndIndex);
				return 0;
			}
			return iRet;
		},
		setCanFullScreen: function (iMode) {
			var iRet = -1;
			if (_oPlugin) {
				_oPlugin.HWP_SetCanFullScreen(iMode);
				return 0;
			}
			return iRet;
		},
		//全屏
		fullScreen: function () {
			var iRet = -1;
			if (_oPlugin) {
				_oPlugin.HWP_FullScreenDisplay(true);
				return 0;
			}
			return iRet;
		},
		// 设置密钥
		setSecretKey: function (szKeyType, szKey) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetSecretKey(szKeyType, szKey);
			}
			return iRet;
		},
		// 设置区域
		setRegionInfo: function (szRegion) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetRegionInfo(szRegion);
			}
			return iRet;
		},
		// 获取所画区域
		getRegionInfo: function () {
			var szRet = "";
			if (_oPlugin) {
				szRet = _oPlugin.HWP_GetRegionInfo();
			}
			return szRet;
		},
		//设置预览类型
		SetPlayModeType: function (iMode) {
			var szRet = "";
			if (_oPlugin) {
				szRet = _oPlugin.HWP_SetPlayModeType(iMode);
			}
			return szRet;
		},
		setSnapLineInfo: function (szInfo) {
			var szRet = "";
			if (_oPlugin) {
				szRet = _oPlugin.HWP_SetSnapLineInfo(szInfo);
			}
			return szRet;
		},
		getSnapLineInfo: function () {
			var szRet = "";
			if (_oPlugin) {
				szRet = _oPlugin.HWP_GetSnapLineInfo();
			}
			return szRet;
		},
		//设置snapdraw模式，目前仅自由编辑和不能编辑模式
		setSelectMode: function (iMode) {
			var szRet = "";
			if (_oPlugin) {
				szRet = _oPlugin.HWP_SetSnapDrawMode(0, iMode); //模式-1:不绘图，0-编辑线 1-矩形 2-多边形
			}
			return szRet;
		},
		// 设置画图状态
		setDrawStatus: function (bDraw) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetDrawStatus(bDraw);
			}
			return iRet;
		},
		// 清除所画区域
		clearRegion: function () {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_ClearRegion();
			}
			return iRet;
		},
		// 打开文件选择框
		browseFilePath: function (iSelectMode, szFileType, oBrowse, szName, oScope) {
			if (szFileType === undefined || szFileType === null) {
				szFileType = "";
			}
			if (_oPlugin) {
				if(!_oService.m_bChromeNotSupportNpapi) {
					var szPost = _oPlugin.HWP_OpenFileBrowser(iSelectMode, szFileType);
					if (szPost == "" || szPost == null) {
						return;
					} else {
						if (iSelectMode == 1) {
							if (szPost.length > 100) {
								_oDialog.alert(_oTranslator.getValue('pathToLong'));
								return;
							}
						} else {
							if (szPost.length > 130) {
								_oDialog.alert(_oTranslator.getValue('pathToLong'));
								return;
							}
						}
						if(oBrowse !== undefined && oBrowse !== null) {
							oBrowse[szName] = szPost;
						} else {
							return szPost;
						}
					}
				} else {
					var iRet = _oPlugin.HWP_OpenFileBrowser(iSelectMode, szFileType, oBrowse, szName, oScope);
				}
			}
		},
		// 参数导入
		importDeviceConfig: function (szImportURL, szNamePwd, szFileName) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_StartAsynUpload(szImportURL, "", szNamePwd, szFileName, 0);
			}
			return iRet;
		},
		stopImportDeviceConfig: function () {
			_oPlugin.HWP_StopAsynUpload();
		},
		// 参数导入
		importIpcConfig: function (szImportURL, szNamePwd, szFileName) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_ImportDeviceConfig(szImportURL, szNamePwd, szFileName, 0);
			}
			return iRet;
		},
		//获取参数导入结果
		getImportResult: function () {
			var szResult = "";
			if (_oPlugin) {
				szResult = _oPlugin.HWP_GetUploadErrorInfo();
			}
			return szResult;
		},
		// 参数导出
		exportDeviceConfig: function (szExportURL, szNamePwd, szFileName, iReserve) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_ExportDeviceConfig(szExportURL, szNamePwd, szFileName, iReserve);
			}
			return iRet;
		},
		// IPC参数导入错误信息
		getIpcImportErrorInfo: function () {
			var szRet = "";
			if (_oPlugin) {
				szRet = _oPlugin.HWP_GetIpcImportErrorInfo();
			}
			return szRet;
		},
		// 升级
		startUpgradeEx: function (szUpgradeURL, szStatusURL, szNamePwd, szFileName, szUpgradeFlag) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_StartUpgradeEx(szUpgradeURL, szStatusURL, szNamePwd, szFileName, szUpgradeFlag, "");
			}
			return iRet;
		},
		// 获取升级状态
		upgradeStatus: function () {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_UpgradeStatus();
			}
			return iRet;
		},
		// 获取升级进度
		upgradeProgress: function () {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_UpgradeProgress();
			}
			return iRet;
		},
		// 停止升级
		stopUpgrade: function () {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_StopUpgrade();
			}
			return iRet;
		},
		// 导出日志
		exportDeviceLog: function (szXml, szFileName, iFileType) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_ExportDeviceLog(szXml, szFileName, iFileType);
			}
			return iRet;
		},
		uploadFile: function (szUpgradeURL, szStatusURL, szNamePwd, szFileName, szUpgradeFlag) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_UploadFile(szUpgradeURL, szStatusURL, szNamePwd, szFileName, szUpgradeFlag);
			}
			return iRet;
		},
		getTextOverlay: function () {
			var szXml = "";
			if (_oPlugin) {
				szXml = _oPlugin.HWP_GetTextOverlay();
			}
			return szXml;
		},
		setTextOverlay: function (szXml) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetTextOverlay(szXml);
			}
			return iRet;
		},
		// 获取多边形信息
		getSnapPolygonInfo: function () {
			var szXml = "";
			if (_oPlugin) {
				szXml = _oPlugin.HWP_GetSnapPolygonInfo();
			}
			return szXml;
		},
		// 获取多边形信息 iMode:清除模式 0-矩形 1-多边形 2-线  3-多边形和矩形 4-All
		clearSnapInfo: function (iMode) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_ClearSnapInfo(iMode);
			}
			return iRet;
		},
		// 获取多边形信息
		setSnapPolygonInfo: function (szInfo) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetSnapPolygonInfo(szInfo);
			}
			return iRet;
		},
		// 设置绘画模式 -1:不绘图，0-编辑线 1-矩形 2-多边形
		setSnapDrawMode: function (iMode) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetSnapDrawMode(0, iMode);
			}
			return iRet;
		},
		//设置秘钥
		setOriginalString: function (szStr, bEncrypted) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_SetOriginalString(szStr, bEncrypted, "");
			}
			return iRet;
		},
		//获取秘钥
		getEncryptString: function (iType) {
			var szRes = "";
			if (_oPlugin) {
				szRes = _oPlugin.HWP_GetEncryptString(iType);
			}
			return szRes;
		},
		// 打开目录
		openDirectory: function (szDir) {
			var iRet = -1;
			if (_oPlugin) {
				iRet = _oPlugin.HWP_OpenDirectory(szDir);
			}
			return iRet;
		},
        //是否使能客流量统计
        enablePDC: function (iEnable) {
            var iRet = -1;
            if (_oPlugin) {
                iRet = _oPlugin.HWP_EnablePDC(0, iEnable);  //0-关闭 1-开启
            }
            return iRet;
        },
        //iType: 0-txt 1-excel 2-根据下拉框来选择
        exportReport: function (xmlStr, fileName, iType) {
            var szRes = "";
            if (_oPlugin) {
                szRes = _oPlugin.HWP_ExportReport(xmlStr, fileName, iType);
            }
            return szRes;
        },
        //清除目标多边形或矩形
        clearTargetPolygon: function (szInfo) {
            var iRet = -1;
            if (_oPlugin) {
                iRet = _oPlugin.HWP_ClearTargetPolygon(szInfo);
            }
            return iRet;
		},
		//设置启用视频云台控制
		setPTZCtrlEnable: function (iWndIndex, bEnable) {
			var bRet = false;
			if (_oPlugin) {
				bRet = _oPlugin.HWP_SetPTZCtrlEnable(iWndIndex, bEnable);
			}
			return bRet;
		},
		startDownloadEx: function (szURL, szNamePwd, szFileName, szDownXml) {
			var iDownloadID = -1;
			if (_oPlugin) {
				iDownloadID = _oPlugin.HWP_StartDownloadEx(szURL, szNamePwd, szFileName, szDownXml, "");
			}
			return iDownloadID;
		},
		stopDownload: function (iDownloadID) {
			_oPlugin.HWP_StopDownload(iDownloadID);
		},
		getDownloadStatus: function (iDownloadID) {
			var iStatus = _oPlugin.HWP_GetDownloadStatus(iDownloadID);
			return iStatus;
		},
		getDownloadProgress: function (iDownloadID) {
		    var iProcess = _oPlugin.HWP_GetDownloadProgress(iDownloadID);
			return iProcess;
		},
		isInstalled: function () {
			return (!!_oPlugin);
		}
		
	};

	module.exports = new Plugin();
});