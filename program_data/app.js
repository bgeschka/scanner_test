var app = angular.module('WEBUI', ['ui.bootstrap']);

function Item() {
	this.nsn = "";
	return this;
}

app.directive('autofocus', ['$timeout', function($timeout, ImmoPlusService) {
	return {
		restrict: 'A',
		link: function($scope, $element) {
			if (!(ImmoPlusService && ImmoPlusService.XS())) {
				$timeout(function() {
					$element[0].focus();
				});
			}
		}
	};
}]);

app.service("SHR", function($uibModal) {
	this.SHR = {};
	var self = this;
	this.storeSHR = function() {
		Util.doAlert("Storing new Sub-Handreceipt");
		Util.makeDownload("SHR-" + Util.getDateString() + ".json", angular.toJson(self.SHR));
	};

	this.loadSHR = function(cb) {
		Util.loadfile(function(data) {
			try {
				self.SHR = JSON.parse(data) || {};
			} catch (e) {
				Util.error("failed to parse");
			}
			self.loaded = true;
			if (cb) cb();
		}, ".json");
	};
	this.findBySerial = function(serial, source /*array of items*/ ) {
		source = source || this.SHR.items;
		return source.filter(function(el) {
			return el.serial == serial;
		})[0];
	};
	this.getLastComment = function(entry) {
		if (!entry || !entry.history) return "";
		var maxidx = entry.history.length - 1;
		for (var i = maxidx; i > -1; i--) {
			if (entry.history[i].comment) return entry.history[i].comment;
		}
	};
	this.addComment = function(entry, comment){
		if(!entry.history) entry.history = [];
		entry.history.push({
			date: Util.getTimeStamp(),
			comment : comment
		});
	};

	this.showEntryHistory = function(entry) {
		var modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			// backdrop: preventclose ? 'static' : true, //prevent modal close
			size: 'lg',
			template: '<div>' +
				'    <div class="modal-header">' +
				'        <h4 class="modal-title" id="modal-title">Item History</h4>' +
				'    </div>' +
				'    <div class="modal-body">' +
				'     	<input class="form-control" placeholder="search" ng-model="histsearchtext"/>' +
				'     	<table class="table table-striped table-bordered">' +
				'     		<thead>' +
				'     			<tr>' +
				'     				<th>Time</th>' +
				'     				<th>Comment</th>' +
				'     			</tr>' +
				'     		</thead>' +
				'     		<tbody>' +
				'     			<tr ng-repeat="hist in entry.history|filter:histsearchtext">' +
				'     				<td>{{hist.date|date:\'M/d/yy h:mm:ss a\'}}</td>' +
				'     				<td>{{hist.comment}}</td>' +
				'     			</tr>' +
				'     		</tbody>' +
				'     	</table>' +
				'    </div>' +
				'    <div class="modal-footer">' +
				'    	<button class="btn btn-default" ng-click="ok()">Close</button>' +
				'    </div>' +
				'</div>',
			controller: function($scope, $uibModalInstance) {
				$scope.entry = entry;
				$scope.ok = function() {
					$uibModalInstance.close();
				};
			}
		}) //.closed.then(dismisscb);
	};

	this.addCommentPrompted = function(entry) {
		var msg = prompt("why?");
		this.addComment(entry, msg);
	}
	this.queueForBarCodePrint = function(entry) {
		if(!this.SHR.barcodequeue) this.SHR.barcodequeue = [];
		if(this.SHR.barcodequeue.indexOf(entry) !== -1) return;
		this.SHR.barcodequeue.push(entry);
	}

	this.moveKnownToUnknown= function(entry) {
		this.addCommentPrompted(entry);
		var idx = this.SHR.items.indexOf(entry);
		this.SHR.items.splice(idx,1);
		this.SHR.unknown.push(entry);
	}

	this.moveUnknownToKnown= function(entry) {
		this.addCommentPrompted(entry);
		var idx = this.SHR.unknown.indexOf(entry);
		this.SHR.unknown.splice(idx,1);
		this.SHR.items.push(entry);
	}

	this.editEntry = function(entry) {
		var SHR = this;
		var modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			// backdrop: preventclose ? 'static' : true, //prevent modal close
			size: 'lg',
			template: '<div>' +
				'    <div class="modal-header">' +
				'        <h4 class="modal-title" id="modal-title">Edit item</h4>' +
				'    </div>' +
				'    <div class="modal-body">' +
				'    	<labledrow txt="NSN">' +
				'    		<input class="form-control" ng-model="workingcopy.nsn"/>' +
				'    	</labledrow>' +
				'    	<labledrow txt="Serial">' +
				'    		<input class="form-control" ng-model="workingcopy.serial"/>' +
				'    	</labledrow>' +
				'    	<labledrow txt="Comment">' +
				'    		<textarea class="form-control" rows=3 ng-model="workingcopy.lastcomment"></textarea>' +
				'    	</labledrow>' +
				'    	<labledrow txt="">' +
				'    		<button class="btn btn-default pull-right" ng-click="showEntryHistory()">History</button>' +
				'    	</labledrow>' +
				'    </div>' +
				'    <div class="modal-footer">' +
				'    	<button class="btn btn-success" ng-click="ok()">Save</button>' +
				'    	<button class="btn btn-default" ng-click="cancel()">Cancel</button>' +
				'    	<button class="btn btn-danger" ng-click="remove()">Delete</button>' +
				'    </div>' +
				'</div>',
			controller: function($scope, $uibModalInstance) {
				$scope.workingcopy = Util.cpy(entry);
				$scope.workingcopy.lastcomment = SHR.getLastComment(entry);

				$scope.ok = function() {
					entry.nsn = $scope.workingcopy.nsn;
					entry.serial = $scope.workingcopy.serial;
					SHR.addComment(entry, $scope.workingcopy.lastcomment);
					$uibModalInstance.close();
				};
				$scope.showEntryHistory = function() {
					SHR.showEntryHistory($scope.workingcopy);
				};

				$scope.cancel = function() {
					$uibModalInstance.close();
				};
				$scope.remove = function() {
					entry.deleted = true;
					$uibModalInstance.close();
				};
			}
		}) //.closed.then(dismisscb);

		return modalInstance;
	}
});

