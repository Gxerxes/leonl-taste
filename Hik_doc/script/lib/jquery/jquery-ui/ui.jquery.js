angular.module("ui.jquery", ["ui.jquery.tabs", "ui.jquery.slider", "ui.jquery.popMenu", "ui.jquery.popSound", "ui.jquery.popTransCode", "ui.jquery.date", "ui.jquery.stream"]);

angular.module("ui.jquery.tabs", [])
	.directive("tabs", function () {
		 return {
			 restrict: "A",
			 scope: {
				active: "&?",
				hide: "&?",
				show: "&?",

				activate: "&?",
				beforeActivate: "&?",
				beforeLoad: "&?",
				load: "&?"
			 },
			 link: function (scope, element, attrs) {
				var oTabs = angular.element(element).tabs({
					active: scope.active || null,
					hide: scope.hide || null,
					show: scope.show || null,
					activate: scope.activate || null,
					beforeActivate: scope.beforeActivate || null,
					beforeLoad: scope.beforeLoad || null,
					load: scope.load || null
				});
			 }
		 }
	});
/***********example************
<div current-value="ptzSpeed" on-down="test" on-move="test1" on-up="test2" show-box="true" step="1" min="1" max="7" slider></div>
$scope.test = function () {

}
$scope.test1 = function () {
	$scope.ptzSpeed = this.getValue();
}
$scope.test2 = function () {

}
$scope.ptzSpeed = 4;
********/
angular.module("ui.jquery.slider", [])
	.directive("slider", function () {
		return {
			restrict: "EA",
			scope: {
				type: "@",
				showBox: "@",
				min: "@",
				max: "@",
				step: "@",
				sliderClass: "@",
				hoverClass: "@",
				barClass: "@",
				boxClass: "@",
				onDown: "=",
				onMove: "=",
				onUp: "=",
				currentValue: "=",
				tip: "="
			},
			link: function (scope, element, attrs) {
				var oSlider;
				var fEndCall = function () {
					scope.currentValue = oSlider.getValue();
					//更新父scope的双向绑定的变量
					if (!scope.$parent.$$phase) {
						scope.$parent.$apply();
					}
					if (angular.isFunction(scope.onUp)) {
						scope.onUp.call(this);
					}
				};
				oSlider = angular.element(element).slider({
					type: scope.type || "slider",
					showBox: scope.showBox ? scope.showBox === "true" : false,
					min: scope.min ? parseInt(scope.min, 10) : 0,
					max: scope.max ? parseInt(scope.max, 10) : 100,
					step: scope.step ? parseInt(scope.step, 10) : 1,
					sliderCss: scope.sliderClass || "slider",
					hoverCss: scope.hoverClass || "sliderhover",
					barCss: scope.barClass || "sliderbar",
					boxCss: scope.boxClass || "sliderbox",
					onstart: scope.onDown || null,
					onchange: scope.onMove || null,
					onend: fEndCall
				});
				//监听数值变化
				scope.$watch("currentValue", function (newVal) {
					if (angular.isDefined(newVal)) {
						oSlider.setValue(newVal);
						if (angular.isDefined(scope.tip)) {
							oSlider.setTitle(scope.tip + ":" + newVal);
						}
					}
				});
				//监听最小值变化
				scope.$watch("min", function(newVal) {
					if (angular.isDefined(newVal)) {
						oSlider.setMinMax(parseInt(newVal, 10), parseInt(scope.max, 10));
						oSlider.setValue(scope.currentValue);
					}
				});
				//监听最大值变化
				scope.$watch("max", function(newVal) {
					if (angular.isDefined(newVal)) {
						oSlider.setMinMax(parseInt(scope.min, 10), parseInt(newVal, 10));
						oSlider.setValue(scope.currentValue);
					}
				});
			}
		}
	});

