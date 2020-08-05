#version 100
precision mediump float;
#include "options"
uniform sampler2D u_image;
uniform vec2 u_interval;
uniform float u_weights[TC_SAMPLES];
varying vec2 _k;
void
main(){
vec2 _K=_k-float(TC_RADIUS)*u_interval;
float _cZ=0.;
for(int i=0;i<TC_SAMPLES;++i){
float _bg=texture2D(u_image,_K).a;
_cZ+=_bg*u_weights[i];
_K+=u_interval;
}
gl_FragColor=vec4(_cZ);
}
