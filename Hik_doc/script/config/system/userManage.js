define(function(require, exports, module) {

	var $, _oCommon, _oTranslator, _oUtils, _oDialog, _oBase64, _oWebSession, _oResponse, _oService;
	var _oScope, _oTable, _oPermissionCap, _iMaxUserNum, _aUser, _aUserId, _aUserLevel, _oUserInfo, _oBtnDisabled, _oUserLevelLan, _oXmlDoc, _oAllChannel, _szDefaultPassword;
	var _oLevelToType, _oTypeToLevel, _szAction;

	$ = require("jquery");
	require("config/ui.config");
	require("ui.table");

	_oCommon = require("common");
	_oTranslator = require("translator");
	_oUtils = require("utils");
	_oDialog = require("lib/dialog");
	_oBase64 = require("lib/base64");
	_oWebSession = require("webSession");

	_oResponse = require("isapi/response");
	_oService = require("config/service");

	function UserManage() {
		_oTable = null;					// 用户表格

		//枚举可配置的权限列表，目前协议里只有远程的权限，所以此处也只有远程相关权限，后续本地和其他权限可以添加
		_oLevelPermissionCapList = {//有能力控制的权限列表
			bRemoteSetParam: false,		// 远程设置参数
			bRemoteLog: false,			// 远程查看日志、状态
			bRemoteUpgrade: false,		// 远程升级、格式化
			bRemoteTalk: false,			// 远程语音对讲
			bRemoteReboot: false,		// 远程关机、重启
			bRemoteAlarm: false,			// 远程请求报警上传、报警输出
			bRemoteCtrl: false,			// 远程控制本地输出
			bRemoteRS: false,				// 远程控制串口
			bRemoteIPCCfg: false,		// 远程通道管理
			bRemotePreview: false,		// 远程预览
			bRemoteManualRecord: false,	// 远程手动录像
			bRemotePTZControl: false,	// 远程PTZ控制
			bRemotePlayback: false		//远程回放
		};

		//不同类型用户可配置的权限列表
		_oLevelPermissionCap = {
			"admin": {},
			"viewer": {},
			"operator": {}
		};

		_oPermissionCap = {
			bLocal: true,				// 是否支持本地权限配置
			bRemoteIPCCfg: false,	// 是否支持远程IPC权限配置
			bLocalIPCCfg: false		// 是否支持本地IPC权限配置
		};

		_iMaxUserNum = 32;				// 最大用户数

		_oBtnDisabled = {
			bAdd: false,				// 添加按钮是否禁用
			bModify: false,			// 修改按钮是否禁用
			bDelete: false			// 删除按钮是否禁用
		};

		_oUserLevelLan = {					// 用户类型语言
			Administrator: _oTranslator.getValue("administrator"),
			Operator: _oTranslator.getValue("operator"),
			Viewer: _oTranslator.getValue("user")
		};

		_oTypeToLevel = {					// 字符串映射关系
			admin: "Administrator",
			operator: "Operator",
			viewer: "Viewer"
		};
		_oLevelToType = {					// 字符串映射关系
			Administrator: "admin",
			Operator: "operator",
			Viewer: "viewer"
		};

		_szDefaultPassword = "\177\177\177\177\177\177";// 默认密码
	}

	UserManage.prototype = {
		// 页面初始化
		init: function (oParent) {
			var self = this;

			self.initParams();
			self.initTable();
			self.initController();
		},
		// 初始化参数
		initParams: function () {
			var self = this;

			_oAllChannel = {};				// 所有通道（界面使用）

			self.initChannel(_oAllChannel, false);
			self.initUserInfo();
		},
		// 初始化通道
		initChannel: function (oChannel, bValue) {
			$.each(_oService.m_aAnalogChannelId, function () {
				oChannel[this] = bValue;
			});
			$.each(_oService.m_aDigitalChannelId, function () {
				oChannel[this] = bValue;
			});
		},
		// 初始化用户数据结构
		initUserInfo: function () {
			_oUserInfo = {
				szUsername: "",					// 用户名
				szUserType: "",			// 用户类型
				oPassword: {},						// 密码、确认密码
				oLocalPermission: {				// 本地权限
					bLocalUpgrade: false,		// 本地升级、格式化
					bLocalReboot: false,			// 本地关机、重启
					bLocalSetParam: false,		// 本地设置参数
					bLocalLog: false,				// 本地查看日志
					bLocalIPCCfg: false,			// 本地通道管理
					oLocalPlayback: {				// 本地回放
						bChecked: true,
						oChannel: {}
					},
					oLocalManualRecord: {		// 本地手动操作
						bChecked: true,
						oChannel: {}
					},
					oLocalPTZControl: {			// 本地云台控制
						bChecked: true,
						oChannel: {}
					},
					oLocalBackup: {				// 本地备份
						bChecked: true,
						oChannel: {}
					}
				},
				oRemotePermission: {				// 远程权限
					bRemoteSetParam: false,		// 远程设置参数
					bRemoteLog: false,			// 远程查看日志、状态
					bRemoteUpgrade: false,		// 远程升级、格式化
					bRemoteTalk: false,			// 远程语音对讲
					bRemoteReboot: false,		// 远程关机、重启
					bRemoteAlarm: false,			// 远程请求报警上传、报警输出
					bRemoteCtrl: false,			// 远程控制本地输出
					bRemoteRS: false,				// 远程控制串口
					bRemoteIPCCfg: false,		// 远程通道管理
					oRemotePreview: {				// 远程预览
						bChecked: true,
						oChannel: {}
					},
					oRemoteManualRecord: {		// 远程手动录像
						bChecked: true,
						oChannel: {}
					},
					oRemotePTZControl: {			// 远程云台控制
						bChecked: true,
						oChannel: {}
					},
					oRemotePlayback: {			// 远程回放
						bChecked: true,
						oChannel: {}
					}
				},
				szSelPermission: "",				// 选中的权限
				bShowChannel: false,				// 是否显示通道
				bAdmin: false,						// 是否为管理员
				bUserType: false,					// 是否禁用用户名和用户类型编辑框
				bDisableChannel: false				//通道是否可配置
			};
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("userManageApp", ["ui.config"])
				.controller("userManageController", function ($scope, $timeout, $compile) {
					_oScope = $scope;

					// 语言包
					$scope.oLan = _oTranslator.oLastLanguage;

					// 效验参数设置
					self.inputValid();

					// 按钮是否禁用
					$scope.oBtnDisabled = _oBtnDisabled;
					// 权限配置能力
					$scope.oPermissionCap = _oPermissionCap;
					//权限是否可配置的能力				
					$scope.oLevelPermissionCap = {};

					// 通道相关
					$scope.aAnalog = _oService.m_aAnalogChannelId;
					$scope.aDigital = _oService.m_aDigitalChannelId;
					$scope.iAnalogNum = _oService.m_iAnalogChannelNum;

					// 用户信息
					$scope.oUserInfo = _oUserInfo;
					// 所有通道
					$scope.oAllChannel = _oAllChannel;
					// 通道全选checkbox
					$scope.bSelAllChannel = false;
					// 权限全选checkbox
					$scope.bSelAllPermission = false;

					// 选择权限
					$scope.select = function (event, bShowChannel, szPermission) {
						/*if ($(event.target).hasClass("checkbox")) {// 勾选权限不切换权限
							return;
						}*/
						var oTarget = event.currentTarget;

						/*if (_oUserInfo.szSelPermission != "") {// 在通道相关权限切换，先保存再切换

						}*/

						if (angular.isDefined(szPermission)) {// 通道相关权限
							_oUserInfo.szSelPermission = szPermission;
						} else {
							_oUserInfo.szSelPermission = "";
						}

						$(oTarget).siblings(".item").removeClass("bg");
						$(oTarget).addClass("bg");

						_oUserInfo.bShowChannel = bShowChannel;

						if (_oUserInfo.szSelPermission != "") {// 通道权限
							var oChannel = (_oUserInfo.oLocalPermission[_oUserInfo.szSelPermission] && _oUserInfo.oLocalPermission[_oUserInfo.szSelPermission].oChannel)
								|| _oUserInfo.oRemotePermission[_oUserInfo.szSelPermission].oChannel;
							$.extend(_oAllChannel, oChannel);

							if ($(event.target).hasClass("checkbox")) {// 直接操作checkbox，处理内存数据
								for (var k in _oAllChannel) {
									_oAllChannel[k] = $(event.target).prop("checked");
								}
							}
						}

						if ($(event.target).hasClass("checkbox")) {// 直接操作checkbox，处理全选按钮变化
							var bAll = true;
							$(oTarget).parent().find(".checkbox").each(function () {
								if (!$(this).prop("checked")) {
									bAll = false;
									return false;
								}
							});
							$scope.bSelAllPermission = bAll;
						}

						$scope.oUserInfo.bDisableChannel = ($(oTarget).find(".checkbox[disabled]").length > 0);
					};
					// 权限全选
					$scope.selAllPermission = function (event) {
						var oChannel = {},
							bValue = $(event.target).prop("checked");

						self.initChannel(oChannel, bValue);

						//过滤disabled权限
						var szNgModel = "";
						var aPermissionList = [];
						$("#permissionList .checkbox:not(:disabled)").each(function () {
							szNgModel = $(this).attr("ng-model").replace(/\.bChecked/, "");
							var aTemp = szNgModel.split(".");
							aPermissionList.push(aTemp[aTemp.length - 1]);
						});

						for (var k in _oUserInfo.oLocalPermission) {
							if (-1 !== $.inArray(k, aPermissionList)) {
								if (angular.isObject(_oUserInfo.oLocalPermission[k])) {
									_oUserInfo.oLocalPermission[k].bChecked = bValue;
									$.extend(_oUserInfo.oLocalPermission[k].oChannel, oChannel);
								} else {
									_oUserInfo.oLocalPermission[k] = bValue;
								}
							}
						}
						for (var k in _oUserInfo.oRemotePermission) {
							if (-1 !== $.inArray(k, aPermissionList)) {
								if (angular.isObject(_oUserInfo.oRemotePermission[k])) {
									_oUserInfo.oRemotePermission[k].bChecked = bValue;
									$.extend(_oUserInfo.oRemotePermission[k].oChannel, oChannel);
								} else {
									_oUserInfo.oRemotePermission[k] = bValue;
								}
							}
						}
					};
					// 通道全选
					$scope.selAllChannel = function (event) {
						for (var k in _oAllChannel) {
							_oAllChannel[k] = $(event.target).prop("checked");
						}
					};
					// 添加用户
					$scope.add = function () {
						_szAction = "add";
						self.add($compile);
					};
					// 修改用户
					$scope.modify = function () {
						_szAction = "modify";
						self.modify($compile);
					};
					// 删除用户
					$scope.deleteUser = function () {// delete在IE会报错，因此取名为deleteUser
						self.deleteUser();
					};

					// 用户类型切换触发
					$scope.$watch("oUserInfo.szUserType", function (to) {
						$scope.bSelAllPermission = false;
						self.changeUserType(to);
						//权限是否可配置能力更新
						var oLevelPermissionCap = $scope.oLevelPermissionCap;
						//重置
						$.each(oLevelPermissionCap, function (key) {
							oLevelPermissionCap[key] = false;
						});
						//更新
						if (_oLevelPermissionCap[to]) {//to可能为""
							$.each(_oLevelPermissionCap[to], function (key) {
								oLevelPermissionCap[key] = true;	
							});
						}

						//通道列表的禁用需要手动重置一下
						$timeout(function() {
							_oUserInfo.bDisableChannel = ($("#userDlg .permission").eq(0).find(".bg .checkbox[disabled]").length > 0);						
						}, 10);
					});
					// 通道勾选变化触发
					$scope.$watch("oAllChannel", function (to) {
						var bAny = false;
						var bAll = true;
						//是否全选
						for (var k in to) {
							if (!to[k]) {
								bAll = false;
								break;
							}
						}

						//是否一个没选
						for (var k in to) {
							if (to[k]) {
								bAny = true;
								break;
							}
						}

						$scope.bSelAllChannel = bAll;

						// 内存数据处理
						if (_oUserInfo.szSelPermission != "") {// 通道权限
							var oChannel = (_oUserInfo.oLocalPermission[_oUserInfo.szSelPermission] && _oUserInfo.oLocalPermission[_oUserInfo.szSelPermission].oChannel)
								|| _oUserInfo.oRemotePermission[_oUserInfo.szSelPermission].oChannel;
							$.extend(oChannel, _oAllChannel);
							var oPermission = _oUserInfo.oLocalPermission[_oUserInfo.szSelPermission] || _oUserInfo.oRemotePermission[_oUserInfo.szSelPermission];
							oPermission.bChecked = bAny;
						}
					}, true);

					// 获取信息
					$timeout(function () {
						self.getPermissionCapa();
						self.getUserInfo();
					}, 10);
				});
			angular.bootstrap(angular.element("#userManage"), ["userManageApp"]);
		},
		// 效验
		inputValid: function () {
			// 工具类
			_oScope.oUtils = _oUtils;
			_oScope.oInputValid = {};
			_oScope.aInputValidList = [];
			_oScope.oInputValidUtils = {};
			// 用户名
			_oScope.oUserameValid = {
				oType: {value: "username"},
				oEmpty: {
					value: false,
					error: _oTranslator.getValue("nullTips")
				},
				oChinese: {
					value: false,
					error: _oTranslator.getValue("notZhChar")
				},
				oMaxLength: {
					value: 32,
					error: _oTranslator.getValue("noMoreLength", [32])
				}
			};
			_oScope.username = function () {
				var bValid = true,
					szError = "";

				if (/[:\\\"]/.test(_oUserInfo.szUsername)) {// 用户名不能输入 \ : "
					bValid = false;
					szError = _oTranslator.getValue("notChar") + " \\ \" : ";
				}

				return {bValid: bValid, szError: szError};
			};
		},
		// 初始化表格
		initTable: function () {
			var self = this;

			_oTable = $("#tableUser").table({
				header: [{
					display: _oTranslator.getValue("username"),
					width: "300"
				},{
					display: _oTranslator.getValue("userLevel"),
					width: "354"
				}],
				lan: {
					index: _oTranslator.getValue("serialNumber"),
					item: _oTranslator.getValue("items"),
					total: _oTranslator.getValue("total")
				},
				showIndex: true,
				onSelect: function (iRowIndex) {
					self.onSelect(iRowIndex);
				}
			});
		},
		// 切换用户类型
		changeUserType: function (szUserType) {
			if (!szUserType) {
				return;
			}
			var self = this;

			_oUserInfo.oLocalPermission.bLocalUpgrade = false;
			_oUserInfo.oLocalPermission.bLocalReboot = false;
			_oUserInfo.oLocalPermission.bLocalSetParam = false;
			_oUserInfo.oLocalPermission.bLocalLog = true;// 本地查看日志
			_oUserInfo.oLocalPermission.bLocalIPCCfg = false;
			_oUserInfo.oLocalPermission.oLocalPlayback.bChecked = true;// 本地回放
			_oUserInfo.oLocalPermission.oLocalManualRecord.bChecked = false;
			_oUserInfo.oLocalPermission.oLocalPTZControl.bChecked = false;
			_oUserInfo.oLocalPermission.oLocalBackup.bChecked = false;

			_oUserInfo.oRemotePermission.bRemoteSetParam = false;
			_oUserInfo.oRemotePermission.bRemoteLog = true;// 本地查看日志、状态
			_oUserInfo.oRemotePermission.bRemoteUpgrade = false;
			_oUserInfo.oRemotePermission.bRemoteTalk = false;
			_oUserInfo.oRemotePermission.bRemoteReboot = false;
			_oUserInfo.oRemotePermission.bRemoteAlarm = false;
			_oUserInfo.oRemotePermission.bRemoteCtrl = false;
			_oUserInfo.oRemotePermission.bRemoteRS = false;
			_oUserInfo.oRemotePermission.bRemoteIPCCfg = false;
			_oUserInfo.oRemotePermission.oRemotePreview.bChecked = false;
			_oUserInfo.oRemotePermission.oRemoteManualRecord.bChecked = false;
			_oUserInfo.oRemotePermission.oRemotePTZControl.bChecked = false;
			_oUserInfo.oRemotePermission.oRemotePlayback.bChecked = true;// 远程回放

			self.initChannel(_oUserInfo.oLocalPermission.oLocalPlayback.oChannel, true);// 本地回放
			self.initChannel(_oUserInfo.oLocalPermission.oLocalManualRecord.oChannel, false);
			self.initChannel(_oUserInfo.oLocalPermission.oLocalPTZControl.oChannel, false);
			self.initChannel(_oUserInfo.oLocalPermission.oLocalBackup.oChannel, false);
			self.initChannel(_oUserInfo.oRemotePermission.oRemotePreview.oChannel, false);
			self.initChannel(_oUserInfo.oRemotePermission.oRemoteManualRecord.oChannel, false);
			self.initChannel(_oUserInfo.oRemotePermission.oRemotePTZControl.oChannel, false);
			self.initChannel(_oUserInfo.oRemotePermission.oRemotePlayback.oChannel, true);// 远程回放

			if ("operator" == szUserType) {
				_oUserInfo.oRemotePermission.bRemoteTalk = true;// 远程语音对讲

				_oUserInfo.oLocalPermission.oLocalManualRecord.bChecked = true;
				_oUserInfo.oLocalPermission.oLocalPTZControl.bChecked = true;
				_oUserInfo.oLocalPermission.oLocalBackup.bChecked = true;
				_oUserInfo.oRemotePermission.oRemotePreview.bChecked = true;
				_oUserInfo.oRemotePermission.oRemoteManualRecord.bChecked = true;
				_oUserInfo.oRemotePermission.oRemotePTZControl.bChecked = true;

				self.initChannel(_oUserInfo.oLocalPermission.oLocalManualRecord.oChannel, true);
				self.initChannel(_oUserInfo.oLocalPermission.oLocalPTZControl.oChannel, true);
				self.initChannel(_oUserInfo.oLocalPermission.oLocalBackup.oChannel, true);
				self.initChannel(_oUserInfo.oRemotePermission.oRemotePreview.oChannel, true);
				self.initChannel(_oUserInfo.oRemotePermission.oRemoteManualRecord.oChannel, true);
				self.initChannel(_oUserInfo.oRemotePermission.oRemotePTZControl.oChannel, true);
			}

			//根据能力修改默认值，此处为了书写方便，_oUserInfo.oRemotePermission与_oLevelPermissionCap[szUserType]属性命名需统一
			var oRemotePermission = _oUserInfo.oRemotePermission;
			$.each(_oLevelPermissionCap[szUserType], function (key, value) {
				if (angular.isDefined(oRemotePermission[key])) {
					oRemotePermission[key] = value;
				} else {
					var szPermissionName = key.replace(/b/, "o");
					if (oRemotePermission[szPermissionName]) {
						oRemotePermission[szPermissionName].bChecked = value;
					}

					if ("bRemotePreview" === key || "bRemoteManualRecord" === key || "bRemotePTZControl" === key || "bRemotePlayback" === key) {
						self.initChannel(oRemotePermission[szPermissionName].oChannel, value);
					}
				}
			});

			// 界面勾选处理
			if (_oUserInfo.szSelPermission != "") {
				var oChannel = (_oUserInfo.oLocalPermission[_oUserInfo.szSelPermission] && _oUserInfo.oLocalPermission[_oUserInfo.szSelPermission].oChannel)
					|| _oUserInfo.oRemotePermission[_oUserInfo.szSelPermission].oChannel;
				$.extend(_oAllChannel, oChannel);
			}
		},
		// 权限配置能力
		getPermissionCapa: function () {
			var self = this;
			$.each(_oLevelPermissionCap, function (key) {
				self.getLevelPermissionCapa(key);
			});
		},
		// 获取某种用户类型的权限配置能力
		getLevelPermissionCapa: function (szUserType) {
			//默认权限值
			var oPermissionCap  = $.extend({}, _oLevelPermissionCapList);
			if ("viewer" === szUserType) {
				$.extend(oPermissionCap, {
					bRemoteLog: true,
					bRemotePlayback: true
				});
			} else if ("operator" === szUserType) {
				$.extend(oPermissionCap, {
					bRemoteLog: true,
					bRemoteTalk: true,					
					bRemotePreview: true,
					bRemoteManualRecord: true,
					bRemotePTZControl: true,
					bRemotePlayback: true
				});
			} else if ("admin" === szUserType) {
				$.each(oPermissionCap, function (key) {
					oPermissionCap[key]  = true;
				});
			}

			$.extend(_oLevelPermissionCap[szUserType], oPermissionCap);

			//根据能力更新默认值
			if ("admin" === szUserType) {//目前admin用户的权限与其他两种类型的还不同，不能统一处理
				WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "userPermission", {user: 1}, {
					success: function (status, xmlDoc, xhr) {
						if ($(xmlDoc).find("localPermission").length === 0) {
							_oPermissionCap.bLocal = false;
						}
						if ($(xmlDoc).find("localPermission").length > 0) {
							_oPermissionCap.bRemoteIPCCfg = true;
						}
					},
					error: function () {
						_oPermissionCap.bLocal = false;
					}
				});
			} else {
				WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "userPermissionCap", {userType: szUserType + "Cap"}, {//后端还不支持该能力
					success: function (status, xmlDoc, xhr) {
						var oLevelPermissionCap = _oLevelPermissionCap[szUserType] = {};
						var oRemotePermission = $(xmlDoc).find("UserPermissionCap remotePermissionCap").eq(0);
						//协议中节点值表示是否支持配置，def属性的值是默认值，目前没有用到，后续使用
						//预览权限
						if (_oUtils.nodeValue(oRemotePermission, "preview", "b")) {
							oLevelPermissionCap.bRemotePreview = _oUtils.nodeAttr(oRemotePermission, "preview", "def", "b");
						}

						//ptz权限
						if (_oUtils.nodeValue(oRemotePermission, "ptzControl", "b")) {
							oLevelPermissionCap.bRemotePTZControl = _oUtils.nodeAttr(oRemotePermission, "ptzControl", "def", "b");
						}

						//手动录像
						if (_oUtils.nodeValue(oRemotePermission, "record", "b")) {
							oLevelPermissionCap.bRemoteManualRecord = _oUtils.nodeAttr(oRemotePermission, "record", "def", "b");
						}

						//回放权限
						if (_oUtils.nodeValue(oRemotePermission, "playBack", "b")) {
							oLevelPermissionCap.bRemotePlayback = _oUtils.nodeAttr(oRemotePermission, "playBack", "def", "b");
						}

						//远程配置权限
						if (_oUtils.nodeValue(oRemotePermission, "parameterConfig", "b")) {
							oLevelPermissionCap.bRemoteSetParam = _oUtils.nodeAttr(oRemotePermission, "parameterConfig", "def", "b");
						}

						//关机重启权限
						if (_oUtils.nodeValue(oRemotePermission, "restartOrShutdown", "b")) {
							oLevelPermissionCap.bRemoteReboot = _oUtils.nodeAttr(oRemotePermission, "restartOrShutdown", "def", "b");
						}

						//升级权限
						if (_oUtils.nodeValue(oRemotePermission, "upgrade", "b")) {
							oLevelPermissionCap.bRemoteUpgrade = _oUtils.nodeAttr(oRemotePermission, "upgrade", "def", "b");
						}
	
						//日志、状态权限
						if (_oUtils.nodeValue(oRemotePermission, "logOrStateCheck", "b")) {
							oLevelPermissionCap.bRemoteLog = _oUtils.nodeAttr(oRemotePermission, "logOrStateCheck", "def", "b");
						}
	
						//对讲权限
						if (_oUtils.nodeValue(oRemotePermission, "voiceTalk", "b")) {
							oLevelPermissionCap.bRemoteTalk = _oUtils.nodeAttr(oRemotePermission, "voiceTalk", "def", "b");
						}
						
						//远程控制串口权限
						if (_oUtils.nodeValue(oRemotePermission, "transParentChannel", "b")) {
							oLevelPermissionCap.bRemoteRS = _oUtils.nodeAttr(oRemotePermission, "transParentChannel", "def", "b");
						}
						
						//控制本地输出权限
						if (_oUtils.nodeValue(oRemotePermission, "contorlLocalOut", "b")) {
							oLevelPermissionCap.bRemoteCtrl = _oUtils.nodeAttr(oRemotePermission, "contorlLocalOut", "def", "b");
						}
						
						//报警输入和上传权限
						if (_oUtils.nodeValue(oRemotePermission, "alarmOutOrUpload", "b")) {
							oLevelPermissionCap.bRemoteAlarm = _oUtils.nodeAttr(oRemotePermission, "alarmOutOrUpload", "def", "b");
						}						
					},
					error: function () {
						
					}
				});
			}
		},
		// 获取用户信息
		getUserInfo: function () {
			var oUserList = null;

			_aUser = [];					// 用户列表
			_aUserId = [];					// 用户id
			_aUserLevel = [];				// 用户类型
			_oXmlDoc = null;				// 用户信息XmlDoc

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "user", null, {
				success: function (status, xmlDoc, xhr) {
					_oXmlDoc = xmlDoc;
					_oBtnDisabled.bModify = true;
					_oBtnDisabled.bDelete = true;

					oUserList = $(xmlDoc).find("User");

					/*for(var i = 0; i < that.m_iHaveUser; i++) {
						that.m_szUserID[i] = $(xmlDoc).find("User").eq(i).find("id").eq(0).text();
						if($(xmlDoc).find("User").eq(i).find("userName").eq(0).text() === g_oConfigParamters.m_strUserName) {
							that.m_iSelectUser = i;
						}
					}*/

					var iIdx = 0;
					$.each(oUserList, function (i) {
						if ("admin" === _oCommon.m_szUsername || $(this).find("userName").eq(0).text() == _oCommon.m_szUsername) {
							_aUser[iIdx] = [];
							_aUser[iIdx][0] = $(this).find("userName").eq(0).text();
							_aUser[iIdx][1] = _oUserLevelLan[$(this).find("userLevel").eq(0).text()];

							_aUserId[iIdx] = $(this).find("id").eq(0).text();
							_aUserLevel[iIdx] = $(this).find("userLevel").eq(0).text();

							iIdx++;
						}
					});

					_oTable.deleteRows();
					_oTable.addRows(_aUser);

					if (oUserList.length >= _iMaxUserNum || _oCommon.m_szUsername != "admin") {
						_oBtnDisabled.bAdd = true;
					} else {
						_oBtnDisabled.bAdd = false;
					}

					_oScope.$apply();
				},
				error: function (status, xmlDoc, xhr) {
					_oResponse.getState(xhr);
				}
			});
		},
		// 选中表格某一行
		onSelect: function (iRowIndex) {
			_oBtnDisabled.bModify = false;

			if (_aUser[iRowIndex][0] == _oCommon.m_szUsername) {
				_oBtnDisabled.bDelete = true;
			} else {
				_oBtnDisabled.bDelete = false;
			}
			_oScope.$apply();
		},
		// 添加用户
		add: function ($compile) {
			var self = this;

			_oUserInfo.bShowChannel = false;

			_oUserInfo.szUsername = "";
			_oUserInfo.szUserType = "operator";
			_oUserInfo.bAdmin = false;
			_oUserInfo.bUserType = false;
			_oUserInfo.bDisableChannel = false;

			_oScope.bSelAllPermission = false;
			self.changeUserType(_oUserInfo.szUserType);

			$.get("config/system/userDlg.asp", function (szHtml) {
				_oDialog.html(_oTranslator.getValue("addUser"), szHtml, null, null, function () {
					return self.addOk("add");
				}, function () {
					// do nothing
				}, function () {
					_oScope.oInputValidUtils.clearInputValidList();
					_oUtils.removeValidTip();
				});
				$compile(angular.element("#userDlg"))(_oScope);

				_oScope.$apply();

				artDialog.get("dialoghtml").position(artDialog.defaults.left, artDialog.defaults.top);
				$("#userDlg").hide().show();//解决IE8下Dialog弹出高度计算有误
			});
		},
		// 添加用户确定
		addOk: function (szType) {
			var self = this,
				iSelectIndex = -1,
				szXml = "",
				oXmlDoc = null;

			_oScope.oInputValidUtils.manualInputValid();// 弹出页面后，虽然_oScope.bInputValid为false，但是界面没有提示，手动效验一下界面显示错误提示
			if (!_oScope.oInputValid.bInputValid) {
				return false;
			}

			if ("modify" == szType) {
				iSelectIndex = _oTable.getSelectedRow().item.index();
			}

			for (var i = 0; i < _aUser.length; i++) {
				if ("modify" == szType && iSelectIndex == i) {
					continue;
				}

				if (_aUser[i][0] == _oUserInfo.szUsername) {
					_oDialog.alert(_oTranslator.getValue("userExist"));
					return false;
				}
			}

			if ("add" == szType) {
				szXml = "<?xml version='1.0' encoding='UTF-8'?>";
				szXml += "<User><id>0</id><userName>" + _oUtils.encodeString(_oUserInfo.szUsername) + "</userName>";
				szXml += "<password>" + _oUtils.encodeString(_oUserInfo.oPassword.szPassword) + "</password>";
				szXml += "<bondIpList><bondIp><id>1</id><ipAddress>0.0.0.0</ipAddress><ipv6Address>::</ipv6Address></bondIp></bondIpList><macAddress></macAddress>";
				szXml += "<userLevel>" + _oTypeToLevel[_oUserInfo.szUserType] + "</userLevel>";
				szXml += "<attribute><inherent>false</inherent></attribute>";
				szXml += "</User>";

				oXmlDoc = _oUtils.parseXmlFromStr(szXml);
				WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "user", null, {
					data: oXmlDoc,
					success: function (status, xmlDoc) {
						//前后端大小写不同，先兼容[按照小写来]
						self.setUserPermission($(xmlDoc).find("id").eq(0).text());
					},
					error: function (status, xmlDoc, xhr) {
						_oResponse.saveState(xhr);
					}
				});
			} else {
				szXml = "<?xml version='1.0' encoding='UTF-8'?>";
				szXml += "<User><id>" + _aUserId[iSelectIndex] + "</id><userName>" + _oUtils.encodeString(_oUserInfo.szUsername) + "</userName>";
				if (_oUserInfo.oPassword.szPassword !== _szDefaultPassword) {
					if (_oUserInfo.szUsername === _oCommon.m_szUsername) {
						//g_oConfigParamters.m_strPassword = $("#UserPsw").val();
					}
					szXml += "<password>" + _oUtils.encodeString(_oUserInfo.oPassword.szPassword) + "</password>";
				}
				szXml += "<bondIpList><bondIp><id>1</id><ipAddress>0.0.0.0</ipAddress><ipv6Address>::</ipv6Address></bondIp></bondIpList><macAddress></macAddress>";
				szXml += "<userLevel>" + _oTypeToLevel[_oUserInfo.szUserType] + "</userLevel>";
				szXml += "<attribute><inherent>" + $(_oXmlDoc).find("User").eq(iSelectIndex).find("inherent").eq(0).text() + "</inherent></attribute>";
				szXml += "</User>";

				oXmlDoc = _oUtils.parseXmlFromStr(szXml);
				WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "userModify", {user: _aUserId[iSelectIndex]}, {
					data: oXmlDoc,
					success: function (status, xmlDoc, xhr) {
						if (_oUserInfo.oPassword.szPassword !== _szDefaultPassword) {
							if (_oUserInfo.szUsername === _oCommon.m_szUsername) {
								_oCommon.m_szNamePwd = _oBase64.encode(_oCommon.m_szUsername + ":" + _oUserInfo.oPassword.szPassword);
								_oWebSession.setItem("userInfo", _oCommon.m_szNamePwd);
                                _oCommon.changeNamePWD(_oCommon.m_bAnonymous, _oCommon.m_szUsername, _oUserInfo.oPassword.szPassword);  //同步插件用户名密码
								WebSDK.WSDK_SetLoginInfo(_oCommon.m_szHostName, _oCommon.m_iHttpProtocal, _oCommon.m_iHttpPort, _oCommon.m_szUsername, _oUserInfo.oPassword.szPassword);
							}
						}

						if (_oCommon.m_szUsername === "admin" && _oUserInfo.szUsername != "admin") {
							self.setUserPermission(_aUserId[iSelectIndex]);
						} else {
							_oResponse.saveState(xhr);
							self.getUserInfo();
						}
					},
					error: function (status, xmlDoc, xhr) {
						_oResponse.saveState(xhr);
					}
				});
			}
		},
		// 设置权限
		setUserPermission: function (iUserID) {
			var self = this,
				szXml = "",
				oXmlDoc = null;

			szXml = "<?xml version='1.0' encoding='utf-8'?>";
			szXml += "<UserPermission><id>" + iUserID + "</id><userID>" + iUserID + "</userID>";
			szXml += "<userType>" + _oUserInfo.szUserType + "</userType>";

			// 本地权限
			if (_oPermissionCap.bLocal) {
				szXml += "<localPermission>";

				szXml += "<upgrade>" + _oUserInfo.oLocalPermission.bLocalUpgrade.toString() + "</upgrade>";
				szXml += "<parameterConfig>" + _oUserInfo.oLocalPermission.bLocalSetParam.toString() + "</parameterConfig>";
				szXml += "<restartOrShutdown>" + _oUserInfo.oLocalPermission.bLocalReboot.toString() + "</restartOrShutdown>";
				szXml += "<logOrStateCheck>" + _oUserInfo.oLocalPermission.bLocalLog.toString() + "</logOrStateCheck>";
				if (_oPermissionCap.bLocalIPCCfg) {
					szXml += "<manageChannel>" + _oUserInfo.oLocalPermission.bLocalIPCCfg.toString() + "</manageChannel>";
				}

				szXml += "<playBack>" + _oUserInfo.oLocalPermission.oLocalPlayback.bChecked.toString() + "</playBack>";
				szXml += "<record>" + _oUserInfo.oLocalPermission.oLocalManualRecord.bChecked.toString() + "</record>";
				szXml += "<ptzControl>" + _oUserInfo.oLocalPermission.oLocalPTZControl.bChecked.toString() + "</ptzControl>";
				szXml += "<backup>" + _oUserInfo.oLocalPermission.oLocalBackup.bChecked.toString() + "</backup>";

				szXml += "<videoChannelPermissionList>";
				for (var k in _oAllChannel) {
					szXml += "<videoChannelPermission>";
					szXml += "<id>" + k + "</id>";
					szXml += "<playBack>" + _oUserInfo.oLocalPermission.oLocalPlayback.oChannel[k].toString() + "</playBack>";
					szXml += "<record>" + _oUserInfo.oLocalPermission.oLocalManualRecord.oChannel[k].toString() + "</record>";
					szXml += "<backup>" + _oUserInfo.oLocalPermission.oLocalBackup.oChannel[k].toString() + "</backup>";
					szXml += "</videoChannelPermission>";
				}
				szXml += "</videoChannelPermissionList>";

				szXml += "<ptzChannelPermissionList>";
				for (var k in _oAllChannel) {
					szXml += "<ptzChannelPermission>";
					szXml += "<id>" + k + "</id>";
					szXml += "<ptzControl>" + _oUserInfo.oLocalPermission.oLocalPTZControl.oChannel[k].toString() + "</ptzControl>";
					szXml += "</ptzChannelPermission>";
				}
				szXml += "</ptzChannelPermissionList>";

				szXml += "</localPermission>";
			}
			// 远程权限
			szXml += "<remotePermission>";

			szXml += "<parameterConfig>" + _oUserInfo.oRemotePermission.bRemoteSetParam.toString() + "</parameterConfig>";
			szXml += "<logOrStateCheck>" + _oUserInfo.oRemotePermission.bRemoteLog.toString() + "</logOrStateCheck>";
			szXml += "<upgrade>" + _oUserInfo.oRemotePermission.bRemoteUpgrade.toString() + "</upgrade>";
			szXml += "<voiceTalk>" + _oUserInfo.oRemotePermission.bRemoteTalk.toString() + "</voiceTalk>";
			szXml += "<restartOrShutdown>" + _oUserInfo.oRemotePermission.bRemoteReboot.toString() + "</restartOrShutdown>";
			szXml += "<alarmOutOrUpload>" + _oUserInfo.oRemotePermission.bRemoteAlarm.toString() + "</alarmOutOrUpload>";
			szXml += "<contorlLocalOut>" + _oUserInfo.oRemotePermission.bRemoteCtrl.toString() + "</contorlLocalOut>";
			szXml += "<transParentChannel>" + _oUserInfo.oRemotePermission.bRemoteRS.toString() + "</transParentChannel>";
			if (_oPermissionCap.bRemoteIPCCfg) {
				szXml += "<manageChannel>" + _oUserInfo.oRemotePermission.bRemoteIPCCfg.toString() + "</manageChannel>";
			}

			szXml += "<preview>" + _oUserInfo.oRemotePermission.oRemotePreview.bChecked.toString() + "</preview>";
			szXml += "<record>" + _oUserInfo.oRemotePermission.oRemoteManualRecord.bChecked.toString() + "</record>";
			szXml += "<ptzControl>" + _oUserInfo.oRemotePermission.oRemotePTZControl.bChecked.toString() + "</ptzControl>";
			szXml += "<playBack>" + _oUserInfo.oRemotePermission.oRemotePlayback.bChecked.toString() + "</playBack>";

			szXml += "<videoChannelPermissionList>";
			for (var k in _oAllChannel) {
				szXml += "<videoChannelPermission>";
				szXml += "<id>" + k + "</id>";
				szXml += "<preview>" + _oUserInfo.oRemotePermission.oRemotePreview.oChannel[k].toString() + "</preview>";
				szXml += "<record>" + _oUserInfo.oRemotePermission.oRemoteManualRecord.oChannel[k].toString() + "</record>";
				szXml += "<playBack>" + _oUserInfo.oRemotePermission.oRemotePlayback.oChannel[k].toString() + "</playBack>";
				szXml += "</videoChannelPermission>";
			}
			szXml += "</videoChannelPermissionList>";

			szXml += "<ptzChannelPermissionList>";
			for (var k in _oAllChannel) {
				szXml += "<ptzChannelPermission>";
				szXml += "<id>" + k + "</id>";
				szXml += "<ptzControl>" + _oUserInfo.oRemotePermission.oRemotePTZControl.oChannel[k].toString() + "</ptzControl>";
				szXml += "</ptzChannelPermission>";
			}
			szXml += "</ptzChannelPermissionList>";

			szXml += "</remotePermission></UserPermission>";

			oXmlDoc = _oUtils.parseXmlFromStr(szXml);
			/*if($(oXmlDoc).find("videoChannelPermission").length > 0) {
				$(oXmlDoc).find("remotePermission").children("preview, record, playBack").text("false");
			}*/
			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "userPermission", {user: iUserID}, {
				data: oXmlDoc,
				success: function (status, xmlDoc, xhr) {
					_oResponse.saveState(xhr);
					self.getUserInfo();
				},
				error: function (status, xmlDoc, xhr) {
					_oResponse.saveState(xhr);
				}
			});
		},
		// 修改用户
		modify: function ($compile) {
			var self = this,
				oSelectedRow = null;

			_oUserInfo.bShowChannel = false;

			oSelectedRow = _oTable.getSelectedRow();

			if (oSelectedRow.item != null) {
				var iSelectIndex = oSelectedRow.item.index();

				_oUserInfo.szUsername = _aUser[iSelectIndex][0];
				_oUserInfo.szUserType = _oLevelToType[_aUserLevel[iSelectIndex]];
				_oUserInfo.bAdmin = false;
				_oUserInfo.bUserType = false;
				_oUserInfo.bDisableChannel = false;
				if (_oUserInfo.szUserType === "admin") {// 管理员权限用户名和用户类型禁用
					_oUserInfo.bAdmin = true;
					_oUserInfo.bUserType = true;
				} else {
					if (_oUserInfo.szUsername == _oCommon.m_szUsername) {// 编辑自己，只能改密码
						_oUserInfo.bUserType = true;
					}
				}
				

				$.get("config/system/userDlg.asp", function (szHtml) {
					_oDialog.html(_oTranslator.getValue("modifyUser"), szHtml, null, null, function () {
						return self.addOk("modify");
					}, function () {
						// do nothing
					}, function () {
						_oScope.oInputValidUtils.clearInputValidList();
						_oUtils.removeValidTip();
					});

					self.getUserPermission(_aUserId[iSelectIndex]);
					$compile(angular.element("#userDlg"))(_oScope);
					_oScope.$apply();

					artDialog.get("dialoghtml").position(artDialog.defaults.left, artDialog.defaults.top);
					$("#userDlg").hide().show();//解决Dialog弹出框高度计算错误
				});
			}
		},
		// 获取单个用户权限
		getUserPermission: function (iUserID) {
			var self = this,
				oLocalPermission = null,
				oRemotePermission = null,
				iId = 0;

			_oScope.bSelAllPermission = false;

			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "userPermission", {user: iUserID}, {
				success: function (status, xmlDoc, xhr) {
					// 本地权限
					oLocalPermission = $(xmlDoc).find("localPermission").eq(0);

					_oUserInfo.oLocalPermission.bLocalUpgrade = _oUtils.nodeValue(oLocalPermission, "upgrade", "b");
					_oUserInfo.oLocalPermission.bLocalReboot = _oUtils.nodeValue(oLocalPermission, "restartOrShutdown", "b");
					_oUserInfo.oLocalPermission.bLocalSetParam = _oUtils.nodeValue(oLocalPermission, "parameterConfig", "b");
					_oUserInfo.oLocalPermission.bLocalLog = _oUtils.nodeValue(oLocalPermission, "logOrStateCheck", "b");
					if (oLocalPermission.find("manageChannel").length > 0) {
						_oPermissionCap.bLocalIPCCfg = true;
						_oUserInfo.oLocalPermission.bLocalIPCCfg = _oUtils.nodeValue(oLocalPermission, "manageChannel", "b");
					} else {
						_oPermissionCap.bLocalIPCCfg = false;
						_oUserInfo.oLocalPermission.bLocalIPCCfg = false;
					}

					_oUserInfo.oLocalPermission.oLocalPlayback.bChecked = _oUtils.nodeValue(oLocalPermission, "playBack", "b");
					_oUserInfo.oLocalPermission.oLocalManualRecord.bChecked = _oUtils.nodeValue(oLocalPermission, "record", "b");
					_oUserInfo.oLocalPermission.oLocalPTZControl.bChecked = _oUtils.nodeValue(oLocalPermission, "ptzControl", "b");
					_oUserInfo.oLocalPermission.oLocalBackup.bChecked = _oUtils.nodeValue(oLocalPermission, "backup", "b");

					oLocalPermission.find("videoChannelPermission").each(function () {
						iId = _oUtils.nodeValue(this, "id", "i");
						_oUserInfo.oLocalPermission.oLocalPlayback.oChannel[iId] = _oUtils.nodeValue(this, "playBack", "b");
						_oUserInfo.oLocalPermission.oLocalManualRecord.oChannel[iId] = _oUtils.nodeValue(this, "record", "b");
						_oUserInfo.oLocalPermission.oLocalBackup.oChannel[iId] = _oUtils.nodeValue(this, "backup", "b");
					});
					oLocalPermission.find("ptzChannelPermission").each(function () {
						iId = _oUtils.nodeValue(this, "id", "i");
						_oUserInfo.oLocalPermission.oLocalPTZControl.oChannel[iId] = _oUtils.nodeValue(this, "ptzControl", "b");
					});

					// 远程权限
					oRemotePermission = $(xmlDoc).find("remotePermission").eq(0);

					_oUserInfo.oRemotePermission.bRemoteSetParam = _oUtils.nodeValue(oRemotePermission, "parameterConfig", "b");
					_oUserInfo.oRemotePermission.bRemoteLog = _oUtils.nodeValue(oRemotePermission, "logOrStateCheck", "b");
					_oUserInfo.oRemotePermission.bRemoteUpgrade = _oUtils.nodeValue(oRemotePermission, "upgrade", "b");
					_oUserInfo.oRemotePermission.bRemoteTalk = _oUtils.nodeValue(oRemotePermission, "voiceTalk", "b");
					_oUserInfo.oRemotePermission.bRemoteReboot = _oUtils.nodeValue(oRemotePermission, "restartOrShutdown", "b");
					_oUserInfo.oRemotePermission.bRemoteAlarm = _oUtils.nodeValue(oRemotePermission, "alarmOutOrUpload", "b");
					_oUserInfo.oRemotePermission.bRemoteCtrl = _oUtils.nodeValue(oRemotePermission, "contorlLocalOut", "b");
					_oUserInfo.oRemotePermission.bRemoteRS = _oUtils.nodeValue(oRemotePermission, "transParentChannel", "b");
					if (oRemotePermission.find("manageChannel").length > 0) {
						_oUserInfo.oRemotePermission.bRemoteIPCCfg = _oUtils.nodeValue(oRemotePermission, "manageChannel", "b");
					} else {
						_oUserInfo.oRemotePermission.bRemoteIPCCfg = false;
					}

					_oUserInfo.oRemotePermission.oRemotePreview.bChecked = _oUtils.nodeValue(oRemotePermission, "preview", "b");
					_oUserInfo.oRemotePermission.oRemoteManualRecord.bChecked = _oUtils.nodeValue(oRemotePermission, "record", "b");
					_oUserInfo.oRemotePermission.oRemotePTZControl.bChecked = _oUtils.nodeValue(oRemotePermission, "ptzControl", "b");
					_oUserInfo.oRemotePermission.oRemotePlayback.bChecked = _oUtils.nodeValue(oRemotePermission, "playBack", "b");

					oRemotePermission.find("videoChannelPermission").each(function () {
						iId = _oUtils.nodeValue(this, "id", "i");
						_oUserInfo.oRemotePermission.oRemotePreview.oChannel[iId] = _oUtils.nodeValue(this, "preview", "b");
						_oUserInfo.oRemotePermission.oRemoteManualRecord.oChannel[iId] = _oUtils.nodeValue(this, "record", "b");
						_oUserInfo.oRemotePermission.oRemotePlayback.oChannel[iId] = _oUtils.nodeValue(this, "playBack", "b");
					});
					oRemotePermission.find("ptzChannelPermission").each(function () {
						iId = _oUtils.nodeValue(this, "id", "i");
						_oUserInfo.oRemotePermission.oRemotePTZControl.oChannel[iId] = _oUtils.nodeValue(this, "ptzControl", "b");
					});

					_oScope.$apply();

					if (0 == $("#userDlg .permission").eq(0).find(".checkbox").not(":first").not(":checked").length) {// 权限全选
						_oScope.bSelAllPermission = true;
						_oScope.$apply();
					}
				}
			});
		},
		// 删除用户
		deleteUser: function () {
			var self = this,
				oSelectedRow = null;

			oSelectedRow = _oTable.getSelectedRow();

			if (oSelectedRow.item != null) {
				_oDialog.confirm(_oTranslator.getValue("deleteUser"), null, function () {

					WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "userDelete", {user: _aUserId[oSelectedRow.item.index()]}, {
						success: function (status, xmlDoc, xhr) {
							_oResponse.saveState(xhr, null, 1);
							self.getUserInfo();
						},
						error: function (status, xmlDoc, xhr) {
							_oResponse.saveState(xhr);
						}
					});
				});
			}
		}
	};

	module.exports = new UserManage();
});
