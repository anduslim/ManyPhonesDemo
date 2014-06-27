/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package demo.manyphones;

import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.Optional;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

/**
 *
 * @author user
 */
public class WSServer extends WebSocketServer {

    Optional<WebSocket> _display = Optional.empty();

    public WSServer(int port) throws UnknownHostException {
        super(new InetSocketAddress(port));
    }

    @Override
    public void onOpen(WebSocket ws, ClientHandshake ch) {
        System.out.println("onOpen\t" + ch.getResourceDescriptor());
    }

    @Override
    public void onClose(WebSocket ws, int i, String reason, boolean remote) {
        System.out.println("onClose\t" + reason);
    }

    @Override
    public void onMessage(WebSocket ws, String string) {
        System.out.println("Message\t" + ws.getRemoteSocketAddress() + "\t" + string);
        if (string.startsWith("REGISTER_SERVER")) {
            if(_display.isPresent()){
                System.err.println("Removing old Display: " + ws.getRemoteSocketAddress().toString());
                _display.get().send("DISCONNECT,ALL,Replaced by new Server");
            }
            _display = Optional.of(ws);
            System.err.println("New Display: " + ws.getRemoteSocketAddress().toString());
        } else if (_display.isPresent()) {
            if (ws == _display.get()) {
                // From the display server, send to everyone:
                System.err.println("Server Out: " + string);
                sendAllBut(string, ws);
            } else {
                // From a client, forward it to the display server:
                System.err.println("Server In: " + string);
                _display.get().send(string);
            }
        }
    }

    @Override
    public void onError(WebSocket ws, Exception excptn) {
        if (ws == null) {
            // Not attributable to a specific socket
            System.out.println(excptn.getMessage());
        } else {
            System.out.println(excptn.getMessage());
        }
    }

    void sendAllBut(String in, WebSocket notSend) {
        for (WebSocket c : this.connections()) {
            if (c != notSend) {
                c.send(in);
            }
        }
    }

    void sendAll(String in) {
        sendAllBut(in, null);
    }

}
