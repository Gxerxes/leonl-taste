/*****************************************************
 FileName: slider
 Description: 滑动条插件
 Author: Chenxiangzhen
 Date: 2014.07.03
 *****************************************************/
define(function (require) {
	var jQuery = require("jquery");
	(function ($) {
		$.fn.slider = function (opt) {
			var _options = $.extend({
				hints: "",
				type: "slider",
				sliderCss: "slider",
				hoverCss: "sliderhover", //仅需要定义color属性即可
				barCss: "sliderbar",
				boxCss: "sliderbox",
				min: 0,
				max: 100,
				showBox: false, //是否创建输入框
				step: 1,
				onstart: null,  //开始移动滑块时的回调函数，回调函数中的this作用域为slider对象
				onchange: null, //移动滑块时的回调函数，回调函数中的this作用域为slider对象
				onend: null //停止移动滑块时的回调函数，回调函数中的this作用域为slider对象
			}, opt);

			if (_options.min > _options.max) {
				var iTemp = _options.min;
				_options.min = _options.max;
				_options.max = iTemp;
			}
			if (_options.step > _options.max) {
				_options.step = _options.max;
			}
			var _iValue = _options.min;
			var _self = this;
			var iBoxMarginLeft = 4;

			$(_self).empty();
			//slider外包围区域，用于定位
			var _oWrapper = $("<div style='position: relative; margin: 0; padding: 0;'></div>");
			$(_self).append(_oWrapper);
			//滑动条
			var _oSlider = $("<div style='position: absolute;'></div>");
			_oSlider.addClass(_options.sliderCss);
			if (_options.type !== "process") {
				_oSlider.click(function (event) {
					_moveTo(event);
				});
			}
			_oSlider.resize(function () {//width使用百分比的话，自适应宽度后，需要重新计算各元素位置
				if (_oSlider) {
					_fPerWidth = parseFloat((_oSlider.width() - _oBar.outerWidth(true)) / (_options.max - _options.min));

					if (_options.showBox) {
						_oBox.css("left", _oSlider.outerWidth(true) + iBoxMarginLeft);
					}
					_repaint();
				}
			});
			_oWrapper.append(_oSlider);

			//滑块滑过的区域
			var _oSliderHover = $("<div style='position: absolute;'></div>");
			_oSliderHover.addClass(_options.sliderCss);
			_oSliderHover.addClass(_options.hoverCss).width(0);
			if (_options.type !== "process") {
				_oSliderHover.click(function (event) {
					_moveTo(event);
				});
			}
			_oWrapper.append(_oSliderHover);
			//滑块
			var _oBar = $("<div style='position: absolute;'></div>");
			if (_options.type !== "process") {
				_oBar.addClass(_options.barCss);
				_oBar.mousedown(function (event) {
					$(this).focus();
					_initMoveSlider(event);
				});
				_oWrapper.append(_oBar);
			}

			//数值显示及输入框
			if (_options.showBox) {//需要显示的，则创建
				var _oBox = $("<input type='text' style='position: absolute;' />");
				_oBox.attr("maxLength", _options.max.toString().length);
				_oBox.addClass(_options.boxCss);
				_oBox.val(_options.min);
				_oBox.css("left", (_oSlider.outerWidth(true) + iBoxMarginLeft) + "px");
				if (_options.type !== "process") {
					_oBox.bind({
						click: function () {
							if (!isNaN(parseInt($(this).val(), 10))) {
								_iValue = parseInt($(this).val(), 10);
							} else {
								$(this).val(_options.min);
								_iValue = _options.min;
							}
						},
						keydown: function (event) {
							if (event.which == 13) {
								$(this).blur();
							}
						},
						keyup: function (event) {
							var szVal = $(this).val();
							if (szVal !== "") {
								var iVal = parseInt(szVal, 10);
								if (!isNaN(iVal)) {
									if (event.which == 38) {                      //键盘控制: 上--加
										iVal = iVal + _options.step;
										iVal = iVal > _options.max ? _options.max : iVal;                  //判断是否越界

									} else if (event.which == 40) { //键盘控制: 下--减
										iVal = iVal - _options.step;
										iVal = iVal < _options.min ? _options.min : iVal;                  //判断是否越界
									}
									$(this).val(iVal);
								} else {
									$(this).val(_options.min);                     //赋值最小值
								}
							}
						},
						blur: function () {
							var szVal = $(this).val();
							var iVal = _options.min; //赋值最小值
							if (/^[1-9]\d*|0$/.test(szVal)) {            //非负整数判断
								iVal = parseInt(szVal, 10);
								iVal = iVal > _options.max ? _options.max : iVal < _options.min ? _options.min : iVal; //判断是否越界
								if (iVal !== _options.min && iVal !== _options.max) {
									if ((iVal % _options.step) != 0) {                  //满足步长
										iVal = Math.ceil(iVal / _options.step) * _options.step;
									}
								}
							}
							if (iVal === _iValue) {
								if (iVal !== parseInt(szVal, 10)) {
									$(this).val(iVal);
								}
							} else {
								_self.setValue(iVal);
								//执行外部回调函数
								_trigger(_options.onchange);
								_trigger(_options.onend);
							}
						}
					});
				} else {
					_oBox.prop("readonly", true);
					_oBox.css("border", "0px");
					_oBox.css("background", "transparent");
				}
				_oWrapper.append(_oBox);
			}
			//如果样式中未声明width，那么自动分配宽度
			if (0 === _oSlider.width()) {
				if (_options.showBox) {
					_oSlider.width($(_self).width() - _oBox.outerWidth(true) - iBoxMarginLeft);
					_oBox.css("left", (_oSlider.outerWidth(true) + iBoxMarginLeft) + "px");
				} else {
					_oSlider.css("width", "100%");
				}
			}
			//slider、bar、box重新布局，居中对齐
			var iSliderTop = 0 ;
			var iBarTop = 0;
			if (_options.showBox) {
				iSliderTop = Math.round((_oBox.outerHeight(true) - _oSlider.outerHeight(true)) / 2 + 0.5);
				iBarTop = Math.round((_oBox.outerHeight(true) - _oBar.outerHeight(true)) / 2 + 0.5);
				_oWrapper.height(_oBox.outerHeight(true));
			} else {
				iSliderTop = Math.round((_oBar.outerHeight(true) - _oSlider.outerHeight(true)) / 2);
				_oWrapper.height(_oBar.outerHeight(true));
			}
			_oSlider.css("top", iSliderTop + "px");
			_oSliderHover.css("top", iSliderTop + "px");
			_oBar.css("top", iBarTop + "px");

			var _fPerWidth = parseFloat((_oSlider.width() - _oBar.outerWidth(true)) / (_options.max - _options.min)); //每一格数值代表的像素点的个数

			var _iMouseDownX = 0;
			var _iBarValue = _options.min;  //点击滑动块时的数值

			$.extend(_self, {
				getValue: function () {
					return _iValue;
				},
				setValue: function (iValue) {
					if (typeof iValue !== "number") {
						iValue = parseInt(iValue, 10);
					}
					if (isNaN(iValue)) {
						return;
					}
					if (iValue === _iValue) {
						return;
					}
					var iLastChangeValue = _iValue; //记录改变数值前的value值
					iValue = iValue > _options.max ? _options.max : iValue < _options.min ? _options.min : iValue;
					if (iValue === iLastChangeValue) {
						return;
					}
					_iValue = iValue;
					_repaint();

					if (_options.showBox) {//将输入框赋值
						if (_options.type === "process") {
							_oBox.val(_iValue + "%");
						} else {
							_oBox.val(_iValue);
						}
					}
					//执行外部回调函数
					/*_trigger(_options.onchange);
					_trigger(_options.onend);*/
				},
				setTitle: function (szTitle) { //设置标题
					_oSlider.attr("title", szTitle);
					_oBar.attr("title", szTitle);
					_oSliderHover.attr("title", szTitle);
				},
				setMinMax: function (iMin, iMax) { //设置最大最小值
					if (typeof iMin !== "number") {
						iMin = parseInt(iMin, 10);
					}
					if (typeof iMax !== "number") {
						iMax = parseInt(iMax, 10);
					}
					var bRefresh = false; //是否需要刷新滑动条
					if (!isNaN(iMin) && iMin !== _options.min) {
						_options.min = iMin;
						bRefresh = true;
					}
					if (!isNaN(iMax) && iMax !== _options.max) {
						_options.max = iMax;
						bRefresh = true;
					}
					if (bRefresh) {
						_oSlider.resize();
					}
				}
			});
			//重新计算各元素位置
			function _repaint() {
				var iLeft = Math.round((_iValue - _options.min) * _fPerWidth);
				_oBar.css("left", iLeft + "px");
				_oSliderHover.width(iLeft + Math.round(_oBar.outerWidth(true) / 2));
			}
			//点击滑块后初始化滑动事件
			function _initMoveSlider(evt) {
				_iMouseDownX = evt.pageX;
				_iBarValue = _iValue;
				_trigger(_options.onstart); //执行外部回调函数
				$(document).bind("mousemove", function (event) {
					_changeHandle(event);
				});
				$(document).bind("mouseup", function (event) {
					_endHandle(event);
				});
			}
			//响应滑动事件
			function _changeHandle(evt) {
				if ($(_self).is(":hidden")) {
					_endHandle(evt);
					return;
				}
				window.getSelection ? window.getSelection().removeAllRanges() : window.document.selection.empty();

				var iMoveX = evt.pageX - _iMouseDownX;

				var iLastChangeValue = _iValue; //记录改变数值前的value值

				_iValue = Math.round(iMoveX / _fPerWidth) + _iBarValue;

				if (_options.step > 1) {
					if (_iValue !== _options.min && _iValue !== _options.max) {
						if ((_iValue % _options.step) != 0) {
							_iValue = Math.ceil(_iValue / _options.step) * _options.step;
						}
					}
				}

				if (_options.min > _iValue) {
					_iValue = _options.min;
				}
				if (_options.max < _iValue) {
					_iValue = _options.max;
				}
				//数值未发生改变时，不处理change事件
				if (_iValue === iLastChangeValue) {
					return;
				}
				_repaint(); //更新滑动条
				if (_options.showBox) {
					if (_options.type === "process") {
						_oBox.val(_iValue + "%");
					} else {
						_oBox.val(_iValue);
					}
					/*setTimeout(function () {
					 _oBox.val(_iValue);
					 }, 1);//添加改变的值到输入框,这里加setTimeout解决消息堵塞问题*/
				}
				//执行外部回调函数
				_trigger(_options.onchange);

			}
			//响应结束滑动事件
			function _endHandle() {
				//Release event
				$(document).unbind("mousemove");
				$(document).unbind("mouseup");
				_iMouseDownX = 0;
				//执行外部回调函数
				_trigger(_options.onend);
			}
			//响应点击滑动条事件
			function _moveTo(evt) {
				var iLeft = evt.pageX - parseInt(_oSlider.offset().left, 10) - Math.round(_oBar.outerWidth(true) / 2);
				var iLastChangeValue = _iValue; //记录改变数值前的value值
				_iValue = Math.round(iLeft / _fPerWidth) + _options.min;

				if (_options.step > 1) {
					if (_iValue !== _options.min && _iValue !== _options.max) {
						if ((_iValue % _options.step) != 0) {
							_iValue = Math.ceil(_iValue / _options.step) * _options.step;
						}
					}
				}

				if (_options.min > _iValue) {
					_iValue = _options.min;
				}

				if (_options.max < _iValue) {
					_iValue = _options.max;
				}
				//数值未发生改变时，不处理moveTo事件
				if (_iValue === iLastChangeValue) {
					return;
				}
				_repaint();
				//添加改变的值到输入框
				if (_options.showBox) {
					if (_options.type === "process") {
						_oBox.val(_iValue + "%");
					} else {
						_oBox.val(_iValue);
					}
				}
				//执行外部回调函数
				_trigger(_options.onchange);
				_trigger(_options.onend);
			}
			//触发回调
			function _trigger (fn) {
				if ($.isFunction(fn)) {
					/*var iParamNum = fn.length;
					if (iParamNum > 0) {
						var aParamsName = fn.toString().match(/^function\s*.*\((.*)\)/)[1].replace(/\s/g, "").split(",");
						if (aParamsName.length === 1) {
							if (aParamsName[0] === "target") {
								fn(_self);
							} else {
								fn(_iValue);
							}
						} else {
							fn(_self, _iValue);
						}
					} else {
						fn();
					}*/
					fn.call(_self);
				} else {
					return false
				}
			}

			return _self;
		}
	})(jQuery);
});