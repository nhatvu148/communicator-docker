package Techsoft3d.Communicator;
import java.util.*;


public interface IServiceResponse {
    boolean isOk();
    String getReason();
    String getServiceId();
    Map<ServiceProtocol, String> getEndpoints();
}
