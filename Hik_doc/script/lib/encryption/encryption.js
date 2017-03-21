define(function(require, exports, module) {
	var _oCommon, _oUtils, _oBase64;

	require("AES");
	require("cryptico");
	require("websdk");
	_oCommon = require("common");
	_oUtils = require("utils");
	_oBase64 = require("base64");

	function EncryptionFac () {
	}

	EncryptionFac.prototype.toHex = function (str) {
		var val = "";
		for(var i = 0; i < str.length; i++) {
			if(val === "") {
				val = str.charCodeAt(i).toString(16);
			} else {
				if(str.charCodeAt(i) < 16) {
					val += "0" + str.charCodeAt(i).toString(16);
				} else {
					val += str.charCodeAt(i).toString(16);
				}
			}
		}
		return val;
	};

	EncryptionFac.prototype.encryptPassword = function (szPsw, iRSABits, cbFun) {
		var that = this,
			iBits = 1024;

		if (iRSABits) {
			iBits = iRSABits;
		}

		var szPassPhrase =  new Date() + "",
			szMattsRSAkey = cryptico.generateRSAKey(szPassPhrase, iBits),
			szPublicKeyString = cryptico.publicKeyString(szMattsRSAkey),
			szXml = "<?xml version='1.0' encoding='UTF-8'?><PublicKey><key>" + _oBase64.encode(szPublicKeyString) + "</key></PublicKey>",
			oXmlDoc = _oUtils.parseXmlFromStr(szXml);

		WebSDK.WSDK_Activate(_oCommon.m_szHostName, _oCommon.m_iHttpProtocal, _oCommon.m_iHttpPort, {
			cmd: "challenge",
			type: "POST",
			data: oXmlDoc,
			success: function (status, xmlDoc) {
				var szDecryptionResult = cryptico.decrypt(_oBase64.decode(_oUtils.nodeValue(xmlDoc, "key")), szMattsRSAkey);
				if(szDecryptionResult.plaintext != null) {
					var szKey,szEncryptPassword;
					if (iBits === 256) {
						szKey = that.toHex(szDecryptionResult.plaintext);
					} else {
						szKey = szDecryptionResult.plaintext;
					}

					szEncryptPassword = aes_encrypt(szDecryptionResult.plaintext.substring(0, 16), szKey, true) + aes_encrypt(szPsw, szKey, true);
				
					if(cbFun) {
						cbFun(_oBase64.encode(szEncryptPassword));
					}
				}
			}
		});
	}

	module.exports = new EncryptionFac();
});