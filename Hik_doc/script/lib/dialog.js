define(function (require, exports, module) {
	
	var $, oCommon, oTranslator;
	
	$ = require("jquery");
	require("artDialog");
	oTranslator = require("translator");

	function Dialog() {}

	Dialog.prototype = {
		// 警告框
		alert: function (szContent, nWidth, fCallback) {
			var self = this;

			if ("undefined" == typeof $.dialog) {
				alert("artDialog is undefined!");
				return;
			}
			if ("undefined" == typeof szContent || null == szContent) {
				szContent = "";
			}
			if ("undefined" == typeof nWidth || null == nWidth) {
				nWidth = 300;
			}

			self.showPlugin(false);

			setTimeout(function () {
				$.dialog({
					id: "dialogalert",
					title: oTranslator.getValue("tip"),
					content: szContent,
					zIndex: 10000,
					width: nWidth,
					height: 105,
					left: "50%",
					top: "50%",
					fixed: true,
					drag: false,
					resize: false,
					lock: true,
					duration: 0,
					button: [{
						name: oTranslator.getValue("ok"),
						focus: true
					}],
					close: function () {
						self.showPlugin(true);
						if (fCallback) {
							fCallback();
						}
					}
				});
			}, 10);
		},
		// 确认框
		confirm: function (szContent, nWidth, cbOk, cbCancel) {
			var self = this;

			if ("undefined" == typeof $.dialog) {
				alert("artDialog is undefined!");
				return;
			}
			if ("undefined" == typeof szContent || null == szContent) {
				szContent = "";
			}
			if ("undefined" == typeof nWidth || null == nWidth) {
				nWidth = 300;
			}

			self.showPlugin(false);

			setTimeout(function () {
				$.dialog({
					id: "dialogconfirm",
					title: oTranslator.getValue("tip"),
					content: szContent,
					zIndex: 10000,
					width: nWidth,
					height: 105,
					left: "50%",
					top: "50%",
					fixed: true,
					drag: false,
					resize: false,
					lock: true,
					duration: 0,
					button: [{
						name: oTranslator.getValue("ok"),
						focus: true,
						callback: function () {
							if (cbOk) {
								cbOk();
							}
						}
					},{
						name: oTranslator.getValue("cancel"),
						callback: function () {
							if (cbCancel) {
								cbCancel();
							}
						}
					}],
					close: function () {
						self.showPlugin(true);
					}
				});
			}, 10);
		},
		// 提示框
		tip: function (szContent, nTime, nWidth, nHeight, szTitle) {
			if ("undefined" == typeof $.dialog) {
				alert("artDialog is undefined!");
				return;
			}
			if ("undefined" == typeof szContent) {
				szContent = "";
			}
			if ("undefined" == typeof nTime) {
				nTime = 3;
			}
			if ("undefined" == typeof nWidth || null == nWidth) {
				nWidth = 200;
			}
			if ("undefined" == typeof nHeight || null == nHeight) {
				nHeight = 100;
			}
			if ("undefined" == typeof szTitle) {
				szTitle = oTranslator.getValue("tip");
			}

			var dt = artDialog.get("dialogtip");
			if (typeof dt != "undefined") {
				dt.close();
			}
			$.dialog({
				id: "dialogtip",
				title: szTitle,
				content: szContent,
				zIndex: 10000,
				width: nWidth,
				height: nHeight,
				left: "100%",
				top: "100%",
				fixed: true,
				drag: false,
				resize: false,
				lock: false,
				duration: 0,
				time: nTime,
				close: function () {
					if (this.mouseover) {
						return false;
					}
					var d = $.dialog.list["dialogtip"];
					d.DOM.se[0].style.height = "";
					d.DOM.sw[0].style.height = "";
				},
				mouseout: function () {
					this.time(nTime);
				}
			});
			var d = artDialog.get("dialogtip");
			d.DOM.se[0].style.height = "1px";
			d.DOM.sw[0].style.height = "1px";
			d.position("100%", "100%");
		},
		// 等待框
		wait: function (szTitle, szContent) {
			if ("undefined" == typeof szTitle || null == szTitle) {
				szTitle = oTranslator.getValue("tip");
			}
			if ("undefined" == typeof szContent || null == szContent) {
				szContent = "";
			}

			var dialog = $.dialog({
				id: "dialogwait",
				title: szTitle,
				content: "<img src='../ui/images/artDialog/loading.gif' width='16' height='16' class='v-middle' />&nbsp;" + szContent,
				zIndex: 10000,
				width: 300,
				height: 150,
				left: "50%",
				top: "50%",
				fixed: true,
				drag: false,
				resize: false,
				lock: true,
				cancel: false,
				duration: 0,
				close: function () {
					var d = $.dialog.list["dialogwait"];
					d.DOM.se[0].style.height = "";
					d.DOM.sw[0].style.height = "";
				}
			});
			var d = $.dialog.list["dialogwait"];
			d.DOM.se[0].style.height = "1px";
			d.DOM.sw[0].style.height = "1px";
			d.position("50%", "50%");

			return dialog;
		},
		// html弹出框
		html: function (szTitle, szContent, nWidth, nHeight, cbOk, cbCancel, cbClose, iZindex) {
			if ("undefined" == typeof $.dialog) {
				alert("artDialog is undefined!");
				return;
			}
            var self = this;
            self.showPlugin(false);
			var szDialogID = "",
				zIndex = iZindex;

			if (szTitle && "object" == typeof szTitle) {
				var oOptions = szTitle;
				szTitle = oOptions.szTitle;
				szContent = oOptions.szContent;
				nWidth = oOptions.nWidth;
				nHeight = oOptions.nHeight;
				cbOk = oOptions.cbOk;
				cbCancel = oOptions.cbCancel;
				cbClose = oOptions.cbClose;
				oButtons = oOptions.oButtons;
				szDialogID = oOptions.id;
				zIndex = oOptions.zIndex;
			} else {
				oButtons = {
					bOK: true,
					bCancel: true,
					bClose: true
				};
			}

			if ("undefined" == typeof szTitle) {
				szTitle = "";
			}

			szDialogID = szDialogID ? szDialogID : "dialoghtml";
			zIndex = zIndex ? zIndex : 1999;


			if ("undefined" == typeof szContent) {
				szContent = "";
			}
			if ("undefined" == typeof nWidth || null == nWidth) {
				nWidth = "auto";
			}
			if ("undefined" == typeof nHeight || null == nHeight) {
				nHeight = "auto";
			}

			var aButtons = [];
			if (oButtons.bOK) {
				aButtons.push({
					name: oTranslator.getValue("ok"),
					focus: true,
					callback: function () {
						if (cbOk) {
							return cbOk();
						}
					}
				});
			}

			if (oButtons.bCancel) {
				aButtons.push({
					name: oTranslator.getValue("cancel"),
					callback: function () {
						if (cbCancel) {
							cbCancel();
						}
					}
				});
			}

			var oParams = {
				id: szDialogID,
				title: szTitle,
				content: szContent,
				zIndex: zIndex,
				width: nWidth,
				height: nHeight,
				left: "50%",
				top: "50%",
				fixed: true,
				drag: false,
				resize: false,
				lock: true,
				duration: 0,
				button: aButtons,
				close: function () {
                    self.showPlugin(true);
                    if (cbClose) {
						cbClose();
					}
				}
			};

			if (oButtons.bClose !== true) {
				oParams.cancel = false;
			}

			var dialog = $.dialog(oParams);
			var d = $.dialog.list[szDialogID];
			d.position("50%", "50%");

			return dialog;
		},
		// html弹出框不带按钮
		htmlNoButton: function (szTitle, szContent, iWidth, iHeight) {
			if ("undefined" == typeof szTitle || null == szTitle) {
				szTitle = oTranslator.getValue("tip");
			}
			if ("undefined" == typeof szContent || null == szContent) {
				szContent = "";
			}
			if ("undefined" == typeof iWidth || null == iWidth) {
				iWidth = 200;
			}
			if ("undefined" == typeof iHeight || null == iHeight) {
				iHeight = 100;
			}

			var dialog = $.dialog({
				id: "dialogHtmlNoButton",
				title: szTitle,
				content: szContent,
				zIndex: 1999,
				width: iWidth,
				height: iHeight,
				left: "50%",
				top: "50%",
				fixed: true,
				drag: false,
				resize: false,
				lock: true,
				cancel: false,
				duration: 0,
				close: function () {
					var d = $.dialog.list["dialogHtmlNoButton"];
					d.DOM.se[0].style.height = "";
					d.DOM.sw[0].style.height = "";
				}
			});
			var d = $.dialog.list["dialogHtmlNoButton"];
			d.DOM.se[0].style.height = "1px";
			d.DOM.sw[0].style.height = "1px";
			d.position("50%", "50%");

			return dialog;
		},
		// 隐藏/显示插件
		showPlugin: function (bShow) {
			if (bShow) {
				if ($("#PreviewActiveX").length > 0) {
					$("#PreviewActiveX").css("visibility", "");
				}
				if ($("#playbackbar").length > 0) {
					$("#playbackbar").css("visibility", "");
				}
			} else {
				if ($("#PreviewActiveX").length > 0) {
					$("#PreviewActiveX").css("visibility", "hidden");
				}
				if ($("#playbackbar").length > 0) {
					$("#playbackbar").css("visibility", "hidden");
				}
			}
		}
	};

	module.exports = new Dialog();
});