define(function (require, exports, module) {
	var _oCommon,
        _oTranslator,
        _oDialog,
        _oUtils,
        oTestResponseMap,
        _oDevice;

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oDialog = require("dialog");
	_oUtils = require("utils");
    _oDevice = require("isapi/device");
	oTestResponseMap = {
		"ok": _oTranslator.getValue("TestSuccess"),
		"connect server fail": _oTranslator.getValue("ConnectServerFail"),
		"no nas directory": _oTranslator.getValue("NoNasDirectory"),
		"no permission": _oTranslator.getValue("NoNasPermission"),
		"no dns": _oTranslator.getValue("NoDns"),
		"no gateway": _oTranslator.getValue("NoGateway"),
		"password error": _oTranslator.getValue("PasswordError"),
		"exchange server fail": _oTranslator.getValue("ExchangeServerFail"),
		"create directory failed": _oTranslator.getValue("CreateDirectoryFail"),
		"no write permission": _oTranslator.getValue("NoWritePermission"),
		"port error": _oTranslator.getValue("portError"),
		"user or password error": _oTranslator.getValue("loginError"),
		"no storage pool": _oTranslator.getValue("StoragePoolError"),
		"storage pool full": _oTranslator.getValue("StoragePoolFull"),
		"unknown error": _oTranslator.getValue("UnknownError")
	}

	function Response() {

	}

	Response.prototype = {
		saveState: function (xhr, param, iType) {
            var self = this;
            if (param === undefined || param === null) {
                param = "";
            }
            var bShowAlert = false;
            var szConflict = "";  //前端参数冲突提示信息
			var szRetInfo = "";
            if (xhr.readyState == 4) {
                if (xhr.status == 200 || xhr.status == 403 || xhr.status == 400 || xhr.status == 503 || xhr.status == 500) {
                    var xmlDoc = xhr.responseXML;
                    var state = _oUtils.nodeValue(xmlDoc, "statusCode");
                    var subState = _oUtils.nodeValue(xmlDoc, "subStatusCode");
                    if ("1" == state) {// Success
                        if (iType === 1) {
                            szRetInfo = param + _oTranslator.getValue("deleteSuccess");
                        } else if (iType === 2) {
                            szRetInfo = param + _oTranslator.getValue("restoreSucceeded");
                        } else {
                            szRetInfo = param + _oTranslator.getValue("saveSucceeded");
                        }
                    } else if ("2" == state) {// Device Busy
                        if (subState === "noMemory") {
                            szRetInfo = param + _oTranslator.getValue("deviceBusy");
                        } else if (subState === "serviceUnavailable") {
                            szRetInfo = param + _oTranslator.getValue("deviceBusy");
                        } else if (subState === "upgrading") {
                            szRetInfo = param + _oTranslator.getValue("deviceBusy");
                        } else if (subState === "deviceBusy") {
                            szRetInfo = param + _oTranslator.getValue("deviceBusy");
                        } else if (subState === "reConnectIpc") {
                            szRetInfo = param + _oTranslator.getValue("switchANR");
                        } else {
                            szRetInfo = param + _oTranslator.getValue("deviceBusy");
                        }
                    } else if ("3" == state) {// Device Error
                        if (subState === "28181Uninitialized") {
                            szRetInfo = param + _oTranslator.getValue("param28181Uninitialized");
                        } else {
                            szRetInfo = param + _oTranslator.getValue("deviceError");
                        }
                    } else if ("4" == state) {// Invalid Operation
                        if (subState === "notSupport") {
                            szRetInfo = param + _oTranslator.getValue("notSupport");
                        } else if (subState === "lowPrivilege") {
                            szRetInfo = param + _oTranslator.getValue("noPermission");
                        } else if (subState === "badAuthorization") {
                            szRetInfo = param + _oTranslator.getValue("userPwdError");
                        } else if (subState === "methodNotAllowed") {
                            szRetInfo = param + _oTranslator.getValue("methodError");
                        } else if (subState === "notSetHdiskRedund") {
                            szRetInfo = param + _oTranslator.getValue("requiredOneRWHDD");
                        } else if (subState === "invalidOperation") {
                            szRetInfo = param + _oTranslator.getValue("invalidOperation");
                        } else if (subState === "ptzOccupiedPriority") {
                            szRetInfo = param + _oTranslator.getValue("ptzOccupiedPriority");
                        } else if (subState === "TransparentMutexPTZ485") {
                            szRetInfo = param + _oTranslator.getValue("transparentMutexPTZ485");
                        } else if (subState === "highFrame1080PMutexSMDNoiseReduceWDROrCorridor") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexHighFrame");
                            szConflict = subState;
                        } else if (subState === "SMDNoiseReduceWDROrCorridorMutexHighFrame1080P") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexSMDNoiseReduceWDROrCorridor");
                            szConflict = subState;
                        } else if (subState === "highFrame720PMutexWDROrCorridor") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexHighFrame");
                            szConflict = subState;
                        } else if (subState === "WDROrCorridorMutexHighFrame720") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexWDROrCorridor");
                            szConflict = subState;
                        } else if (subState === "WDRMutexDDSOrDehaze") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexWDRDDSOrDeHaze");
                            szConflict = subState;  //错误码
                        } else if (subState === "DDSOrdehazeMutexWDR") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexDDSorDeHaze");
                            szConflict = subState;  //错误码
                        } else if (subState === "HLCMutexWDROrDehaze") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexHLC");
                            szConflict = subState;
                        } else if (subState === "WDROrDehazeMutexHLC") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexWDROrDeHaze");
                            szConflict = subState;
                        } else if (subState === "highFrame1080PMutexWDROrCorridor") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexHighFrame");
                            szConflict = subState;
                        } else if (subState === "WDROrCorridorMutexHighFrame1080P") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexWDROrCorridor");
                            szConflict = subState;
                        } else if (subState === "imageFlipMutexHighFrame1080P") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexImageFlip");
                            szConflict = subState;
                        } else if (subState === "highFrame1080PMutexImageFlip") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexHighFrame");
                            szConflict = subState;
                        } else if (subState === "MutexWithHighFrame1080P") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexHighFrame");
                            szConflict = subState;
                        } else if (subState === "MutexWithWDR") {  //跟宽动态互斥
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexWDR");
                            szConflict = subState;
                        } else if (subState === "MutexWithSMD") {  //客流量跟SMD冲突（已启用SMD）
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexSMD");
                            szConflict = subState;
                        } else if (subState === "MutexWithPDC") {  //SMD跟客流量冲突（已启用客流量）
                            bShowAlert = true;
                            if (_oDevice.m_oDeviceCapa.bSupportPeopleCount.bSptObjCount) {  //支持过线计数
                                szRetInfo = param + _oTranslator.getValue("mutexCount");
                            } else {  //普通客流量统计
                                szRetInfo = param + _oTranslator.getValue("mutexPDC");
                            }
                        } else if (subState === "MutexWithLensDistortionCorrection") {  //镜头矫正与WDR冲突
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexLensCorrection");
                            szConflict = subState;
                        } else if (subState === "MutexWithVehicleDetection" || subState === "MutexWithHVTVehicleDetection") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexVehicleDetect");
                            szConflict = subState;
                        } else if (subState === "MutexWithStream3") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexVehicleDetect");
                            szConflict = subState;
                        } else if (subState == "MutexWithFaceDetection") {  //人脸与越界与区域入侵冲突
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexFace");
                            szConflict = subState;
                        } else if (subState === "invalidDisplayParameterSwitch") {
                            bShowAlert = true;
                            szRetInfo = param + _oTranslator.getValue("mutexDisplayParameterSwitch");
                            szConflict = subState;
                        } else {
                            szRetInfo = param + _oTranslator.getValue("setParamFailed");
                        }
                    } else if ("5" == state) {// Invalid XML Format
                        szRetInfo = param + _oTranslator.getValue("paramError");
                    } else if ("6" == state) {// Invalid XML Content
                        if (subState === "badParameters") {
                            szRetInfo = param + _oTranslator.getValue("paramError");
                        } else if (subState === "badHostAddress") {
                            szRetInfo = param + _oTranslator.getValue("ipAddrError");
                        } else if (subState === "badXmlContent") {
                            szRetInfo = param + _oTranslator.getValue("paramError");
                        } else if (subState === "badIPv4Address") {
                            szRetInfo = param + _oTranslator.getValue("ipAddrError");
                        } else if (subState === "badIPv6Address") {
                            szRetInfo = param + _oTranslator.getValue("ipAddrError");
                        } else if (subState === "conflictIPv4Address") {
                            szRetInfo = param + _oTranslator.getValue("ipAddrConflicted");
                        } else if (subState === "conflictIPv6Address") {
                            szRetInfo = param + _oTranslator.getValue("ipAddrConflicted");
                        } else if (subState === "badDomainName") {
                            szRetInfo = param + _oTranslator.getValue("domainError");
                        } else if (subState === "connectSreverFail") {
                            szRetInfo = param + _oTranslator.getValue("communicationFailed");
                        } else if (subState === "conflictDomainName") {
                            szRetInfo = param + _oTranslator.getValue("domainConflicted");
                        } else if (subState === "badPort") {
                            szRetInfo = param + _oTranslator.getValue("portConflict");
                        } else if (subState === "portError") {
                            szRetInfo = param + _oTranslator.getValue("invalidPort");
                        } else if (subState === "badNetMask") {
                            szRetInfo = param + _oTranslator.getValue("subnetMaskError");
                        } else if (subState === "badVersion") {
                            szRetInfo = param + _oTranslator.getValue("versionMismatch");
                        } else if (subState === "badDevType") {
                            szRetInfo = param + _oTranslator.getValue("modelMismatch");
                        } else if (subState === "badLanguage") {
                            szRetInfo = param + _oTranslator.getValue("lanMismatch");
                        } else if (subState === "invalidChannel") {
                            szRetInfo = param + _oTranslator.getValue("confirmCamera") + " " + _oTranslator.getValue("cameraExist");
                        } else if (subState === "noAudioStream") {
                            szRetInfo = param + _oTranslator.getValue("confirmCamera") + " " + _oTranslator.getValue("videoAndAudio");
                        } else if (subState === "noRecAudio") {
                            szRetInfo = param + _oTranslator.getValue("confirmCamera") + " " + _oTranslator.getValue("recordAudio");
                        } else if (subState === "noAudio") {
                            szRetInfo = param + _oTranslator.getValue("confirmCamera") + " " + _oTranslator.getValue("recordAudio") + ", " + _oTranslator.getValue("videoAndAudio");
                        } else {
                            szRetInfo = param + _oTranslator.getValue("paramError");
                        }
                    } else if ("7" == state) {// Reboot Required
                        szRetInfo = "";
                        _oDialog.confirm(_oTranslator.getValue("rebootDeviceTip"), null, function () {
                            self.toRestart();
                        });
                        return;
                    } else if("51" == state) {//New Add
                        if (subState === "openSigNoOp") {
                            szRetInfo = param + _oTranslator.getValue("openSigNoOp");
                        } else {
                            szRetInfo = param + _oTranslator.getValue("paramError");
                        }
                    }
                    if (subState === "hasActivated") {
                        szRetInfo = param + _oTranslator.getValue("deviceActived");
                    }
            } else {
                szRetInfo = param + _oTranslator.getValue("invalidUrlOrHttp");
                szConflict = "error"; //老基线邮件测试部分用到
            }
            }
			if (szRetInfo != "") {
				if (bShowAlert) {  //前端部分冲突需要弹出alert提示
					alert(szRetInfo);
				} else {
					_oDialog.tip(szRetInfo);
				}
			}
            return szConflict;
		},
		getState: function (xhr) {
			if (xhr.readyState == 4) {
				var szRetInfo = "";
				if (xhr.status == 403 || xhr.status == 400 || xhr.status == 503 || xhr.status == 500) {
					var xmlDoc = xhr.responseXML;
					var state = _oUtils.nodeValue(xmlDoc, "statusCode");
					var subState = _oUtils.nodeValue(xmlDoc, "subStatusCode");
					if ("4" == state) {
						if (subState === "notSupport") {
							szRetInfo = _oTranslator.getValue("notSupport");
							//$("#SaveConfigBtn").prop("disabled", true);
						} else {
							szRetInfo = _oTranslator.getValue("networkAbnormal");
						}
					} else if ("3" == state) {
						if (subState === "28181Uninitialized") {
							szRetInfo = _oTranslator.getValue("param28181Uninitialized");
						} else {
							szRetInfo = _oTranslator.getValue("networkAbnormal");
						}
					} else {
						szRetInfo = _oTranslator.getValue("networkAbnormal");
					}
				} else {
					szRetInfo = _oTranslator.getValue("networkAbnormal");
				}
				_oDialog.alert(szRetInfo);
			}
		},
		// 重启提示
		restart: function () {
			var self = this;

			_oDialog.confirm(_oTranslator.getValue("rebootDeviceTip"), null, function () {
				self.toRestart();
			});
		},
		// 重启设备
		toRestart: function () {
			var self = this,
				oWaitDlg = null;

			oWaitDlg = _oDialog.wait(null, _oTranslator.getValue("rebooting"));

			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "restart", null, {
				success: function (status, xmlDoc, xhr) {
					if ("OK" == _oUtils.nodeValue(xmlDoc, "statusString")) {
						setTimeout(function () {
							self.reconnect(oWaitDlg);
						}, 60 * 1000);
					} else {
						oWaitDlg.close();
						self.saveState(xhr);
					}
				},
				error: function (status, xmlDoc, xhr) {
					oWaitDlg.close();
					self.saveState(xhr);
				}
			});
		},
		// 重连设备
		reconnect: function (oWaitDlg) {
			var self = this;

			var szTimeStamp = new Date().getTime();  //为了解决各个浏览器不带认证请求
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "login", {timeStamp: szTimeStamp}, {
				success: function (status, xmlDoc, xhr) {
					oWaitDlg.close();
                    window.location.reload();

					// todo
					/*if ("analogchan" == _oService.m_szModule) {
						//ParamConfig.prototype.instance().showmenuconfig("analogchan", 0, "1_3_311_3110");  //有问题
					} else if ("port" == _oService.m_szModule) {
						//g_oCommon.getRTSPPort();
					}*/
				},
				error: function (status, xmlDoc, xhr) {
					setTimeout(function() {
						self.reconnect(oWaitDlg);
					}, 5 * 1000);
				}
			});
		},
		//测试协议返回处理
		test: function (szUrlName, oUrlParam, xmlDoc) {
			var oWaitDlg = _oDialog.wait(null, _oTranslator.getValue("Testing"));
			var szErr = '', self = this;
            var szMethod = "POST";
            if ("message" === szUrlName) {
                szMethod = "PUT";
            }
			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, szUrlName, oUrlParam, {
				processData: false,
				data: xmlDoc,
				type: szMethod,
				success: function (status, xmlDoc, xhr) {
                    setTimeout(function () {
                        oWaitDlg.close();
                        szErr = $(xmlDoc).find("errorDescription").eq(0).text();
                        if (szErr) {
                            if(typeof oTestResponseMap[szErr] != 'undefined') {
                                _oDialog.tip(oTestResponseMap[szErr]);
                            } else {
                                _oDialog.tip(_oTranslator.getValue("UnknownError"));
                            }
                        } else {
                            _oDialog.tip(_oTranslator.getValue("TestSuccess"));
                        }
                    }, 2000);
				},
				error: function (status, xmlDoc, xhr) {
                    setTimeout(function () {
                        oWaitDlg.close();
                        if ("timeout" === xhr.statusText) {
                            _oDialog.tip(_oTranslator.getValue("TestFailed"));
                        } else {
                            self.saveState(xhr);
                        }
                    }, 2000);
				}
			});
		}
	};

	module.exports = new Response();
});