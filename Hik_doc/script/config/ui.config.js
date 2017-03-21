angular.module("ui.config", ["ui.config.channel", "ui.config.guide", "ui.config.plan", "ui.config.link", "ui.config.copy", "ui.config.password", "ui.config.valid", "ui.config.colorPicker", "ui.config.title", "ui.config.number", "ui.config.strength", "ui.config.select"]);
angular.module("ui.config.password", ["ui.config.valid", "ui.config.strength"])
	.directive("password", function () {
		return {
			restrict: "A",
			scope: {
				lan: "=",
				oPassword: "=",
				userName: "=",
				psDisabled: "=",
				hideDefault: "=",  	// 添加ipc页面，有用户名，但不需要显示默认密码
				usernameIndex: "=",
				specChar: "@",			// false 不能输入特殊字符
				psEmpty: "@",			// true 密码可以为空
				psLength: "@",			// 密码长度控制，默认为32
				psStrength: "@"			// 是否显示密码强度，默认不显示
			},
			controller: function ($scope) {
				$scope.oUtils = $scope.$parent.oUtils;
				$scope.oInputValid = $scope.$parent.oInputValid;
				$scope.aInputValidList = $scope.$parent.aInputValidList;
				var iPwdLength = $scope.psLength ? parseInt($scope.psLength, 10) : 32;
				$scope.oParamsValid = {
					oPassword: {
						oType: {value: "password"},
						oMaxLength: {value: iPwdLength, error: $scope.lan.noMoreLength.replace("%s", iPwdLength.toString())},
						oSpecChar:  {
							value: !($scope.specChar === "false"),
							error: $scope.lan.notChar + " / \\ : * ? ' \" < > | % "
						},
						bSkipValid: !!$scope.oPassword.bSkipValid
					},
					oPasswordConfirm: {
						oType: {value: "confirmPass"},
						oMaxLength: {value: iPwdLength, error: $scope.lan.noMoreLength.replace("%s", iPwdLength.toString())},
						oSpecChar:  {
							value: !($scope.specChar === "false"),
							error: $scope.lan.notChar + " / \\ : * ? ' \" < > | % "
						},
						bSkipValid: !!$scope.oPassword.bSkipValid
					}
				};
				$scope.$watch("oPassword.bSkipValid", function (to) {
					$scope.oParamsValid.oPassword.bSkipValid = to;
					$scope.oParamsValid.oPasswordConfirm.bSkipValid = to;
				});
				$scope.password = function () {// 密码框自定义规则
					var bValid = true,
						szError = "",
						szPasswordDefault = "\177\177\177\177\177\177";

					if($scope.psStrength !== "true") {
						if ($scope.oUtils.isEmpty($scope.oPassword.szPassword) && ($scope.psEmpty !== "true")) {
							bValid = false;
							szError = $scope.lan.nullTips;
						}
					} else {
						if (szPasswordDefault !== $scope.oPassword.szPassword &&
							!$scope.oUtils.checkPasswordComplexity($scope.oPassword.szPassword, $scope.userName)) {
							bValid = false;
							szError = "";
						}
					}

					if ($scope.oUtils.isChinese($scope.oPassword.szPassword)) {
						bValid = false;
						szError = $scope.lan.notZhChar;
					}
					
					return {bValid: bValid, szError: szError};
				};
				$scope.confirmPass = function () {// 确认密码框自定义规则
					var bValid = true,
						szError = "";

					if ($scope.oUtils.isEmpty($scope.oPassword.szPasswordConfirm) && ($scope.psEmpty !== "true")) {
						bValid = false;
						szError = $scope.lan.nullTips;
					} else if ($scope.oPassword.szPassword != $scope.oPassword.szPasswordConfirm) {
						bValid = false;
						szError = $scope.lan.passNotMatch;
					}

					return {bValid: bValid, szError: szError};
				};

				$.extend($scope.oPassword, {
					szPasswordDefault: "\177\177\177\177\177\177",
					szPassword: $scope.hideDefault ? "" : ($scope.userName === "" ? "" : "\177\177\177\177\177\177"),
					szPasswordConfirm: $scope.hideDefault ? "" : ($scope.userName === "" ? "" : "\177\177\177\177\177\177")
				});
				
				$scope.keydown = function (event, index) {// 密码框键按下，自动清空
					if (0 == index && $scope.oPassword.szPassword === $scope.oPassword.szPasswordDefault) {
						cursorEnd($scope.element.find("input").eq(0));
						$scope.oPassword.szPassword = "";
					} else if (1 == index && $scope.oPassword.szPasswordConfirm === $scope.oPassword.szPasswordDefault)  {
						cursorEnd($scope.element.find("input").eq(1));
						$scope.oPassword.szPasswordConfirm = "";
					}
				};
				$scope.keyup = function () {// 两次密码相同比对
					setTimeout(function () {
						$scope.element.find("input").eq(1).blur();
					}, 10);
				};

				// 光标移动到最后，解决默认密码选中状态下，Backspace键按下，在IE8/IE11浏览器会自动退回到上一个页面的问题。
				function cursorEnd($input) {
					var oObj = $input.get(0);
					var iLen = $input.val().length;
					if (document.selection) {
						var oSel = oObj.createTextRange();
						oSel.moveStart('character', iLen);
						oSel.collapse();
						oSel.select();
					} else if (typeof oObj.selectionStart == 'number' && typeof oObj.selectionEnd == 'number') {
						oObj.selectionStart = oObj.selectionEnd = iLen;
					}
				}
			},
			template: "<div><div class='item'><span class='first' ng-bind='lan.password'></span><span>" +
				"<input ng-disabled='psDisabled' ng-model='oPassword.szPassword' ng-keydown='keydown($event, 0)' ng-keyup='keyup()' type='password' class='text' input-valid='oParamsValid.oPassword' /></span></div>" +
				"<div strength class='passwordstrength' lan='lan' o-password='oPassword.szPassword' o-username='userName' ng-if='psStrength'></div><div class='item'><span class='first' ng-bind='lan.confirm'></span><span>" +
				"<input ng-disabled='psDisabled' ng-model='oPassword.szPasswordConfirm' ng-keydown='keydown($event, 1)' type='password' class='text' input-valid='oParamsValid.oPasswordConfirm' />" +
				"</span></div></div>",
			replace: true,
			link: function (scope, element, attrs) {
				scope.element = element;
				scope.$watch("usernameIndex", function (to) {
					scope.defaultUsername = scope.userName;
					scope.oPassword.szPasswordDefault = "\177\177\177\177\177\177";
					scope.oPassword.szPassword = scope.hideDefault ? "" : (scope.userName === "" ? "" : "\177\177\177\177\177\177");
					scope.oPassword.szPasswordConfirm = scope.hideDefault ? "" : (scope.userName === "" ? "" : "\177\177\177\177\177\177");
				});
			}
		}
	});

/** example
 * <div strength lan="oLan" o-password="oPassword" o-username='oUsername'></div>
 */
angular.module("ui.config.strength", [])
	.directive("strength", function () {
		return {
			restrict: "A",
			scope: {
				lan: "=",
				oPassword: "=",
				oUsername: "="
			},
			controller: function ($scope) {
				var szPasswordDefault = "\177\177\177\177\177\177";
				$scope.$watch("oPassword", function (to) {
					if (to != szPasswordDefault) {
						var oPswStrength = $($scope.element).find(".userstrength"),
							oUtils = $scope.$parent.oUtils;				
						switch (oUtils.checkPasswordComplexity(to, $scope.oUsername)) {
							case 1: {
								oPswStrength.eq(0).css("backgroundColor", "#FC657E");
								oPswStrength.eq(1).css("backgroundColor", "");
								oPswStrength.eq(2).css("backgroundColor", "");
								$scope.lan.pswstrength = $scope.lan.weakPwd;
								break;
							}
							case 2: {
								oPswStrength.eq(0).css("backgroundColor", "#FFC85D");
								oPswStrength.eq(1).css("backgroundColor", "#FFC85D");
								oPswStrength.eq(2).css("backgroundColor", "");
								$scope.lan.pswstrength = $scope.lan.normalPwd;
								break;
							}
							case 3: {
								oPswStrength.eq(0).css("backgroundColor", "#65D25D");
								oPswStrength.eq(1).css("backgroundColor", "#65D25D");
								oPswStrength.eq(2).css("backgroundColor", "#65D25D");
								$scope.lan.pswstrength = $scope.lan.goodPwd;
								break;
							}
							default: {
								oPswStrength.css("backgroundColor", "");
								$scope.lan.pswstrength = "";
							}
						}						
					} else {
						$($scope.element).find(".strength").css("backgroundColor", "");
						$scope.lan.pswstrength = "";
					}
				});
			},
			template: "<div class='validate'>" +
			"<span><span class='userstrength'></span>" +
			"<span class='userstrength'></span>" +
			"<span class='userstrength'></span>" +
			"<span ng-bind='lan.pswstrength'></span>" +
			"</span></div>" +
			"<div class='clear'></div>" +
			"<div><label ng-bind='lan.passwordValidTips'></label></div>",
			link: function (scope, element, attrs) {
				scope.element = element;
			}
		}
	});

