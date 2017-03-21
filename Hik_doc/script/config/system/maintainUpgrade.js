define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oDialog, _oResponse, _oDevice, _oPlugin;
	var _oScope, _oBrowseFilePath, _oStatusTip, _oIcon, _szUpgradeFlag, _tUpgradeStatus, _oUpgradeDlg, _oCapSupport;

	$ = require("jquery");

	require("ui.slider");
	require("ui.jquery");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");
	_oDialog = require("dialog");

	_oResponse = require("isapi/response");
	_oDevice = require("isapi/device");
	_oPlugin = require("common/plugin");

	function MaintainUpgrade() {

	}

	MaintainUpgrade.prototype = {
		// 页面初始化
		init: function (oParent) {
			var self = this;

			_oBrowseFilePath = {			// 文件选择
				config: "",				// 参数导入
				ipcConfig: "",				// IPC参数导入
				upgrade: ""				// 升级
			};
			_oStatusTip = {					// 状态提示
				config: "",				// 参数导入
				exportParam: "",			// 参数导出
				ipcConfig: "",				// IPC参数导入
				ipcExportParam: "",		// IPC参数导出
				upgrade: ""				// 升级
			};

			_oIcon = {						// 小图标
				config: "error",			// 参数导入
				exportParam: "error",	// 参数导出
				ipcConfig: "error",		// IPC参数导入
				ipcExportParam: "error",	// IPC参数导出
				upgrade: "error"			// 升级
			};

			_oCapSupport = {
				bSupportIpcImport: _oDevice.m_oDeviceCapa.bSupportIpcImport
			}

			_szUpgradeFlag = "";		// 升级标识

			self.initPlugin();
			self.initController();
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			self.upgradeFlag();

			angular.module("maintainUpgradeApp", ["ui.jquery"])
				.controller("maintainUpgradeController", function ($scope, $compile) {
					_oScope = $scope;

					// 语言包
					$scope.oLan = _oTranslator.oLastLanguage;
					// 文件选择
					$scope.oBrowseFilePath = _oBrowseFilePath;
					// 状态提示
					$scope.oStatusTip = _oStatusTip;
					// 小图标
					$scope.oIcon = _oIcon;
					// 升级方式
					$scope.iUpgradeMode = 0;
					// 升级进度
					$scope.iUpgradeProcess = 0;
					// 升级标识
					$scope.szUpgradeFlag = _szUpgradeFlag;
					// 正在升级
					$scope.bUpgrading = false;
					// IPC是否支持导入/导出
					$scope.oCapSupport = _oCapSupport;

					// 重启
					$scope.restart = function () {
						_oResponse.restart();
					};
					// 恢复默认
					$scope.restoreDefault = function (szMode) {
						self.restoreDefault(szMode);
					};
					// 选择文件
					$scope.browseFilePath = function (szName) {
						var iSelectMode = 1,
							szExtName = "";
						if (1 == $scope.iUpgradeMode && "upgrade" == szName) {// 升级方式为文件目录
							iSelectMode = 0;
						}
						if ("ipcConfig" == szName) {// IPC参数导出，文件选择后缀名指定为xls
							szExtName = "xls";
						}
						_oPlugin.browseFilePath(iSelectMode, szExtName, _oBrowseFilePath, szName, $scope);
					};
					// 导入参数
					$scope.importParam = function () {
						self.importParam();
					};
					// 导出参数
					$scope.exportParam = function () {
						self.exportParam();
					};
					// 导入IPC参数
					$scope.importIPCParam = function () {
						self.importIPCParam();
					};
					// 导出IPC参数
					$scope.exportIPCParam = function () {
						self.exportIPCParam();
					};
					// 升级
					$scope.startUpgrade = function () {
						self.startUpgrade($compile);
					};
				});
			angular.bootstrap(angular.element("#maintainUpgrade"), ["maintainUpgradeApp"]);
		},
		// 初始化插件
		initPlugin: function () {
			_oPlugin.initPluginEvent();
			_oPlugin.initPlugin("0");
		},
		// 升级标识
		upgradeFlag: function () {
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "upgradeFlag", null, {
				async: false,
				success: function (status, xmlDoc) {
					_szUpgradeFlag = _oUtils.nodeValue(xmlDoc, "flag");
				}
			});
		},
		// 恢复默认
		restoreDefault: function (szMode) {
			_oDialog.confirm(_oTranslator.getValue("restoreTip"), 300, function () {
				var oWaitRestore = null;
				oWaitRestore = _oDialog.wait("", _oTranslator.getValue("restoring"));
				WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "restore", {mode: szMode}, {
					timeout: 60000,
					success: function (status, xmlDoc, xhr) {
						oWaitRestore.close();
						var szStatusString = _oUtils.nodeValue(xmlDoc, "statusString");
						if ("OK" == szStatusString) {
							_oResponse.saveState(xhr);
						} else if ("Reboot Required" == szStatusString) {
							var oWaitDlg = _oDialog.wait(null, _oTranslator.getValue("rebooting"));
							if ("full" == szMode) {
								setTimeout(function () {
									oWaitDlg.close();
								}, 90 * 1000);
							} else {
                                //前后端不统一，后端不需要发重启命令，前端需要。这个先按前端处理，后端待协调。
                                oWaitDlg.close();
                                _oResponse.toRestart();
							}
						} else {
							_oResponse.saveState(xhr);
						}
					},
					error: function (status, xmlDoc, xhr) {
						oWaitRestore.close();
						_oResponse.saveState(xhr);
					}
				});
			});
		},
		// 导入参数
		importParam: function () {
			var self = this;
            _oIcon.config = "error";
			_oDialog.confirm(_oTranslator.getValue("importParamTip"), 300, function () {
				var szFileName = _oBrowseFilePath.config,
					szTip = "";

				if ("" == szFileName) {
					_oStatusTip.config = _oTranslator.getValue("importCfgFailed");
					setTimeout(function () {
						_oStatusTip.config = "";
						_oScope.$apply();
					}, 3 * 1000);
				} else {
					var szImportURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/System/configurationData";
					var iRet = _oPlugin.importDeviceConfig(szImportURL, _oCommon.m_szPluginNamePwd, szFileName);
					if (-1 == iRet) {
						var iError = _oPlugin.getLastError();
						if (403 === iError) {
							szTip = _oTranslator.getValue("noPermission");
						} else {
							szTip = _oTranslator.getValue('importCfgFailed');
						}
						_oStatusTip.config = szTip;
						setTimeout(function () {
							_oStatusTip.config = "";
							_oScope.$apply();
						}, 3 * 1000);
					} else {
						self.getImportResult();
					}
				}
				_oScope.$apply();
			});
		},
		getImportResult: function () {
			var oWaitImportDlg = _oDialog.wait(null, _oTranslator.getValue("importing"));
			var iGetImportResultId = setInterval(function () {
				var szResult = _oPlugin.getImportResult();
				var oXmlDoc =_oUtils.parseXmlFromStr(szResult);
				var szStatusStr = $(oXmlDoc).find("statusString").eq(0).text();
                _oIcon.config = "error";
				if (szStatusStr) {  //有内容
					clearInterval(iGetImportResultId);
					_oPlugin.stopImportDeviceConfig();
					oWaitImportDlg.close();
					if("Reboot Required" === $(oXmlDoc).find("statusString").eq(0).text()) {
						if (1 === seajs.iDeviceType) {//前端需要发送重启命令
							_oResponse.toRestart();
						} else {
							var oWaitDlg = _oDialog.wait(null, _oTranslator.getValue("rebooting"));
							setTimeout(function () {
							    _oResponse.reconnect(oWaitDlg);
							}, 60 * 1000);
						}
						_oStatusTip.config = "";
					} else if("OK" === $(oXmlDoc).find("statusString").eq(0).text()) {
						_oStatusTip.config = _oTranslator.getValue('importCfgSucceeded');
                        _oIcon.config = "success";
						setTimeout(function () {
							_oStatusTip.config = "";
							_oScope.$apply();
						}, 3 * 1000);
					} else {
						_oStatusTip.config = _oTranslator.getValue('importCfgFailed');
						setTimeout(function () {
							_oStatusTip.config = "";
							_oScope.$apply();
						}, 3 * 1000);
					}
				}
				_oScope.$apply();
			}, 5 * 1000);

		},
		// 导出参数
		exportParam: function () {
			var szTip = "",
				szExportURL = "",
				iRet = -1;

			_oIcon.exportParam = "error";

			szExportURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/System/configurationData";
			iRet = _oPlugin.exportDeviceConfig(szExportURL, _oCommon.m_szPluginNamePwd, "", 0);
			if (iRet < 0) {
				var iError = _oPlugin.getLastError();
				if (403 === iError) {
					szTip = _oTranslator.getValue("noPermission");
				} else {
					szTip = _oTranslator.getValue("exportCfgFailed");
				}
				_oStatusTip.exportParam = szTip;
			} else if (iRet == 0) {
				_oStatusTip.exportParam = _oTranslator.getValue("exportCfgSucceeded");
				_oIcon.exportParam = "success";
			}
			setTimeout(function () {
				_oStatusTip.exportParam = "";
				_oScope.$apply();
			}, 3 * 1000);
		},
		// 导入IPC参数
		importIPCParam: function () {
			var szFileName = _oBrowseFilePath.ipcConfig,
				szTip = "";

			_oIcon.ipcConfig = "error";

			if ("" == szFileName) {
				_oStatusTip.ipcConfig = _oTranslator.getValue("importCfgFailed");
				setTimeout(function () {
					_oStatusTip.ipcConfig = "";
					_oScope.$apply();
				}, 3 * 1000);
			} else {
				var szImportURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/ContentMgmt/InputProxy/ipcConfig";
				var iRet = _oPlugin.importIpcConfig(szImportURL, _oCommon.m_szPluginNamePwd, szFileName);
				if (iRet < 0) {
					var iError = _oPlugin.getLastError();
					if (403 === iError) {
						_oStatusTip.ipcConfig = _oTranslator.getValue("noPermission");
						setTimeout(function () {
							_oStatusTip.ipcConfig = "";
							_oScope.$apply();
						}, 3 * 1000);
						return;
					}
				}
				var szXml = _oPlugin.getIpcImportErrorInfo();
				var oXmlDoc = _oUtils.parseXmlFromStr(szXml);
				if (!_oUtils.nodeValue(oXmlDoc, "existError", "b")) {
					_oStatusTip.ipcConfig = _oTranslator.getValue("importCfgSucceeded");
					_oIcon.ipcConfig = "success";
					setTimeout(function () {
						_oStatusTip.ipcConfig = "";
						_oScope.$apply();
					}, 3 * 1000);
				} else {
					var szErrorCode = _oUtils.nodeValue(oXmlDoc, "errorCode");

					if (szErrorCode === "badDevType") {
						_oStatusTip.ipcConfig = _oTranslator.getValue("modelMismatch");
					} else if (szErrorCode === "badLanguage") {
						_oStatusTip.ipcConfig = _oTranslator.getValue("lanMismatch");
					} else if (szErrorCode === "chanNumReachLimit") {
						_oStatusTip.ipcConfig = _oTranslator.getValue("channelNumLimit");
					} else if (szErrorCode === "importFail") {
						_oStatusTip.ipcConfig = _oTranslator.getValue("importCfgFailed");
					}
					if (szErrorCode === "badDevType" || szErrorCode === "badLanguage" || szErrorCode === "chanNumReachLimit" || szErrorCode === "importFail") {
						setTimeout(function () {
							_oStatusTip.ipcConfig = "";
							_oScope.$apply();
						}, 3 * 1000);
						return;
					}

					var szErrorRow = [];
					for (var i = 0; i < 15; i++) {
						szErrorRow[i] = "";
					}
					$(oXmlDoc).find("IpcError").each(function (i) {
						var szErrorType = _oUtils.nodeValue(this, "errorType");
						var szErrorRowNum = _oUtils.nodeValue(this, "errorRowNo");

						if (szErrorType === "channelNoInvalid") {
							if (szErrorRow[0].split(",").length === 1) {
								szErrorRow[0] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[0] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "channelNoConflict") {
							if (szErrorRow[1].split(",").length === 1) {
								szErrorRow[1] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[1] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "channel IP/Domain invalid") {
							if (szErrorRow[2].split(",").length === 1) {
								szErrorRow[2] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[2] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "channel IP/Domain conflict") {
							if (szErrorRow[3].split(",").length === 1) {
								szErrorRow[3] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[3] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "channel IP conflict with local IP") {
							if (szErrorRow[4].split(",").length === 1) {
								szErrorRow[4] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[4] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "protocolError") {
							if (szErrorRow[5].split(",").length === 1) {
								szErrorRow[5] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[5] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "adminPortError") {
							if (szErrorRow[6].split(",").length === 1) {
								szErrorRow[6] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[6] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "channelError") {
							if (szErrorRow[7].split(",").length === 1) {
								szErrorRow[7] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[7] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "UserNameInvalid") {
							if (szErrorRow[8].split(",").length === 1) {
								szErrorRow[8] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[8] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "passwordInvalid") {
							if (szErrorRow[9].split(",").length === 1) {
								szErrorRow[9] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[9] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "transProtocalError") {
							if (szErrorRow[10].split(",").length === 1) {
								szErrorRow[10] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[10] += "," + szErrorRowNum;
							}
						} else if (szErrorType === "ipcResolutionNotSupport") {
							if (szErrorRow[11].split(",").length === 1) {
								szErrorRow[11] += _oTranslator.getValue("line") + szErrorRowNum;
							} else {
								szErrorRow[11] += "," + szErrorRowNum;
							}
						} else {
							// do nothing
						}
					});
					var szAllErrors = "";
					for (var i = 0; i < 15; i++) {
						if (szErrorRow[i] !== "") {
							if (i === 0) {
								szErrorRow[0] += ": " + _oTranslator.getValue("channelNoError") + ";";
							} else if (i === 1) {
								szErrorRow[1] += ": " + _oTranslator.getValue("channelNoConflict") + ";";
							} else if (i === 2) {
								szErrorRow[2] += ": " + _oTranslator.getValue("ipAddrError") + "/" + _oTranslator.getValue("domainError") + ";";
							} else if (i === 3) {
								szErrorRow[3] += ": " + _oTranslator.getValue("ipAddrConflicted") + "/" + _oTranslator.getValue("domainConflicted") + ";";
							} else if (i === 4) {
								szErrorRow[4] += ": " + _oTranslator.getValue("ipAddrConflictWithDev") + ";";
							} else if (i === 5) {
								szErrorRow[5] += ": " + _oTranslator.getValue("protocolError") + ";";
							} else if (i === 6) {
								szErrorRow[6] += ": " + _oTranslator.getValue("managePortError") + ";";
							} else if (i === 7) {
								szErrorRow[7] += ": " + _oTranslator.getValue("channelNoError") + ";";
							} else if (i === 8) {
								szErrorRow[8] += ": " + _oTranslator.getValue("userPwdError") + ";";
							} else if (i === 9) {
								szErrorRow[9] += ": " + _oTranslator.getValue("userPwdError") + ";";
							} else if (i === 10) {
								szErrorRow[10] += ": " + _oTranslator.getValue("transProtocolError") + ";";
							} else if (i === 11) {
								szErrorRow[11] += ": " + _oTranslator.getValue("resolutionNotSupported") + ";";
							}
						}
						szAllErrors += szErrorRow[i];
					}
					if (szAllErrors === "") {
						_oStatusTip.ipcConfig = _oTranslator.getValue("importCfgFailed");
					} else {
						_oStatusTip.ipcConfig = szAllErrors
					}
					setTimeout(function () {
						_oStatusTip.ipcConfig = "";
						_oScope.$apply();
					}, 3 * 1000);
				}
			}
		},
		// 导出IPC参数
		exportIPCParam: function () {
			var szTip = "",
				szExportURL = "",
				iRet = -1;

			_oIcon.ipcExportParam = "error";

			szExportURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/ContentMgmt/InputProxy/ipcConfig";
			iRet = _oPlugin.exportDeviceConfig(szExportURL, _oCommon.m_szPluginNamePwd, "", 1);
			if (iRet < 0) {
				var iError = _oPlugin.getLastError();
				if (403 === iError) {
					szTip = _oTranslator.getValue("noPermission");
				} else {
					szTip = _oTranslator.getValue("exportCfgFailed");
				}
				_oStatusTip.ipcExportParam = szTip;
			} else if(iRet == 0) {
				_oStatusTip.ipcExportParam = _oTranslator.getValue("exportCfgSucceeded");
				_oIcon.ipcExportParam = "success";
			}
			setTimeout(function () {
				_oStatusTip.ipcExportParam = "";
				_oScope.$apply();
			}, 3 * 1000);
		},
		// 升级
		startUpgrade: function ($compile) {
			var self = this;

			_oIcon.upgrade = "error";

			_oDialog.confirm(_oTranslator.getValue("upgradeTip"), 300, function () {
				var szFileName = _oBrowseFilePath.upgrade,
					szTip = "";

				if ("" == szFileName) {
					_oStatusTip.upgrade = _oTranslator.getValue("upgradeFailed");
					setTimeout(function () {
						_oStatusTip.upgrade = "";
						_oScope.$apply();
					}, 3 * 1000);
				} else {
					var szUpgradeURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/System/updateFirmware";
					var szStatusURL = _oCommon.m_szHttpProtocol + _oCommon.m_szHostName + ":" + _oCommon.m_iHttpPort + "/ISAPI/System/upgradeStatus";

					var iRet = _oPlugin.startUpgradeEx(szUpgradeURL, szStatusURL, _oCommon.m_szPluginNamePwd, szFileName, _szUpgradeFlag);
					if (-1 == iRet) {
						var iError = _oPlugin.getLastError();
						if (403 === iError) {// 无权限
							szTip = _oTranslator.getValue("noPermission");
						} else if (7003 == iError) {// 设备正在升级
							szTip = _oTranslator.getValue("deviceUpgrading");
						} else if (7032 == iError) {// 设备正在格式化
							szTip = _oTranslator.getValue("deviceFormat");
						} else {// 升级失败
							szTip = _oTranslator.getValue("upgradeFailed");
						}
						_oStatusTip.upgrade = szTip;
						setTimeout(function () {
							_oStatusTip.upgrade = "";
							_oScope.$apply();
						}, 3 * 1000);
					} else {
						_oStatusTip.upgrade = "";

						_oScope.iUpgradeProcess = 0;// 重置进度条为0
						var szHtml = '<div id="upgrade-slider" class="upgrade-slider"><div slider type="process" show-box="true" current-value="iUpgradeProcess" step="1" min="0" max="100"></div></div>';
						_oUpgradeDlg = _oDialog.htmlNoButton(_oTranslator.getValue("upgrading"), szHtml);
						$compile(angular.element("#upgrade-slider"))(_oScope);
						_oScope.$apply();

						_tUpgradeStatus = setInterval(function () {
							_oScope.$apply(function () {
								self.getUpgradeStatus();
							});
						},  2000);
					}
				}

				_oScope.$apply();
			});
		},
		// 获取升级状态
		getUpgradeStatus: function () {
			var iStatus = _oPlugin.upgradeStatus();
			if (0 == iStatus) {
				var iProcess = _oPlugin.upgradeProgress();
				if (iProcess < 0) {
					clearInterval(_tUpgradeStatus);
					_oUpgradeDlg.close();
					_oStatusTip.upgrade = _oTranslator.getValue("upgradeProgressFailed");
				} else if (iProcess < 100) {
					_oScope.iUpgradeProcess = iProcess;
				} else {
					clearInterval(_tUpgradeStatus);
					_oPlugin.stopUpgrade();
					_oUpgradeDlg.close();
					_oStatusTip.upgrade = _oTranslator.getValue("upgradeSucceeded");
					_oIcon.upgrade = "success";

					setTimeout(function () {
						_oStatusTip.upgrade = "";
						_oScope.$apply();
					}, 3 * 1000);

					// 升级后自动重启
					_oResponse.toRestart();
				}
			} else {// 非正常结束
				clearInterval(_tUpgradeStatus);
				_oPlugin.stopUpgrade();
				_oUpgradeDlg.close();

				var szTip = "";
				if (iStatus == 1) {// 升级失败
					szTip = _oTranslator.getValue("upgradeFailed");
				} else if (iStatus == 2) {// 语言不匹配
					szTip = _oTranslator.getValue("lanMismatch");
				} else if (4 == iStatus) {// 设备正在升级
					szTip = _oTranslator.getValue("deviceUpgrading");
				} else if (5 == iStatus) {// 内存不足
					szTip = _oTranslator.getValue("noMemory");
				} else if (6 == iStatus) {// 正在格式化
					szTip = _oTranslator.getValue("deviceFormat");
				} else if (7 == iStatus) {// 升级包类型不匹配
					szTip = _oTranslator.getValue("upgradeFileMismatch");
				} else if (8 == iStatus) {// 升级包版本不匹配
					szTip = _oTranslator.getValue("upgradeVersionMismatch");
				} else {// 获取升级状态失败
					szTip = _oTranslator.getValue("upgradeStatusFailed");
				}
				_oStatusTip.upgrade = szTip;
			}
		}
	};

	module.exports = new MaintainUpgrade();
});