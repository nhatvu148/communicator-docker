FROM nvidia/opengl:1.1-glvnd-runtime-ubuntu16.04

LABEL maintainer "Tech Soft 3D <support@techsoft3d.com>"

ENV LD_LIBRARY_PATH=/opt/ts3d/bin/linux64
EXPOSE 55555

RUN mkdir /opt/ts3d && mkdir /opt/ts3d/models && mkdir /opt/ts3d/workspace
COPY server/bin /opt/ts3d/bin
COPY ssr-entrypoint.sh /

ENTRYPOINT ["./ssr-entrypoint.sh"]
CMD []