/** example:
 * 	<div copy lan="oLan" dialog="_oDialog" channel-id="" analog-id="" digital-id="" o-copy=""></div>
 */
angular.module("ui.config.copy", [])
	.directive("copy", function () {
		return {
			restrict: "A",
			scope: {
				lan: "=",
				dialog: "=",
				channelId: "=",
				analogId: "=",
				digitalId: "=",
				analogNum: "=",
				oCopy: "="
			},
			controller: function ($scope, $compile) {
				$scope.aRepeat = [];  //repeat数组对象不能动态改变
				for (var i = 0; i < $scope.analogId.length + $scope.digitalId.length; i++) {
					$scope.aRepeat[i] = {};
				}
				$scope.aCheck = [];
				$scope.bSelAll = false;
				$scope.initParams = function () {
					var bChecked = false;
					var bDisabled = false;
					$scope.oCopy = [];
					for(var i = 0; i < $scope.analogId.length + $scope.digitalId.length; i++) {
						if(i < $scope.analogId.length) {
							if($scope.analogId[i] === $scope.channelId) {
								bChecked = true;
								bDisabled = true;
							} else {
								bChecked = false;
								bDisabled = false;
							}
					        $scope.oCopy.push({
								id: $scope.analogId[i],
								name: "A" + $scope.analogId[i],
								value: bChecked,
								disabled: bDisabled
							});
						} else {
							if($scope.digitalId[i-$scope.analogId.length] === $scope.channelId) {
								bChecked = true;
								bDisabled = true;
							} else {
								bChecked = false;
								bDisabled = false;
							}
							$scope.oCopy.push({
								id: $scope.digitalId[i - $scope.analogId.length],
								name: "D" + ($scope.digitalId[i - $scope.analogId.length] - $scope.analogNum),
								value: bChecked,
								disabled: bDisabled
							});
						}
					}
				};
				$scope.queryParams = function () {
					for(var i = 0; i < $scope.oCopy.length; i++) {
						$scope.aCheck[i] = {};
						$scope.aCheck[i].name = $scope.oCopy[i].name;
						$scope.aCheck[i].value = $scope.oCopy[i].value;
						$scope.aCheck[i].disabled = $scope.oCopy[i].disabled;
					}
				};
				$scope.selAll = function () {
					$scope.bSelAll = !$scope.bSelAll;
					for(var i = 0; i < $scope.aCheck.length; i++) {
						if(!$scope.aCheck[i].disabled) {
							$scope.aCheck[i].value = $scope.bSelAll;
						}
					}
				};
				$scope.copyTo = function () {
					$scope.queryParams();
					var szHtml =
						"<div id='copyTo' class='copyto'>" +
							"<div class='title'>" +
								"<input id='selAll' type='checkbox' class='checkbox' ng-click='selAll()' ng-checked='bSelAll' />" +
								"<label ng-bind='lan.selectAll'></label>" +
							"</div>" +
							"<div class='content'>" +
								"<div ng-class-odd='\"item\"' ng-class-even='\"item bg\"' ng-repeat='o in aRepeat'>" +
									"<input type='checkbox' class='checkbox' ng-model='aCheck[$index].value'" +
									" ng-disabled='aCheck[$index].disabled' />{{aCheck[$index].name}}" +
								"</div>" +
							"</div>" +
						"</div>";
					$scope.dialog.html($scope.lan.copyTo, szHtml, null, null, function () {
						var iLen = $scope.aCheck.length;
						for(var i = 0; i < iLen; i++) {
							$scope.oCopy[i].value = $scope.aCheck[i].value;
						}
					}, function () {

					});
					$compile(angular.element("#copyTo"))($scope);
				};
				$scope.$watch("aCheck", function (to, from) {
					for(var i = 0; i < $scope.aCheck.length; i++) {
						if(!$scope.aCheck[i].value) {
							$scope.bSelAll = false;
							break;
						}
					}
					if(i === $scope.aCheck.length) {
						$scope.bSelAll = true;
					}
				}, true);
				$scope.$watch("channelId", function (to, from) {
					if(to > 0) {
						$scope.initParams();
					}
				});
			},
			template: "<button class='btn btn-copyto' type='button' ng-click='copyTo()'><span class='copyto'>&nbsp;&nbsp;</span><span ng-bind='lan.copyTo'></span></button>",
			replace: true,
			link: function (scope, element, attrs) {
				if ((scope.analogId.length + scope.digitalId.length) <= 1) {
					element.hide();
				}
			}
		}
	});
/** example:
 * 	<span channel></span>
 */
angular.module("ui.config.channel", [])
	.directive("channel", function ($compile) {
		return {
			restrict: "A",
			scope: {
				analog: "=",
				digital: "=",
				analogNum: "=",
				lan: "=",
				channelId: "="
			},
			link: function (scope, element, attrs) {
				var szTemplate = "",
					oLan = scope.lan;

				scope.aChannel = [];
				scope.szChannelId = "";

				scope.$watch("channelId", function (to) {
					if (to) {
						scope.szChannelId = to.toString();
					}
				});
				scope.$watch("szChannelId", function (to) {
					if (to) {
						scope.channelId = parseInt(to, 10);
					}
				});
				scope.$watchCollection("analog", function (to) {
					scope.aChannel.length = 0;
					getChannel();
				});
				scope.$watchCollection("digital", function (to) {
					scope.aChannel.length = 0;
					getChannel();
				});

				function getChannel() {					
					var szAnalogChannelName = oLan.analogChannel;
					var szDigitalChannelName = oLan.digitalChannel;
					if (!scope.analog.length || !scope.digital.length) {
						szDigitalChannelName = szAnalogChannelName = oLan.camera;
					}

					$(scope.analog).each(function (i) {
						scope.aChannel.push({
							name: (szAnalogChannelName + this),
							value: this.toString()
						});
					});
					$(scope.digital).each(function (i) {
						scope.aChannel.push({
							name: (szDigitalChannelName + (this - parseInt(scope.analogNum, 10))),
							value: this.toString()
						});
					});

					if (scope.channelId > 0) {
						scope.szChannelId = scope.channelId.toString();
					} else {
						if (scope.analog.length > 0) {
							scope.szChannelId = scope.analog[0].toString();
						} else if (scope.digital.length > 0) {
							scope.szChannelId = scope.digital[0].toString();
						}
					}

					szTemplate = "<select class='select' ng-model='szChannelId' ng-options='oChannel.value as oChannel.name for oChannel in aChannel'></select>";
					angular.element(element).empty().html($compile(szTemplate)(scope));

					if ((scope.analog.length + scope.digital.length) <= 1) {
						element.find("select").eq(0).prop("disabled", true);
						if (1 === seajs.iDeviceType) {
							$(element).parent().hide();
						}
					}
				}
			}
		}
	});

/** example:
 * 	<div guide view-id="guide_view"></div>
 * 	<div id="guide_view" class="guide-view">
 * 	    <div class="step-view"></div>
 * 	    <div class="step-view"></div>
 * 	    <div class="step-view"></div>
 * 	</div>
 */
