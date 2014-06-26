/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package demo.manyphones;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.UnknownHostException;
import java.util.logging.Level;

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
                _server.sendAll(in);
                if (in.equals("exit")) {
                    _server.stop();
                    break;
                } else if (in.equals("restart")) {
                    _server.stop();
                    _server.start();
                    break;
                }
            }
        } catch (IOException | InterruptedException ex) {
            ex.printStackTrace();
        }
    }

}
