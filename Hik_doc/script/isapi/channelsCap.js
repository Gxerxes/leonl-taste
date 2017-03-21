define(function (require, exports, module) {
	var _oCommon, _oTranslator, _oService, _oDevice;
	_oCommon = require("common");
	_oTranslator = require("translator");
	_oService = require("config/service");
    _oDevice = require("isapi/device");
	var ChannelCaps = {
		VCAINTELLICAP: {url: "VCAIntelliCap", method: "getIntelliChannelCap"},	//专业智能能力（行为分析类型，资源类型）
		VCAINTELLISCENES: {url: "VCAIntelliScenes", method: "getIntelliChannelScene"},	//场景信息
		VCAINTELLIRESOURCE: {url: "VCAIntelliResource", method: "getIntelliChannelType"},	//专业智能资源类型
		VCAINTELLICALIBRATION: {url: "VCAIntelliCalibration", method: "getIntelliChannelCalibration"},	//相机标定
		VCAINTELLILIBVER: {url: "VCAIntelliLibVer", method: "getIntelliChannelLibVer"},	//算法库版本信息
		VCAINTELLISHIELD: {url: "VCAIntelliShield", method: "getIntelliChannelShield"},	//是否支持屏蔽区域
		DEVICETYPE: {url: "", method:""},	//用于获取设备是IPC还是DOME，不过这边没用到了,使用底下的PTZ来获取云台支持情况
		CHANNELRESOLUTION: {url: "videoInfo", method: "getChannelMainResolution"}, 	//用于主码流分辨率获取，暂时不加在这里了
		VCASCENELIST: {url: "VCAIntelliSceneRule", method: "getSceneRuleList"},		//获取场景信息列表（规则，名字好像起的不太对，以后再看要不要改吧）
		VCAGLOBALFILTER: {url: "VCAIntelliAdvanceParam", method: "getGlobalFilter"},	//是否支持全局尺寸过滤
		PTZ: {url: "", method:"getChannelPTZ"},	//是否支持云台
		VCAADVANCEDPARAMS: {url: "", method: "getGlobalFilter"},	//是否支持高级参数配置，目前后端设备不支持
		VEHICLEDETECT: {url: "", method: ""}
	};
    var oIntelliEventCapMap = {
        isLineDetectionSupport: "lineDetection",
        isFieldDetectionSupport: "fieldDetection",
        isRegionEntranceSupport: "regionEntrance",
        isRegionExitingSupport: "regionExiting",
        isLoiteringSupport: "loitering",
        isGroupSupport: "group",
        isRapidMoveSupport: "rapidMove",
        isParkingSupport: "parking",
        isUnattendedBaggageSupport: "unattendedBaggage",
        isAttendedBaggageSupport: "attendedBaggage",
        isTeacherSupport: "teacher",
        isStudentSupport: "student",
        isHumanDetectSupp: "humandetection",
        isCombinedSupport: "combined"
    };

	function channelsCap() {
		//通道信息，基本用在专业智能上了
		this.channelsInfo = {};
		//通道信息更新状态
		this.channelsStat = {};
	}

	channelsCap.prototype = {
		getChannelsList: function(intelliChannelsInfo) {
			intelliChannelsInfo.oAnalogId.length = 0;
			intelliChannelsInfo.oDigital.length = 0;
			intelliChannelsInfo.iAnalogChannelNum = 0;
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, 'VCAChannelsList', {}, {
				async: false,
				success: function(status, xmlDoc) {
					var aChannels = [], ilength;
					$(xmlDoc).find("IntelliChannel").each(function(){
						aChannels.push(parseInt($(this).find("id").text(), 10));
					});
					ilength = aChannels.length;
					for(var i = 0; i < ilength; i++) {
						if($.inArray(aChannels[i], _oService.m_aOnlineAnalogChannelId) >= 0) {
							intelliChannelsInfo.oAnalogId.push(aChannels[i]);
						} else if($.inArray(aChannels[i], _oService.m_aOnlineDigitalChannelId) >= 0) {
							intelliChannelsInfo.oDigital.push(aChannels[i]);
						}
					}
					intelliChannelsInfo.iAnalogChannelNum = intelliChannelsInfo.oAnalogId.length;
				},
                error: function() {
                    WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "VCAIntelliCap", {channel: 1}, {
                        async: false,
                        success: function () {
                            intelliChannelsInfo.oAnalogId.push(1);
                            intelliChannelsInfo.iAnalogChannelNum = 1;
                        }
                    });
                }
			});
		},
		//添加通道及通道能力，包括新能力的添加和旧能力的覆盖，共2级，第一级能力的index,第二级能力的描述（2级下可以再分，但不能新增仅能覆盖）
		addChannel: function(iChannel, oParam) {
			if(typeof oParam != 'object') {
				return;
			}
			//结构上考虑优化下，每个都判断重复了
			iChannel = _validChannel(iChannel);
			//好像不需要异常处理，后续测试下
			try {
				for(key in oParam) {
					if(!this.channelsInfo[iChannel]) {
						this.channelsInfo[iChannel] = {};
					}
					this.channelsInfo[iChannel][key] = oParam[key];
				}
			} catch(e) {}
		},
		//删除通道及能力
		removeChannel: function(iChannel) {
			iChannel = _validChannel(iChannel);
			delete this.channelsInfo[iChannel];
		},
		setChannelStat: function(iChannel, szIndex, bUpdate) {
			if(!this.channelsStat[iChannel]) {
				this.channelsStat[iChannel] = {};
			}
			if(typeof bUpdate == "undefined") {
				bUpdate = false;
			}
			this.channelsStat[iChannel][szIndex] = bUpdate;
		},
		//获取通道对应能力
		getChannelCap: function(iChannel, szCapName, iScene) {
			//已经获取过了就不需要重新获取了
			var bChannelInfo = !this.channelsInfo[iChannel] || typeof this.channelsInfo[iChannel][szCapName] == 'undefined';
			if(bChannelInfo || this.channelsStat[iChannel][szCapName]) {
				this.updateIntelliChannelInfo(iChannel, szCapName, iScene);
			}
			return this.channelsInfo[iChannel][szCapName];
		},
		//设备对云台支持
		getChannelPTZ: function(iChannel) {
			iChannel = _validChannel(iChannel);
			this.addChannel(iChannel, {PTZ : _oService.isPTZLock()});
		},
		//专业智能资源类型能力及行为分析事件能力
		getIntelliChannelCap: function(iChannel){
			iChannel = _validChannel(iChannel);
			var self = this;
			var iOldCap = self.channelsInfo[iChannel];
			iOldCap = iOldCap ? (iOldCap["VCAINTELLICAP"] ? iOldCap["VCAINTELLICAP"]["arrIntelliCap"].length : 0 ) : 0; 
			var oVCAIntelliCap = {
				arrIntelliCap: [],	//资源类型能力
				arrEventTypes: ['none']	//行为分析能力，默认有个无
			};
			self.setChannelStat(iChannel, "VCAINTELLICAP", true);
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["VCAINTELLICAP"]["url"], {channel:iChannel}, {
				async: false,
				success: function(status, xmlDoc){
					//找个机会改掉吧，太难看了
					if($(xmlDoc).find("isFaceSupport").text() == "true") {
						oVCAIntelliCap.arrIntelliCap.push("face");
					}
					if($(xmlDoc).find("isBehaviorSupport").text() == "true") {
						oVCAIntelliCap.arrIntelliCap.push("behavior");
					}
					if(oVCAIntelliCap.arrIntelliCap.length == 2) {
						oVCAIntelliCap.arrIntelliCap.push("behaviorandface");
					}
                    for(var key in oIntelliEventCapMap) {
                        if($(xmlDoc).find(key).text() == "true") {
                            oVCAIntelliCap.arrEventTypes.push(oIntelliEventCapMap[key]);
                        }
                    }
					self.addChannel(iChannel, {VCAINTELLICAP : oVCAIntelliCap});
					if(iOldCap != oVCAIntelliCap.arrIntelliCap.length) {
						if(self.channelsStat[iChannel]) {
							for(key in self.channelsStat[iChannel]) {
								self.channelsStat[iChannel][key] = true;
							}
						}
						
					}
				},
				error: function() {
					self.addChannel(iChannel, {VCAINTELLICAP : oVCAIntelliCap});
				}
			});
		},
		//获取专业智能通道资源类型
		getIntelliChannelType: function(iChannel) {
			iChannel = _validChannel(iChannel);
			var self = this;
			self.setChannelStat(iChannel, "VCAINTELLIRESOURCE", true);
            if(_oDevice.m_oDeviceCapa.oVCAResourceType == "basicBehavior" || _oDevice.m_oDeviceCapa.oVCAResourceType == "" || _oDevice.m_oDeviceCapa.oVCAResourceType == "fullBehavior") {
                self.addChannel(iChannel, {VCAINTELLIRESOURCE: "behavior"});
            } else if(_oDevice.m_oDeviceCapa.oVCAResourceType == "facesnap") {
                self.addChannel(iChannel, {VCAINTELLIRESOURCE: "face"});
            } else if(_oDevice.m_oDeviceCapa.oVCAResourceType == "facesnapBehavior") {
                self.addChannel(iChannel, {VCAINTELLIRESOURCE: "behaviorandface"});
            } else if(_oDevice.m_oDeviceCapa.oVCAResourceType !== "") {
                self.addChannel(iChannel, {VCAINTELLIRESOURCE: ''});
                return;
            }
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["VCAINTELLIRESOURCE"]["url"], {channel:iChannel}, {
				async: false,
				success: function(status, xmlDoc){
					var oVCAType = $(xmlDoc).find("type").text();
					self.addChannel(iChannel, {VCAINTELLIRESOURCE: oVCAType});
				},
				error: function(){
					self.addChannel(iChannel, {VCAINTELLIRESOURCE: ''});
				}
			});
		},
		//获取专业智能场景
		getIntelliChannelScene: function(iChannel) {
			iChannel = _validChannel(iChannel);
			var self = this;
			var oSceneList = {
				iSceneNum: 0, //支持的最大场景数
				iCurSceneNum: 0,	//当前场景数
				arrSceneInfoList: []	//场景列表
			};
			//目前是写死的10个，后续看是否有办法优化
			for(var i=0; i < 10; i++) {
				oSceneList.arrSceneInfoList.push({sceneID : i + 1, sceneName : _oTranslator.getValue("SceneDefault") + (i + 1), scenePatrol : 0, sceneEnable: false, scenePatrolTime: 0})
			}
			self.setChannelStat(iChannel, "VCAINTELLISCENES");
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["VCAINTELLISCENES"]["url"], {channel:iChannel}, {
				async: false,
				success: function(status, xmlDoc){
					//根节点的上有支持场景数量能力
					oSceneList.iSceneNum = parseInt($(xmlDoc).find(":first").attr("size"), 10);
					oSceneList.iSceneNum = oSceneList.iSceneNum ? oSceneList.iSceneNum : 1;
					//找到的设置sceneEnable为true表示可用
					$(xmlDoc).find("IntelliTraceBlock").each(function() {
						var szSceneName = $(this).find("sceneName").text();
						var szSceneID = $(this).find("sid").text();
						oSceneList.arrSceneInfoList[parseInt($(this).find("sid").text(), 10) - 1] = {
							sceneID : szSceneID,
							//为空则默认显示场景+ID，不然样式上会有问题
							sceneName : szSceneName == '' ? _oTranslator.getValue("SceneDefault") + szSceneID : szSceneName,
							scenePatrol : $(this).find("patrolId").text(), 
							sceneEnable: true, 
							scenePatrolTime: $(this).find("dwelltime").text()
						};
						oSceneList.iCurSceneNum++;
					});
					self.addChannel(iChannel, {VCAINTELLISCENES: oSceneList});
				},
				error: function(){
					self.addChannel(iChannel, {VCAINTELLISCENES: oSceneList});
				}
			});
		},
		//获取专业智能通道相机标定状态,用于实际大小过滤等
		getIntelliChannelCalibration: function(iChannel) {
			iChannel = _validChannel(iChannel);
			var self = this;
			self.setChannelStat(iChannel, "VCAINTELLICALIBRATION");
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["VCAINTELLICALIBRATION"]["url"], {channel:iChannel}, {
				async: false,
				success: function(status, xmlDoc){
                    var bCalibration = $(xmlDoc).find("enabled").text() == "true";
					self.addChannel(iChannel, {VCAINTELLICALIBRATION: bCalibration});
				},
                error: function() {
					//错误的情况下返回null
                    self.addChannel(iChannel, {VCAINTELLICALIBRATION: null});
                }
			});
		},
		//获取专业智能算法库版本信息
		getIntelliChannelLibVer: function(iChannel) {
			iChannel = _validChannel(iChannel);
			var self = this;
			//人脸库版本，行为库版本，行为库版本（浮点数）
			var oVersion = {FaceVer: '', BehaviorVer: '', fBehaviorVer: 0, bSupport: true};
			self.setChannelStat(iChannel, "VCAINTELLILIBVER");
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["VCAINTELLILIBVER"]["url"], {channel:iChannel}, {
				async: false,
				success: function(status, xmlDoc){
					//由于仅有版本信息，需要根据资源类型来进行判断
					if(self.getChannelCap(iChannel, "VCAINTELLIRESOURCE") == "face") {
						oVersion["FaceVer"] = $(xmlDoc).find("algName").text();
					} else if(self.getChannelCap(iChannel, "VCAINTELLIRESOURCE") == "behavior") {
						oVersion["BehaviorVer"] = $(xmlDoc).find("algName").text();
					} else {
						oVersion["FaceVer"] = $(xmlDoc).find("algName").eq(0).text();
						oVersion["BehaviorVer"] = $(xmlDoc).find("algName").eq(1).text();
					}
					//获得build之前的数字
					oVersion.fBehaviorVer = oVersion["BehaviorVer"].replace(/V((\d+\.?)+)build.*/, '$1');
					//截取数字并进行转换
					if(oVersion.fBehaviorVer != oVersion["BehaviorVer"]) {
						oVersion.fBehaviorVer = parseFloat(oVersion.fBehaviorVer.replace(/(\d+\.)((\d+)\.+)+/, "$1$3"));
					} else {
						oVersion.fVersion = 0;
					}
					self.addChannel(iChannel, {VCAINTELLILIBVER: oVersion});
				},
				error: function(){
					oVersion.bSupport = false;
					self.addChannel(iChannel, {VCAINTELLILIBVER: oVersion});
				}
			});
		},
		//获取专业智能屏蔽区域支持
		getIntelliChannelShield: function(iChannel) {
			iChannel = _validChannel(iChannel);
			var self = this;
			self.setChannelStat(iChannel, "VCAINTELLISHIELD");
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["VCAINTELLISHIELD"]["url"], {channel:iChannel}, {
				async: false,
				success: function(){
					self.addChannel(iChannel, {VCAINTELLISHIELD: true});
				},
				error: function(){
					self.addChannel(iChannel, {VCAINTELLISHIELD: false});
				}
			});
		},
		//获取规则列表
		getSceneRuleList: function(iChannel, iScene) {
			iChannel = _validChannel(iChannel);
			//scene和channel不太对的起来，虽然用法相同，之后考虑
			iScene = _validChannel(iScene);
			var self = this;
			self.setChannelStat(iChannel, "VCASCENELIST");
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["VCASCENELIST"]["url"], {channel:iChannel, scene:iScene}, {
				async: false,
				success: function(status, xmlDoc){
					var arrRuleList = []; 
					$(xmlDoc).find("RuleInfo").each(function(){
						if($(this).find("eventType").text() != 'none') {
							arrRuleList.push({
								ruleId:$(this).find("ruleId").text(),	//规则ID 
								ruleName:$(this).find("ruleName").text(), 	//规则名称
								ruleType:$(this).find("eventType").text(), 	//规则类型
								ruleEnabled:$(this).find("enabled").eq(0).text() == "true"	//规则启用
							});
						}
					});
					self.addChannel(iChannel, {VCASCENELIST: arrRuleList});
				},
				error: function(){
					self.addChannel(iChannel, {VCASCENELIST: []});
				}
			});
		},
		//主码流分辨率
		getChannelMainResolution: function(iChannel) {
			iChannel = _validChannel(iChannel);
			var self = this;
			var resolution = {
				width: 0,
				height: 0
			};
			self.setChannelStat(iChannel, "CHANNELRESOLUTION");
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["CHANNELRESOLUTION"]["url"], {channel:iChannel, videoStream: "01"}, {
				async: false,
				success: function(status, xmlDoc) {
					var iWidth = parseInt($(xmlDoc).find("videoResolutionWidth").text(), 10);
					var iHeight = parseInt($(xmlDoc).find("videoResolutionHeight").text(), 10);
					resolution["width"] = iWidth;
					resolution["height"] = iHeight;
				}
			});
			self.addChannel(iChannel, {CHANNELRESOLUTION: resolution});
		},
		//是否支持全局尺寸过滤，和高级参数支持一起设置
		getGlobalFilter: function(iChannel) {
			iChannel = _validChannel(iChannel);
			var self = this;
			self.setChannelStat(iChannel, "VCAADVANCEDPARAMS");
			self.setChannelStat(iChannel, "VCAGLOBALFILTER");
			WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, ChannelCaps["VCAGLOBALFILTER"]["url"], {channel:iChannel, videoStream: "01"}, {
				async: false,
				success: function(status, xmlDoc) {
					self.addChannel(iChannel, {VCAADVANCEDPARAMS: true});
					//高级参数中有sizefilter则说明支持全局尺寸过滤
					self.addChannel(iChannel, {VCAGLOBALFILTER: $(xmlDoc).find("SizeFilter").length > 0});
				},
				error: function(){
					self.addChannel(iChannel, {VCAADVANCEDPARAMS: false});
					self.addChannel(iChannel, {VCAGLOBALFILTER: false});
				}
			});
			
		},
		//根据类型更新通道信息
		updateIntelliChannelInfo: function(iChannel, szType, iScene) {
			iChannel = _validChannel(iChannel);
			var self = this;
			try {
				self[ChannelCaps[szType]["method"]](iChannel, iScene);
			} catch(e){}
			return this.channelsInfo[iChannel][szType];
		},
		//添加场景
		addScene: function(iChannel, iSceneID) {
			iChannel = _validChannel(iChannel);
			var bResult = false, oSceneList = this.getChannelCap(iChannel, "VCAINTELLISCENES"),
				szXml = '<?xml version="1.0"?><IntelliTraceBlock version="1.0">' 
					+ '<sid>' + iSceneID + '</sid>' 
					+ '<sceneName></sceneName>' 
					+ '<patrolId>0</patrolId>' 
					+ '<dwelltime>0</dwelltime>' 
					+ '<traceEnable>true</traceEnable>' 
					+ '<trackDuration>300</trackDuration>' 
					+ '<PTZLimitEnable>false</PTZLimitEnable>' 
				+ '</IntelliTraceBlock>';
			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "VCAIntelliSceneParam", {channel: iChannel, scene: iSceneID}, {
				async: false,
				processData: false,
				data: szXml,
				success: function () {
					//成功后更新列表信息
					oSceneList.arrSceneInfoList[parseInt(iSceneID, 10) - 1]["sceneEnable"] = true;
					oSceneList.arrSceneInfoList[parseInt(iSceneID, 10) - 1]["SceneName"] = _oTranslator.getValue("SceneDefault") + iSceneID;
					oSceneList.iCurSceneNum++;
					bResult = true;
				},
				error: function(){
					bResult = false;
				}
			});
			return bResult;
		},
		//删除场景
		delScene: function(iChannel, iSceneID) {
			iChannel = _validChannel(iChannel);
			var bResult = false,
				oSceneList = this.getChannelCap(iChannel, "VCAINTELLISCENES");
			WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "delVCAIntelliScene", {channel: iChannel, scene: iSceneID}, {
				async: false,
				success: function () {
					//成功后更新列表信息
					oSceneList.arrSceneInfoList[parseInt(iSceneID, 10) - 1]["sceneEnable"] = false;
					oSceneList.arrSceneInfoList[parseInt(iSceneID, 10) - 1]["scenePatrol"] = 0;
					oSceneList.arrSceneInfoList[parseInt(iSceneID, 10) - 1]["scenePatrolTime"] = 0;
					oSceneList.iCurSceneNum--;
					bResult = true;
				},
				error: function(){
					bResult = false;
				}
			});
			return bResult;
		}
	};
	
	//检测通道是否有效，无效默认1
	var _validChannel = function(iChannel) {
		if(typeof iChannel == "undefined" || !/^\d+$/.test(iChannel)) {
			iChannel = 1;
		}
		return iChannel;
	};
	
	module.exports = new channelsCap();
});