angular.module("ui.config.guide", [])
	.controller('guideController', function ($scope, $compile) {
		var self = this,
			iCurStep = -1,
			iStepCnt = $scope.step.length;

		$scope.change = function (iStep) {
			if ($scope.click) {// 点击回调
				if (angular.isUndefined($scope.click(iStep)) || true === $scope.click(iStep)) {
					self.change(iStep);
				}
			} else {// 指令没有传回调，直接切换
				self.change(iStep);
			}
		};
		$scope.resize = function () {
			if (iCurStep > -1) {
				var iHeight = $("#" + $scope.viewId).find(".step-view").eq(iCurStep).outerHeight();
				$("#" + $scope.viewId).height(iHeight);				
			}
		};

		this.change = function (iStep) {
			if (iCurStep == iStep) {
				return;
			}

			// 向导切换时，隐藏星期复制到弹出框和时间段编辑弹出框
			$(".timeplan_timetip, .timeplan_checkboxs").hide();

			if (iCurStep >= 0 && ($scope.valid !== "false")) {// 切换向导时处理以下逻辑
				// 页面中存在效验通不过的输入框，不能切换向导
				if (angular.isDefined($scope.$parent.bInputValid) && !$scope.$parent.bInputValid) {
					return;
				}
				if (angular.isDefined($scope.$parent.oInputValid) && !$scope.$parent.oInputValid.bInputValid) {
					return;
				}
			}

			var oTipDiv = null;
			$("#" + $scope.viewId).find(".step-view").eq(iCurStep).find(":input").each(function () {
				oTipDiv = $(this).data("validTipDiv");
				if (angular.isDefined(oTipDiv)) {// 查找向导页中成功提示，需要隐藏
					oTipDiv.hide();
				}
			});

			// 每一个step都是absolute定位，需要手动设置父元素的高度实现自适应高度
			var iHeight = $("#" + $scope.viewId).find(".step-view").eq(iStep).outerHeight();
			$("#" + $scope.viewId).height(iHeight);

			if (1 == iStepCnt) {
				$("#" + $scope.viewId).find(".step-view").eq(iStep).css("visibility", "visible");
			} else {
				$("#guide_" + $scope.viewId + " .step").eq(iCurStep).removeClass("current");
				$("#guide_" + $scope.viewId + " .step").eq(iStep).addClass("current");
				if (iStep > 0) {
					$("#guide_" + $scope.viewId + " .step").eq(iStep).prev().find(".arraw").eq(0).addClass("on");
				}
				if (iCurStep > 0) {
					$("#guide_" + $scope.viewId + " .step").eq(iCurStep).prev().find(".arraw").eq(0).removeClass("on");
				}
			}

			if (iCurStep > -1) {
				$("#" + $scope.viewId).find(".step-view").eq(iCurStep).css("visibility", "hidden");
			}
			$("#" + $scope.viewId).find(".step-view").eq(iStep).css("visibility", "visible");

			iCurStep = iStep;
		};

		$scope.$watchCollection("step", function (to) {
			var aTemplate = [],
				oStep = $scope.step,
				iStepCnt = oStep.length;

			aTemplate.push("<div id='guide_" + $scope.viewId + "' class='guide'>");
			$.each(oStep, function (i) {
				if (0 == i) {// 第一个Step
					aTemplate.push("<div class='step first current' ng-click='change(" + i + ")'>");
					if (1 == iStepCnt) {
						aTemplate.push("<span class='txt bdr-r'>" + this + "</span>");
					} else {
						aTemplate.push("<span class='txt'>" + this + "</span>");
						aTemplate.push("<span class='arraw'></span>");
					}
					aTemplate.push("</div>");
				} else if (i == iStepCnt - 1) {// 判断是否到最后Step
					aTemplate.push("<div class='step last' ng-click='change(" + i + ")'>");
					aTemplate.push("<span class='txt'>" + this + "</span>");
					aTemplate.push("</div>");
				} else {
					aTemplate.push("<div class='step center' ng-click='change(" + i + ")'>");
					aTemplate.push("<span class='txt'>" + this + "</span>");
					aTemplate.push("<span class='arraw'></span>");
					aTemplate.push("</div>");
				}
			});
			aTemplate.push("</div>");

			angular.element($scope.element).html($compile(aTemplate.join(""))($scope));

			$("#" + $scope.viewId).find(".step-view").css("visibility", "hidden");

			$scope.change(0);
		});
	})
	.directive("guide", function () {
		return {
			restrict: "A",
			scope: {
				viewId: "@",
				step: "=",
				click: "=",
				valid: "@"
			},
			require: 'guide',
			controller: 'guideController',
			link: function (scope, element, attrs, ctrls) {
				scope.element = element;
			}
		}
	});


/** example:
 * 	<div plan section-num="8" data="aTimes" mode="0" holiday="false" lan="oLan" on-advanced="func"></div>
 */
angular.module("ui.config.plan", [])
	.directive("plan", function () {
		return {
			restrict: "A",
			scope: {
				sectionNum: "=",	// 每天最多能画时间段
				data: "=",			// [[{sTime:"00:00:00", eTime:"12:00:00"},{sTime:"12:00:00", eTime:"12:00:00"}],[{sTime:"00:00:00", eTime:"24:00:00"}]]
				mode: "@",			// 普通模式：0 高级模式：1 （录像计划时使用）
				holiday: "=",		// 是否支持假日
				types: "=",		// 绘制的类型
				lan: "=",			// 语言资源
				editable: "=",    // 是否可编辑,
				alarmOutNum: "=",	//报警输出个数
				onAdvanced: "=",	// 高级参数按钮回调
				onScenceCfg: "="	// 场景巡航时间配置按钮回调
			},
			link: function (scope, element, attrs, ctrls) {
				var oTimePlan = angular.element(element).TimePlan({
					sectionNum: scope.sectionNum || 8,
					//data: scope.data || null,
					mode: "1" === scope.mode ? 1 : 0,
					holiday: scope.holiday,
					//types: scope.types || null,
					lan: scope.lan || null,
					onAdvanced: scope.onAdvanced || null,
					onScenceCfg: scope.onScenceCfg || null
				});

				scope.$watchCollection("types", function (to) {
					if (to) {
						oTimePlan.setType(to);
					}
				});
				scope.$watch("data", function (to) {
					if (to) {
						oTimePlan.setData(to);
					}
				}, true);
                scope.$watch("sectionNum", function (to) {
                    if (to) {
                        oTimePlan.setSectionNum(to);
                    }
                }, true);
				scope.$watch("editable", function (to) {
					if (angular.isDefined(to)) {
						oTimePlan.setEditable(to);
					}
				});
				scope.$watch("alarmOutNum", function (to) {
					if (angular.isDefined(to)) {
						oTimePlan.setAlarmOutNum(to);
					}
				});
			}
		}
	});

/** example:
 * 	<div link></div>
 */