/** example:
 * 	<button id="btn_wnd_split" class="btn" type="button"><i class="icon-wnd-4"></i><i class="icon-sel"></i></button>
 * 	<span pop-menu target-id="btn_wnd_split" on-menu-change="onWndSplit"></span>
 * 	$scope.onWndSplit = function (iWndSplit) {
 *		// to do sth
 *	}
 */
angular.module("ui.jquery.popMenu", [])
	.controller('popMenuController', function ($scope) {
		$scope.modeChange = function (iMode) {
			if ($scope.onMenuChange) {
				$scope.onMenuChange(iMode);
				if($scope.type === "5") {
					$(".pop-menu, .iframe-menu").hide();
				}
			}
		};

		this.showPopMenu = function (bShow) {
			if (bShow) {
				$(".pop-menu").hide();
				$("#pop_menu_" + $scope.type + ", #iframe_menu_" + $scope.type).css({
					left: $("#" + $scope.targetId).offset().left,
					top: $("#" + $scope.targetId).offset().top + $("#" + $scope.targetId).outerHeight()
				}).show();
			} else {
				$("#pop_menu_" + $scope.type + ", #iframe_menu_" + $scope.type).hide();
			}

			$("#iframe_menu_" + $scope.type).css({
				width: $("#pop_menu_" + $scope.type).outerWidth(),
				height: $("#pop_menu_" + $scope.type).outerHeight()
			});
		};
	})
	.directive("popMenu", function ($compile, $document) {
		return {
			restrict: "A",
			scope: {
				targetId: "@",
				onMenuChange: "=",
				type: "@",
                num: "=",
				lan: "="
			},
			require: 'popMenu',
			controller: 'popMenuController',
			link: function (scope, element, attrs, ctrls) {
				var iStartIndex = navigator.appVersion.indexOf("Chrome/");
				var iChromeVersion = parseInt(navigator.appVersion.substring(iStartIndex+7, iStartIndex+9), 10);
				var bChromeNotSupportNpapi = (iChromeVersion > 41);
				if(scope.type === "1") {
					var szTemplate = 
						'<div id="pop_menu_1" class="pop-menu">' +
							'<button class="btn" type="button" ng-click="modeChange(1)" title="1x1"><i class="icon-wnd-1"></i></button>' +
							'<button class="btn" type="button" ng-click="modeChange(2)" title="2x2"><i class="icon-wnd-2"></i></button>' +
							'<button class="btn" type="button" ng-click="modeChange(3)" title="3x3"><i class="icon-wnd-3"></i></button>' +
							'<button class="btn" type="button" ng-click="modeChange(4)" title="4x4"><i class="icon-wnd-4"></i></button>' +
						'</div>' +
						'<iframe id="iframe_menu_1" class="iframe-menu" scrolling="no" frameborder="0"></iframe>';
				} else if(scope.type === "2") {
					var szTemplate = 
						'<div id="pop_menu_2" class="pop-menu">' +
							'<button class="btn" type="button" ng-click="modeChange(1)" title="' + scope.lan.mainStream + '"><i class="icon-stream-1"></i></button>' +
							'<button class="btn" type="button" ng-click="modeChange(2)" title="' + scope.lan.subStream + '"><i class="icon-stream-2"></i></button>';
					if(scope.num === 3) {
						szTemplate += '<button class="btn" type="button" ng-click="modeChange(3)" title="' + scope.lan.thirdStream + '"><i class="icon-stream-3"></i></button>';
					} else if (scope.num === 4) {
						szTemplate += '<button class="btn" type="button" ng-click="modeChange(3)" title="' + scope.lan.transcodedStream + '"><i class="icon-stream-3"></i></button>';
					}
					szTemplate +=	'</div>' +
						'<iframe id="iframe_menu_2" class="iframe-menu" scrolling="no" frameborder="0"></iframe>';
				} else if(scope.type === "3") {
					var szTemplate =
						'<div id="pop_menu_3" class="pop-menu">' +
							'<button class="btn" type="button" ng-click="modeChange(1)" title="4:3"><i class="icon-size-1"></i></button>' +
							'<button class="btn" type="button" ng-click="modeChange(2)" title="16:9"><i class="icon-size-2"></i></button>' +
							'<button class="btn" type="button" ng-click="modeChange(3)" title="' + scope.lan.original + '"><i class="icon-size-3"></i></button>' +
							'<button class="btn" type="button" ng-click="modeChange(4)" title="' + scope.lan.auto + '"><i class="icon-size-4"></i></button>' +
						'</div>' +
						'<iframe id="iframe_menu_3" class="iframe-menu" scrolling="no" frameborder="0"></iframe>';
				} else if(scope.type === "4") {
                    var szTemplate = '<div id="pop_menu_4" class="pop-menu">';
                    szTemplate += '<button class="btn" type="button" ng-click="modeChange(4)"><i class="icon-plugin-4" title="Webcomponents"></i></button>';
					if(!bChromeNotSupportNpapi) {
                        szTemplate += '<button class="btn" type="button" ng-click="modeChange(1)"><i class="icon-plugin-1" title="QuickTime"></i></button>';
					}
                    if(!$.browser.msie) {
						if(!bChromeNotSupportNpapi) {
                            szTemplate += '<button class="btn" type="button" ng-click="modeChange(2)"><i class="icon-plugin-2" title="VLC"></i></button>';
						}
                        szTemplate += '<button class="btn" type="button" ng-click="modeChange(3)"><i class="icon-plugin-3" title="MJPEG"></i></button>';
                    }
                    szTemplate += '</div><iframe id="iframe_menu_4" class="iframe-menu" scrolling="no" frameborder="0"></iframe>';
                } else if(scope.type === "5") {
                    var szTemplate = '<div id="pop_menu_5" class="pop-menu">';
                    for (var i = 0; i < parseInt(scope.num, 10); i++) {
	                    var szTips = scope.lan.talkChannel + " " + (i+1);
                        szTemplate += '<button class="btn" title="' + szTips + '" type="button" ng-click="modeChange(' + (i+1) + ')"><i class="icon-talk-' + (i+1) + '"></i></button>';
                    }
                    szTemplate += '</div><iframe id="iframe_menu_5" class="iframe-menu" scrolling="no" frameborder="0"></iframe>';
                }
				var $element = $compile(szTemplate)(scope);
				$document.find('body').append($element);

				$("#" + scope.targetId).click(function (e) {
					if($("#" + scope.targetId).find("i").eq(0).hasClass("on")) {
						scope.onMenuChange(0);
					} else {
						ctrls.showPopMenu(true);
					}
					e.stopPropagation();
				});

				$("#pop_menu_" + scope.type).click(function (e) {
					e.stopPropagation();
				});

				$document.on("click", function (e) {
					ctrls.showPopMenu(false);
				});

				$(window).on("resize", function () {
					$(".pop-menu, .iframe-menu").hide();
				});
			}
		}
	});

