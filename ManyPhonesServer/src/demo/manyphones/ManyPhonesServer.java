/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package demo.manyphones;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 *
 * @author user
 */
public class ManyPhonesServer {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        try {
            WSServer _server = new WSServer(9999);
            _server.start();
            BufferedReader sysin = new BufferedReader(new InputStreamReader(System.in));
            while (true) {
                String in = sysin.readLine();
                if (in.equals("quit")) {
                    _server.sendAll("DISCONNECT");
                    _server.stop();
                    break;
                }
            }
        } catch (IOException | InterruptedException ex) {
            ex.printStackTrace();
        }
    }

}
