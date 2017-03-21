define(function(require, exports, module) {

    var _oService, _oDevice, _oOptions, _$scope;
	
	_oService = require("service");
	_oDevice = require("isapi/device");
	var _oTranslator = require("translator");

	require("ui.jquery");

	function Channel() {
		this.m_iChannelId = -1;
		this.oChannelSel = null;
        _oOptions = {
			onPlay: null,
			onRecord: null,
			onSelected: null,
			onChangeStream: null
		};
	}

	Channel.prototype = {
		init: function (szID, szType, oOPtions) {
			var self = this,
				oChannelApp = angular.module("channelApp", ["ui.jquery"]);
			
			// 可选参数合并
			$.extend(_oOptions, oOPtions);

			oChannelApp.controller("channelController", function ($scope) {
				$scope.oLan = _oTranslator.oLastLanguage;
				$scope.bPreview = "preview" === szType;
				_$scope = $scope;

				$scope.szDeviceName = _oDevice.m_oDeviceInfo.szDeviceName;
				if (!$scope.bPreview && _oService.m_iZeroChanNum > 0) {// 回放页面，如果存在零通道，去除掉
					_oService.m_aChannelList.pop();
				}
				if ($scope.bPreview) {// 预览页面，去掉不在线的通道
					var aChannelList = $.extend(true, [], _oService.m_aChannelList);
					_oService.m_aChannelList.length = 0;
					$.each(aChannelList, function () {
						if (this.bOnline) {
							_oService.m_aChannelList.push(this);
						}
					});
				}

				// 处理画面分割计算
				_oService.m_iWndSplitMode = Math.ceil(Math.sqrt(_oService.m_aChannelList.length));
				if(0 === _oService.m_iWndSplitMode) {
					_oService.m_iWndSplitMode = 1;
				}
				if(_oService.m_iWndSplitMode > 4) {
					_oService.m_iWndSplitMode = 4;
				}

				$scope.aChlist = _oService.m_aChannelList;
				$scope.aWndList = _oService.m_aWndList;
				$scope.iStreamNum = _oDevice.getChannelStreamNum(self.m_iChannelId);
				$scope.bChannelList = !_oService.isSingleChannel();

				// 加载完毕后触发
				$scope.channelLoaded = function () {
					_oService.m_oLoaded.bChannel = true;
					self.resize();
				};
				$scope.play = function (iChannelIndex) {
					if (this.bPreview) {// 预览
						if (_oOptions.onPlay) {
							setTimeout(function () {
								self.select(iChannelIndex);
							}, 10);
							_oOptions.onPlay(iChannelIndex);
						}
					} else {// 回放
						setTimeout(function () {// 按钮事件转移，脱离scope作用域，防止重复$apply()
							self.select(iChannelIndex);
						}, 10);
					}
				};
				$scope.record = function (iChannelIndex) {
					if (_oOptions.onRecord) {
						_oOptions.onRecord(iChannelIndex);
					}
				};
				$scope.select = function (target, iChannelIndex) {
					if (self.oChannelSel != null) {
						$(self.oChannelSel).removeClass("sel");
					}
					$(target).addClass("sel");
					self.oChannelSel = target;
					self.m_iChannelId = _oService.m_aChannelList[iChannelIndex].iId;

					if (_oOptions.onSelected) {  //选中通道回调
						_oOptions.onSelected(iChannelIndex);
					}
				};
				$scope.changeStream = function (iChannelIndex, iStreamType) {
					if (_oOptions.onChangeStream) {  //选中通道码流类型切换
						_oOptions.onChangeStream(iChannelIndex, iStreamType);
					}
				}
			});

			angular.bootstrap(angular.element("#" + szID), ["channelApp"]);
		},
		resize: function () {
			$("#channel .channel-list").eq(0).height($("#channel").height() - $("#channel .device").eq(0).outerHeight() - 5);
		},
		update: function () {
			_$scope.$apply();
		},
		// 点击选中通道
		select: function (iChannelIndex) {
			var oChNameList = $("#channel .ch-name");
			if (iChannelIndex < oChNameList.length) {
				oChNameList.eq(iChannelIndex).click();
			}
		},
		// 切换通道变色
		switchChannel: function () {
			var self = this;

			if (self.oChannelSel != null) {
				$(self.oChannelSel).removeClass("sel");
			}
			if (self.m_iChannelId > -1) {
				self.oChannelSel = $("#channel .ch-name[channel='" + self.m_iChannelId + "']").get(0);
				$(self.oChannelSel).addClass("sel");
			}
		}
	};
	module.exports = new Channel();
});