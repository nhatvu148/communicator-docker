#version 100
precision highp float;
#include "options"
#include "encode-float-h.glsl"
uniform sampler2D u_texture;
#define _ew(_K) _L(texture2D(u_texture,_K))
#include "post-edgedetection-h.glsl"
