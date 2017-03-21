/*****************************************************
 FileName: Menu
 Description: 菜单插件
 Author: Chenxiangzhen
 Date: 2014.07.25
 *****************************************************/
(function ($) {
	$.fn.Menu = function (options) {
		var _options = jQuery.extend({
			oneSmOnly: true, //是否只显示一个菜单项
			remember: true, // 记住当前选中菜单，需要jquery.cookie插件支持
			defaultMenu: "0",
			onselect: null,
			onunload: null
		}, options);
		var _oContainer = this;   //包含所有菜单项的对象
		var _oMainMenu = $(this).children("div:not(.not-menu)");
		var _iIndent = 21; //菜单缩进
		var _iPaddingV = 8; //垂直内边框
		var _iWarpPaddingLeft = 3; //选中包围的内边框
		//初始化菜单组件
		function _initMenu(oMenus, iLevel, szIndex) {
			oMenus.each(function (index) {
				var szMarkIndex = szIndex + index + "_";
				$(this).addClass("menu").addClass("menu-" + iLevel);
				var oChildMenu = $(this).children("div:not(.not-menu)");
				if (oChildMenu.length > 0) {
					$(this).addClass("collapsed");
					oChildMenu.eq(0).addClass("menu-title").addClass("menu-title-" + iLevel).css("padding-left", (iLevel * _iIndent) + "px").hover(
						function () {
							if (!$(this).parent().hasClass("menu-select")) {
								$(this).addClass("menu-hover");
							}
						},
						function () {
							$(this).removeClass("menu-hover");
						}
					);
					if (oChildMenu.length > 1) {
						oChildMenu.not(":first").each(function () {
							if ($(this).children("div:not(.not-menu)").length === 0) {
								$(this).css("padding", _iPaddingV + "px 0 " + _iPaddingV + "px " + ((iLevel + 1) * _iIndent) + "px");
							}
						});
						_initMenu(oChildMenu.not(":first"), (iLevel + 1), szMarkIndex);
					}
				} else {
					$(this).hover(
						function () {
							if ($(this).hasClass("collapsed") && !$(this).hasClass("menu-select")) {
								$(this).addClass("menu-hover");
							}
						},
						function () {
							$(this).removeClass("menu-hover");
						}
					);
				}

				$(this).click(function (event) {
					if (_options.oneSmOnly) { //关闭其他展开的菜单
						if (!$(this).hasClass("cannot-select")) {
							var oParentMenu = $(this);
							if (oChildMenu.length > 1 && iLevel > 1) {
								oParentMenu = oParentMenu.parent();
							}
							oParentMenu.siblings(":not(.not-menu)").not(".collapsed").each(function () {
								$(this).addClass("collapsed");
								$(this).find("div:not(.menu-title, .not-menu)").not(".collapsed").addClass("collapsed");
							});
						}
					}
					if (oChildMenu.length > 1) { //有子菜单
						$(this).toggleClass("collapsed");
						if ($(this).find("div.menu-select").length === 0) {
							if (oChildMenu.not(".cannot-select").length > 1) {
								oChildMenu.not(".cannot-select").eq(1).click();
							} else {
								_removeMenuSelect();
							}
						} else {
							//do nothing
						}
					} else {
						$(this).parents(".menu").removeClass("collapsed"); //子菜单选中所有父级菜单都处于展开状态
						if ($(this).css("display") !== "none") {
							if (!$(this).hasClass("menu-select") && !$(this).hasClass("cannot-select")) { //未选中
								_removeMenuSelect();

								var oWrap = $("<div class='menu-wrap'></div>").css("padding-left", _iWarpPaddingLeft + "px");
								var iSelfPaddingLeft = 0;
								var iParentPaddingLeft = 0;
								if ($(this).parent().not($(_oContainer)).length > 0) {
									iParentPaddingLeft = parseInt($(this).parent().css("padding-left").replace("px", ""), 10);
								}
								oWrap.css("margin-left", "-" + iParentPaddingLeft + "px");
								_markMenu(szMarkIndex.replace(/_$/, ""));
								$(this).addClass("menu-select").wrap(oWrap).find(".menu-hover").removeClass("menu-hover");

								if ($(this).children("div:not(.not-menu)").length === 1) { //没有子级菜单
									iSelfPaddingLeft = parseInt($(this).children("div:not(.not-menu)").first().css("padding-left").replace("px", ""), 10);
									$(this).children("div:not(.not-menu)").first().css("padding-left", (iSelfPaddingLeft - _iWarpPaddingLeft + iParentPaddingLeft) + "px");
								} else {
									iSelfPaddingLeft = parseInt($(this).css("padding-left").replace("px", ""), 10);
									$(this).css("padding-left", (iSelfPaddingLeft - _iWarpPaddingLeft + iParentPaddingLeft) + "px");
								}
							}
						}
					}
					event.stopPropagation();
				});
			});
		}

		_initMenu(_oMainMenu, 1, "");
		$(_oContainer).find("div.not-menu").click(function (event) {
			event.stopPropagation();
		});
		//为该对象添加方法和局部变量
		$.extend(this, {
			focusById: function (szIndex) {
				var oTargetMenu = _findMenu(szIndex);
				if (oTargetMenu) {
					oTargetMenu.click();
				}
			},
			hide: function (szIndex) {
				var oTargetMenu = _findMenu(szIndex);
				if (oTargetMenu) {
					oTargetMenu.hide();
				}
			},
			show: function (szIndex) {
				var oTargetMenu = _findMenu(szIndex);
				if (oTargetMenu) {
					oTargetMenu.show();
				}
			}
		});
		//标记当前选中菜单
		function _markMenu(szID) {
			if (_options.remember) {
				$.cookie("sdMarkMenu", szID + ":" + _findMenu(szID.split("_")[0]).attr("name"));
			}
			//触发回调
			if ($.isFunction(_options.onselect)) {
				var aIndex = szID.split("_");
				var szName = "";
				var oSelect = _oMainMenu.eq(aIndex[0]);
				for (var i = 0; i < (aIndex.length); i++) {
					szName += oSelect.attr("name") + ".";
					oSelect = oSelect.children("div.menu").eq(aIndex[i + 1]);
				}
				szName = szName.replace(/\.$/, "");
				_options.onselect(szName);
			}
			//处理选中菜单操作，暂时不传递参数
			if ($.isFunction(_options.onunload)) {
				_options.onunload();
			}
		}

		//查找目标菜单
		function _findMenu(szIndex) {
			if (!szIndex) {
				return null;
			}
			var aIndex = szIndex.split("_");
			var oMenu = _oMainMenu.eq(aIndex[0]);
			for (var i = 0; i < (aIndex.length - 1); i++) {
				oMenu = oMenu.children("div:not(.menu-title, .not-menu)").eq(aIndex[i + 1]);
				if (oMenu.hasClass("menu-wrap")) { //当前处于选中状态
					oMenu = oMenu.children("div:not(.not-menu)").eq(0);
				}
			}
			return oMenu;
		}

		//获取当前选中的菜单
		function _getMarkMenu() {
			if (_options.remember) {
				try {
					var szMenuID = $.cookie("sdMarkMenu");
					if (szMenuID) {
						return _findMenu(szMenuID.split(":")[0]);
					} else {
						return null;
					}

				} catch (e) {
					return null;
				}
			} else {
				return null;
			}
		}
		//去除菜单选中
		function _removeMenuSelect() {
			var oSelect = $(_oContainer).find("div.menu-select");
			var iWrapMarginLeft = 0;
			if (oSelect.length > 0) {
				iWrapMarginLeft = parseInt(oSelect.parent().css("margin-left").replace("px", ""), 10);
				oSelect.removeClass("menu-select").unwrap();
				if (oSelect.children("div:not(.not-menu)").length > 0) {
					oSelect = oSelect.children("div:not(.not-menu)").eq(0);
				}
				var iSelectPaddingLeft = parseInt(oSelect.css("padding-left").replace("px", ""), 10);
				oSelect.css("padding-left", (iSelectPaddingLeft + _iWarpPaddingLeft + iWrapMarginLeft) + "px");
			}
		}

		//默认显示
		var oCurMenu = _getMarkMenu();
		if (oCurMenu === null) {
			this.focusById(_options.defaultMenu);
		} else {
			oCurMenu.click();
		}
		return this;
	};
})(jQuery);