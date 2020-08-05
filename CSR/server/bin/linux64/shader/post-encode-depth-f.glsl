#version 100
precision highp float;
#include "encode-float-h.glsl"
varying vec2 _k;
uniform highp sampler2D u_texture;
void
main(){
gl_FragColor=_ee(texture2D(u_texture,_k).r);
}
