define(function (require, exports, module) {
	function webSession () {
		this._bSupportSession = typeof sessionStorage === "object";
		if (!this._bSupportSession) {
			document.documentElement.addBehavior("#default#userdata");
		}
	}

	webSession.prototype = {
		getItem: function (szAttr) {
			with (this) {
				if (_bSupportSession) {
					return sessionStorage.getItem(szAttr);
				} else {
					with(document.documentElement) {
						try {
							load(szAttr);
							return getAttribute("value");
						} catch (ex) {
							return null;
						}
					}
				}
			}
		},
		setItem: function (szAttr, szVal) {
			with (this) {
				if (_bSupportSession) {
					return sessionStorage.setItem(szAttr, szVal);
				} else {
					with(document.documentElement) {
						try {
							load(szAttr);
							setAttribute("value", szVal);
							save(szAttr);
							return getAttribute("value");
						} catch (ex){
							return  null;
						}
					}
				}
			}
		},
		removeItem: function (szAttr) {
			with (this) {
				if (_bSupportSession) {
					sessionStorage.removeItem(szAttr);
				} else {
					with(document.documentElement) {
						try {
							load(szAttr);
							expires = new Date(630892799000).toUTCString();
							save(szAttr);
						} catch (ex) {}
					}
				}
			}
		}
	};

	module.exports = new webSession();
});