/** example:
 *	<button id="btn_sound" class="btn" type="button" ng-disabled="oBtnDisabled.bSound"><i ng-class="{true:'icon-sound on', false:'icon-sound'}[oBtnClass.bSound]"></i><i class="icon-sel"></i></button>
 *	<span pop-sound target-id="btn_sound" on-change-sound="onChangeSound" on-open-sound="onOpenSound"></span>
 * 	$scope.onChangeSound = function () {
 *		// to do sth
 *	}
 *	$scope.onOpenSound = function () {
 *		// to do sth
 *	}
 */
angular.module("ui.jquery.popSound", [])
	.controller('popSoundController', function ($scope) {
		var _iVolume = 0;
		$scope.bSound = $scope.sound;

		$scope.changeSound = function () {
			_iVolume = this.getValue();
			if ($scope.bSound && 0 == _iVolume) {// 声音打开着，滑块移动到 0，自动关闭声音
				$scope.bSound = false;
				if ($scope.onOpenSound) {
					$scope.onOpenSound();
				}
			} else if (!$scope.bSound && _iVolume > 0) {// 声音关闭着，滑块移动大于 0，自动开启声音
				$scope.bSound = true;
				if ($scope.onOpenSound) {
					if ($scope.bSound) {// 如果是开启，判断返回值
						if (!$scope.onOpenSound()) {// 开启声音失败
							_iVolume = 0;
							$scope.oSlider.setValue(_iVolume);
							$scope.bSound = false;
						}
					} else {
						$scope.onOpenSound();
					}
				}
			}
			$scope.oSlider.setTitle(_iVolume);
			if ($scope.onChangeSound) {// 调整声音音量
				$scope.onChangeSound(_iVolume);
			}
			$scope.$apply();
		};
		$scope.openSound = function () {
			$scope.bSound = !$scope.bSound;
			if (!$scope.bSound) {// 点击滑块前面的按钮，如果是关闭，滑块设置为 0
				$scope.oSlider.setValue(0);
				$scope.oSlider.setTitle(0);
			}
			if ($scope.onOpenSound) {
				if ($scope.bSound) {// 如果是开启，判断返回值
					if (!$scope.onOpenSound()) {// 开启声音失败
						_iVolume = 0;
						$scope.oSlider.setValue(_iVolume);
						$scope.oSlider.setTitle(_iVolume);
						$scope.bSound = false;
					} else {
						if ($scope.onChangeSound) {// 调整声音音量
							_iVolume = 50;
							$scope.oSlider.setValue(_iVolume);
							$scope.oSlider.setTitle(_iVolume);
							$scope.onChangeSound(_iVolume);
						}
					}
				} else {
					$scope.onOpenSound();
				}
			}
		};
		$scope.$watch("sound", function (to, from) {
			$scope.bSound = to;
			if (!$scope.bSound) {// 关闭回放，同时会关闭声音，滑块设置为 0
				$scope.oSlider.setValue(0);
				$scope.oSlider.setTitle(0);
			} else {
				$scope.oSlider.setValue(_iVolume);
				$scope.oSlider.setTitle(_iVolume);
			}
		});

		this.showPopSound = function (bShow) {
			var iWinWidth = $(window).width(),
				iPopWidth = $("#pop_sound").outerWidth(),
				iLeft = $("#" + $scope.targetId).offset().left;


			// 如果弹出层靠近浏览器右边框，可能显示不全，需要调整位置
			if (iLeft + iPopWidth > iWinWidth) {
				iLeft = iWinWidth - iPopWidth - 10;
			}

			if (bShow) {
				$("#pop_sound, #iframe_sound").css({
					left: iLeft,
					top: $("#" + $scope.targetId).offset().top + $("#" + $scope.targetId).outerHeight()
				}).show();
			} else {
				$("#pop_sound, #iframe_sound").css({
					left: iLeft,
					top: $("#" + $scope.targetId).offset().top + $("#" + $scope.targetId).outerHeight()
				}).hide();
			}

			$("#iframe_sound").css({
				width: $("#pop_sound").outerWidth(),
				height: $("#pop_sound").outerHeight()
			});
		};
	})
	.directive("popSound", function ($document) {
		return {
			restrict: "A",
			scope: {
				targetId: "@",
				width: "@",
				sound: "=",
				onChangeSound: "=",
				onOpenSound: "="
			},
			template: '<div id="pop_sound" class="pop-sound">' +
							'<i ng-class="{true:\'icon-sound on\', false:\'icon-sound\'}[bSound]" ng-click="openSound()"></i>' +
							'<div id="pop_sound_slider"></div>' +
						'</div>' +
						'<iframe id="iframe_sound" class="iframe-sound" scrolling="no" frameborder="0"></iframe>',
			require: 'popSound',
			controller: 'popSoundController',
			link: function (scope, element, attrs, ctrls) {
				$document.find('body').append(element);

				$("#pop_sound, #iframe_sound").css({
					width: scope.width ? parseInt(scope.width, 10) : 120
				});
				$("#pop_sound_slider").css({
					width: $("#pop_sound").width() - 30,
					marginTop: 3,
					marginLeft: 25
				});

				scope.oSlider = $("#pop_sound_slider").slider({
					showBox: scope.showBox ? scope.showBox === "true" : false,
					min: scope.min ? parseInt(scope.min, 10) : 0,
					max: scope.max ? parseInt(scope.max, 10) : 100,
					step: scope.step ? parseInt(scope.step, 10) : 1,
					sliderCss: scope.sliderClass || "slider",
					hoverCss: scope.hoverClass || "sliderhover",
					barCss: scope.barClass || "sliderbar",
					boxCss: scope.boxClass || "sliderbox",
					onstart: scope.onDown || null,
					onchange: scope.onMove || null,
					onend: scope.changeSound || null
				});

				$("#pop_sound").click(function (e) {
					e.stopPropagation();
				});

				$("#" + scope.targetId).click(function (e) {
					ctrls.showPopSound(true);

					e.stopPropagation();
				});

				$document.on("click", function (e) {
					ctrls.showPopSound(false);
				});
				$(window).on("resize", function () {
					$("#pop_sound, #iframe_sound").hide();
				});
			}
		}
	});

