# HOOPS Converter
The container is setup to run HOOPS Converter via [xvfb](https://en.wikipedia.org/wiki/Xvfb) and provide easy conversions out of the box. To use this container, you will need to bind mount input and output directories. Paths in the command line invocation should be valid for the paths inside the container.

## Building
Run the following command in your terminal: `docker build -t techsoft3d/communicator-converter -f converter.Dockerfile .`

## Running
Example docker run invocation:
```
docker run --mount type=bind,source=/path/to/host/inputfiles,target=/opt/ts3d/cadfiles --mount type=bind,source=/path/to/host/outputfiles,target=/opt/ts3d/output techsoft3d/communicator-converter --input /opt/ts3d/cadfiles/input_cad_file --output_sc /opt/ts3d/output/output_sc_model --sc_create_scz 1 --sc_compress_scz 0 --output_png /opt/ts3d/output/output.png --license '<your license key>
```

You may append any additional [command line parameters](https://docs.techsoft3d.com/communicator/latest/build/authoring-command-line-options.html) accepted by HOOPS Converter to your docker run command.