/*requires quaggajs*/
app.directive('barscan', [function() {
	return {
		restrict: 'E',
		//methods: manual/barcode-scanner, camera
		template: '<div>' +
			'<uib-tabset>' +
			'	<uib-tab index="0" ng-click="stopQuagga()" heading="Manual/scanner">' +
			'		<br/>' +
			'		<form ng-submit="found(manual_enter);manual_enter=\'\'">' +
			'			<input autofocus class="form-control" ng-model="manual_enter"></input>' +
			'		</form>' +
			'	</uib-tab>' +
			'	<uib-tab index="1" ng-click="initQuagga()" heading="Scan using camera">' +
			' 		<div id="interactive" class="viewport"></div>' +
			'	</uib-tab>' +
			'</uib-tabset>' +
			'</div>',
		replace: false,
		scope: {
			ngModel: '=',
			scanned: '='
		},
		controller: function($scope) {
			$scope.manual_enter = '';
			$scope.found = function(code) {
				util.play('program_data/code_detect.mp3');
				console.log("barscan - detected code:", code);
				$scope.ngModel = code;
				if (!Util.isFunction($scope.scanned)) {
					Util.error("provided scanned fun is not a fun");
					return;
				}
				$scope.scanned(code);
				Util.safeApply($scope);
			}
			// available readers
			// var all_readers = [
			// 	"code_128_reader",
			// 	"ean_reader",
			// 	"ean_8_reader",
			// 	"code_39_reader",
			// 	"code_39_vin_reader",
			// 	"codabar_reader",
			// 	"upc_reader",
			// 	"upc_e_reader",
			// 	"i2of5_reader",
			// 	"2of5_reader",
			// 	"code_93_reader"
			// ];

			$scope.stopQuagga = function() {
				$scope.quagga_started = false;
				try {
					Quagga.stop();
					console.log("tear down quagga");
				} catch (e) {
					console.log("tear down quagga");
					/* handle error */
				}
			}

			$scope.$on('$destroy', function iVeBeenDismissed() {
				$scope.stopQuagga();
			})

			$scope.quagga_started = false;
			$scope.initQuagga = function() {
				if ($scope.quagga_started) $scope.stopQuagga();
				$scope.quagga_started = true;

				// Make sure, QuaggaJS draws frames an lines around possible 
				// barcodes on the live stream
				Quagga.onProcessed(function(result) {
					var drawingCtx = Quagga.canvas.ctx.overlay,
						drawingCanvas = Quagga.canvas.dom.overlay;

					if (result) {
						if (result.boxes) {
							drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
							result.boxes.filter(function(box) {
								return box !== result.box;
							}).forEach(function(box) {
								Quagga.ImageDebug.drawPath(box, {
									x: 0,
									y: 1
								}, drawingCtx, {
									color: "green",
									lineWidth: 2
								});
							});
						}

						if (result.box) {
							Quagga.ImageDebug.drawPath(result.box, {
								x: 0,
								y: 1
							}, drawingCtx, {
								color: "#00F",
								lineWidth: 2
							});
						}

						if (result.codeResult && result.codeResult.code) {
							Quagga.ImageDebug.drawPath(result.line, {
								x: 'x',
								y: 'y'
							}, drawingCtx, {
								color: 'red',
								lineWidth: 3
							});
						}
					}
				});
				Quagga.onDetected(function(data) {
					// console.log("Quagga scanned:", data);
					if (!data.codeResult.code) return;

					//debounce
					var curscan = data.codeResult.code;
					if ($scope._lastquaggascan == curscan) return;
					$scope._lastquaggascan = curscan;
					$scope.found(data.codeResult.code);
				})
				Quagga.init({
					inputStream: {
						name: "Live",
						type: "LiveStream",
						target: document.querySelector('#interactive') // Or '#yourElement' (optional)
					},
					decoder: {
						readers: ["code_128_reader"]
						// readers : all_readers
					}
				}, function(err) {
					if (err) {
						console.log(err);
						return
					}
					console.log("Initialization finished. Ready to start");
					Quagga.start();
				});
			}
		}
	};
}]);