/** example:
 * <button id="btn_trans_code" class="btn" type="button" ng-show="oBtnShow.bTranscoding"><i ng-class="{true:'icon-transcoding on', false:'icon-transcoding'}[oBtnClass.bTranscoding]"></i><i class="icon-sel"></i></button>
 * <span pop-trans-code target-id="btn_trans_code" on-open-trans-code="onOpenTransCode" on-change-trans-code="onChangeTransCode" trans-code="oBtnClass.bTranscoding" trans-code-resolution="aTransCodeResolution" lan="oLanTool"></span>
 *	$scope.onOpenTransCode = function () {
 *		// to do sth
 *	}
 *	$scope.onChangeTransCode = function () {
 *		// to do sth
 *	}
 */
angular.module("ui.jquery.popTransCode", [])
	.controller('popTransCodeController', function ($scope) {
		$scope.iTransCodeResolution = 255;
		$scope.iTransCodeBitrate = 23;
		$scope.iTransCodeFrame = 0;

		$scope.changeTransCode = function () {
			if ($scope.onChangeTransCode) {
				$scope.onChangeTransCode($scope.iTransCodeResolution, $scope.iTransCodeBitrate, $scope.iTransCodeFrame);
			}
		};

		this.showPopTransCode = function (bShow) {
			if (bShow) {
				$("#pop_trans_code, #iframe_trans_code").css({
					left: $("#" + $scope.targetId).offset().left,
					top: $("#" + $scope.targetId).offset().top + $("#" + $scope.targetId).outerHeight()
				}).show();
			} else {
				$("#pop_trans_code, #iframe_trans_code").css({
					left: $("#" + $scope.targetId).offset().left,
					top: $("#" + $scope.targetId).offset().top + $("#" + $scope.targetId).outerHeight()
				}).hide();
			}

			$("#iframe_trans_code").css({
				width: $("#pop_trans_code").outerWidth(),
				height: $("#pop_trans_code").outerHeight()
			});
		};
	})
	.directive("popTransCode", function ($compile, $document) {
		return {
			restrict: "A",
			scope: {
				targetId: "@",
				onOpenTransCode: "=",
				onChangeTransCode: "=",
				lan: "=",
				transCode: "=",
				transCodeResolution: "="
			},
			require: 'popTransCode',
			controller: 'popTransCodeController',
			link: function (scope, element, attrs, ctrls) {
				var szTemplate = '<div id="pop_trans_code" class="pop-trans-code">' +
						'<table cellpadding="0" cellspacing="5" border="0">' +
						'<tr>' +
						'<td ng-bind="lan.resolution"></td>' +
						'<td><select class="select" ng-model="iTransCodeResolution" ng-change="changeTransCode()">';

					var oResolution = {"255": scope.lan.auto, "1": "CIF", "2": "QCIF", "3": "4CIF"};
					if (scope.transCodeResolution) {// 协议请求失败，该变量可能未定义
						$.each(scope.transCodeResolution, function () {
							szTemplate += '<option value="' + this + '">' + oResolution[this] + '</option>';
						});
						scope.iTransCodeResolution = scope.transCodeResolution[0];
					}

					szTemplate += '</select></td>' +
						'</tr>' +
						'<tr>' +
						'<td ng-bind="lan.bitRate"></td>' +
						'<td><select class="select" ng-model="iTransCodeBitrate" ng-change="changeTransCode()">' +
						'<option value="2">32K</option>' +
						'<option value="3">48K</option>' +
						'<option value="4">64K</option>' +
						'<option value="5">80K</option>' +
						'<option value="6">96K</option>' +
						'<option value="7">128K</option>' +
						'<option value="8">160K</option>' +
						'<option value="9">192K</option>' +
						'<option value="10">224K</option>' +
						'<option value="11">256K</option>' +
						'<option value="12">320K</option>' +
						'<option value="13">384K</option>' +
						'<option value="14">448K</option>' +
						'<option value="15">512K</option>' +
						'<option value="16">640K</option>' +
						'<option value="17">768K</option>' +
						'<option value="18">896K</option>' +
						'<option value="19">1024K</option>' +
						'<option value="20">1280K</option>' +
						'<option value="21">1536K</option>' +
						'<option value="22">1792K</option>' +
						'<option value="23">2048K</option>' +
						'<option value="24">3072K</option>' +
						'<option value="25">4096K</option>' +
						'<option value="26">8192K</option>' +
						'</select></td>' +
						'</tr>' +
						'<tr>' +
						'<td ng-bind="lan.frameRate"></td>' +
						'<td><select class="select" ng-model="iTransCodeFrame" ng-change="changeTransCode()">' +
						'<option value="0" ng-bind="lan.fullFrameRate"></option>' +
						'<option value="5">1</option>' +
						'<option value="6">2</option>' +
						'<option value="7">4</option>' +
						'<option value="8">6</option>' +
						'<option value="9">8</option>' +
						'<option value="10">10</option>' +
						'<option value="11">12</option>' +
						'<option value="12">16</option>' +
						'<option value="14">15</option>' +
						'<option value="15">18</option>' +
						'<option value="13">20</option>' +
						'<option value="16">22</option>' +
						'</select></td>' +
						'</tr>' +
						'</table>' +
						'</div>' +
						'<iframe id="iframe_trans_code" class="iframe-trans-code" scrolling="no" frameborder="0"></iframe>';

				var $element = $compile(szTemplate)(scope);
				$document.find('body').append($element);

				$("#" + scope.targetId).click(function (e) {
					e.stopPropagation();

					if (scope.onOpenTransCode) {
						if (scope.onOpenTransCode()) {
							ctrls.showPopTransCode(true);
						}
					}
				});

				$("#" + scope.targetId).mouseover(function () {
					if (scope.transCode) {
						ctrls.showPopTransCode(true);
					}
				});

				$("#pop_trans_code").click(function (e) {
					e.stopPropagation();
				});

				$document.on("click", function (e) {
					ctrls.showPopTransCode(false);
				});
				$(window).on("resize", function () {
					$("#pop_trans_code, #iframe_trans_code").hide();
				});
			}
		}
	});
