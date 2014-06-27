var connected = false;
var deviceSlots = new Array();
var deviceSlotsUUID = new Array();
var colorRemaining = ["#AEC6CF", "#836953", "#C23B22", "#F49AC2", "#03C03C", "#FDFD96", "#FF6961", "#CB99C9", "#B39EB5", "#966FD6", "#FFD1DC", "#DEA5A4", "#B19CD9", "#CFCFC4", "#779ECB", "#77DD77", "#FFB347"];
var deviceMaxCount = 16;
var TIMEOUT = 5000;

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
    } else {
        alert("Your Browser does not support the necessary APIs");
    }
});

function constructDeviceDisplay(count) {
    c = 0;
    while(++c <= count){
        $("#container").append('<div class="deviceHolder"><div class="device"><div class="figure">' + c + '</div></div></div>');
    }
    return $("#container").children().children().children('.figure');
}

function constructWebsocket() {
    var ws = new WebSocket("ws://" + window.location.hostname + ":9999/");
    ws.onopen = function() {
        connected = true;
        $("#out").html("Connected!");
        // We are the server!
        ws.send("REGISTER_SERVER");
        // Force everyone to re-register:
        ws.send("WHOAREYOU");
        // Change the update period:
        ws.send("UPDATE_PERIOD,50");

        $("#vibrate").click(function(){
            ws.send("VIBRATE");
        })

        function pruneDevices() {
            var nowTime = (new Date()).getTime();
            console.log(deviceSlotsUUID);
            for(var i = 0; i < deviceSlotsUUID.length; ++i) {
                if(deviceSlotsUUID[i] != null){
                    desc = deviceSlotsUUID[i];
                    console.log("Device " + i + " last access " + (nowTime - desc["lastaccess"]));
                    if(nowTime - desc["lastaccess"] > TIMEOUT){
                        deviceSlotsUUID[i] = null;
                        ws.send("DISCONNECT," + desc["uuid"] + ",Timeout");
                        $(desc["dom"]).css("backgroundColor", defaultColor);
                        $(device["dom"]).transition({rotateX: '0deg', rotateY: '0deg', rotateZ: '0deg'}, 0);
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

            console.log(deviceSlotsUUID.length);

            var i = 0;
            for(i = 0; i < deviceSlotsUUID.length; ++i){
                if(deviceSlotsUUID[i] === null){
                    break;
                }
            }
            var deviceColor = colorRemaining[Math.floor(Math.random() * colorRemaining.length)];
            
            if(i == deviceSlotsUUID.length){
                ws.send("DISCONNECT," + uuid + ",No empty slots on the server.");
                return;
            }
            deviceNum = i;

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
            $(deviceDescriptor["dom"]).css("backgroundColor", deviceColor);
            // Notify the device of its status:
            ws.send("ASSIGN," + uuid + "," + deviceNum + "," + deviceColor);
        } else if (data[0] == "REDISCOVER") {
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
                $(deviceDescriptor["dom"]).css("backgroundColor", deviceColor);
            } else {
                ws.send("DISCONNECT," + deviceUUID + ",Another device is using your old slot. Refresh to try again.");
                return;
            }
        } else if (data[0] == "XYZ") {
                var deviceUUID = data[1];
                var deviceNum = data[2] * 1;
                
                if(deviceSlotsUUID[deviceNum]["uuid"] == deviceUUID){
                    device = deviceSlotsUUID[deviceNum];
                    device["lastaccess"] = (new Date()).getTime();
                    $(device["dom"]).transition({rotateX: (-1 * data[3]) + 'deg', rotateY: (1 * data[4]) + 'deg', rotateZ: data[5] + 'deg'}, 0);
                } else {
                    ws.send("DISCONNECT," + deviceUUID + ",You are unknown to the server. Refresh to request a slot.");
                    return;
                }
        } else if (data[0] == "DISCONNECT") {
            connected = false;
            ws.close();
            alert("Disconnected.")
        }
    };
}