app.directive('shrlist', [function() {
	return {
		restrict: 'E',
		template: '<div>' +
			'<br/>' +
			'<input class="form-control" placeholder="Search" ng-model="searchText"/>' +
			'<table class="table table-bordered table-striped">' +
			' 	<thead><tr>' +
			' 		<th>Name</th>' +
			' 		<th>Serial</th>' +
			' 		<th>Last-scan</th>' +
			' 		<th>Last-comment</th>' +
			' 		<th>Options</th>' +
			' 	</tr></thead>' +
			' 	<tbody>' +
			' 		<tr ng-repeat="item in ngModel|filter: searchText" ng-class="{success: item.$$justscanned, danger: !item.$$justscanned}">' +
			' 			<td class="clickable shritem" ng-click="SHR.editEntry(item)">{{NSN[item.nsn]}}</td>' +
			' 			<td>{{item.serial}}</td>' +
			' 			<td>{{item.history[item.history.length-1].date|date:\'M/d/yy h:mm:ss a\'}}</td>' +
			' 			<td>{{SHR.getLastComment(item)}}</td>' +
			' 			<td>'+
			' 				<span ng-click="SHR.moveUnknownToKnown(item)" uib-tooltip="joined my section" class="clickable glyphicon glyphicon-ok" aria-hidden="true"></span>' +
			' 				<span ng-click="SHR.moveKnownToUnknown(item)" uib-tooltip="left my section" class="clickable glyphicon glyphicon-remove" aria-hidden="true"></span>' +
			' 				<span ng-click="SHR.queueForBarCodePrint(item)" uib-tooltip="queue for barcode print" class="clickable glyphicon glyphicon-barcode" aria-hidden="true"></span>' +
			' 			</td>' +
			' 		</tr>' +
			' 	</tbody>' +
			'</table></div>',
		replace: false,
		scope: {
			ngModel: '='
		},
		controller: function($scope, SHR) {
			$scope.NSN = NSN;
			$scope.SHR = SHR;
		}
	};

}]);

app.directive('labledrow', [function() {
	return {
		restrict: 'E',
		template: '<div class="form-group row">' +
			'	<label class="form-control-label col-sm-4 col-xs-12">{{txt}}</label>' +
			'	<div class="col-sm-8 col-xs-12">' +
			'		<div ng-transclude></div>' +
			'	</div>' +
			'</div>',
		transclude: true,
		replace: true,
		scope: {
			txt: '@'
		}
	};

}]);

app.controller('inventory', function($scope, SHR) {
	$scope.NSN = NSN;
	$scope.inventory_message = ""; //user notification
	$scope.didScan = function(data) {
		var existing = SHR.findBySerial(data, $scope.not_scanned);
		var datetime = Util.getTimeStamp();
		if (!existing) {
			if (!SHR.SHR.unknown) SHR.SHR.unknown = [];

			var existingunknown = SHR.findBySerial(data, SHR.SHR.unknown);
			if (existingunknown) {
				$scope.inventory_message = "Existing unknown entry:"+data;
				existingunknown.history.push({
					date: datetime,
				});
			} else {
				$scope.inventory_message = "New unknown entry:"+data;
				var comment = "first seen";
				if($scope._lastscan) comment += " near " + $scope._lastscan;
				SHR.SHR.unknown.push({
					nsn: "unknown",
					serial: data,
					history: [{
						date: datetime,
						comment: comment
					}]
				});
			}
			$scope._lastscan = data;
			return;
		}

		$scope.inventory_message = "Update existing entry:"+data;
		existing.$$justscanned = true;
		existing.history.push({
			date: datetime,
			comment: ""
		});
		console.log("existing scanned:", existing);
		$scope._lastscan = data;
	}
});

app.controller('main', function($scope, SHR) {
	$scope.SHR = SHR;
	$scope.loadSHR = function() {
		SHR.loadSHR(function() {
			Util.safeApply($scope);
			console.log("loaded SHR:", SHR.SHR);
		});
	}
	$scope.storeSHR = SHR.storeSHR;
});
