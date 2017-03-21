/**
 * Created by chenxiangzhen on 2014/8/21.
 */
define(function (require, exports, module) {
	var _oUtils = require("utils");
	function xmlDoc(xml) {
		var oXmlDoc = null;
		var szType = typeof xml;
		if (szType === "string") {
			oXmlDoc = _oUtils.parseXmlFromStr(xml);
		} else if (szType === "object") {
			oXmlDoc = xml;
		} else {
			oXmlDoc = _oUtils.createXml();
		}
		this.m_oXmlDoc = oXmlDoc;
		this.m_oRootNode = null;
		if (this.m_oXmlDoc.childNodes.length > 0) {
			this.m_oRootNode = this.m_oXmlDoc.documentElement;
		} else {
			var Instruction = this.m_oXmlDoc.createProcessingInstruction("xml","version='1.0' encoding='utf-8'");
			this.m_oXmlDoc.appendChild(Instruction);
		}
	}
	xmlDoc.prototype = {
		createNode: function (nodeName, nodeValue) {
			var oNewNode = this.m_oXmlDoc.createElement(nodeName);
			if (nodeValue) {
				var oNewText = this.m_oXmlDoc.createTextNode(nodeValue);
				oNewNode.appendChild(oNewText);
			}
			return oNewNode;
		},
		//插入节点，newNode可以是节点对象，也可以是"nodeName:nodeValue"字符串
		insert: function (newNode, parentNode) {
			if (!newNode) {
				return undefined;
			}
			if (typeof newNode === "string") {
				var iPos = newNode.indexOf(":");
				if (iPos === -1) {
					newNode = this.createNode(newNode);
				} else {
					newNode = this.createNode(newNode.substring(0, iPos), newNode.substring(iPos + 1));
				}

			}
			if (typeof parentNode === "string") {
				if (this.m_oRootNode.hasChildNodes(node)) {
					parentNode = this.m_oRootNode.getElementsByTagName(node)[0];
				} else {
					parentNode = undefined;
				}
			}
			if (this.m_oRootNode === null) {
				if (typeof parentNode === "undefined") {
					this.m_oXmlDoc.appendChild(newNode);
					this.m_oRootNode = newNode;
				} else {
					this.m_oXmlDoc.appendChild(parentNode);
					parentNode.appendChild(newNode);
				}

			} else {
				if (typeof parentNode === "undefined") {
					this.m_oRootNode.appendChild(newNode);
				} else {
					parentNode.appendChild(newNode);
				}
			}
			return newNode;
		},
		insertBefore: function (newNode, node) {
			if (!newNode) {
				return undefined;
			}
			if (typeof newNode === "string") {
				var iPos = newNode.indexOf(":");
				if (iPos === -1) {
					newNode = this.createNode(newNode);
				} else {
					newNode = this.createNode(newNode.substring(0, iPos), newNode.substring(iPos + 1));
				}

			}
			if (typeof node === "string") {
				var aNodeNames = node.split("->");
				node = this.m_oRootNode;
				for (var i = 0; i < aNodeNames.length; i++) {
					if (node.getElementsByTagName(aNodeNames[i]).length === 0) {
						node = undefined;
						break;
					} else {
						node = node.getElementsByTagName(aNodeNames[i])[0];
					}
				}
			}
			if (typeof node === "undefined") {
				return undefined;
			}
			this.m_oRootNode.insertBefore(newNode, node);
			return newNode;
		},
		insertAfter: function (newNode, node) {
			if (!newNode) {
				return undefined;
			}
			if (typeof newNode === "string") {
				var iPos = newNode.indexOf(":");
				if (iPos === -1) {
					newNode = this.createNode(newNode);
				} else {
					newNode = this.createNode(newNode.substring(0, iPos), newNode.substring(iPos + 1));
				}

			}
			if (typeof node === "string") {
				var aNodeNames = node.split("->");
				node = this.m_oRootNode;
				for (var i = 0; i < aNodeNames.length; i++) {
					if (node.getElementsByTagName(aNodeNames[i]).length === 0) {
						node = undefined;
						break;
					} else {
						node = node.getElementsByTagName(aNodeNames[i])[0];
					}
				}
			}
			if (typeof node === "undefined") {
				return undefined;
			}
			if (node.nextSibling === null) {
				node.parentNode.appendChild(newNode);
			} else {
				this.m_oRootNode.insertBefore(newNode, node.nextSibling);
			}
			return newNode;
		},
		getNodeValue: function(node) {
			if (!node) {
				return "";
			}
			if (typeof node === "string") {
				var aNodeNames = node.split("->");
				node = this.m_oRootNode;
				for (var i = 0; i < aNodeNames.length; i++) {
					if (node.getElementsByTagName(aNodeNames[i]).length === 0) {
						node = undefined;
						break;
					} else {
						node = node.getElementsByTagName(aNodeNames[i])[0];
					}
				}
			}
			if (typeof node === "undefined") {
				return "";
			}

			if (node.childNodes.length > 0) {
				return node.childNodes[0].nodeValue;
			} else {
				return "";
			}
		},
		setNodeValue: function(node, nodeValue) {
			if (!node) {
				return undefined;
			}
			if (typeof node === "string") {
				var aNodeNames = node.split("->");
				node = this.m_oRootNode;
				for (var i = 0; i < aNodeNames.length; i++) {
					if (node.getElementsByTagName(aNodeNames[i]).length === 0) {
						node = undefined;
						break;
					} else {
						node = node.getElementsByTagName(aNodeNames[i])[0];
					}
				}

			}
			if (typeof node === "undefined") {
				return undefined;
			}
			if (node.childNodes.length > 0) {
				node.childNodes[0].nodeValue = nodeValue;
			}
			return node;
		},
		removeNode: function(node) {
			if (!node) {
				return;
			}
			if (typeof node === "string") {
				var aNodeNames = node.split("->");
				node = this.m_oRootNode;
				for (var i = 0; i < aNodeNames.length; i++) {
					if (node.getElementsByTagName(aNodeNames[i]).length === 0) {
						node = undefined;
						break;
					} else {
						node = node.getElementsByTagName(aNodeNames[i])[0];
					}
				}
			}
			if (typeof node === "undefined") {
				return;
			}
			this.m_oRootNode.removeChild(node);
		}
	};
	module.exports = xmlDoc;
});