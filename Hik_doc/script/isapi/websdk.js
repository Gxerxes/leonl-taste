define(function (require, exports, module) {
	var oBase64, oUtils;

	oBase64 = require("base64");
	oUtils = require("utils");

	function WebSDK() {
		//宏定义

		//协议模块自定义状态
		var WSDK_ERROR_COMMOD = 1; //命令错误
		var WSDK_ERROR_PARAMNUM = 2; //参数个数错误

		//http状态
		var HTTP_STATUS_200 = 200;
		var HTTP_STATUS_400 = 400;
		var HTTP_STATUS_401 = 401;

		//可选参数名字
		var PARAM_OPTION_CHANNEL = "channel";
		var PARAM_OPTION_STREAM = "videoStream";
		var PARAM_OPTION_DISK = "disk";
		var PARAM_OPTION_PRESET = "preset";
		var PARAM_OPTION_PATROL = "patrol";
		var PARAM_OPTION_PATTERN = "pattern";
		var PARAM_OPTION_EXCEPTION = "exception";
		var PARAM_OPTION_IO = "io";
		var PARAM_OPTION_OUTPUT = "output";
		var PARAM_OPTION_MODE = "mode";
		var PARAM_OPTION_USERTYPE = "userType";
		var PARAM_OPTION_USER = "user";
		var PARAM_OPTION_CUSTOM = "custom";
		var PARAM_OPTION_REGION = "region";
		var PARAM_OPTION_SCENE = "scene";
		var PARAM_OPTION_DERECTION = "direction";
		var PARAM_OPTION_LINE = "line";
		var PARAM_OPTION_SMART = "smart";
		var PARAM_OPTION_LINK = "link";
		var PARAM_OPTION_SCHEDULE = "schedule";
		var PARAM_OPTION_INTERFACE = "interface";
		var PARAM_OPTION_CLOUD = "cloud";
		var PARAM_OPTION_TIMESTAMP = "timeStamp";
        var PARAM_OPTION_SENSOR = 'sensor';
        var PARAM_OPTION_MESSAGE = 'message';
		var PARAM_OPTION_LIMIT = "limit";
		var PARAM_OPTION_SCHEDULETYPE = "scheduleType";
		var PARAM_OPTION_SERIALPORT = "serialPort";
        var PARAM_OPTION_VOICE = "voice";
		var PARAM_OPTION_INTERSECTION = "intersection";
		var PARAM_OPTION_SENSOR = "sensor";

		var m_oTransMethord = null;  //交互模式类，每次使用前需要创建新的实例
		var m_deviceSet = [];  //设备列表
		var m_bDebug = false;
		var self = this;

		this.CGI = {
			//设备语言
			deviceLan: {url: "%s%s:%s/SDK/language"},
			//登录
			login: {
				url: "%s%s:%s/ISAPI/Security/userCheck?timeStamp=%s",
				req: [PARAM_OPTION_TIMESTAMP]
			},

			//加密字符串
			challenge: {url: "%s%s:%s/ISAPI/Security/challenge"},
			//激活状态
			activateStatus: {url: "%s%s:%s/SDK/activateStatus"},
			//激活设备
			activate: {url: "%s%s:%s/ISAPI/System/activate"},
			//激活IPC
			activateIPC: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/activate"},
			//私有取流
			sHttpCapa: {url: "%s%s:%s/SDK/capabilities"},

			//设备信息
			deviceCapa: {url: "%s%s:%s/ISAPI/System/capabilities"},
			deviceInfoCapa: {url: "%s%s:%s/ISAPI/System/deviceInfo/capabilities"},
			deviceInfo: {url: "%s%s:%s/ISAPI/System/deviceInfo"},
			imageCap: {
				url: "%s%s:%s/ISAPI/Image/channels/%s/imageCap",
				req: [PARAM_OPTION_CHANNEL]
			},
			imageInfo: {url: "%s%s:%s/ISAPI/Image/channels"},
			smartCap: {url: "%s%s:%s/ISAPI/Smart/capabilities"},

			//通道信息
			AnalogChannelInfo: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels"},
			AnalogChannelSingleInfo: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			DigitalChannelInfo: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels"},
			ChannelSingleInfo: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s"},
				req: [PARAM_OPTION_CHANNEL]
			},
			DigitalChannelStatus: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/status"},
			ZeroChannelInfo: {url: "%s%s:%s/ISAPI/ContentMgmt/ZeroVideo/channels"},
			StreamChannels: {url: "%s%s:%s/ISAPI/Streaming/channels"},
			StreamProxyChannels: {url: "%s%s:%s/ISAPI/ContentMgmt/StreamingProxy/channels"},
			sourceSupport: {url: "%s%s:%s/ISAPI/ContentMgmt/sourceSupport"},
			addIpc: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels"},
			modifyIpc: {
				url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			deleteIpc: {
				url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			sourceCapability: {
				url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/sourceCapability"
			},
			ipcSearch: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/search"},
			customProtocol: {
				url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/customProtocols/%s",
				req: [PARAM_OPTION_CUSTOM]
			},
			customProtocolCap: {
				url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/customProtocols/%s/capabilities",
				req: [PARAM_OPTION_CUSTOM]
			},

			//对讲信息
			talkInfo: {
				url: "%s%s:%s/ISAPI/System/TwoWayAudio/channels/1/"
			},
			talkListInfo: {
				url: "%s%s:%s/ISAPI/System/TwoWayAudio/channels"
			},
			holidayInfo: {
				url: "%s%s:%s/ISAPI/System/Holidays"
			},
			pnpInfo: {
				url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/pnp"
			},

			//报警输出
			AnalogAlarmOutputInfo: {url: "%s%s:%s/ISAPI/System/IO/outputs"},
			DigitalAlarmOutputInfo: {url: "%s%s:%s/ISAPI/ContentMgmt/IOProxy/outputs"},

			//报警输入
			AnalogAlarmInputInfo: {url: "%s%s:%s/ISAPI/System/IO/inputs"},
			DigitalAlarmInputInfo: {url: "%s%s:%s/ISAPI/ContentMgmt/IOProxy/inputs"},

			//通道相关
			//字符叠加能力
			overlayCapa: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/overlays/capabilities"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/overlays/capabilities"},
				req: [PARAM_OPTION_CHANNEL]
			},
			//字符叠加信息
			overlayInfo: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/overlays"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/overlays"},
				req: [PARAM_OPTION_CHANNEL]
			},
			//道路信息
			roadInfoCap: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/roadInfo/%s/overlays/capabilities",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_INTERSECTION]
			},
			roadInfo: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/roadInfo/%s/overlays",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_INTERSECTION]
			},
			//前端参数切换
			displayParamSwitchCap: {
				url: "%s%s:%s/ISAPI/Image/channels/%s/displayParamSwitch/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			displayParamSwitchInfo: {
				url: "%s%s:%s/ISAPI/Image/channels/%s/displayParamSwitch",
				req: [PARAM_OPTION_CHANNEL]
			},
			//外接显示器
			thScreenCap: {
				url: "%s%s:%s/ISAPI/System/externalDevice/THScreen/capabilities"
			},
			thScreenInfo: {
				url: "%s%s:%s/ISAPI/System/externalDevice/THScreen"
			},
			thScreenTiming: {
				url: "%s%s:%s/ISAPI/System/externalDevice/THScreen/timing"
			},
			//编码参数
			videoCapa: {
				analog: {url: "%s%s:%s/ISAPI/Streaming/channels/%s%s/capabilities"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/StreamingProxy/channels/%s%s/capabilities"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_STREAM]
			},
			//视频动态能力
			videoDynamicCapa: {
				url: "%s%s:%s/ISAPI/Streaming/channels/%s%s/dynamicCap",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_STREAM]
			},
			dynamicCapWithCondition: {
				url: "%s%s:%s/ISAPI/Streaming/channels/%s%s/dynamicCapWithCondition",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_STREAM]
			},
			videoInfo: {
				analog: {url: "%s%s:%s/ISAPI/Streaming/channels/%s%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/StreamingProxy/channels/%s%s"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_STREAM]
			},
			//音频参数
			audioCapa: {
				url: "%s%s:%s/ISAPI/System/TwoWayAudio/channels/%s/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			audioInfo: {
				url: "%s%s:%s/ISAPI/System/TwoWayAudio/channels/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			//音频动态能力
			audioDynamicCapa: {
				url: "%s%s:%s/ISAPI/System/Audio/channels/%s/dynamicCap",
				req: [PARAM_OPTION_CHANNEL]
			},
			//事件编码参数
			eventVideoCapa: {
				url: "%s%s:%s/ISAPI/Event/notification/Streaming/%s01/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			//此处可能有问题，基线的模拟通道和数字通道获取方式不同，模拟是一次全部通道获取，此处暂时改成只能一个一个地获取
			eventVideoInfo: {
				analog: {url: "%s%s:%s/ISAPI/Event/notification/Streaming/%s01"},
				digital: {url: "%s%s:%s/ISAPI/Event/notification/Streaming/%s01"},
				req: [PARAM_OPTION_CHANNEL]
			},

			//图片叠加
			pictureOverlayInfo: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/image",
				req: [PARAM_OPTION_CHANNEL]
			},

			//零通道参数
			zeroChannelCapa: {
				url: "%s%s:%s/ISAPI/ContentMgmt/ZeroStreaming/channels/101/capabilities"
			},
			zeroChannelInfo: {
				url: "%s%s:%s/ISAPI/ContentMgmt/ZeroStreaming/channels/101"
			},
			zeroChannelEnable: {
				url: "%s%s:%s/ISAPI/ContentMgmt/ZeroVideo/channels/1"
			},

			//录像计划
			recordCap: {
				url: "%s%s:%s/ISAPI/ContentMgmt/record/tracks/%s01/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			captureCap: {
				url: "%s%s:%s/ISAPI/ContentMgmt/record/tracks/%s03/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			trackInfo: {url: "%s%s:%s/ISAPI/ContentMgmt/record/tracks"},

			// 事件能力（异常类型）
			eventCapa: {url: "%s%s:%s/ISAPI/Event/capabilities"},
			exceptionLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/%s",
				req: [PARAM_OPTION_EXCEPTION]
			},
			snapshotCap: {
				analog: {url: "%s%s:%s/ISAPI/Snapshot/channels/%s/capabilities"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/SnapshotProxy/channels/%s/capabilities"},
				req: [PARAM_OPTION_CHANNEL]
			},
			snapshotInfo: {
				analog: {url: "%s%s:%s/ISAPI/Snapshot/channels/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/SnapshotProxy/channels/%s"},
				req: [PARAM_OPTION_CHANNEL]
			},
			snapshotListInfo: {
				analog: {url: "%s%s:%s/ISAPI/Snapshot/channels"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/SnapshotProxy/channels"},
				req: [PARAM_OPTION_CHANNEL]
			},
			//移动侦测
			motionCapa: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/motionDetection/capabilities"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/motionDetection/capabilities"},
				req: [PARAM_OPTION_CHANNEL]
			},
			motionInfo: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/motionDetection"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/motionDetection"},
				req: [PARAM_OPTION_CHANNEL]
			},
			motionExtInfo: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/motionDetectionExt",
				req: [PARAM_OPTION_CHANNEL]
			},
			motionLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/VMD-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			motionSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/motionDetections/VMD_video%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			tamperdetectCapa: {  //遮挡报警
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/tamperDetection/capabilities"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/tamperDetection/capabilities"},
				req: [PARAM_OPTION_CHANNEL]
			},
			videoTamperInfo: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/tamperDetection"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/tamperDetection"},
				req: [PARAM_OPTION_CHANNEL]
			},
			videoTamperLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/tamper-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			videoTamperSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/tamperDetections/Tamperdetection_video%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			videoTamperRegion: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/tamperDetection/regions"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/tamperDetection/regions"},
				req: [PARAM_OPTION_CHANNEL]
			},

			//视频遮盖
			tamperInfo: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/privacyMask"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/privacyMask"},
				req: [PARAM_OPTION_CHANNEL]
			},
			tamperRegion: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/privacyMask/regions"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/privacyMask/regions"},
				req: [PARAM_OPTION_CHANNEL]
			},
			deleteTamperRegion: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/privacyMask/regions"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/InputProxy/channels/%s/video/privacyMask/regions"},
				req: [PARAM_OPTION_CHANNEL]
			},

			// 显示设置
			displayCap: {
				analog: {url: "%s%s:%s/ISAPI/Image/channels/%s/%s/capabilities"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/ImageProxy/channels/%s/%s/capabilities"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCHEDULETYPE]
			},
			displayScene: {url: "%s%s:%s/ISAPI/Image/channels/imageModes"},
			displayInfo: {
				analog: {url: "%s%s:%s/ISAPI/Image/channels/%s/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/ImageProxy/channels/%s/%s"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCHEDULETYPE]
			},
			displayModeInfo: {
				analog: {url: "%s%s:%s/ISAPI/Image/channels/%s/%s/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/ImageProxy/channels/%s/%s/%s"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_MODE, PARAM_OPTION_SCHEDULETYPE]
			},
			displayISPMode: {
				analog: {url: "%s%s:%s/ISAPI/Image/channels/%s/ISPMode"},
				req: [PARAM_OPTION_CHANNEL]
			},

			//视频丢失
			videoLossInfo: {
				analog: {url: "%s%s:%s/ISAPI/Image/channels/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/ImageProxy/channels/%s"},
				req: [PARAM_OPTION_CHANNEL]
			},
			videoLossLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/videoloss-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			videoLossSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/videolosses/Videoloss_video%s",
				req: [PARAM_OPTION_CHANNEL]
			},

			//报警输入
			alarmInputInfo: {
				analogIO: {url: "%s%s:%s/ISAPI/System/IO/inputs/%s"},
				digitalIO: {url: "%s%s:%s/ISAPI/ContentMgmt/IOProxy/inputs/%s"},
				req: [PARAM_OPTION_IO]
			},
			alarmInputLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/IO-%s",
				req: [PARAM_OPTION_IO]
			},
			alarmInputSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/inputs/%s",
				req: [PARAM_OPTION_IO]
			},

			//报警输出
			alarmOutputInfo: {
				analogIO: {url: "%s%s:%s/ISAPI/System/IO/outputs/%s"},
				digitalIO: {url: "%s%s:%s/ISAPI/ContentMgmt/IOProxy/outputs/%s"},
				req: [PARAM_OPTION_IO]
			},
			alarmOutputSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/outputs/%s",
				req: [PARAM_OPTION_IO]
			},
			alarmOutputTrigger: {
				analogIO: {url: "%s%s:%s/ISAPI/System/IO/outputs/%s/trigger"},
				digitalIO: {url: "%s%s:%s/ISAPI/ContentMgmt/IOProxy/outputs/%s/trigger"},
				req: [PARAM_OPTION_IO]
			},
			alarmOutputStatus: {
				analogIO: {url: "%s%s:%s/ISAPI/System/IO/outputs/%s/status"},
				digitalIO: {url: "%s%s:%s/ISAPI/ContentMgmt/IOProxy/outputs/%s/status"},
				req: [PARAM_OPTION_IO]
			},

			//PIR报警
			alarmPIRInfo: {
				url: "%s%s:%s/ISAPI/WLAlarm/PIR"
			},
			//无线报警
			alarmWLS: {
				url: "%s%s:%s/ISAPI/WLAlarm/WLSensors/%s",
				req: [PARAM_OPTION_SENSOR]
			},
			//smart
			audioDetectCap: {
				url: "%s%s:%s/ISAPI/Smart/AudioDetection/channels/%s/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			audioDetectInfo: {
				url: "%s%s:%s/ISAPI/Smart/AudioDetection/channels/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			audioDetectionStatus: {
				url: "%s%s:%s/ISAPI/Smart/AudioDetection/channels/%s/status",
				req: [PARAM_OPTION_CHANNEL]
			},
			audioDetectLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/audioexception-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			audioDetectSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/audioDetections/audioexception_%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			virtualFocus: {
				url: "%s%s:%s/ISAPI/Smart/DefocusDetection/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			virtualFocusLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/defocus-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			sceneChangeInfo: {
				url: "%s%s:%s/ISAPI/Smart/SceneChangeDetection/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			sceneChangeLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/scenechangedetection-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			sceneChangeSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/sceneChangeDetections/scenechangedetection_video%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			faceDetectCap: {
				url: "%s%s:%s/ISAPI/Smart/FaceDetect/%s/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			faceDetectInfo: {
				url: "%s%s:%s/ISAPI/Smart/FaceDetect/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			faceDetectLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/facedetection-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			faceDetectSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/faceDetections/facedetection_video%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			roiCapa: {
				url: "%s%s:%s/ISAPI/Smart/ROI/channels/%s%s/capabilities",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_STREAM]
			},
			allRoiInfo: {
				url: "%s%s:%s/ISAPI/Smart/ROI/channels"
			},
			roiInfo: {
				url: "%s%s:%s/ISAPI/Smart/ROI/channels/%s%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_STREAM]
			},
			oneRoiRegion: {
				url: "%s%s:%s/ISAPI/Smart/ROI/channels/%s%s/regions/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_STREAM, PARAM_OPTION_IO]
			},
			
			//RS485
			rs485Capa: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/capabilities"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/capabilities"},
				req: [PARAM_OPTION_CHANNEL]
			},

			rs485Info: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s"},
				req: [PARAM_OPTION_CHANNEL]
			},

			//网络相关
			networkBondCapa: {url: "%s%s:%s/ISAPI/System/Network/Bond/capabilities"},
			networkBond: {url: "%s%s:%s/ISAPI/System/Network/Bond/1"},
			networkInterfaceCapa: {url: "%s%s:%s/ISAPI/System/Network/interfaces/1/capabilities"},
			networkInterface: {url: "%s%s:%s/ISAPI/System/Network/interfaces"},
			networkInterfacePut: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/%s",
				req: [PARAM_OPTION_INTERFACE]
			},
			PPPoEInfo: {url: "%s%s:%s/ISAPI/System/Network/PPPoE/1"},
			PPPoEStatus: {url: "%s%s:%s/ISAPI/System/Network/PPPoE/1/status"},
			ddnsCapa: {url: "%s%s:%s/ISAPI/System/Network/DDNS/capabilities"},
			ddnsInfo: {url: "%s%s:%s/ISAPI/System/Network/DDNS/1"},
			ddnsCountry: {url: "%s%s:%s/ISAPI/System/Network/DDNS/CountryID/capabilities"},
			email: {url: "%s%s:%s/ISAPI/System/Network/mailing"},
			emailCap: {url: "%s%s:%s/ISAPI/System/Network/mailing/capabilities"},
			snmp: {url: "%s%s:%s/ISAPI/System/Network/SNMP"},
			portInfo: {url: "%s%s:%s/ISAPI/Security/adminAccesses"},
			ftpCapa: {url: "%s%s:%s/ISAPI/System/Network/ftp/capabilities"},
			ftpEvent: {url: "%s%s:%s/ISAPI/Event/notification/ftp"},
			ftpInfo: {url: "%s%s:%s/ISAPI/System/Network/ftp"},
			upnp: {url: "%s%s:%s/ISAPI/System/Network/UPnP"},
			upnpStatus: {url: "%s%s:%s/ISAPI/System/Network/UPnP/ports/status"},
			alarmCenter: {url: "%s%s:%s/ISAPI/Event/notification/alarmCenter/1"},
			telnet: {url: "%s%s:%s/ISAPI/System/Network/telnetd"},
			cfg28181: {url: "%s%s:%s/ISAPI/System/Network/SIP"},
			sip28181Cap: {url:"%s%s:%s/ISAPI/System/Network/SIP/1/capabilities"},
			sip28181: {url: "%s%s:%s/ISAPI/System/Network/SIP/1/SIPInfo"},
            dial:{url: "%s%s:%s/ISAPI/System/Network/WirelessDial/Interfaces/1/dial"},
			dialstatus: {url: "%s%s:%s/ISAPI/System/Network/WirelessDial/Interfaces/1/dialstatus"},
            dialCap: {url: "%s%s:%s/ISAPI/System/Network/WirelessDial/Interfaces/1/dial/capabilities"},
            dialSchedule: {url: "%s%s:%s/ISAPI/System/Network/WirelessDial/Interfaces/1/schedule"},
            dialConnect: {url: "%s%s:%s/ISAPI/System/Network/WirelessDial/Interfaces/1/connect"},
            messageConfigCap:{url: "%s%s:%s/ISAPI/System/Network/WirelessDial/Interfaces/1/messageConfig/messageConfigCap"},
            messageConfig:{url: "%s%s:%s/ISAPI/System/Network/WirelessDial/Interfaces/1/messageConfig"},
            message: {
                url: "%s%s:%s/ISAPI/System/Network/WirelessDial/Interfaces/1/messages/%s",
                req: [PARAM_OPTION_MESSAGE]
            },
            ehomeCap: {url: "%s%s:%s/ISAPI/System/Network/Ehome/capabilities"},
			ehome: {url: "%s%s:%s/ISAPI/System/Network/Ehome"},
			ezviz: {url: "%s%s:%s/ISAPI/System/Network/EZVIZ"},
			networkExtension: {url: "%s%s:%s/ISAPI/System/Network/extension"},
			certificate: {url: "%s%s:%s/ISAPI/Security/serverCertificate/certificate"},
			deleteCertificate: {url: "%s%s:%s/ISAPI/Security/serverCertificate/certificate"},
			createCertificate: {url: "%s%s:%s/ISAPI/Security/serverCertificate/selfSignCert"},
			certSignReq: {url: "%s%s:%s/ISAPI/Security/serverCertificate/certSignReq"},
			deleteCertSignReq: {url: "%s%s:%s/ISAPI/Security/serverCertificate/certSignReq"},
			netPreviewStrategy: {url: "%s%s:%s/ISAPI/System/Network/NetPreviewStrategy"},
			networkQos: {url: "%s%s:%s/ISAPI/System/Network/qos/dscp"},
			network8021x: {url: "%s%s:%s/ISAPI/System/Network/interfaces/1/ieee802.1x"},
			network8021xCap: {url: "%s%s:%s/ISAPI/System/Network/interfaces/1/ieee802.1x/capabilities"},
			ipTest: {url: "%s%s:%s/ISAPI/System/Network/pingtest"},
			wifiCap: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/wireless/capabilities"
			},
			wifiList: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/wireless/accessPointList"
			},
			wifiInfo: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/wireless"
			},
			wpsInfo: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/WPS"
			},
			devicePinCode: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/WPS/devicePinCode"
			},
			generatePinCode: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/WPS/devicePinCodeUpdate"
			},
			wifi8021x: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/ieee802.1x"
			},
			autoConnect: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/WPS/AutoConnect"
			},
			manualConnect: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/WPS/ApPinCode"
			},
			testFtp: {
				url: "%s%s:%s/ISAPI/System/Network/ftp/test"
			},
			testEmail: {
				url: "%s%s:%s/ISAPI/System/Network/mailing/test"
			},
			testNTP: {
				url: "%s%s:%s/ISAPI/System/time/ntpServers/test"
			},
			wlanapCap: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/wirelessServer/capabilities"
			},
			wlanap: {
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/wirelessServer"
			},
			wlanapList: 
			{
				url: "%s%s:%s/ISAPI/System/Network/interfaces/2/wirelessServer/accessDeviceList"
			},
			externalDeviceCap: {
				url: "%s%s:%s/ISAPI/System/externalDevice/capabilities"
			},
			externalDevice: {
				url: "%s%s:%s/ISAPI/System/externalDevice"
			},
			//存储
			storage: {url: "%s%s:%s/ISAPI/ContentMgmt/Storage"},
			deletehdd: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/delete",
				req: [PARAM_OPTION_DISK]
			},
			startSmartTest: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/SMARTTest/start",
				req: [PARAM_OPTION_DISK]
			},
			smartTestInfo: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/SMARTTest/config"
			},
			smartStatus: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/SMARTTest/status",
				req: [PARAM_OPTION_DISK]
			},
			startHddTest: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/BadSectorsTest/start",
				req: [PARAM_OPTION_DISK]
			},
			hddTestPause: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/BadSectorsTest/pause",
				req: [PARAM_OPTION_DISK]
			},
			hddTestResume: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/BadSectorsTest/resume",
				req: [PARAM_OPTION_DISK]
			},
			stopHddTest: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/BadSectorsTest/Stop",
				req: [PARAM_OPTION_DISK]
			},
			hddTestStatus: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/BadSectorsTest/status",
				req: [PARAM_OPTION_DISK]
			},
			hddCapa: {url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/capabilities"},
			hddProperty: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s",
				req: [PARAM_OPTION_DISK]
			},
			nasProperty: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/nas/%s",
				req: [PARAM_OPTION_DISK]
			},
			nasInfo: {url: "%s%s:%s/ISAPI/ContentMgmt/Storage/nas"},
			nasSeach: {url: "%s%s:%s/ISAPI/ContentMgmt/Storage/nas/search"},
            nasTest: {url: "%s%s:%s/ISAPI/ContentMgmt/Storage/nas/test"},
			formatHdd: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/format",
				req: [PARAM_OPTION_DISK]
			},
			formatNas: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/nas/%s/format",
				req: [PARAM_OPTION_DISK]
			},
			formatHddStatus: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/hdd/%s/formatStatus",
				req: [PARAM_OPTION_DISK]
			},
			formatNasStatus: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Storage/nas/%s/formatStatus",
				req: [PARAM_OPTION_DISK]
			},
			storageExt: {url: "%s%s:%s/ISAPI/ContentMgmt/Storage/extension"},
            quotaCap: {url:"%s%s:%s/ISAPI/ContentMgmt/Storage/quota"},
            quota: {url:"%s%s:%s/ISAPI/ContentMgmt/Storage/quota/1"},

			//PTZ
			ptzCap: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			presetInfo: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/presets",
				req: [PARAM_OPTION_CHANNEL]
			},
			//巡航能力
			patrolCap: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patrols/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},

			//巡航信息
			patrolInfo: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patrols/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patrols/%s"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATROL]
			},

			//开始巡航
			patrolStart: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patrols/%s/start"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patrols/%s/start"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATROL]
			},

			//停止巡航
			patrolStop: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patrols/%s/stop"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patrols/%s/stop"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATROL]
			},
			deletePatrol: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patrols/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patrols/%s"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATROL]
			},

			//轨迹信息
			patternInfo: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patterns"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patterns"},
				req: [PARAM_OPTION_CHANNEL]
			},

			//轨迹开始记录
			patternRecordStart: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patterns/%s/recordstart"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patterns/%s/recordstart"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATTERN]
			},

			//轨迹停止记录
			patternRecordStop: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patterns/%s/recordstop"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patterns/%s/recordstop"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATTERN]
			},

			//轨迹开始
			patternStart: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patterns/%s/start"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patterns/%s/start"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATTERN]
			},

			//轨迹停止
			patternStop: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patterns/%s/stop"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patterns/%s/stop"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATTERN]
			},
			deletePattern: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/patterns/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/patterns/%s"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PATTERN]
			},

			// 设置灯光、雨刷
			setAuxControl: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/auxcontrols/1",
				req: [PARAM_OPTION_CHANNEL]
			},

			//一键聚焦
			oneKeyFocus: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/onepushfoucs/start",
				req: [PARAM_OPTION_CHANNEL]
			},

			//镜头初始化
			initCamera: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/onepushfoucs/reset",
				req: [PARAM_OPTION_CHANNEL]
			},

			//focus
			ptzFocus: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/focus"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/ImageProxy/channels/%s/focus"},
				req: [PARAM_OPTION_CHANNEL]
			},

			ptzIris: {
				analog: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/iris"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/ImageProxy/channels/%s/iris"},
				req: [PARAM_OPTION_CHANNEL]
			},
			setMenu: {
				analog: {url: "%s%s:%s/ISAPI/Image/channels/%s/menu"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/ImageProxy/channels/%s/menu"},
				req: [PARAM_OPTION_CHANNEL]
			},

			ptzControl: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/continuous"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/continuous"},
				req: [PARAM_OPTION_CHANNEL]
			},
			ptzAutoControl: {
				ipdome: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/presets/%s/goto"},
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/autoPan"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/autoPan"},
				req: [PARAM_OPTION_CHANNEL]
			},
			setPreset: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/presets/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/presets/%s"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PRESET]
			},
			goPreset: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/presets/%s/goto"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/presets/%s/goto"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PRESET]
			},
			deletePreset: {
				analog: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/presets/%s"},
				digital: {url: "%s%s:%s/ISAPI/ContentMgmt/PTZCtrlProxy/channels/%s/presets/%s/delete"},
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_PRESET]
			},
			// 3D放大
			position3D: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/position3D",
				req: [PARAM_OPTION_CHANNEL]
			},
			// 手动跟踪
			manualTrace: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/ManualTrace",
				req: [PARAM_OPTION_CHANNEL]
			},
            //手动取证
            manualEvidence: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/manualItsCap",
                req: [PARAM_OPTION_CHANNEL]
            },
			// 区域曝光
			regionalExposure: {
				url: "%s%s:%s/ISAPI/Image/channels/%s/regionalExposure",
				req: [PARAM_OPTION_CHANNEL]
			},
			// 区域聚焦
			regionalFocus: {
				url: "%s%s:%s/ISAPI/Image/channels/%s/regionalFocus",
				req: [PARAM_OPTION_CHANNEL]
			},

			//录像相关
			monthRecordSearch: {
				url: "%s%s:%s/ISAPI/ContentMgmt/record/tracks/%s/dailyDistribution",
				req: [PARAM_OPTION_CHANNEL]
			},
			recordSearch: {url: "%s%s:%s/ISAPI/ContentMgmt/search"},
			startPlayback: {url: "%s%s:%s/PSIA/streaming/tracks/%s?starttime=%s&endtime=%s"},
			startDownloadRecord: {url: "%s%s:%s/ISAPI/ContentMgmt/download"},

			//系统维护相关
			restart: {url: "%s%s:%s/ISAPI/System/reboot"},
			restore: {
				url: "%s%s:%s/ISAPI/System/factoryReset?mode=%s",
				req: [PARAM_OPTION_MODE]
			},

			//以下内容涉及到插件，协议不进行处理，只是返回URL内容，未完成
			//语音对讲
			startVoiceTalk: {
				open: {url: "%s%s:%s/ISAPI/System/TwoWayAudio/channels/%s/open"},
				close: {url: "%s%s:%s/ISAPI/System/TwoWayAudio/channels/%s/close"},
				audioData: {url: "%s%s:%s/ISAPI/System/TwoWayAudio/channels/%s/audioData"}
			},
			//预览
			startRealPlay: {
				channels: {url: "%s%s:%s/PSIA/streaming/channels/%s"},
				zeroChannels: {url: "%s%s:%s/PSIA/Custom/SelfExt/ContentMgmt/ZeroStreaming/channels/%s"}
			},
			//升级
			upgradeFlag: {url: "%s%s:%s/ISAPI/System/upgradeFlag"},
			startUpgrade: {
				upgrade: {url: "%s%s:%s/ISAPI/System/updateFirmware"},
				status: {url: "%s%s:%s/ISAPI/System/upgradeStatus"}
			},
			//设备配置参数
			deviceConfig: {url: "%s%s:%s/ISAPI/System/configurationData"},

			//时间参数
			timeCapa: {url: "%s%s:%s/ISAPI/System/time/capabilities"},
			timeInfo: {url: "%s%s:%s/ISAPI/System/time"},
			//夏令时
			timeZone: {url: "%s%s:%s/ISAPI/System/time/timeZone"},

			//NTP服务器能力
			ntpServerCapa: {url: "%s%s:%s/ISAPI/System/time/ntpServers/capabilities"},
			ntpServerInfo: {url: "%s%s:%s/ISAPI/System/time/ntpServers/1"},

			//RS232
			serialPorts: {
				url: "%s%s:%s/ISAPI/System/Serial/ports"
			},
			rs232Capa: {
				url: "%s%s:%s/ISAPI/System/Serial/ports/%s/capabilities",
				req: [PARAM_OPTION_SERIALPORT]
			},
			rs232Info: {
				url: "%s%s:%s/ISAPI/System/Serial/ports/%s",
				req: [PARAM_OPTION_SERIALPORT]
			},

			//菜单输出
			menuOutputCapa: {
				url: "%s%s:%s/ISAPI/System/Video/outputs/channels/%s/capabilities",
				req: [PARAM_OPTION_OUTPUT]
			},
			menuOutput: {url: "%s%s:%s/ISAPI/System/Video/outputs/channels"},
			menuOutputMode: {url: "%s%s:%s/ISAPI/System/Video/Menu/1"},
			localOutput: {
				url: "%s%s:%s/ISAPI/System/Video/outputs/channels/%s",
				req: [PARAM_OPTION_OUTPUT]
			},

			// 日志搜索
			logSearch: {url: "%s%s:%s/ISAPI/ContentMgmt/logSearch"},

			// 系统服务
			service: {url: "%s%s:%s/ISAPI/System/Hardware"},
			softwareServiceCapa: {url: "%s%s:%s/ISAPI/Security/previewLinkNum/capabilities"},
			softwareService: {url: "%s%s:%s/ISAPI/Security/previewLinkNum"},

			// 认证
			rtspAuth: {url: "%s%s:%s/ISAPI/Streaming/channels/101"},
			webAuth: {url: "%s%s:%s/ISAPI/Security/webCertificate"},

			// 安全服务
			telnetService: {url: "%s%s:%s/ISAPI/System/Network/telnetd"},
			sshService: {url: "%s%s:%s/ISAPI/System/Network/ssh"},
			illegalLoginLockService: {url: "%s%s:%s/ISAPI/Security/illegalLoginLock"},

			// IP地址过滤
			ipFilter: {url: "%s%s:%s/ISAPI/System/Network/ipFilter"},

			// 用户、权限相关
			userPermissionCap: {
				url: "%s%s:%s/ISAPI/Security/UserPermission/%s",
				req: [PARAM_OPTION_USERTYPE]
			},
			userPermission: {
				url: "%s%s:%s/ISAPI/Security/UserPermission/%s",
				req: [PARAM_OPTION_USER]
			},
			user: {url: "%s%s:%s/ISAPI/Security/users"},
			userModify: {
				url: "%s%s:%s/ISAPI/Security/users/%s",
				req: [PARAM_OPTION_USER]
			},
			userDelete: {
				url: "%s%s:%s/ISAPI/Security/users/%s",
				req: [PARAM_OPTION_USER]
			},
			anonymousLogin : {url: "%s%s:%s/ISAPI/Security/UserPermission/anonymouslogin"},

			// 云台锁定
			lockPTZ: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/lockPTZ",
				req: [PARAM_OPTION_CHANNEL]
			},
			lockPTZIntelligent: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/lockPtz",
				req: [PARAM_OPTION_CHANNEL]
			},

			// 区域入侵侦测、进入区域侦测、离开区域侦测、徘徊侦测、人员聚集侦测、快速运动侦测、停车侦测、物品遗留侦测、物品拿取侦测相关
			fieldDetectionCapa: {
				url: "%s%s:%s/ISAPI/Smart/%s/%s/capabilities",
				req: [PARAM_OPTION_SMART, PARAM_OPTION_CHANNEL]
			},
			fieldDetection: {
				url: "%s%s:%s/ISAPI/Smart/%s/%s",
				req: [PARAM_OPTION_SMART, PARAM_OPTION_CHANNEL]
			},
			fieldDetectionRegion: {
				url: "%s%s:%s/ISAPI/Smart/%s/%s/regions/%s",
				req: [PARAM_OPTION_SMART, PARAM_OPTION_CHANNEL, PARAM_OPTION_REGION]
			},
			fieldDetectionLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/%s",
				req: [PARAM_OPTION_LINK]
			},
			fieldDetectionSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/%s",
				req: [PARAM_OPTION_SCHEDULE]
			},

			// 越界侦测相关
			lineDetectionCapa: {
				url: "%s%s:%s/ISAPI/Smart/LineDetection/%s/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			lineDetection: {
				url: "%s%s:%s/ISAPI/Smart/LineDetection/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			lineDetectionItem: {
				url: "%s%s:%s/ISAPI/Smart/LineDetection/%s/lineItem/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_LINE]
			},
			lineDetectionLink: {
				url: "%s%s:%s/ISAPI/Event/triggers/linedetection-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			lineDetectionSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/lineDetections/linedetection_video%s",
				req: [PARAM_OPTION_CHANNEL]
			},
            //设备专业智能能力
            VCADeviceCap: {url: "%s%s:%s/ISAPI/Intelligent/Capabilities"},
			//专业智能通道列表
			VCAChannelsList: {url: "%s%s:%s/ISAPI/Intelligent/intelliChannelList"},
			//专业智能能力相关
			VCAIntelliResource: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/intelliType",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliCap: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliScenes: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/intelliTrace",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliLibVer: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/intelliResource",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliOverlayCap: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/intelliResource/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliShield: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/Shield",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliTrack: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/zoomRatio",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliFaceRuleCap: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/faceRule/Capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliFaceRule: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/faceRule",
				req: [PARAM_OPTION_CHANNEL]
			},
			delVCAIntelliScene: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/intelliTrace/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
			},
			VCAIntelliSceneParam: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/intelliTrace/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
			},
			VCAIntelliSaveSceneLocation: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/scenePtz/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
			},
			VCAIntelliGotoSceneLocation: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/scenePtz/%s/goto",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
			},
			VCAIntelliPTZLimit: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/PTZLimited/%s/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE, PARAM_OPTION_DERECTION]
			},
			VCAIntelliGotoPTZLimit: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/PTZLimited/%s/%s/goto",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE, PARAM_OPTION_DERECTION]
			},
			VCAIntelliSceneRule: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/behaviorRule/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
			},
			VCAIntelliCalibration: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/calibration",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliCalibrationVerify: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/calibration/verify",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliAdvanceParam: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/AlgParam",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliRestartLib: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/restoreBehaviorLib",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliRestoreLib: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/restoreAlgParam",
				req: [PARAM_OPTION_CHANNEL]
			},
			VCAIntelliSceneSchedule: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/behaviorRule/%s/schedules",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
			},
			VCAIntelliSceneLinkage: {
				url: "%s%s:%s/ISAPI/Intelligent/channels/%s/behaviorRule/%s/notifications",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
			},
            VCAIntelliSceneRuleCap: {
                url: "%s%s:%s/ISAPI/Intelligent/channels/%s/behaviorRule/%s/rule/capabilities",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
            /************客流量过线计数相关*******start******/
            countingCap: {
                url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/counting/capabilities",
                req: [PARAM_OPTION_CHANNEL]
            },
            counting: {
                url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/counting",
                req: [PARAM_OPTION_CHANNEL]
            },
            countingLink: {
                url: "%s%s:%s/ISAPI/Event/triggers/counting-%s",
                req: [PARAM_OPTION_CHANNEL]
            },
            countingSchdule: {
                url: "%s%s:%s/ISAPI/Event/schedules/countings/counting_video%s",
                req: [PARAM_OPTION_CHANNEL]
            },
            countingSearch: {
                url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/counting/search",
                req: [PARAM_OPTION_CHANNEL]
            },
            resetCount: {
                url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/counting/resetCount",
                req: [PARAM_OPTION_CHANNEL]
            },
            /************人脸统计****************/
            faceCaptrueSearch: {
            	url: "%s%s:%s/ISAPI/Intelligent/channels/%s/faceCaptureStatistics/search",
                req: [PARAM_OPTION_CHANNEL]
            },
            /**************end********************/
			//图片类型能力
			imgTypeCapa: {
				url: "%s%s:%s/ISAPI/ContentMgmt/Capabilities"
			},
			//录像类型能力
			recordTypeCapa: {
				url: "%s%s:%s/ISAPI/ContentMgmt/record/tracks/%s01/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			//车辆检测参数（车道，省份等,第一个场景等）
			vehicleDetect: {
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/vehicleDetect",
				req: [PARAM_OPTION_CHANNEL]
			},
			vehicleDetectCap: {
				url: "%s%s:%s/ISAPI/Traffic/capabilities"
			},
            //混行检测参数（车道，省份等,第一个场景等）
            HVTVehicleDetect: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/HVTVehicleDetects",
                req: [PARAM_OPTION_CHANNEL]
            },
			//车辆检测参数（单场景）
			vehicleDetectScene: {
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/vehicleDetect/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
			},
            //混行检测参数（单场景）
            HVTVehicleDetectScene: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/HVTVehicleDetects/%s",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
			//车辆检测布防时间(/ISAPI/Event/schedules/vehicledetects/channelID之前是这样的ID，现在改为/ISAPI/Event/schedules/vehicledetects-channelID)
			vehicleSchedule: {
				//url: "%s%s:%s/ISAPI/Event/schedules/vehicledetects/vehicledetection-%s",
                url: "%s%s:%s/ISAPI/Event/schedules/vehicledetects/%s",
				req: [PARAM_OPTION_CHANNEL]
			},
            //混行检测布防时间
            HVTVehicleSchedule: {
                //url: "%s%s:%s/ISAPI/Event/schedules/HVTVehicleDetects/HVTVehicleDetects-%s",
                url: "%s%s:%s/ISAPI/Event/schedules/HVTVehicleDetects/%s",
                req: [PARAM_OPTION_CHANNEL]
            },
			//车辆检测联动方式
			vehicleLinkage: {
				url: "%s%s:%s/ISAPI/Event/triggers/vehicledetection-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
            //混行检测联动方式
            HVTVehicleLinkage: {
                url: "%s%s:%s/ISAPI/Event/triggers/HVTVehicleDetection-%s",
                req: [PARAM_OPTION_CHANNEL]
            },
            //车辆检测标定框
            vehicleCalibration: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/vehicleCalibration",
                req: [PARAM_OPTION_CHANNEL]
            },
            //车辆检测标定框
            vehicleDetectionType: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/CurVehicleDetectMode",
                    req: [PARAM_OPTION_CHANNEL]
            },
			vehicleBlackSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/blackList/blackList-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			vehicleBlackLinkage: {
				url: "%s%s:%s/ISAPI/Event/triggers/blackList-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			vehicleWhiteSchedule: {
				url: "%s%s:%s/ISAPI/Event/schedules/whiteList/whiteList-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			vehicleWhiteLinkage: {
				url: "%s%s:%s/ISAPI/Event/triggers/whiteList-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			triggerCap: {
				url: "%s%s:%s/ISAPI/Event/triggersCap"
			},
			//云存储
			cloudStorage: {
				url: "%s%s:%s/ISAPI/ContentMgmt/channels/%s/cloudStorage/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_CLOUD]
			},
			//云存储测试
			cloudStorageTest: {
				url: "%s%s:%s/ISAPI/ContentMgmt/channels/%s/cloudStorage/test",
				req: [PARAM_OPTION_CHANNEL]
			},
			//轻存储
			liteStorageCap: {
				url: "%s%s:%s/ISAPI/ContentMgmt/channels/%s/liteStorage/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			liteStorage: {
				url: "%s%s:%s/ISAPI/ContentMgmt/channels/%s/liteStorage",
				req: [PARAM_OPTION_CHANNEL]
			},
			//轻存储能力
			cloudStorageCap: {
				url: "%s%s:%s/ISAPI/ContentMgmt/channels/%s/liteStorage/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			//车辆检测监测点信息
			vehicleCamera: {
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/cameraInfo",
				req: [PARAM_OPTION_CHANNEL]
			},
            //车辆检测监测点信息
            HVTVehicleCamera: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/HVTVehicleDetects/cameraInfo",
                req: [PARAM_OPTION_CHANNEL]
            },
			//车辆检测图片叠加
			vehiclePicture: {
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/picParam",
				req: [PARAM_OPTION_CHANNEL]
			},
            //混行检测图片叠加
            HVTVehiclePicture: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/HVTVehicleDetects/picParam",
                req: [PARAM_OPTION_CHANNEL]
            },
			//车辆检测图片能力
			vehiclePictureCap: {
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/picParam/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
            //混行检测图片能力
            HVTVehiclePictureCap: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/HVTVehicleDetects/picParam/capabilities",
                req: [PARAM_OPTION_CHANNEL]
            },
			//设备工作模式
			workMode: {
				url:"%s%s:%s/ISAPI/ContentMgmt/workmode"
			},
			workModeCap: {
				url:"%s%s:%s/ISAPI/ContentMgmt/workmode/capabilities"
			},
			//平台配置
			platformRestore: {
				url: "%s%s:%s/ISAPI/System/Network/MegaPlatform/PlatReset?mode=%s",
				req: [PARAM_OPTION_MODE]
			},
			platformVSB: {
				url: "%s%s:%s/ISAPI/System/Network/MegaPlatform/VSB"
			},
			platformNMS: {
				url: "%s%s:%s/ISAPI/System/Network/MegaPlatform/NetManagerAccess"
			},
			platformAccess: {
				url: "%s%s:%s/ISAPI/System/Network/MegaPlatform/PlatformAccess"
            },
			service28181: {
				url: "%s%s:%s/ISAPI/System/Network/GB28181Service"
			},
			WLAlarmCap:{
                url: "%s%s:%s/ISAPI/WLAlarm/capabilities"
            },
            telecontrol: {
                url: "%s%s:%s/ISAPI/WLAlarm/telecontrol"
            },
            DualVCACap: {
                url: "%s%s:%s/ISAPI/Streaming/channels/%s/dualVCA",
                req: [PARAM_OPTION_CHANNEL]
            },
            regCropCap: {
                url: "%s%s:%s/ISAPI/Streaming/channels/%s%s/regionClip/capabilities",
                req: [PARAM_OPTION_CHANNEL,PARAM_OPTION_STREAM]
            },
            regCropInfo: {
                url: "%s%s:%s/ISAPI/Streaming/channels/%s%s/regionClip",
                req: [PARAM_OPTION_CHANNEL,PARAM_OPTION_STREAM]
            },
            disarmByRemoter: {
                url: "%s%s:%s/ISAPI/WLAlarm/telecontrol/disarming"
            },
            studyByRemoter: {
                url: "%s%s:%s/ISAPI/WLAlarm/telecontrol/study"
            },
            studyByWLS: {
                url: "%s%s:%s/ISAPI/WLAlarm/WLSensors/%s/study",
                req: [PARAM_OPTION_SENSOR]
            },

			// 强制I帧
			requestKeyFrame: {
				url: "%s%s:%s/ISAPI/Streaming/channels/%s0%s/requestKeyFrame",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_STREAM]
			},

			//热度图
			heatMapCap: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/heatMap/capabilities",
				req: [PARAM_OPTION_CHANNEL]
			},
			heatMap: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/heatMap",
				req: [PARAM_OPTION_CHANNEL]
			},
			heatMapRegion: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/heatMap/regions/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_REGION]
			},
			heatMapLinkage: {
				url: "%s%s:%s/ISAPI/Event/triggers/heatMap-%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			heatMapSchdule: {
				url: "%s%s:%s/ISAPI/Event/schedules/heatMaps/heatmap_video%s",
				req: [PARAM_OPTION_CHANNEL]
			},
			heatMapSearch: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/heatMap/search",
				req: [PARAM_OPTION_CHANNEL]
			},

			// PTZ相关
			proportionalPan: {url: "%s%s:%s/ISAPI/Image/channels/1/proportionalpan"},
			imageFreeze: {url: "%s%s:%s/ISAPI/Image/channels/1/imageFreeze"},
			ptzChannel: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1"},
			ptzSpeed: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/ptzspeed"},
			maxElevationCap: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/maxelevation/capabilities"},
			maxElevation: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/maxelevation"},
			autoFlip: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/autoflip"},
			ptzOSDDisplay: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/PTZOSDDisplay"},
			ptzPowerOff: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/saveptzpoweroff"},
			ptzLimiteds: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/ptzlimiteds"},
			ptzLimited: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/ptzlimiteds/%s",
				req: [PARAM_OPTION_LIMIT]
			},
			deletePtzLimited: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/ptzlimiteds/%s",
				req: [PARAM_OPTION_LIMIT]
			},
			ptzLimitedConfirm: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/ptzlimiteds/%s/confirm",
				req: [PARAM_OPTION_LIMIT]
			},
			ptzLimitedInit: {
				url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/ptzlimiteds/%s/Initialization",
				req: [PARAM_OPTION_LIMIT]
			},
			ptzHomePos: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/homePosition"},
			deletePtzHomePos: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/homePosition"},
			gotoPtzHomePos: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/homePosition/goto"},
			ptzParkCap: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/parkaction/capabilities"},
			ptzPark: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/parkaction"},
			deleteAllPreset: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/presets"},
			deleteAllPatrol: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/patrols"},
			deleteAllPattern: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/patterns"},
			deleteAllPrivacy: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/1/privacyMask/regions"},
			deleteAllLimit: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/ptzlimiteds"},
			deleteAllTask: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/timetasks"},
			deleteAllPark: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/parkaction"},
			ptzIntelTrack: {url: "%s%s:%s/ISAPI/Smart/IntelliTrace/1"},
			zoomRatial: {url: "%s%s:%s/ISAPI/Smart/IntelliTrace/1/ZoomRatial"},
			ptzPriority: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/ptzpriority"},
			ptzWiper: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/Wiper"},
			ptzTimeTask: {url: "%s%s:%s/ISAPI/PTZCtrl/channels/1/timetasks"},
			ptzPrivacyMaskCap: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/1/privacyMask/privacyMaskCap"},
			ptzPrivacyMask: {url: "%s%s:%s/ISAPI/System/Video/inputs/channels/1/privacyMask"},
			ptzPrivacyMaskRegion: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/1/privacyMask/regions/%s",
				req: [PARAM_OPTION_REGION]
			},
			deletePrivacyMaskRegion: {
				url: "%s%s:%s/ISAPI/System/Video/inputs/channels/1/privacyMask/regions/%s",
				req: [PARAM_OPTION_REGION]
			},
			compassCap: {
                url: "%s%s:%s/ISAPI/Compass/channels/%s/capabilities",
                req: [PARAM_OPTION_CHANNEL]
            },
            vandalProofAlarm: {
                url: "%s%s:%s/ISAPI/Compass/channels/%s/vandalProofAlarm",
                req: [PARAM_OPTION_CHANNEL]
            },
            calibrate: {
                url: "%s%s:%s/ISAPI/Compass/channels/%s/calibrate",
                req: [PARAM_OPTION_CHANNEL]
            },
            pointToNorth: {
                url: "%s%s:%s/ISAPI/Compass/channels/%s/pointToNorth",
                req: [PARAM_OPTION_CHANNEL]
            },
			eventTriggerCap: {url: "%s%s:%s/ISAPI/Event/triggersCap"},
            roadDetectionCap: {url: "%s%s:%s/ISAPI/ITC/capability"},
            VCAResourceCap: {
                url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/VCAResource/capabilities",
                req: [PARAM_OPTION_CHANNEL]
            },
            VCAResource: {
                url: "%s%s:%s/ISAPI/System/Video/inputs/channels/%s/VCAResource",
                req: [PARAM_OPTION_CHANNEL]
            },
            vehicleType: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/CurVehicleDetectMode",
                req: [PARAM_OPTION_CHANNEL]
            },
            evidenceCap: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/capability",
                req: [PARAM_OPTION_CHANNEL]
            },
            evidenceCamera: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/basic",
                req: [PARAM_OPTION_CHANNEL]
            },
            evidenceMerge: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/imageMerge",
                req: [PARAM_OPTION_CHANNEL]
            },
            evidenceOverlay: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/overlap",
                req: [PARAM_OPTION_CHANNEL]
            },
            evidenceVCA: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/edfAlg",
                req: [PARAM_OPTION_CHANNEL]
            },
            evidenceRestoreVCA: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/edfRestoreParam",
                req: [PARAM_OPTION_CHANNEL]
            },
            evidenceManualCapture: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/edfManualItsCap",
                req: [PARAM_OPTION_CHANNEL]
            },
            evidenceViolationType: {url: "%s%s:%s/ISAPI/Traffic/violationTypeStd"},
            evidenceRemoter: {url: "%s%s:%s/ISAPI/Traffic/remoteHost"},
            evidenceSceneInfo: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/sceneinfo/%s",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
            evidenceSceneParam: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/baseParam/%s",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
            evidenceSetSceneLocation: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/scenePtz/%s",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
            evidenceGetSceneLocation: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/scenePtz/%s/goto",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
            evidenceSceneCalibration: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/calibration/%s",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
            evidenceSceneRules: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/eventRule/%s",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
            evidenceFTPUpload: {url: "%s%s:%s/ISAPI/Traffic/ftp"},
			evidenceSpecialParam: {
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/transparentData",
				req: [PARAM_OPTION_CHANNEL]
			},
			evidenceScenePatrol: {
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/sceneCruiseSchedule",
				req: [PARAM_OPTION_CHANNEL]
			},
            ipdMountScenarioCap: {  //球机安装场景
                url:"%s%s:%s/ISAPI/Image/channels/%s/mountingScenario/capabilities",
                req: [PARAM_OPTION_CHANNEL]
            },
            ipdMountScenario: {  //球机安装场景
                url:"%s%s:%s/ISAPI/Image/channels/%s/mountingScenario",
                req: [PARAM_OPTION_CHANNEL]
            },
            imgRestore: {  //图像参数恢复默认
                url:"%s%s:%s/ISAPI/Image/channels/%s/restore",
                req: [PARAM_OPTION_CHANNEL]
            },
            //手机多播搜索
            phoneSadpInfo: {url: "%s%s:%s/ISAPI/System/discoveryMode"},
            //前端多播地址Multicast[目前前后端不统一]
            MulticastInfo: {url: "%s%s:%s/ISAPI/Streaming/channels/101"},
            imgISPMode: {  //前端参数控制模式
                url:"%s%s:%s/ISAPI/Image/channels/%s/ISPMode",
                req: [PARAM_OPTION_CHANNEL]
            },
            //取证智能分析高级参数配置
            trafficAdvancedParam: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/edfAdvancedAlgCfg",
                req: [PARAM_OPTION_CHANNEL]
            },
            //智慧监控车辆配置
            trafficVehicleLane: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/MprParam/%s",
                req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_SCENE]
            },
            trafficManualTrackMode: {
                url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/ManualTraceEvidenceMode",
                req: [PARAM_OPTION_CHANNEL]

            },
            trafficManualTrackCapture: {
                url: "%s%s:%s/ISAPI/PTZCtrl/channels/%s/ManualTraceEvidenceArea",
                req: [PARAM_OPTION_CHANNEL]
            },
            trafficVehicleCounting: {
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/VCS",
                req: [PARAM_OPTION_CHANNEL]
            },
            brokenTrans: { // 断网续传
                url: "%s%s:%s/ISAPI/Traffic/ANR"
            },
            evidenceVoiceTrigger: { // 语音联动
                url: "%s%s:%s/ISAPI/Traffic/channels/%s/voiceTrigger",
                req: [PARAM_OPTION_CHANNEL]
            },
			evidenceVoiceUpload: { // 语音上传
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/voice/%s",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_VOICE]
			},
			evidenceVoicePlay: { // 语音播放
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/voice/%s/play",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_VOICE]
			},
			evidenceVoiceDelete: { // 语音删除
				url: "%s%s:%s/ISAPI/Traffic/channels/%s/voice/%s/upload",
				req: [PARAM_OPTION_CHANNEL, PARAM_OPTION_VOICE]
			},
            panoramicMapCap: {
                url: "%s%s:%s/ISAPI/Panorama/capabilities"
            },
            algVersionInfo: {
                url: "%s%s:%s/ISAPI/Traffic/algVersionInfo"
            }
		};

		//根据IP查找对应设备索引
		this.findDeviceIndexByIP = function (szHostName, options) {
			for (var i = 0; i < m_deviceSet.length; i++) {
				if (m_deviceSet[i].m_szHostName == szHostName) {
					return i;
				}
			}

			if (typeof options != "undefined") {
				_callUserFun(HTTP_STATUS_401, null, options);
			}

			return -1;
		};


		/*************************************************
		 Function:            WSDK_DeviceLan
		 Description:        用户登录
		 Input:
		 m_szHostName: 设备IP地址
		 iHttpProtocal: http协议类型（1：http, 2:https）
		 iPort: http端口号
		 options: 可选参数：async：是否同步（true:异步方式，false:同步方式），请求回调函数（success, error, complete）
		 Output:            无
		 return:            无
		 *************************************************/
		this.WSDK_DeviceLan = function (szHostName, iHttpProtocal, iPort, options) {
			var url = _FormatString(this.CGI.deviceLan.url, iHttpProtocal == 2 ? "https://" : "http://", szHostName, iPort);
			var newOptions = {
				type: "GET",
				url: url,
				success: null,
				error: null
			};

			$.extend(newOptions, options);
			$.extend(newOptions, {
				success: function (status, xmlDoc) {
					if (typeof options.success == "function") {
						options.success(status, xmlDoc);
					}
				},
				error: function (status, xmlDoc) {
					if (typeof options.error == "function") {
						options.error(status, xmlDoc);
					}
				}
			});

			_submitRequest(url, newOptions);
		};

		/*************************************************
		 Function:            WSDK_Activate
		 Description:        激活
		 Input:
		 m_szHostName: 设备IP地址
		 iHttpProtocal: http协议类型（1：http, 2:https）
		 iPort: http端口号
		 options: 可选参数：async：是否同步（true:异步方式，false:同步方式），请求回调函数（success, error, complete）
		 Output:            无
		 return:            无
		 *************************************************/
		this.WSDK_Activate = function (szHostName, iHttpProtocal, iPort, options) {			
			var url = _FormatString(this.CGI[options.cmd].url, iHttpProtocal == 2 ? "https://" : "http://", szHostName, iPort);
			var newOptions = {
				type: "GET",
				url: url,
				success: null,
				error: null
			};

			$.extend(newOptions, options);
			$.extend(newOptions, {
				success: function (status, xmlDoc, xhr) {
					if (typeof options.success == "function") {
						options.success(status, xmlDoc, xhr);
					}
				},
				error: function (status, xmlDoc, xhr) {
					if (typeof options.error == "function") {
						options.error(status, xmlDoc, xhr);
					}
				}
			});

			_submitRequest(url, newOptions);
		};
		
		/*************************************************
		 Function:            WSDK_Login
		 Description:        用户登录
		 Input:
		 m_szHostName: 设备IP地址
		 iHttpProtocal: http协议类型（1：http, 2:https）
		 iPort: http端口号
		 szUserName: 用户名
		 szPassword: 用户密码
		 options: 可选参数：async：是否同步（true:异步方式，false:同步方式），请求回调函数（success, error, complete）
		 Output:            无
		 return:            无
		 *************************************************/
		this.WSDK_Login = function (szHostName, iHttpProtocal, iPort, szUserName, szPassword, szTimeStamp, options) {
			var iIndex = this.findDeviceIndexByIP(szHostName);
			if (iIndex != -1) {
				//设备已经在列表中
				_PrintString("设备已经登录过");
				return;
			}

			var url = _FormatString(this.CGI.login.url, iHttpProtocal == 2 ? "https://" : "http://", szHostName, iPort, szTimeStamp);
			var newOptions = {
				type: "GET",
				url: url,
				username: szUserName,
				password: szPassword,
				success: null,
				error: null
			};

			$.extend(newOptions, options);
			$.extend(newOptions, {
				success: function (status, xmlDoc) {
					if ("200" === $(xmlDoc).find("statusValue").eq(0).text()) {
						var deviceInfo = new deviceInfoClass();
						deviceInfo.m_szHostName = szHostName;
						deviceInfo.m_szHttpProtocol = iHttpProtocal == 2 ? "https://" : "http://";
						deviceInfo.iPort = iPort;
						deviceInfo.szUserName = szPassword == "******" ? "" : szUserName;
						deviceInfo.szPassword = szPassword == "******" ? "" : szPassword;
						m_deviceSet.push(deviceInfo);
						_PrintString("登录成功");

						_getChannelInfo(szHostName);						
						_getAlarmInputInfo(szHostName);						
					}

					if (typeof options.success == "function") {
						options.success(status, xmlDoc);
					}
				},
				error: function (status, xmlDoc) {
					if (typeof options.error == "function") {
						options.error(status, xmlDoc);
					}
				}
			});

			_submitRequest(url, newOptions);
		};

		/*************************************************
		 Function:            WSDK_SetLoginInfo
		 Description:        用户登录
		 Input:
		 m_szHostName: 设备IP地址
		 iHttpProtocal: http协议类型（1：http, 2:https）
		 iPort: http端口号
		 szUserName: 用户名
		 szPassword: 密码
		 options: 可选参数：async：是否同步（true:异步方式，false:同步方式），请求回调函数（success, error, complete）
		 Output:            无
		 return:            无
		 *************************************************/
		this.WSDK_SetLoginInfo = function (szHostName, iHttpProtocal, iPort, szUserName, szPassword, options) {
			var iIndex = this.findDeviceIndexByIP(szHostName);
			if (iIndex != -1) {
				//设备已经在列表中
				_PrintString("设备已经登录过");

				m_deviceSet[iIndex].m_szHttpProtocol = iHttpProtocal == 2 ? "https://" : "http://";
				m_deviceSet[iIndex].iPort = iPort;
				m_deviceSet[iIndex].szUserName = (szPassword == "******" ? "" : szUserName);
				m_deviceSet[iIndex].szPassword = (szPassword == "******" ? "" : szPassword);

				return;
			}

			var deviceInfo = new deviceInfoClass();
			deviceInfo.m_szHostName = szHostName;
			deviceInfo.m_szHttpProtocol = iHttpProtocal == 2 ? "https://" : "http://";
			deviceInfo.iPort = iPort;
			deviceInfo.szUserName = (szPassword == "******" ? "" : szUserName);
			deviceInfo.szPassword = (szPassword == "******" ? "" : szPassword);
			m_deviceSet.push(deviceInfo);

			_PrintString("设置登录信息成功");

			_getChannelInfo(szHostName);			
			//匿名判断
			if(deviceInfo.szUserName) {
				_getAlarmInputInfo(szHostName);
			}
		};

		this.WSDK_GetDeviceConfig = function (szHostName, Commond, oParam, options) {
			//先检测命令正确性
			if (!_checkCommond(Commond, options)) {
				return;
			}

			var httpType = "GET";//暂时只有GET命令
			_submit(szHostName, _getHttpMethod("get", Commond), _getCmd(Commond), oParam, options);
		};

		this.WSDK_SetDeviceConfig = function (szHostName, Commond, oParam, options) {
			//先检测命令正确性
			if (!_checkCommond(Commond, options)) {
				return;
			}

			var httpType = "PUT";//需要根据命令内容来判断是哪种HTTP方法
			_submit(szHostName, _getHttpMethod("set", Commond), _getCmd(Commond), oParam, options);
		};

		this.WSDK_PTZControl = function (szHostName, iChannel, iCommond, iSpeed, bStop, options) {
			//初始化速度
			iSpeed = iSpeed < 7 ? iSpeed * 15 : 100;
			//如果是停止命令，只需要把速度置为0就可以了，XML数据不变
			if (bStop) {
				iSpeed = 0;
			}

			//XML数据参数
			var oParameters = [
				{},
				{pan: 0, tilt: iSpeed}, // 上
				{pan: 0, tilt: -iSpeed}, // 下
				{pan: -iSpeed, tilt: 0}, // 左
				{pan: iSpeed, tilt: 0}, // 右
				{pan: -iSpeed, tilt: iSpeed},	// 左上
				{pan: -iSpeed, tilt: -iSpeed}, // 左下
				{pan: iSpeed, tilt: iSpeed}, // 右上
				{pan: iSpeed, tilt: -iSpeed}, // 右下
				{speed: -iSpeed},//zoomout
				{speed: iSpeed}, //zoomin
				{speed: -iSpeed}, //focusout
				{speed: iSpeed}, //focusin
				{speed: -iSpeed},  //Irisout
				{speed: iSpeed},  //Irisin
				{speed: iSpeed}   //autoPan
			];
			var Commond = null;
			var Data = "";
			switch (iCommond) {
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 6:
				case 7:
				case 8:
					//方向命令
					Commond = this.CGI.ptzControl;
					Data = "<?xml version='1.0' encoding='UTF-8'?>" +
						"<PTZData>" +
						"<pan>" + oParameters[iCommond].pan + "</pan>" +
						"<tilt>" + oParameters[iCommond].tilt + "</tilt>" +
						"</PTZData>";
					break;
				case 9:
				case 10:
					//Zoom命令
					Commond = this.CGI.ptzControl;
					Data = "<?xml version='1.0' encoding='UTF-8'?>" +
						"<PTZData>" +
						"<zoom>" + oParameters[iCommond].speed + "</zoom>" +
						"</PTZData>";
					break;
				case 11:
				case 12:
					//focus命令
					Commond = this.CGI.ptzFocus;
					Data = "<?xml version='1.0' encoding='UTF-8'?>" +
						"<FocusData>" +
						"<focus>" + oParameters[iCommond].speed + "</focus>" +
						"</FocusData>";
					break;
				case 13:
				case 14:
					//Iris命令
					Commond = this.CGI.ptzIris;
					Data = "<?xml version='1.0' encoding='UTF-8'?>" +
						"<IrisData>" +
						"<iris>" + oParameters[iCommond].speed + "</iris>" +
						"</IrisData>";
					break;
				case 15:
					//自动命令
					Commond = this.CGI.ptzAutoControl;
					Data = "<?xml version='1.0' encoding='UTF-8'?>" +
						"<autoPanData>" +
						"<autoPan>" + oParameters[iCommond].speed + "</autoPan>" +
						"</autoPanData>";
					break;
				default :
					break;
			}

			//投递请求
			var httpType = "PUT";
			var newOptions = {
				data: Data
			};
			$.extend(newOptions, options);
			if (Commond != null) {
				var oParam = {};
				oParam[PARAM_OPTION_CHANNEL] = iChannel;
				_submit(szHostName, httpType, Commond, oParam, newOptions);
			} else {
				_callUserFun(WSDK_ERROR_COMMOD, null, newOptions);
			}
		};

		//私有方法，打印
		var _PrintString = function () {
			if (m_bDebug) {
				var printString = _FormatString(arguments);
				console.log(printString);
			}
		};

		var _checkCommond = function (Commond, options) {
			//判断这个名字是否在CGI命令对象中
			if (!(Commond in self.CGI)) {
				_callUserFun(WSDK_ERROR_COMMOD, null, options);
				return false;
			}
			return true;
		};

		var _getHttpMethod = function (commondType, CommondString) {
			var szMethord = "GET";
			switch (commondType) {
				case "get":
					szMethord = _gerGetMethod(CommondString);
					break;
				case "set":
					szMethord = _gerSetMethod(CommondString);
					break;
				default :
					break;
			}

			return szMethord;
		};

		var _gerGetMethod = function (CommondString) {
			//默认为GET，只对一些特殊URL进行处理比如POST
			var httpMethod = "GET";
			switch (CommondString) {
				case "monthRecordSearch":
					httpMethod = "POST";
					break;
				case "recordSearch":
					httpMethod = "POST";
					break;
				case "nasSeach":
					httpMethod = "POST";
					break;
				case "logSearch":
					httpMethod = "POST";
					break;
				case "ipTest":
					httpMethod = "POST";
					break;
                case "countingSearch":
                    httpMethod = "POST";
                    break;
                case "heatMapSearch":
                    httpMethod = "POST";
                    break;
				case "testFtp":
                    httpMethod = "POST";
                    break;
				case "testEmail":
                    httpMethod = "POST";
                    break;
				case "testNTP":
					httpMethod = "POST";
                    break;
                case "faceCaptrueSearch":
					httpMethod = "POST";
                    break;
                case "dynamicCapWithCondition":
					httpMethod = "POST";
                    break;
				default :
					break;
			}

			return httpMethod;
		};

		var _gerSetMethod = function (CommondString) {
			//默认为PUT，值对一些特殊URL进行处理，比如DELETE
			var httpMethod = "PUT";
			switch (CommondString) {
				case "deleteTamperRegion":
					httpMethod = "DELETE";
					break;
				case "videoTamperRegion":
					httpMethod = "DELETE";
					break;
				case "deleteCertificate":
					httpMethod = "DELETE";
					break;
				case "deleteCertSignReq":
					httpMethod = "DELETE";
					break;
				case "user":
					httpMethod = "POST";
					break;
				case "userDelete":
					httpMethod = "DELETE";
					break;
				case "addIpc":
					httpMethod = "POST";
					break;
				case "deleteIpc":
					httpMethod = "DELETE";
					break;
				case "delVCAIntelliScene":
					httpMethod = "DELETE";
					break;
				case "deletePattern":
					httpMethod = "DELETE";
					break;
				case "deletePatrol":
					httpMethod = "DELETE";
					break;
				case "sourceCapability":
					httpMethod = "POST";
					break;
				case "deletePtzLimited":
					httpMethod = "DELETE";
					break;
				case "deletePtzHomePos":
					httpMethod = "DELETE";
					break;
				case "deleteAllPreset":
					httpMethod = "DELETE";
					break;
				case "deleteAllPatrol":
					httpMethod = "DELETE";
					break;
				case "deleteAllPattern":
					httpMethod = "DELETE";
					break;
				case "deleteAllPrivacy":
					httpMethod = "DELETE";
					break;
				case "deleteAllLimit":
					httpMethod = "DELETE";
					break;
				case "deleteAllTask":
					httpMethod = "DELETE";
					break;
				case "deleteAllPark":
					httpMethod = "DELETE";
					break;
				case "deletePrivacyMaskRegion":
					httpMethod = "DELETE";
					break;
				case "deletePreset":
					httpMethod = "DELETE";
					break;
				case "evidenceVoiceDelete":
					httpMethod = "DELETE";
					break;
				default :
					break;
			}

			return httpMethod;
		};

		//根据协议string获取协议的具体url
		var _getCmd = function (CommondString) {
			var oCommond;
			eval("oCommond = self.CGI." + CommondString);
			return oCommond;
		};

		//格式化URL
		var _FormatString = function () {
			var string = arguments[0];
			for (var i = 1; i < arguments.length; i++) {
				if (arguments[i] !== "") {
					string = string.replace("%s", arguments[i]);
				} else {
					string = string.replace("/%s", "");
				}
			}
			return string;
		};

		//统一的提交请求接口，除了登录接口以外，其它都是用这个函数发送CGI命令
		//argu[0]: 设备IP，argu[1]: HTTP方法，argu[2]:CGI命令，不需要细分到类型，argu[3]:oParam，可选参数对象，argu[4]：用户可选参数
		var _submit = function () {
			//该接口要适应所有URL，可能会变化，所以参数不能写死
			var ip = arguments[0];
			var method = arguments[1];
			var oCGI = arguments[2];
			var oParam = arguments[3];
			var options = arguments[4];

			//首先判断设备是否已经登录
			var iIndex = self.findDeviceIndexByIP(ip, options);
			if (-1 == iIndex) {
				return;
			}

			//如果用户传入的参数，和CGI命令需要的参数不匹配，则返回失败
			if (typeof oCGI.req != "undefined") {
				for (var i = 0; i < oCGI.req.length; i++) {
					if (!(oCGI.req[i] in oParam)) {
						_callUserFun(WSDK_ERROR_PARAMNUM, null, options);
						return;
					}
				}
			}

			//找到cgi命令的url，此处还不进行参数替换
			var deviceInfo = m_deviceSet[iIndex];
			var cgi = "";
			if (typeof oCGI.url != "string") {
				if ("analog" in oCGI) {
					//区分了数字和模拟，就必然要输入通道号
					if (parseInt(oParam[PARAM_OPTION_CHANNEL], 10) <= deviceInfo.iAnalogChannelNum) {
						cgi = oCGI.analog.url;
					} else {
						cgi = oCGI.digital.url;
					}
				} else if ("analogIO" in oCGI) {
					// 数字报警输入ID  I-1801  1801肯定大于256，可以区分数字和模拟
					if (parseInt(oParam[PARAM_OPTION_IO], 10) <= deviceInfo.iAnalogAlarmInputNum) {
						cgi = oCGI.analogIO.url;
					} else {
						cgi = oCGI.digitalIO.url;
					}
				} else {
					//其它分支，可能以后要用switch来处理，比如设备类型
				}
			} else {
				cgi = oCGI.url;
			}

			//先把必选参数装填进去
			var url = _FormatString(cgi, deviceInfo.m_szHttpProtocol, deviceInfo.m_szHostName, deviceInfo.iPort);

			//装填可选参数，可选参数的合法性已经在验证参数匹配的步骤中确认过了
			if (typeof oCGI.req != "undefined") {
				for (var i = 0; i < oCGI.req.length; i++) {
					url = _FormatString(url, oParam[oCGI.req[i]]);
				}
			}

			//设置HTTP交互方式和认证信息
			var newOptions = {
				type: method,
				username: deviceInfo.szUserName,
				password: deviceInfo.szPassword
			};
			$.extend(newOptions, options);

			//投递请求
			_submitRequest(url, newOptions);
		};

		//实例化投递方式，然后投递请求
		var _submitRequest = function (szUrl, options) {
			var httpTransClient = new m_oTransMethord();
			httpTransClient.submitRequest(szUrl, options);
		};

		//获取模拟通道信息
		var _getChannelInfo = function (hostname) {
			var iIndex = self.findDeviceIndexByIP(hostname);
			if (-1 == iIndex) {
				return;
			}
			var deviceInfo = m_deviceSet[iIndex];

			_submit(hostname, "GET", self.CGI.AnalogChannelInfo, null, {
				async: false,
				success: function (status, xmlDoc) {
					deviceInfo.iAnalogChannelNum = parseInt($(xmlDoc).find("VideoInputChannel").length, 10);
				}
			});
		};

		//获取模拟报警输入信息
		var _getAlarmInputInfo = function (hostname) {
			var iIndex = self.findDeviceIndexByIP(hostname);
			if (-1 == iIndex) {
				return;
			}
			var deviceInfo = m_deviceSet[iIndex];

			_submit(hostname, "GET", self.CGI.AnalogAlarmInputInfo, null, {
				async: false,
				success: function (status, xmlDoc) {
					deviceInfo.iAnalogAlarmInputNum = parseInt($(xmlDoc).find("IOInputPort").length, 10);
				}
			});
		};

		//调用用户回调函数
		var _callUserFun = function (status, xmlDoc, options) {
			if (status != HTTP_STATUS_200) {
				if (typeof options.error == "function") {
					options.error(status, xmlDoc);
				}
			} else {
				if (typeof options.success == "function") {
					options.success(status, xmlDoc);
				}
			}

			if (typeof options.complete == "function") {
				options.complete(status, xmlDoc);
			}
		};

		/*********************************设备信息类 start*********************************/
		//此结构由ISAPI_SDK自己维护
		var deviceInfoClass = function () {
			this.szIP = "";
			this.m_szHostName = "";
			this.szUserName = "";
			this.szPassword = "";
			this.m_szHttpProtocol = "http://";  //http类型，https:// or https://
			this.iPort = 80;
			this.szDeviceType = "";	//设备类型
			this.iAnalogChannelNum = 0;
			this.iDigitalChannelNum = 0;
			this.iAnalogAlarmInputNum = 0;	// 模拟报警输入数
		};
		/*********************************设备信息类 end*********************************/

		//交互基类
		var transClient = function () {
			this.options = {
				timeout: 30000,   //超时时间，默认30000ms
				data: null,        //发送的数据，没有则为null
				async: true,      //是否同步
				complete: null,   //请求完成回调
				success: null,     //请求成功回调
				error: null       //请求失败回调
			};
		};

		transClient.prototype.submitRequest = function () {
		};

		//处理回调函数
		transClient.prototype.processSuccessCB = function (xhr) {
			if (xhr) {
				if (4 == xhr.readyState) {
					//先处理成功和失败
					if (HTTP_STATUS_200 == xhr.status) {
						if (typeof this.options.success == "function") {
							this.options.success(HTTP_STATUS_200, xhr.responseXML, xhr);
						}
					} else {
						if (typeof this.options.error == "function") {
							this.options.error(xhr.status, xhr.responseXML, xhr);
						}
					}
				}
			}
		};

		transClient.prototype.processErrorCB = function (xhr, textStatus) {
			if (4 == xhr.readyState) {
				if (typeof this.options.error == "function") {
					this.options.error(xhr.status, xhr.responseXML, xhr);
				}
			} else {
				if ("timeout" == textStatus || "error" == textStatus) {
					//$ajax中，如果是timeout错误，readyState不会变为4，保持0
					// 所以为了上层能够得到这个错误需要特殊处理这个错误类型
					if (typeof this.options.error == "function") {
						this.options.error(xhr.status, xhr.responseXML, xhr);
					}
				}
			}
		};

		transClient.prototype.processCompleteCB = function (xhr) {
			//最后处理complete
			if (typeof this.options.complete == "function") {
				this.options.complete(xhr.status, xhr.responseXML, xhr);
			}
		};

		//jquery的ajax方法
		var jqueryAjaxClient = function () {
			transClient.call(this);
		};
		//继承交互基类
		jqueryAjaxClient.prototype = new transClient();
		//实现基类交互方法
		jqueryAjaxClient.prototype.submitRequest = function (szUrl, options) {
			$.extend(this.options, options);
			var xmlDoc;
			if (typeof this.options.data == "string" && !options.noParseToXml) {
				xmlDoc = oUtils.parseXmlFromStr(this.options.data);
			} else {
				xmlDoc = this.options.data;
			}

			var self = this;

			$.ajax({
				type: self.options.type,
				beforeSend: function (xhr) {
					xhr.setRequestHeader("If-Modified-Since", "0");
					//老设备暂时沿用老方式
//					xhr.setRequestHeader("Authorization", "Basic " + oBase64.encode(self.options.username + ":" + self.options.password));
				},
				username: self.options.username,
				password: self.options.password,
				async: self.options.async,
				timeout: self.options.timeout,
				url: szUrl,
				processData: false,
				data: xmlDoc,
				success: function (xmlDoc, textStatus, xhr) {
					self.processSuccessCB(xhr);
				},
				error: function (xhr, textStatus, errorThrown) {
					self.processErrorCB(xhr, textStatus);
				},
				complete: function (xhr, textStatus) {
					self.processCompleteCB(xhr);
				}
			});
		};

		m_oTransMethord = jqueryAjaxClient;
	}

	window.WebSDK = new WebSDK();
});