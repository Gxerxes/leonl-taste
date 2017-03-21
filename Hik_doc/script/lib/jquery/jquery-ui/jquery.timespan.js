/*****************************************************
 FileName: TimePlan
 Description: 时间计划
 Author: Xufeng
 Date: 2014.08.02
 *****************************************************/
define(function (require) {
	var jQuery = require("jquery");
	var _oDialog = require("dialog");

	(function($) {
		$.fn.TimePlan = function(options) {
			options = $.extend({
				sectionNum: 8,		// 每天最多能画时间段
				data: null,		// json数据
				mode: 0,			// 普通模式：0 高级模式：1 （录像计划时使用）
				holiday: false,	// 是否支持假日
				types: null,		// 绘制类型
				lan: null,			// 语言资源
				editable: true,	// 是否可编辑
				onAdvanced: null,	// 高级参数按钮回调
				onScenceCfg: null,	// 场景巡航布放时间配置（取证模块使用）
				oAlarmOutNum: {"patrol": 8, "pattern": 4, "preset": 8, "auxoutput": 2}
			}, options);

			$.extend(this, {
				id: $(this).attr("id"),
				prefix: "timeplan_",		// 前缀修正
				minuteWidth: 0.4,			// 每分钟对应宽度
				minClientX: 0,				// X轴最小坐标
				maxClientX: 0,				// X轴最大坐标
				drawSection: null,		// 正在画的时间段
				drawStartClientX: 0,		// 正在画的时间段开始坐标
				drawEndClientX: 0,		// 正在画的时间段结束坐标
				dayTimePlans: [],			// 时间条画布对象数组
				setType: function (aType) {	// 设置类型
					m_aType = aType;
					createDrawType();
				},
				setData: function (oData) {	// 设置数据
					m_aData = oData;
					drawPlanTimes();
				},
				setSectionNum: function (iNum) {// 修改可画的时间段数量
                    options.sectionNum = iNum;
                },
                setAlarmOutNum: function (oAlarmOutNum) {//修改PTZ能力，PTZ的定时任务时间段编辑需要用到
                	options.oAlarmOutNum = oAlarmOutNum;
                },
				setEditable: function (bEdit) {// 设置是否可编辑
					options.editable = bEdit;
					maskPlanTimes();
				}/*,
				getData: function () {// 获取修改后的数据
					m_aData = [];
					$.each(m_aDaySection, function (day) {
						m_aData[day] = [];
						$.each(this, function (i) {
							m_aData[day][i] = {
								type: this.type,
								sTime: pxToTime(this.start),
								eTime: pxToTime(this.end)
							};
						});
					});
					return m_aData;
				}*/
			});

			var me = this;
			var m_oColors = {	// 画笔颜色类型
				"CMR": "#637DEC",						// 定时
				"MOTION": "#74B557",					// 移动侦测
				"ALARM": "#B83F42",					// 报警
				"EDR": "#E58805",						// 动测或报警
				"ALARMANDMOTION": "#B9E2FE",		// 动测和报警
				"COMMAND": "#15B89B", //前端用Command// 命令触发
				"SMART": "#F66D72",					// Smart
				"AllEvent": "#AA6FFE",				// 事件
				"SCENE1": "#637DEC",					// 场景1
				"SCENE2": "#74B557",					// 场景2
				"SCENE3": "#B83F42",					// 场景3
				"SCENE4": "#E58805",					// 场景4,
				"disable": "#808080",                // 关闭
				"autoscan": "#637DEC",               // 自动扫描
				"framescan": "#74B557",              // 帧扫描
				"randomscan": "#E58805",             // 随机扫描
				"patrol": "#B9E2FE",                 // 巡航扫描
				"pattern": "#15B89B",                // 花样扫描
				"preset": "#F66D72",                 // 预置点
				"panoramascan": "#8C97CB",          // 全景扫描
				"tiltscan": "#5F52A0",               // 垂直扫描
				"periodreboot": "#EC6941",          // 球机重启
				"periodadjust": "#419923",          // 球机校验
				"auxoutput": "#16A1E0"              // 辅助输出
			};
			var m_aMergeType = [	// 类型合并，界面统一显示为AllEvent
				"LineDetection",
				"FieldDetection",
				"AudioDetection",
				"facedetection",
				"regionEntrance",
				"regionExiting",
				"loitering",
				"group",
				"rapidMove",
				"parking",
				"unattendedBaggage",
				"attendedBaggage",
				"scenechangedetection",
                "pir",
                "wlsensor",
                "callhelp",
                "INTELLIGENT"
			];

			var m_aType = null;			// 所有类型
			var m_aData = null;			// 所有时间段
			var m_aDaySection = [];			// 每天的画块
			var m_oSelSection = null;		// 当前画布上选中的时间段
			var m_timeTip = null;			// 时间提示框
			var m_szDrawType = "CMR";		// 画布类型，默认为定时
			var m_bMouseDown = false;		// 鼠标按下标识
			var m_iDrawStart = -1;			// 保存画块的起始索引
			var m_iSelDay = -1;				// 选中的星期
			var m_oCopyToSelect = null;	// 复制到选择框
			var m_oMoveSection = null;		// 移动时间段对象
			var m_oMoveData = null;		// 移动时间段原始数据对象
			var m_oMoveRange = {};			// 移动范围
			var m_oSectionPos = null;		// 移动后的时间段位置
			var m_szResizeDirect = "";		// 拉伸方向

			// 生成时间计划
			var szHtml = '<div class="' + this.prefix + 'btns">' +
							'<div class="' + this.prefix + 'btn"><select id="' + this.id + '_drawTypeSel" style="display:none;"></select></div>' +
							'<div class="' + this.prefix + 'btn"><button type="button" class="btn noBorder" id="' + this.id + '_delete"><span class="delete">&nbsp;</span><span id="' + this.id + '_delete_txt">删除</span></button></div>' +
							'<div class="' + this.prefix + 'btn"><button type="button" class="btn noBorder" id="' + this.id + '_deleteAll"><span class="deleteAll">&nbsp;</span><span id="' + this.id + '_deleteAll_txt">删除全部</span></button></div>' +
							//'<div class="' + this.prefix + 'btn"><button type="button" class="btn noBorder" id="' + this.id + '_copyTo"><span class="copyTo">&nbsp;</span><span id="' + this.id + '_copyTo_txt">复制到...</span></button></div>' +
							'<div class="' + this.prefix + 'btn" style="float:right;"><button type="button" class="btn" id="' + this.id + '_advanced" style="display:none;">高级参数</button></div>' +
						'</div>' +
						'<div class="' + this.prefix + 'days" onselectstart="return false;" style="-moz-user-select:none;">' + getDayHtml() + '</div>' +
					'<div id="' + this.id + '_drawTypeShow" class="' + this.prefix + 'drawtypes"></div>' +
				'<div style="clear: both;"></div>';

			szHtml += '<div id="' + this.id + '_timeTipHover" class="' + this.prefix + 'timetip_hover"><div class="' + this.prefix + 'timetip_hover_top"></div><div class="' + this.prefix + 'timetip_hover_bottom"></div></div>';
			szHtml += '<div id="' + this.id + '_tipsLeft" class="' + this.prefix + 'tipsleft"></div>';
			szHtml += '<div id="' + this.id + '_tipsRight" class="' + this.prefix + 'tipsright"></div>';
			szHtml += '<div id="' + this.id + '_mask" class="' + this.prefix + 'mask"></div>';

			this.html(szHtml);
			this.css("position", "relative");

			if (options.types) {// 设置类型
				m_aType = options.types;
			}
			if (options.data) {// 设置数据
				m_aData = options.data;
			}

			if (1 == options.mode) {// 高级模式
				$("#" + me.id + "_advanced").show();
				$("#" + me.id + "_advanced").click(function () {
					if (options.onAdvanced) {
						options.onAdvanced();
					}
				});
			}

			if (options.holiday) {// 是否支持假日
				$("#" + me.id + "_holDayDiv").show();
			}

			// 颜色类型选择
			$("#" + me.id + "_drawTypeSel").change(function () {
				m_szDrawType = $(this).val();
			});

			// 删除按钮
			$("#" + me.id + "_delete").click(function () {
				if (m_oSelSection != null) {
					m_oSelSection.unbind().remove();
					m_timeTip.hide();

					// 内存数据处理
					var section = null;
					for (var j = 0, nLen = m_aDaySection[m_oSelSection.day].length; j < nLen; j++) {
						section = m_aDaySection[m_oSelSection.day][j];
						if (section.start == m_oSelSection.start && section.end == m_oSelSection.end) {
							// 内存处理
							m_aDaySection[m_oSelSection.day].splice(j, 1);
							// 原数据处理
							m_aData[m_oSelSection.day].splice(j, 1);
							break;
						}
					}

					m_oSelSection = null;
					$("#" + me.id + "_delete").prop("disabled", true);// 删除按钮禁用
				}
			}).prop("disabled", true);

			// 删除全部按钮
			$("#" + this.id + "_deleteAll").click(function () {
				$("#" + me.id + " ." + me.prefix + "section").unbind().remove();
				m_timeTip.hide();

				// 内存数据处理
				$.each(m_aDaySection, function (day) {
					// 内存处理
					m_aDaySection[day] = [];
					// 原数据处理
					m_aData[day] = [];
				});

				m_oSelSection = null;
				$("#" + me.id + "_delete").prop("disabled", true);// 删除按钮禁用
			});

			// 星期事件绑定
			$("#" + me.id + " ." + me.prefix + "day").each(function () {
				$(this).bind({
					mouseover: function () {
						if (m_szResizeDirect != "") {// 拉伸过程不处理
							return;
						}
						$("." + me.prefix + "copyto", this).eq(0).show();
					},
					mouseout: function () {
						if (m_szResizeDirect != "") {// 拉伸过程不处理
							return;
						}
						$("." + me.prefix + "copyto", this).eq(0).hide();
					}
				});
			});

			// 每一天后面的复制到
			$("#" + me.id + " ." + me.prefix + "copyto").each(function () {
				$(this).bind({
					mouseout: function () {
						//m_oCopyToSelect.hide();
					},
					click: function (e) {
						e.stopPropagation();

						m_iSelDay = parseInt($(this).attr("day"), 10);

						m_oCopyToSelect.css({
							left: $(this).position().left - m_oCopyToSelect.outerWidth(),
							top: $(this).position().top - m_oCopyToSelect.outerHeight() / 2 + 25
						}).show();

						var oCheckbox = $("#" + me.id + "_checkboxs");
						oCheckbox.find("." + me.prefix + "checkbox:disabled").prop("disabled", false);
						oCheckbox.find("." + me.prefix + "checkbox:checked").prop("checked", false);
						oCheckbox.find("." + me.prefix + "checkbox[day='" + m_iSelDay + "']").prop("disabled", true).prop("checked", true);

						if (m_oSelSection != null) {
							m_oSelSection.css({
								height: 16,
								border: 0
							});
							$("." + me.prefix + "resizeLeft", m_oSelSection).eq(0).hide();
							$("." + me.prefix + "resizeRight", m_oSelSection).eq(0).hide();

							m_timeTip.hide();
							m_oSelSection = null;
							$("#" + me.id + "_delete").prop("disabled", true);// 删除按钮禁用
						}
					}
				});
			});

			// 保存画条对象，监听事件
			for (var i = 0; i < 8; i++) {
				me.dayTimePlans.push($("#" + me.id + "_dayTimePlan" + i));
			}
			$.each(me.dayTimePlans, function (day) {
				$(this).bind({
					mousedown: function (e) {
						// 计算时间段范围
						me.minClientX = Math.floor(me.offset().left) + 60;
						me.maxClientX = Math.floor(me.offset().left) + 636;

						// 计算开始点
						m_iDrawStart = e.clientX - me.minClientX;
						me.drawStartClientX = m_iDrawStart;

						if (!checkSectionNum(day)) {// 检查段数
							return;
						}
						if (checkIsSection(day, m_iDrawStart)) {// 检查是否为Section
							if (m_oSelSection != null) {// 时间段边沿点击，m_oSelSection为null
								for (var j = 0, nLen = m_aDaySection[m_oSelSection.day].length; j < nLen; j++) {
									m_oMoveSection = m_aDaySection[m_oSelSection.day][j];
									if (m_oMoveSection.start == m_oSelSection.start && m_oMoveSection.end == m_oSelSection.end) {
										m_oMoveData = m_aData[m_oSelSection.day][j];

										if ((j - 1) >= 0) {// 前面还有时间段
											m_oMoveRange.min = m_aDaySection[m_oSelSection.day][j - 1].end;
										} else {
											m_oMoveRange.min = 0;
										}
										if ((j + 1) < nLen) {// 后面还有时间段
											m_oMoveRange.max = m_aDaySection[m_oSelSection.day][j + 1].start;
										} else {
											m_oMoveRange.max = 576;
										}

										break;
									}
								}
							}
						}

						$(document).bind("mousemove", function (event) {
							mousemoveEvent(event);
						});
						$(document).bind("mouseup", function (event) {
							mouseupEvent(event);
						});

						m_bMouseDown = true;
					},
					mousemove: function (e) {
						if (m_bMouseDown && me.drawSection == null && m_oMoveSection == null) {
							var start = me.drawStartClientX;
							me.drawSection = createSection(day, m_szDrawType, start);
							me.drawSection.day = day;
							$(this).append(me.drawSection);
						}
					}
				});
			});

			// document mousemove事件
			function mousemoveEvent(e) {
				if (m_bMouseDown && me.drawSection != null) {// 绘画新的时间段
					var end = Math.floor(checkDrawRange(e.clientX) - me.minClientX);

					if (end < m_iDrawStart) {// 方向不能相反
						me.drawEndClientX = me.drawStartClientX;
						return;
					}

					if (checkIsSection(me.drawSection.day, end)) {// 检查是否与Section相交
						return;
					}

					if (checkIsOverSection(me.drawSection.day, m_iDrawStart, end)) {// 检查是否覆盖Section
						return;
					}

					me.drawEndClientX = end;

					var width = me.drawEndClientX - me.drawStartClientX;
					me.drawSection.width(width);

					// 绘画时间段时两侧提示显示
					$("#" + me.id + "_tipsLeft").css({
						left: me.drawStartClientX + 42,
						top: 45 * me.drawSection.day + 40
					}).text(pxToTime(me.drawStartClientX).substring(0, 5)).show();

					$("#" + me.id + "_tipsRight").css({
						left: me.drawEndClientX + 41,
						top: 45 * me.drawSection.day + 40
					}).text(pxToTime(me.drawEndClientX).substring(0, 5)).show();
				}

				if (m_oMoveSection != null && "" == m_szResizeDirect) {// 移动时间段
					if (m_timeTip.is(":visible")) {// 隐藏时间编辑框
						m_timeTip.hide();
					}

					var offset = e.clientX - me.minClientX - m_iDrawStart;// 鼠标移动过的距离
					var iStartPx = m_oMoveSection.start + offset;// 计算时间段的开始时间
					var iEndPx = iStartPx + (m_oMoveSection.end - m_oMoveSection.start);// 计算时间段的结束时间

					if (iStartPx < m_oMoveRange.min || iEndPx > m_oMoveRange.max) {// 检查范围
						return;
					}

					// 界面显示位置更新
					m_oSelSection.css({
						left: iStartPx
					});

					// 保存时间段新的位置
					m_oSectionPos = {
						start: iStartPx,
						end: iEndPx
					};

					// 绘画时间段时两侧提示显示
					$("#" + me.id + "_tipsLeft").css({
						left: iStartPx + 42,
						top: 45 * m_oSelSection.day + 40
					}).text(pxToTime(iStartPx).substring(0, 5)).show();

					$("#" + me.id + "_tipsRight").css({
						left: iEndPx + 41,
						top: 45 * m_oSelSection.day + 40
					}).text(pxToTime(iEndPx).substring(0, 5)).show();
				}

				if (m_oMoveSection != null && m_szResizeDirect != "") {// 拉伸时间段
					if (m_timeTip.is(":visible")) {// 隐藏时间编辑框
						m_timeTip.hide();
					}
					var offset = e.clientX - me.minClientX - m_iDrawStart;// 鼠标移动过的距离
					var iStartPx, iEndPx;
					if ("left" == m_szResizeDirect) {// 向左拉伸
						iStartPx = m_oMoveSection.start + offset;// 计算时间段的开始时间
						iEndPx = m_oMoveSection.end;// 结束时间保持不变
						if (iStartPx < m_oMoveRange.min || (offset > 0 && iStartPx > (iEndPx - 5))) {// 检查范围
							return;
						}
					} else {// 向右拉伸
						iStartPx = m_oMoveSection.start;// 开始时间保持不变
						iEndPx = m_oMoveSection.end + offset;// 计算时间段的结束时间

						if (iEndPx > m_oMoveRange.max || (offset < 0 && iEndPx < (iStartPx + 5))) {// 检查范围
							return;
						}
					}

					// 界面显示位置更新
					m_oSelSection.css({
						left: iStartPx,
						width: iEndPx - iStartPx
					});

					// 保存时间段新的位置
					m_oSectionPos = {
						start: iStartPx,
						end: iEndPx
					};

					// 绘画时间段时两侧提示显示
					$("#" + me.id + "_tipsLeft").css({
						left: iStartPx + 42,
						top: 45 * m_oSelSection.day + 40
					}).text(pxToTime(iStartPx).substring(0, 5)).show();

					$("#" + me.id + "_tipsRight").css({
						left: iEndPx + 41,
						top: 45 * m_oSelSection.day + 40
					}).text(pxToTime(iEndPx).substring(0, 5)).show();
				}
			}

			// document mouseup事件
			function mouseupEvent(e) {
				// 绘画完隐藏两侧提示
				$("#" + me.id + "_tipsLeft, #" + me.id + "_tipsRight").hide();

				m_bMouseDown = false;// 是否有绘画，状态还原
				if (me.drawSection != null) {// 绘画新的时间段
					if (me.drawStartClientX == me.drawEndClientX || // 开始和结束同一个位置不算时间段
						0 == me.drawEndClientX) {// 结束位置没有获取到
						me.drawSection.unbind().remove();
						me.drawSection = null;
						return;
					}
					var sec = {
						type: m_szDrawType,
						start: me.drawStartClientX,
						end: me.drawEndClientX,
						number: "0"
					};
					if ("patrol" == m_szDrawType ||
						"pattern" == m_szDrawType ||
						"preset" == m_szDrawType ||
						"auxoutput" == m_szDrawType) {// 巡航扫描、花样扫描、预置点、辅助输出 编号，目前PTZ定时任务中用到
						sec.number = "1";
					}

					var iPos = 0,
						start = 0;
					for (var i = 0, nLen = m_aDaySection[me.drawSection.day].length; i < nLen; i++) {
						start = m_aDaySection[me.drawSection.day][i].start;
						if (me.drawStartClientX > start) {
							iPos = i + 1;
							continue;
						}
					}

					// 内存处理
					m_aDaySection[me.drawSection.day].splice(iPos, 0, sec);
					// 原数据处理
					if ("undefined" == typeof m_aData[me.drawSection.day]) {// 协议请求失败，没有生成时间段空数组，容错处理一下
						m_aData[me.drawSection.day] = [];
					}
					m_aData[me.drawSection.day].splice(iPos, 0, {
						type: sec.type,
						sTime: pxToTime(sec.start),
						eTime: pxToTime(sec.end),
						number: sec.number  // 目前PTZ定时任务中用到
					});

					me.drawSection.end = me.drawEndClientX;
					me.drawSection.sec = sec;// 保存画完后的时间段
					me.drawSection = null;

					// 重置绘画开始/结束坐标
					me.drawStartClientX = 0;
					me.drawEndClientX = 0;
				}

				if (m_oMoveSection != null && m_oSectionPos != null) {// 移动时间段
					var iStartPx = m_oSectionPos.start;
					var iEndPx = m_oSectionPos.end;

					// 内存处理
					m_oMoveSection.start = iStartPx;
					m_oMoveSection.end = iEndPx;

					// 原数据处理
					m_oMoveData.sTime = pxToTime(iStartPx);
					m_oMoveData.eTime = pxToTime(iEndPx);

					// 选中元素处理
					m_oSelSection.start = iStartPx;
					m_oSelSection.end = iEndPx;

					m_oSectionPos = null;// 逻辑处理完置为null
				}

				if (m_oMoveSection != null && m_szResizeDirect != "" && m_oSectionPos != null) {// 拉伸时间段
					var iStartPx = m_oSectionPos.start;
					var iEndPx = m_oSectionPos.end;

					// 内存处理
					m_oMoveSection.start = iStartPx;
					m_oMoveSection.end = iEndPx;

					// 原数据处理
					m_oMoveData.sTime = pxToTime(iStartPx);
					m_oMoveData.eTime = pxToTime(iEndPx);

					// 选中元素处理
					m_oSelSection.start = iStartPx;
					m_oSelSection.end = iEndPx;

					m_oSectionPos = null;// 逻辑处理完置为null
				}
				m_szResizeDirect = "";// 逻辑处理完置为null

				m_oMoveSection = null;// 逻辑处理完置为null

				$(document).unbind("mousemove");
				$(document).unbind("mouseup");
			}

			// 创建绘画类型
			function createDrawType() {
				if (null == m_aType || 0 == m_aType.length) {
					return;
				}

				// 下拉框类型选择
				var szOpt = "";
				$.each(m_aType, function () {
					szOpt += '<option value="' + this + '"></option>';
				});
				$("#" + me.id + "_drawTypeSel").empty().append(szOpt).show();

				// 类型颜色显示
				var szDiv = "";
				$.each(m_aType, function () {
					if (-1 == $.inArray(this.toString(), m_aMergeType)) {// 不在合并数组中的类型显示颜色标识
						szDiv += '<div class="drawtype"><span class="color" style="background-color:' + m_oColors[this] + '"></span><span class="txt"></span></div>';
					}
				});

				$("#" + me.id + "_drawTypeShow").empty().append(szDiv);

				setLan();
				createTimeTip();

				// 类型合并处理
				$.each(m_aType, function () {
					if ($.inArray(this.toString(), m_aMergeType) > -1) {
						$("#" + me.id + "_drawTypeSel option[value='" + this + "']").remove();
					}
				});
			}

			// 绘画时间计划
			function drawPlanTimes() {
				var section = null;

				// 清空画布
				$("#" + me.id + " ." + me.prefix + "section").unbind().remove();
				for (var i = 0; i < 8; i++) {
					m_aDaySection[i] = [];
				}
				// 点击高级参数按钮，外部$apply一下，导致画布数据重新刷新一遍，选中状态自动消失，需要做以下逻辑
				if (m_timeTip) {
					m_timeTip.hide();
				}
				m_oSelSection = null;
				$("#" + me.id + "_delete").prop("disabled", true);// 删除按钮禁用

				if (null == m_aData) {
					return;
				}

				$.each(m_aData, function (day, sections) {
					// 每天的时间段
					$.each(sections, function (index, section) {
						var sec = {};
						sec.type = section.type;
						sec.start = timeToPx(section.sTime);
						sec.end = timeToPx(section.eTime);
						sec.number = section.number || 0;// 目前PTZ定时任务中用到

						m_aDaySection[day].push(sec);

						var section = createSection(day, sec.type, sec.start, sec.end);
						section.sec = sec;
						me.dayTimePlans[day].append(section);
					});
				});
			}

			// 刷新画布
			function refreshPlanTimes() {
				// 清空画布
				$("#" + me.id + " ." + me.prefix + "section").unbind().remove();

				$.each(m_aDaySection, function (day) {
					$.each(this, function () {
						var section = createSection(day, this.type, this.start, this.end);
						section.sec = this;
						me.dayTimePlans[day].append(section);
					});
				});
			}

			// 时间转分钟
			function timeToMinute(szTime) {
				var iMinute = 0;

				if (szTime != "") {
					var aTime = szTime.split(":");
					iMinute = parseInt(aTime[0], 10) * 60 + parseInt(aTime[1], 10);
				}

				return iMinute;
			}

			// 时间转像素
			function timeToPx(szTime) {
				var iPx = 0;

				if (szTime != "") {
					var aTime = szTime.split(":");
					iPx = Math.round((parseInt(aTime[0], 10) * 60 + parseInt(aTime[1], 10)) * me.minuteWidth);
				}

				return iPx;
			}

			// 像素转时间
			function pxToTime(iPx) {
				var szTime = "";

				if (iPx >= 0) {
					var iMinute = iPx / me.minuteWidth,
						szHour = "",
						szMinute = "";

					szHour = Math.floor(iMinute / 60);
					if (szHour < 10) {
						szHour = "0" + szHour;
					}
					szMinute = Math.floor(iMinute % 60);
					if (szMinute < 10) {
						szMinute = "0" + szMinute;
					}

					szTime = szHour + ":" + szMinute + ":00";
				}

				return szTime;
			}

			// 创建时间段
			function createSection(sectionDay, sectionType, sectionStart, sectionEnd) {
				var startClientX = 0;
				var endClientX = 0;
                var szSectionCor = "";
				startClientX = sectionStart;
				if (typeof sectionEnd == "undefined") {
					endClientX = sectionStart;
				} else {
					endClientX = sectionEnd;
				}

				// 去掉小数点
				startClientX = Math.floor(startClientX);
				endClientX = Math.floor(endClientX);
                szSectionCor = m_oColors[sectionType];
                if ("undefined" == typeof szSectionCor) {
                    szSectionCor = m_oColors["AllEvent"]
                }
				var section = $("<div class='" + me.prefix + "section'><i class='" + me.prefix + "resizeLeft'></i><i class='" + me.prefix + "resizeRight'></i></div>").css({
					position: "absolute",
					left: startClientX,
					height: 16,
					width: (endClientX - startClientX) ? (endClientX - startClientX) : 1,
					background: szSectionCor,
					boxSizing: "border-box"
				});
				section.bind({
					mouseover: function () {// 时间段over的时候显示时间段提示
						if (m_bMouseDown) {// 正在绘画的时候，不出现时间段提示
							return;
						}

						var oSec = null,
							mixStartTime = "",
							mixEndTime = "";
						for (var j = 0, nLen = m_aDaySection[sectionDay].length; j < nLen; j++) {
							oSec = m_aDaySection[sectionDay][j];
							//console.log(oSec);
							if (oSec.start == section.sec.start && oSec.end == section.sec.end) {// 查找选中时间段对应的时间
								mixStartTime = m_aData[sectionDay][j].sTime;
								mixEndTime = m_aData[sectionDay][j].eTime;
								break;
							}
						}
						mixStartTime = mixStartTime.substring(0, 5);
						mixEndTime = mixEndTime.substring(0, 5);

						var oTimeTipHover = $("#" + me.id + "_timeTipHover");
						var szTipHover = "";
						if (m_aType != null && m_aType.length > 0) {
							if ("patrol" == oSec.type ||
								"pattern" == oSec.type ||
								"preset" == oSec.type ||
								"auxoutput" == oSec.type) {// 巡航扫描、花样扫描、预置点、辅助输出 编号，目前PTZ定时任务中用到
								szTipHover += getTypeLan(oSec.type) + "(" + oSec.number + ")<br/>";
							} else {
								szTipHover += getTypeLan(oSec.type) + "<br/>";
							}
						}
						szTipHover += mixStartTime + " - " + mixEndTime;
						oTimeTipHover.find("div").eq(0).html(szTipHover);
						oTimeTipHover.css({
							left: $(section).position().left + $(section).outerWidth() / 2 + 9,
							top: 45 * sectionDay + (60 - oTimeTipHover.height())
						}).show();
						//console.log(oSec);
					},
					mouseout: function () {// 时间段out的时候隐藏时间段提示
						$("#" + me.id + "_timeTipHover").hide();
					},
					mousedown: function (e) {
						//e.stopPropagation();

						if (e.target.className == me.prefix + "resizeLeft") {
							m_szResizeDirect = "left";
						} else if (e.target.className == me.prefix + "resizeRight") {
							m_szResizeDirect = "right";
						} else {
							m_szResizeDirect = "";
						}

						$("#" + me.id + "_timeTipHover").hide();

						if (m_oSelSection != null) {// 已经有选中的
							m_oSelSection.css({
								border: 0
							});
							$("." + me.prefix + "resizeLeft", m_oSelSection).eq(0).hide();
							$("." + me.prefix + "resizeRight", m_oSelSection).eq(0).hide();
						}
						$(this).css({
							border: "1px dotted #000000"
						});
						$("." + me.prefix + "resizeLeft", this).eq(0).css("display", "inline-block");
						$("." + me.prefix + "resizeRight", this).eq(0).css("display", "inline-block");
						$("#" + me.id + "_delete").prop("disabled", false);// 选中任一时间段，删除按钮启用
						m_oSelSection = $(this);
						m_oSelSection.day = sectionDay;
						var sec = this.sec || section.sec;
						m_oSelSection.start = sec.start;
						m_oSelSection.end = sec.end;
						m_oSelSection.number  = sec.number;// 目前PTZ定时任务中用到

						//console.log(sec);

						// 弹出框赋值
						if (m_aType != null && m_aType.length > 0) {// 时间类型
							$("#" + me.id + "_drawTypeSel2").val(sec.type);
						}
						if ("patrol" == sec.type || "pattern" == sec.type || "preset" == sec.type || "auxoutput" == sec.type) {// 巡航扫描、花样扫描、预置点、辅助输出 编号，目前PTZ定时任务中用到
							$("#" + me.id + "_drawNumberSel").val(sec.number);
						}

						var oSec = null,
							mixStartTime = "",
							mixEndTime = "";
						for (var j = 0, nLen = m_aDaySection[m_oSelSection.day].length; j < nLen; j++) {
							oSec = m_aDaySection[m_oSelSection.day][j];
							//console.log(oSec);
							if (oSec.start == m_oSelSection.start && oSec.end == m_oSelSection.end) {// 查找选中时间段对应的时间
								mixStartTime = m_aData[m_oSelSection.day][j].sTime;
								mixEndTime = m_aData[m_oSelSection.day][j].eTime;

								m_oSelSection.oSec = m_aData[m_oSelSection.day][j];// 取证模块中使用
								break;
							}
						}
						mixStartTime = mixStartTime.split(":");
						mixEndTime = mixEndTime.split(":");
						m_timeTip.find(".txt").each(function (i) {
							if (i < 2) {
								$(this).val(mixStartTime[i]);
							} else {
								$(this).val(mixEndTime[i - 2]);
							}
						});

						createNumberSelect(sec.type, sec.number);
						showTimeTip();
					}
				});
				return section;
			}

			// 显示时间、类型弹出编辑框
			function showTimeTip() {
				m_timeTip.css({
					left: $(m_oSelSection).position().left + $(m_oSelSection).outerWidth() / 2 - 33,
					top: 45 * m_oSelSection.day + (60 - m_timeTip.height())
				}).show();
			}

			// 显示编号选择下拉框
			function createNumberSelect(type, number) {
				// 巡航扫描、花样扫描、预置点、辅助输出
				if ("patrol" == type || "pattern" == type || "preset" == type || "auxoutput" == type) {
					// 下拉框类型选择
					var szOpt = "<select style='margin-top: 5px;'>",
						oNum = options.oAlarmOutNum;
					for (var i = 1; i <= oNum[type]; i++) {
						szOpt += '<option value="' + i + '">' + i + '</option>';
					}
					szOpt += "</select>";

					$("#" + me.id + "_numberSel").empty().append($(szOpt).width(147).attr("id", me.id + "_drawNumberSel"));
					$("#" + me.id + "_drawNumberSel").val(number);
				} else {
					$("#" + me.id + "_numberSel").empty();
				}
			}

			// 检查是否为时间段
			function checkIsSection(day, px) {
				var start = end = 0;

				for (var i = 0, nLen = m_aDaySection[day].length; i < nLen; i++) {
					start = m_aDaySection[day][i].start;
					end = m_aDaySection[day][i].end;
					if (px >= start && px <= end) {
						return true;
					}
				}
				return false;
			}

			// 检查时间段是否覆盖
			function checkIsOverSection(day, sPx, ePx) {
				var start = end = 0;

				for (var i = 0, nLen = m_aDaySection[day].length; i < nLen; i++) {
					start = m_aDaySection[day][i].start;
					end = m_aDaySection[day][i].end;
					if (sPx <= start && ePx >= end) {
						return true;
					}
				}
				return false;
			}

			// 检查时间段是否相交
			function checkIsIntersectSection() {
				var section = null;
				for (var j = 0, nLen = m_aDaySection[m_oSelSection.day].length; j < nLen; j++) {
					section = m_aDaySection[m_oSelSection.day][j];
					if (section.start == m_oSelSection.start && section.end == m_oSelSection.end) {
						// 内存处理
						var oInput = m_timeTip.find(".txt"),
							oPrevTime = null,
							oNextTime = null;

						// 时间处理
						var szStartTime = oInput.eq(0).val() + ":" + oInput.eq(1).val() + ":00";
						var szEndTime = oInput.eq(2).val() + ":" + oInput.eq(3).val() + ":00";
						if (m_aData[m_oSelSection.day][j].sTime == szStartTime && m_aData[m_oSelSection.day][j].eTime == szEndTime) {
							break;
						}

						if ((j - 1) >= 0) {// 前面还有时间段
							oPrevTime = m_aData[m_oSelSection.day][j - 1];
						}
						if ((j + 1) < nLen) {// 后面还有时间段
							oNextTime = m_aData[m_oSelSection.day][j + 1];
						}

						var iStartMinute = timeToMinute(szStartTime);
						if (oPrevTime != null && iStartMinute < timeToMinute(oPrevTime.eTime)) {// 输入时间和前一个结束时间比较
							return true;
						}

						var iEndMinute = timeToMinute(szEndTime);
						if (oNextTime != null && iEndMinute > timeToMinute(oNextTime.sTime)) {// 输入时间和后一个开始时间比较
							return true;
						}

						break;
					}
				}
				return false;
			}

			// 检查时间段是否达到上限
			function checkSectionNum(day) {
				if (m_aDaySection[day].length == options.sectionNum) {
					return false;
				}
				return true;
			}

			// 绘画范围控制
			function checkDrawRange(x) {
				if (x < me.minClientX) {
					return me.minClientX;
				} else if (x > me.maxClientX) {
					return me.maxClientX;
				} else {
					return x;
				}
			}

			// 创建时间提示对象
			function createTimeTip() {
				var szHtml = "<div id='" + me.id + "_timetip' class='" + me.prefix + "timetip'>" +
					"<div class='" + me.prefix + "timetip_top'></div>" +
					"<div id='" + me.id + "_timetip_middle' class='" + me.prefix + "timetip_middle'>" +
					"<div id='" + me.id + "_typeSel'></div>" +
					"<div id='" + me.id + "_numberSel'></div>" +
					"<div style='padding-top: 5px;'>" +
					"<input type='text' class='txt' maxlength='2' onpaste='return false' /> : <input type='text' class='txt' maxlength='2' onpaste='return false' />" +
					" - <input type='text' class='txt' maxlength='2' onpaste='return false' /> : <input type='text' class='txt' maxlength='2' onpaste='return false' /></div>" +
					"<div style='padding: 5px 0;'>" +
					"<span class='ctrl'>" + options.lan["delete"] + "</span> | <span class='ctrl'>" + options.lan.save + "</span>";

				if (options.onScenceCfg) {
					szHtml += " | <span class='ctrl'>" + options.lan.config + "</span>";
				}

				szHtml += "</div><span class='close'></span></div>" +
					"<div class='" + me.prefix + "timetip_bottom'></div>" +
					"</div>";

				m_timeTip = $(szHtml);
				if ($("#" + me.id + "_timetip").length > 0) {
					$("#" + me.id + "_timetip").unbind().remove();
				}
				$(me).append(m_timeTip);
				if (m_aType != null && m_aType.length > 0) {// 编辑时间段，类型切换选择下拉框
					$("#" + me.id + "_typeSel").append($("#" + me.id + "_drawTypeSel").clone().width(147).attr("id", me.id + "_drawTypeSel2"));
					m_szDrawType = m_aType[0];
					$("#" + me.id + "_drawTypeSel2").change(function () {
						createNumberSelect($(this).val(), 1);
						showTimeTip();
					});
				}
				m_timeTip.bind("click", function (e) {
					e.stopPropagation();
				});
				m_timeTip.find(".txt").each(function (i) {
					if (0 == i % 2) {
						$(this).bind("keyup", function () {
							checkHour(this);
						});
					} else {
						$(this).bind("keyup", function () {
							checkMinute(this);
						});
					}
				});
				m_timeTip.find(".close").eq(0).click(function () {// 关闭
					m_timeTip.hide();
				});
				m_timeTip.find(".ctrl").eq(0).click(function () {// 删除
					$("#" + me.id + "_delete").click();
				});
				m_timeTip.find(".ctrl").eq(1).click(function () {// 保存
					if (!checkTime()) {// 验证开始时间和结束时间是否正确
						_oDialog.alert(options.lan.sTimeEarlierETime);
					} else if (checkIsIntersectSection()) {
						_oDialog.alert(options.lan.timeIntersect);
					} else {
						// 时间处理
						var oInput = m_timeTip.find(".txt");
						var szStartTime = oInput.eq(0).val() + ":" + oInput.eq(1).val() + ":00";
						var szEndTime = oInput.eq(2).val() + ":" + oInput.eq(3).val() + ":00";

						var iStartPx = timeToPx(szStartTime);
						var iEndPx = timeToPx(szEndTime);

						var section = null;
						for (var j = 0, nLen = m_aDaySection[m_oSelSection.day].length; j < nLen; j++) {
							section = m_aDaySection[m_oSelSection.day][j];
							if (section.start == m_oSelSection.start && section.end == m_oSelSection.end) {
								// 类型处理
								if (m_aType != null && m_aType.length > 0) {
									section.type = $("#" + me.id + "_drawTypeSel2").val();
									// 界面显示更新
									var szColor = m_oColors[section.type];
                                    if ("undefined" == typeof szColor) {  // 如果在合并数组中，使用AllEvent的颜色
                                        szColor = m_oColors["AllEvent"];
                                    }
									m_oSelSection.css({
										background: szColor
									});
									// 原数据处理
									m_aData[m_oSelSection.day][j].type = section.type;

									// 巡航扫描、花样扫描、预置点、辅助输出 编号，目前PTZ定时任务中用到，内存更新，原数据处理
									section.number = "0";
									if ("patrol" == section.type ||
										"pattern" == section.type ||
										"preset" == section.type ||
										"auxoutput" == section.type) {
										section.number = $("#" + me.id + "_drawNumberSel").val();
									}
									m_aData[m_oSelSection.day][j].number = section.number;
								}

								// 界面显示更新
								m_oSelSection.css({
									left: iStartPx,
									width: (iEndPx - iStartPx) ? (iEndPx - iStartPx) : 1
								});

								// 内存更新
								section.start = iStartPx;
								section.end = iEndPx;

								// 原数据处理
								m_aData[m_oSelSection.day][j].sTime = szStartTime;
								m_aData[m_oSelSection.day][j].eTime = szEndTime;

								break;
							}
						}

						m_timeTip.hide();
					}
				});
				if (options.onScenceCfg) {
					m_timeTip.find(".ctrl").eq(2).click(function () {// 场景巡航时间配置
						options.onScenceCfg(m_oSelSection);
					});
				}
			}

			// 检查小时
			function checkHour(obj) {
				if (!(Number(obj.value) <= 24)) {
					obj.value = obj.value.replace(obj.value, '00');
				} else if ((Number(obj.value) == 24)) {
					$(obj).next().val('00');
				}
			}
			// 检查分钟
			function checkMinute(obj) {
				if (!(Number(obj.value) <= 59)) {
					obj.value = obj.value.replace(obj.value, '00');
				} else if ((Number($(obj).prev().val()) == 24)) {
					obj.value = '00';
				}
			}

			// 获取时间段对应的时间
			function getTime(start, end) {
				//return (pxToTime(start) + "-" + pxToTime(end));
				var aStart = pxToTime(start).split(":"),
					aEnd =pxToTime(end).split(":");

				aStart.pop();
				aEnd.pop();

				return aStart.concat(aEnd);
			}

			// 创建复制到选择框对象
			function createCopyToSelect() {
				var szHtml = "<table id='" + me.id + "_checkboxs' class='" + me.prefix + "checkboxs' cellspacing='0' cellspadding='0' border='0'>" +
								"<tr><td colspan='3'><div class='" + me.prefix + "copyto_top'><label class='" + me.prefix + "copyto_txt' id='" + me.id + "_copyTo_txt'>复制到...</label><span class='" + me.prefix + "copyto_checkall'><input id='" + me.id + "_checkall' type='checkbox' class='" + me.prefix + "checkbox' /><label id='" + me.id + "_selAll'>全选</label></span></div></td></tr>" +
								"<tr><td><input type='checkbox' class='" + me.prefix + "checkbox' day='0' /><label id='" + me.id + "_monDay1'>星期一</label></td><td><input type='checkbox' class='" + me.prefix + "checkbox' day='1' /><label id='" + me.id + "_tueDay1'>星期二</label></td><td><input type='checkbox' class='" + me.prefix + "checkbox' day='2' /><label id='" + me.id + "_wedDay1'>星期三</label></td></tr>" +
								"<tr><td><input type='checkbox' class='" + me.prefix + "checkbox' day='3' /><label id='" + me.id + "_thuDay1'>星期四</label></td><td><input type='checkbox' class='" + me.prefix + "checkbox' day='4' /><label id='" + me.id + "_friDay1'>星期五</label></td><td><input type='checkbox' class='" + me.prefix + "checkbox' day='5' /><label id='" + me.id + "_satDay1'>星期六</label></td></tr>" +
								"<tr><td><input type='checkbox' class='" + me.prefix + "checkbox' day='6' /><label id='" + me.id + "_sunDay1'>星期日</label></td><td>";
				if (options.holiday) {// 支持假日
					szHtml += "<input type='checkbox' class='" + me.prefix + "checkbox' day='7' /><label id='" + me.id + "_holDay1'>假日</label></td>";
				} else {
					szHtml += "&nbsp;</td>";
				}
				szHtml += "<td>&nbsp;</td></tr>";
				szHtml += "<tr><td class='" + me.prefix + "copyto_bottom' colspan='3'><button type='button' class='btn btn-browser' id='" + me.id + "_ok'>确定</button><button type='button' class='btn btn-browser' id='" + me.id + "_cancel'>取消</button></td></tr></table>";

				if ($("#" + me.id + "_checkboxs").length > 0) {
					$("#" + me.id + "_checkboxs").unbind().remove();
				}
				m_oCopyToSelect = $(szHtml);
				$(me).append(m_oCopyToSelect);

				$("#" + me.id + "_checkall").click(function () {
					$("#" + me.id + "_checkboxs ." + me.prefix + "checkbox").not(":first").not(":disabled").prop("checked", $(this).prop("checked"));
				});
				$("#" + me.id + "_checkboxs ." + me.prefix + "checkbox").not(":first").click(function (e) {
					if ($(this).prop("disabled")) {
						e.preventDefault();
					}
					if ($("#" + me.id + "_checkboxs ." + me.prefix + "checkbox").not(":first").not(":checked").length > 0) {
						$("#" + me.id + "_checkall").prop("checked", false);
					} else {
						$("#" + me.id + "_checkall").prop("checked", true);
					}
				});
				$("#" + me.id + "_ok").click(function () {
					m_oCopyToSelect.hide();
					copySectionToSelect();
				});
				$("#" + me.id + "_cancel").click(function () {
					m_oCopyToSelect.hide();
				});
			}

			// 复制时间段
			function copySectionToSelect() {
				var day = -1,
					aSelSection = $.extend(true, [], m_aDaySection[m_iSelDay]),
					aCopyDay = [], aScenePatrol;

				$("#" + me.id + "_checkboxs ." + me.prefix + "checkbox").not(":first").each(function () {
					if ($(this).prop("checked") && !$(this).prop("disabled")) {
						day = $(this).attr("day");
						aCopyDay.push(day);
						// 内存处理
						m_aDaySection[day] = [];
						$.extend(true, m_aDaySection[day], aSelSection);
						// 原数据处理
						m_aData[day] = [];

						$.each(aSelSection, function (i) {
							aScenePatrol = m_aData[m_iSelDay][i].scenePatrol;
							if (angular.isDefined(aScenePatrol)) {
								aScenePatrol = $.extend(true, [], aScenePatrol);
							}
							m_aData[day][i] = {
								type: this.type,
								sTime: m_aData[m_iSelDay][i].sTime,
								eTime: m_aData[m_iSelDay][i].eTime,
								number: this.number, // 巡航扫描、花样扫描、预置点、辅助输出 编号，目前PTZ定时任务中用到
								scenePatrol: aScenePatrol // 场景巡航参数
							};
						});
					}
				});

				// 刷新画布
				refreshPlanTimes();

				if (options.onScenceCfg) {// 场景巡航布放时间配置（取证模块使用）
					options.onScenceCfg("copyto", m_iSelDay, aCopyDay);
				}
			}

			// 设置语言
			function setLan() {
				if (null == options.lan) {
					return;
				}
				var oLan = options.lan;

				if (m_aType != null && m_aType.length > 0) {// 显示类型
					var opts = $("#" + me.id + "_drawTypeSel option");
					var txts = $("#" + me.id + "_drawTypeShow .txt");
					var szLan, j = 0;
					$.each(m_aType, function (i) {
                        szLan = getTypeLan(this.toString());
                        opts.eq(i).text(szLan);// 先加语言，再remove，只要按顺序就行了
						if (-1 == $.inArray(this.toString(), m_aMergeType)) {// 界面显示时已过滤，这里也要过滤
							txts.eq(j++).text(szLan);
						}
					});
				}

				$("#" + me.id + "_delete_txt").text(oLan["delete"]);// delete用点号访问IE8下报错，改用[]访问
				$("#" + me.id + "_deleteAll_txt").text(oLan.deleteAll);
				$("#" + me.id + "_advanced").text(oLan.advancedParam);
				$("#" + me.id + "_selAll").text(oLan.selectAll).attr("title", oLan.selectAll);
				$("#" + me.id + "_ok").text(oLan.ok);
				$("#" + me.id + "_cancel").text(oLan.cancel);

				$("#" + me.id + "_copyTo_txt").text(oLan.copyTo);
				$("#" + me.id + "_monDay, #" + me.id + "_monDay1").text(oLan.monday).attr("title", oLan.monday);
				$("#" + me.id + "_tueDay, #" + me.id + "_tueDay1").text(oLan.tuesday).attr("title", oLan.tuesday);
				$("#" + me.id + "_wedDay, #" + me.id + "_wedDay1").text(oLan.wednesday).attr("title", oLan.wednesday);
				$("#" + me.id + "_thuDay, #" + me.id + "_thuDay1").text(oLan.thursday).attr("title", oLan.thursday);
				$("#" + me.id + "_friDay, #" + me.id + "_friDay1").text(oLan.friday).attr("title", oLan.friday);
				$("#" + me.id + "_satDay, #" + me.id + "_satDay1").text(oLan.saturday).attr("title", oLan.saturday);
				$("#" + me.id + "_sunDay, #" + me.id + "_sunDay1").text(oLan.sunday).attr("title", oLan.sunday);
				$("#" + me.id + "_holDay, #" + me.id + "_holDay1").text(oLan.holiday).attr("title", oLan.holiday);
			}

			// 界面时间段类型语言
			function getTypeLan(type) {
				if (null == options.lan) {
					return "";
				}
				var oLan = options.lan;

				var oTypeLan = {
					"CMR": oLan.continuous,
					"MOTION": oLan.motion,
					"ALARM": oLan.alarm,
					"EDR": oLan.motionOrAlarm,
					"ALARMANDMOTION": oLan.motionAndAlarm,
					"COMMAND": oLan.command,  //前端用Command
					"SMART": "Smart",
					"AllEvent": oLan.event,
					"SCENE1": oLan.SceneDefault + "1",
					"SCENE2": oLan.SceneDefault + "2",
					"SCENE3": oLan.SceneDefault + "3",
					"SCENE4": oLan.SceneDefault + "4",
					"disable": oLan.off,
					"autoscan": oLan.autoScan,
					"framescan": oLan.frameScan,
					"randomscan": oLan.randomScan,
					"patrol": oLan.patrolScan,
					"pattern": oLan.pattern,
					"preset": oLan.preset,
					"panoramascan": oLan.panoramaScan,
					"tiltscan": oLan.tiltScan,
					"periodreboot": oLan.domeReboot,
					"periodadjust": oLan.domeAdjust,
					"auxoutput": oLan.auxOutput,
					"LineDetection": oLan.lineCrossDetect,
					"FieldDetection": oLan.fieldDetectionType,
					"AudioDetection": oLan.audioDetection,
					"facedetection": oLan.faceDetection,
					"regionEntrance": oLan.regionEntranceDetect,
					"regionExiting": oLan.regionExitDetect,
					"loitering": oLan.loiterDetect,
					"group": oLan.peopleGatherDetect,
					"rapidMove": oLan.fastMoveDetect,
					"parking": oLan.parkDetect,
					"unattendedBaggage": oLan.unattendedBaggageDetect,
					"attendedBaggage": oLan.objectRemovalDetect,
					"scenechangedetection": oLan.sceneChangeDetection,
                    "pir": oLan.pir,
                    "wlsensor": oLan.wlsensor,
                    "callhelp": oLan.callhelp,
                    "INTELLIGENT": oLan.intelligent
				};

				return oTypeLan[type];
			}

			// 检查输入时间有效性
			function checkTime() {
				var oInput = m_timeTip.find(".txt");
				$.each(oInput, function () {
					if ("" == $.trim($(this).val())) {// 修正为空的输入框
						$(this).val('00');
					}
					if (parseInt($(this).val(), 10) < 10) {// 修正不足10的补0
						$(this).val('0' + parseInt($(this).val(), 10));
					}
				});

				var iStartTime = Number(oInput.eq(0).val()) * 60 + Number(oInput.eq(1).val());
				var iEndTime = Number(oInput.eq(2).val()) * 60 + Number(oInput.eq(3).val());
				if (iStartTime >= iEndTime) {
					return false;
				}
				return true;
			}

			// 获取每天的HTML
			function getDayHtml() {
				var aHtml = [],
					aDay = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "hol"];

				for (var i = 0; i < 8; i++) {
					if (7 == i) {
						aHtml.push('<div class="' + me.prefix + 'day" day="' + i + '" id="' + me.id + '_holDayDiv" style="display:none;">');
					} else {
						aHtml.push('<div class="' + me.prefix + 'day" day="' + i + '">');
					}

					aHtml.push('<div class="' + me.prefix + 'dayname" day="' + i + '"><label id="' + me.id + '_' + aDay[i] + 'Day"></label></div>');
					aHtml.push('<div class="' + me.prefix + 'daydraw">');
					aHtml.push('<div id="' + me.id + '_dayTimePlan' + i + '" day="' + i + '" class="' + me.prefix + 'daytimeplan"></div>');
					aHtml.push('</div>');
					aHtml.push('<div class="' + me.prefix + 'copyto" day="' + i + '"></div>');
					aHtml.push('</div>');
				}

				return aHtml.join("");
			}

			// 画布是否可编辑界面处理
			function maskPlanTimes() {
				var iWidth = $(me).find(".timeplan_days").eq(0).outerWidth(),
					iHeight = $(me).height();
				if (options.editable) {
					$("#" + me.id + "_mask").hide();
				} else {
					$("#" + me.id + "_mask").css({
						width: iWidth,
						height: iHeight
					}).show();
				}
			}

			// 初始化复制选择框
			createCopyToSelect();
			// 创建绘画类型
			createDrawType();
			// 画时间段
			drawPlanTimes();
			// 翻译界面文字
			setLan();
			// 初始化时间提示对象
			createTimeTip();

			//$(document).unbind("click", documentClick); //调用了没有起效
			$(document).bind("click", documentClick);// 多个Tab之间会绑定多次

			function documentClick() {
				if (m_oCopyToSelect != null && (0 == $("#" + me.id).length || $("#" + me.id).is(":hidden"))) {
					m_oCopyToSelect.hide();
				}
			}

			return this;
		};
	})(jQuery);
});