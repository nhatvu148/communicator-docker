#!/usr/bin/env bash

/usr/bin/xvfb-run "--auto-servernum" "-s" "-screen 0 640x480x24" /opt/ts3d/bin/linux64/converter "$@"