angular.module("ui.config.link", [])
	.controller('linkController', function ($scope, $timeout) {
		$scope.oNormalInfo = ($scope.normal && $scope.normal.oInfo) || {};
		$scope.oNormalShow = ($scope.normal && $scope.normal.oShow) || {center: true, beep: true, email: true, focus: false};
		$scope.oAlarmInfo = ($scope.alarm && $scope.alarm.oInfo) || {};
		$scope.oRecordInfo = ($scope.record && $scope.record.oInfo) || {};
		$scope.oLinkShow =  $scope.show || {normal: true, alarm: true, record: true, ptz: true};// 联动需要隐藏/显示

		$scope.iPtzChannelId = 0;
		$scope.oPtzCur = {// 当前勾选的联动类型和序号
			szType: "",
			iNo: 0
		};
		$scope.oPtzNo = {// 三种类型选择方式
			preset: 1,
			patrol: 1,
			pattern: 1
		};

		$scope.oLan = $scope.lan;

		// 联动全选
		$scope.oAll = {
			bNormal: false,	// 常规
			bAlarm: false,		// 报警
			bRecord: false	// 录像
		};

		// 常规联动
		$scope.normalLink = function (szType) {
			$scope.oNormalInfo[szType] = !$scope.oNormalInfo[szType];
		};
		$scope.normalLinkAll = function () {
			$scope.oAll.bNormal = !$scope.oAll.bNormal;
			for (var szType in $scope.oNormalInfo) {
				if (!$scope.normal.bFtp && "ftp" == szType) {// 不支持上传FTP
					continue;
				}
				$scope.oNormalInfo[szType] = $scope.oAll.bNormal;
			}
		};

		// 联动报警输出
		$scope.alarmLink = function (szType) {
			$scope.oAlarmInfo[szType] = !$scope.oAlarmInfo[szType];
		};
		$scope.alarmLinkAll = function () {
			$scope.oAll.bAlarm = !$scope.oAll.bAlarm;
			for (var szType in $scope.oAlarmInfo) {
				$scope.oAlarmInfo[szType] = $scope.oAll.bAlarm;
			}
		};

		// 录像联动
		$scope.recordLink = function (szType) {
			$scope.oRecordInfo[szType] = !$scope.oRecordInfo[szType];
		};
		$scope.recordLinkAll = function () {
			$scope.oAll.bRecord = !$scope.oAll.bRecord;
			for (var szType in $scope.oRecordInfo) {
				$scope.oRecordInfo[szType] = $scope.oAll.bRecord;
			}
		};

		// PTZ联动通道
		$scope.ptzLink = function (szType) {
			if ($scope.oPtzCur.szType == szType) {// 不勾上
				$scope.oPtzCur.szType = "";
				$scope.oPtzCur.iNo = 0;
			} else {// 勾上
				$scope.oPtzCur.szType = szType;
				$scope.oPtzCur.iNo = $scope.oPtzNo[szType];
			}
		};
		$scope.changePtzNo = function (szType) {
			$scope.oPtzCur.iNo =  $scope.oPtzNo[szType];
		};
		$scope.$watch("iPtzChannelId", function (to) {
			if (to > 0) {
				$timeout(function () {
					$scope.oPtzCur = $scope.oPtzInfo[to];
					for (var k in $scope.oPtzNo) {// 重置数据
						$scope.oPtzNo[k] = 1;
					}
					if ("" !== $scope.oPtzCur.szType) {
						$scope.oPtzNo[$scope.oPtzCur.szType] = $scope.oPtzCur.iNo;
					}
				}, 10);
			}
		});
		$scope.$watch("oPtzInfo", function (to) {
			if (to) {
				$timeout(function () {
					$scope.oPtzCur = to[$scope.iPtzChannelId];
					for (var k in $scope.oPtzNo) {// 重置数据
						$scope.oPtzNo[k] = 1;
					}
					$scope.oPtzNo[$scope.oPtzCur.szType] = $scope.oPtzCur.iNo;
				}, 10);
			}
		}, true);

		$scope.$watch("oNormalShow", function (to) {
			// 判断是否隐藏常规联动
			var bHideAll = true;// 是否全部隐藏
			for (var szType in $scope.oNormalShow) {
				if ($scope.oNormalShow[szType]) {
					bHideAll = false;
					break;
				}
			}
			if (bHideAll && !$scope.normal.bFtp) {
				$scope.oLinkShow.normal = false;
				return;
			} else {
				$scope.oLinkShow.normal = true;
			}
		}, true);

		$scope.$watch("oNormalInfo", function (to) {
			if (!$scope.oLinkShow.normal) {// 常规联动隐藏时设置“全选”不勾上
				$scope.oAll.bNormal = false;
				return;
			}

			// 判断是否全选
			$scope.oAll.bNormal = true;
			for (var szType in $scope.oNormalInfo) {
				if (!$scope.normal.bFtp && "ftp" == szType) {// 不支持上传FTP
					continue;
				}
				if (!$scope.oNormalShow.center && "center" == szType) {// 上传中心隐藏着
					continue;
				}

				if (!$scope.oNormalShow.focus && "focus" == szType) {// 聚焦
					continue;
				}

				if (!$scope.oNormalShow.beep && "beep" == szType) {//声音联动隐藏着
					continue;
				}
				if (!$scope.oNormalShow.email && "email" == szType) {//邮件联动隐藏着
					continue;
				}

                if (!$scope.normal.bMonitor && "monitor" == szType) {//监视器告警
                    continue;
                }

                if (!$scope.normal.bTrace && "trace" == szType) {//跟踪联动
                    continue;
                }

                if (!$scope.normal.bLightAuido && "lightAuido" == szType) {//光线音频
                    continue;
                }

				if (!$scope.oNormalInfo[szType]) {// 显示并且没有勾上
					$scope.oAll.bNormal = false;
					break;
				}
			}
		}, true);

		$scope.$watch("alarm", function (to) {
			if (to) {
				if (to.aAnalogAlarmId.length + to.aDigitalAlarmId.length <= 0) {
					$scope.oLinkShow.alarm = false;
				} else {
					$scope.oLinkShow.alarm = true;
				}
			}
		});

		$scope.$watch("oAlarmInfo", function (to) {			
			$scope.oAll.bAlarm = true;
			for (var szType in $scope.oAlarmInfo) {
				if (!$scope.oAlarmInfo[szType]) {
					$scope.oAll.bAlarm = false;
					break;
				}
			}
		}, true);

		$scope.$watch("oRecordInfo", function (to) {
			$scope.oAll.bRecord = true;
			for (var szType in $scope.oRecordInfo) {
				if (!$scope.oRecordInfo[szType]) {
					$scope.oAll.bRecord = false;
					break;
				}
			}
		}, true);
	})
	.directive("link", function ($compile, $timeout) {
		return {
			restrict: "A",
			scope: {
				show: "=",
				normal: "=",
				alarm: "=",
				record: "=",
				ptz: "=",
				lan: "="
			},
			require: 'link',
			controller: 'linkController',
			link: function (scope, element, attrs, ctrls) {
				var aHtml = [],
					iPtzChannelId = 0;

				aHtml.push('<div class="links" ng-show="oLinkShow.normal || oLinkShow.alarm || oLinkShow.record || oLinkShow.ptz">');
				if (scope.normal) {
					aHtml.push('<div class="link" ng-show="oLinkShow.normal">');
					aHtml.push('<div class="title"><input type="checkbox" class="checkbox" ng-checked="oAll.bNormal" ng-click="normalLinkAll()" /><label ng-bind="oLan.normalLink"></label></div>');
					aHtml.push('<div class="content">');
					aHtml.push('<div class="item" ng-show="oNormalShow.beep"><input type="checkbox" class="checkbox" ng-checked="oNormalInfo.beep" ng-click="normalLink(\'beep\')" /><label ng-bind="oLan.soundAlarm"></label></div>');
					aHtml.push('<div class="item bg" ng-show="oNormalShow.email"><input type="checkbox" class="checkbox" ng-checked="oNormalInfo.email" ng-click="normalLink(\'email\')" /><label ng-bind="oLan.emailLink"></label></div>');
					aHtml.push('<div class="item" ng-show="oNormalShow.center"><input type="checkbox" class="checkbox" ng-checked="oNormalInfo.center" ng-click="normalLink(\'center\')" /><label ng-bind="oLan.uploadCenter"></label></div>');
					aHtml.push('<div class="item" ng-show="oNormalShow.focus"><input type="checkbox" class="checkbox" ng-checked="oNormalInfo.focus" ng-click="normalLink(\'focus\')" /><label ng-bind="oLan.focus"></label></div>');
					if (angular.isUndefined(scope.normal.bMonitor) || scope.normal.bMonitor) {
						aHtml.push('<div class="item bg"><input type="checkbox" class="checkbox" ng-checked="oNormalInfo.monitor" ng-click="normalLink(\'monitor\')" /><label ng-bind="oLan.monitorAlarm"></label></div>');
					}
					if (scope.normal.bFtp) {
						aHtml.push('<div class="item"><input type="checkbox" class="checkbox"  ng-checked="oNormalInfo.ftp" ng-click="normalLink(\'ftp\')" /><label ng-bind="oLan.uploadFTP"></label></div>');
					}
                    if(scope.normal.bTrace) {
                        aHtml.push('<div class="item bg"><input type="checkbox" class="checkbox"  ng-checked="oNormalInfo.trace" ng-click="normalLink(\'trace\')" /><label ng-bind="oLan.linkageTracking"></label></div>');
                    }
                    if(scope.normal.bLightAuido) {
                        aHtml.push('<div class="item bg"><input type="checkbox" class="checkbox"  ng-checked="oNormalInfo.lightAuido" ng-click="normalLink(\'lightAuido\')" /><label ng-bind="oLan.audioLightAlarm"></label></div>');
                    }
					aHtml.push('</div>');
					aHtml.push('</div>');
				} else {
					scope.oLinkShow.normal = false;
				}

				if (scope.alarm) {
					aHtml.push('<div class="link" ng-show="oLinkShow.alarm">');
					aHtml.push('<div class="title"><input type="checkbox" class="checkbox" ng-checked="oAll.bAlarm" ng-click="alarmLinkAll()" /><label ng-bind="oLan.linkAlarmOutput"></label></div>');
					aHtml.push('<div class="content">');

					var iBg = 0;
					$.each(scope.alarm.aAnalogAlarmId, function (i) {
						iBg = i;
						aHtml.push('<div class="item' + (0 == i % 2 ? '' : ' bg') + '"><input type="checkbox" class="checkbox" ng-checked="oAlarmInfo[\'' + this + '\']" ng-click="alarmLink(\'' + this + '\')" />' + "A->" + (i + 1) + '</div>');
					});
					$.each(scope.alarm.aDigitalAlarmId, function (i) {
						aHtml.push('<div class="item' + (0 == (iBg + i) % 2 ? ' bg': '') + '"><input type="checkbox" class="checkbox" ng-checked="oAlarmInfo[\'' + this + '\']" ng-click="alarmLink(\'' + this + '\')" />' + "D" + (Math.floor(parseInt(this / 100, 10)) - scope.alarm.iAnalogChannelNum) + "->" + this % 100 + '</div>');
					});

					aHtml.push('</div>');
					aHtml.push('</div>');
				} else {
					scope.oLinkShow.alarm = false;
				}

				if (scope.record) {
					aHtml.push('<div class="link" ng-show="oLinkShow.record">');
					aHtml.push('<div class="title"><input type="checkbox" class="checkbox" ng-checked="oAll.bRecord" ng-click="recordLinkAll()" /><label ng-bind="oLan.recordLink"></label></div>');
					aHtml.push('<div class="content">');

					var iBg = 0;
					$.each(scope.record.aAnalogChannelId, function (i) {
						iBg = i;
						aHtml.push('<div class="item' + (0 == i % 2 ? '' : ' bg') + '"><input type="checkbox" class="checkbox" ng-checked="oRecordInfo[\'' + this + '\']" ng-click="recordLink(\'' + this + '\')" />' + "A" + (i + 1) + '</div>');
					});
					$.each(scope.record.aDigitalChannelId, function (i) {
						aHtml.push('<div class="item' + (0 == (iBg + i) % 2 ? ' bg': '') + '"><input type="checkbox" class="checkbox" ng-checked="oRecordInfo[\'' + this + '\']" ng-click="recordLink(\'' + this + '\')" />' + "D" + (this - scope.record.iAnalogChannelNum) + '</div>');
					});

					aHtml.push('</div>');
					aHtml.push('</div>');
				} else {
					scope.oLinkShow.record = false;
				}

				if (scope.ptz) {
					aHtml.push('<div class="link" ng-show="oLinkShow.ptz">');
					aHtml.push('<div class="title"><label ng-bind="oLan.ptzLink" style="margin:0 5px 0 10px;"></label><select ng-model="iPtzChannelId" ng-change="changePtzChannel()">');

					$.each(scope.ptz.aAnalogChannelId, function (i) {
						if (0 == i) {
							iPtzChannelId = parseInt(this, 10);
						}
						aHtml.push('<option value="' + this + '">A' + this + '</option>');
					});
					$.each(scope.ptz.aDigitalChannelId, function (i) {
						if (0 == iPtzChannelId && 0 == i) {
							iPtzChannelId = parseInt(this, 10);
						}
						aHtml.push('<option value="' + this + '">D' + (this - scope.ptz.iAnalogChannelNum) + '</div>');
					});

					aHtml.push('</select></div>');
					aHtml.push('<div class="content">');

					if (scope.ptz.iPresetNum) {// 预置点序号
						aHtml.push('<div class="item"><input type="checkbox" class="checkbox" ng-checked="oPtzCur.szType==\'preset\'" ng-click="ptzLink(\'preset\')" /><label ng-bind="oLan.presetNo"></label></div>');
						aHtml.push('<div class="item bg"><select class="select" ng-model="oPtzNo.preset" ng-disabled="!(oPtzCur.szType==\'preset\')" ng-change="changePtzNo(\'preset\')">');
						for(var i = 1; i <= scope.ptz.iPresetNum; i++) {
							aHtml.push('<option value="' + i + '">' + i + '</option>');
						}
						aHtml.push('</select></div>');
					}					
					if (scope.ptz.iPatrolNum) {// 巡航序号
						aHtml.push('<div class="item"><input type="checkbox" class="checkbox" ng-checked="oPtzCur.szType==\'patrol\'" ng-click="ptzLink(\'patrol\')" /><label ng-bind="oLan.patrolNo"></label></div>');
						aHtml.push('<div class="item bg"><select class="select" ng-model="oPtzNo.patrol" ng-disabled="!(oPtzCur.szType==\'patrol\')" ng-change="changePtzNo(\'patrol\')">');
						for(var i = 1; i <= scope.ptz.iPatrolNum; i++) {
							aHtml.push('<option value="' + i + '">' + i + '</option>');
						}
						aHtml.push('</select></div>');
					}
					if (scope.ptz.iPatternNum) {// 花样扫描
						aHtml.push('<div class="item"><input type="checkbox" class="checkbox" ng-checked="oPtzCur.szType==\'pattern\'" ng-click="ptzLink(\'pattern\')" /><label ng-bind="oLan.pattern"></label></div>');
						aHtml.push('<div class="item bg"><select class="select" ng-model="oPtzNo.pattern" ng-disabled="!(oPtzCur.szType==\'pattern\')" ng-change="changePtzNo(\'pattern\')">');
						for(var i = 1; i <= scope.ptz.iPatternNum; i++) {
							aHtml.push('<option value="' + i + '">' + i + '</option>');
						}
						aHtml.push('</select></div>');
					}

					aHtml.push('</div>');
					aHtml.push('</div>');
				} else {
					scope.oLinkShow.ptz = false;
				}
				aHtml.push('</div>');

				var $element = $compile(aHtml.join(""))(scope);

				angular.element(element).append($element);

				if (scope.ptz) {
					scope.oPtzInfo = scope.ptz.oInfo;
					scope.iPtzChannelId = iPtzChannelId;
				}
			}
		}
	});

