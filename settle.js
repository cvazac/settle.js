(function(w) {
    if (w != w.top) return;

	function now() {
		return w.performance.now();
	}
	function isAboveFold(imgData) {
		return imgData.top < viewportHeight && imgData.left < viewportWidth;
	}
	function checkAboveFold(img) {
		if (img.complete === false) {
			return false;
		}

		var element = img;
		var imgData = {left: 0, top: 0, width: img.offsetWidth, height: img.offsetHeight};
		if (element.parentNode) {
			do {
				imgData.top += element.offsetTop  || 0;
				imgData.left += element.offsetLeft || 0;
				element = element.offsetParent;
			} while (element);
		}

		if (!img.guid) img.guid = ++guid;
		if (isAboveFold(imgData)) {
			function moved() {
				var b = aboveFold[img.guid].left != imgData.left || aboveFold[img.guid].top != imgData.top;
				if (b) console.log("moved:" + img.src + " left:" + aboveFold[img.guid].left + "->" + imgData.left + " top:" + aboveFold[img.guid].top + "->" + imgData.top);
				return b;
			}
			function resized() {
				var b = aboveFold[img.guid].width != imgData.width || aboveFold[img.guid].height != imgData.height;
				if (b) console.log("resized:" + img.src + " width:" + aboveFold[img.guid].width + "->" + imgData.width + " height:" + aboveFold[img.guid].height + "->" + imgData.height);
				return b;
			}
			if (!aboveFold[img.guid] || moved() || resized()) {
				aboveFold[img.guid] = imgData;
				aboveFold[img.guid].now = now();
				aboveFold[img.guid].img = img; //remove this line
				aboveFold[img.guid].entries = w.performance.getEntriesByName(img.src);
				return false;
			}
		}
		else if (aboveFold[img.guid]) {
			delete aboveFold[img.guid];
			return false;
		}
		return true;
	}
	function checkResources(finalCheck) {
		ownTime -= now();

		iter++;
		var imgs = d.getElementsByTagName("img");
		var settled = lastImgCount == imgs.length;
		lastImgCount = imgs.length;
		for (var i = 0; i < lastImgCount; i++) {
			settled = checkAboveFold(imgs[i]) && settled;
		}

		ownTime += now();
		if (settled) {
			if (finalCheck === true)
				return printResults()

			return setTimeout(function() {
				checkResources(true);
			}, 3000)
		}

		setTimeout(checkResources, 100);
	}
	function printResults() {
		var max = -1, maxResponseEnd = -1, imgCount = 0;
		for (var guid in aboveFold) {
            imgCount++;
			max = Math.max(max, aboveFold[guid].now);
			aboveFold[guid].img.style.height = aboveFold[guid].img.offsetHeight;
			aboveFold[guid].img.style.width = aboveFold[guid].img.offsetWidth;
			aboveFold[guid].img.style.backgroundColor = "red";
			aboveFold[guid].img.src = "http://comfort.soasta.com/concerto/img/spacer.gif?version=1";

			if (aboveFold[guid].entries.length > 0) {
				maxResponseEnd = Math.max(maxResponseEnd, aboveFold[guid].entries[0].responseEnd);
			}
		}
		console.log("" + 
			"settle time: " + max + "\n" +
			"maxResponseEnd:" + maxResponseEnd + "\n" +
			"delta:" + (max - maxResponseEnd) + "\n" +
			"loadEventStart - navigationStart:" + (w.performance.timing.loadEventStart - w.performance.timing.navigationStart) + "\n" +
			"ownTime:" + ownTime + " (" + (ownTime / iter) + " per iteration)" + "\n" +
			"total images:" + lastImgCount + "\n" +
			"images above fold:" + imgCount + "\n" +
		"");
	}

	var d = w.document;
	var viewportHeight = Math.max(d.documentElement.clientHeight, window.innerHeight || 0);
	var viewportWidth =  Math.max(d.documentElement.clientWidth, window.innerWidth || 0);
	var guid = 0, ownTime = 0, lastImgCount, iter = 0;
	var aboveFold = {};
	checkResources();
})(window);
