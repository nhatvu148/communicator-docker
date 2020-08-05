#!/usr/bin/env bash

/opt/ts3d/bin/linux64/ts3d_sc_server --csr true --sc-port 55555 --model-search-directories /opt/ts3d/models --workspace-dir /opt/ts3d/workspace "$@"