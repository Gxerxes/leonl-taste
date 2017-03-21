define(function(require, exports, module) {	
	var _oDevice, _oUtils, _oCommon;

	_oDevice = require("isapi/device");
	_oUtils = require("utils");
	_oCommon = require("common");

	
	// 服务类构造函数
	function Service() {
		this.m_aChannelList = [];
		this.m_aWndList = [];
		this.m_iAnalogChNum = 0;
		this.m_iDigitalChNum = 0;
        this.m_iZeroChanNum = 0;
		this.m_oXmlAnalogChList = null;
		this.m_oXmlDigitalChList = null;
		this.m_oXmlDigitalChStatusList = null;
        this.m_oXmlZeroChannel = null;
        this.m_oXmlImageInfo = null;
		this.m_iWndIndex = 0;
		this.m_iStreamType = 0;
		this.m_iWndSplitMode = 4;
        this.m_iWndSizeMode = 4;
        this.m_iPluginType = 4;
		this.m_oWndParams = {
			bHasWndPlay: false,
			bHasWndRecord: false,
			bTalking: false,
			iSoundWndIndex: -1
		};
		this.m_iMaxWndNum = 16;// 最大窗口个数
		this.m_oLoaded = {// 子模块加载完毕标识
			bChannel: false,
			bSearch: false,
			bTimebar: false,
			bPlugin: false
		};
		var iStartIndex = navigator.appVersion.indexOf("Chrome/");
		var iChromeVersion = parseInt(navigator.appVersion.substring(iStartIndex+7, iStartIndex+9), 10);
		this.m_bChromeNotSupportNpapi = (iChromeVersion > 41);

        this.init();
	}
	
	Service.prototype = {
		// 获取模拟通道列表
		getAnalogChList: function () {
			var self = this;

			self.m_oXmlAnalogChList = _oDevice.getChannel(_oDevice.m_oChannelType.ANALOG);
			self.m_iAnalogChNum = $(self.m_oXmlAnalogChList).find("VideoInputChannel").length;
		},
		// 获取数字通道列表
		getDigitalChList: function () {
			var self = this;

			self.m_oXmlDigitalChList = _oDevice.getChannel(_oDevice.m_oChannelType.DIGITAL);
			self.m_iDigitalChNum = $(self.m_oXmlDigitalChList).find("InputProxyChannel").length;
		},
		// 获取数字通道状态列表
		getDigitalChStatusList: function () {
			var self = this;

			self.m_oXmlDigitalChStatusList = _oDevice.getChannelStatus();
		},
		// 获取零通道
        getZeroChannelList: function () {
            var self = this;

            self.m_iZeroChanNum = 0;
			self.m_oXmlZeroChannel = _oDevice.getChannel(_oDevice.m_oChannelType.ZERO);
			$.each($(self.m_oXmlZeroChannel).find("ZeroVideoChannel"), function () {
				if (_oUtils.nodeValue(this, "enabled", "b")) {
					self.m_iZeroChanNum++;
				}
			});
        },
        //获取图像参数
        getImageInfo: function () {
			var self = this;
			self.m_oXmlImageInfo = _oDevice.getImageInfo();
        },
		// 模块初始化
		init: function () {
			var self = this,
				oXmlChannel = null,
				oXmlChannelStatus = null;

			self.getAnalogChList();
			//匿名判断
			if(!_oCommon.m_bAnonymous) {
				self.getDigitalChList();
				self.getDigitalChStatusList();
				self.getZeroChannelList();
				self.getImageInfo();
			}

			var iId, szName, szType, bOnline, szVideoFormat;
			for (var i = 0; i < self.m_iAnalogChNum + self.m_iDigitalChNum + self.m_iZeroChanNum; ++i) {
				if (i < self.m_iAnalogChNum) {
					oXmlChannel = $(self.m_oXmlAnalogChList).find("VideoInputChannel").eq(i);
					iId = parseInt(oXmlChannel.find("id").eq(0).text(), 10);
					szName = oXmlChannel.find("name").eq(0).text() || "Channel " + oXmlChannel.find("id").eq(0).text();
					szType = "analog";
					if ("" == _oUtils.nodeValue(oXmlChannel, "videoInputEnabled")/*前端设备没有这个节点*/ || "true" == _oUtils.nodeValue(oXmlChannel, "videoInputEnabled")) {
						bOnline = true;
					} else {
						bOnline = false;
					}
					szVideoFormat = _oUtils.nodeValue(oXmlChannel, "videoFormat") || "PAL";
				} else if (i < self.m_iAnalogChNum + self.m_iDigitalChNum) {
					oXmlChannel = $(self.m_oXmlDigitalChList).find("InputProxyChannel").eq(i - self.m_iAnalogChNum);
					oXmlChannelStatus = $(self.m_oXmlDigitalChStatusList).find("InputProxyChannelStatus").eq(i - self.m_iAnalogChNum);
					iId = parseInt(oXmlChannel.find("id").eq(0).text(), 10);
					szName = oXmlChannel.find("name").eq(0).text() || "Channel " + oXmlChannel.find("id").eq(0).text();
					szType = "digital";
					if ("true" == _oUtils.nodeValue(oXmlChannelStatus, "online")) {
						bOnline = true;
					} else {
						bOnline = false;
					}
				} else {
					oXmlChannel = $(self.m_oXmlZeroChannel).find("ZeroVideoChannel").eq(i - self.m_iAnalogChNum - self.m_iDigitalChNum);
					iId = parseInt(oXmlChannel.find("id").eq(0).text(), 10);/*self.m_iAnalogChNum + self.m_iDigitalChNum + 1;*/
					if (iId <= 9) {
						szName = "ZeroChannel 0" + iId;
					} else {
						szName = "ZeroChannel " + iId;
					}

					szType = "zero";
					bOnline = true;
				}
				self.m_aChannelList[i] = {
					iId: iId,
					szName: szName,
					bPlay: false,
					bRecord: false,
					iWndPlayIndex: -1,
					iStreamType: self.m_iStreamType,
					szType: szType,
					bOnline: bOnline,
					szVideoFormat: szVideoFormat || "PAL"//目前只对数字通道有处理，后端将来需要再添加
				};
			}
			for (var i = 0; i < self.m_iMaxWndNum; ++i) {
				self.m_aWndList[i] = {
					iChannelId: -1,
					iChannelPlayIndex: -1,
					bPlay: false,
					bPause: false,
					iSpeed: 1,
					bReversePlay: false,
					bTranscoding: false,
					bRecord: false,
					bFrame: false,
					bEzoom: false,
					bRegionExposure: false,
					bRegionFocus: false,
					b3DZoom: false,
					bManualTrack: false,
					bAutoPan: false,
					bPTZCtrl: false, //视频云台控制
                    bManualTrackEvidence: false
				}
			}

			var aChannelList = self.m_aChannelList;
			var bCorridor;
			$(self.m_oXmlImageInfo).find("ImageChannel").each(function () {
				iId = _oUtils.nodeValue(this, "id", "i");
				bCorridor = _oUtils.nodeValue(this, "corridor enabled", "b");

				$.each(aChannelList, function () {
					if (iId === this.iId) {
						this.bCorridor = bCorridor;
						return false;
					}
				});
			});
		},
		// 根据通道id获取通道对象
		getChannelByChannelId: function (iChannelId) {
			var self = this,
				oChannel = null;

			$.each(self.m_aChannelList, function () {
				if (this.iId == iChannelId) {
					oChannel = this;
					return false;
				}
			});

			return oChannel;
		},
		// 根据通道id设置通道对象
		setChannelByChannelId: function (iChannelId, oParams) {
			var self = this,
				oChannel = null;

			$.each(self.m_aChannelList, function () {
				if (this.iId == iChannelId) {
					oChannel = this;
					return false;
				}
			});

			if (oChannel) {
				$.extend(oChannel, oParams);
			}
			return oChannel;
		},
		// 3D定位、手动跟踪、区域聚焦、区域曝光，同时只能开启一个，因为3D定位、手动跟踪在PTZ模块，区域聚焦、区域曝光在工具条模块，该处理函数上提到service
		disableEzoom: function (oPlugin, oParam) {
			var self = this,
				oWnd = self.m_aWndList[self.m_iWndIndex];

			if (oWnd.bEzoom || oWnd.bRegionExposure || oWnd.bRegionFocus || oWnd.bManualTrack || oWnd.b3DZoom || oWnd.bManualTrackEvidence) {
				if (0 === oPlugin.disableEzoom(self.m_iWndIndex)) {
					oWnd.bEzoom = false;
					oWnd.bRegionExposure = false;
					oWnd.bRegionFocus = false;
					oWnd.bManualTrack = false;
					oWnd.b3DZoom = false;
                    oWnd.bManualTrackEvidence = false;

					// 云台界面变量
					if (oParam) {
						oParam.bManualTrack = false;
						oParam.b3DZoom = false;
                        oParam.bManualTrackEvidence = false;
					}
				}
			}
		},
		// 是否为单通道
		isSingleChannel: function () {
			var self = this;
			return (1 == self.m_iAnalogChNum && !_oDevice.m_oDeviceCapa.bSupportDigitalChan);
		}
	};

	module.exports = new Service();
});