/** example:
 * 	<input type="text" input-valid="oNameValid" />
 * 	$scope.oUtils = _oUtils;										// 工具类  var _oUtils = require("utils");
 * 	$scope.oNumberValid = {											// szType大类型效验，后面几个小类型效验（不设置不效验）
 *		oType: {value: "email", error: "错误的E-mail地址"},			// 类型 email url ip ipv4 ipv6 multicast domain mask hiddns unicastIPv6(IPV4单播+IPV6)，如果value在前面没有找到，当做自定义函数使用
 *		oEmpty: {value: false, error: "此项为必填项"},				// 是否支持为空
 *		oChinese: {value: false, error: "此项不能输入中文"},		// 是否支持中文
 *		oSpecChar: {value: false, error: "此项不能输入特殊字符"},	// 是否支持特殊字符 / \ : * ? ' " < > | %
 *		aRegex: [{value: "", error: ""}, {value: "", error: ""}],	// 正则表达式
 *		oMinLength: {value: 1, error: "此项长度不能小于1"},			// 字符串最小长度
 *		oMaxLength: {value: 32, error: "此项长度不能大于32"},		// 字符串最大长度
 *		oMinValue: {value: 1, error: "此项范围：1-65535"},			// 最小值
 *		oMaxValue: {value: 65535, error: "此项范围：1-65535"},		// 最大值
 *		bFloatValue: true,											// 最小值/最大值是否支持小数
 *		bSkipValid: true											// 是否跳过效验
 *	};
 */
