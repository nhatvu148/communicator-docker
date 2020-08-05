
package Techsoft3d.Communicator;

import Techsoft3d.Communicator.*;


public class ServerIntegrationApp {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
       String endpoint = "http://192.168.9.39:11182";
       ServiceBroker serviceBroker = new ServiceBroker(endpoint);
       
       ServiceRequest serviceRequest = new ServiceRequest(ServiceClass.CSR_Session);
       serviceRequest.addModelSearchDirectory("C:/communicator/models3");
       serviceRequest.addModelSearchDirectory("C:/communicator/models4");
       IServiceResponse response = serviceBroker.request(serviceRequest);
       
       if (response.isOk()){
           ServiceProtocol serviceProtocol = response.getEndpoints().containsKey(ServiceProtocol.WS) ? ServiceProtocol.WS : ServiceProtocol.WSS;
           String clientEndpoint = response.getEndpoints().get(serviceProtocol);
           System.out.println(String.format("Client Session %s started at: %s", response.getServiceId(), clientEndpoint));
       }
       else{
           System.out.println("Unable to start client session: " + response.getReason());
       }
    }
}
