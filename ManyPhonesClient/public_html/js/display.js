var connected = false;
var deviceSlots = new Array();
var deviceSlotsUUID = new Array();
var colorRemaining = ["#AEC6CF", "#836953", "#C23B22", "#F49AC2", "#03C03C", "#FDFD96", "#FF6961", "#CB99C9", "#B39EB5", "#966FD6", "#FFD1DC", "#DEA5A4", "#B19CD9", "#CFCFC4", "#779ECB", "#77DD77", "#FFB347"];
var deviceMaxCount = 16;
var TIMEOUT = 5000;
var UPDATE_PERIOD = 50;
var VIBRATE_AREA = 200;
var VIBRATE_CENTER = null;

var wsQueue = [];

var defaultColor = "#AAA";

$(document).ready(function() {
	if (window.WebSocket) {
		deviceSlots = constructDeviceDisplay(deviceMaxCount);
		deviceSlotsUUID = []
		for (var i = 0; i < deviceSlots.length; ++i){
			deviceSlotsUUID.push(null);
		}
		console.log(deviceSlotsUUID.length);
		console.log(deviceSlotsUUID);
		ws = constructWebsocket();
                
                $("#vibrate").css({width: VIBRATE_AREA + "px", height: VIBRATE_AREA + "px"})
                var hPos = ($(document).width() - VIBRATE_AREA)/2 + "px";
                var vPos = ($(document).height() - VIBRATE_AREA)/2 + "px";
                $("#vibrate").css({left: hPos, top: vPos});
                VIBRATE_CENTER = {left: $(document).width()/2, top: $(document).height()/2};
	} else {
		alert("Your Browser does not support the necessary APIs");
	}
});

function constructDeviceDisplay(count) {
	c = 0;
	while(++c <= count){
		$("#container").append('<div class="deviceHolder"><div class="device"><div class="figure">' + c + '</div></div></div>');
	}
	return $("#container").children(); //.children().children('.figure');
}

function normAngle(_a) {
    //console.log("In normAngle " + _a);
    while(_a <= -45){_a += 90;}
    while(_a > 45){_a -= 90;}
    //console.log("Out normAngle" + _a);
    return _a;
}

function angleToCoord(angle, coordMax){
    var divRad = 50;
    angle = normAngle(angle);
    return ((angle + 45) / 90 * (coordMax - divRad * 2));
}

function hittest(jDOM){
    jO1 = jDOM.offset();
    jO1.left += jDOM.width()/2;
    jO1.top += jDOM.height()/2;
    return Math.pow(jO1.left - VIBRATE_CENTER.left, 2) + Math.pow(jO1.top - VIBRATE_CENTER.top, 2) < Math.pow(VIBRATE_AREA/2, 2);
}

