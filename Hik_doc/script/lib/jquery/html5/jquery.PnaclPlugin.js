/**
 * @file jquery.PnaclPlugin.js
 * @author fengzhongjian
*/
(function($) {
    $.fn.PnaclWebPlugin = function (options) {
        var oPlugin = this;
        defaults = $.extend({
            iType: 1,  //插件类型, 预览、回放为类型2，配置为类型1
            iWndType: 1  //默认窗口分割模式
        },  options);

        var oToolClass = (function () {
            return {
                //采用类式继承
                inherits: function (subClass, superClass) {
                    var F = function () {};
                    F.prototype = superClass.prototype;
                    subClass.prototype = new F();  //subClass.prototype.__proto__ = F.prototype;
                    subClass.prototype.constructor = subClass;
                    subClass.superclass = superClass.prototype;  //子类添加superclass属性，降低子类和基类的耦合性
                    if (superClass.prototype.constructor === Object.prototype.constructor) {  //保证基类的constructor属性被正确设置
                        superClass.prototype.constructor = superClass;
                    }
                },
                //创建xml DOM对象
                createxmlDoc: function () {
                    var xmlDoc;
                    var aVersions = [ "MSXML2.DOMDocument","MSXML2.DOMDocument.5.0",
                        "MSXML2.DOMDocument.4.0","MSXML2.DOMDocument.3.0",
                        "Microsoft.XmlDom"];
                    for (var i = 0, len = aVersions.length; i < len; i++) {
                        try {
                            xmlDoc = new ActiveXObject(aVersions[i]);
                            break;
                        } catch (e) {
                            xmlDoc = document.implementation.createDocument("", "", null);
                            break;
                        }
                    }
                    xmlDoc.async = "false";
                    return xmlDoc;
                },
                //从xml字符串中解析xml
                parseXmlFromStr: function (szXml) {
                    if (null === szXml || '' === szXml || undefined === szXml) {
                        return null;
                    }
                    var xmlDoc = new this.createxmlDoc();
                    if (navigator.appName === "Netscape" || navigator.appName === "Opera") {
                        var oParser = new DOMParser();
                        xmlDoc = oParser.parseFromString(szXml, "text/xml");
                    } else {
                        xmlDoc.loadXML(szXml);
                    }
                    return xmlDoc;
                },
                oBase64: {
                    // private property
                    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                    // public method for encoding
                    encode: function (input) {
                        var output = "";
                        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                        var i = 0;
                        input = this._utf8_encode(input);
                        while (i < input.length) {
                            chr1 = input.charCodeAt(i++);
                            chr2 = input.charCodeAt(i++);
                            chr3 = input.charCodeAt(i++);
                            enc1 = chr1 >> 2;
                            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                            enc4 = chr3 & 63;
                            if (isNaN(chr2)) {
                                enc3 = enc4 = 64;
                            } else if (isNaN(chr3)) {
                                enc4 = 64;
                            }
                            output = output +
                            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
                        }
                        return output;
                    },
                    // public method for decoding
                    decode: function (input) {
                        var output = "";
                        var chr1, chr2, chr3;
                        var enc1, enc2, enc3, enc4;
                        var i = 0;
                        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                        while (i < input.length) {
                            enc1 = this._keyStr.indexOf(input.charAt(i++));
                            enc2 = this._keyStr.indexOf(input.charAt(i++));
                            enc3 = this._keyStr.indexOf(input.charAt(i++));
                            enc4 = this._keyStr.indexOf(input.charAt(i++));
                            chr1 = (enc1 << 2) | (enc2 >> 4);
                            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                            chr3 = ((enc3 & 3) << 6) | enc4;
                            output = output + String.fromCharCode(chr1);
                            if (enc3 != 64) {
                                output = output + String.fromCharCode(chr2);
                            }
                            if (enc4 != 64) {
                                output = output + String.fromCharCode(chr3);
                            }
                        }
                        output = this._utf8_decode(output);
                        return output;
                    },
                    // private method for UTF-8 encoding
                    _utf8_encode: function (string) {
                        string = string.replace(/\r\n/g,"\n");
                        var utftext = "";
                        for (var n = 0; n < string.length; n++) {
                            var c = string.charCodeAt(n);
                            if (c < 128) {
                                utftext += String.fromCharCode(c);
                            } else if ((c > 127) && (c < 2048)) {
                                utftext += String.fromCharCode((c >> 6) | 192);
                                utftext += String.fromCharCode((c & 63) | 128);
                            } else {
                                utftext += String.fromCharCode((c >> 12) | 224);
                                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                                utftext += String.fromCharCode((c & 63) | 128);
                            }
                        }
                        return utftext;
                    },
                    // private method for UTF-8 decoding
                    _utf8_decode: function (utftext) {
                        var string = "";
                        var i = 0;
                        var c = 0;
                        var c1 = 0;
                        var c2 = 0;
                        while (i < utftext.length) {
                            c = utftext.charCodeAt(i);
                            if (c < 128) {
                                string += String.fromCharCode(c);
                                i++;
                            } else if ((c > 191) && (c < 224)) {
                                c2 = utftext.charCodeAt(i + 1);
                                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                                i += 2;
                            } else {
                                c2 = utftext.charCodeAt(i + 1);
                                c3 = utftext.charCodeAt(i + 2);
                                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                                i += 3;
                            }
                        }
                        return string;
                    }
                }
            };
        })();

        var drawClass = (function () {
            var oCanvas = null;
            var oContext = null;
            var self = null;  //self指向drawClass对象，在initCanvas函数中初始化

            //图形基类
            function Shape() {
                this.m_aPoint = [];  //点坐标
                this.m_bChoosed = false;  //是否被选中
                this.m_szDrawColor = "";  //线的颜色
                this.m_szFillColor = "";  //填充颜色
                this.m_iTranslucent = 0;  //透明度
                this.m_iIndexChoosePoint = -1;  //鼠标点击选中的点
                this.m_iDriftStartX = 0;  //drag起始坐标
                this.m_iDriftStartY = 0;  //drag起始坐标
                this.m_oEdgePoints = {top: {x: 0,y: 0}, left: {x: 0,y: 0}, right: {x: 0, y: 0}, bottom: {x: 0, y: 0}};  //多边形中用于判断边界
                this.m_szTips = "";  //图形内部显示文字信息
                this.m_szId = "";  //图形id
                this.m_iEditType = 0;  //图形是否可编辑

                /*多边形和线用的属性*/
                this.m_iMinClosed = 3;  //至少几个坐标可闭合图像
                this.m_iMaxPointNum = 11;  //支持的最大坐标点数目
                this.m_bClosed = false;  //图像目前是否闭合
            }
            Shape.prototype = {
                constructor: Shape,
                draw: function () {},  //鼠标绘制函数，由于各个子类图形绘制方式不同，下放到子类实现
                drag: function (iPointX, iPointY) {  //图形移动
                    var iLength = this.m_aPoint.length;
                    var i = 0;
                    for (i = 0; i < iLength; i++) {
                        if (this.m_aPoint[i][0] + iPointX - this.m_iDriftStartX > self.m_iCanvasWidth || this.m_aPoint[i][1] + iPointY - this.m_iDriftStartY > self.m_iCanvasHeight || 
                            this.m_aPoint[i][0] + iPointX - this.m_iDriftStartX < 0 || this.m_aPoint[i][1] + iPointY - this.m_iDriftStartY < 0) {
                            this.m_iDriftStartX = iPointX;
                            this.m_iDriftStartY = iPointY;
                            return;
                        }
                    }
                    for (i = 0; i < iLength; i++) {
                        this.m_aPoint[i][0] = this.m_aPoint[i][0] + iPointX - this.m_iDriftStartX;
                        this.m_aPoint[i][1] = this.m_aPoint[i][1] + iPointY - this.m_iDriftStartY;
                    }
                    this.m_iDriftStartX = iPointX;
                    this.m_iDriftStartY = iPointY;
                    this.setEdgePoints(this.m_aPoint);
                    if (self) {
                        self.redraw(true);
                    }
                },
                stretch: function (iPointX, iPointY) {  //图形拉伸
                    if (this.m_iEditType === 0) {
                        if(this.m_iIndexChoosePoint !== -1) {
                            this.m_aPoint[this.m_iIndexChoosePoint][0] = iPointX;
                            this.m_aPoint[this.m_iIndexChoosePoint][1] = iPointY;
                        }
                        this.setPointInfo(this.m_aPoint);
                        if (self) {
                            self.redraw(true);
                        }
                    }
                },
                inShape: function (iPointX, iPointY) {  //判断是否在图形内
                    var bRet = false;
                    var iLen = this.m_aPoint.length;
                    for (var i = 0, j = iLen - 1; i < iLen; j = i++) {
                        if (((this.m_aPoint[i][1] > iPointY) !== (this.m_aPoint[j][1] > iPointY)) && (iPointX < (this.m_aPoint[j][0] - this.m_aPoint[i][0]) * (iPointY - this.m_aPoint[i][1] ) / (this.m_aPoint[j][1] - this.m_aPoint[i][1]) + this.m_aPoint[i][0])) {
                           bRet = !bRet;
                        }
                    }
                    return bRet;
                },
                inArc: function (iPointX, iPointY, iRadius) {  //判断是否在图形边界圆点内
                    var bRet = false;
                    for (var i = 0, iLen = this.m_aPoint.length; i < iLen; i++) {
                        var iDistance = Math.sqrt((iPointX - this.m_aPoint[i][0]) * (iPointX - this.m_aPoint[i][0]) + (iPointY - this.m_aPoint[i][1]) * (iPointY - this.m_aPoint[i][1]));
                        if (iDistance < iRadius) {
                            bRet = true;
                            this.m_iIndexChoosePoint = i;
                            break;
                        }
                    }
                    return bRet;
                },
                getMouseDownPoints: function (iMouseDownX, iMouseDownY) {  //鼠标点击选择图形时调用获取坐标偏差
                    this.m_iDriftStartX = iMouseDownX;
                    this.m_iDriftStartY = iMouseDownY;
                },
                getPointInfo: function () {
                    return this.m_aPoint;
                },
                setPointInfo: function (aPoint) {
                    if (aPoint !== null && aPoint !== undefined && aPoint.length > 0) {
                        this.m_aPoint = aPoint;
                        this.setEdgePoints(aPoint);
                    }
                },
                addPoint: function (iMouseDownX, iMouseDownY) {
                    if (this.m_aPoint.length < this.m_iMaxPointNum - 1) {
                        this.m_aPoint.push([iMouseDownX, iMouseDownY]);
                    }
                    if (this.m_aPoint.length === this.m_iMaxPointNum - 1) {
                        self.m_bShapeClosed = true;
                        this.m_bClosed = true;
                        this.setPointInfo(this.m_aPoint);
                        if (self) {
                            self.redraw(true);
                        }
                    }
                },
                setEdgePoints: function (aPoint) {
                    for (var i = 0, iLen = aPoint.length; i < iLen; i++) {
                        if (i === 0) {
                            this.m_oEdgePoints.top.x = aPoint[i][0];
                            this.m_oEdgePoints.top.y = aPoint[i][1];
                            this.m_oEdgePoints.left.x = aPoint[i][0];
                            this.m_oEdgePoints.left.y = aPoint[i][1];
                            this.m_oEdgePoints.right.x = aPoint[i][0];
                            this.m_oEdgePoints.right.y = aPoint[i][1];
                            this.m_oEdgePoints.bottom.x = aPoint[i][0];
                            this.m_oEdgePoints.bottom.y = aPoint[i][1];
                        } else {
                            if (aPoint[i][1] < this.m_oEdgePoints.top.y) {
                                this.m_oEdgePoints.top.x = aPoint[i][0];
                                this.m_oEdgePoints.top.y = aPoint[i][1];
                            }
                            if (aPoint[i][0] > this.m_oEdgePoints.right.x) {
                                this.m_oEdgePoints.right.x = aPoint[i][0];
                                this.m_oEdgePoints.right.y = aPoint[i][1];
                            }
                            if (aPoint[i][1] > this.m_oEdgePoints.bottom.y){
                                this.m_oEdgePoints.bottom.x = aPoint[i][0];
                                this.m_oEdgePoints.bottom.y = aPoint[i][1];
                            }
                            if (aPoint[i][0] < this.m_oEdgePoints.left.x) {
                                this.m_oEdgePoints.left.x = aPoint[i][0];
                                this.m_oEdgePoints.left.y = aPoint[i][1];
                            }
                        }
                    }
                }
            };

            //矩形类
            function Rect() {
                Rect.superclass.constructor.call(this);
            }
            oToolClass.inherits(Rect, Shape);
            Rect.prototype.setPointInfo = function (aPoint) {
                if (aPoint !== null && aPoint !== undefined) {
                    var iStartX = aPoint[0][0];
                    var iStartY = aPoint[0][1];
                    var iEndX = aPoint[0][0];
                    var iEndY = aPoint[0][1];
                    for (var i = 0, iLen = aPoint.length; i < iLen; i++) {
                        if (iStartX > aPoint[i][0]) {
                            iStartX = aPoint[i][0];
                        }
                        if (iStartY > aPoint[i][1]) {
                            iStartY = aPoint[i][1];
                        }
                        if (iEndX < aPoint[i][0]) {
                            iEndX = aPoint[i][0];
                        }
                        if (iEndY < aPoint[i][1]) {
                            iEndY = aPoint[i][1];
                        }
                    }
                    this.m_aPoint = [[iStartX, iStartY], [iEndX, iStartY], [iEndX, iEndY], [iStartX, iEndY]];
                }
            };
            Rect.prototype.draw = function () {
                oContext.fillStyle = this.m_szFillColor;
                oContext.strokeStyle = this.m_szDrawColor;
                var iStartX = this.m_aPoint[0][0];
                var iStartY = this.m_aPoint[0][1];
                var iWidth = this.m_aPoint[2][0] - iStartX;
                var iHeight = this.m_aPoint[2][1] - iStartY;
                oContext.globalAlpha = this.m_iTranslucent;
                oContext.fillRect(iStartX, iStartY, iWidth, iHeight);
                oContext.globalAlpha = 1;
                if (this.m_bChoosed) {
                    var iHalfWidth = Math.round(iWidth/2);
                    var iHalfHeight = Math.round(iHeight/2);

                    var aPointX = [iStartX, iStartX + iHalfWidth, iStartX + iWidth, iStartX, 
                        iStartX + iWidth, iStartX, iStartX + iHalfWidth, iStartX + iWidth];
                    var aPointY = [iStartY, iStartY, iStartY, iStartY + iHalfHeight, 
                        iStartY + iHalfHeight, iStartY + iHeight, iStartY + iHeight, iStartY + iHeight];
                    for (var i = 0; i < 8; i++) {
                        oContext.beginPath();
                        oContext.arc(aPointX[i], aPointY[i], 3, 0, 360, false);
                        oContext.fillStyle = this.m_szDrawColor;
                        oContext.closePath();
                        oContext.fill();
                    }
                }
                oContext.strokeRect(iStartX, iStartY, iWidth, iHeight);
            };
            Rect.prototype.stretch = function (iPointX, iPointY) {
                if (this.m_iEditType === 0) {
                    if (this.m_iIndexChoosePoint === 0) {
                        if (iPointX < this.m_aPoint[2][0] && iPointY < this.m_aPoint[2][1]) {
                            this.m_aPoint[0][0] = iPointX;
                            this.m_aPoint[0][1] = iPointY;
                            this.m_aPoint[3][0] = iPointX;
                            this.m_aPoint[1][1] = iPointY;
                        }
                    } else if (this.m_iIndexChoosePoint === 1) {
                        if (iPointY < this.m_aPoint[2][1]) {
                            this.m_aPoint[0][1] = iPointY;
                            this.m_aPoint[1][1] = iPointY;
                        }
                    } else if (this.m_iIndexChoosePoint === 2) {
                        if (iPointX > this.m_aPoint[3][0] && iPointY < this.m_aPoint[3][1]) {
                            this.m_aPoint[1][0] = iPointX;
                            this.m_aPoint[1][1] = iPointY;
                            this.m_aPoint[2][0] = iPointX;
                            this.m_aPoint[0][1] = iPointY;
                        }
                    } else if (this.m_iIndexChoosePoint === 3) {
                        if (iPointX < this.m_aPoint[2][0]) {
                            this.m_aPoint[0][0] = iPointX;
                            this.m_aPoint[3][0] = iPointX;
                        }
                    } else if (this.m_iIndexChoosePoint === 4) {
                        if (iPointX > this.m_aPoint[0][0]) {
                            this.m_aPoint[1][0] = iPointX;
                            this.m_aPoint[2][0] = iPointX;
                        }
                    } else if (this.m_iIndexChoosePoint === 5) {
                        if (iPointX < this.m_aPoint[1][0] && iPointY > this.m_aPoint[1][1]) {
                            this.m_aPoint[3][0] = iPointX;
                            this.m_aPoint[3][1] = iPointY;
                            this.m_aPoint[0][0] = iPointX;
                            this.m_aPoint[2][1] = iPointY;
                        }
                    } else if (this.m_iIndexChoosePoint === 6) {
                        if (iPointY > this.m_aPoint[1][1]) {
                            this.m_aPoint[2][1] = iPointY;
                            this.m_aPoint[3][1] = iPointY;
                        }
                    } else if (this.m_iIndexChoosePoint === 7) {
                        if (iPointX > this.m_aPoint[0][0] && iPointY > this.m_aPoint[0][1]) {
                            this.m_aPoint[2][0] = iPointX;
                            this.m_aPoint[2][1] = iPointY;
                            this.m_aPoint[1][0] = iPointX;
                            this.m_aPoint[3][1] = iPointY;
                        }
                    }
                    if (self) {
                        self.redraw(true);
                    }
                }
            };
            Rect.prototype.move = function (aPoint) {
                if (self) {
                    self.redraw(true);
                }
                if (self.m_szDisplayMode === "transparent") {
                    this.m_iTranslucent = 0;
                } else {
                    this.m_iTranslucent = 0.7;
                }
                this.m_szDrawColor = self.m_szDrawColor;
                this.m_szFillColor = self.m_szFillColor;
                this.m_bChoosed = true;
                var iStartX = aPoint[0][0];
                var iStartY = aPoint[0][1];
                var iEndX = aPoint[1][0];
                var iEndY = aPoint[1][1];
                this.setPointInfo([[iStartX, iStartY], [iEndX, iStartY], [iEndX, iEndY], [iStartX, iEndY]]);
                this.draw();
            };
            //返回选圆点的鼠标样式
            Rect.prototype.inArc = function (iPointX, iPointY, iRadius) {
                var iStartX = this.m_aPoint[0][0];
                var iStartY = this.m_aPoint[0][1];
                var iWidth = this.m_aPoint[2][0] - iStartX;
                var iHeight = this.m_aPoint[2][1] - iStartY;
                var iHalfWidth = Math.round(iWidth/2);
                var iHalfHeight = Math.round(iHeight/2);
                var aPointX = [iStartX, iStartX+iHalfWidth, iStartX+iWidth, iStartX, 
                    iStartX+iWidth, iStartX, iStartX+iHalfWidth, iStartX+iWidth];
                var aPointY = [iStartY, iStartY, iStartY, iStartY+iHalfHeight, 
                    iStartY+iHalfHeight, iStartY+iHeight, iStartY+iHeight, iStartY+iHeight];
                //var aCursors = ["nw-resize", "n-resize", "ne-resize", "w-resize", "e-resize", "sw-resize", "s-resize", "se-resize"];
                for (var i = 0; i < 8; i++) {
                    var iDistance = Math.sqrt((iPointX-aPointX[i])*(iPointX-aPointX[i])+(iPointY-aPointY[i])*(iPointY-aPointY[i]));
                    if (iDistance < iRadius) {
                        this.m_iIndexChoosePoint = i;
                        return true;
                    }
                }
                return false;
            };

            //OSD叠加
            function RectOSD() {
                RectOSD.superclass.constructor.call(this);
                this.m_szRectType = "";
                this.m_szDateStyle = "";
                this.m_szClockType = "";
                this.m_szDisplayWeek = "";
                this.m_szEnabled = "";
                this.m_szText = "";
                this.m_szId = "";
            }
            oToolClass.inherits(RectOSD, Rect);
            RectOSD.prototype.draw = function () {
                if (this.m_szEnabled === "true") {
                    var iStartX = this.m_aPoint[0][0];
                    var iStartY = this.m_aPoint[0][1];
                    var iWidth = this.m_aPoint[2][0] - iStartX;
                    var iHeight = this.m_aPoint[2][1] - iStartY;
                    oContext.beginPath();
                    oContext.strokeStyle = this.m_szDrawColor;
                    oContext.rect(iStartX, iStartY, iWidth, iHeight);
                    oContext.font = "15px serif";
                    oContext.strokeText(this.m_szText, iStartX, iStartY + 15);
                    oContext.stroke();
                }
            };
            RectOSD.prototype.drag = function (iPointX, iPointY) {
                var iLength = this.m_aPoint.length;
                var i = 0;
                for (i = 0; i < iLength; i++) {
                    if (this.m_aPoint[i][1] + iPointY - this.m_iDriftStartY > self.m_iCanvasHeight || 
                        this.m_aPoint[i][0] + iPointX - this.m_iDriftStartX < 0 || this.m_aPoint[i][1] + iPointY - this.m_iDriftStartY < 0) {
                        this.m_iDriftStartX = iPointX;
                        this.m_iDriftStartY = iPointY;
                        return;
                    }
                }
                for (i = 0; i < iLength; i++) {
                    this.m_aPoint[i][0] = this.m_aPoint[i][0] + iPointX - this.m_iDriftStartX;
                    this.m_aPoint[i][1] = this.m_aPoint[i][1] + iPointY - this.m_iDriftStartY;						
                }
                this.m_iDriftStartX = iPointX;
                this.m_iDriftStartY = iPointY;
                this.setEdgePoints(this.m_aPoint);
                if (self) {
                    self.redraw(true);
                }
            };
            RectOSD.prototype.stretch = function () {};  //重写基类的stretch, OSD不支持拉伸

            //栅格式移动侦测
            function MotionGrid() {
                MotionGrid.superclass.constructor.call(this);
                this.m_iGridWidth = 0;
                this.m_iGridHeight = 0;
                this.m_szGridMap = "";
                this.m_aAddGridMap = [];
            }
            oToolClass.inherits(MotionGrid, Shape);
            MotionGrid.prototype.draw = function() {
                var iWidth = oCanvas.width/this.m_iGridWidth;
                var iHeight = oCanvas.height/this.m_iGridHeight;
                var szResultGridMap = "";
                for (var i = 0; i < this.m_iGridHeight; i++) {
                    var szGridRowMap = this.m_szGridMap.substring(i * 6, i * 6 + 6);
                    var aBinaryMap = parseInt(("f" + szGridRowMap), 16).toString(2).split("").slice(4);
                    var szResultGridMapRow = "";
                    for (var j = 0; j < this.m_iGridWidth; j++) {
                        var szResultGridMapRowCol = "";
                        if (aBinaryMap[j] === "1") {
                            oContext.strokeStyle = this.m_szDrawColor;
                            oContext.strokeRect(iWidth * j, iHeight * i , iWidth, iHeight);
                            szResultGridMapRowCol = "1";
                        } else {
                            szResultGridMapRowCol = "0";
                        }
                        if (this.m_aAddGridMap.length) {
                            if (this.m_aAddGridMap[i][j] === 1) {
                                oContext.strokeStyle = this.m_szDrawColor;
                                oContext.strokeRect(iWidth * j, iHeight * i , iWidth, iHeight);
                                szResultGridMapRowCol = "1";
                            }
                        }
                        szResultGridMapRow += szResultGridMapRowCol;
                    }
                    szResultGridMap += parseInt("1111" + szResultGridMapRow + "00", 2).toString(16).substring(1);
                }
                this.m_szGridMap = szResultGridMap;
            };
            MotionGrid.prototype.move = function (iMouseDownX, iMouseDownY, iMouseMoveX, iMouseMoveY) {
                //szGridMap
                var iWidth = oCanvas.width / this.m_iGridWidth;
                var iHeight = oCanvas.height / this.m_iGridHeight;
                var iStartX = Math.floor(iMouseDownX / iWidth);
                var iStartY =  Math.floor(iMouseDownY / iHeight);
                var iRectColNum = Math.floor(Math.abs(iMouseMoveX-iMouseDownX) / iWidth);
                var iRectRowNum = Math.floor(Math.abs(iMouseMoveY-iMouseDownY) / iHeight);
                var iCoefficientX = 1;  //横坐标系数, 1: 起始坐标小于结束坐标, -1: 起始坐标小于结束坐标
                var iCoefficientY = 1;  //纵坐标系数
                if (iMouseMoveX - iMouseDownX > 0) {
                    iCoefficientX = 1;
                } else {
                    iCoefficientX = -1;
                }
                if (iMouseMoveY - iMouseDownY > 0) {
                    iCoefficientY = 1;
                } else {
                    iCoefficientY = -1;
                }
                var aAddGridMap= [];
                for (var i = 0; i < this.m_iGridHeight; i++) {
                    aAddGridMap[i] = [];
                    for (var j = 0; j < this.m_iGridWidth; j++) {
                        if (iCoefficientX === 1) {
                            if (iCoefficientY === 1) {
                                if (i >= iStartY && i <= (iStartY + iRectRowNum) && j >= iStartX && j <= (iStartX + iRectColNum)) {
                                    aAddGridMap[i][j] = 1;
                                } else {
                                    aAddGridMap[i][j] = 0;
                                }
                            } else {
                                if (i <= iStartY && i >= (iStartY - iRectRowNum) && j >= iStartX && j <= (iStartX + iRectColNum)) {
                                    aAddGridMap[i][j] = 1;
                                } else {
                                    aAddGridMap[i][j] = 0;
                                }
                            }
                        
                        } else {
                            if (iCoefficientY === 1) {
                                if (i >= iStartY && i <= (iStartY + iRectRowNum) && j <= iStartX && j >= (iStartX - iRectColNum)) {
                                    aAddGridMap[i][j] = 1;
                                } else {
                                    aAddGridMap[i][j] = 0;
                                }
                            } else {
                                if (i <= iStartY && i >= (iStartY - iRectRowNum) && j <= iStartX && j >= (iStartX - iRectColNum)) {
                                    aAddGridMap[i][j] = 1;
                                } else {
                                    aAddGridMap[i][j] = 0;
                                }
                            }
                        }
                    }
                }
                this.m_aAddGridMap = aAddGridMap;
                this.draw();
            };

            //线类
            function Line() {
                Line.superclass.constructor.call(this);
                this.m_iLineType = 0;  //普通线-0, 头上带箭头的线-1, 折线-2, 越界侦测线-3, 分离式过线统计线 -4
                this.m_iDirection = 0;
            }
            oToolClass.inherits(Line, Shape);

            Line.prototype.draw = function () {
                if (this.m_iLineType === 0) {
                    this.drawNormalLine();
                } else if (this.m_iLineType === 1) {
                    this.drawArrowLine();
                } else if (this.m_iLineType === 3) {
                    this.drawCrossLine();
                }
            };
            Line.prototype.drawNormalLine = function () {
                oContext.globalAlpha = 1;
                if (this.m_aPoint.length > 0) {
                    //连线
                    oContext.beginPath();
                    oContext.strokeStyle = this.m_szDrawColor;
                    oContext.lineWidth = 2;
                    oContext.moveTo(this.m_aPoint[0][0], this.m_aPoint[0][1]);
                    var i = 0;
                    var iLen = 0;
                    for (i = 1, iLen = this.m_aPoint.length; i < iLen; i++) {
                        oContext.lineTo(this.m_aPoint[i][0], this.m_aPoint[i][1]);
                    }
                    oContext.stroke();
                    //画点
                    if (this.m_bChoosed) {
                        for (i = 0, iLen = this.m_aPoint.length; i < iLen; i++) {
                            oContext.beginPath();
                            oContext.fillStyle = this.m_szDrawColor;
                            oContext.arc(this.m_aPoint[i][0], this.m_aPoint[i][1], 3, 0, Math.PI * 2, true);
                            oContext.closePath();
                            oContext.fill();
                        }
                    }
                    if (this.m_szTips !== "") {
                        oContext.strokeStyle = "#FFFF00";
                        oContext.font = "10px Verdana";
                        oContext.strokeText(this.m_szTips, (this.m_aPoint[0][0] + this.m_aPoint[1][0]) / 2 - 10, (this.m_aPoint[0][1] + this.m_aPoint[1][1]) / 2 + 4);
                    }
                }
            };
            Line.prototype.drawArrowLine = function () {
                oContext.beginPath();
                oContext.strokeStyle = this.m_szDrawColor;
                oContext.lineWidth = 2;
                oContext.moveTo(this.m_aPoint[0][0], this.m_aPoint[0][1]);
                oContext.lineTo(this.m_aPoint[1][0], this.m_aPoint[1][1]);
                oContext.stroke();
                oContext.save();

                //用canvas绘制箭头
                oContext.translate(this.m_aPoint[1][0], this.m_aPoint[1][1]);
                var ang = (this.m_aPoint[1][0] - this.m_aPoint[0][0]) / (this.m_aPoint[1][1] - this.m_aPoint[0][1]);
                ang = Math.atan(ang);
                if (this.m_aPoint[1][1] - this.m_aPoint[0][1] >= 0){
                    oContext.rotate(-ang);
                } else {
                    oContext.rotate(Math.PI - ang);//加个180度，反过来
                }
                oContext.fillStyle = this.m_szDrawColor;
                oContext.lineTo(-5, -10);
                oContext.lineTo(0, -5);
                oContext.lineTo(5 ,-10);
                oContext.lineTo(0, 0);
                oContext.fill();  //箭头是个封闭图形
                oContext.restore();  //恢复到堆的上一个状态，其实这里没什么用。
                oContext.closePath();
                //画圈
                if (this.m_bChoosed) {
                    for(var i= 0,iLen = this.m_aPoint.length; i < iLen;i++){
                        oContext.beginPath();
                        oContext.fillStyle = this.m_szDrawColor;
                        oContext.arc(this.m_aPoint[i][0], this.m_aPoint[i][1], 3, 0, Math.PI * 2, true);
                        oContext.closePath();
                        oContext.fill();
                    }
                }
            };
            Line.prototype.drawCrossLine = function () {
                oContext.globalAlpha = 1;
                //绘制tip文字提示
                oContext.fillStyle = this.m_szDrawColor;
                oContext.fillText(this.m_szTips, this.m_aPoint[0][0] + 10, this.m_aPoint[0][1] + 10);
                //绘制直线
                oContext.strokeStyle = this.m_szDrawColor;
                oContext.lineWidth = 2;
                oContext.beginPath();
                oContext.moveTo(this.m_aPoint[0][0], this.m_aPoint[0][1]);
                oContext.lineTo(this.m_aPoint[1][0], this.m_aPoint[1][1]);
                oContext.closePath();
                oContext.stroke();
                //绘制两个圆
                if (this.m_bChoosed) {
                    oContext.beginPath();
                    oContext.fillStyle = this.m_szDrawColor;
                    oContext.arc(this.m_aPoint[1][0], this.m_aPoint[1][1], 5, 0, Math.PI * 2, true);
                    oContext.closePath();
                    oContext.fill();
                    oContext.beginPath();
                    oContext.arc(this.m_aPoint[0][0], this.m_aPoint[0][1], 5, 0, Math.PI * 2, true);
                    oContext.closePath();
                    oContext.fill();
                }
                //绘制箭头,重新创建一个,用css3来控制旋转角度
                var  iMiddleX = parseInt((this.m_aPoint[0][0] + this.m_aPoint[1][0]) / 2);
                var  iMiddleY = parseInt((this.m_aPoint[0][1] + this.m_aPoint[1][1]) / 2);
                this.createLeftArrow(iMiddleX,iMiddleY);
                this.createRightArrow(iMiddleX,iMiddleY);
                if (this.m_iDirection === 1) {
                    $(oPlugin).find("div#arrow-right").hide();
                } else if (this.m_iDirection === 0) {
                    $(oPlugin).find("div#arrow-left").hide();
                } else {
                    //do nothing
                }
            };
            Line.prototype.createLeftArrow = function (iMiddleX, iMiddleY) {
                $(oPlugin).find("div#arrow_L").remove();  //重新绘制的时候清楚原来的箭头
                $(oPlugin).append("<div id='arrow_L'><div class='arrow arrow-right' id='arrow-left'></div><p>A</p></div>");
                var oArrow = $(oPlugin).find("div#arrow_L");
                oArrow.css("top", iMiddleY);
                oArrow.css("left", iMiddleX);
                var k = (this.m_aPoint[1][1] - this.m_aPoint[0][1]) / (this.m_aPoint[1][0]-this.m_aPoint[0][0]);
                var deg = 0;
                if (this.m_aPoint[0][1] < this.m_aPoint[1][1]) {
                    if (k > 0) {
                        deg = 180 * Math.atan(k) / Math.PI;
                        oArrow.css("-webkit-transform", "rotate(" + (deg - 90 + 180) + "deg)");
                    } else {
                        deg = 180 * Math.atan(k) / Math.PI;
                        oArrow.css("-webkit-transform", "rotate(" + (90 + deg + 180) + "deg)");
                    }
                } else {
                    if (k > 0) {
                        deg = 180 * Math.atan(k) / Math.PI;
                        oArrow.css("-webkit-transform", "rotate(" + (90 + deg + 180) + "deg)");
                    } else {
                        deg = 180 * Math.atan(k) / Math.PI;
                        oArrow.css("-webkit-transform", "rotate(" + (deg - 90 + 180) + "deg)");
                    }
                }
            };
            Line.prototype.createRightArrow = function (iMiddleX, iMiddleY) {
                $(oPlugin).find("div#arrow").remove();//重新绘制的时候清楚原来的箭头
                $(oPlugin).append("<div id='arrow'><div class= 'arrow arrow-right' id='arrow-right'></div><p>B</p></div>");
                var oArrow = $(oPlugin).find("div#arrow");
                oArrow.css("top", iMiddleY);
                oArrow.css("left", iMiddleX);
                var k = (this.m_aPoint[1][1] - this.m_aPoint[0][1]) / (this.m_aPoint[1][0] - this.m_aPoint[0][0]);
                var deg = 0;
                if (this.m_aPoint[0][1] < this.m_aPoint[1][1]){
                    if (k > 0) {
                        deg = 180 * Math.atan(k) / Math.PI;
                        oArrow.css("-webkit-transform", "rotate(" + (deg - 90) + "deg)");
                    } else {
                        deg = 180 * Math.atan(k) / Math.PI;
                        oArrow.css("-webkit-transform", "rotate(" + (90 + deg) + "deg)");
                    }
                } else {
                    if (k > 0) {
                        deg = 180 * Math.atan(k) / Math.PI;
                        oArrow.css("-webkit-transform","rotate(" + (90 + deg) + "deg)");
                    } else {
                        deg = 180 * Math.atan(k) / Math.PI;
                        oArrow.css("-webkit-transform","rotate(" + (deg - 90) + "deg)");
                    }
                }
            };
            //线的选中判断
            Line.prototype.inShape = function (iPointX, iPointY) {
                var bRet = false;
                for(var i = 0,iLen = this.m_aPoint.length - 1; i < iLen; i++){
                    var iLineLen = Math.sqrt((this.m_aPoint[(i+1)][0] - this.m_aPoint[i][0]) * (this.m_aPoint[(i + 1)][0] - this.m_aPoint[i][0]) + (this.m_aPoint[(i + 1)][1] - this.m_aPoint[i][1]) * (this.m_aPoint[(i + 1)][1] - this.m_aPoint[i][1]));
                    var iLineLen1 = Math.sqrt((iPointX - this.m_aPoint[i][0]) * (iPointX - this.m_aPoint[i][0]) + (iPointY - this.m_aPoint[(i)][1]) * (iPointY - this.m_aPoint[(i)][1]));
                    var iLineLen2 = Math.sqrt((iPointX - this.m_aPoint[(i + 1)][0]) * (iPointX - this.m_aPoint[(i + 1)][0]) + (iPointY - this.m_aPoint[(i + 1)][1])*(iPointY - this.m_aPoint[(i + 1)][1]));
                    if(iLineLen1 + iLineLen2 - iLineLen < 1) {
                        bRet = true;
                    }
                }
                return bRet;
            };

            //多边形
            function Polygon() {
                Polygon.superclass.constructor.call(this);
                this.m_iPolygonType = 1;
            }
            oToolClass.inherits(Polygon, Shape);
            Polygon.prototype.setPointInfo = function (aPoint) {
                if (aPoint !== null && aPoint !== undefined) {
                    if (this.m_iPolygonType === 0) {
                        var iStartX = aPoint[0][0];
                        var iStartY = aPoint[0][1];
                        var iEndX = aPoint[0][0];
                        var iEndY = aPoint[0][1];
                        for (var i = 0, iLen = aPoint.length; i < iLen; i++) {
                            if (iStartX > aPoint[i][0]) {
                                iStartX = aPoint[i][0];
                            }
                            if (iStartY > aPoint[i][1]) {
                                iStartY = aPoint[i][1];
                            }
                            if (iEndX < aPoint[i][0]) {
                                iEndX = aPoint[i][0];
                            }
                            if (iEndY < aPoint[i][1]) {
                                iEndY = aPoint[i][1];
                            }
                        }
                        this.m_aPoint = [[iStartX, iStartY], [iEndX, iStartY], [iEndX, iEndY], [iStartX, iEndY]];
                    } else if (this.m_iPolygonType === 1) {
                        this.m_aPoint = aPoint;
                    }
                    this.setEdgePoints(aPoint);
                }
            };
            Polygon.prototype.draw = function (bClosed) {
                if (this.m_aPoint.length > 0) {
                    oContext.fillStyle = this.m_szFillColor;
                    oContext.strokeStyle = this.m_szDrawColor;
                    oContext.globalAlpha = 1;
                    var i = 0;
                    var iLen = 0;
                    if (this.m_bChoosed) {
                        for (i = 0, iLen = this.m_aPoint.length; i < iLen; i++) {
                            oContext.beginPath();
                            oContext.arc(this.m_aPoint[i][0], this.m_aPoint[i][1], 3, 0, 360, false);
                            oContext.fillStyle = this.m_szDrawColor;
                            oContext.closePath();
                            oContext.fill();
                        }
                    }

                    oContext.beginPath();
                    oContext.moveTo(this.m_aPoint[0][0], this.m_aPoint[0][1]);
                    for (i = 0, iLen = this.m_aPoint.length; i < iLen; i++) {
                        if (i !== 0) {
                            oContext.lineTo(this.m_aPoint[i][0], this.m_aPoint[i][1]);
                        }
                    }
                    oContext.stroke();
                    if (bClosed || this.m_bClosed) {
                        oContext.fillText(this.m_szTips, (this.m_oEdgePoints.left.x + this.m_oEdgePoints.right.x) / 2, (this.m_oEdgePoints.top.y + this.m_oEdgePoints.bottom.y) / 2);
                        oContext.closePath();
                        oContext.stroke();
                        //填充区域颜色,设置透明度
                        oContext.globalAlpha = this.m_iTranslucent;
                        oContext.fill();
                    }
                }
            };
            Polygon.prototype.move = function (iMouseMoveX, iMouseMoveY, iMouseDownX, iMouseDownY) {
                if (this.m_iPolygonType === 1) {
                    if (this.m_aPoint.length < this.m_iMaxPointNum - 1 && this.m_aPoint.length > 0) {
                        oContext.fillStyle = this.m_szFillColor;
                        oContext.strokeStyle = this.m_szDrawColor;
                        oContext.globalAlpha = 1;
                        var i = 0;
                        var iLen = 0;
                        for (i = 0, iLen = this.m_aPoint.length; i < iLen; i++) {
                            oContext.beginPath();
                            oContext.arc(this.m_aPoint[i][0], this.m_aPoint[i][1], 3, 0, 360, false);
                            oContext.fillStyle = this.m_szDrawColor;
                            oContext.closePath();
                            oContext.fill();
                        }
                        oContext.beginPath();
                        oContext.moveTo(this.m_aPoint[0][0], this.m_aPoint[0][1]);
                        for (i = 0, iLen = this.m_aPoint.length; i < iLen; i++) {
                            if (i !== 0) {
                                oContext.lineTo(this.m_aPoint[i][0], this.m_aPoint[i][1]);
                            }
                        }
                        oContext.lineTo(iMouseMoveX, iMouseMoveY);
                        oContext.closePath();
                        oContext.stroke();
                    }
                } else if (this.m_iPolygonType === 0) {
                    this.m_szDrawColor = self.m_szDrawColor;
                    this.m_szFillColor = self.m_szFillColor;
                    this.m_bChoosed = true;
                    var iStartX = iMouseDownX;
                    var iStartY = iMouseDownY;
                    var iEndX = iMouseMoveX;
                    var iEndY = iMouseMoveY;
                    this.setPointInfo([[iStartX, iStartY], [iEndX, iStartY], [iEndX, iEndY], [iStartX, iEndY]]);
                    this.draw(true);
                }
            };
            Polygon.prototype.stretch = function (iPointX, iPointY) {
                if (this.m_iEditType === 0) {
                    if (this.m_iPolygonType === 1) {
                        if(this.m_iIndexChoosePoint !== -1) {
                            this.m_aPoint[this.m_iIndexChoosePoint][0] = iPointX;
                            this.m_aPoint[this.m_iIndexChoosePoint][1] = iPointY;
                        }
                    } else {
                        if (this.m_iIndexChoosePoint === 0) {
                            if (iPointX < this.m_aPoint[2][0] && iPointY < this.m_aPoint[2][1]) {
                                this.m_aPoint[0][0] = iPointX;
                                this.m_aPoint[0][1] = iPointY;
                                this.m_aPoint[3][0] = iPointX;
                                this.m_aPoint[1][1] = iPointY;
                            }
                        } else if (this.m_iIndexChoosePoint === 1) {
                            if (iPointX > this.m_aPoint[3][0] && iPointY < this.m_aPoint[3][1]) {
                                this.m_aPoint[1][0] = iPointX;
                                this.m_aPoint[1][1] = iPointY;
                                this.m_aPoint[2][0] = iPointX;
                                this.m_aPoint[0][1] = iPointY;
                            }
                        } else if (this.m_iIndexChoosePoint === 2) {
                            if (iPointX > this.m_aPoint[0][0] && iPointY > this.m_aPoint[0][1]) {
                                this.m_aPoint[2][0] = iPointX;
                                this.m_aPoint[2][1] = iPointY;
                                this.m_aPoint[1][0] = iPointX;
                                this.m_aPoint[3][1] = iPointY;
                            }
                        } else if (this.m_iIndexChoosePoint === 3) {
                            if (iPointX < this.m_aPoint[1][0] && iPointY > this.m_aPoint[1][1]) {
                                this.m_aPoint[3][0] = iPointX;
                                this.m_aPoint[3][1] = iPointY;
                                this.m_aPoint[0][0] = iPointX;
                                this.m_aPoint[2][1] = iPointY;
                            }
                        }
                    }
                    this.setPointInfo(this.m_aPoint);
                    if (self) {
                        self.redraw(true);
                    }
                }
            };

            var EventCallback = {
                zoomEventResponse: function (iMode, aPoint) {
                    var szXml = "";
                    if (iMode === 1) {
                        szXml += '<?xml version="1.0" encoding="utf-8"?><position3D>' +
                            '<StartPoint><positionX>' + Math.round(aPoint[0] * 255 / self.m_iCanvasWidth) + '</positionX>' +
                            '<positionY>' + (255 - Math.round(aPoint[1] * 255 / self.m_iCanvasHeight)) + '</positionY></StartPoint>' +
                            '<EndPoint><positionX>' + Math.round(aPoint[2] * 255 / self.m_iCanvasWidth) + '</positionX>' +
                            '<positionY>' + (255 - Math.round(aPoint[3] * 255 / self.m_iCanvasHeight)) + '</positionY></EndPoint></position3D>';
                    }
                    window.ZoomInfoCallback(szXml);
                }
            };
            //事件处理函数
            function initEvent () {
                var bPainting = false;
                var iMouseDownX = 0;
                var iMouseDownY = 0;
                var szStatus = "draw";  //draw, drag, stretch
                var oShape = null;
                //是否被选中，返回被选中图像索引值
                function getChooseBoxIndex() {
                    var iIndex = -1;
                    for (var i = 0, iLen = self.m_aShape.length; i < iLen; i++) {
                        if (self.m_aShape[i].m_bChoosed) {
                            iIndex = i;
                            break;
                        }
                    }
                    return iIndex;
                }
                //禁止右键菜单
                $(oPlugin)[0].oncontextmenu = function() {
                    return false;
                };  
                $(oPlugin).find(".drawCanvas").eq(0).bind("mousedown", function(e) {
                    var iShapeIndex = 0;
                    if (e.button === 2) {  //鼠标右键闭合图形
                        if (self.m_szShape === "Polygon" && !self.m_bShapeClosed) {  //多边形并未闭合
                            iShapeIndex = self.m_aShape.length - 1;
                            if (self.m_aShape[iShapeIndex].m_aPoint.length >= self.m_aShape[iShapeIndex].m_iMinClosed - 1) {
                                self.m_aShape[iShapeIndex].m_bClosed = true;
                                self.m_bShapeClosed = true;
                                self.m_aShape[iShapeIndex].setPointInfo(self.m_aShape[iShapeIndex].m_aPoint);
                                if (self) {
                                    self.redraw(true);
                                }
                                bPainting = false;
                            }
                        }
                    } else {  //鼠标左键
                        iMouseDownX = e.offsetX;
                        iMouseDownY = e.offsetY;
                        if(self.m_szShape !== "Polygon" || self.m_bShapeClosed) {  //非多边形或未闭合
                            szStatus = "draw";
                            oShape = null;
                            //是否选中圆点
                            var iBoxIndex = getChooseBoxIndex();
                            if (iBoxIndex !== -1) {
                                //判断是否在圆点内
                                if (self.m_aShape[iBoxIndex].inArc(e.offsetX, e.offsetY, 5)) {
                                    szStatus = "stretch";
                                }
                            }
                            //未选中圆点，则判断是否选中某个图形
                            if (szStatus !== "stretch") {
                                //判断鼠标是否在图形内
                                for (var i = 0, iLen = self.m_aShape.length; i < iLen; i++) {
                                    if (self.m_aShape[i].inShape(e.offsetX, e.offsetY)) {
                                        self.m_aShape[i].m_bChoosed = true;
                                        self.m_aShape[i].getMouseDownPoints(e.offsetX, e.offsetY);
                                        szStatus = "drag";
                                    } else {
                                        self.m_aShape[i].m_bChoosed = false;
                                    }
                                    if (self) {
                                        self.redraw(true);
                                    }
                                }
                            }
                            if (szStatus === "drag") {
                                this.style.cursor = "move";
                            } else {
                                this.style.cursor = "default";
                            }
                        } else {  //多边形未闭合, 即手动绘制
                            if (self.m_bDrawStatus) {
                                iShapeIndex = self.m_aShape.length - 1;
                                if (self.m_aShape[iShapeIndex].m_iPolygonType === 1) {
                                    self.m_aShape[iShapeIndex].addPoint(iMouseDownX, iMouseDownY);
                                }
                            }
                        }
                        bPainting = true;
                    }
                });
                $(oPlugin).find(".drawCanvas").eq(0).bind("mousemove", function (e) {
                    var iShapeIndex = 0;
                    if (self.m_szShape !== "Polygon" || self.m_bShapeClosed) {
                        var iBoxIndex = getChooseBoxIndex();
                        if (iBoxIndex > -1) {  //drag, stretch
                            if (bPainting) {
                                if (szStatus === "drag") {
                                    self.m_aShape[iBoxIndex].drag(e.offsetX, e.offsetY);
                                } else if (szStatus === "stretch") {
                                    self.m_aShape[iBoxIndex].stretch(e.offsetX, e.offsetY);
                                }
                            }
                        } else {
                            if (self.m_bDrawStatus) {
                                if (bPainting) {
                                    if (self.m_szShape === "Rect") {
                                        oShape = new Rect();
                                        oShape.move([[iMouseDownX, iMouseDownY], [e.offsetX, e.offsetY]]);
                                    } else if (self.m_szShape === "Grid") {
                                        self.m_aShape[0].move(iMouseDownX, iMouseDownY, e.offsetX, e.offsetY);
                                    }
                                }
                            }
                        }
                    } else {
                        if (self.m_bDrawStatus) {
                            if (bPainting) {
                                iShapeIndex = self.m_aShape.length - 1;
                                if (self) {
                                    self.redraw(true);
                                }
                                self.m_aShape[iShapeIndex].move(e.offsetX, e.offsetY, iMouseDownX, iMouseDownY);
                            }
                        }
                    }
                });
                $(oPlugin).find(".drawCanvas").eq(0).bind("mouseup", function (e) {
                    var iShapeIndex = 0;
                    this.style.cursor = "default";
                    if (oShape !== null && oShape !== undefined) {
                        self.addToShape(oShape);
                        if (self.m_iEventType !== -1) {
                            EventCallback.zoomEventResponse(self.m_iEventType, [iMouseDownX, iMouseDownY, e.offsetX, e.offsetY]);
                        }
                    }
                    if (self.m_szShape !== "Polygon" || self.m_bShapeClosed) {
                        bPainting = false;
                    } else {
                        iShapeIndex = self.m_aShape.length - 1;
                        if (self.m_aShape[iShapeIndex].m_iPolygonType === 1) {
                            bPainting = true;
                        } else if (self.m_aShape[iShapeIndex].m_iPolygonType === 0) {
                            bPainting = false;
                            self.m_aShape[iShapeIndex].m_bClosed = true;
                            self.m_bShapeClosed = true;
                            self.m_aShape[iShapeIndex].setPointInfo(self.m_aShape[iShapeIndex].m_aPoint);
                        }
                    }
                    if (self) {
                        self.redraw(true);
                    }
                });
                $(oPlugin).find(".drawCanvas").eq(0).bind("mouseout", function (e) {
                    this.style.cursor = "default";
                    bPainting = false;
                });
                $(oPlugin).find(".drawCanvas").eq(0).bind("dblclick", function (e) {
                    if (self.m_bDrawStatus) {
                        if (self.m_szShape === "Grid") {
                            self.m_aShape[0].m_szGridMap = "fffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffcfffffc";
                            if (self) {
                                self.redraw(true);
                            }
                        }
                    }
                });
            }

            return {
                m_aShape: [],
                m_iCanvasWidth: 0,
                m_iCanvasHeight: 0,
                m_iMax: 0,
                m_szDisplayMode: "transparent",
                m_iHorizontalResolution: 704,
                m_iVerticalResolution: 576,
                m_szVideoFormat: "PAL",
                m_bDrawStatus: false,
                m_szShape: "Rect",
                m_szDrawColor: "",  //动态创建图形需要
                m_szFillColor: "",  //动态创建图形需要
                m_bShapeClosed: false,
                m_iEventType: -1,  //是否为事件回调
                initCanvas: function () {
                    self = this;
                    if ($(".drawCanvas").length) {
                        return;
                    }
                    var iWndWidth = $(oPlugin).width();
                    var iWndHeight = $(oPlugin).height();
                    szCanvas = "<canvas class='drawCanvas' width=" + iWndWidth + " height=" + iWndHeight + "></canvas>";
                    $(oPlugin).append(szCanvas);
                    var iLeft = $(oPlugin).find(".videoCanvas").eq(0).offset().left - 230;
                    var iTop = $(oPlugin).find(".videoCanvas").eq(0).offset().top - 50;
                    $(oPlugin).find(".drawCanvas").eq(0).css({position: "absolute", left: 0 + "px", top: 0 + "px"});
                    oCanvas = $(oPlugin).find(".drawCanvas").eq(0)[0];
                    oContext = oCanvas.getContext("2d");

                    this.m_iCanvasWidth = oCanvas.width;
                    this.m_iCanvasHeight = oCanvas.height;
                    initEvent(this);
                },
                createShape: function (szType) {
                    if (szType === "Rect") {
                        return new Rect();
                    } else if (szType === "Grid") {
                        return new MotionGrid();
                    } else if (szType === "RectOSD") {
                        return new RectOSD();
                    } else if (szType === "Polygon") {
                        return new Polygon();
                    } else if (szType === "Line") {
                        return new Line();
                    }
                },
                redraw: function () {
                    oContext.clearRect(0 , 0, oCanvas.width , oCanvas.height);
                    for (var i = 0, len = this.m_aShape.length; i < len; i++) {
                        this.m_aShape[i].draw();
                    }
                },
                addToShape: function (oShape) {
                    var iLen = this.m_aShape.length;
                    if (iLen < this.m_iMax) {
                        this.m_aShape.push(oShape);
                    }
                }
            };
        })();

        //插件接口用到的临时参数
        var oPrivate = (function () {
            return {
                iLastError: 0,
                data: null,
                upgradeStatusUrl: "",
                upgradNamePwd: "",
                upgradeStatus: 0,
                upgradeFiles: null,

                oPlayWebsocket: null,  //预览、回放的websocket对象
                oDecoderWorker: null,  //视频解码worker对象
                iViewPortWidth: 0,
                iViewPortHeight: 0,
                iResolutionWidth: 0,
                iResolutionHeight: 0,
                bBrowserSleep: false,
                aYUVBuffer: [],
                iYUVBufferThreshold: 4,
                iOSDTime: -1,
                oWebGLCanvas: null,
                iPlaybackRate: 1,
                bOpenSound: false,
                iVolume: 50,

                getRealPlayCmd: function (szChannels) {
                    var iChannel = Math.floor(parseInt(szChannels, 10) / 100);
                    var iStream = parseInt(szChannels, 10) % 100;
                    var aCmd = [0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
                                0x00, 0x00, 0x00, iChannel, 0x00, 0x00, 0x00, iStream, 0x00, 0x00 , 0x04, 0x00];
                    var uIntCmd = new Uint8Array(aCmd);
                    return uIntCmd;
                },
                getPlaybackCmd: function (szChannels, szStartTime, szStopTime) {
                    var iChannel = parseInt(szChannels, 10);
                    var szStartDayMonthYear = szStartTime.split("T")[0];
                    var szStartHourMinSec = szStartTime.split("T")[1];
                    var szStartYear = "0" + parseInt(szStartDayMonthYear.substring(0, 4), 10).toString(16);
                    var iStartMonth = parseInt(szStartDayMonthYear.substring(4, 6), 10);
                    var iStartDay = parseInt(szStartDayMonthYear.substring(6), 10);
                    var iStartHour = parseInt(szStartHourMinSec.substring(0, 2), 10);
                    var iStartMin = parseInt(szStartHourMinSec.substring(2, 4), 10);
                    var iStartSec = parseInt(szStartHourMinSec.substring(4, 6), 10);

                    var szStopDayMonthYear = szStopTime.split("T")[0];
                    var szStopHourMinSec = szStopTime.split("T")[1];
                    var szStopYear = "0" + parseInt(szStopDayMonthYear.substring(0, 4), 10).toString(16);
                    var iStopMonth = parseInt(szStopDayMonthYear.substring(4, 6), 10);
                    var iStopDay = parseInt(szStopDayMonthYear.substring(6), 10);
                    var iStopHour = parseInt(szStopHourMinSec.substring(0, 2), 10);
                    var iStopMin = parseInt(szStopHourMinSec.substring(2, 4), 10);
                    var iStopSec = parseInt(szStopHourMinSec.substring(4, 6), 10);
                    
                    /*var aCmd =[0x00, 0x00, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
                               0x00, 0x00, 0x00, iChannel, 0x00, 0x00, parseInt(szStartYear.substring(0, 2), 16), parseInt(szStartYear.substring(2, 4), 16), 0x00, 0x00, 0x00, iStartMonth, 0x00, 0x00, 0x00, iStartDay, 
                               0x00, 0x00, 0x00, iStartHour, 0x00, 0x00, 0x00, iStartMin, 0x00, 0x00, 0x00, iStartSec, 0x00, 0x00, parseInt(szStopYear.substring(0, 2), 16), parseInt(szStopYear.substring(2, 4), 16), 
                               0x00, 0x00, 0x00, iStopMonth, 0x00, 0x00, 0x00, iStopDay, 0x00, 0x00, 0x00, iStopHour, 0x00, 0x00, 0x00, iStopMin, 0x00, 0x00, 0x00, iStopSec, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
                    var uIntCmd = new Uint8Array(aCmd);*/
                    var aCmd =[/*header*/ 0x00, 0x00, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
                               /*channel*/ 0x00, 0x00, 0x00, iChannel, /*start time*/ 0x00, 0x00, parseInt(szStartYear.substring(0, 2), 16), parseInt(szStartYear.substring(2, 4), 16), 0x00, 0x00, 0x00, iStartMonth, 0x00, 0x00, 0x00, iStartDay, 
                               0x00, 0x00, 0x00, iStartHour, 0x00, 0x00, 0x00, iStartMin, 0x00, 0x00, 0x00, iStartSec, 
                               /*end time*/ 0x00, 0x00, parseInt(szStopYear.substring(0, 2), 16), parseInt(szStopYear.substring(2, 4), 16), 0x00, 0x00, 0x00, iStopMonth, 0x00, 0x00, 0x00, iStartDay, 
                               0x00, 0x00, 0x00, iStopHour, 0x00, 0x00, 0x00, iStopMin, 0x00, 0x00, 0x00, iStopSec, 
                               /*是否抽帧*/ 0x00,/*是否下载*/ 0x00, /*录像卷类型 0普通卷，1存档卷*/0x00, /*存档卷号*/0x00, /*存档卷上的录像文件索引*/0x00, 0x00, 0x00, 0x00, 
                               /*码流类型 0主码流，1子码流，2三码流*/ 0x00,/*保留字*/ 0x00, 0x00, 0x00];
                    var uIntCmd = new Uint8Array(aCmd);
                    return uIntCmd;
                },
                getPlaybackRate: function (iRate) {
                    var szHex = (parseInt(iRate, 10) >>> 0).toString(16).toLocaleUpperCase().toString(16);
                    for (var i = szHex.length; i < 8; i++) {  //对字符串进行补0，筹齐8位
                        szHex = "0" + szHex;
                    }
                    var aRate = [0, 0, 0, 0];  //4字节16机制表示
                    for (var i = 0, iLen = szHex.length; i < iLen ; i=i+2) {
                        aRate[Math.floor(i / 2)] = parseInt(szHex.substring(i, i + 2), 16);
                    }
                    var aCmd =[/*header*/ 0x00, 0x00, 0x00, 0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x01, 0x2f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, aRate[0], aRate[1], aRate[2], aRate[3]];
                    return uIntCmd = new Uint8Array(aCmd);
                },
                render: function () {
                    if (this.render) {
                        var that = this;
                        requestAnimationFrame(function () {
                            that.render(oPrivate.oDecoderWorker);
                        });
                        if (this.needDecode()) {
                            return;
                        }
                        if (this.aYUVBuffer.length > 0) {
                            var buf = this.aYUVBuffer.shift();
                            //oPrivate.iViewPortWidth = $(".videoCanvas").width();
                            //oPrivate.iViewPortHeight = $(".videoCanvas").height();
                            oPrivate.oWebGLCanvas.drawNextOutputPicture(oPrivate.iViewPortWidth, oPrivate.iViewPortHeight, oPrivate.iResolutionWidth, oPrivate.iResolutionHeight, null, (new Uint8Array(buf)));
                            oPrivate.oDecoderWorker.postMessage({type: "videoBuffer", videoBuf: buf}, [buf]);
                        }
                    }
                },
                needDecode: function () {
                    var iYUVLen = this.aYUVBuffer.length;
                    return iYUVLen <= this.iYUVBufferThreshold;
                }
            };
        })();
        
        

        //插件接口
        $.extend(this, {
            HWP_Play: function (szUrl, szAuth, iWndNum, szStartTime, szStopTime) {
                var AudioContext = window.AudioContext || window.webkitAudioContext;
                if (typeof oAudioContext === "undefined") {
                    oAudioContext = new AudioContext();
                }
                oPrivate.oWebGLCanvas = new WebGLCanvas("videoCanvas", false, {});
                /*解析url，获取通道号和ip地址*/
                var iStart = szUrl.indexOf("://") + 3;
                var iEnd = szUrl.substring(iStart).indexOf(":");  //过滤第一个冒号后，子字符串冒号位置
                var szHostname = szUrl.substring(iStart, iEnd + iStart);
                //创建websocket
                if (window.WebSocket) {
                    oPrivate.oDecoderWorker = new Worker("../script/lib/jquery/html5/jsDecoder/Decoder-worker.js");
                    oPrivate.oPlayWebsocket = new WebSocket("ws://" + szHostname + ":7681");
                    //创建worker或者websocket失败
                    if (!oPrivate.oPlayWebsocket || !oPrivate.oDecoderWorker) {
                        return;
                    }
                    oPrivate.oPlayWebsocket.binaryType = "arraybuffer";
                    oPrivate.oPlayWebsocket.onopen = function (e) {

                    };
                    oPrivate.oPlayWebsocket.onclose = function (e) {
                        oPrivate.aYUVBuffer.length = 0;
                        oPrivate.oPlayWebsocket.close(1000, "CLOSE");
                        oPrivate.oDecoderWorker.terminate();
                        oPrivate.oWebGLCanvas.clearPictureGL();
                        console.log("onclose");
                    };
                    oPrivate.oPlayWebsocket.onerror = function () {
                        
                    };
                    oPrivate.oPlayWebsocket.onmessage = function (e) {
                        if (!oPrivate.bBrowserSleep) {
                            var aRecBuf = new Uint8Array(e.data);
                            oPrivate.oDecoderWorker.postMessage({type: "decode", buf: aRecBuf.buffer, len: aRecBuf.length}, [aRecBuf.buffer]);
                        } else {
                            //console.log("document hidden");
                        }
                    }
                    var iRevBufferTimes = 0;
                    var samples = [];
                    var sampleRates = 8000;
                    
                    function writeString(view, offset, string) {
                        for (var i = 0; i < string.length; i++) {
                            view.setUint8(offset + i, string.charCodeAt(i));
                        }
                    }
                    function setBufferToDataview(output, offset, input) {
                        for (var i = 0; i < input.length; i++, offset++){
                            output.setInt8(offset, input[i], true);
                        }
                    }
                    oPrivate.oDecoderWorker.onmessage = function (e) {
                        if (e.data.type === "CMD" && e.data.message === "loaded") {
                            if (!szStartTime && !szStopTime) {
                                iStart = szUrl.indexOf("/SDK/play/") + 10;
                                var iPlayChannelEnd = szUrl.indexOf("/004");
                                var szChannels = szUrl.substring(iStart, iPlayChannelEnd);
                                oPrivate.oPlayWebsocket.send(oPrivate.getRealPlayCmd(szChannels));
                            } else {
                                iStart = szUrl.indexOf("/SDK/playback/") + 14;
                                var szChannels = szUrl.substring(iStart);
                                oPrivate.oPlayWebsocket.send(oPrivate.getPlaybackCmd(szChannels, szStartTime, szStopTime));
                            }
                        }
                        var data = e.data;
                        if ("video" === data.type) {
                            oPrivate.iResolutionWidth = data.width;
                            oPrivate.iResolutionHeight = data.height;
                            oPrivate.aYUVBuffer.push(data.buf);
                            oPrivate.iOSDTime = data.osd;
                        } else if ("audio" === data.type) {
                            if ( oPrivate.bOpenSound) {
                                console.log("decode audio");
                                if (iRevBufferTimes >= 20) {
                                    var bufferData = new ArrayBuffer(44 + samples.length);
                                    var viewTalk = new DataView(bufferData);

                                    /* RIFF identifier */
                                    writeString(viewTalk, 0, 'RIFF');
                                    /* file length */
                                    viewTalk.setUint32(4, 32 + samples.length * 2, true);
                                    /* RIFF type */
                                    writeString(viewTalk, 8, 'WAVE');
                                    /* format chunk identifier */
                                    writeString(viewTalk, 12, 'fmt ');
                                    /* format chunk length */
                                    viewTalk.setUint32(16, 16, true);
                                    /* sample format (raw) */
                                    viewTalk.setUint16(20, 1, true);
                                    /* channel count */
                                    viewTalk.setUint16(22, 1, true);
                                    /* sample rate */
                                    viewTalk.setUint32(24, sampleRates, true);
                                    /* byte rate (sample rate * block align) */
                                    viewTalk.setUint32(28, sampleRates * 4, true);
                                    /* block align (channel count * bytes per sample) */
                                    viewTalk.setUint16(32, 4, true);
                                    /* bits per sample */
                                    viewTalk.setUint16(34, 16, true);
                                    /* data chunk identifier */
                                    writeString(viewTalk, 36, 'data');
                                    /* data chunk length */
                                    viewTalk.setUint32(40, samples.length, true);
                                    setBufferToDataview(viewTalk, 44, samples);

                                    oAudioContext.decodeAudioData(viewTalk.buffer, function (buffer) {
                                        var audioBufferSouceNode = oAudioContext.createBufferSource();
                                        //audioBufferSouceNode.connect(oAudioContext.destination);
                                        audioBufferSouceNode.buffer = buffer;
                                        audioBufferSouceNode.start(0);
                                        var gainNode = oAudioContext.createGain();
                                        gainNode.gain.value = oPrivate.iVolume / 100;

                                        source.connect(gainNode);
                                        gainNode.connect(oAudioContext.destination);
                                    }, function (e) {
                                        console.log("decode error");
                                    });

                                    iRevBufferTimes = 0;
                                    samples.length = 0;
                                }

                                var bufferPackage = new Uint8Array(data.buf);
                                var iIndexSamples = samples.length;
                                for (var i = 0, iLen = bufferPackage.length; i < iLen; i++) {
                                    samples[iIndexSamples + i] = bufferPackage[i];
                                }
                                iRevBufferTimes++;

                                oPrivate.oDecoderWorker.postMessage({type: "audioBuffer", audioBuf: data.buf}, [data.buf]);
                            }
                        }
                    };
                    oPrivate.render();
                }
                return 0;
            },
            HWP_Stop: function (iWndNum) {
                oPrivate.aYUVBuffer.length = 0;
                oPrivate.oPlayWebsocket.close(1000, "CLOSE");
                oPrivate.oDecoderWorker.terminate();
                return 0;
            },
            HWP_StartSave: function (iWndIndex, szFileName) {
                return 0;
            },
            HWP_StopSave: function (iWndIndex) {
                return 0;
            },
            HWP_StartDownloadEx: function (szURL, szNamePwd, szFileName, szDownXml) {
                var szPlaybackURI = $(oToolClass.parseXmlFromStr(szDownXml)).find("playbackURI").eq(0).text();
                var szDownloadUrl = szURL.replace("download", "downloadEx") + "?playbackURI=" + szPlaybackURI;
                var szFileFormat = ".jpg";
                if (szDownloadUrl.indexOf("tracks/120") > 0) {
                    szFileFormat = ".jpg";
                } else {
                    szFileFormat = ".mp4";
                }
                var iFileNameStartIndex = szDownloadUrl.indexOf("&name=") + 6;
                var iFileNameEndIndex = szDownloadUrl.indexOf("&size=");
                szFileName = szDownloadUrl.substring(iFileNameStartIndex, iFileNameEndIndex);
                $("body").append('<a id="download_record_a" href="' + szDownloadUrl + '" download=' + szFileName + szFileFormat + '><li id="download_record_li"></li></a>');
                $("#download_record_li").trigger("click");
                $("#download_record_a").remove();
                return 0;
            },
            HWP_StopDownload: function (iDownLoadId) {
            
            },
            HWP_GetDownloadStatus: function (iDownLoadId) {
                return 0;
            },
            HWP_GetDownloadProgress: function (iDownLoadId) {
                 return 100;
            },
            HWP_Pause: function (iWndIndex) {
                return 0;
            },
            HWP_Resume: function (iWndIndex) {
                return 0;
            },
            HWP_Slow: function (iWndIndex) {
                if (oPrivate.iPlaybackRate < 8 && oPrivate.iPlaybackRate > -8) {  //最大支持8倍数
                    if (oPrivate.iPlaybackRate === 1) {
                        oPrivate.iPlaybackRate = 0 - oPrivate.iPlaybackRate * 2;
                    } else if (oPrivate.iPlaybackRate > 1) {
                        oPrivate.iPlaybackRate = oPrivate.iPlaybackRate * 1/2;
                    } else if (oPrivate.iPlaybackRate < 0) {
                        oPrivate.iPlaybackRate = oPrivate.iPlaybackRate * 2;
                    }
                    oPrivate.oPlayWebsocket && oPrivate.oPlayWebsocket.send(oPrivate.getPlaybackRate(oPrivate.iPlaybackRate));
                }
                return 0;
            },
            HWP_Fast: function (iWndIndex) {
                if (oPrivate.iPlaybackRate < 8 && oPrivate.iPlaybackRate > -8) {  //最大支持8倍数
                    if (oPrivate.iPlaybackRate > 0) {
                        oPrivate.iPlaybackRate = oPrivate.iPlaybackRate * 2;
                    } else if (oPrivate.iPlaybackRate === -2) {
                        oPrivate.iPlaybackRate = 1;
                    } else if (oPrivate.iPlaybackRate < -2) {
                        oPrivate.iPlaybackRate = oPrivate.iPlaybackRate * 2;
                    }
                    oPrivate.oPlayWebsocket && oPrivate.oPlayWebsocket.send(oPrivate.getPlaybackRate(oPrivate.iPlaybackRate));
                }
                return 0;
            },
            HWP_FrameForward: function (iWndIndex) {
                return 0;
            },
            HWP_GetOSDTime: function (iWndIndex, oSearchRecord) {
                var iOSDTime = 0;
                if (oPrivate.iOSDTime) {
                    iOSDTime = oPrivate.iOSDTime / 1000;
                }
                return iOSDTime;
            },
            HWP_ArrangeWindow: function (iWndType) {
            },
            HWP_OpenSound: function (iWndIndex) {
                oPrivate.bOpenSound = true;
                return 0;
            },
            HWP_CloseSound: function () {
                oPrivate.bOpenSound = false;
                return 0;
            },
            HWP_SetVolume: function (iWndIndex, iVolume) {
                oPrivate.iVolume = iVolume;
                return 0;
            },
            HWP_StartVoiceTalkEx: function (szOpenURL, szCloseURL, szDataUrl, szNamePwd, iAudioType, iAudioBitRate, iAudioSamplingRate) {
                $("body").append('<iframe id="talk_iframe" src="https://' + location.hostname + '/doc/page/talk.asp"></iframe>');
                /*var iStart = szOpenURL.indexOf("://") + 3;
                szOpenURL.substring(iStart);
                var iEnd = szOpenURL.substring(iStart).indexOf(":");
                var szHostname = szOpenURL.substring(iStart, iEnd+iStart);
                var samples = [];
                var iRevBufferTimes = 0;
                function VoiceIntercom(source) {
                    var bufferLen = 4096;
                    this.context = source.context;
                    this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, bufferLen, 1, 1);
                    oPrivate.oWebsocket = new WebSocket("ws://" + szHostname + ":7681");
                    oPrivate.oWebsocket.binaryType = "arraybuffer";
                    var sampleRates = 8000;
                    this.node.onaudioprocess = function(e) {
                        var sourceData = e.inputBuffer.getChannelData(0);
                        console.log(sourceData);

                        var compression = 48000 / sampleRates;  //计算压缩率, 设置采样率为8k
                        var length = sourceData.length / compression;
                        var samples = new Float32Array(length);
                        var index = 0;
                        var inputIndex = 0;
                        while (index < length) {
                            samples[index] = sourceData[inputIndex];
                            inputIndex += compression;  //每次都跳过4个数据
                            index++;
                        }
                        var sampleLen = samples.length;

                        //采样精度为16
                        var buffer = new ArrayBuffer(sampleLen*2);
                        var dataView = new DataView(buffer);
                        var offset = 0;
                        for (var i = 0; i < samples.length; i++, offset += 2) {
                            var s = Math.max(-1, Math.min(1, samples[i]));
                            dataView.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                        }

                        //采样精度为8
                        //var buffer = new ArrayBuffer(sampleLen);
                        //var dataView = new DataView(buffer);
                        //var offset = 0;
                        //for (var i = 0; i < samples.length; i++, offset++) {
                            //var s = Math.max(-1, Math.min(1, samples[i]));
                            //var val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                            //val = parseInt(255 / (65535 / (val + 32768)));
                            //dataView.setInt8(offset, val, true);
                        //}

                        if (oPrivate.oWebsocket.readyState === 1) {
                            oPrivate.oWebsocket.send(dataView.buffer);
                        }
                    };
                    function writeString(view, offset, string) {
                        for (var i = 0; i < string.length; i++) {
                            view.setUint8(offset + i, string.charCodeAt(i));
                        }
                    }
                    function setBufferToDataview(output, offset, input) {
                        for (var i = 0; i < input.length; i++, offset++){
                            output.setInt8(offset, input[i], true);
                        }
                    }
                    oPrivate.oWebsocket.onmessage = function(e) {
                        console.log(e.data);
                        if (iRevBufferTimes > 30) {
                            var oAudioContext = source.context;
                            var viewTalk = null;
                            var bufferData = new ArrayBuffer(44 + samples.length);
                            viewTalk = new DataView(bufferData);
                            // RIFF identifier
                            writeString(viewTalk, 0, 'RIFF');
                            // file length
                            viewTalk.setUint32(4, 32 + samples.length * 2, true);
                            // RIFF type
                            writeString(viewTalk, 8, 'WAVE');
                            // format chunk identifier
                            writeString(viewTalk, 12, 'fmt ');
                            // format chunk length
                            viewTalk.setUint32(16, 16, true);
                            // sample format (raw)
                            viewTalk.setUint16(20, 1, true);
                            // channel count 
                            viewTalk.setUint16(22, 1, true);
                            // sample rate 
                            viewTalk.setUint32(24, sampleRates, true);
                            // byte rate (sample rate * block align) 
                            viewTalk.setUint32(28, sampleRates * 4, true);
                            // block align (channel count * bytes per sample) 
                            viewTalk.setUint16(32, 4, true);
                            // bits per sample 
                            viewTalk.setUint16(34, 16, true);
                            // data chunk identifier 
                            writeString(viewTalk, 36, 'data');
                            // data chunk length 
                            viewTalk.setUint32(40, samples.length, true);
                            setBufferToDataview(viewTalk, 44, samples);

                            oAudioContext.decodeAudioData(viewTalk.buffer, function (buffer) {
                                var audioBufferSouceNode = oAudioContext.createBufferSource();
                                audioBufferSouceNode.connect(oAudioContext.destination);
                                audioBufferSouceNode.buffer = buffer;
                                audioBufferSouceNode.start();
                            }, function (e) {
                                console.log("decode error");
                            });

                            iRevBufferTimes = 0;
                            samples.length = 0;
                        }
                        var bufferPackage = new Int8Array(e.data);
                        var iIndexSamples = samples.length;
                        for (var i = 0, iLen = bufferPackage.length; i < iLen; i++) {
                            samples[iIndexSamples + i] = bufferPackage[i];
                        }
                        iRevBufferTimes++;
                    };
                    oPrivate.oWebsocket.open = function (e) {
                        console.log("audio talk open");
                    };

                    source.connect(this.node);
                    this.node.connect(this.context.destination);
                }
                var navigator = window.navigator;
                navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
                var Context = window.AudioContext || window.webkitAudioContext;
                var context = new Context();
                navigator.getUserMedia({audio: true}, function (localMediaStream) {
                    var mediaStreamSource = context.createMediaStreamSource(localMediaStream);
                    oVoiceIntercom = new VoiceIntercom(mediaStreamSource);
                }, function (err) {

                });*/
                return 0;
            },
            HWP_StopVoiceTalk: function () {
                if(oPrivate.oWebsocket !== null && oPrivate.oWebsocket !== undefined) {
                    oPrivate.oWebsocket.close(1000, "CLOSE");
                }
            },
            HWP_EnableZoom: function (iWndIndex, iMode) {
                drawClass.initCanvas();
                drawClass.m_bDrawStatus = true;
                drawClass.m_szShape = "Rect";
                drawClass.m_szDrawColor = "#ff0000";
                drawClass.m_szFillColor = "#343434";
                drawClass.m_iEventType = iMode;
                return 0;
            },
            HWP_DisableZoom: function () {
                drawClass.m_bDrawStatus = false;
                drawClass.m_iEventType = -1;
                $("canvas").remove();
            },
            HWP_CapturePicture: function (iWndIndex, szFileName) {
                return 0;
            },
            HWP_OpenDirectory: function () {
                return 0;
            },
            HWP_OpenFileBrowser: function (iSelectMode, szFileType, oBrowse, szName, oScope) {
                var that = this;
                var input = window.document.createElement('input');
                input.type = "file";
                if (szFileType.toLowerCase()==="bmp") {
                    input.accept="image/bmp";
                }
                if (iSelectMode === 0) {
                    input.setAttribute("webkitdirectory", "");
                }
                input.addEventListener('change', function() {
                    if (iSelectMode === 1) {
                        var iNameLen = input.files[0].name.length;
                        if (input.files[0].name.substring(iNameLen-4) === ".zip") {
                            zip.createReader(new zip.BlobReader(input.files[0]), function (zipReader) {
                                zipReader.getEntries(function (entries) {
                                    entries.forEach(function (entry) {
                                        entry.getData(new zip.BlobWriter(), function (blob) {
                                            oPrivate.data = blob;
                                        }, function () {});
                                    });
                                });
                            }, function () {});
                        } else {
                            oPrivate.data = input.files[0];
                        }
                        oBrowse[szName] = input.files[0].name;
                        oScope.$digest();
                    } else if (iSelectMode === 0) {
                        oPrivate.upgradeFiles = input.files;
                    }
                });
                var click = document.createEvent("MouseEvents");
                click.initEvent("click", true, true);
                input.dispatchEvent(click);
                return 0;
            },
            StopRealPlayAll: function () {
                oPrivate.aYUVBuffer.length = 0;
                oPrivate.oPlayWebsocket.close(1000, "CLOSE");
                oPrivate.oDecoderWorker.terminate();
                return 0;
            },
            HWP_ExportDeviceConfig: function (szExportURL, szNamePwd, szFileName, iReserve) {
                var link = window.document.createElement('a');
                link.href = szExportURL;
                var click = document.createEvent("MouseEvents");
                click.initEvent("click", true, true);
                link.dispatchEvent(click);
                return 0;
            },
            HWP_UploadFile: function (szUploadUrl, szNamePwd, szFilePath, szStrReserve, iReserve) {
                var iRet = 0;
                var szUserDecode = oToolClass.oBase64.decode(szNamePwd);
                var aNamePwd = [];
                if (szUserDecode.substring(0, 1) === ":") {
                    aNamePwd = szUserDecode.substring(1).split(":");
                } else {
                    aNamePwd = szUserDecode.split(":");
                }
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status != 200) {
                            iRet = -1;
                        }
                    }
                };
                xhr.open('put', szUploadUrl, false, aNamePwd[0], aNamePwd[1]);
                xhr.setRequestHeader("Content-Type", szStrReserve); 
                xhr.send(oPrivate.data);
                return iRet;
            },
            HWP_StartAsynUpload: function (szImportURL, szStatusUrl, szNamePwd, szFileName, iReserve) {
                var szUserDecode = oToolClass.oBase64.decode(szNamePwd);
                aNamePwd = [];
                if (szUserDecode.substring(0, 1) === ":") {
                    aNamePwd = szUserDecode.substring(1).split(":");
                } else {
                    aNamePwd = szUserDecode.split(":");
                }
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        oPrivate.data = xhr.responseText;
                    }
                };
                xhr.open('put', szImportURL, true, aNamePwd[0], aNamePwd[1]);
                xhr.send(oPrivate.data);
                return 0;
            },
            HWP_StopAsynUpload: function () {

            },
            HWP_GetUploadErrorInfo: function () {
                return oPrivate.data;
            },
            HWP_StartUpgrade: function (szUpgradeURL, szStatusURL, szNamePwd, szFileName) {

            },
            HWP_StartUpgradeEx: function (szUpgradeURL, szStatusURL, szNamePwd, szFileName, szUpgradeFlag, szReserve) {
                if (oPrivate.upgradeFiles) {
                    var iLen = oPrivate.upgradeFiles.length;
                    for (var i = 0; i < iLen; i++) {
                        var fsRead = new FileReader();
                        fsRead.onloadend = function (e) {

                        };
                        fsRead.readAsText(file);
                    }
                }
                var szUserDecode = oToolClass.oBase64.decode(szNamePwd);
                var aNamePwd = [];
                if (szUserDecode.substring(0, 1) === ":") {
                    aNamePwd = szUserDecode.substring(1).split(":");
                } else {
                    aNamePwd = szUserDecode.split(":");
                }
                var that = this;
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            oPrivate.upgradeStatus = 100;
                        } else {
                            oPrivate.upgradeStatus = 1;
                        }
                    }
                };
                xhr.open('put', szUpgradeURL, true, aNamePwd[0], aNamePwd[1]);
                xhr.send(oPrivate.data);
                oPrivate.upgradeStatusUrl = szStatusURL;
                oPrivate.upgradNamePwd = szNamePwd;
                return 0;
            },
            HWP_UpgradeStatus: function () {
                if (oPrivate.upgradeStatus === 100) {
                    return 0;
                } else {
                    return oPrivate.upgradeStatus;
                }
            },
            HWP_UpgradeProgress: function () {
                var iProgress = 0;
                var szUserDecode = oToolClass.oBase64.decode(oPrivate.upgradNamePwd);
                var aNamePwd = [];
                if (szUserDecode.substring(0, 1) === ":") {
                    aNamePwd = szUserDecode.substring(1).split(":");
                } else {
                    aNamePwd = szUserDecode.split(":");
                }
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            iProgress = parseInt($(oToolClass.parseXmlFromStr(xhr.responseText)).find("percent").text(), 10);
                        }
                    }
                };
                xhr.open('get', oPrivate.upgradeStatusUrl, false, aNamePwd[0], aNamePwd[1]);
                xhr.send(null);
                if (oPrivate.upgradeStatus === 100) {
                    return 100;
                } else {
                    return iProgress;
                }
                
            },
            HWP_StopUpgrade: function () {
                return 0;
            },
            HWP_GetLastError: function () {
                return 0;
            },
            HWP_GetRegionInfo: function () {
                var szXml = '<?xml version="1.0" encoding="utf-8"?>';
                var i = 0;
                if (drawClass.m_szShape === "Rect") {
                    szXml += '<DetectionRegionInfo>';
                    szXml += '<videoFormat>' + drawClass.m_szVideoFormat + '</videoFormat><RegionType>roi</RegionType>';
                    szXml += '<ROI><HorizontalResolution>' + drawClass.m_iHorizontalResolution + '</HorizontalResolution><VerticalResolution>' + drawClass.m_iVerticalResolution + '</VerticalResolution></ROI>';
                    szXml += '<DisplayMode>' + drawClass.m_szDisplayMode + '</DisplayMode><MaxRegionNum>' + drawClass.m_iMax + '</MaxRegionNum>';
                    szXml += '<DetectionRegionList>';
                    for (i = 0, len = drawClass.m_aShape.length; i < len; i++) {
                        var aPoint = drawClass.m_aShape[i].getPointInfo();
                        szXml += '<DetectionRegion><RegionCoordinatesList>';
                        szXml += '<RegionCoordinates><positionX>' + Math.round(aPoint[3][0] * drawClass.m_iHorizontalResolution / drawClass.m_iCanvasWidth) + 
                            '</positionX><positionY>' + (drawClass.m_iVerticalResolution - Math.round(aPoint[3][1] * drawClass.m_iVerticalResolution / drawClass.m_iCanvasHeight)) + '</positionY></RegionCoordinates>';
                        szXml += '<RegionCoordinates><positionX>' + Math.round(aPoint[2][0] * drawClass.m_iHorizontalResolution / drawClass.m_iCanvasWidth) + 
                            '</positionX><positionY>' + (drawClass.m_iVerticalResolution - Math.round(aPoint[2][1] * drawClass.m_iVerticalResolution / drawClass.m_iCanvasHeight)) + '</positionY></RegionCoordinates>';
                        szXml += '<RegionCoordinates><positionX>' + Math.round(aPoint[1][0] * drawClass.m_iHorizontalResolution / drawClass.m_iCanvasWidth) + 
                            '</positionX><positionY>' + (drawClass.m_iVerticalResolution - Math.round(aPoint[1][1] * drawClass.m_iVerticalResolution / drawClass.m_iCanvasHeight)) + '</positionY></RegionCoordinates>';
                        szXml += '<RegionCoordinates><positionX>' + Math.round(aPoint[0][0] * drawClass.m_iHorizontalResolution / drawClass.m_iCanvasWidth) + 
                            '</positionX><positionY>' + (drawClass.m_iVerticalResolution - Math.round(aPoint[0][1] * drawClass.m_iVerticalResolution / drawClass.m_iCanvasHeight)) + '</positionY></RegionCoordinates>';
                        szXml += '</RegionCoordinatesList></DetectionRegion>';
                    }
                    szXml += '</DetectionRegionList>';
                    szXml += '</DetectionRegionInfo>';
                } else if (drawClass.m_szShape === "Grid") {
                    for (i = 0, len = drawClass.m_aShape.length; i < len; i++) {
                        var oGrid = drawClass.m_aShape[i];
                        szXml += '<MoveDetection><videoFormat>PAL</videoFormat><RegionType>grid</RegionType>';
                        szXml += '<Grid><rowGranularity>' + oGrid.m_iGridHeight + '</rowGranularity><columnGranularity>' + oGrid.m_iGridWidth + '</columnGranularity></Grid>';
                        szXml += '<DisplayMode>transparent</DisplayMode>';
                        szXml += '<gridMap>' + oGrid.m_szGridMap + '</gridMap></MoveDetection>';
                    }
                }
                return szXml;
            },
            HWP_SetRegionInfo: function (szXml) {
                drawClass.initCanvas();
                drawClass.m_aShape.length = 0;
                var oXmlDoc = oToolClass.parseXmlFromStr(szXml);
                if ($(oXmlDoc).find("DetectionRegionInfo").length > 0) {
                    drawClass.m_szShape = "Rect";
                    drawClass.m_iMax = parseInt($(oXmlDoc).find("MaxRegionNum").eq(0).text(), 10);
                    drawClass.m_szDisplayMode = $(oXmlDoc).find("DisplayMode").eq(0).text();
                    drawClass.m_szVideoFormat = $(oXmlDoc).find("videoFormat").eq(0).text();
                    drawClass.m_iHorizontalResolution = parseInt($(oXmlDoc).find("HorizontalResolution").eq(0).text(), 10);
                    drawClass.m_iVerticalResolution = parseInt($(oXmlDoc).find("VerticalResolution").eq(0).text(), 10);
                    $(oXmlDoc).find("DetectionRegion").each(function (i) {
                        var oRect = drawClass.createShape("Rect");
                        var aPoint = [];
                        for (var j = 0, iLen = $(this).find("positionX").length; j < iLen; j++) {
                            var iPointX = Math.round($(this).find("positionX").eq(j).text()) * drawClass.m_iCanvasWidth / drawClass.m_iHorizontalResolution;
                            var iPointY = (drawClass.m_iVerticalResolution - Math.round($(this).find("positionY").eq(j).text())) * drawClass.m_iCanvasHeight / drawClass.m_iVerticalResolution;
                            aPoint.push([iPointX, iPointY]);
                        }
                        if (aPoint.length > 0) {
                            oRect.setPointInfo(aPoint);
                        }
                        if(i === 0) {
                            oRect.m_bChoosed = true;
                        }
                        if (drawClass.m_szDisplayMode === "transparent") {
                            oRect.m_iTranslucent = 0;
                        } else {
                            oRect.m_iTranslucent = 0.7;
                        }
                        oRect.m_szDrawColor = "#ff0000";  //线的颜色
                        oRect.m_szFillColor = "#343434";  //填充颜色
                        oRect.m_iEditType = parseInt($(this).find("EditType").eq(0).text(), 10) || 0;
                        if ($(this).find("positionX").length > 0) {
                            if (!(aPoint[0][0] === 0 && aPoint[1][0] === 0 && aPoint[2][0] === 0 && aPoint[3][0] === 0)) {
                                drawClass.m_aShape.push(oRect);
                            }
                        }
                    });
                    drawClass.m_szDrawColor = "#ff0000";
                    drawClass.m_szFillColor = "#343434";
                } else if ($(oXmlDoc).find("MoveDetection").length > 0) {
                    drawClass.m_szShape = "Grid";
                    var oGrid = drawClass.createShape("Grid");
                    oGrid.m_szDrawColor = "#ff0000";  //线的颜色
                    oGrid.m_iGridWidth = parseInt($(oXmlDoc).find("columnGranularity").eq(0).text(), 10);
                    oGrid.m_iGridHeight = parseInt($(oXmlDoc).find("rowGranularity").eq(0).text(), 10);
                    oGrid.m_szGridMap = $(oXmlDoc).find("gridMap").eq(0).text();
                    drawClass.m_aShape.push(oGrid);
                }
                drawClass.redraw(true);
            },
            HWP_ClearRegion: function () {
                if (drawClass.m_szShape === "Grid") {
                    drawClass.m_aShape[0].m_szGridMap = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
                    drawClass.m_aShape[0].m_aAddGridMap = [];
                } else {
                    drawClass.m_aShape.length = 0;
                }
                try {
                    drawClass.redraw(true);
                } catch (e) {}
                return 0;
            },
            HWP_SetDrawStatus: function (bDraw) {
                drawClass.m_bDrawStatus = bDraw;
                return 0;
            },
            HWP_GetTextOverlay: function () {
                var szXml = '<?xml version="1.0" encoding="utf-8"?>';
                szXml += '<OSD>';
                szXml += '<videoResolutionWidth>' + drawClass.m_iHorizontalResolution + '</videoResolutionWidth>';
                szXml += '<videoResolutionHeight>' + drawClass.m_iVerticalResolution + '</videoResolutionHeight>';
                var szOverlayDate = "";
                var szOverlayChName = "";
                var szOverlayText = "";
                for (var i = 0, len = drawClass.m_aShape.length; i < len; i++) {
                    var oRect = drawClass.m_aShape[i];
                    var aPoint = oRect.getPointInfo();
                    var szPositionX = Math.round(aPoint[0][0] * drawClass.m_iHorizontalResolution / drawClass.m_iCanvasWidth);
                    var szPositionY = Math.round(aPoint[0][1] * drawClass.m_iVerticalResolution / drawClass.m_iCanvasHeight);
                    if (oRect.m_szRectType === "overlay-date") {
                        szOverlayDate += '<DateTimeOverlay><Type>' + oRect.m_szDateStyle + '</Type>';
                        szOverlayDate += '<clockType>' + oRect.m_szClockType + '</clockType>';
                        szOverlayDate += '<displayWeek>' + oRect.m_szDisplayWeek + '</displayWeek>';
                        szOverlayDate += '<enabled>' + oRect.m_szEnabled + '</enabled>';
                        szOverlayDate += '<positionX>' + szPositionX + '</positionX><positionY>' + szPositionY + '</positionY></DateTimeOverlay>';					    
                    }  else if (oRect.m_szRectType === "overlay-ch") {
                        szOverlayChName += '<channelNameOverlay><enabled>' + oRect.m_szEnabled + '</enabled>';
                        szOverlayChName += '<ChannelName>' + oRect.m_szText + '</ChannelName>';
                        szOverlayChName += '<positionX>' + szPositionX + '</positionX><positionY>' + szPositionY + '</positionY></channelNameOverlay>';
                    } else if (oRect.m_szRectType === "overlay-text") {
                        szOverlayText += '<TextOverlay><id>' + oRect.m_szId + '</id><enabled>' + oRect.m_szEnabled + '</enabled>';
                        szOverlayText += '<displayText>' + oRect.m_szText + '</displayText>';
                        szOverlayText += '<positionX>' + szPositionX + '</positionX><positionY>' + szPositionY + '</positionY></TextOverlay>';					    
                    }
                }
                szXml += szOverlayDate;
                szXml += szOverlayChName;
                szXml += "<TextOverlayList>";
                szXml += szOverlayText;
                szXml += "</TextOverlayList>";
                szXml += '</OSD>';
                return szXml;
            },
            HWP_SetTextOverlay: function (szXml) {
                drawClass.m_aShape.length = 0;
                drawClass.initCanvas();
                var oXmlDoc = oToolClass.parseXmlFromStr(szXml);
                drawClass.m_szShape = "RectOSD";
                drawClass.m_iMax = 10;
                drawClass.m_szVideoFormat = "PAL";
                if ($(oXmlDoc).find("OSD").length > 0) {
                    drawClass.m_iHorizontalResolution = parseInt($(oXmlDoc).find("videoResolutionWidth").eq(0).text(), 10);
                    drawClass.m_iVerticalResolution = parseInt($(oXmlDoc).find("videoResolutionHeight").eq(0).text(), 10);
                    var oRect = null;
                    var iStartX = 0;
                    var iStartY = 0;
                    var iEndX = 0;
                    var iEndY = 0;
                    var aPoint = [];
                    if ($(oXmlDoc).find("channelNameOverlay").length > 0) {
                        var oChannelNameOverlay = $(oXmlDoc).find("channelNameOverlay").eq(0);
                        oRect = drawClass.createShape("RectOSD");
                        oRect.m_szRectType = "overlay-ch";
                        oRect.m_szEnabled = $(oChannelNameOverlay).find("enabled").eq(0).text();
                        oRect.m_szText = $(oChannelNameOverlay).find("ChannelName").eq(0).text();
                        iStartX = Math.round($(oChannelNameOverlay).find("positionX").eq(0).text()) * drawClass.m_iCanvasWidth / drawClass.m_iHorizontalResolution;
                        iStartY = Math.round($(oChannelNameOverlay).find("positionY").eq(0).text()) * drawClass.m_iCanvasHeight / drawClass.m_iVerticalResolution;
                        iEndX = iStartX + oRect.m_szText.length*10;
                        iEndY = iStartY + 20;
                        aPoint = [[iStartX, iStartY], [iEndX, iStartY], [iEndX, iEndY], [iStartX, iEndY]];
                        oRect.setPointInfo(aPoint);
                        oRect.m_szDrawColor = "#ff0000";  //线的颜色
                        drawClass.m_aShape.push(oRect);
                    }
                    if ($(oXmlDoc).find("DateTimeOverlay").length > 0) {						
                        var oDateTimeOverlay = $(oXmlDoc).find("DateTimeOverlay").eq(0);
                        oRect = drawClass.createShape("RectOSD");
                        oRect.m_szRectType = "overlay-date";
                        oRect.m_szEnabled = $(oDateTimeOverlay).find("enabled").eq(0).text();
                        oRect.m_szDateStyle = $(oDateTimeOverlay).find("Type").eq(0).text();
                        oRect.m_szDisplayWeek = $(oDateTimeOverlay).find("displayWeek").eq(0).text();
                        oRect.m_szClockType = $(oDateTimeOverlay).find("clockType").eq(0).text();
                        var szWeek = "";
                        if (oRect.m_szDisplayWeek === "true") {
                            szWeek = "week";
                        } else {
                            szWeek = "";
                        }
                        var szClockType = "";
                        if (oRect.m_szClockType === "24hour") {
                            szClockType = "";
                        } else {
                            szClockType = "AM/PM";
                        }
                        switch (oRect.m_szDateStyle) {
                            case "0":
                                oRect.m_szText = "YYYY-MM-DD " + szWeek + " hh:mm:ss " + szClockType;
                                break;
                            case "1": 
                                oRect.m_szText = "MM-DD-YYYY " + szWeek + " hh:mm:ss " + szClockType;
                                break;
                            case "2": 
                                oRect.m_szText = "CHR-YYYY-MM-DD " + szWeek + " hh:mm:ss " + szClockType;
                                break;
                            case "3": 
                                oRect.m_szText = "CHR-MM-DD-YYYY " + szWeek + " hh:mm:ss " + szClockType;
                                break;
                            case "4": 
                                oRect.m_szText = "DD-MM-YYYY " + szWeek + " hh:mm:ss " + szClockType;
                                break;
                            case "5":
                                oRect.m_szText = "CHR-DD-MM-YYYY " + szWeek + " hh:mm:ss " + szClockType;
                                break;
                            default :
                                break;
                        }
                        iStartX = Math.round($(oDateTimeOverlay).find("positionX").eq(0).text()) * drawClass.m_iCanvasWidth / drawClass.m_iHorizontalResolution;
                        iStartY = Math.round($(oDateTimeOverlay).find("positionY").eq(0).text()) * drawClass.m_iCanvasHeight / drawClass.m_iVerticalResolution;
                        iEndX = iStartX + (szWeek ? 250 : 200);
                        iEndY = iStartY + 20;
                        aPoint = [[iStartX, iStartY], [iEndX, iStartY], [iEndX, iEndY], [iStartX, iEndY]];
                        oRect.setPointInfo(aPoint);
                        oRect.m_szDrawColor = "#ff0000";  //线的颜色
                        drawClass.m_aShape.push(oRect);
                    }
                    if ($(oXmlDoc).find("TextOverlayList").length > 0) {
                        $(oXmlDoc).find("TextOverlayList").eq(0).find("TextOverlay").each(function () {
                            var oRect = drawClass.createShape("RectOSD");
                            oRect.m_szRectType = "overlay-text";
                            oRect.m_szId = $(this).find("id").eq(0).text();
                            oRect.m_szEnabled = $(this).find("enabled").eq(0).text();
                            oRect.m_szText = $(this).find("displayText").eq(0).text();
                            var iStartX = Math.round($(this).find("positionX").eq(0).text()) * drawClass.m_iCanvasWidth / drawClass.m_iHorizontalResolution;
                            var iStartY = Math.round($(this).find("positionY").eq(0).text()) * drawClass.m_iCanvasHeight / drawClass.m_iVerticalResolution;
                            var iEndX = iStartX + oRect.m_szText.length*10;
                            var iEndY = iStartY + 20;
                            var aPoint = [[iStartX, iStartY], [iEndX, iStartY], [iEndX, iEndY], [iStartX, iEndY]];
                            oRect.setPointInfo(aPoint);
                            drawClass.m_aShape.push(oRect);
                        });
                    }
                }
                drawClass.redraw(true);
                return 0;
            },
            HWP_ClearSnapInfo: function (iMode) {  //0-矩形 1-多边形 2-线  3-多边形和矩形 4-All
                $(oPlugin).find("div").remove();
                for (var i = 0, iLen = drawClass.m_aShape.length; i < iLen; i++) {
                    if (iMode === 2) {
                        if (drawClass.m_aShape[i].constructor.toString().substring(0, 13).indexOf("Line") > -1) {
                            drawClass.m_aShape.splice(i, 1);
                        }
                    } else if (iMode === 1) {
                        if (drawClass.m_aShape[i].constructor.toString().substring(0, 16).indexOf("Polygon") > -1) {
                            drawClass.m_aShape.splice(i, 1);
                        }
                    }
                }
                if (iMode === 4) {
                    drawClass.m_aShape.length = 0;
                }
                try {
                    drawClass.redraw(true);
                } catch (e) {}
                return 0;
            },
            HWP_SetSnapPolygonInfo: function (szXml) {
                drawClass.initCanvas();
                drawClass.m_szShape = "Polygon";
                var oXmlDoc = oToolClass.parseXmlFromStr(szXml);
                var iShapeLen = drawClass.m_aShape.length;
                if (iShapeLen > 0) {
                    for (var i = 0; i < iShapeLen; i++) {
                        var szId = $(oXmlDoc).find("id").eq(0).text();
                        if (drawClass.m_aShape[i].m_szId === szId) {
                            drawClass.m_aShape.splice(i, 1);
                        }
                    }
                }
                if ($(oXmlDoc).find("SnapPolygonList").length > 0) {
                    $(oXmlDoc).find("SnapPolygonList").eq(0).find("SnapPolygon").each(function (i) {
                        var oPolygon = drawClass.createShape("Polygon");
                        oPolygon.m_szId = $(oXmlDoc).find("id").eq(0).text();
                        oPolygon.m_iPolygonType = parseInt($(oXmlDoc).find("polygonType").eq(0).text(), 10);
                        oPolygon.m_szTips = $(oXmlDoc).find("Tips").eq(0).text() || $(oXmlDoc).find("tips").eq(0).text();
                        oPolygon.m_iMinClosed = parseInt($(oXmlDoc).find("MinClosed").eq(0).text(), 10);
                        oPolygon.m_iMaxPointNum = parseInt($(oXmlDoc).find("PointNumMax").eq(0).text(), 10);
                        oPolygon.m_iEditType = parseInt($(oXmlDoc).find("EditType").eq(0).text(), 10) || 0;
                        oPolygon.m_bClosed = ($(oXmlDoc).find("isClosed").eq(0).text() === "true");
                        drawClass.m_bShapeClosed = oPolygon.m_bClosed;
                        oPolygon.m_szDrawColor = 'rgb(' + $(oXmlDoc).find("r").eq(0).text() + ', ' + $(oXmlDoc).find("g").eq(0).text() + ', ' + $(oXmlDoc).find("b").eq(0).text() + ')';
                        oPolygon.m_szFillColor = oPolygon.m_szDrawColor;
                        oPolygon.m_iTranslucent = 0.1;
                        if (i === 0) {
                            oPolygon.m_bChoosed = true;
                        }
                        var aPoint = [];
                        $(oXmlDoc).find("pointList").eq(0).find("point").each(function (j) {
                            aPoint[j] = [];
                            aPoint[j][0] = Math.round($(this).find("x").eq(0).text() * drawClass.m_iCanvasWidth);
                            aPoint[j][1] = Math.round($(this).find("y").eq(0).text() * drawClass.m_iCanvasHeight);
                        });
                        if (aPoint.length > 0) {
                            oPolygon.setPointInfo(aPoint);
                        } else {
                            oPolygon.m_bClosed = false;
                            drawClass.m_bShapeClosed = false;
                        }
                        drawClass.m_aShape.push(oPolygon);  //不管是否有坐标都推到数组
                    });
                }
                drawClass.redraw(true);
                return 0;
            },
            HWP_GetSnapPolygonInfo: function () {
                var szXml = "<?xml version='1.0' encoding='utf-8'?><SnapPolygonList>";
                for (var i = 0, iLen = drawClass.m_aShape.length; i < iLen; i++) {
                    var oShape = drawClass.m_aShape[i];
                    if (drawClass.m_aShape[i].constructor.toString().substring(0, 16).indexOf("Polygon") > -1) {
                        szXml += "<SnapPolygon>";
                        szXml += "<id>" + drawClass.m_aShape[i].m_szId + "</id>";
                        szXml += "<polygonType>" + oShape.m_iPolygonType + "</polygonType>";
                        szXml += "<color>";
                        var aColor = oShape.m_szDrawColor.substring(4, oShape.m_szDrawColor.length-1).split(",");
                        szXml += "<r>" + aColor[0] + "</r>";
                        szXml += "<g>" + aColor[1] + "</g>";
                        szXml += "<b>" + aColor[2] + "</b>";
                        szXml += "</color>";
                        szXml += "<tips>" + oShape.m_szTips + "</tips>";
                        szXml += "<isClosed>" + oShape.m_bClosed + "</isClosed>";
                        var aPoint = oShape.getPointInfo();
                        szXml += "<pointList>";
                        for (var j = 0, iLenPoint = aPoint.length; j < iLenPoint; j++) {
                            szXml += "<point><x>" + (aPoint[j][0] / drawClass.m_iCanvasWidth).toFixed(6) + "</x><y>" + (aPoint[j][1] / drawClass.m_iCanvasHeight).toFixed(6) + "</y></point>";
                        }
                        szXml += "</pointList>";
                        szXml += "</SnapPolygon>";
                    }
                }
                szXml += "</SnapPolygonList>";
                return szXml;
            },
            HWP_ClearTargetPolygon: function (szXml) {  //人员聚集功能用到
                return 0;
            },
            HWP_SetSnapDrawMode: function (iType, iMode) {  //1-矩形模式 2-多边形模式 3-任意选择模式
                drawClass.m_bDrawStatus = (iMode !== -1);
                return 0;
            },
            HWP_SetPlayModeType: function (iModeType) {
                return 0;
            },
            HWP_CheckPluginUpdate: function (szXml) {
                return false;
            },
            HWP_GetLocalConfig: function () {
                return "";
            },
            HWP_SetLocalConfig: function (szXml) {
                return true;
            },
            HWP_SetTrsPlayBackParam: function (iWndIndex, szXml) {
                return 0;
            },
            HWP_ReversePlay: function (szUrl, szNamePwd, iWndIndex, szStartTime, szStopTime) {
                
            },
            HWP_SetSnapLineInfo: function (szXml) {
                drawClass.initCanvas("Line");
                drawClass.m_szShape = "Line";
                var oXmlDoc = oToolClass.parseXmlFromStr(szXml);
                var iShapeLen = drawClass.m_aShape.length;
                if (iShapeLen > 0) {
                    for (var i = 0; i < iShapeLen; i++) {
                        var szId = $(oXmlDoc).find("id").eq(0).text();
                        if (drawClass.m_aShape[i].m_szId === szId) {
                            drawClass.m_aShape.splice(i, 1);
                        }
                    }
                }
                var oLine = drawClass.createShape("Line");
                var aPoint = [];
                aPoint[0] = [];
                aPoint[1] = [];
                aPoint[0][0] = $(oXmlDoc).find("StartPos").eq(0).find("x").eq(0).text() * drawClass.m_iCanvasWidth;
                aPoint[0][1] = $(oXmlDoc).find("StartPos").eq(0).find("y").eq(0).text() * drawClass.m_iCanvasHeight;
                aPoint[1][0] = $(oXmlDoc).find("EndPos").eq(0).find("x").eq(0).text() * drawClass.m_iCanvasWidth;
                aPoint[1][1] = $(oXmlDoc).find("EndPos").eq(0).find("y").eq(0).text() * drawClass.m_iCanvasHeight;
                oLine.setPointInfo(aPoint);
                oLine.m_szId = $(oXmlDoc).find("id").eq(0).text();
                oLine.m_iLineType = parseInt($(oXmlDoc).find("LineTypeEx").text(), 10);
                oLine.m_iDirection = parseInt($(oXmlDoc).find("CustomType").text(), 10);
                oLine.m_szTips = $(oXmlDoc).find("tips").text() || $(oXmlDoc).find("Tips").text();
                oLine.m_bClosed = true;
                oLine.m_szDrawColor = 'rgb(' + $(oXmlDoc).find("r").eq(0).text() + ', ' + $(oXmlDoc).find("g").eq(0).text() + ', ' + $(oXmlDoc).find("b").eq(0).text() + ')';
                if (aPoint[0].length > 0) {
                    drawClass.m_aShape.push(oLine);
                }
                drawClass.m_bShapeClosed = true;
                drawClass.redraw(true);
                if (oLine.m_iLineType === 3) {
                    $(oPlugin).css("overflow", "hidden");
                }
                return 0;
            },
            HWP_GetSnapLineInfo: function () {
                var szXml = "<?xml version='1.0' encoding='utf-8'?><SnapLineList>";
                for (var i = 0, iLen = drawClass.m_aShape.length; i < iLen; i++) {
                    var oShape = drawClass.m_aShape[i];
                    if (drawClass.m_aShape[i].constructor.toString().substring(0, 13).indexOf("Line") > -1) {
                        szXml += "<SnapLine>";
                        szXml += "<id>" + drawClass.m_aShape[i].m_szId + "</id>";
                        szXml += "<LineTypeEx>" + oShape.m_iLineType + "</LineTypeEx>";
                        szXml += "<CustomType>0</CustomType><MoveChange>0</MoveChange><ArrowType>0</ArrowType>";
                        szXml += "<tips>" + oShape.m_szTips + "</tips>";
                        var aPoint = oShape.getPointInfo();
                        szXml += "<StartPos><x>" + (aPoint[0][0] / drawClass.m_iCanvasWidth).toFixed(6) + "</x><y>" + (aPoint[0][1] / drawClass.m_iCanvasHeight).toFixed(6) + "</y></StartPos>";
                        szXml += "<EndPos><x>" + (aPoint[1][0] / drawClass.m_iCanvasWidth).toFixed(6) + "</x><y>" + (aPoint[1][1] / drawClass.m_iCanvasHeight).toFixed(6) + "</y></EndPos>";
                        szXml += "<LineSelected>false</LineSelected>";
                        szXml += "<color><r>255</r><g>255</g><b>0</b></color>";
                        szXml += "</SnapLine>";
                    }
                }
                szXml += "</SnapLineList>";
                return szXml;
            },
            HWP_SetCanFullScreen: function (iMode) {

            },
            HWP_FullScreenDisplay: function (bFullScreen) {
            
            },
            HWP_SetOriginalString: function (szStr, bEncrypted) {
                return 0;
            },
            HWP_GetEncryptString: function (iType) {
                return "";
            },
            HWP_SetSecretKey: function (szKeyType, szKey) {
            
            },
            HWP_ImportDeviceConfig: function (szImportURL, szNamePwd, szFileName, iReserve) {
                return 0;
            },
            HWP_GetIpcImportErrorInfo: function () {
                return 0;
            },
            HWP_ExportDeviceLog: function (szXml, szFileName, iFileType) {
                //kevin 2015.9.9
                szFileName = "Log";
                var aResults = [];//存储所有日志
                var aLoglist_all = [];//转化成二位数组
                aResults = aResults.concat($(szXml).find('searchMatchItem').toArray());
                var i = 0;
                for (i = 0; i < aResults.length; i++) {
                    aLoglist_all[i]=[];
                    aLoglist_all[i][0] = $(aResults[i]).find('logtime').text().replace("T", " ").replace("Z", "");
                    aLoglist_all[i][1] = $(aResults[i]).find('majortype').text();
                    aLoglist_all[i][2] = $(aResults[i]).find('minortype').text();
                    aLoglist_all[i][3] = $(aResults[i]).find('channelid').text();
                    aLoglist_all[i][4] = $(aResults[i]).find('userName').text();
                    aLoglist_all[i][5] = $(aResults[i]).find('remoteaddress').text();
                }
                var textLog = [];//数组中转化为长字符串
                function creatItem(str) {    //字符串中插入空格
                    textLog.push(str);
                    var a = str.slice("");
                    var i = 0;
                    if(/^[\u4e00-\u9fa5]/.test(str)){
                        for(i = 0; i < (30 - (a.length * 2)); i++){
                            textLog.push(" ");
                        }
                    }else{
                        for(i = 0; i < (30 - a.length); i++){
                            textLog.push(" ");
                        }
                    }
                }
                //创建表头
                creatItem(" ");
                creatItem($(szXml).find('laLogTime').text());
                creatItem($(szXml).find('laLogMajorType').text());
                creatItem($(szXml).find('laLogMinorType').text());
                creatItem($(szXml).find('laLogChannel').text());
                creatItem($(szXml).find('laLogRemoteUser').text());
                creatItem($(szXml).find('laLogRemoteIP').text());
                textLog.push("\r\n");
                for (i = 0; i < aLoglist_all.length; i++) {
                    var num = (i+1).toString();
                    creatItem(num);
                    for(var j=0;j<6;j++){
                        creatItem(aLoglist_all[i][j]);
                    }
                    textLog.push("\r\n");
                }
                textLog =  textLog.join("");
                var blob = new Blob([textLog], {type: "text/plain"});
                var url = (window.URL || window.webkitURL).createObjectURL(blob);
                var link = window.document.createElement('a');
                link.href = url;
                link.download = szFileName;
                var click = document.createEvent("MouseEvents");
                click.initEvent("click", true, true);
                link.dispatchEvent(click);
            },
            HWP_EnablePDC: function (iType, iEnable) {
                return 0;
            },
            HWP_ExportReport: function (szXml, fileName, iType) {
                return 0;
            },
            HWP_SetPTZCtrlEnable: function (iWndIndex, bEnable) {
                return 0;
            }/*,
            HWP_EnablePDC: function () {
                return 0;
            }*/
        });

        (function () {
            //创建窗口
            function _createWnd () {
                var that = oPlugin;
                var szDiv = "";
                var iWndWidth = $(that).width();
                var iWndHeight = $(that).height();
                if (parseInt(defaults.iType, 10) === 0) {
                    szDiv += "";
                } else if (parseInt(defaults.iType, 10) === 1) {
                    szDiv += "<canvas id='videoCanvas' class='videoCanvas' width=" + iWndWidth + " height=" + iWndHeight + " style='width: 100%; height: 100%; background-color: #343434;' />";
                } else if (parseInt(defaults.iType, 10) === 2) {
                    for (var i = 0; i < defaults.iWndType; i++) {
                        for (var j = 0; j < defaults.iWndType; j++) {
                            szDiv += "<canvas id='videoCanvas' class='videoCanvas' width=" + iWndWidth + " height=" + iWndHeight + " style='width: 99%; height: 99%; background-color: #343434;' />";
                        }
                    }
                }
                $(that).append(szDiv);
                if ($(that).find(".videoCanvas").length) {
                    //$(that).find(".videoCanvas").css({"object-fit": "fill"});  //设置视频充满
                    $("#main_plugin").css({"background-color": "#ffffff", "position": "relative"});
                }
            }
            function resize () {
                setTimeout(function () {
                    oPrivate.iViewPortWidth = $("#main_plugin").width();
                    oPrivate.iViewPortHeight = $("#main_plugin").height() - 3;
                    $(".videoCanvas").attr("width", oPrivate.iViewPortWidth);
                    $(".videoCanvas").attr("height", oPrivate.iViewPortHeight);
                }, 500);
            }
            return {
                //插件初始化函数
                _init: function () {
                    _createWnd();
                    resize();
                    $(window).bind("resize", function () {
                        resize();
                    });
                    $(document).bind("visibilitychange", function () {
                        if (document.hidden) {
                            oPrivate.bBrowserSleep = true;
                        } else  {
                            oPrivate.bBrowserSleep = false;
                        }
                    });
                    $(window).bind("resize", function () {
                        resize();
                    });
                    $("#videoCanvas").bind("dblclick", function () {
                        if (parseInt(defaults.iType, 10) === 2) {
                            var element = document.getElementById('videoCanvas');
                            if (element.requestFullScreen) {
                                element.requestFullScreen();
                            } else if (element.webkitRequestFullScreen) {
                                element.webkitRequestFullScreen();
                            } else if (element.mozRequestFullScreen) {
                                element.mozRequestFullScreen();
                            }
                        }
                    });
                }
            };
        })()._init();
        return this;
    };
})(jQuery);