define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oDevice, _oResponse;
	var _oScope, _oParent, _oTelecontrolIdCap, _oSettingBasicInfo;

	$ = require("jquery");
	require("config/ui.config");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");

	_oDevice = require("isapi/device");
	_oResponse = require("isapi/response");

	function SettingBasic() {
		_oTelecontrolIdCap = {};			// 设备编号能力
		_oSettingBasicInfo = {
			oXmlDoc: null,					// 基本信息XmlDoc
			szDeviceName: "",				// 设备名称
			szDeviceNo: "",				// 设备编号
			szDeviceModel: "",			// 设备型号
			szSerialNo: "",				// 设备序列号
			szFirmwareVersion: "",		// 主控版本
			szEncoderVersion: "",		// 编码版本
			szWebVersion: seajs.web_version.replace("build", " build "),		// Web版本
			szPluginVersion: seajs.plugin_version,	// Plugin版本
			iChannelNum: 0,				// 通道个数
			iHDDNum: 0,					// 硬盘个数
			iAlarmInNum: 0,				// 报警输入个数
			iAlarmOutNum: 0				// 报警输出个数
		};
	}

	SettingBasic.prototype = {
		// 页面初始化
		init: function (oParent) {
			var self = this;

			self.initController();
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			self.getDeviceInfoCab();

			angular.module("settingBasicApp", ["ui.config"])
				.controller("settingBasicController", function ($scope, $timeout, $compile) {
					_oScope = $scope;

					// 效验参数设置
					self.inputValid();

					// 语言包
					$scope.oLan = _oTranslator.oLastLanguage;

					// 基本信息信息
					$scope.oSettingBasicInfo = _oSettingBasicInfo;

					// 保存信息
					$scope.save = function () {
						self.save();
					};

					// 获取基本信息
					$timeout(function () {
						self.getDeviceInfo();
					}, 10);
				});
			angular.bootstrap(angular.element("#settingBasic"), ["settingBasicApp"]);
		},
		// 效验
		inputValid: function () {
			// 工具类
			_oScope.oUtils = _oUtils;
			// 设备名称效验参数
			_oScope.oDeviceNameValid = {
				oMaxLength: {
					value: 32,
					error: _oTranslator.getValue("noMoreLength", [32])
				},
				oSpecChar: {
					value: false,
					error: _oTranslator.getValue("notChar") + " / \\ : * ? ' \" < > | % "
				}
			};
			// 设备编号效验参数，前端不支持相关能力，给出默认值
			_oScope.oDeviceNoValid = {
				oEmpty: {
					value: false,
					error: _oTranslator.getValue("nullTips")
				},
				oMinValue: {
					value: 1,
					error: _oTranslator.getValue("range", [1, 255])
				},
				oMaxValue: {
					value: 255,
					error: _oTranslator.getValue("range", [1, 255])
				}
			};
		},
		// 获取设备信息能力
		getDeviceInfoCab: function () {
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "deviceInfoCapa", null, {
				async: false,
				success: function (status, xmlDoc) {
					_oTelecontrolIdCap.iMin = parseInt($(xmlDoc).find("telecontrolID").eq(0).attr("min"), 10);
					_oTelecontrolIdCap.iMax = parseInt($(xmlDoc).find("telecontrolID").eq(0).attr("max"), 10);
					_oScope.oDeviceNoValid.oMinValue = {
						value: _oTelecontrolIdCap.iMin,
						error: _oTranslator.getValue("range", [_oTelecontrolIdCap.iMin, _oTelecontrolIdCap.iMax])
					};
					_oScope.oDeviceNoValid.oMaxValue = {
						value: _oTelecontrolIdCap.iMax,
						error: _oTranslator.getValue("range", [_oTelecontrolIdCap.iMin, _oTelecontrolIdCap.iMax])
					};					
				}
			});
		},
		// 获取报警输入
		getDeviceInfo: function () {
			var self = this;
			_oSettingBasicInfo.iChannelNum = 0;
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "deviceInfo", null, {
				success: function (status, xmlDoc) {
					var oXml = null;

					_oSettingBasicInfo.oXmlDoc = xmlDoc;

					_oSettingBasicInfo.szDeviceName = _oUtils.nodeValue(xmlDoc, "deviceName");
					_oSettingBasicInfo.szDeviceNo = _oUtils.nodeValue(xmlDoc, "telecontrolID");
					_oSettingBasicInfo.szDeviceModel = _oUtils.nodeValue(xmlDoc, "model");
					_oSettingBasicInfo.szSerialNo = _oUtils.nodeValue(xmlDoc, "serialNumber");
					_oSettingBasicInfo.szFirmwareVersion = _oUtils.nodeValue(xmlDoc, "firmwareVersion") + " " + _oUtils.nodeValue(xmlDoc, "firmwareReleasedDate");
					_oSettingBasicInfo.szEncoderVersion = _oUtils.nodeValue(xmlDoc, "encoderVersion") + " " + _oUtils.nodeValue(xmlDoc, "encoderReleasedDate");

					// 通道
					oXml = _oDevice.getChannel(_oDevice.m_oChannelType.ANALOG);
					if (oXml != null) {
						_oSettingBasicInfo.iChannelNum = $(oXml).find("VideoInputChannel").length;
					}
					oXml = _oDevice.getChannel(_oDevice.m_oChannelType.DIGITAL);
					if (oXml != null) {
						_oSettingBasicInfo.iChannelNum += $(oXml).find("InputProxyChannel").length;
					}

					// 硬盘
					_oSettingBasicInfo.iHDDNum = self.getHDDNum();

					// 报警输入
					oXml = _oDevice.getAlarmInput(_oDevice.m_oAlarmInputType.ANALOG);
					_oSettingBasicInfo.iAlarmInNum = $(oXml).find("IOInputPort").length;
					oXml = _oDevice.getAlarmInput(_oDevice.m_oAlarmInputType.DIGITAL);
					_oSettingBasicInfo.iAlarmInNum += $(oXml).find("IOProxyInputPort").length;

					// 报警输出
					oXml = _oDevice.getAlarmOutput(_oDevice.m_oAlarmOutputType.ANALOG);
					_oSettingBasicInfo.iAlarmOutNum = $(oXml).find("IOOutputPort").length;
					oXml = _oDevice.getAlarmOutput(_oDevice.m_oAlarmOutputType.DIGITAL);
					_oSettingBasicInfo.iAlarmOutNum += $(oXml).find("IOProxyOutputPort").length;

					_oScope.$apply();
				}
			});
		},
		// 硬盘
		getHDDNum: function () {
			var iNum = 0;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "storage", null, {
				async: false,
				success: function (status, xmlDoc) {
					iNum = $(xmlDoc).find("hdd").length;
					$.each($(xmlDoc).find("nas"), function () {
						if (_oUtils.nodeValue(this, "status") !== "offline") {
							iNum++;
						}
					});
				}
			});

			return iNum;
		},
		// 保存信息
		save: function () {
			if (!_oScope.bInputValid) {
				return;
			}

			$(_oSettingBasicInfo.oXmlDoc).find("deviceName").eq(0).text(_oSettingBasicInfo.szDeviceName);
			$(_oSettingBasicInfo.oXmlDoc).find("telecontrolID").eq(0).text(_oSettingBasicInfo.szDeviceNo);

			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "deviceInfo", null, {
				data: _oSettingBasicInfo.oXmlDoc,
				complete: function (status, xmlDoc, xhr) {
					_oResponse.saveState(xhr);
				}
			});
		}
	};

	module.exports = new SettingBasic();
});