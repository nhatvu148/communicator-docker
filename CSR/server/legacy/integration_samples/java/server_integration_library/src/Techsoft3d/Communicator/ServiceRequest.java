package Techsoft3d.Communicator;

import java.util.Collections;
import java.util.List;
import java.util.ArrayList;

public class ServiceRequest {
    private ServiceClass serviceClass = ServiceClass.CSR_Session;
    private ArrayList<String> modelSearchDirectories = new ArrayList<String>();
    private String model = null;
    
    public ServiceRequest(ServiceClass serviceClass){
        this.serviceClass = serviceClass;
    }
    
    public ServiceClass getService(){
        return serviceClass;
    }
    
    public void setService(ServiceClass serviceClass){
        this.serviceClass = serviceClass;
    }
    
    public void addModelSearchDirectory(String modelSearchDirectory){
        this.modelSearchDirectories.add(modelSearchDirectory);
    }
    
    public List<String> getModelSearchDirectories(){
        return Collections.unmodifiableList(modelSearchDirectories);
    }
    
    public String GetModel(){
        return model;
    }
    
    public void SetModel(String model){
        this.model = model;
    }
}
