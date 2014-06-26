var deviceColor = null;
var deviceNum = null;
var deviceUUID = null;
var orientationMessages = [];
var publishUpdates = true;
var UPDATE_PERIOD = 1000;

$(document).ready(function() {
    deviceUUID = generateUUID();
    // Add the WebSocket connection first:
    if (window.WebSocket && window.DeviceOrientationEvent && navigator.vibrate) {
        ws = constructWebsocket();
        window.addEventListener("deviceorientation", handleOrientation, true);
    } else {
        alert("Your Browser does not support the necessary APIs");
    }
});

function constructWebsocket() {
    var ws = new WebSocket("ws://" + window.location.hostname + ":9999/");
    ws.onopen = function() {
        publishUpdates = true;
        $("#out").html("Connected!");
        // If we have been previously registered, reregister with same color:
        if (deviceColor) {
            ws.send("REDISCOVER," + deviceUUID + "," + deviceColor);
        } else {
            ws.send("DISCOVER," + deviceUUID);
        }

        function pushUpdate() {
            if (orientationMessages.length > 0) {
                oM = orientationMessages.pop();
                orientationMessages = [];
                if (ws.readyState === 1 && deviceColor) {
                    ws.send("XYZ," + deviceUUID + "," + oM.join(","));
                }
            }
            setTimeout(pushUpdate, UPDATE_PERIOD);
        }

        pushUpdate();
    };

    // Log errors
    ws.onerror = function(error) {
        ws.close();
        $("#out").html("Error, retrying...");
        constructWebsocket(); // Reopen connection
    };

    // Log messages from the server
    ws.onmessage = function(e) {
        console.log('Server: ' + e.data);
        var data = e.data.split(",");
        if (data[0] === "VIBRATE") {
            navigator.vibrate([300, 300, 300, 300, 300]);
        } else if (data[0] === "ASSIGN" && data.length >= 3) {
            deviceNum = data[1];
            deviceColor = data[2];
            $("#colorMain").css("backgroundColor", deviceColor);
            $("#out").html(deviceNum);
        } else if (data[0] === "UPDATE_PERIOD") {
            var newP = data[1] * 1;
            if(newP > 50 && newP < 5000){
                UPDATE_PERIOD = newP;
            }
        } else if (data[0] === "WHOAREYOU") {
            ws.send("REDISCOVER," + deviceUUID + "," + deviceColor);
        } else if(data[0] === "DISCONNECT") {
            $("#colorMain").css("backgroundColor", "#FF0000");
            $("#out").html("You have been disconnected.\n" + data[1]);
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
    var alpha = event.alpha * -1;
    var beta = event.beta * -1;
    var gamma = event.gamma * -1;

    orientationMessages.push([beta, gamma, alpha]);

    $("#colorMain").transition({rotateX: beta + 'deg', rotateY: gamma + 'deg', rotateZ: alpha + 'deg'}, 0);
    // Do stuff with the new orientation data
}