angular.module("ui.jquery.date", [])
	.directive("date", function () {
		return {
			restrict: "A",
			scope: {
				onPicked: "=",
				dpModel: "=",
				dpDisabled: "=",
				mode: "@"

			},
			link: function (scope, element, attrs) {
				var szLan = $.cookie("language");
				if (szLan === null) {
					szLan = "en";
				}
				
				if ("zh" === szLan) {
					szLan = "zh-cn";
				} else if ("zh_TW" === szLan) {
					szLan = "zh-tw";
				}

				var fOnPicked = function () {
					var self = this;
					//view -> model
					scope.$apply(function() {
						scope.dpModel = self.value;
					});
					if (angular.isFunction(scope.onPicked)) {
						scope.onPicked.call(self);
					}
				};
				element.bind("click", function () {
					//点击确定后需要调两次才能弹出日历
					if(scope.mode === "1") {
						WdatePicker({
							startDate: '%y-%M-%d',
							dateFmt: 'yyyy-MM-dd',
							alwaysUseStartDate: false,
							minDate: '1970-01-01 00:00:00',
							maxDate: '2037-12-31 23:59:59',
							readOnly: true,
							lang: szLan,
							isShowClear: false,
							onpicked: fOnPicked
						});
						WdatePicker({
							startDate: '%y-%M-%d',
							dateFmt: 'yyyy-MM-dd',
							alwaysUseStartDate: false,
							minDate: '1970-01-01 00:00:00',
							maxDate: '2037-12-31 23:59:59',
							readOnly: true,
							lang: szLan,
							isShowClear: false,
							onpicked: fOnPicked
						});
					} else if (scope.mode === "2") {// 时间设置使用
						WdatePicker({
							startDate: '%y-%M-%d %h:%m:%s',
							dateFmt: 'yyyy-MM-ddTHH:mm:ss',
							alwaysUseStartDate: false,
							minDate: '1970-01-01 00:00:00',
							maxDate: '2037-12-31 23:59:59',
							readOnly: true,
							lang: szLan,
							isShowClear: false,
							isShowToday: false,
							onpicked: fOnPicked
						});
						WdatePicker({
							startDate: '%y-%M-%d %h:%m:%s',
							dateFmt: 'yyyy-MM-ddTHH:mm:ss',
							alwaysUseStartDate: false,
							minDate: '1970-01-01 00:00:00',
							maxDate: '2037-12-31 23:59:59',
							readOnly: true,
							lang: szLan,
							isShowClear: false,
							isShowToday: false,
							onpicked: fOnPicked
						});
					} else if (scope.mode === "3") {// 时分秒
						var aQuickSel = [];
						var iHour = parseInt($(this).val().split(":")[0], 10) - 1;
						var szTime = "";
						for (var i = 0; i < 5; i++) {
							if (i % 2 == 0) {
								szTime = ((iHour + i / 2) > 9 ? (iHour + i / 2) : ("0" + (iHour + i / 2))) + ":00:00";
							} else {
								szTime = ((iHour + (i - 1) / 2) > 9 ? (iHour + (i - 1) / 2) : ("0" + (iHour + (i - 1) / 2))) + ":30:00";
							}
							aQuickSel.push(szTime);
						}
						WdatePicker({
							dateFmt: 'HH:mm:ss',
							isShowToday: false,
							isShowClear: false,
							alwaysUseStartDate: false,
							readOnly: true, lang: szLan,
							onpicked: fOnPicked,
							quickSel: aQuickSel
						});
						WdatePicker({
							dateFmt: 'HH:mm:ss',
							isShowToday: false,
							isShowClear: false,
							alwaysUseStartDate: false,
							readOnly: true, lang: szLan,
							onpicked: fOnPicked,
							quickSel: aQuickSel
						});
					} else {
						WdatePicker({
							startDate: '%y-%M-%d %h:%m:%s',
							dateFmt: 'yyyy-MM-dd HH:mm:ss',
							alwaysUseStartDate: false,
							minDate: '1970-01-01 00:00:00',
							maxDate: '2037-12-31 23:59:59',
							readOnly: true,
							lang: szLan,
							isShowClear: false,
							onpicked: fOnPicked
						});
						WdatePicker({
							startDate: '%y-%M-%d %h:%m:%s',
							dateFmt: 'yyyy-MM-dd HH:mm:ss',
							alwaysUseStartDate: false,
							minDate: '1970-01-01 00:00:00',
							maxDate: '2037-12-31 23:59:59',
							readOnly: true,
							lang: szLan,
							isShowClear: false,
							onpicked: fOnPicked
						});
					}
				});
				//model -> view
				scope.$watch("dpModel", function (newVal) {
					element.val(newVal);
				});
				scope.$watch("dpDisabled", function (bDisabled) {
					if (angular.isDefined(bDisabled)) {
						element.prop("disabled", bDisabled);
					}
				});
			}
		}
	});
