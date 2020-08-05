
package Techsoft3d.Communicator;

import java.util.*;


class ServiceResponse implements IServiceResponse{
    private boolean isOk = false;
    private String reason;
    private String serviceId;
    private HashMap<ServiceProtocol, String> endpoints = new HashMap<>();
    
    @Override
    public boolean isOk(){
        return isOk;
    }
    
    public void setIsOk(boolean isOk){
        this.isOk = isOk;
    }
    
    @Override
    public String getReason(){
        return reason;
    }
    
    public void setReason(String reason){
        this.reason = reason;
    }
    
    @Override
    public String getServiceId(){
        return serviceId;
    }
    
    public void setServiceId(String serviceId){
        this.serviceId = serviceId;
    }
    
    @Override
    public Map<ServiceProtocol, String> getEndpoints(){
        return Collections.unmodifiableMap(endpoints);
    }
    
    public HashMap<ServiceProtocol, String> getEndpointData(){
        return endpoints;
    }
}
