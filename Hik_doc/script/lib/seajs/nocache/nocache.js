/**
 * The Sea.js plugin to clear cache 
 */
(function (seajs) {
	
	var TIME_STAMP = "?version=" + seajs.web_version;

	seajs.on("fetch", function (data) {
		if (data.uri) {
			data.requestUri = data.uri + TIME_STAMP;
		}
	});

	seajs.on("define", function (data) {
		if (data.uri) {
			data.uri = data.uri.replace(TIME_STAMP, "");
		}
	});

	// Register as module
	define("seajs-nocache", [], {});

})(seajs);