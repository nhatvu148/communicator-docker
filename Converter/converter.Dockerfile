FROM ubuntu:16.04

LABEL maintainer "Tech Soft 3D <support@techsoft3d.com>"

ENV LD_LIBRARY_PATH=/opt/ts3d/bin/linux64

RUN mkdir /opt/ts3d
COPY authoring/converter/bin /opt/ts3d/bin
COPY converter-entrypoint.sh /

RUN apt-get update && apt-get -y install xvfb libglu1-mesa-dev

ENTRYPOINT ["./converter-entrypoint.sh"]
CMD []