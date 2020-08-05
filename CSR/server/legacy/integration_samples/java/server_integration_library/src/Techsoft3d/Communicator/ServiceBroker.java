package Techsoft3d.Communicator;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import org.json.simple.JSONObject;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.json.simple.JSONArray;
import org.json.simple.parser.JSONParser;


/**
 *
 * @author Matthew
 */
public class ServiceBroker {
    private String endpoint;
    
    /**
     * 
     * @param endpoint URI of the service broker to communicate with
     */
    public ServiceBroker(String endpoint){
        this.endpoint = endpoint;
    }
    
    public IServiceResponse request(ServiceRequest serviceRequest){
        ServiceResponse serviceResponse = new ServiceResponse();
        String serviceRequestJson = encodeRequest(serviceRequest);

        try{
            HttpClient   httpClient    = HttpClientBuilder.create().build();
            HttpPost     post          = new HttpPost(this.endpoint);
            StringEntity postingString = new StringEntity(serviceRequestJson);
            post.setEntity(postingString);
            post.setHeader("Content-type", "application/json");
            HttpResponse  httpResponse = httpClient.execute(post);
            decodeHttpResponse(httpResponse, serviceResponse);
        }
        catch (Exception e){
            serviceResponse.setIsOk(false);
            serviceResponse.setReason(e.getMessage());
        }
        
        return serviceResponse;
    }
    
    public String getEndpoint(){
        return this.endpoint;
    }
    
    public void setEndpoint(String endpoint){
        this.endpoint = endpoint;
    }
    
    private String encodeRequest(ServiceRequest serviceRequest){
      JSONObject obj = new JSONObject();
      

      if (serviceRequest.getService() == ServiceClass.CSR_Session)
          obj.put("class", "csr_session");
      else 
          obj.put("class", "ssr_session");
      
      JSONObject params = new JSONObject();
      
      List<String> modelSearchDirectories = serviceRequest.getModelSearchDirectories();
      if (modelSearchDirectories.size() > 0){
          JSONArray directoryArray = new JSONArray();
          
          for (String directory : modelSearchDirectories){
              directoryArray.add(directory);
          }
          
          String model = serviceRequest.GetModel();
          if (model != null){
              params.put("model", model);
          }
          
          params.put("modelSearchDirectories", directoryArray);
      }
      
      obj.put("params", params);

      return obj.toString();
    }
    
    private void decodeHttpResponse(HttpResponse  httpResponse, ServiceResponse serviceResponse){
        try{
            String jsonResponse = EntityUtils.toString(httpResponse.getEntity());
            JSONParser parser = new JSONParser();
            
            JSONObject responseObject = (JSONObject)parser.parse(jsonResponse);
            
            String result = (String)responseObject.get("result");
            serviceResponse.setIsOk(result.equals("ok"));
            
            if (serviceResponse.isOk()){
                serviceResponse.setServiceId((String)responseObject.get("serviceId"));
                
                JSONObject endpoints = (JSONObject)responseObject.get("endpoints");
                if (endpoints != null){
                    Iterator<String> it = endpoints.keySet().iterator();
                    HashMap<ServiceProtocol, String> endpointData = serviceResponse.getEndpointData();
                    
                    while (it.hasNext()){
                        String protocolName = it.next();
                        String protocolValue = (String)endpoints.get(protocolName);
                        ServiceProtocol protocol = ServiceProtocol.valueOf(protocolName.toUpperCase());
                        endpointData.put(protocol, protocolValue);
                    }
                }
            }
            else{
                serviceResponse.setReason((String)responseObject.get("reason"));
            }
        }
        catch (Exception e){
            serviceResponse.setIsOk(false);
            serviceResponse.setReason(e.getMessage());
        }
    }
}
