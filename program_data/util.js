var Util = {
	play_audio: function(path) {
		if(!path) return;
		var audio = new Audio(path);
		if(audio) audio.play();
	},
	safeApply: function(Scope, fn) {
		if (!Scope) return;
		if (!Scope.$root) return;
		var phase = Scope.$root.$$phase;
		if (phase == '$apply' || phase == '$digest') {
			if (fn && (typeof(fn) === 'function')) {
				fn();
			}
		} else {
			Scope.$apply(fn);
		}
	},
	makeid: function(length) {
		length = length || 5;
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		for (var i = 0; i < length; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	},
	loadfile: function(loadFileCallback, accept) {
		var dlid = this.makeid();
		var input = document.createElement("input");
		input.type = "file";
		input.id = dlid;
		input.style.display = "none";
		if (accept) input.accept = accept;
		document.body.appendChild(input);
		input.addEventListener("change", function(fileChangeEvent) {
			var file = fileChangeEvent.target.files[0];
			var reader = new FileReader();
			reader.onerror = function() {
				loadFileCallback(false);
			};
			reader.onload = function(evt) {
				loadFileCallback(evt.target.result);
			};
			reader.readAsBinaryString(file);
		});
		input.click();
	},
	error: console.error,
	performDownload: function(url, name) {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		a.href = url;
		a.download = name;
		a.click();
		window.URL.revokeObjectURL(url);
	},
	makeDownload: function(name, data) {
		var self = this;
		var saveData = (function() {
			return function(data, name) {
				var blob = new Blob([data], {
					type: "octet/stream"
				});
				var url = window.URL.createObjectURL(blob);
				self.performDownload(url, name);
			};
		}());

		saveData(data, name);
	},
	getDateString: function() {
		var d = new Date();
		return d.toLocaleDateString();
	},
	getDateTimeString: function() {
		var d = new Date();
		return d.toLocaleTimeString();
	},
	getTimeStamp: function() {
		var d = new Date();
		return d.getTime()
	},
	doAlert: function(msg) {
		alert(msg);
	},
	isFunction: function(functionToCheck) {
		return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
	},
	cpy: function(data) {
		return JSON.parse(JSON.stringify(data));
	}
};