angular.module("ui.jquery.stream", [])
	.directive("stream", function ($compile) {
		return {
			restrict: "A",
			scope: {
				streamType: "=",
				lan: "=",
				num: "=",
				onChange: "=",
				channelIndex: "@"
			},
			link: function (scope, element, attrs) {
				if (!angular.isDefined(scope.streamType)) {
					return;
				}
				scope.changeStreamType = function (iStreamType) {
					scope.streamType = iStreamType;
					$stream.hide();
				};

				var szTemplate = "<div class='icon-stream' ng-class=\"{0: 'icon-stream-1', 1: 'icon-stream-2', 2: 'icon-stream-3'}[streamType]\"></div>";
				var $element = $compile(szTemplate)(scope);
				$element.bind({
					mouseenter: function () {
						$(this).addClass("stream-enter");
						$stream.show();
						$stream.css({"left": ($element.position().left - $stream.outerWidth(true) + 1) + "px", "top": ($element.position().top - $stream.height() + $element.outerHeight(true)) + "px"});
					},
					mouseleave: function () {
						$(this).removeClass("stream-enter");
						$stream.hide();
					}
				});
				element.append($element);

				var szStreamHtml = "<div class='stream-select'><div class='stream-option' ng-click='changeStreamType(0)'>&nbsp;<span class='icon-stream icon-stream-1'></span><span class='stream-desc' title='{{lan.mainStream}}' ng-bind='lan.mainStream'></span></div><div class='stream-option' ng-click='changeStreamType(1)'>&nbsp;<span class='icon-stream icon-stream-2'></span><span class='stream-desc' title='{{lan.subStream}}' ng-bind='lan.subStream'></span></div>";
				if (3 === scope.num) {
					szStreamHtml += "<div class='stream-option-last' ng-click='changeStreamType(2)'>&nbsp;<span class='icon-stream icon-stream-3'></span><span class='stream-desc' title='{{lan.thirdStream}}' ng-bind='lan.thirdStream'></span></div>";
				} else if (4 === scope.num) {
					szStreamHtml += "<div class='stream-option-last' ng-click='changeStreamType(2)'>&nbsp;<span class='icon-stream icon-stream-3'></span><span class='stream-desc' title='{{lan.transcodedStream}}' ng-bind='lan.transcodedStream'></span></div>";
				}
				szStreamHtml += "</div>";
				var $stream = $compile(szStreamHtml)(scope);
				$stream.bind({
					mouseenter: function () {
						$(this).show();
						$element.addClass("stream-enter");
					},
					mouseleave: function () {
						$(this).hide();
						$element.removeClass("stream-enter");
					}
				});
				$stream.children("div").each(function () {
					$(this).bind({
						mouseenter: function () {
							$(this).addClass("stream-option-enter");
						},
						mouseleave: function () {
							$(this).removeClass("stream-option-enter");
						}
					})
				});
				element.append($stream);

				var iIndex = parseInt(scope.channelIndex, 10);

				scope.$watch("streamType", function (to) {
					if (angular.isDefined(to)) {
						if (scope.onChange) {
							if (!isNaN(iIndex)) {
								scope.onChange(iIndex, to);
							}
						}
					}
				});
			}
		}
	});