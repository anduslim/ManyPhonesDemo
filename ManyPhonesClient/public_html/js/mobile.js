var deviceColor = null;
var deviceNum = null;
var deviceUUID = null;
var orientationMessages = [];
var publishUpdates = false;
var UPDATE_PERIOD = 50;
var RECONNECT_TIMEOUT = 1000;
var RECONNECT_TIMEOUT_START = 1000;
var RECONNECT_TIMEOUT_MAX = 60000;
var wsQueue = [];

$(document).ready(function() {
    // Add the WebSocket connection first:
    if (window.WebSocket && window.DeviceOrientationEvent && navigator.vibrate && localStorage) {

        if(!localStorage.dUUID){
	    localStorage.dUUID = generateUUID();
	}
	
        deviceUUID = localStorage.dUUID;
	
        ws = constructWebsocket();
        window.addEventListener("deviceorientation", handleOrientation, true);
    } else {
        alert("Your Browser does not support the necessary APIs");
    }
});

function constructWebsocket() {
    if(publishUpdates){
        return;
    }
    
    while(wsQueue.length > 0){
         wsQueue.pop().close();
    }
    
    var ws = new WebSocket("ws://" + window.location.hostname + ":9999/");
    
    
    wsQueue.push(ws);
        
    ws.onopen = function() {        
        publishUpdates = true;
        
        RECONNECT_TIMEOUT = RECONNECT_TIMEOUT_START;

        $("#out").html("Connected!");
        // If we have been previously registered, reregister with same color:
        if (deviceColor) {
            ws.send("REDISCOVER," + deviceUUID + "," + deviceColor + "," + deviceNum);
        } else {
            ws.send("DISCOVER," + deviceUUID);
        }

        function pushUpdate() {
            if (orientationMessages.length > 0) {
                oM = orientationMessages.pop();
                orientationMessages = [];
                if (ws.readyState === 1 && deviceColor) {
                    ws.send("XYZ," + deviceUUID  + "," + deviceNum + "," + oM.join(","));
                }
            }
            setTimeout(pushUpdate, UPDATE_PERIOD);
        }

        pushUpdate();
    };

    // Log errors
    ws.onerror = function(error) {
        ws.close();
        publishUpdates = false;
        $("#out").html("Error, retrying...");
        RECONNECT_TIMEOUT = Math.min(RECONNECT_TIMEOUT * 2, RECONNECT_TIMEOUT_MAX);
        setTimeout(constructWebsocket, RECONNECT_TIMEOUT);
    };

    ws.onclose = function(error) {
        publishUpdates = false;
        $("#out").html("Closed, retrying...");
        RECONNECT_TIMEOUT = Math.min(RECONNECT_TIMEOUT * 2, RECONNECT_TIMEOUT_MAX);
        setTimeout(constructWebsocket, RECONNECT_TIMEOUT);
    };

    // Log messages from the server
    ws.onmessage = function(e) {
        console.log('Server: ' + e.data);
        var data = e.data.split(",");
        if (data[0] === "VIBRATE") {
            if(data[1] === "ALL" || data[1] === deviceUUID){
                navigator.vibrate(300);
            }
        } else if (data[0] === "ASSIGN" && data.length >= 4) {
            if(deviceUUID !== data[1]){
                return;
            }
            deviceNum = data[2];
            deviceColor = data[3];
            $("#colorMain").css("backgroundColor", deviceColor);
            $("#out").html(((deviceNum * 1) + 1) + "<br /><span class='advice'>Disable your screen rotation for better performance.</span>");
        } else if (data[0] === "UPDATE_PERIOD") {
            var newP = data[1] * 1;
            if(newP > 10 && newP < 5000){
                UPDATE_PERIOD = newP;
            }
        } else if (data[0] === "WHOAREYOU") {
            if (deviceColor) {
                ws.send("REDISCOVER," + deviceUUID + "," + deviceColor + "," + deviceNum);
            } else {
                ws.send("DISCOVER," + deviceUUID);
            }
        } else if(data[0] === "DISCONNECT" && (data[1] === deviceUUID || data[1] === "ALL")) {
            $("#colorMain").css("backgroundColor", "#FF0000");
            $("#out").html("You have been disconnected.\n" + data[2]);
        }
    };
}

// http://stackoverflow.com/a/8809472
function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
};


function handleOrientation(event) {
    // var absolute = event.absolute;
    var alpha = 0; //event.alpha
    var beta = event.beta;
    var gamma = event.gamma * -1;

    while(orientationMessages.length > 100){
        orientationMessages.shift();
    }

    orientationMessages.push([event.beta, event.gamma, event.alpha]);
    // $("#colorMain").transition({rotateX: beta + 'deg', rotateY: gamma + 'deg', rotateZ: alpha + 'deg'}, 0);
    // Do stuff with the new orientation data
}
