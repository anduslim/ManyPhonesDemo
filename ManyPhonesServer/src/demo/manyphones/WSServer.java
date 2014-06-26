/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package demo.manyphones;

import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

/**
 *
 * @author user
 */
public class WSServer extends WebSocketServer {

    
    
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

    void sendAll(String in) {
        for(WebSocket c : this.connections()){
            c.send(in);
        }
    }

}
