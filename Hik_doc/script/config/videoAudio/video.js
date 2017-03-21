/**
 * Created by chenxiangzhen on 2014/7/30.
 */
define(function (require, exports, module) {
	var $ = require("jquery");

	var _oCommon = require("common");
	var _oTranslator = require("translator");
	var _oDialog = require("dialog");
	var _oService = require("config/service");
	var _oResponse = require("isapi/response");
	var _oDevice = require("isapi/device");
	require("ui.slider");
	require("ui.jquery");
	require("config/ui.config");
	var _oUtils = require("utils");
	var xmlDoc = require("lib/xml");


	function Video() {
		this.m_oXmlDoc = null;
	}

	Video.prototype = {
		// 页面初始化
		init: function () {
			var self = this;
			self.initController();
		},
		// 初始化控制器
		initController: function () {
			var self = this;

			angular.module("videoApp", ["ui.jquery", "ui.config"])
				.filter("wd1", function () {
					return function (input, szWd1, bSupportWd1) {
						if(bSupportWd1) {
							var array = [];
							if(szWd1!=="true") {
								var array = [];
								for(var i=0;i<input.length;i++){
									if(input[i] !== "960*480" && input[i] !== "960*576"){
										array.push(input[i]);
									}
								}
							} else {
								array = input;
							}
							return array;
						} else {
							return input;
						}
					};
				})
				.controller("videoController", function ($scope, $timeout) {
					$scope.oVideoLan = _oTranslator.oLastLanguage;
					//通道指令相关
					$scope.iChannelId = _oService.m_iChannelId;
					$scope.iAnalogChannelNum = _oService.m_iAnalogChannelNum;
					$scope.oDigital = _oService.m_aOnlineDigitalChannelId;
					//通道复制指令相关
					$scope.oAnalogId = _oService.m_aOnlineAnalogChannelId;
					$scope.oDigitalId = [];
					$scope.oDialog = _oDialog;
					$scope.oCopyTo = [];
					$scope.bShowCopyToBtn = true; //是否显示复制到按钮
					//视频配置参数
					$scope.oVideoParams = {
						streamType: "01",
						cabac: "true",
						videoType: "0",
						resolution: "0",
						resolutionInit: "0",
						bitrateType: "vbr",
						videoQuality: "90",
						frameRate: "",
						maxBitrateTemp: "1024",//支持平均码率的情况下，不能修改码率上限，所以需要记忆最初的码率上限
						maxBitrate: "1024",
						videoEncoding: "H.264",
						profile: "Main",
						iFrameInterval: "100",
						svc: "false",
						smoothing: 0,
						szWD1: "false",
						szSmartCodec: "",
						iAverageVideoBitrate: 0,
						bEnableRegCrop: false
					};
					//视频参数能力
					$scope.oVideoCapa = {
						resolutions: [],//分辨率能力集合
						frameRates: [],//视频帧率能力集合
						videoQualitys: [], //图像质量
						videoEncodings: [],//编码方式能力集合
						profiles: [],//编码复杂度能力集合
						minIntervalFrameI: 1,
						maxIntervalFrameI: 400,
						minRate: 0,
						maxRate: 0,
						minSmooth: 0,
						maxSmooth: 100,
						bSupportSVC: false, //是否支持SVC
						bSupportVideoAudio: true, //是否支持复合流
						bSupportProfile: false, //是否支持编码复杂度
						bSupportIFrame: false, //是否支持I帧间隔设置
						bSupportSmoothing: false, //是否支持码流平滑
						bSupportTransCode: _oDevice.m_oDeviceCapa.bSupportTransCode, //是否支持虚拟码流
						bSupportCABAC: false, //是否支持CABAC
						bSupportBitrateType: true, //是否支持修改码率类型
						bSupportThirdStream: false, //是否支持第三码流
						bSupportEvent: true, //是否支持码流事件
						bSupportSetvideoType: true, //是否支持视频类型设置
						bSupportSVCMode: false, //是否支持SVC模式
						bSupportEnableWD1: false
					};

					//元素隐藏显示控制
					$scope.oShow = {
						bSmartCodec: false,
						bAverageVideoBitrate: false
					};

					//元素禁用控制
					$scope.oDisabled = {						
						bFrameInterval: false,
						bSVC: false,
						bProfile: false,
						bMaxBitrate: false,
						bResolution: false
					};

					$scope.oWd1Xml = null;
					$scope.oEncodingCapa = {}; //编码方式动态能力
					$scope.oResolutionCapa = {}; //分辨率动态能力
					$scope.oBitrateValid = {
						oEmpty: {
							value: false,
							error: _oTranslator.getValue("nullTips")
						},
						oMinValue: {
							value: $scope.oVideoCapa.minRate,
							error: _oTranslator.getValue("range", [$scope.oVideoCapa.minRate, $scope.oVideoCapa.maxRate])
						},
						oMaxValue: {
							value: $scope.oVideoCapa.maxRate,
							error: _oTranslator.getValue("range", [$scope.oVideoCapa.minRate, $scope.oVideoCapa.maxRate])
						}
					};
					$scope.oIFrameValid = {
						oEmpty: {
							value: false,
							error: _oTranslator.getValue("nullTips")
						},
						oMinValue: {
							value: $scope.oVideoCapa.minIntervalFrameI,
							error: _oTranslator.getValue("range", [$scope.oVideoCapa.minIntervalFrameI, $scope.oVideoCapa.maxIntervalFrameI])
						},
						oMaxValue: {
							value: $scope.oVideoCapa.maxIntervalFrameI,
							error: _oTranslator.getValue("range", [$scope.oVideoCapa.minIntervalFrameI, $scope.oVideoCapa.maxIntervalFrameI])
						}
					};

					$scope.oAverageVideoBitrateValid = {
						oMinValue: {
							value: 32,
							error: _oTranslator.getValue("range", [32, $scope.oVideoParams.maxBitrate])
						},
						oMaxValue: {
							value: $scope.oVideoCapa.maxRate,
							error: _oTranslator.getValue("range", [32, $scope.oVideoParams.maxBitrate])
						}
					};

					$scope.oUtils = _oUtils;
					$scope.oInputValid = {};
					$scope.aInputValidList = [];
					$scope.oInputValidUtils = {};

					$scope.get = function () {
						var szVideoCapaName = "videoCapa";
						var szVideoInfoName = "videoInfo";
						if ($scope.oVideoParams.streamType === "05") {
							szVideoCapaName = "eventVideoCapa";
							szVideoInfoName = "eventVideoInfo";
						}
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, szVideoCapaName, {
							channel: $scope.iChannelId,
							videoStream: $scope.oVideoParams.streamType
						}, {
							async: false,
							success: function (status, xmlDoc) {
								var $xmlDoc = $(xmlDoc);
								//逐行和隔行
								var videoScanType = "";
								if ($xmlDoc.find('videoScanType').length > 0) {
									videoScanType = $xmlDoc.find('videoScanType').eq(0).attr("opt").split(",");
								} else {
									videoScanType = "";
								}
								//分辨率
								$scope.oVideoCapa.resolutions.length = 0;
								var videoResolutionW = $xmlDoc.find('videoResolutionWidth').eq(0).attr("opt").split(",");
								var videoResolutionH = $xmlDoc.find('videoResolutionHeight').eq(0).attr("opt").split(",");
								for (var i = 0; i < videoResolutionW.length; i++) {
									if ((videoResolutionW[i] === "1920" && videoResolutionH[i] === "1080") || (videoResolutionW[i] === "1280" && videoResolutionH[i] === "720")) {
										if (videoScanType != "") {
											for (var j = 0; j < videoScanType.length; j++) {
												if (videoScanType[j] == "progressive") {
													$scope.oVideoCapa.resolutions.push(videoResolutionW[i] + "*" + videoResolutionH[i] + "P");
												} else if (videoScanType[j] == "interlaced") {
													$scope.oVideoCapa.resolutions.push(videoResolutionW[i] + "*" + videoResolutionH[i] + "I");
												}
											}
										} else {
											$scope.oVideoCapa.resolutions.push(videoResolutionW[i] + "*" + videoResolutionH[i]);
										}
									} else {
										if (videoResolutionW[i] === "0" && videoResolutionH[i] === "0") {
											$scope.oVideoCapa.resolutions.push(_oTranslator.getValue("automatic"));
										} else {
											$scope.oVideoCapa.resolutions.push(videoResolutionW[i] + "*" + videoResolutionH[i]);
										}

									}
								}
								//视频帧率
								$scope.oVideoCapa.frameRates.length = 0;
								var maxFrameRate = $xmlDoc.find('maxFrameRate').eq(0).attr("opt").split(",");
								var imaxFrameRate = 0;
								for (var i = 0; i < maxFrameRate.length; i++) {
									imaxFrameRate = parseInt(maxFrameRate[i]);
									if (imaxFrameRate >= 100) {
										imaxFrameRate /= 100;
									} else {
										if (imaxFrameRate > 0) {
											imaxFrameRate = "1/" + Math.floor(100 / imaxFrameRate);
										} else {
											imaxFrameRate = _oTranslator.getValue("fullFrameRate");
										}
									}
									$scope.oVideoCapa.frameRates.push({name: imaxFrameRate, value: maxFrameRate[i]});
								}
								//图像质量
								var fixedQuality = "";
								if ($xmlDoc.find('fixedQuality').eq(0).attr("opt")) {
									fixedQuality = $xmlDoc.find('fixedQuality').eq(0).attr("opt").split(",");
								}
								if (fixedQuality.length > 0) {
									$scope.oVideoCapa.videoQualitys.length = 0;
									//var aFQValue = ["20", "30", "45", "60", "75", "90"]; //前端是[1,20,40,60,80,100]
									var aFQName = ["lowest", "lower", "low", "medium", "higher", "highest"];
									$.each(fixedQuality, function (index, quaValue) {
										//var iNameIndex = $.inArray(quaValue, aFQValue);
										$scope.oVideoCapa.videoQualitys.push({
											name: $scope.oVideoLan[aFQName[index]],
											value: quaValue
										});
									});
								}
								//码率类型
								if ($xmlDoc.find("videoQualityControlType").eq(0).attr("opt").split(",").length > 1) {
									$scope.oVideoCapa.bSupportBitrateType = true;
								} else {
									$scope.oVideoCapa.bSupportBitrateType = false;
								}
								//码率
								$scope.oVideoCapa.minRate = parseInt($xmlDoc.find('constantBitRate').eq(0).attr("min"), 10);
								$scope.oVideoCapa.maxRate = parseInt($xmlDoc.find('constantBitRate').eq(0).attr("max"), 10);

								$scope.oBitrateValid.oMinValue.value = $scope.oVideoCapa.minRate;
								$scope.oBitrateValid.oMinValue.error = _oTranslator.getValue("range", [$scope.oVideoCapa.minRate, $scope.oVideoCapa.maxRate]);
								$scope.oBitrateValid.oMaxValue.value = $scope.oVideoCapa.maxRate;
								$scope.oBitrateValid.oMaxValue.error = _oTranslator.getValue("range", [$scope.oVideoCapa.minRate, $scope.oVideoCapa.maxRate]);
								//码流类型
								if ($xmlDoc.find('Audio').length > 0) {
									$scope.oVideoCapa.bSupportVideoAudio = true;
									if ($xmlDoc.find("Audio").eq(0).find("enabled").attr("opt").split(",").length <= 1) {
										$scope.oVideoCapa.bSupportSetvideoType = false;
									} else {
										$scope.oVideoCapa.bSupportSetvideoType = true;
									}
								} else {
									$scope.oVideoCapa.bSupportVideoAudio = false;
									$scope.oVideoCapa.bSupportSetvideoType = false;
								}
								//SVC
								if ($xmlDoc.find('SVC').length > 0) {
									$scope.oVideoCapa.bSupportSVC = true;
									if ($xmlDoc.find('SVCMode').length > 0) {
										$scope.oVideoCapa.bSupportSVCMode = true
									} else {
										$scope.oVideoCapa.bSupportSVCMode = false;
									}
								} else {
									$scope.oVideoCapa.bSupportSVC = false;
									$scope.oVideoCapa.bSupportSVCMode = false;
								}
								//编码类型
								$scope.oVideoCapa.videoEncodings.length = 0;
								$scope.oEncodingCapa = {};
								var codecType = $xmlDoc.find('videoCodecType').eq(0).attr("opt").split(",");
								$.each(codecType, function (i, CodecTypeValue) {
									$scope.oVideoCapa.videoEncodings.push(CodecTypeValue);
									$scope.oEncodingCapa[CodecTypeValue] = {
										aProfiles: [],
										szDefProfile: "",
										bSupportSVC: false,
										bSupportCBRSmooth: false,
										bSupportVBRSmooth: false,
										oSmartCodec: {//Smart264
											bSupport: false,
											aReadOnlyParams: []
										},
										oAverageVideoBitrate: {//平均码率
											bSupportConstant: false,
											bSupportVariable: false
										}
									};
									//编码复杂度
									var aValueSet = ["Baseline", "Main", "High"];
									var aNameSet = ["basicProfile", "mainProfile", "highProfile"];
									if (CodecTypeValue === "H.264") {
										if ($xmlDoc.find('Video').eq(0).find('H264Profile').length > 0) {
											var aH264Profiles = $xmlDoc.find('Video').eq(0).find('H264Profile').eq(0).attr("opt").split(",");
											for (var i = 0; i < aH264Profiles.length; i++) {
												var _iPos = $.inArray(aH264Profiles[i], aValueSet);
												$scope.oEncodingCapa[CodecTypeValue].aProfiles.push({
													name: _oTranslator.getValue(aNameSet[_iPos]),
													value: aH264Profiles[i]
												});
											}
											$scope.oEncodingCapa[CodecTypeValue].szDefProfile = _oUtils.nodeValue(xmlDoc, "H264Profile");
										}
										if ($scope.oVideoCapa.bSupportSVC) {
											$scope.oEncodingCapa[CodecTypeValue].bSupportSVC = true;
										}
									} else if (CodecTypeValue === "H.265") {
										if ($xmlDoc.find('Video').eq(0).find('H265Profile').length > 0) {
											var aH265Profiles = $xmlDoc.find('Video').eq(0).find('H265Profile').eq(0).attr("opt").split(",");
											for (var i = 0; i < aH265Profiles.length; i++) {
												var _iPos = $.inArray(aH265Profiles[i], aValueSet);
												$scope.oEncodingCapa[CodecTypeValue].aProfiles.push({
													name: _oTranslator.getValue(aNameSet[_iPos]),
													value: aH265Profiles[i]
												});
											}
											$scope.oEncodingCapa[CodecTypeValue].szDefProfile = _oUtils.nodeValue(xmlDoc, "H265Profile");
										}
									} else if (CodecTypeValue === "SVAC") {
										if ($xmlDoc.find('Video').eq(0).find('SVACProfile').length > 0) {
											var aSVACProfiles = $xmlDoc.find('Video').eq(0).find('SVACProfile').eq(0).attr("opt").split(",");
											for (var i = 0; i < aSVACProfiles.length; i++) {
												var _iPos = $.inArray(aSVACProfiles[i], aValueSet);
												$scope.oEncodingCapa[CodecTypeValue].aProfiles.push({
													name: _oTranslator.getValue(aNameSet[_iPos]),
													value: aSVACProfiles[i]
												});
											}
											$scope.oEncodingCapa[CodecTypeValue].szDefProfile = _oUtils.nodeValue(xmlDoc, "SVACProfile");
										}
										if ($scope.oVideoCapa.bSupportSVC) {
											$scope.oEncodingCapa[CodecTypeValue].bSupportSVC = true;
										}
									}
								});
								//I帧间隔
								if ($xmlDoc.find('Video').eq(0).find('GovLength').length > 0) {
									$scope.oVideoCapa.bSupportIFrame = true;
									$scope.oVideoCapa.minIntervalFrameI = parseInt($xmlDoc.find('Video').eq(0).find('GovLength').eq(0).attr("min"), 10);
									$scope.oVideoCapa.maxIntervalFrameI = parseInt($xmlDoc.find('Video').eq(0).find('GovLength').eq(0).attr("max"), 10);
									$scope.oIFrameValid.oMinValue = {
										value: $scope.oVideoCapa.minIntervalFrameI,
										error: _oTranslator.getValue("range", [$scope.oVideoCapa.minIntervalFrameI, $scope.oVideoCapa.maxIntervalFrameI])
									};

									$scope.oIFrameValid.oMaxValue = {
										value: $scope.oVideoCapa.maxIntervalFrameI,
										error: _oTranslator.getValue("range", [$scope.oVideoCapa.minIntervalFrameI, $scope.oVideoCapa.maxIntervalFrameI])
									};										
								}
								//CABAC
								if ($xmlDoc.find('enableCABAC').length > 0) {
									$scope.oVideoCapa.bSupportCABAC = true;
								} else {
									$scope.oVideoCapa.bSupportCABAC = false;
								}
								//码流平滑
								if ($xmlDoc.find('smoothing').length > 0) {
									$scope.oVideoCapa.bSupportSmoothing = true;
									$scope.oVideoCapa.minSmooth = parseInt($xmlDoc.find('smoothing').eq(0).attr("min"), 10);
									$scope.oVideoCapa.maxSmooth = parseInt($xmlDoc.find('smoothing').eq(0).attr("max"), 10);
								} else {
									$scope.oVideoCapa.bSupportSmoothing = false;
								}
								//动态能力
								WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "videoDynamicCapa", {
									channel: $scope.iChannelId,
									videoStream: $scope.oVideoParams.streamType
								}, {
									async: false,
									success: function (status, xmlDoc) {
										var $xmlDoc = $(xmlDoc);
										//分辨率关联能力
										$scope.oResolutionCapa = {};
										var oResolutionDscriptorList = $xmlDoc.find("ResolutionAvailableDscriptor");
										for (var i = 0; i < oResolutionDscriptorList.length; i++) {
											var oResolution = oResolutionDscriptorList.eq(i);
											var szResolution = oResolution.find("videoResolutionWidth").eq(0).text() + "*" + oResolution.find("videoResolutionHeight").eq(0).text();
											$scope.oResolutionCapa[szResolution] = oResolution.find("supportedFrameRate").eq(0).text().split(",");
										}
										//编码方式关联能力
										for (var i = 0; i < $scope.oVideoCapa.videoEncodings.length; i++) {
											var szVideoEncoding = $scope.oVideoCapa.videoEncodings[i];
											if (szVideoEncoding === "H.264" || szVideoEncoding === "H.265") {
												$scope.oEncodingCapa[szVideoEncoding].bSupportCBRSmooth = $xmlDoc.find("CBRCap").eq(0).find("isSupportSmooth").eq(0).text() === "true";
												$scope.oEncodingCapa[szVideoEncoding].bSupportVBRSmooth = $xmlDoc.find("VBRCap").eq(0).find("isSupportSmooth").eq(0).text() === "true";
											}
										}

										//Smart264
										var oEncodingCapa = $scope.oEncodingCapa;
										$(xmlDoc).find("CodecParamDscriptor").each(function () {
											var szVideoEncoding = _oUtils.nodeValue(this, "videoCodecType");
											var oSmartCodecCab = oEncodingCapa[szVideoEncoding].oSmartCodec;
											oSmartCodecCab.bSupport = !!$(this).find("SmartCodecCap").length;
											if (oSmartCodecCab.bSupport) {
												oSmartCodecCab.aReadOnlyParams = _oUtils.nodeAttr(this, "readOnlyParams", "opt").split(",");
											}

											if ($(this).find("BitrateType").length) {
												var oAverageVideoBitrate = oEncodingCapa[szVideoEncoding].oAverageVideoBitrate;
												var aVariableSupportParams = _oUtils.nodeAttr(this, "Variable support", "opt").split(",");
												if (-1 !== $.inArray("averageVideoBitrate", aVariableSupportParams)) {
													oAverageVideoBitrate.bSupportVariable = true;
												} else {
													oAverageVideoBitrate.bSupportVariable = false;
												}

												var aConstantSupportParams = _oUtils.nodeAttr(this, "Constant support", "opt").split(",");
												if (-1 !== $.inArray("averageVideoBitrate", aConstantSupportParams)) {
													oAverageVideoBitrate.bSupportConstant = true;
												} else {
													oAverageVideoBitrate.bSupportConstant = false;
												}
											}
											
										});
									}
								});
								//区域裁剪
								isEnableRegCrop();
								//获取参数
								WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, szVideoInfoName, {
									channel: $scope.iChannelId,
									videoStream: $scope.oVideoParams.streamType
								}, {
									async: false,
									success: function (status, xmlDoc) {
										self.m_oXmlDoc = xmlDoc;
										var $xmlDoc = $(xmlDoc);
										if ($xmlDoc.find('Audio').length > 0) {
											var szAudioEnabled = $xmlDoc.find('Audio').eq(0).find('enabled').eq(0).text();
											if (szAudioEnabled == 'true') {
												$scope.oVideoParams.videoType = "1";
											} else {
												$scope.oVideoParams.videoType = "0";
											}
										} else {
											$scope.oVideoParams.videoType = "0";
										}
										//分辨率
										var szResolution = "";
										var ivideoResolutionWidth = $xmlDoc.find('videoResolutionWidth').eq(0).text();
										var ivideoResolutionHeight = $xmlDoc.find('videoResolutionHeight').eq(0).text();
										if ((ivideoResolutionWidth == "1920" && ivideoResolutionHeight == "1080") || (ivideoResolutionWidth == "1280" && ivideoResolutionHeight == "720")) {
											if ($xmlDoc.find('videoScanType').length > 0) {
												if ($xmlDoc.find('videoScanType').eq(0).text() === 'progressive') {
													szResolution = ivideoResolutionWidth + "*" + ivideoResolutionHeight + "P";
												} else {
													szResolution = ivideoResolutionWidth + "*" + ivideoResolutionHeight + "I";
												}
											} else {
												szResolution = ivideoResolutionWidth + "*" + ivideoResolutionHeight;
											}
										} else {
											if (ivideoResolutionWidth === "0" && ivideoResolutionHeight === "0") {
												szResolution = _oTranslator.getValue("automatic");
											} else {
												szResolution = ivideoResolutionWidth + "*" + ivideoResolutionHeight;
											}
										}
										$scope.oVideoParams.resolution = szResolution;
										$scope.oVideoParams.resolutionInit = szResolution;
										//视频帧率
										$scope.oVideoParams.frameRate = $xmlDoc.find("maxFrameRate").eq(0).text();
										//码率类型
										$scope.oVideoParams.bitrateType = $xmlDoc.find('videoQualityControlType').eq(0).text().toLowerCase();
										//图像质量
										$scope.oVideoParams.videoQuality = $xmlDoc.find('fixedQuality').eq(0).text();
										//码率
										if ($scope.oVideoParams.bitrateType === "cbr") {
											$scope.oVideoParams.maxBitrate = $xmlDoc.find("constantBitRate").eq(0).text();
										} else {
											$scope.oVideoParams.maxBitrate = $xmlDoc.find("vbrUpperCap").eq(0).text();
										}
										$scope.oVideoParams.maxBitrateTemp = $scope.oVideoParams.maxBitrate;
										//编码类型
										$scope.oVideoParams.videoEncoding = $xmlDoc.find('videoCodecType').eq(0).text();
										//编码复杂度
										if ($xmlDoc.find('Video').eq(0).find($scope.oVideoParams.videoEncoding.replace(/[\.]/g, "") + "Profile").length > 0) {
											$scope.oVideoParams.profile = $xmlDoc.find('Video').eq(0).find($scope.oVideoParams.videoEncoding.replace(/[\.]/g, "") + "Profile").eq(0).text();
										}
										//I帧间隔
										if ($xmlDoc.find('Video').eq(0).find('GovLength').length > 0) {
											$scope.oVideoParams.iFrameInterval = $xmlDoc.find('Video').eq(0).find('GovLength').eq(0).text();
										}
										//CABAC
										if ($xmlDoc.find('enableCABAC').length > 0) {
											$scope.oVideoParams.cabac = $xmlDoc.find('enableCABAC').eq(0).text();
										}
										//smooth
										if ($xmlDoc.find('smoothing').length > 0) {
											$scope.oVideoParams.smoothing = parseInt($xmlDoc.find('smoothing').eq(0).text(), 10);
										}
										//SVC
										if ($xmlDoc.find('SVC').length > 0) {
											$scope.oVideoParams.svc = $xmlDoc.find('SVC').eq(0).find("enabled").eq(0).text();
											if ($scope.oVideoParams.svc === "true") {
												if ($xmlDoc.find('SVC').eq(0).find("SVCMode").eq(0).text() === "auto") {
													$scope.oVideoParams.svc = "auto";
												}
											}
										}

										//Smart264
										$scope.oVideoParams.szSmartCodec = _oUtils.nodeValue($xmlDoc, "SmartCodec enabled") || "false";
										$scope.oVideoParams.iAverageVideoBitrate = _oUtils.nodeValue($xmlDoc, "vbrAverageCap", "i");

										$timeout(function () {
											mutex();
										}, 10);
										
									},
									error: function (status, xmlDoc, xhr) {
										_oResponse.getState(xhr);
									}
								});							
								
							},
							error: function (status, xmlDoc, xhr) {
								_oResponse.getState(xhr);
							}
						});

					};
					//获取WD1信息
					$scope.getWD1Info = function (iId) {
						WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "AnalogChannelInfo", null, {
							async: false,
							success: function (status, xmlDoc) {
								$scope.oWd1Xml = xmlDoc;
								if($(xmlDoc).find("enableWD1").length > 0) {
									$scope.oVideoCapa.bSupportEnableWD1 = true;
									$scope.oVideoParams.szWD1 = _oUtils.nodeValue($(xmlDoc).find("VideoInputChannel").eq(iId-1), "enableWD1");
								} else {
									$scope.oVideoCapa.bSupportEnableWD1 = false;
								}
							}
						});
					};					

					//改变通道触发
					$scope.$watch("iChannelId", function (newChannel) {
						if (newChannel > 0) {
							_oService.m_iChannelId = newChannel;
							if ($scope.iChannelId <= _oService.m_iAnalogChannelNum) {
								$scope.bShowCopyToBtn = true;
							} else {
								$scope.bShowCopyToBtn = false;
							}
							//是否支持码流事件
							WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "eventVideoCapa", {channel: newChannel}, {
								async: false,
								success: function (status, xmlDoc) {
									$scope.oVideoCapa.bSupportEvent = true;
								},
								error: function () {
									$scope.oVideoCapa.bSupportEvent = false;
								},
								complete: function () {
									if (!$scope.oVideoCapa.bSupportEvent) {
										if ($scope.oVideoParams.streamType === "05") {
											$scope.oVideoParams.streamType = "01";
										}
									}
								}
							});
							//是否支持三码流
							WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "StreamChannels", null, {
								async: false,
								success: function (status, xmlDoc) {
									$scope.oVideoCapa.bSupportThirdStream = false;
									$(xmlDoc).find('StreamingChannel').each(function () {
										if ($(this).find("id").eq(0).text() === newChannel + "03") {
											$scope.oVideoCapa.bSupportThirdStream = true;
											return false;
										}
									});
								},
								error: function () {
									$scope.oVideoCapa.bSupportThirdStream = false;
								},
								complete: function () {
									if (!$scope.oVideoCapa.bSupportThirdStream) {
										if ($scope.oVideoParams.streamType === "03") {
											$scope.oVideoParams.streamType = "01";
										}
									}
								}
							});
							$scope.get();
							if ($scope.iChannelId <= _oService.m_iAnalogChannelNum) {
								$scope.getWD1Info($scope.iChannelId);
							}
						}
					});
					$scope.$watch("oVideoParams.szWD1", function (newChannel) {
						if (newChannel === "true") {
							if($scope.oVideoCapa.bSupportEnableWD1) {
								$scope.oVideoParams.resolution = $scope.oVideoParams.resolutionInit;
							}
						} else if(newChannel === "false") {
							if($scope.oVideoCapa.bSupportEnableWD1) {
								if($scope.oVideoParams.resolutionInit === $scope.oVideoCapa.resolutions[0]) {
									$scope.oVideoParams.resolution = $scope.oVideoCapa.resolutions[1];
								}
							}
						}

					});
					//改变编码方式
					$scope.$watch("oVideoParams.videoEncoding", function (newVideoEncoding) {
						if (newVideoEncoding) {														
							mutex();
						}
					});
					//改变分辨率
					$scope.$watch("oVideoParams.resolution", function (newResolution) {
						if (newResolution) {
							newResolution = newResolution.replace(/[PIpi]/g, "");
							if ($scope.oResolutionCapa[newResolution]) {
								$scope.oVideoCapa.frameRates.length = 0;
								var maxFrameRate = $scope.oResolutionCapa[newResolution];
								var imaxFrameRate = 0;
								for (var i = 0; i < maxFrameRate.length; i++) {
									imaxFrameRate = parseInt(maxFrameRate[i]);
									if (imaxFrameRate >= 100) {
										imaxFrameRate /= 100;
									} else {
										if (imaxFrameRate > 0) {
											imaxFrameRate = "1/" + Math.floor(100 / imaxFrameRate);
										} else {
											imaxFrameRate = _oTranslator.getValue("fullFrameRate");
										}
									}
									$scope.oVideoCapa.frameRates.push({name: imaxFrameRate, value: maxFrameRate[i]});
								}
								if ($.inArray($scope.oVideoParams.frameRate, maxFrameRate) < 0) {
									$scope.oVideoParams.frameRate = maxFrameRate[0];
								}
							}
						}
					});
					//改变码率类型
					$scope.$watch("oVideoParams.bitrateType", function (newRitrateType) {
						if (newRitrateType) {
							if ($scope.oVideoCapa.bSupportBitrateType) {
								if ($scope.oVideoParams.bitrateType === "vbr") {
									if ($scope.oEncodingCapa[$scope.oVideoParams.videoEncoding].bSupportVBRSmooth) {
										$scope.oVideoCapa.bSupportSmoothing = true;
									} else {
										$scope.oVideoCapa.bSupportSmoothing = false;
									}
								} else {
									if ($scope.oEncodingCapa[$scope.oVideoParams.videoEncoding].bSupportVBRSmooth) {
										$scope.oVideoCapa.bSupportSmoothing = true;
									} else {
										$scope.oVideoCapa.bSupportSmoothing = false;
									}
								}
							}

							mutex();
						}
					});
					//改变码流触发
					$scope.changeStreamType = function () {
						_oUtils.hideValidTip();
						$scope.get();
					};
					//保存视频配置
					//bReboot:为true时，如果设备返回需要重启，就立即重启，不询问
					$scope.save = function (bReboot) {
						$scope.oInputValidUtils.manualInputValid();
						if (!$scope.oInputValid.bInputValid) {
							return;
						}
						if (self.m_oXmlDoc !== null) {
							var szVideoInfoName = "videoInfo";
							if ($scope.oVideoParams.streamType === "05") {
								szVideoInfoName = "eventVideoInfo";
							}
							var oStreamXml = new xmlDoc(self.m_oXmlDoc);
							oStreamXml.setNodeValue("StreamingChannel->id", $scope.iChannelId + $scope.oVideoParams.streamType);
							oStreamXml.removeNode("Video");
							var oVideoXml = oStreamXml.createNode("Video");
							oStreamXml.insert(oVideoXml);
							oStreamXml.insert(("enabled:true"), oVideoXml);

							if ($scope.iChannelId <= _oService.m_iAnalogChannelNum || $scope.oVideoParams.streamType === "05"/*主码流(事件)*/) {
								oStreamXml.insert("videoInputChannelID:" + $scope.iChannelId, oVideoXml);
							} else {
								oStreamXml.insert("dynVideoInputChannelID:" + $scope.iChannelId, oVideoXml);
							}
							oStreamXml.insert(("videoCodecType:" + $scope.oVideoParams.videoEncoding), oVideoXml);
							if ($scope.oVideoParams.resolution === _oTranslator.getValue("automatic")) {
								oStreamXml.insert("videoResolutionWidth:0", oVideoXml);
								oStreamXml.insert("videoResolutionHeight:0", oVideoXml);
							} else {
								var videoResolution = $scope.oVideoParams.resolution.split("*");
								oStreamXml.insert(("videoResolutionWidth:" + videoResolution[0]), oVideoXml);
								if ($scope.oVideoParams.resolution == "1920*1080P" || $scope.oVideoParams.resolution == "1920*1080I" || $scope.oVideoParams.resolution == "1280*720P" || $scope.oVideoParams.resolution == "1280*720I") {
									if ($scope.oVideoParams.resolution.substring($scope.oVideoParams.resolution.length - 1) == "P") {
										oStreamXml.insert("videoScanType:progressive", oVideoXml);
									} else if ($scope.oVideoParams.resolution.substring($scope.oVideoParams.resolution.length - 1) == "I") {
										oStreamXml.insert("videoScanType:interlaced", oVideoXml);
									}
									oStreamXml.insert(("videoResolutionHeight:" + videoResolution[1].substring(0, videoResolution[1].length - 1)), oVideoXml);
								} else {
									oStreamXml.insert(("videoResolutionHeight:" + videoResolution[1]), oVideoXml);
								}
							}

							oStreamXml.insert(("videoQualityControlType:" + $scope.oVideoParams.bitrateType), oVideoXml);
							if ($scope.oVideoParams.bitrateType === "cbr") {
								oStreamXml.insert(("constantBitRate:" + $scope.oVideoParams.maxBitrate), oVideoXml);
							} else {
								oStreamXml.insert(("fixedQuality:" + $scope.oVideoParams.videoQuality), oVideoXml);
								oStreamXml.insert(("vbrUpperCap:" + $scope.oVideoParams.maxBitrate), oVideoXml);
							}
							oStreamXml.insert(("maxFrameRate:" + $scope.oVideoParams.frameRate), oVideoXml);
							//I帧间隔
							oStreamXml.insert(("GovLength:" + $scope.oVideoParams.iFrameInterval), oVideoXml);
							//编码复杂度
							if ($scope.oVideoCapa.bSupportProfile) {
								oStreamXml.insert(($scope.oVideoParams.videoEncoding.replace(/[\.]/g, "") + "Profile:" + $scope.oVideoParams.profile), oVideoXml);
							}
							//SVC
							if ($scope.oVideoCapa.bSupportSVC) {
								var oSVCXml = oStreamXml.createNode("SVC");
								oStreamXml.insert(oSVCXml, oVideoXml);
								if ($scope.oVideoParams.svc === "false") {
									oStreamXml.insert("enabled:false", oSVCXml);
								} else {
									oStreamXml.insert("enabled:true", oSVCXml);
									if ($scope.oVideoCapa.bSupportSVCMode) {
										oStreamXml.insert("SVCMode:" + ($scope.oVideoParams.svc === "true" ? "manual" : "auto"), oSVCXml);
									}
								}
							}
							//Smooth
							if ($scope.oVideoCapa.bSupportSmoothing) {
								oStreamXml.insert(("smoothing:" + $scope.oVideoParams.smoothing), oVideoXml);
							}
							//Smart264
							if ($scope.oShow.bSmartCodec) {
								var oSmartCodecXml = oStreamXml.createNode("SmartCodec");
								oStreamXml.insert(oSmartCodecXml, oVideoXml);
								oStreamXml.insert(("enabled:" + $scope.oVideoParams.szSmartCodec), oSmartCodecXml);
							}

							if ($scope.oShow.bAverageVideoBitrate) {
								if (!$scope.oVideoParams.iAverageVideoBitrate) {
									$scope.oVideoParams.iAverageVideoBitrate = getAverageVideoBitrateDef();
								}		
								oStreamXml.insert(("vbrAverageCap:" + $scope.oVideoParams.iAverageVideoBitrate), oVideoXml);
							}

							if ($scope.oVideoCapa.bSupportVideoAudio) {
								if ($scope.oVideoParams.videoType === "1") {
									oStreamXml.setNodeValue("Audio->enabled", 'true');

								} else {
									oStreamXml.setNodeValue("Audio->enabled", 'false');
								}
							}
							
							//CABAC
							if ($scope.oVideoCapa.bSupportCABAC) {
								oStreamXml.setNodeValue("enableCABAC", $scope.oVideoParams.cabac);
							}
							var _oSuccessXhr = null;
							var _oErrorXhr = null;
							var szError = "";
							WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, szVideoInfoName, {
								channel: $scope.iChannelId,
								videoStream: $scope.oVideoParams.streamType
							}, {
								async: false,
								data: oStreamXml.m_oXmlDoc,
								success: function (status, xmlDoc, xhr) {
									_oSuccessXhr = xhr;

									//更新一下maxBitrateTemp
									$scope.oVideoParams.maxBitrateTemp = $scope.oVideoParams.maxBitrate;
								},
								error: function (status, xmlDoc, xhr) {
									_oErrorXhr = xhr;
								}
							});
							if($scope.iChannelId <= _oService.m_iAnalogChannelNum && $scope.oVideoCapa.bSupportEnableWD1) {
								var szXml = "<?xml version='1.0' encoding='UTF-8'?><VideoInputChannel><id>" + $scope.iChannelId + "</id><inputPort>" + $scope.iChannelId + "</inputPort>";
								szXml += "<videoInputEnabled>" + $($scope.oWd1Xml).find("videoInputEnabled").eq($scope.iChannelId-1).text() + "</videoInputEnabled>";
								szXml += "<name>" + $($scope.oWd1Xml).find("name").eq($scope.iChannelId-1).text() + "</name>";
								szXml += "<videoFormat>" + $($scope.oWd1Xml).find("videoFormat").eq($scope.iChannelId-1).text() + "</videoFormat>";
								szXml += "<enableWD1>" + $scope.oVideoParams.szWD1 + "</enableWD1></VideoInputChannel>";
								var oXmlDoc = _oUtils.parseXmlFromStr(szXml);
								WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "AnalogChannelSingleInfo", {channel: $scope.iChannelId}, {
									async: false,
									data: oXmlDoc,
									success: function (status, xmlDoc, xhr) {
										_oSuccessXhr = xhr;
									},
									error: function (status, xmlDoc, xhr) {
										_oErrorXhr = xhr;
									}
								});
							}
							if ($scope.iChannelId <= _oService.m_iAnalogChannelNum) {
								$.each($scope.oCopyTo, function (index, element) {
									if (element.value && !element.disabled) {
										oStreamXml.setNodeValue("StreamingChannel->id", element.id + $scope.oVideoParams.streamType);
										oStreamXml.setNodeValue("Video->videoInputChannelID", element.id);
										WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, szVideoInfoName, {
											channel: element.id,
											videoStream: $scope.oVideoParams.streamType
										}, {
											async: false,
											data: oStreamXml.m_oXmlDoc,
											success: function (status, xmlDoc, xhr) {
												_oSuccessXhr = xhr;
											},
											error: function (status, xmlDoc, xhr) {
												_oErrorXhr = xhr;
											}
										});
										if($scope.oVideoCapa.bSupportEnableWD1) {
											var szXml = "<?xml version='1.0' encoding='UTF-8'?><VideoInputChannel><id>" + element.id + "</id><inputPort>" + element.id + "</inputPort>";
											szXml += "<videoInputEnabled>" + $($scope.oWd1Xml).find("videoInputEnabled").eq(element.id-1).text() + "</videoInputEnabled>";
											szXml += "<name>" + $($scope.oWd1Xml).find("name").eq(element.id-1).text() + "</name>";
											szXml += "<videoFormat>" + $($scope.oWd1Xml).find("videoFormat").eq(element.id-1).text() + "</videoFormat>";
											szXml += "<enableWD1>" + $scope.oVideoParams.szWD1 + "</enableWD1></VideoInputChannel>";
											var xmlDoc = _oUtils.parseXmlFromStr(szXml);
											WebSDK.WSDK_SetDeviceConfig(_oCommon.m_szHostName, "AnalogChannelSingleInfo", {channel: element.id}, {
												async: false,
												data: xmlDoc,
												success: function (status, xmlDoc, xhr) {
													_oSuccessXhr = xhr;
												},
												error: function (status, xmlDoc, xhr) {
													_oErrorXhr = xhr;
												}
											});
										}
										if (_oErrorXhr !== null) {
											if ("" == szError) {
												szError = _oTranslator.getValue("setAlarmParam") + element.name + " ";
											} else {
												szError += "," + element.name + " ";
											}
										}
									}
								});
							}
							if (null === _oErrorXhr) {
								if (bReboot) {
									_oResponse.toRestart();
								} else {
									_oResponse.saveState(_oSuccessXhr);
								}
							} else {
								_oResponse.saveState(_oErrorXhr, szError);
							}
						}
					};

					$scope.$watch("oVideoParams.maxBitrate", function (to, from) {
						var iMaxAVB = parseInt(to, 10);
						if (iMaxAVB) {
							$scope.oAverageVideoBitrateValid.oMinValue = {
								value: 32,
								error: _oTranslator.getValue("range", [32, iMaxAVB])
							};

							$scope.oAverageVideoBitrateValid.oMaxValue = {
								value: iMaxAVB,
								error: _oTranslator.getValue("range", [32, iMaxAVB])
							};
						}
					});

					$scope.changeSmartCodec = function () {
						$scope.oInputValidUtils.manualInputValid();
						if (!$scope.oInputValid.bInputValid) {
							if ("true" === $scope.oVideoParams.szSmartCodec) {
								$scope.oVideoParams.szSmartCodec = "false";
							} else {
								$scope.oVideoParams.szSmartCodec = "true";
							}
							return;
						}						

						_oDialog.confirm(_oTranslator.getValue("rebootDeviceTip"), 300, function () {
							$scope.save(true);
						}, function () {
							if ("true" === $scope.oVideoParams.szSmartCodec) {
								$scope.oVideoParams.szSmartCodec = "false";
							} else {
								$scope.oVideoParams.szSmartCodec = "true";
							}						
							$scope.$apply();
						});
					};

					//显示码率上限快捷选择列表
					$scope.toggleMaxBitrateList = function (oEvent, bMode) {
						var oElement = $(oEvent.target);
						$("#divBitRateArea").remove();
						if (bMode) {						
							var oDiv = $("<div id='divBitRateArea'></div>").appendTo($(document.body));
							oDiv.css({
								position: "absolute",
								left: oElement.offset().left,
								top: oElement.offset().top + oElement.height() + 2,
								width: oElement.outerWidth(),
								background: "#FFFFFF",
								border: "1px solid #828790"
							});

							var oSelectOpts = ["256", "512", "1024", "2048", "3072", "4096", "6144", "8192", "12288", "16384"];
							oSelectOpts = $.grep(oSelectOpts, function (n, i) {
								var iVal = parseInt(n, 10);
								return (iVal >= $scope.oVideoCapa.minRate && iVal <= $scope.oVideoCapa.maxRate);
							});

							for (var i = 0, len = oSelectOpts.length; i < len; ++i) {
								$("<div style='cursor: pointer; height: 22px; line-height: 22px; vertical-align: middle;'>" + oSelectOpts[i] + "</div>").appendTo(oDiv).bind({
									mousedown: function () {
										$scope.oVideoParams.maxBitrate = $(this).text();																	
									},
									mouseover: function () {
										$(this).css("backgroundColor", "#1E90FF");
									},
									mouseout: function () {
										$(this).css("backgroundColor", "");
									}
								});
							}
						}
					};					

					//元素间互斥关系，注意避免死循环
					function mutex () {
						var oDisabled = $scope.oDisabled;
						var oShow = $scope.oShow;
						var oVideoParams = $scope.oVideoParams;
						var oVideoCapa = $scope.oVideoCapa;
						var oEncodingCapa = $scope.oEncodingCapa;

						//还原
						$.each(oDisabled, function (key) {
							oDisabled[key] = false;
						});

						$.each(oShow, function (key) {
							oShow[key] = false;
						});

						//Smart264
						var oSmartCodecCab = oEncodingCapa[oVideoParams.videoEncoding].oSmartCodec;
						oShow.bSmartCodec = oSmartCodecCab.bSupport;
						if (oShow.bSmartCodec && ("true" === oVideoParams.szSmartCodec)) {
							$.each(oSmartCodecCab.aReadOnlyParams, function (i, szValue) {
								switch (szValue) {
									case "keyFrameInterval":
										oDisabled.bFrameInterval = true;
										break;
									case "Profile":
										oDisabled.bProfile = true;
										break;
									case "SVC":
										oDisabled.bSVC = true;
										break;
								}
							});

							//平均码率	
							var oAverageVideoBitrate = oEncodingCapa[oVideoParams.videoEncoding].oAverageVideoBitrate;						
							if ("vbr" === oVideoParams.bitrateType && oAverageVideoBitrate.bSupportVariable) {
								oShow.bAverageVideoBitrate = true;
							} else if ("cbr" === oVideoParams.bitrateType && oAverageVideoBitrate.bSupportConstant) {
								oShow.bAverageVideoBitrate = true;
							}

							if (oShow.bAverageVideoBitrate) {
								oVideoParams.maxBitrate = oVideoParams.maxBitrateTemp;
								oVideoParams.iAverageVideoBitrate = oVideoParams.iAverageVideoBitrate || getAverageVideoBitrateDef();
							} else {								
								oVideoParams.iAverageVideoBitrate = 0;
							}						
						}
						$scope.oAverageVideoBitrateValid.bSkipValid = !oShow.bAverageVideoBitrate;

						//码率上限
						if ((oVideoCapa.minRate === oVideoCapa.maxRate) || oShow.bAverageVideoBitrate) {
							oDisabled.bMaxBitrate = true;
						}

						//I帧间隔
						if (oVideoCapa.minIntervalFrameI === oVideoCapa.maxIntervalFrameI) {
							oDisabled.bFrameInterval = true;
						}

						//码流平滑
						if (oVideoCapa.bSupportBitrateType) {
							if (oVideoParams.bitrateType === "vbr") {
								if (oEncodingCapa[oVideoParams.videoEncoding].bSupportVBRSmooth) {
									oVideoCapa.bSupportSmoothing = true;
								} else {
									oVideoCapa.bSupportSmoothing = false;
								}
							} else {
								if (oEncodingCapa[oVideoParams.videoEncoding].bSupportCBRSmooth) {
									oVideoCapa.bSupportSmoothing = true;
								} else {
									oVideoCapa.bSupportSmoothing = false;
								}
							}
						}

						//分辨率
						if (oVideoParams.bEnableRegCrop || oVideoCapa.resolutions.length <= 1) {
							oDisabled.bResolution = true;
						} else {
							oDisabled.bResolution = false;
						}

						//编码复杂度
						if (oEncodingCapa[oVideoParams.videoEncoding].aProfiles.length > 0) {
							oVideoCapa.bSupportProfile = true;
							oVideoCapa.profiles.length = 0;
							oVideoCapa.profiles = oEncodingCapa[oVideoParams.videoEncoding].aProfiles.concat();

							var aProfiles = [];
							$.each(oEncodingCapa[oVideoParams.videoEncoding].aProfiles, function () {
								aProfiles.push(this.value);
							});
							
							if (-1 === $.inArray(oVideoParams.profile, aProfiles)) {
								oVideoParams.profile = 	aProfiles[0];
							}
						} else {
							oVideoCapa.bSupportProfile = false;
						}

						//SVC
						if (oEncodingCapa[oVideoParams.videoEncoding].bSupportSVC) {
							oVideoCapa.bSupportSVC = true;
						} else {
							oVideoCapa.bSupportSVC = false;
						}						
					}

					//平均码率默认值
					function getAverageVideoBitrateDef () {
						var iAverageVideoBitrate = 0;
						var szXml = "<?xml version='1.0' encoding='UTF-8'?>";
						szXml += "<StreamingDescriptor>";
						szXml += "<VbrAverageCapDynamicLinkTo>";
						szXml += "<vbrUpperCap>" + $scope.oVideoParams.maxBitrate + "</vbrUpperCap>";
						szXml += "</VbrAverageCapDynamicLinkTo>";
						szXml += "</StreamingDescriptor>";
					    
					    WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "dynamicCapWithCondition", {channel: _oService.m_iChannelId, videoStream:$scope.oVideoParams.streamType}, {
                            async: false,
                            data: szXml,
                            success: function (status, xmlDoc) {
                            	iAverageVideoBitrate = _oUtils.nodeValue(xmlDoc, "vbrAverageCap", "i");
                            }
                        });

                        return iAverageVideoBitrate;
					}

					//区域剪裁是否启用，如果启用，分辨率不可配置
					function isEnableRegCrop () {
						$scope.oVideoParams.bEnableRegCrop = false;
						var bRet = false;
						if ("03" !== $scope.oVideoParams.streamType) {
							return false;
						}
						
                        WebSDK.WSDK_GetDeviceConfig(_oCommon.m_szHostName, "regCropInfo", {channel: _oService.m_iChannelId, videoStream:$scope.oVideoParams.streamType}, {
                            async: false,
                            success: function (status, xmlDoc) {
                                bRet = _oUtils.nodeValue(xmlDoc, "enabled", "b");
                            }
                        });
                        
                        $scope.oVideoParams.bEnableRegCrop = bRet;
                        return bRet;
					}
				});
			angular.bootstrap(angular.element("#video"), ["videoApp"]);
		}
	};

	module.exports = new Video();
});