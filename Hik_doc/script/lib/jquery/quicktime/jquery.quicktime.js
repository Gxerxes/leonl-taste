/*********************************************************
FileName: QuickTime
Description: QuickTime多窗口预览插件
*********************************************************/
(function($) {
	$.fn.QuickTime = function (options) {
		var container = this;
		var defaults = $.extend({
		    iMaxWndNum: 16,  //默认窗口分割模式
			bgColor: "#343434",
			borderStyle: "1px solid #171C20",
			borderStyleSelected: "1px solid #FFCC00",
			borderWidth: "1px",
			selectWnd: null
        },  options);
		//为该对象添加public方法和变量
		var _iWndType = Math.sqrt(defaults.iMaxWndNum);
		$.extend(this, {
		    HWP_Play: function (szUrl, szAuth, iWndNum, szStartTime, szStopTime) {
				var szQuicktimePlugin = "<embed src='test.html' type='video/quicktime' width='100%' height='100%' autoplay='true' qtsrc='" + szUrl + "' target='myself' scale='tofit' controller='false' pluginspage='http://www.apple.com/quicktime/download/' loop='false'>";
				$(".plugin-wnd").eq(iWndNum).html(szQuicktimePlugin);
				if($(".plugin-wnd").eq(iWndNum).find("embed").length > 0) {
					return 0;
				} else {
					return -1;
				}
			},
		    HWP_Stop: function (iWndNum) {
				$(".plugin-wnd").eq(iWndNum).html("");
				if($(".plugin-wnd").eq(iWndNum).find("embed").length > 0) {
					return 0;
				} else {
					return -1;
				}				 
			},
			HWP_ArrangeWindow: function (iWndType) {
			    if(_iWndType !== iWndType) {
					var iWndWidth = parseInt(($(this).width() - iWndType * 2)/iWndType, 10);
					var iWndHeight = parseInt(($(this).height() - iWndType * 2)/iWndType, 10);
					for(var i = 0; i < defaults.iMaxWndNum; i++) {
					    if(i < iWndType * iWndType) {
						    $(".plugin-wnd").eq(i).show();
						} else {
						    $(".plugin-wnd").eq(i).hide();
						}
					}
					$(".plugin-wnd").width(iWndWidth).height(iWndHeight);
					_iWndType = iWndType;
					this._selectWnd(0);
				}
			}
		});
		//为该对象添加private方法
		$.extend(this, {
			//创建窗口
			_createWnd: function () {
				var szDiv = "";
				var iWndWidth = ($(this).width() - _iWndType * 2)/_iWndType;
				var iWndHeight = ($(this).height() - _iWndType * 2)/_iWndType;
				for(var i = 0; i < _iWndType; i++) {
					szDiv += "<div>";
					for(var j = 0; j < _iWndType; j++) {
						szDiv += "<div class='plugin-wnd'></div>";
					}
					szDiv += "<div class='clear'></div>";
					szDiv += "</div>";
				}
				$(this).append(szDiv);
				//设置窗口样式
				$(".plugin-wnd").css({float: "left", background: defaults.bgColor, border: defaults.borderStyle});
				//设置窗口大小
				$(".plugin-wnd").width(iWndWidth).height(iWndHeight);
				//默认选中第一个窗口
				this._selectWnd(0);
				//事件绑定
				$(".plugin-wnd").each(function (i) {
					$(this).bind({
						click: function (e) {
						    container._selectWnd(i);
						}
					});
				});
			},
			//选中窗口
			_selectWnd: function (iWndNum) {
				$(".plugin-wnd").css("border", defaults.borderStyle);
				$(".plugin-wnd").eq(iWndNum).css("border", defaults.borderStyleSelected);
				if(defaults.selectWnd !== null) {
					defaults.selectWnd(iWndNum);
				}
			},
			//插件初始化函数
			_init: function () {
				this._createWnd();
			}
		});
		this._init();
		return this;
	};
})(jQuery);