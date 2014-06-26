var connected = false;
var deviceSlots = [];
var deviceSlotsUUID = [];
var uuidToDevice = new Array();
var colorRemaining = ["#AEC6CF", "#836953", "#C23B22", "#F49AC2", "#03C03C", "#FDFD96", "#FF6961", "#CB99C9", "#B39EB5", "#966FD6", "#FFD1DC", "#DEA5A4", "#B19CD9", "#CFCFC4", "#779ECB", "#77DD77", "#FFB347"];
var deviceMax = 16;

$(document).ready(function() {
    if (window.WebSocket) {
        deviceSlots = constructDeviceDisplay(deviceMax);
        deviceSlotsUUID = []
        for (var i = 0; i < deviceSlots.length; ++i){
            deviceSlotsUUID[i] = "";
        }
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
    return $("#container").children('.figure');
}

function constructWebsocket() {
    var ws = new WebSocket("ws://" + window.location.hostname + ":9999/");
    ws.onopen = function() {
        connected = true;
        $("#out").html("Connected!");
        // We are the server!
        ws.send("REGISTER_SERVER");
        // Force everyone to re-register
        ws.send("WHOAREYOU");
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
        console.log('Server: ' + e.data);
        var data = e.data.split(",");
        if (data[0] === "DISCOVER") {
            var uuid = data[1];
        }
    };
}

