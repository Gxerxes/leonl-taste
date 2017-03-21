/*****************************************************
 FileName: table
 Description: table插件
 Author: Chenxiangzhen
 Date: 2014.07.10
 *****************************************************/
/* * * example * * *
 oTable = $("#table").table({
 header: [
 {
 display: "IP",
 width: "100",
 type: "text"
 },
 {
 display: "Port",
 width: "100"
 },
 {
 display: "Username",
 width: "100",
 type: {"cxz": "陈相镇", "fzj": "冯中坚", "xf": "徐峰" },
 disabled: true
 },
 {
 display: "Password",
 percentWidth: "10",
 type: ""
 },
 {
 type: "data"
 }
 ],
 perPage: 0,
 showCheckbox: true,
 showIndex: true,
 showPage: true
 });
 oTable.addRows([
 ["10.7.36.22", "8000", "cxz", "12345"],
 ["10.7.36.23", "8000", "fzj", "12345"]
 ]);
* * */
define(function (require) {
	var jQuery = require("jquery");
	require("resize");  //依赖于resize扩展组件监听table的resize事件
	//Page对象
	function Page() {
		this.m_iPerPage = 0; //每页显示的元素数量
		this.m_aItems = [];  //所有元素
		this.m_iCurPage = 0; //当前页码
		this.m_iTotalPage = 0; //总页数
	}
	Page.prototype = {
		addItems: function (items) {
			$.merge(this.m_aItems, items);
			if (this.m_iCurPage === 0 && this.m_aItems.length) {
				this.m_iCurPage = 1;
			}
			this.m_iTotalPage = Math.ceil(this.m_aItems.length / this.m_iPerPage);
		},
		setPerPage: function (iPerPage) {
			if (iPerPage < 1) {
				return;
			}
			this.m_iPerPage = iPerPage;
			this.m_iTotalPage = Math.ceil(this.m_aItems.length / iPerPage);
			if (this.m_iCurPage === 0) {
				this.m_iCurPage = 1;
			}
			if (this.m_iCurPage > this.m_iTotalPage) {
				this.m_iCurPage = this.m_iTotalPage;
			}
		},
		clear: function () {
			this.m_aItems.length = 0;
			this.m_iCurPage = 0;
			this.m_iTotalPage = 0;
		},
		getCurrentPageItems: function () {
			var oItems = [];
			if (this.m_iCurPage === 0) {
				return oItems;
			}
			var iStartIndex = (this.m_iCurPage - 1) * this.m_iPerPage;
			var iEndIndex = this.m_iCurPage * this.m_iPerPage;
			if (iEndIndex > this.m_aItems.length) {
				iEndIndex = this.m_aItems.length;
			}
			for (var i = iStartIndex; i < iEndIndex; i++) {
				oItems.push(this.m_aItems[i]);
			}
			return oItems;
		},
		getNextPage: function () {
			if (this.m_iCurPage < this.m_iTotalPage) {
				this.m_iCurPage++;
			}
			return this.getCurrentPageItems();
		},
		getPrevPage: function () {
			if (this.m_iCurPage > 1) {
				this.m_iCurPage--;
			}
			return this.getCurrentPageItems();
		},
		getFirstPage: function () {
			this.m_iCurPage = 1;
			return this.getCurrentPageItems();
		},
		getLastPage: function () {
			this.m_iCurPage = this.m_iTotalPage;
			return this.getCurrentPageItems();
		}
	};
	(function ($) {
		$.fn.table = function (opt) {
			var _options = $.extend({
				header: [],
				showCheckbox: false,
				showIndex: false,
				showPage: false, //是否显示翻页
				perPage: 0, //0-根据每行高度及table body高度自动计算每页显示item数量
				lan: {index: "Index", total: "total", item: "item"},
				onSelect: null,
				onBlur: null,
				onChecked: null //回调传入当前选中个数
			}, opt);

			var _self = this;
			var _oTableDiv, _oTableHeadDiv, _oTableBodyDiv, _oTableRemain, _oTableFootDiv, _bNoEdit;
			var _iCheckBoxWidth = 20, _iIndexWidth = 40; //复选框列的宽度，序号列的宽度

			var _oPage = new Page();

			$(_self).empty();
			//table
			_oTableDiv = $("<div class='table'></div>");
			$(_self).append(_oTableDiv);

			//测试每一行的高度
			var oTestRowHeightDiv = $("<div class='table-row'><span class='table-cell' style='width: 100px;'>&nbsp;</span></div>");
			_oTableDiv.append(oTestRowHeightDiv);
			var _iScrollWidth = 17; //预留滚动条宽度
			var _iRowHeight = oTestRowHeightDiv.outerHeight(true);
			var _iRowWidth = oTestRowHeightDiv.width() - 2 - _iScrollWidth;
			oTestRowHeightDiv.remove();

			//thead 表格的表头
			_oTableHeadDiv = $("<div class='table-header'></div>");
			_oTableDiv.append(_oTableHeadDiv);

			if (_options.showCheckbox) {
				_iRowWidth = _iRowWidth - (_iCheckBoxWidth + 1);
				_oTableHeadDiv.append("<span class='table-cell' style='width:" + _iCheckBoxWidth + "px;'><input type='checkbox' class='checkbox'/></span>");
				_oTableHeadDiv.find(":checkbox").eq(0).bind("change", function () {
					var that = this;
					_oTableBodyDiv.find(":checkbox").each(function () {
						if(!$(this).prop("disabled")) {
							$(this).prop("checked", $(that).prop("checked"));
							if (_options.onChecked) {
								_options.onChecked(_oTableBodyDiv.find(":checkbox:checked").length);
							}
						}
					});
				});
			}
			if (_options.showIndex) {
				_iRowWidth = _iRowWidth - (_iIndexWidth + 1);
				_oTableHeadDiv.append("<span class='table-cell' style='width:" + _iIndexWidth + "px;'>" + _options.lan.index + "</span>");
			}

			var _aInputs = []; //存储输入编辑事件集合
			$.each(_options.header, function (i, onehead) {
				_options.header[i] = $.extend({
					display: "",
					width: "",
					type: "",
					disabled: false,
					percentWidth: "",
					callback: null
				}, onehead);
				//数据类型仅用于存储数据，不显示数据类型列
				if (_options.header[i].type === "data") {
					_aInputs.push("");
					return;
				}
				var oHeadOpt = _options.header[i];
				var oHeadSpan = $("<span class='table-cell'" + (_options.header[i].hide ? " style='display:none;'" : "") + ">" + oHeadOpt.display + "</span>");
				_oTableHeadDiv.append(oHeadSpan);
				if (oHeadOpt.percentWidth !== "") {
					oHeadOpt.width = Math.floor(parseInt(oHeadOpt.percentWidth, 10) * _iRowWidth / 100) + "";
				}
				if (oHeadOpt.width !== "") {
					oHeadSpan.css("width", oHeadOpt.width + "px");
				}
				if (oHeadOpt.type !== "") {//类型不为空，则支持编辑功能，目前支持Text、Select两种
					if (!oHeadOpt.disabled) {
						if (oHeadOpt.type === "text") {
							var oText = $("<input type='text' />").bind({
								click: function (event) {
									//防止冒泡，否则会使得parent响应click事件
									event.stopPropagation();
								},
								keydown: function (event) {
									if (event.which === 13) { //响应回车键
										event.preventDefault(); //禁止默认操作
										$(this).blur();
									}
								}
							});

							_aInputs.push(oText);
						} else if ($.isPlainObject(oHeadOpt.type)) {
							var oSelect = $("<select></select>");
							$.each(oHeadOpt.type, function (value, name) {
								oSelect.append("<option value='" + value + "'>" + name + "</option>")
							});
							oSelect.bind({
								click: function (event) {
									//防止冒泡，否则会使得parent相应click事件
									event.stopPropagation();
								},
								keydown: function (event) {
									if (event.which === 13) {
										event.preventDefault(); //禁止默认操作
										$(this).blur();
									}
								}
							});
							_aInputs.push(oSelect);
						} else {
							_aInputs.push("");
						}
					} else { //disabled，不支持编辑
						_aInputs.push("disabled");
					}
				} else {
					_aInputs.push("");
				}
			});
			//tbody
			_oTableBodyDiv = $("<div class='table-body'></div>");
			_oTableDiv.append(_oTableBodyDiv);
			//tremain body剩余高度
			_oTableRemain = $("<div class='table-remain'></div>");
			if (_options.showCheckbox) {
				_oTableRemain.append("<span class='table-cell' style='width:" + _iCheckBoxWidth + "px;'>&nbsp;</span>");
			}
			if (_options.showIndex) {
				_oTableRemain.append("<span class='table-cell' style='width:" + _iIndexWidth + "px;'>&nbsp;</span>");
			}
			$.each(_options.header, function (i) {
				if (_options.header[i].type === "data") {
					return;
				}
				var oRemainSpan = $("<span class='table-cell'" + (_options.header[i].hide ? " style='display:none;'" : "") + ">&nbsp;</span>");
				_oTableRemain.append(oRemainSpan);
				if (_options.header[i].width !== "") {
					oRemainSpan.css("width", _options.header[i].width + "px");
				}

			});
			_oTableDiv.append(_oTableRemain);
			//tfoot
			_oTableFootDiv = $("<div class='table-footer' align='right'></div>");
			if (_options.showPage) {
				var _oPageTotalItemLabel = $("<label class='table-page-label'>" + _options.lan.total + " 0 " + _options.lan.item + "</label>");
				var _oPageNumLabel = $("<label class='table-page-label'>" + _oPage.m_iCurPage + "/" + _oPage.m_iTotalPage + "</label>");
				var _oFirstBtn = $("<button class='btn'><label>&lt;&lt;</label></button>");
				_oFirstBtn.bind("click", function () {
					if ($(this).prop("disabled")) {
						return;
					}
					_showRows(_oPage.getFirstPage());
				});
				var _oPrevBtn = $("<button class='btn'><label>&lt;</label></button>");
				_oPrevBtn.bind("click", function () {
					if ($(this).prop("disabled")) {
						return;
					}
					_showRows(_oPage.getPrevPage());
				});
				var _oNextBtn = $("<button class='btn'><label>&gt;</label></button>");
				_oNextBtn.bind("click", function () {
					if ($(this).prop("disabled")) {
						return;
					}
					_showRows(_oPage.getNextPage());
				});
				var _oLastBtn = $("<button class='btn'><label>&gt;&gt;</label></button>");
				_oLastBtn.bind("click", function () {
					if ($(this).prop("disabled")) {
						return;
					}
					_showRows(_oPage.getLastPage());
				});
				_oTableFootDiv.append(_oPageTotalItemLabel);
				_oTableFootDiv.append(_oFirstBtn);
				_oTableFootDiv.append(_oPrevBtn);
				_oTableFootDiv.append(_oPageNumLabel);
				_oTableFootDiv.append(_oNextBtn);
				_oTableFootDiv.append(_oLastBtn);
			} else {
				_oTableFootDiv.addClass("table-footer-nopage");
			}
			_oTableDiv.append(_oTableFootDiv);

			//处理翻页逻辑
			function _pageBtnLogic() {
				if (_oPage.m_iCurPage === 0) {
					_oFirstBtn.prop("disabled", true);
					_oPrevBtn.prop("disabled", true);
					_oLastBtn.prop("disabled", true);
					_oNextBtn.prop("disabled", true);
				} else {
					if (_oPage.m_iCurPage === 1) {
						_oFirstBtn.prop("disabled", true);
						_oPrevBtn.prop("disabled", true);
					} else {
						_oFirstBtn.prop("disabled", false);
						_oPrevBtn.prop("disabled", false);
					}
					if (_oPage.m_iCurPage === _oPage.m_iTotalPage) {
						_oLastBtn.prop("disabled", true);
						_oNextBtn.prop("disabled", true);
					} else {
						_oLastBtn.prop("disabled", false);
						_oNextBtn.prop("disabled", false);
					}
				}

				_oPageTotalItemLabel.html(_options.lan.total + " " + _oPage.m_aItems.length + " " + _options.lan.item);
				_oPageNumLabel.html(_oPage.m_iCurPage + "/" + _oPage.m_iTotalPage);
			}
			//更新table布局
			function _layout() {
				/*if ((_oTableHeadDiv[0].scrollWidth + 20) > _oTableDiv.width()) {
				 _oTableDiv.width(_oTableHeadDiv[0].scrollWidth + 20); //20用于兼容出现滚动条的情况
				 } else {
				 _oTableDiv.css("width", "100%");
				 }*/

				var iTableBodyHeight = _oTableDiv.height() - _oTableHeadDiv.outerHeight(true) - _oTableFootDiv.outerHeight(true);

				if (_oTableBodyDiv.children("div").length * _iRowHeight >= iTableBodyHeight) {
					_oTableBodyDiv.height(iTableBodyHeight);
					_oTableRemain.hide();
				} else {
					_oTableBodyDiv.css("height", "");
					var iRemainHeight = iTableBodyHeight - _oTableBodyDiv.outerHeight(true);
					_oTableRemain.show().height(iRemainHeight);
					_oTableRemain.find("span").height(iRemainHeight);
				}
			}
			//显示需要显示的内容
			function _showRows(rows) {
				_oTableBodyDiv.empty();
				$.each(rows, function (rowIndex, row) {
					var oDiv = $("<div class='table-row'></div>");
					var iRowIndex = _oTableBodyDiv.children("div").length;
					if (_options.showCheckbox) {
						oDiv.append("<span class='table-cell' style='width:" + _iCheckBoxWidth + "px;'><input type='checkbox' class='checkbox'/></span>");
						oDiv.find(":checkbox").eq(0).change(function () {
							if (_oTableBodyDiv.find(":checkbox:checked").length === _oTableBodyDiv.find(":checkbox:enabled").length) {
								_oTableHeadDiv.find(":checkbox").eq(0).prop("checked", true);
							} else {
								_oTableHeadDiv.find(":checkbox").eq(0).prop("checked", false);
							}
							if (_options.onChecked) {
								_options.onChecked(_oTableBodyDiv.find(":checkbox:checked").length);
							}
						});
					}
					if (_options.showIndex) {
						iRowIndex = (_oPage.m_iCurPage - 1) * _oPage.m_iPerPage + iRowIndex;
						oDiv.append("<span class='table-cell' style='width:" + _iIndexWidth + "px;'>" + (iRowIndex + 1) + "</span>");
					}
					$.each(row, function (cellIndex, val) {
						if (cellIndex >= _options.header.length) {
							return;
						}
						//跳过数据列
						if (_options.header[cellIndex].type === "data") {
							return;
						}
						var oSpan = $("<span class='table-cell'" + (_options.header[cellIndex].hide ? "style='display:none;'" : "") + "></span>");
						if (_options.header[cellIndex].width !== "") {
							oSpan.css("width", _options.header[cellIndex].width + "px");
						}
						if (_aInputs[cellIndex] !== "") {
							if (_aInputs[cellIndex] !== "disabled" && _aInputs[cellIndex].is("input")) {
								oSpan.text(val);
							} else {
								oSpan.data("value", val).text(_options.header[cellIndex].type[val]);
							}
							if (_aInputs[cellIndex] !== "disabled") {
								oSpan.bind({
									click: function () { //单击单元格可编辑
										if(_bNoEdit) {
											return;
										}
										if (window.getSelection) {
											window.getSelection ? window.getSelection().removeAllRanges() : window.document.selection.empty(); //清除双击选中的内容
										}
										var oInput = _aInputs[cellIndex].clone(true);
										var bInput = oInput.is("input");
										if (bInput) {
											oInput.val($(this).text());
											oInput.css({"width": $(this).width() - 2 + "px", "height": $(this).height() - 2 + "px", "line-height": $(this).height() - 2 + "px"});
										} else {
											var szVal = $(this).data("value");
											oInput.find("option[value='" + szVal + "']").prop("selected", true);//选中元素对应select的value值
											oInput.css({"width": $(this).width() + "px"/*, "height": $(this).height() + "px"*/});
										}
										oInput.bind("blur", {rowIndex: iRowIndex, cellIndex: cellIndex}, function (event) {
											var bBlur = true;
											if (_options.onBlur) {
												bBlur = _options.onBlur(this, iRowIndex, cellIndex);
												if (typeof bBlur === "undefined") {
													bBlur = true;
												}
											}
											if (bBlur) {
												var szVal = $(this).val();
												var oParent = $(this).parent();
												if (bInput) {
													$(this).remove();
													oParent.text(szVal);
												} else {
													var szText = $(this).find("option:selected").text();
													$(this).remove();
													oParent.text(szText).data("value", szVal);
												}
												//临时保存修改的值
												_oPage.m_aItems[event.data.rowIndex][event.data.cellIndex] = szVal;
											}
										});

										$(this).empty().append(oInput);
										oInput.focus();
										if (bInput) {
											//把光标移到最后
											var oObj = oInput.get(0);
											var iLen = oInput.val().length;
											if (document.selection) {
												var oSel = oObj.createTextRange();
												oSel.moveStart('character', iLen);
												oSel.collapse();
												oSel.select();
											} else if (typeof obj.selectionStart == 'number' && typeof obj.selectionEnd == 'number') {
												oObj.selectionStart = oObj.selectionEnd = iLen;
											}
										}
									},
									mouseenter: function () {
										$(this).addClass("edit-cell-enter");
										//增加边框包围
										var oDiv = $("<div class='cell-border'></div>");
										oDiv.css({"height": ($(this).height() - 2) + "px", "width": ($(this).width() - 2) + "px"});
										$(this).append(oDiv)
									},
									mouseleave: function () {
										$(this).removeClass("edit-cell-enter").children("div.cell-border").remove();
									}
								}).addClass("edit-cell");
							}
						} else {
							if ($.isPlainObject(val)) {
								$.each(val, function (prop, value) {
									oSpan.text(value);
									//只访问第一个属性
									return false;
								});
							} else {
								if (_options.header[cellIndex].type === "button") {
									var oButton = $("<button class='btn'>" + _options.header[cellIndex].display + "</button>");
									oButton.bind("click", function () {
										if(_options.header[cellIndex].callback) {
											_options.header[cellIndex].callback(val);
										}
									});
									oSpan.html(oButton);
								} else {
									if (typeof val === "string") {
										oSpan.text(val);
									} else {
										oSpan.html(val);
									}
								}
							}
						}
						oDiv.append(oSpan);
					});
					if (iRowIndex % 2 === 0) {
						oDiv.addClass("table-even");
					} else {
						oDiv.addClass("table-odd");
					}
					oDiv.bind({
						click: function () {
							var that = this;
							if (!$(this).hasClass("table-select")) {
								$(this).siblings(".table-select").removeClass("table-select");
								$(this).removeClass("table-enter").addClass("table-select");
								//默认选中第一个
								oDiv.children("span").each(function () {
									if ($(this).data("events")) {
										if ($(this).data("events")["click"]) {
											if ($(that).children("span").children(":input:not(:checkbox)").length === 0) {
												$(this).click();
											}
											return false;
										}
									}
								});
								//触发选中回调
								if (_options.onSelect) {
									_options.onSelect(iRowIndex);
								}
							}
						},
						mouseenter: function () {
							if (!$(this).hasClass("table-select")) {
								$(this).addClass("table-enter");
							}
						},
						mouseleave: function () {
							$(this).removeClass("table-enter");
						}
					});
					_oTableBodyDiv.append(oDiv);

					//判断单元格是否有足够的宽度用于显示内容，如果否则增加title提示
					oDiv.find("span").each(function () {
						if (this.scrollWidth > $(this).width()) {
							$(this).attr("title", $(this).text());
						}
					});
				});
				if (_options.showPage) {
					_pageBtnLogic();
				}
				_layout();
			}

			$.extend(this, {
				//往table中添加数据，默认显示第一页
				addRows: function (rows) {
					_oPage.addItems(rows);
					if (_options.showPage) {
						if (_oTableBodyDiv.children("div").length < _oPage.m_iPerPage) {
							_showRows(_oPage.getCurrentPageItems());
						}
					} else {
						_showRows(_oPage.m_aItems);
					}
					if (_options.showPage) {
						_pageBtnLogic();
					}
				},
				//清空数据
				deleteRows: function () {
					_oTableBodyDiv.empty();
					_oPage.clear();
					if (_options.showPage) {
						_pageBtnLogic();
					}
					if (_options.showCheckbox) {
						_oTableHeadDiv.find(":checkbox").eq(0).prop("checked", false);
					}
					_layout();
				},
				//获取复选框为选中状态的数据行，返回元素及数据
				getCheckedRows: function () {
					var oChecks = [];
					_oTableBodyDiv.children("div").each(function (index) {
						if ($(this).find(":checkbox").eq(0).prop("checked")) {
							if (_options.showPage && _oPage.m_iCurPage > 0) {
								index += (_oPage.m_iCurPage - 1) * _oPage.m_iPerPage;
							}
							oChecks.push({item: $(this), data:_oPage.m_aItems[index].concat()});
						}
					});
					return oChecks;
				},
				//获取选中的数据行
				getSelectedRow: function () {
					var oSelect = _oTableBodyDiv.find("div").filter(".table-select").eq(0);
					if (oSelect.length === 0) {
						return null;
					}
					return {item: oSelect, data: _oPage.m_aItems[oSelect.index()].concat()};
				},
				//获取所有数据
				getAllRows: function () {
					var oRows = [];
					_oTableBodyDiv.children("div").each(function (index) {
						oRows.push({item: $(this), data:_oPage.m_aItems[index].concat()});
					});
					return oRows;
				},
				disable: function (bDisabled) {
					if (bDisabled) {
						_oTableFootDiv.addClass("disabled");
					} else {
						_oTableFootDiv.removeClass("disabled");
					}
					_oTableDiv.find(":text").prop("disabled", bDisabled);
					_bNoEdit = bDisabled;
				},
				disableRow: function (iRowIndex) {
					_oTableBodyDiv.find("div.table-row").eq(iRowIndex).find(":input").prop("disabled", true);
				},
                //隐藏iRowIndex行的按钮
                hideButton: function (iRowIndex) {
                    _oTableBodyDiv.find("div.table-row").eq(iRowIndex).find(":button").hide();
                },
                //显示iRowIndex行的按钮
                showButton: function (iRowIndex) {
                    _oTableBodyDiv.find("div.table-row").eq(iRowIndex).find(":button").show();
                }
			});
			//Table resize调整翻页及布局
			_oTableDiv.resize(function () {
				_layout();
				//更新宽度
				var iCellStart = 0;
				_iRowWidth = _oTableHeadDiv.width() - 2 - _iScrollWidth;
				if (_options.showCheckbox) {
					_iRowWidth = _iRowWidth - (_iCheckBoxWidth + 1);
					iCellStart++;
				}
				if (_options.showIndex) {
					_iRowWidth = _iRowWidth - (_iIndexWidth + 1);
					iCellStart++;
				}
				//更新表格头宽度
				var iCellNum = iCellStart; //表格列数
				var bChangeWidth = false; //是否修改宽度
				$.each(_options.header, function (i) {
					if (_options.header[i].type === "data") {
						return;
					}
					iCellNum++;
					if (_options.header[i].percentWidth !== "") {
						_options.header[i].width = Math.floor(parseInt(_options.header[i].percentWidth, 10) * _iRowWidth / 100) + "";
						bChangeWidth = true;
					}
				});
				if (bChangeWidth) {
					_oTableHeadDiv.find("span").each(function (index) {
						if (index < iCellStart) {
							return;
						}
						$(this).width(_options.header[index - iCellStart].width);
					});
					//更新表格内容宽度
					_oTableBodyDiv.find("span").each(function (index) {
						index = index % iCellNum;
						if (index < iCellStart) {
							return;
						}
						$(this).width(_options.header[index - iCellStart].width);
					});
					//更新剩余显示宽度
					_oTableRemain.find("span").each(function (index) {
						if (index < iCellStart) {
							return;
						}
						$(this).width(_options.header[index - iCellStart].width);
					});
				}

				//更新高度
				if (_options.showPage) {
					if (_options.perPage === 0) {
						var iTableBodyHeight = _oTableDiv.height() - _oTableHeadDiv.outerHeight(true) - _oTableFootDiv.outerHeight(true);

						var iPerPage = Math.floor(iTableBodyHeight / _iRowHeight);
						if (_oPage.m_iPerPage !== iPerPage) {
							_oPage.setPerPage(iPerPage);

							if (_oTableBodyDiv.children("div").length !== _oPage.m_iPerPage) {
								_showRows(_oPage.getCurrentPageItems());
							}
						}
					}
				}
			});

			_layout();

			//如果支持分页，设置每页显示的数量
			if (_options.showPage) {
				_pageBtnLogic();
				if (_options.perPage !== 0) {
					_oPage.setPerPage(_options.perPage);
				} else {
					var iTableBodyHeight = _oTableDiv.height() - _oTableHeadDiv.outerHeight(true) - _oTableFootDiv.outerHeight(true);
					_oPage.setPerPage(Math.floor(iTableBodyHeight / _iRowHeight));
				}
			}

			return _self;
		}
	})(jQuery);
});