angular.module("ui.config.valid", [])
	.directive("inputValid", function () {
		return {
			require: "ngModel",
			link: function (scope, elm, attrs, ngModel) {
				var oInputValid = scope.$eval(attrs.inputValid),
					oUtils = scope.oUtils,
					bFirstTip = true;// 首个效验错误的提示

				var setInputValid = function (bValid) {// scope嵌套的话，在模块scope中定义$scope.oInputValid = {};
					if (angular.isObject(scope.oInputValid)) {
						scope.oInputValid.bInputValid = bValid;
					} else {
						scope.bInputValid = bValid;
					}
				};

				var getInputValid = function () {
					if (angular.isObject(scope.oInputValid)) {
						return scope.oInputValid.bInputValid;
					} else {
						return scope.bInputValid;
					}
				};

				if (angular.isUndefined(oUtils)) {// 检查工具类是否定义到了scope中
					alert("$scope.oUtils is undefined!");
					return;
				}

				// 输入框elm数组
				if (!scope.aInputValidList) {// 所有指令的elm，scope嵌套的话，在模块scope中定义$scope.aInputValidList = [];
					scope.aInputValidList = [];
				}

				if (!oInputValid.bSkipValid) {// 默认不跳过，加入队列
					if ($.dialog.list["dialoghtml"]) {// 如果是弹出框，给元素加个标识，clear的时候要用
						$(elm).data("from", "dialoghtml");
					}
					scope.aInputValidList.push(elm);
				}

				if (angular.isDefined(oInputValid.oMaxLength) && parseInt(oInputValid.oMaxLength.value, 10) > 0) {// 如果效验规则中设置了最大长度，给元素添加max-length属性
					$(elm).attr("maxLength", oInputValid.oMaxLength.value);
				}

				// 输入框事件绑定
				elm.bind({
					keyup: function (e) {
						inputValid();
						showBorderTip();
						showIconTip();
						inputFixed();// 修正处理
					},
					blur: function () {
						inputValid();
						showBorderTip();
						showIconTip();
					}
				});

				// 内容区域出现滚动条，调整位置
				/*$("#view").parent().unbind("scroll").bind("scroll", function () {
					var oValidTip = null;
					$(":input").each(function () {
						oValidTip = $(this).data("validTipDiv");
						if (angular.isDefined(oValidTip) && oValidTip.is(":visible")) {
							$(this).blur();
						}
					});
				});*/
				// 效验工具函数
				if (angular.isObject(scope.oInputValidUtils)) {
					// 清空验证elm列表，如果input是动态编译的，不用时要清空，防止再次编译时列表中重复
					scope.oInputValidUtils.clearInputValidList = function () {
						if (!!scope.aInputValidList) {
							if ($.dialog.list["dialoghtml"]) {// 如果是弹出框，clear弹出框中的效验元素
								var aTemp = $.extend(true, [], scope.aInputValidList);
								scope.aInputValidList.length = 0;
								$.each(aTemp, function () {
									if ($(this).data("from") && "dialoghtml" == $(this).data("from")) {
										return true;
									}
									scope.aInputValidList.push(this);
								});
							} else {
								scope.aInputValidList.length = 0;
							}
						}
					};

					// 手动效验
					scope.oInputValidUtils.manualInputValid = function () {
						$(scope.aInputValidList).each(function () {
							if ($.dialog.list["dialoghtml"]) {// 如果是弹出框，效验弹出框元素
								if ($(this).data("from") && "dialoghtml" == $(this).data("from")) {
									$(this).blur();
								}
							} else {
								$(this).blur();
							}
						});
					};

					// 更新效验元素属性，在界面上文本框切换显示的时候调用比较好
					scope.oInputValidUtils.updateInputValid = function () {
						var bChange = false;
						$(scope.aInputValidList).each(function () {
							if ($.dialog.list["dialoghtml"]) {// 如果是弹出框，效验弹出框元素
								// do nothing
							} else {
								if ($(this).is(":hidden") || $(this).prop("disabled")) {
									$(this).data("bSkipValid", "true");
									bChange = true;
								}
							}
						});
						if (bChange) {// 如果界面文本框隐藏/显示有变化
							// 只效验元素，界面无变化
							inputValid();
						}
					};
				}

				// 效验规则监听
				scope.$watch(attrs.inputValid.toString(), function (to, from) {
					if (angular.isUndefined(to)) {
						return;
					}
					//if ((!!to.bSkipValid) != (!!from.bSkipValid)) {// menu切换后，from竟然保存了上一次的结果，使to!=from条件不成立，引起逻辑错误
						if (!!to.bSkipValid) {
							$.each(scope.aInputValidList, function (i) {
								if (this == elm) {
									scope.aInputValidList.splice(i, 1);
									return false;
								}
							});
							// 去掉提示，输入框显示正常模式
							hideTip();
						} else {
							if (-1 == $.inArray(elm, scope.aInputValidList)) {
								scope.aInputValidList.push(elm);
								//如果校验规则包含maxLength，后续规则里maxLength值变掉，需要重新修改下元素的maxLength属性
							}
							if (angular.isDefined(to.oMaxLength) && parseInt(to.oMaxLength.value, 10) > 0) {// 如果效验规则中设置了最大长度，给元素添加max-length属性
								$(elm).attr("maxLength", to.oMaxLength.value);
							}
						}
					//}
					inputValid();
				}, true);

				// 输入框值监听
				scope.$watch(attrs.ngModel.toString(), function (to) {
					if (angular.isUndefined(to)) {
						return;
					}
					inputValid();
					hideBorderTip();
					hideIconTip();
				});

				// 修正处理
				var inputFixed = function () {
					if (elm.$valid) {
						if (angular.isDefined(oInputValid.oMinValue) || angular.isDefined(oInputValid.oMaxValue)) {
							if (oUtils.regexTest(ngModel.$viewValue, "^0+\\d+$", "g")) {
								ngModel.$viewValue = ngModel.$viewValue.replace(/^0+(\d+)$/g, "$1");
								elm.val(ngModel.$viewValue);
								ngModel.$modelValue = ngModel.$viewValue;
							}
						}
					}
				};

				// 文本框总效验
				var inputValid = function () {
					elm.$valid = true;
					bFirstTip = true;
					$(elm).data("validTip", "");

					isTypeValid();
					isEmpty();
					isChinese();
					isSpecChar();
					isRegex();
					isLength();
					isValue();
					isUnicast();

					// 遍历所有elm，给scope.bInputValid赋值
					setInputValid(true);
					$.each(scope.aInputValidList, function () {
						// 界面文本框切换显示时，会给元素打标识，在对所有元素效验时，跳过处理
						if ("true" === $(this).data("bSkipValid")) {
							return true;
						}
						if (!this.$valid) {
							setInputValid(false);
							return false;
						}
					});
					//console.log(getInputValid());
				};

				// 显示边框提示
				var showBorderTip = function () {
					if (!elm.$valid) {
						elm.addClass("inputValidError");
					} else {
						elm.removeClass("inputValidError");
					}
				};

				// 隐藏边框提示
				var hideBorderTip = function () {
					elm.removeClass("inputValidError");
				};

				// 显示图标提示
				var showIconTip = function () {
					if (!elm.$valid) {
						showTip("error");
					} else {
						showTip("success");
					}
				};

				// 隐藏图标提示
				var hideIconTip = function () {
					var oTipDiv = $(elm).data("validTipDiv");
					if (angular.isDefined(oTipDiv)) {
						oTipDiv.hide();
					}
				};

				// 显示提示
				var showTip = function (szType) {
					var oTipDiv = $(elm).data("validTipDiv"),
						szTip = $(elm).data("validTip");

					if (angular.isUndefined(szTip)) {
						szTip = "";
					}
					var oPos = $(elm).position(),
						iElmWidth = $(elm).parent().outerWidth();

					if ($.dialog.list["dialoghtml"] || $(elm).parents(".guide-view").length > 0) {// 弹出框、向导的时候
						oPos.top = oPos.top - 10;
						oPos.left = oPos.left - 15;
					}
					if (angular.isUndefined(oTipDiv)) {
						oTipDiv = $("<div class='inputValidTip'><i class='" + szType + "'></i><label>" + szTip + "</label></div>");
						//$(elm).parent().append(oTipDiv);

						oTipDiv.css({
							position: "absolute",
							left: (oPos.left + iElmWidth + 15) + "px",
							top: oPos.top + (("error" == szType) ? 10 : 12) + "px"
						});
						if ($.dialog.list["dialoghtml"]) {// 弹出框的时候
							$(".aui_content").eq(0).append(oTipDiv);//eq(0) 必须要加，因为当添加成功后，右下角提示框也是artDialog模拟出来的，5秒后消失，再次点击弹出框时页面中有两个class='aui_content'
						} else if ($(elm).parents(".guide-view").length > 0) {
							$(".guide-view").eq(0).append(oTipDiv);
						} else {
							$("#view").append(oTipDiv);
						}

						$(elm).data("validTipDiv", oTipDiv);
					} else {
						oTipDiv.find("i").eq(0).removeClass().addClass(szType);
						oTipDiv.find("label").eq(0).text(szTip);
					}
					if ("error" == szType) {
						oTipDiv.css("top", (oPos.top + 10) + "px");
						oTipDiv.addClass("border").show();// 向导指令中可能会把提示Div隐藏
					} else {
						oTipDiv.css("top", (oPos.top + 12) + "px");
						oTipDiv.removeClass("border").show();// 向导指令中可能会把提示Div隐藏
					}
				};

				// 隐藏提示
				var hideTip = function () {
					var oTipDiv = $(elm).data("validTipDiv");

					if (angular.isDefined(oTipDiv)) {// 跳过验证，隐藏提示
						oTipDiv.hide();
						//曾经校验过,设置为跳过时,输入框的红色边框也要去掉
						elm.removeClass("inputValidError");
					}

					/*if (angular.isDefined(oTipDiv)) {
						oTipDiv.remove();
						elm.removeData("validTipDiv");
						elm.removeClass("inputValidError");
						elm.$valid = null;
					}*/
				};

				// 值效验
				var isValue = function () {
					var mixValue, mixValue2,
						bFloatValue = !!oInputValid.bFloatValue;
					if (bFloatValue) {
						mixValue = angular.isDefined(oInputValid.oMinValue) && parseFloat(oInputValid.oMinValue.value);
						mixValue2 = parseFloat(ngModel.$viewValue);
					} else {
						mixValue = angular.isDefined(oInputValid.oMinValue) && parseInt(oInputValid.oMinValue.value, 10);
						mixValue2 = parseInt(ngModel.$viewValue, 10);
					}
					if (angular.isDefined(oInputValid.oMinValue) && mixValue >= 0 && !oUtils.isEmpty(ngModel.$viewValue)) {
						if (!bFloatValue && !oUtils.isInt(ngModel.$viewValue)) {// 输入的值不是整型
							elm.$valid = false;
						} else if (bFloatValue && !oUtils.isNumber(ngModel.$viewValue)) {// 输入的值不是数字
							elm.$valid = false;
						} else {
							if (mixValue2 < mixValue) {
								elm.$valid = false;
							}
						}
					}
					if (!elm.$valid && bFirstTip) {
						$(elm).data("validTip", oInputValid.oMinValue.error);
						bFirstTip = false;
					}

					if (bFloatValue) {
						mixValue = angular.isDefined(oInputValid.oMaxValue) && parseFloat(oInputValid.oMaxValue.value);
					} else {
						mixValue = angular.isDefined(oInputValid.oMaxValue) && parseInt(oInputValid.oMaxValue.value, 10);
					}
					if (angular.isDefined(oInputValid.oMaxValue) && mixValue >= 0 && !oUtils.isEmpty(ngModel.$viewValue)) {
						if (!bFloatValue && !oUtils.isInt(ngModel.$viewValue)) {// 输入的值不是整型
							elm.$valid = false;
						} else if (bFloatValue && !oUtils.isNumber(ngModel.$viewValue)) {// 输入的值不是数字
							elm.$valid = false;
						} else {
							if (mixValue2 > mixValue) {
								elm.$valid = false;
							}
						}
					}
					if (!elm.$valid && bFirstTip) {
						$(elm).data("validTip", oInputValid.oMaxValue.error);
						bFirstTip = false;
					}
				};

				// 长度效验
				var isLength = function () {
					if (angular.isDefined(oInputValid.oMinLength) && parseInt(oInputValid.oMinLength.value, 10) > 0 && !oUtils.isEmpty(ngModel.$viewValue)) {
						if (oUtils.lengthw(ngModel.$viewValue) < parseInt(oInputValid.oMinLength.value, 10)) {
							elm.$valid = false;
							if (bFirstTip) {
								$(elm).data("validTip", oInputValid.oMinLength.error);
								bFirstTip = false;
							}
							return;
						}
					}
					if (angular.isDefined(oInputValid.oMaxLength) && parseInt(oInputValid.oMaxLength.value, 10) > 0 && !oUtils.isEmpty(ngModel.$viewValue)) {
						if (oUtils.lengthw(ngModel.$viewValue) > parseInt(oInputValid.oMaxLength.value, 10)) {
							elm.$valid = false;
							if (bFirstTip) {
								$(elm).data("validTip", oInputValid.oMaxLength.error);
								bFirstTip = false;
							}
						}
					}
				};

				// 正则效验
				var isRegex = function () {
					if (angular.isDefined(oInputValid.aRegex) && oInputValid.aRegex.length > 0 && !oUtils.isEmpty(ngModel.$viewValue)) {
						$.each(oInputValid.aRegex, function () {
							if (!oUtils.regexTest(ngModel.$viewValue, this.value)) {
								elm.$valid = false;
								if (bFirstTip) {
									$(elm).data("validTip", this.error);
									bFirstTip = false;
								}
								return false;
							}
						});
					}
				};

				// 特殊字符效验 / \ : * ? ' " < > | %
				var isSpecChar = function () {
					if (angular.isDefined(oInputValid.oSpecChar) && false === oInputValid.oSpecChar.value && !oUtils.isEmpty(ngModel.$viewValue) && oUtils.isSpecChar(ngModel.$viewValue)) {
						elm.$valid = false;
						if (bFirstTip) {
							$(elm).data("validTip", oInputValid.oSpecChar.error);
							bFirstTip = false;
						}
					}
				};

				// 中文效验
				var isChinese = function () {
					if (angular.isDefined(oInputValid.oChinese) && false === oInputValid.oChinese.value && !oUtils.isEmpty(ngModel.$viewValue) && oUtils.isChinese(ngModel.$viewValue)) {
						elm.$valid = false;
						if (bFirstTip) {
							$(elm).data("validTip", oInputValid.oChinese.error);
							bFirstTip = false;
						}
					}
				};

				// 空值效验
				var isEmpty = function () {
					if (angular.isDefined(oInputValid.oEmpty) && false === oInputValid.oEmpty.value && oUtils.isEmpty(ngModel.$viewValue)) {
						elm.$valid = false;
						if (bFirstTip) {
							$(elm).data("validTip", oInputValid.oEmpty.error);
							bFirstTip = false;
						}
					}
				};
				//单播地址
				var isUnicast = function () {
					if (angular.isDefined(oInputValid.oUnicast) && false === oInputValid.oUnicast.value && !oUtils.isDIPAddress(ngModel.$viewValue) && !oUtils.isEmpty(ngModel.$viewValue)) {
						elm.$valid = false;
						if (bFirstTip) {
							$(elm).data("validTip", oInputValid.oUnicast.error);
							bFirstTip = false;
						}
					}
				};
				// 类型效验
				var isTypeValid = function () {
					if (angular.isDefined(oInputValid.oType)) {
						switch (oInputValid.oType.value) {
							case "email":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isEmail(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "url":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isURL(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "ip":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isIPAddress(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "ipv4":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isIPv4Address(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "ipv6":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isIPv6Address(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "multicast":  //后端用
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isMulticastAddress(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "ipcmulticast":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isIPv6Address(ngModel.$viewValue) && !oUtils.isMulticastAddress(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "domain":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isDomain(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "hiddns":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isHiDDNS(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "mask":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isIpMask(ngModel.$viewValue)) {
									elm.$valid = false;
								}
								break;
							case "rtsp":
								var iRtspNo = Number(ngModel.$viewValue, 10);
								if (!(iRtspNo === 554 || (iRtspNo >= 1024 && iRtspNo <= 65535))) {
									elm.$valid = false;
								}
								break;
							case "country":
								if (!oUtils.isEmpty(ngModel.$viewValue) && !oUtils.isCountry(ngModel.$viewValue) || !(ngModel.$viewValue.length === 2)) {
									elm.$valid = false;
								}
								break;
                            case "unicastIPv6":
                                if (!oUtils.isEmpty(ngModel.$viewValue) && !(oUtils.isDIPAddress(ngModel.$viewValue) || oUtils.isIPv6Address(ngModel.$viewValue))) {
                                    elm.$valid = false;
                                }
                                break;
							case "null":  //动态改变为不需要验证
								break;
							default:
								if (!oUtils.isEmpty(oInputValid.oType.value)) {// 其他非常规验证
									if (!angular.isFunction(scope[oInputValid.oType.value])) {
										alert("$scope." + oInputValid.oType.value + " is undefined!");
										return;
									}
									var oRes = scope[oInputValid.oType.value](ngModel.$viewValue);
									if (!oRes.bValid) {
										elm.$valid = false;
										if (bFirstTip) {
											$(elm).data("validTip", oRes.szError);
											bFirstTip = false;
										}
									}
								} else {
									// do nothing
								}
								break;
						}
						if (!elm.$valid && bFirstTip) {
							$(elm).data("validTip", oInputValid.oType.error);
							bFirstTip = false;
						}
					}
				};
			}
		}
	});
/** example:
 * 	<button ui-title=""></button>
 */
angular.module("ui.config.title", [])
	.directive("uiTitle", function(){
		return {
			link: function(scope, element, attr) {
				scope.$watch(attr.uiTitle, function(to){
                    if(!to) {
                        return;
                    }
					angular.element(element).attr('title', to.toString());
				})
			}
		}
	})
/** example:
 * 	<input type="text" ng-model="" color-picker>
 */
angular.module("ui.config.colorPicker", [])
	.directive("colorPicker", function(){
		var imageUrl = '../ui/images/color.png';
		function showColorPicker(elm, ngModel, scope) {
			var eICP = angular.element(elm).offset();
			angular.element("#iColorPicker").css({
				'top': eICP.top + (angular.element(elm).outerHeight()) + "px",
				'left': eICP.left + "px",
				'position': 'absolute'
			}).fadeIn("fast");
			angular.element("#iColorPickerBg").css({
				'position': 'absolute',
				'top': 0,
				'left': 0,
				'width': '100%',
				'height': '100%',
				'z-index': 9998,
				'background':"url(../ui/images/goto-icons.png) 10px 50% no-repeat"
			}).fadeIn("fast");
			angular.element("#hexSection0 td").unbind().bind({
				mouseover: function() {
					angular.element('#colorPreview').css('background', "#" + angular.element(this).attr("hx"));
				},
				click: function() {
					ngModel.$setViewValue(angular.element(this).attr('hx'));
					angular.element("#iColorPickerBg").hide();
					angular.element("#iColorPicker").fadeOut();
				}
			})
		}
		if (angular.element(document.body).children("#iColorPicker").length === 0) {
			angular.element(document.createElement("div")).attr("id", "iColorPicker").css('display', 'none').html(
			'<table class="pickerTable" id="pickerTable0"><thead id="hexSection0">' 
				+ '<tr>' 
					+ '<td style="background:#f00000" hx="f00000"></td><td style="background:#ffff00" hx="ffff00"></td>' 
					+ '<td style="background:#00ff00" hx="00ff00"></td><td style="background:#00ffff" hx="00ffff"></td>' 
					+ '<td style="background:#0000ff" hx="0000ff"></td><td style="background:#ff00ff" hx="ff00ff"></td>' 
					+ '<td style="background:#ffffff" hx="ffffff"></td><td style="background:#ebebeb" hx="ebebeb"></td>' 
					+ '<td style="background:#e1e1e1" hx="e1e1e1"></td><td style="background:#d7d7d7" hx="d7d7d7"></td>' 
					+ '<td style="background:#cccccc" hx="cccccc"></td><td style="background:#c2c2c2" hx="c2c2c2"></td>' 
					+ '<td style="background:#b7b7b7" hx="b7b7b7"></td><td style="background:#acacac" hx="acacac"></td>' 
					+ '<td style="background:#a0a0a0" hx="a0a0a0"></td><td style="background:#959595" hx="959595"></td>'
				+ '</tr>'
				+ '<tr>' 
					+ '<td style="background:#ee1d24" hx="ee1d24"></td><td style="background:#fff100" hx="fff100"></td>' 
					+ '<td style="background:#00a650" hx="00a650"></td><td style="background:#00aeef" hx="00aeef"></td>' 
					+ '<td style="background:#2f3192" hx="2f3192"></td><td style="background:#ed008c" hx="ed008c"></td>' 
					+ '<td style="background:#898989" hx="898989"></td><td style="background:#7d7d7d" hx="7d7d7d"></td>' 
					+ '<td style="background:#707070" hx="707070"></td><td style="background:#626262" hx="626262"></td>' 
					+ '<td style="background:#555555" hx="555555"></td><td style="background:#464646" hx="464646"></td>' 
					+ '<td style="background:#363636" hx="363636"></td><td style="background:#262626" hx="262626"></td>' 
					+ '<td style="background:#111111" hx="111111"></td><td style="background:#000000" hx="000000"></td>'
				+ '</tr>'
				+ '<tr>'
					+ '<td style="background:#f7977a" hx="f7977a"></td><td style="background:#fbad82" hx="fbad82"></td>' 
					+ '<td style="background:#fdc68c" hx="fdc68c"></td><td style="background:#fff799" hx="fff799"></td>' 
					+ '<td style="background:#c6df9c" hx="c6df9c"></td><td style="background:#a4d49d" hx="a4d49d"></td>' 
					+ '<td style="background:#81ca9d" hx="81ca9d"></td><td style="background:#7bcdc9" hx="7bcdc9"></td>' 
					+ '<td style="background:#6ccff7" hx="6ccff7"></td><td style="background:#7ca6d8" hx="7ca6d8"></td>' 
					+ '<td style="background:#8293ca" hx="8293ca"></td><td style="background:#8881be" hx="8881be"></td>' 
					+ '<td style="background:#a286bd" hx="a286bd"></td><td style="background:#bc8cbf" hx="bc8cbf"></td>' 
					+ '<td style="background:#f49bc1" hx="f49bc1"></td><td style="background:#f5999d" hx="f5999d"></td>'
				+ '</tr>' 
				+ '<tr>' 
					+ '<td style="background:#f16c4d" hx="f16c4d"></td><td style="background:#f68e54" hx="f68e54"></td>' 
					+ '<td style="background:#fbaf5a" hx="fbaf5a"></td><td style="background:#fff467" hx="fff467"></td>' 
					+ '<td style="background:#acd372" hx="acd372"></td><td style="background:#7dc473" hx="7dc473"></td>' 
					+ '<td style="background:#39b778" hx="39b778"></td><td style="background:#16bcb4" hx="16bcb4"></td>' 
					+ '<td style="background:#00bff3" hx="00bff3"></td><td style="background:#438ccb" hx="438ccb"></td>' 
					+ '<td style="background:#5573b7" hx="5573b7"></td><td style="background:#5e5ca7" hx="5e5ca7"></td>' 
					+ '<td style="background:#855fa8" hx="855fa8"></td><td style="background:#a763a9" hx="a763a9"></td>' 
					+ '<td style="background:#ef6ea8" hx="ef6ea8"></td><td style="background:#f16d7e" hx="f16d7e"></td>' 
				+ '</tr>'
				+ '<tr>' 
					+ '<td style="background:#ee1d24" hx="ee1d24"></td><td style="background:#f16522" hx="f16522"></td>' 
					+ '<td style="background:#f7941d" hx="f7941d"></td><td style="background:#fff100" hx="fff100"></td>' 
					+ '<td style="background:#8fc63d" hx="8fc63d"></td><td style="background:#37b44a" hx="37b44a"></td>' 
					+ '<td style="background:#00a650" hx="00a650"></td><td style="background:#00a99e" hx="00a99e"></td>' 
					+ '<td style="background:#00aeef" hx="00aeef"></td><td style="background:#0072bc" hx="0072bc"></td>' 
					+ '<td style="background:#0054a5" hx="0054a5"></td><td style="background:#2f3192" hx="2f3192"></td>' 
					+ '<td style="background:#652c91" hx="652c91"></td><td style="background:#91278f" hx="91278f"></td>' 
					+ '<td style="background:#ed008c" hx="ed008c"></td><td style="background:#ee105a" hx="ee105a"></td>' 
				+ '</tr>' 
				+ '<tr>' 
					+ '<td style="background:#9d0a0f" hx="9d0a0f"></td><td style="background:#a1410d" hx="a1410d"></td>' 
					+ '<td style="background:#a36209" hx="a36209"></td><td style="background:#aba000" hx="aba000"></td>' 
					+ '<td style="background:#588528" hx="588528"></td><td style="background:#197b30" hx="197b30"></td>' 
					+ '<td style="background:#007236" hx="007236"></td><td style="background:#00736a" hx="00736a"></td>' 
					+ '<td style="background:#0076a4" hx="0076a4"></td><td style="background:#004a80" hx="004a80"></td>' 
					+ '<td style="background:#003370" hx="003370"></td><td style="background:#1d1363" hx="1d1363"></td>' 
					+ '<td style="background:#450e61" hx="450e61"></td><td style="background:#62055f" hx="62055f"></td>' 
					+ '<td style="background:#9e005c" hx="9e005c"></td><td style="background:#9d0039" hx="9d0039"></td>' 
				+ '</tr>' 
				+ '<tr>' 
					+ '<td style="background:#790000" hx="790000"></td><td style="background:#7b3000" hx="7b3000"></td>'
					+ '<td style="background:#7c4900" hx="7c4900"></td><td style="background:#827a00" hx="827a00"></td>' 
					+ '<td style="background:#3e6617" hx="3e6617"></td><td style="background:#045f20" hx="045f20"></td>' 
					+ '<td style="background:#005824" hx="005824"></td><td style="background:#005951" hx="005951"></td>' 
					+ '<td style="background:#005b7e" hx="005b7e"></td><td style="background:#003562" hx="003562"></td>' 
					+ '<td style="background:#002056" hx="002056"></td><td style="background:#0c004b" hx="0c004b"></td>' 
					+ '<td style="background:#30004a" hx="30004a"></td><td style="background:#4b0048" hx="4b0048"></td>' 
					+ '<td style="background:#7a0045" hx="7a0045"></td><td style="background:#7a0026" hx="7a0026"></td>'
				+ '</tr>' 
			+ '</thead>'
			+ '<tbody>'
				+ '<tr><td style="border:1px solid #000;background:#fff;cursor:pointer;height:60px;-moz-background-clip:-moz-initial;-moz-background-origin:-moz-initial;-moz-background-inline-policy:-moz-initial;" colspan="16" align="center" id="colorPreview"></td></tr>' 
			+ '</tbody>'
			+ '</table>').appendTo("body");
			angular.element(document.createElement("div")).attr("id", "iColorPickerBg").click(function () {
				angular.element("#iColorPickerBg").hide();
				angular.element("#iColorPicker").fadeOut();
			}).appendTo("body");
			jQuery('table.pickerTable td').css({
				'width': '12px',
				'height': '14px',
				'border': '1px solid #000',
				'cursor': 'pointer'
			});
			jQuery('#iColorPicker table.pickerTable').css({
				'border-collapse': 'collapse'
			});
			jQuery('#iColorPicker').css({
				'border': '1px solid #ccc',
				'background': '#333',
				'padding': '5px',
				'color': '#fff',
				'z-index': 9999
			})
		}
		jQuery('#colorPreview').css({
			'height': '50px'
		});
		return {
			require: "ngModel",
			link: function(scope, element, attr, ngModel) {
				angular.element('<a class="inputcolorPicker" href="javascript:;"><img src="' + imageUrl + '" style="border:0;margin:0 0 0 3px;vertical-align: -3px;" align="absmiddle" ></a>').insertAfter(element).add(element).bind({
					click: function() {
						showColorPicker(element, ngModel);
					},
					focus: function() {
						angular.element(this).blur();
					}
				});
				function changeColor() {
					element.val('');
					element.css("background", "#" + ngModel.$modelValue);
				}
				ngModel.$formatters.push(changeColor);
				ngModel.$viewChangeListeners.push(changeColor);
			}
		}
	})

/** example:
 * 	<span number width="75" num-value="oInfo.szHour" min="0" max="24" num-disabled="true" on-change="onChange"></span>
 */
angular.module("ui.config.number", [])
	.controller('numberController', function ($scope) {
		$scope.$watch("numValue", function (to) {
			if (angular.isDefined(to)) {
				var iVal = parseInt($scope.numValue, 10);
				if ($scope.max && iVal > $scope.max) {
					$scope.numValue = $scope.min;
				}
				if ($scope.min && iVal < $scope.min) {
					$scope.numValue = $scope.max;
				}
				if ($scope.onChange) {
					$scope.onChange(to);
				}
			}
		});
		$scope.numberKeyDown = function (event) {
			var iKeyCode = event.which;
			if (iKeyCode == 8 || iKeyCode == 13 || iKeyCode == 17 || (iKeyCode > 36 && iKeyCode < 41) || iKeyCode == 46) {// 退格键、回车键、Ctrl键、方向键、Delete键
				return true;
			}
			if ((iKeyCode < 96 || iKeyCode > 105) && (iKeyCode < 48 || iKeyCode > 57 || event.shiftKey)) {// 0-9
				event.preventDefault();
			}
		};
		$scope.numberClick = function (szType) {
			if ($scope.numDisabled) {
				return;
			}
			var iVal = parseInt($scope.numValue, 10);
			if (isNaN(iVal)) {
				$scope.numValue = 0;
				return;
			}
			if ("+" == szType) {
				$scope.numValue++;
			} else {
				$scope.numValue--;
			}
		};
	})
	.directive("number", function ($compile) {
		return {
			restrict: "A",
			scope: {
				width: "@",
				numDisabled: "=",
				numValue: "=",
				min: "@",
				max: "@",
				onChange: "="
			},
			require: 'number',
			controller: 'numberController',
			link: function (scope, element, attrs) {
				var iWidth = parseInt(scope.width, 10) ? scope.width : 75;

				var szTemplate = "<div class='number'><input type='text' class='input' style='width:" + iWidth + "px;' ng-model='numValue' ng-disabled='numDisabled' ng-keydown='numberKeyDown($event)' onpaste='return false;' /><i class='arrow up' onselectstart='return false;' ng-click='numberClick(\"+\")'></i><i class='arrow down' onselectstart='return false;' ng-click='numberClick(\"-\")'></i></div>";

				var $element = $compile(szTemplate)(scope);
				element.replaceWith($element);
			}
		}
	});
/** example:
 * 	<select ie-select-fix=""></select>
 */
angular.module("ui.config.select", [])
	.directive('ieSelectFix', ['$document',
		function($document) {
			return {
				restrict: 'A',
				//require: 'ngModel',
				link: function(scope, element, attributes, ngModelCtrl) {
					var isIE = $document[0] && $document[0].attachEvent;
					if (!isIE) return;

					var control = element[0];
					//to fix IE8 issue with parent and detail controller, we need to depend on the parent controller
					var fCancelWatch = scope.$watch(attributes.ieSelectFix, function() {
						// setTimeout is needed starting from angular 1.3+
						//setTimeout(function() {
							//this will add and remove the options to trigger the rendering in IE8
							var option = document.createElement("option");
							control.add(option, null);
							control.remove(control.options.length - 1);
							//取消watch
							fCancelWatch();
						//}, 0);
					});
				}
			}
		}
	]);