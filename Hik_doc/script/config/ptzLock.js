define(function (require, exports, module) {

	var _oCommon, _oTranslator, _oUtils;
	var _oService;
	var _iLockTime, _tLockTime;

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");

	_oService = require("config/service");


	function PTZLock() {
		_iLockTime = 0;			// 锁定时间
		_tLockTime = 0;			// 获取锁定时间定时器
	}

	PTZLock.prototype = {
		// 锁定云台
		lockPTZ: function () {
			var self = this,
				szXml = "",
				oXmlDoc = null;

			self.stopTimeLock();

			_iLockTime = 180;
			szXml = "<?xml version='1.0' encoding='UTF-8'?><LockPtz><lockTime>" + _iLockTime + "</lockTime></LockPtz>";
			oXmlDoc = _oUtils.parseXmlFromStr(szXml);

			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "lockPTZ", {channel: _oService.m_iChannelId}, {
				data: oXmlDoc,
				success: function (status, xmlDoc) {
					$("#ptzLockBtn").css("display", "block");
					//console.log("lockPTZ");
					self.setLockBtn(true);
					self.timeLock();
				},
				error: function () {
					_iLockTime = 0;
					$("#ptzLockBtn").css("display", "none");
				}
			});
		},
		// 解锁云台
		unlockPTZ: function () {
			var self = this,
				szXml = "",
				oXmlDoc = null;

			szXml = "<?xml version='1.0' encoding='UTF-8'?><LockPtz><lockTime>0</lockTime></LockPtz>";
			oXmlDoc = _oUtils.parseXmlFromStr(szXml);

			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "lockPTZ", {channel: _oService.m_iChannelId}, {
				async: false,
				data: oXmlDoc,
				success: function (status, xmlDoc) {
					//console.log("unlockPTZ");
					self.setLockBtn(false);
				}
			});
		},
		// 获取锁定状态
		getLockStatus: function () {
			var bLocked = true;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "lockPTZ", {channel: _oService.m_iChannelId}, {
				async: false,
				success: function (status, xmlDoc) {
					if (_oUtils.nodeValue(xmlDoc, "lockTime", "i") > 0) {
						bLocked = true;
					} else {
						bLocked = false;
					}
				},
				error: function () {
					bLocked = false;
				}
			});

			return bLocked;
		},
		// 定时更新解锁时间
		timeLock: function () {
			var self = this;

			// 切换页面的时候，先停止
			if (0 == $("#ptzLockBtn").length) {
				self.unlockPTZ();
				return;
			}

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "lockPTZ", {channel: _oService.m_iChannelId}, {
				success: function (status, xmlDoc) {
					//console.log("timeLock");
					_iLockTime = _oUtils.nodeValue(xmlDoc, "lockTime", "i");
					if (_iLockTime > 0) {
						self.setLockBtn(true);
						_tLockTime = setTimeout(function () {
							self.timeLock();
						}, 1000);
					} else {
						self.setLockBtn(false);
						_tLockTime = setTimeout(function () {// 请求回来，虽然解锁了，但是为了防止其他IE用户开启云台锁定，5秒后再次检测
							self.timeLock();
						}, 5000);
					}
				},
				error: function () {// 请求失败，5秒后再次检测
					self.setLockBtn(false);
					_tLockTime = setTimeout(function () {
						self.timeLock();
					}, 5000);
				}
			});
		},
		// 停止检测解锁时间
		stopTimeLock: function () {
			if (_tLockTime > 0) {
				//console.log("stopTimeLock");
				clearTimeout(_tLockTime);
				_tLockTime = 0;
			}
		},
		// 设置云台锁定按钮文本
		setLockBtn: function (bLock) {
			if (bLock) {// 锁定
				$("#ptzLockBtn").text(_oTranslator.getValue("unlockPTZ") + "(" + _iLockTime + "s)");
			} else {// 未锁定
				$("#ptzLockBtn").text(_oTranslator.getValue("lockPTZ"));
			}
		}
	};

	module.exports = new PTZLock();
});