#version 100
precision mediump float;
#include "options"
uniform sampler2D u_image;
uniform vec2 u_interval;
uniform float u_weights[TC_SAMPLES],
u_opacity;
varying vec2 _k;
void
main(){
vec4 _dU;
#if TC_SAMPLES>1
vec2 _K=_k-float(TC_RADIUS)*u_interval;
_dU=vec4(0.);
for(int i=0;i<TC_SAMPLES;++i){
vec4 _bg=texture2D(u_image,_K);
_dU+=_bg*u_weights[i];
_K+=u_interval;
}
#else
_dU=texture2D(u_image,_k);
#endif
#ifdef TC_FINAL
_dU*=u_opacity;
#endif
gl_FragColor=_dU;
}
