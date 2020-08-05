# SSR Viewer
The container is set up to start the SC Streaming Server, listening for connections on port `55555`. You should map a host port to this port for your container. The container is also setup to configure the SC Streaming Server to launch in SSR mode and to search for models in the `/opt/ts3d/models` folder. You should bind mount a folder containing your models to this path in the container. 

## Additional Configuration
You will need to install docker and the [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-docker).

- Ensure that you have a recent NVIDIA driver that supports GLVND and EGL 1.5. NVIDIA 430+ is sufficient.
- Ensure that you can run GPU-enabled containers by using the following command: `docker run -it --gpus all nvidia/opengl:base nvidia-smi`
- If everything is working correctly, you should see diagnostic driver output.  
   _Note:_ GPU processes running on the host will not be reflected on the output from within the container.

## Building
Run the following command in your terminal: `docker build -t techsoft3d/communicator-ssr -f ssr.Dockerfile .`

## Running
Example docker run invocation:
```
docker run --gpus all -p 55555:55555 --mount type=bind,source=/path/to/model/dir,target=/opt/ts3d/models  techsoft3d/communicator-ssr --id <your id> --license '<your licence key>'
```

You may append any additional [command-line parameters](https://docs.techsoft3d.com/communicator/latest/build/api_ref/data_import/converter-command-line-options.html) accepted by the SC Streaming Server to your docker run command.
