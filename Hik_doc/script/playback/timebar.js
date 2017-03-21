define(function(require, exports, module) {
	var _oUtils, _oTranslator, _oOption, _oTimebar, _iSpanType, _oService;
	
	_oUtils = require("utils");
    _oTranslator = require("translator");

	_oService = require("service");

	_oTimebar = null;// 时间条对象
	_iSpanType = 7;// 时间条放大缩小倍数

	function Timebar() {
		_oOption = {
			onTimebarMouseUp: null
		};
	}

	Timebar.prototype = {
		// 初始化
		init: function (szID, oOption) {
			var oTimebarApp = angular.module("timebarApp", []),
				self = this;

			// 可选参数合并
			$.extend(_oOption, oOption);

			oTimebarApp.controller("timebarController", function ($scope) {
                $scope.oLanTimebar = _oTranslator.oLastLanguage;

				// 时间条加载后触发
				$scope.timebarLoaded = function () {
					_oService.m_oLoaded.bTimebar = true;
					if (!$.browser.msie) {
						$("#playbackbar_div").html("<canvas id='playbackbar'></canvas>");
						var canvas = $("#playbackbar").get(0);
						if (canvas.getContext) {
							_oTimebar = new TimeBar(canvas, $("#playbackbar_div").width(), $("#playbackbar_div").height());
							_oTimebar.setMouseUpCallback(function () {
								self.timebarMouseUp();
							});
						}
					} else {
						$("#playbackbar_div").html("<object classid='clsid:E7EF736D-B4E6-4A5A-BA94-732D71107808' codebase='' standby='Waiting...' id='playbackbar' name='timebar' align='center' width='100%' height='100%'><param name='activextype' value='3'></object>");
						_oTimebar = $("#playbackbar").get(0);
						self.initPluginEvent();
					}
				};

				// 缩小时间条
				$scope.narrow = function () {
					_iSpanType--;
					if (_iSpanType < 6) {
						_iSpanType = 6;
						return;
					}
					if (_oTimebar) {
						_oTimebar.SetSpantype(_iSpanType);
					}
				};

				// 扩大时间条
				$scope.expand = function () {
					_iSpanType++;
					if (_iSpanType > 12) {
						_iSpanType = 12;
						return;
					}
					if (_oTimebar) {
						_oTimebar.SetSpantype(_iSpanType);
					}
				};
			});

			angular.bootstrap(angular.element("#" + szID), ["timebarApp"]);
		},
		// 初始化插件事件
		initPluginEvent: function () {
			var self = this;

			window.TimebarMouseUp = function (szMidTime) {
				if (_oOption.onTimebarMouseUp) {
					_oOption.onTimebarMouseUp(szMidTime);
				}
			};
		},
		// 时间条鼠标弹起
		timebarMouseUp: function () {
			var self = this;

			if (_oOption.onTimebarMouseUp) {
				_oOption.onTimebarMouseUp(self.getPlayBackTime());
			}
		},
		// 改变大小
		resize: function () {
			var self = this;

			if (_oTimebar && !$.browser.msie) {
				_oTimebar.resize($("#playbackbar_div").width(), $("#playbackbar_div").height());
			}
		},
		// 清空指定窗口文件列表
		clearWndFileList: function (iWndIndex) {
			var self = this;
			
			if (_oTimebar) {
				_oTimebar.clearWndFileList(iWndIndex);
			}
		},
		// 重绘时间条
		repaint: function () {
			var self = this;
			
			if (_oTimebar) {
				_oTimebar.repaint();
			}
		},
		// 添加文件到时间条
		addFileToTimeBar: function (oXmlDoc, iCurWnd) {
			var self = this;

			if ($.browser.msie) {
				var szResXml = _oUtils.xmlToStr(oXmlDoc);
				_oTimebar.AddFileList(szResXml, iCurWnd);
			} else {
				for (var i = 0, iLen =  $(oXmlDoc).find("searchMatchItem").length; i < iLen; i++) {
					var szStartTime = $(oXmlDoc).find("startTime").eq(i).text(),
						szStopTime = $(oXmlDoc).find("endTime").eq(i).text(),
						iType = 2,
						szType = $(oXmlDoc).find("metadataDescriptor").eq(i).text().split("/");

					if (szType[1] === "timing") {
						iType = 1;
					} else if(szType[1] === "manual") {
						iType = 4;
					} else if(szType[1] === "motion" || szType[1] === "alarm" || szType[1] === "motionOrAlarm" || szType[1] === "motionAndAlarm" || szType[1] === "smart") {
						iType = 2;
					} else if(szType[1] === "command") {
						iType = 3;
					}
					_oTimebar.addFile((szStartTime.replace("T", " ")).replace("Z", ""), (szStopTime.replace("T", " ")).replace("Z", ""), iType);
				}
				self.repaint();
			}
		},
        // 设置选中窗口索引
        setSelWndIndex: function (iWndIndex) {
            var self = this;

			_oTimebar.m_iSelWnd = iWndIndex;
        },
        // 设置时间条中间时间
        setMidLineTime: function (szTime) {
            var self = this;

			if (_oTimebar) {
				_oTimebar.setMidLineTime(szTime);
			}
        },
		// 获取回放时间
		getPlayBackTime: function () {
			var self = this,
				szTime = "";

			if (_oTimebar) {
				if ($.browser.msie) {
					szTime = _oTimebar.GetPlayBackTime();
				} else {
					szTime = _oTimebar.m_tCurrentMidTime.getStringTime();
				}
			}

			return szTime;
		},
		// 获取鼠标是否按下
		getMouseDown: function () {
			var self = this,
				bMouseDown = false;

			if (_oTimebar) {
				if ($.browser.msie) {
					bMouseDown = _oTimebar.GetMouseDown();
				} else {
					bMouseDown = _oTimebar.m_bMOuseDown;
				}
			}

			return bMouseDown;
		},
		// 设置时间条的显示样式
		setSpanType: function () {
			var self = this;

			if (_oTimebar) {
				_oTimebar.SetSpantype(_iSpanType);
			}
		}
	};

	module.exports = new Timebar();
});