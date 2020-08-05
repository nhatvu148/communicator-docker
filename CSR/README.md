# CSR Viewer
The container is set up to start the SC Streaming Server, listening for connections on port `55555`. You should map a host port to this port for your container. The container is also setup to configure the SC Streaming Server to launch in CSR mode and to search for models in the `/opt/ts3d/models` folder. You should bind mount a folder containing your models to this path in the container.

## Building
Run the following command in your terminal: `docker build -t techsoft3d/communicator-csr -f csr.Dockerfile .`

## Running
Example docker run invocation:
```
docker run -p 55555:55555 --mount type=bind,source=/path/to/model/dir,target=/opt/ts3d/models  techsoft3d/communicator-csr --id <your id> --license '<your licence key>'
```

You may append any additional [command line parameters](https://docs.techsoft3d.com/communicator/latest/build/prog_guide/servers/stream_cache_server/command-line-options.html) accepted by the SC Streaming Server to your docker run command.
