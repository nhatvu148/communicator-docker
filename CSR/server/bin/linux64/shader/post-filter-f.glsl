#version 100
precision mediump float;
#include "options"
#include "post-filter-h.glsl"
varying vec2 _k;
uniform sampler2D u_image;
uniform vec4 u_color;
void
main(){
gl_FragColor=TC_FILTER(texture2D(u_image,_k),u_color);
}