function constructWebsocket() {
	var ws = new WebSocket("ws://" + window.location.hostname + ":9999/");
	ws.onopen = function() {
		connected = true;
                while(wsQueue.length > 0){
                    wsQueue.pop().close();
                }
                wsQueue.push(ws);
                
		$("#out").html("Connected!");
		// We are the server!
		ws.send("REGISTER_SERVER");
		// Force everyone to re-register:
		ws.send("WHOAREYOU");
		// Change the update period:
		ws.send("UPDATE_PERIOD," + UPDATE_PERIOD);

		$("#vibrate").click(function(){
			ws.send("VIBRATE,ALL");
		})

		function pruneDevices() {
			var nowTime = (new Date()).getTime();
			// console.log(deviceSlotsUUID);
			for(var i = 0; i < deviceSlotsUUID.length; ++i) {
				if(deviceSlotsUUID[i] != null){
					desc = deviceSlotsUUID[i];
					// console.log("Device " + i + " last access " + (nowTime - desc["lastaccess"]));
					if(nowTime - desc["lastaccess"] > TIMEOUT){
						deviceSlotsUUID[i] = null;
                                                console.log("Pruning " + i + " last access " + (nowTime - desc["lastaccess"]));
						ws.send("DISCONNECT," + desc["uuid"] + ",Timeout");
                                                $(desc["dom"]).css("display", "none");
                                                $(desc["dom"]).children().children().css("backgroundColor", defaultColor);
					}
				}
			}
			setTimeout(pruneDevices, TIMEOUT);
		}

		pruneDevices();
	};

	// Log errors
	ws.onerror = function(error) {
		connected = false;
		ws.close();
		$("#out").html("Error, retrying...");
		constructWebsocket(); // Reopen connection
	};

	// Log messages from the server
	ws.onmessage = function(e) {
		//console.log('Server: ' + e.data);
		var data = e.data.split(",");
		if (data[0] === "DISCOVER") {
			var uuid = data[1];

			// Find it a color and a number:
			var deviceColor = colorRemaining[Math.floor(Math.random() * colorRemaining.length)];
			var i = 0;
			for(i = 0; i < deviceSlotsUUID.length; ++i){
				if(deviceSlotsUUID[i] === null){
					break;
				} else if(deviceSlotsUUID[i]["uuid"] == uuid){
					deviceColor = deviceSlotsUUID[i]["color"];
					break;
				}
			}
			
			if(i == deviceSlotsUUID.length){
				ws.send("DISCONNECT," + uuid + ",No empty slots on the server.");
				return;
			}
			var deviceNum = i;

			console.log("Assigning " + uuid + " to " + i);
			
			// Create the device metadata struct:
			deviceDescriptor = new Object();
			deviceDescriptor["color"] = deviceColor;
			deviceDescriptor["uuid"] = uuid;
			deviceDescriptor["num"] = deviceNum;
			deviceDescriptor["dom"] = deviceSlots[deviceNum];
			deviceDescriptor["lastaccess"] = new Date();
			deviceSlotsUUID[deviceNum] = deviceDescriptor;
			
			// Change the background color of the appropriate box:
			$(deviceDescriptor["dom"]).css("display", "table-cell");
                        $(deviceDescriptor["dom"]).children().children().css("backgroundColor", deviceColor);
                        
			// Notify the device of its status:
			ws.send("ASSIGN," + uuid + "," + deviceNum + "," + deviceColor);
		ws.send("UPDATE_PERIOD," + UPDATE_PERIOD);
		} else if (data[0] === "REDISCOVER") {
			var deviceUUID = data[1];
			var deviceColor = data[2];
			var deviceNum = data[3];

			// Add them to the device table, if there is no conflict:
			if(deviceNum > deviceSlotsUUID.length || deviceNum < 0){
				ws.send("DISCONNECT," + deviceUUID + ",Incorrect device parameters.");
				return;
			} 
			if (deviceSlotsUUID[deviceNum] == null || deviceSlotsUUID[deviceNum]["uuid"] == deviceUUID){
				console.log("Reassigning " + deviceUUID + " to " + deviceNum);
				// Create the device metadata struct:
				deviceDescriptor = new Object();
				deviceDescriptor["color"] = deviceColor;
				deviceDescriptor["uuid"] = deviceUUID;
				deviceDescriptor["num"] = deviceNum;
				deviceDescriptor["dom"] = deviceSlots[deviceNum];
				deviceDescriptor["lastaccess"] = (new Date()).getTime();
				deviceSlotsUUID[deviceNum] = deviceDescriptor;
				
				// Change the background color of the appropriate box:
				$(deviceDescriptor["dom"]).css("display", "table-cell");
                                $(deviceDescriptor["dom"]).children().children().css("backgroundColor", deviceColor);
			} else {
				ws.send("DISCONNECT," + deviceUUID + ",Another device is using your old slot. Refresh to try again.");
				return;
			}
		} else if (data[0] === "XYZ") {
				var deviceUUID = data[1];
				var deviceNum = data[2] * 1;
				
				if(deviceSlotsUUID[deviceNum]["uuid"] === deviceUUID){
					device = deviceSlotsUUID[deviceNum];
					device["lastaccess"] = (new Date()).getTime();
					//$(device["dom"]).children().children().transition({rotateX: -1 * normAngle(data[3]) + 'deg', rotateY: -1 * normAngle(1 * data[4]) + 'deg'}, 0);
                                        $(device["dom"]).children().children().css({rotateX: normAngle(-1 * data[3]) + 'deg', rotateY: -1 * normAngle(1 * data[4]) + 'deg'});
                                        $(device["dom"]).transition({top: angleToCoord(-1 * data[3], $(document).height())  + 'px', left: angleToCoord(1 * data[4], $(document).width()) + 'px'}, 0);
                                        
                                        // If device position intersects the vibrate box:
                                        if(hittest($(device["dom"]))){
                                            ws.send("VIBRATE," + device["uuid"]);
                                        }
                                } else {
					ws.send("DISCONNECT," + deviceUUID + ",You are unknown to the server. Refresh to request a slot.");
					return;
				}
		} else if (data[0] === "DISCONNECT") {
			connected = false;
			ws.close();
			alert("Disconnected.")
		}
	};
}

