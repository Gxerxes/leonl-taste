/**
 * Created by chenxiangzhen on 2014/7/30.
 */
define(function(require, exports, module){
	var $ = require("jquery");
	var _oPlugin = require("common/plugin");

	require("ui.menu");

	var _oCommon = require("common");
	var _oTranslator = require("translator");
	var _oService = require("config/service");
	var _oDevice = require("isapi/device");
	require("config/ui.config");
	var _oChannelsCap = require("isapi/channelsCap");
	var _oDialog = require("dialog");

	module.exports = {
		init: function (szID) {
			_oService.init();
			_oDevice.getIntelliSupport();
            _oDevice.getVCAResource();
			_oDevice.getVehicleCap();
			_oDevice.getSecurityService();
			_oDevice.getAuthSupport();
			_oDevice.getTalkInfo();
            _oDevice.getTrafficCap(1);  //前端取证，暂时写死通道1

			var self = this;
			var _oCurModule = null;
			var oMenuApp = angular.module("menuApp", ["ui.config"]);

			oMenuApp.controller("menuController", ["$scope", function ($scope) {
				$scope.supportPTZ = _oDevice.m_oDeviceCapa.bPTZ;
                $scope.bSupportIntelligent = _oDevice.m_oDeviceCapa.bSupportIntelligent;
                $scope.bSupportPeopleCount = _oDevice.m_oDeviceCapa.bSupportPeopleCount;
                $scope.bSupportVehicle = _oDevice.m_oDeviceCapa.oSupportVehicle.HVTVehicle || _oDevice.m_oDeviceCapa.oSupportVehicle.vehicle;
                $scope.bSupportTraffic = _oDevice.m_oDeviceCapa.oVCAResourceType == 'TFS' || (_oDevice.m_oDeviceCapa.oSupportTraffic.bSupport && _oDevice.m_oDeviceCapa.oVCAResourceType == "");
                $scope.bSupportTrafficVehicle = _oDevice.m_oDeviceCapa.oSupportTraffic.bSupportVCR;
				$scope.oMenuLan = _oTranslator.oLastLanguage;

				$scope.oChannelId = {iChannlId: _oService.m_iChannelId};
				$scope.iAnalogChannelNum = 0;
				$scope.oDigital = [];
				$scope.oAnalogId = [];
				$scope.oCapbilities = {
					bSupportAnalog: _oDevice.m_oDeviceCapa.bSupportAnalogChan,
					bSupportDigital: _oDevice.m_oDeviceCapa.bSupportDigitalChan,
					bSupportSmart: (_oDevice.m_oDeviceCapa.bSupportAudioDection || _oDevice.m_oDeviceCapa.bSupportDefousDection
						|| _oDevice.m_oDeviceCapa.bSupportSceneChangeDetection || _oDevice.m_oDeviceCapa.bSupportFaceDect || _oDevice.m_oDeviceCapa.bSupportLineDection
						|| _oDevice.m_oDeviceCapa.bSupportFieldDection || _oDevice.m_oDeviceCapa.bSupportRegionEntrance || _oDevice.m_oDeviceCapa.bSupportRegionExit
						|| _oDevice.m_oDeviceCapa.bSupportLoiter || _oDevice.m_oDeviceCapa.bSupportGroup || _oDevice.m_oDeviceCapa.bSupportRapidMove
						|| _oDevice.m_oDeviceCapa.bSupportPark || _oDevice.m_oDeviceCapa.bSupportUnattendedBaggage || _oDevice.m_oDeviceCapa.bSupportAttendedBaggage)
				};
				$scope.bSupportPlatform = _oDevice.m_oDeviceCapa.bSupportPlatformAccess || _oDevice.m_oDeviceCapa.bSupportPlatformNMSAccess
					|| _oDevice.m_oDeviceCapa.bSupportPlatformReset || _oDevice.m_oDeviceCapa.bSupportPlatformVBS
				$scope.bSupportHeatmapCfg = _oDevice.m_oDeviceCapa.bSupportHeatmap;
				$scope.bSupportSecurity = _oDevice.m_oDeviceCapa.bSupportIPFilter || _oDevice.m_oDeviceCapa.oSupportAuth.bRtsp || _oDevice.m_oDeviceCapa.oSupportAuth.bWeb
					|| _oDevice.m_oDeviceCapa.bSupportTelnet || _oDevice.m_oDeviceCapa.bSupportSSH;
				$scope.bSupportStorageAdvanced = _oDevice.m_oDeviceCapa.bSupportTalkset || _oDevice.m_oDeviceCapa.bSupportHoliday || _oDevice.m_oDeviceCapa.bSupportExtHdCfg || _oDevice.m_oDeviceCapa.bSupportPnp;
				$scope.bChromeNotSupportNpapi = _oService.m_bChromeNotSupportNpapi;
				if($.cookie("sdMarkMenu") && $.cookie("sdMarkMenu").indexOf('VCA') >= 0) {
					_oDevice.getVCAResource();
                    _intellgentChannels();
					if($scope.oAnalogId.length == 0 && $scope.oDigital.length == 0) {
						$.cookie("sdMarkMenu", '0:local');
					}
				}
				$scope.menuLoaded = function () {
					$("#" + szID).children("div:first").Menu({
						defaultMenu: "1",
						onselect: function (szPage) {
							var aPage = szPage.split(".");// 字符串中有.号的话，需要分割处理
							var szDir = "";// 目录
							var szFile = "";// 文件
							var iMenuLevel = aPage.length;
							if (iMenuLevel > 1) {
								for (var i = 0; i < aPage.length - 1; i++) {
									szDir += aPage[i] + "/";
								}
							} else {
								szDir = aPage[0] + "/";
							}
							szFile = aPage[aPage.length - 1];
							$.get("config/" + szDir + szFile + ".asp", function (szHtml) {
								$("#view").html(szHtml);

								require.async("config/" + szDir + szFile, function (oModule) {
									if (oModule) {
										_oCurModule = oModule;
										oModule.init();
									}
								});
							});
						},
						onunload: function() { //卸载页面调用
							if (_oCurModule) {
								if (_oCurModule.unload) {
									_oCurModule.unload();
								}

								// 页面中如果有视频，离开时需要关闭视频
								try {
									_oPlugin.stop();
									_oPlugin.removePlugin();
								} catch (e) {}

								_oCurModule = null;
							}
						}
					});
				};
				//添加场景
				$scope.addScene = function (event) {
					//获取当前第一个隐藏的场景
					var oCur = $(event.currentTarget).parent().find("div.menu:hidden").eq(0), bResult;
//					if (oCur.hasClass("menu-select")) {
//						//获取当前通道，向对应通道设备添加场景
//						bResult = _oChannelsCap.addScene(_oService.m_iChannelId, oCur.parent().index());
//					} else {
//						bResult = _oChannelsCap.addScene(_oService.m_iChannelId, oCur.index());
//					}
                    //bResult && oCur.show().click();
                    if (oCur.hasClass("menu-select")) {
                        bResult = _oChannelsCap.addScene(_oService.m_iChannelId, oCur.parent().index());
                    } else {
                        bResult = _oChannelsCap.addScene(_oService.m_iChannelId, oCur.index());
                    }
                    setTimeout(function(){
                        bResult && oCur.show().click();
                    }, 10);
				};
				//删除场景
				$scope.deleteScene = function (event) {
					var oCur = $(event.currentTarget).parent(), bResult;
					event.stopPropagation();
					if (oCur.hasClass("menu-select")) {
						//获取当前通道，向对应通道设备添加场景
						bResult = _oChannelsCap.delScene(_oService.m_iChannelId, oCur.parent().index());
					} else {
						bResult = _oChannelsCap.delScene(_oService.m_iChannelId, oCur.index());
					}
					//成功后隐藏
					//bResult && oCur.hide();
                    setTimeout(function(){
                        bResult && oCur.hide();
                        oCur.closest(".menu-2").find(".menu-3:visible").not(".cannot-select").eq(0).click().length > 0 || $("div[name=VCA] .menu-2:visible").eq(0).click();
                    }, 10);
				};
				$scope.mouseenter = function (event) {
					var oCur = $(event.currentTarget);
					oCur.find(".delete").show();
				};
				$scope.mouseleave = function (event) {
					var oCur = $(event.currentTarget);
					oCur.find(".delete").hide();
				};
				$scope.getVCAChannel = function(event) {
					if($("#vcachannel:visible").length == 0) {
						_oService.init();
						_intellgentChannels();
                        _oDevice.getVCAResource();
						if($scope.oAnalogId.length == 0 && $scope.oDigital.length == 0) {
							_oDialog.alert(_oTranslator.getValue('noVCAChannelSupport'));
							$("div[name='VCA']").addClass("cannot-select");
							event.preventDefault();
							event.stopPropagation();
							return false;
						} else {
							$("div[name='VCA']").removeClass("cannot-select");
						}
					}
				};

                $scope.getTrafficScenes = function() {
                    $scope.aSceneNum = new Array(16);
                };

                $scope.getSceneName = function(szName, iSceneId) {
                    return szName ? szName : _oTranslator.getValue("SceneDefault") + iSceneId;
                };
				
				//通道切换后进行能力的获取
				$scope.$watch("oChannelId.iChannlId", function (newChannel, from) {
					if (newChannel > 0) {
						//切换service中通道
						_oService.m_iChannelId = newChannel;
						_oChannelsCap.getChannelCap(newChannel, "VCAINTELLICAP");	//获取专业智能通道能力
						_oChannelsCap.getChannelCap(newChannel, "VCAINTELLISCENES");	//获取场景
						_oChannelsCap.getChannelCap(newChannel, "VCAINTELLIRESOURCE");	//获取智能类型，用于隐藏对应目录
						//_oChannelsCap.getChannelCap(newChannel, "VCAINTELLICAP");	//获取智能类型能力，用于智能信息的显示和隐藏
						_oChannelsCap.getChannelCap(newChannel, "VCAINTELLICALIBRATION");	//获取标定能力
						_oChannelsCap.getChannelCap(newChannel, "PTZ");	//获取PTZ能力，用于显示智能跟踪
						_oChannelsCap.getChannelCap(newChannel, "VCAGLOBALFILTER");	//获取全局尺寸过滤能力，显示隐藏对应目录
						_oChannelsCap.getChannelCap(newChannel, "VCAINTELLISHIELD");	//获取屏蔽区域能力
						_oChannelsCap.getChannelCap(newChannel, "VCAINTELLILIBVER");	//获取专业智能叠加与抓图能力
						$scope.sceneInfo = _oChannelsCap.channelsInfo[newChannel];	//获取能力后赋值到scope
						_getIntelliMenuCap();
						if($scope.sceneInfo['VCAINTELLISCENES'].iSceneNum > 1) {
							//设备写死了1，暂时不用考虑了
						}
						//初始化时不进行跳转
						if(from && newChannel != from) {
							$(".menu-2:visible").eq($scope.sceneInfo["VCAINTELLICAP"]["arrIntelliCap"].length > 1 ? 0 : 1).click();
                            setTimeout(function(){
                                angular.element(".menu-1[name='VCA']").find(".menu-2").not(".cannot-select").eq(0).click();
                                try {
                                    if(angular.element("#VCAResource").length > 0) {
                                        angular.element("#VCAResource").scope().init();
                                    } else if (angular.element("#VCAVideoPicOverlay").length > 0) {
                                        angular.element("#VCAVideoPicOverlay").scope().init();
                                    }
                                } catch(e){}
                            }, 10);
						//初始化不支持
						}
					}
				});
				//获取专业智能通道能力，没有能力的通道就不显示了
				function _intellgentChannels() {
					_oChannelsCap.getChannelsList({oAnalogId: $scope.oAnalogId, oDigital: $scope.oDigital, iAnalogChannelNum: $scope.iAnalogChannelNum});
					if($scope.oAnalogId.length == 0 && $scope.oDigital.length == 0) {
						$scope.oChannelId.iChannlId = 0;
						$scope.iAnalogChannelNum = 0;
					} else if($scope.oAnalogId.length == 0) {
						$scope.oChannelId.iChannlId = _oService.m_iChannelId;
						$scope.iAnalogChannelNum = 0;
					} else {
						$scope.oChannelId.iChannlId = _oService.m_iChannelId;
						$scope.iAnalogChannelNum = $scope.oAnalogId.length;
					}
					//修改模拟通道数目获取不正确问题
					$scope.iAnalogChannelNum = _oService.m_iAnalogChannelNum;
				}
				$scope.intelliMenuUpdate = function(){
					$scope.$apply(_getIntelliMenuCap);
				};
				//专业智能显示判断，放在page上太长，太难看了，提取出来
				function _getIntelliMenuCap() {
					$scope.bIntellResource = false;
					$scope.bIntelliOverlay = false;
					$scope.bIntelliTrack = false;
					$scope.bIntelliShield = false;
					$scope.bIntelliCalibration = false;
					$scope.bIntelliMultiScene = false;
					$scope.bIntelliSingleScene = false;
					$scope.bIntelliPatrol = false;
					$scope.bIntelliFaceRule = false;
					$scope.bIntelliFaceParam = false;
					$scope.bIntelliAdvancedParam = false;
					if($scope.sceneInfo['VCAINTELLICAP'].arrIntelliCap.length == 0) {
						return;
					}
                    var oVCAMenu = angular.element(".menu-1[name='VCA']");
					$scope.bIntellResource = $scope.sceneInfo['VCAINTELLICAP'].arrIntelliCap.length > 1 && _oDevice.m_oDeviceCapa.oVCAResourceType == "";
					$scope.bIntelliOverlay = $scope.sceneInfo['VCAINTELLILIBVER'].bSupport;
					$scope.bIntelliTrack = $scope.sceneInfo['VCAINTELLISCENES'].iSceneNum >= 1 && $scope.sceneInfo['VCAINTELLIRESOURCE'] != 'face';/*$scope.sceneInfo['PTZ'] && $scope.sceneInfo['VCAINTELLICAP'].arrIntelliCap.length > 0 && $scope.sceneInfo['VCAINTELLIRESOURCE'] != 'face'*/
					$scope.bIntelliShield = ($scope.sceneInfo['VCAINTELLISCENES'].iSceneNum == 0 || $scope.sceneInfo['VCAINTELLIRESOURCE'] == 'face') && $scope.sceneInfo['VCAINTELLISHIELD'];
					$scope.bIntelliCalibration = $scope.sceneInfo['VCAINTELLICALIBRATION'] != null;
					$scope.bIntelliMultiScene = $scope.sceneInfo['VCAINTELLISCENES'].iSceneNum > 1 && $scope.sceneInfo['VCAINTELLIRESOURCE'] != 'face';
					$scope.bIntelliPatrol = $scope.sceneInfo['VCAINTELLISCENES'].iSceneNum > 1 && $scope.sceneInfo['VCAINTELLIRESOURCE'] != 'face';
					$scope.bIntelliSingleScene = ($scope.sceneInfo['VCAINTELLISCENES'].iSceneNum == 1 && $scope.sceneInfo['VCAINTELLIRESOURCE'] != 'face') || ($scope.sceneInfo['VCAINTELLISCENES'].iSceneNum == 0 && $scope.sceneInfo['VCAINTELLIRESOURCE'] == 'behavior');
					$scope.bIntelliFaceRule = $scope.sceneInfo['VCAINTELLIRESOURCE'] == 'face';
					$scope.bIntelliFaceParam = $scope.sceneInfo['VCAADVANCEDPARAMS'] && $scope.sceneInfo['VCAINTELLIRESOURCE'] == 'behaviorandface';
					$scope.bIntelliAdvancedParam = $scope.sceneInfo['VCAADVANCEDPARAMS'] || ($scope.sceneInfo['VCAINTELLILIBVER'].FaceVer != '' || $scope.sceneInfo['VCAINTELLILIBVER'].BehaviorVer != '');
                    setTimeout(function(){
                        if(oVCAMenu.find(".menu-select").length == 1) {
                            if(oVCAMenu.find(".menu-select").hasClass("cannot-select")) {
                                oVCAMenu.find(".menu-2").not(".cannot-select").eq(0).click();
                            }
                        }
                    }, 10);
				}
			}]);

			angular.bootstrap(angular.element("#" + szID), ["menuApp"]);
		}
	};
});